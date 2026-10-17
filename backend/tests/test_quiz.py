import json
import pytest
from app.models.job import Job
from app.models.resume import Resume
from app.models.repository import Repository
from app.models.assessment import Assessment
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.services.quiz_service import (
    generate_personalized_quiz,
    format_quiz_for_candidate,
    grade_and_submit_quiz
)
from app.schemas.quiz import QuizSubmitRequest, QuestionAnswerSubmission


@pytest.fixture
def mock_assessment_data(db_session, test_user):
    """Seed prerequisite job, resume, repo, and assessment."""
    job = Job(
        user_id=test_user.id,
        source_type="pasted",
        title="Senior Python & React Engineer",
        company="ProofPath Labs",
        raw_text="Deep expertise in Python, FastAPI, PostgreSQL, and React.",
        extracted_requirements_json=json.dumps([
            {"id": "REQ-1", "normalized_skill": "Python", "priority_type": "required", "weight": 2},
            {"id": "REQ-2", "normalized_skill": "PostgreSQL", "priority_type": "required", "weight": 2},
            {"id": "REQ-3", "normalized_skill": "React", "priority_type": "preferred", "weight": 1},
        ])
    )
    db_session.add(job)

    resume = Resume(
        user_id=test_user.id,
        filename="resume.pdf",
        safe_path="/tmp/resume.pdf",
        file_size=1024,
        mime_type="application/pdf",
        extracted_text="Experienced engineer with Python, FastAPI, and React background."
    )
    db_session.add(resume)

    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/example/repo",
        owner="example",
        name="repo",
        branch="main",
        analyzed_sha="a1b2c3d4e5f67890",
        inspected_files_count=10
    )
    db_session.add(repo)
    db_session.commit()

    assessment = Assessment(
        user_id=test_user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo.id,
        status="completed",
        compatibility_score=85.0,
        provider_name="gemini",
        model_name="gemini-1.5-flash",
        summary_counts_json=json.dumps({"demonstrated": 2, "partial_or_needs_review": 1})
    )
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)
    return assessment


def test_generate_quiz_success(db_session, test_user, mock_assessment_data):
    """Test generating a personalized quiz tailored to assessment requirements."""
    quiz = generate_personalized_quiz(db_session, mock_assessment_data, test_user)
    assert quiz is not None
    assert quiz.assessment_id == mock_assessment_data.id
    assert len(quiz.questions) >= 3

    # Check question types include both MCQ and written
    types = [q.question_type for q in quiz.questions]
    assert "mcq" in types
    assert "written" in types

    # Check that each question is tied to a skill
    for q in quiz.questions:
        assert q.skill_name is not None
        assert q.question_text is not None
        if q.question_type == "mcq":
            options = json.loads(q.options_json)
            assert len(options) == 4
            assert q.correct_answer is not None


def test_client_response_protects_answer_key(db_session, test_user, mock_assessment_data):
    """Ensure candidate-facing payload hides correct answers and rubrics before submission."""
    quiz = generate_personalized_quiz(db_session, mock_assessment_data, test_user)
    client_quiz = format_quiz_for_candidate(quiz)

    assert client_quiz.id == quiz.id
    for q in client_quiz.questions:
        # Pydantic schema must have correct_answer stripped before submission
        assert not hasattr(q, "correct_answer") or getattr(q, "correct_answer", None) is None


def test_deterministic_mcq_grading(db_session, test_user, mock_assessment_data):
    """Test deterministic grading of multiple choice questions."""
    quiz = generate_personalized_quiz(db_session, mock_assessment_data, test_user)
    
    # Identify an MCQ question
    mcq_q = next(q for q in quiz.questions if q.question_type == "mcq")
    
    # Correct submission
    correct_sub = QuizSubmitRequest(
        quiz_id=quiz.id,
        answers=[
            QuestionAnswerSubmission(question_id=mcq_q.id, answer_text=mcq_q.correct_answer)
        ]
    )
    result_correct = grade_and_submit_quiz(db_session, quiz.id, mock_assessment_data.id, test_user.id, correct_sub)
    ans_correct = next(a for a in result_correct.answers if a.question_id == mcq_q.id)
    assert ans_correct.is_correct is True
    assert ans_correct.score_awarded == mcq_q.points

    # Incorrect submission
    wrong_opt = "A" if mcq_q.correct_answer != "A" else "B"
    wrong_sub = QuizSubmitRequest(
        quiz_id=quiz.id,
        answers=[
            QuestionAnswerSubmission(question_id=mcq_q.id, answer_text=wrong_opt)
        ]
    )
    result_wrong = grade_and_submit_quiz(db_session, quiz.id, mock_assessment_data.id, test_user.id, wrong_sub)
    ans_wrong = next(a for a in result_wrong.answers if a.question_id == mcq_q.id)
    assert ans_wrong.is_correct is False
    assert ans_wrong.score_awarded == 0.0


def test_written_answer_rubric_evaluation(db_session, test_user, mock_assessment_data):
    """Test written architecture answer rubric grading with concepts and constructive feedback."""
    quiz = generate_personalized_quiz(db_session, mock_assessment_data, test_user)
    written_q = next(q for q in quiz.questions if q.question_type == "written")

    # High quality answer covering conceptual depth
    thoughtful_text = (
        "We enforce foreign keys, database transactions with ACID isolation, and use an engine connection pool "
        "with connection recycling and pool_pre_ping=True. Schema evolution is managed deterministically with Alembic migrations."
    )
    sub = QuizSubmitRequest(
        quiz_id=quiz.id,
        answers=[
            QuestionAnswerSubmission(question_id=written_q.id, answer_text=thoughtful_text)
        ]
    )
    result = grade_and_submit_quiz(db_session, quiz.id, mock_assessment_data.id, test_user.id, sub)
    ans = next(a for a in result.answers if a.question_id == written_q.id)
    assert ans.score_awarded > 0
    assert ans.evaluation_feedback is not None


def test_quiz_ownership_security(db_session, mock_assessment_data, client, auth_headers, second_auth_headers):
    """Verify that a second user cannot access or submit attempts for another candidate's quiz."""
    # User 1 generates quiz
    gen_res = client.post(
        f"/api/v1/assessments/{mock_assessment_data.id}/quiz/generate",
        headers=auth_headers
    )
    assert gen_res.status_code == 200
    quiz_data = gen_res.json()

    # User 2 attempts to fetch the quiz -> should be 404
    fetch_res = client.get(
        f"/api/v1/assessments/{mock_assessment_data.id}/quiz",
        headers=second_auth_headers
    )
    assert fetch_res.status_code == 404

    # User 2 attempts to submit answers -> should be 404
    submit_res = client.post(
        f"/api/v1/assessments/{mock_assessment_data.id}/quiz/submit",
        json={"quiz_id": quiz_data["id"], "answers": []},
        headers=second_auth_headers
    )
    assert submit_res.status_code == 404
