import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.assessment import Assessment
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAttemptAnswer
from app.models.user import User
from app.schemas.quiz import (
    QuizClientResponse,
    QuizQuestionClientResponse,
    QuestionOptionItem,
    QuizSubmitRequest,
    QuizAttemptResultResponse,
    QuestionResultResponse
)

# Standard contextual templates for software skills
SKILL_QUESTION_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "python": {
        "mcq": {
            "question": "In Python, which mechanism is best suited for managing resource cleanup (such as database connections or file handles) even when exceptions occur?",
            "options": [
                {"key": "A", "text": "Global variables with manual deletion"},
                {"key": "B", "text": "Context managers implementing __enter__ and __exit__ (or using the 'with' statement)"},
                {"key": "C", "text": "Recursive function calls with tail-call optimization"},
                {"key": "D", "text": "Thread pooling with daemon mode"}
            ],
            "correct": "B",
            "explanation": "Context managers using the 'with' statement guarantee cleanup in __exit__ even if an exception is raised within the block."
        },
        "written": {
            "question": "Explain the difference between concurrency and parallelism in Python, and how the Global Interpreter Lock (GIL) affects CPU-bound vs I/O-bound tasks.",
            "rubric": {
                "core_concepts": ["gil", "cpu-bound", "i/o-bound", "threading", "multiprocessing", "asyncio"],
                "criteria": "Candidate should explain that the GIL allows only one thread to execute Python bytecode at a time, making multiprocessing better for CPU-bound tasks and asyncio/threading suitable for I/O-bound tasks."
            }
        }
    },
    "fastapi": {
        "mcq": {
            "question": "What is the primary architectural purpose of FastAPI's 'Depends()' system in route definitions?",
            "options": [
                {"key": "A", "text": "To transpile Python code to WebAssembly"},
                {"key": "B", "text": "To enable modular dependency injection for database sessions, auth, and shared logic"},
                {"key": "C", "text": "To automatically serialize NumPy arrays to HTML tables"},
                {"key": "D", "text": "To bypass ASGI request validation"}
            ],
            "correct": "B",
            "explanation": "FastAPI's Depends() system provides hierarchical dependency injection, making it easy to inject database sessions, verify JWT credentials, and share logic cleanly across endpoints."
        },
        "written": {
            "question": "Describe how you design request validation and error handling in FastAPI to ensure security and prevent unhandled 500 server crashes.",
            "rubric": {
                "core_concepts": ["pydantic", "httpexception", "status_code", "validation_error", "exception_handler"],
                "criteria": "Candidate should detail using Pydantic models for request bodies, catching domain exceptions to raise HTTPException with specific status codes, and registering custom exception handlers."
            }
        }
    },
    "postgresql": {
        "mcq": {
            "question": "In PostgreSQL, which feature should you use to optimize queries filtering by full-text search across large text documents?",
            "options": [
                {"key": "A", "text": "A standard B-tree index on the raw text column"},
                {"key": "B", "text": "GIN (Generalized Inverted Index) on a tsvector generated from the text"},
                {"key": "C", "text": "A Foreign Key constraint on every text paragraph"},
                {"key": "D", "text": "SQLite PRAGMA table_info caching"}
            ],
            "correct": "B",
            "explanation": "PostgreSQL provides full-text search with tsvector and tsquery, which is most efficiently accelerated using a GIN (Generalized Inverted Index) index."
        },
        "written": {
            "question": "How do database transactions (ACID properties) prevent race conditions in financial or multi-step database workflows in PostgreSQL?",
            "rubric": {
                "core_concepts": ["atomicity", "consistency", "isolation", "durability", "commit", "rollback", "locking"],
                "criteria": "Candidate should explain Atomicity ensuring all-or-nothing execution, Isolation levels preventing dirty or non-repeatable reads, and explicit transactions with rollback on failure."
            }
        }
    },
    "react": {
        "mcq": {
            "question": "In modern React applications, what is the best practice for managing asynchronous side effects such as fetching API data?",
            "options": [
                {"key": "A", "text": "Directly mutating DOM nodes inside the render return block"},
                {"key": "B", "text": "Using useEffect with appropriate dependency arrays or dedicated query hooks (e.g. TanStack Query / custom hooks)"},
                {"key": "C", "text": "Synchronous while-loops waiting for promises"},
                {"key": "D", "text": "Embedding API keys directly in client-side HTML tags"}
            ],
            "correct": "B",
            "explanation": "React side effects like data fetching should run inside useEffect or dedicated query libraries, preventing infinite render loops and memory leaks."
        },
        "written": {
            "question": "Explain how React's component re-rendering lifecycle works and how to prevent unnecessary renders in complex dashboards.",
            "rubric": {
                "core_concepts": ["state", "props", "usememo", "usecallback", "react.memo", "virtual dom"],
                "criteria": "Candidate should discuss state and props changes triggering renders, and using React.memo, useCallback, useMemo, or lifting state down to avoid re-rendering heavy subtrees."
            }
        }
    },
    "docker": {
        "mcq": {
            "question": "What is the primary benefit of multi-stage Docker builds for backend and frontend production images?",
            "options": [
                {"key": "A", "text": "They allow running multiple operating systems simultaneously in one container"},
                {"key": "B", "text": "They reduce the final container image size by discarding build tools, compilers, and intermediate layers"},
                {"key": "C", "text": "They eliminate the need for container networking"},
                {"key": "D", "text": "They automatically deploy containers to Kubernetes clusters"}
            ],
            "correct": "B",
            "explanation": "Multi-stage builds leave behind heavyweight compilers, SDKs, and build dependencies, producing minimal, secure production runtime images."
        },
        "written": {
            "question": "Describe how you secure Docker containers running in production environments (e.g., user privileges, secrets, network isolation).",
            "rubric": {
                "core_concepts": ["non-root", "secrets", "environment variables", "minimal base image", "read-only", "network"],
                "criteria": "Candidate should mention running as a non-root user, avoiding hardcoded secrets in Dockerfiles, using minimal base images (like Alpine), and isolating container networks."
            }
        }
    },
    "testing": {
        "mcq": {
            "question": "In automated testing with pytest, what is the primary role of fixtures?",
            "options": [
                {"key": "A", "text": "To compile Python scripts into binary executables"},
                {"key": "B", "text": "To provide reusable, modular setup and teardown contexts (like test DB sessions or mock clients) for test functions"},
                {"key": "C", "text": "To automatically deploy passing tests to production servers"},
                {"key": "D", "text": "To disable type checking in tests"}
            ],
            "correct": "B",
            "explanation": "Pytest fixtures define setup and teardown logic that can be cleanly injected into test functions, ensuring consistent state and isolated test execution."
        },
        "written": {
            "question": "Explain the difference between unit tests, integration tests, and end-to-end (E2E) tests. When is mocking external services appropriate?",
            "rubric": {
                "core_concepts": ["unit", "integration", "mock", "isolation", "external api", "e2e"],
                "criteria": "Candidate should differentiate testing single functions (unit) from testing component interactions (integration) and full flows (E2E), and highlight mocking slow, third-party, or paid APIs."
            }
        }
    }
}


def find_matching_template(skill_name: str) -> Optional[Dict[str, Any]]:
    skill_lower = skill_name.lower()
    for key, template in SKILL_QUESTION_TEMPLATES.items():
        if key in skill_lower or skill_lower in key:
            return template
    return None


def generate_personalized_quiz(db: Session, assessment: Assessment, user: User) -> Quiz:
    """
    Generate an assessment-specific skill test (5-7 questions):
    - Targeted MCQs with deterministic answer keys (protected before submission)
    - Written short-answer questions with transparent scoring rubrics
    """
    # Check if a quiz already exists for this assessment
    existing_quiz = db.query(Quiz).filter(Quiz.assessment_id == assessment.id).first()
    if existing_quiz:
        return existing_quiz

    reqs = assessment.requirements
    if not reqs:
        # Fallback requirement if none found
        reqs = []

    quiz = Quiz(
        assessment_id=assessment.id,
        user_id=user.id,
        title=f"Personalized Technical Assessment: {assessment.job.title if assessment.job else 'Software Engineer'}",
        description="Verify your demonstrated strengths and clarify unverified skill areas identified during evidence analysis."
    )
    db.add(quiz)
    db.flush()

    questions: List[QuizQuestion] = []
    order_idx = 1

    # Select representative skills from requirements
    seen_skills = set()
    selected_reqs = []
    for r in reqs:
        skill = r.normalized_skill.strip()
        if skill.lower() not in seen_skills:
            seen_skills.add(skill.lower())
            selected_reqs.append(r)

    # If no requirements, add standard foundational skills
    if not selected_reqs:
        dummy_skills = ["FastAPI", "PostgreSQL", "React", "Testing", "Docker"]
        for ds in dummy_skills:
            template = find_matching_template(ds)
            if template:
                # Add MCQ
                mcq_data = template["mcq"]
                q_mcq = QuizQuestion(
                    quiz_id=quiz.id,
                    requirement_id="REQ-GEN",
                    skill_name=ds,
                    question_type="mcq",
                    difficulty="medium",
                    question_text=mcq_data["question"],
                    options_json=json.dumps(mcq_data["options"]),
                    correct_answer=mcq_data["correct"],
                    explanation=mcq_data["explanation"],
                    points=10,
                    order_index=order_idx
                )
                questions.append(q_mcq)
                order_idx += 1

                # Add Written
                wr_data = template["written"]
                q_wr = QuizQuestion(
                    quiz_id=quiz.id,
                    requirement_id="REQ-GEN",
                    skill_name=ds,
                    question_type="written",
                    difficulty="medium",
                    question_text=wr_data["question"],
                    options_json="[]",
                    correct_answer="Written rubric evaluated",
                    scoring_rubric_json=json.dumps(wr_data["rubric"]),
                    explanation="Evaluated on conceptual correctness, technical details, and reasoning.",
                    points=15,
                    order_index=order_idx
                )
                questions.append(q_wr)
                order_idx += 1
    else:
        # Generate targeted mix of MCQ and Written based on assessment requirements
        for req in selected_reqs[:5]:
            skill = req.normalized_skill
            template = find_matching_template(skill)

            if template:
                # Add MCQ
                mcq_data = template["mcq"]
                q_mcq = QuizQuestion(
                    quiz_id=quiz.id,
                    requirement_id=req.requirement_id,
                    skill_name=skill,
                    question_type="mcq",
                    difficulty="medium",
                    question_text=mcq_data["question"],
                    options_json=json.dumps(mcq_data["options"]),
                    correct_answer=mcq_data["correct"],
                    explanation=mcq_data["explanation"],
                    points=10,
                    order_index=order_idx
                )
                questions.append(q_mcq)
                order_idx += 1

                # If requirement was unverified or partial, test with a written question
                if req.combined_status in ["partial_or_needs_review", "not_demonstrated_in_analyzed_scope"] and order_idx <= 7:
                    wr_data = template["written"]
                    q_wr = QuizQuestion(
                        quiz_id=quiz.id,
                        requirement_id=req.requirement_id,
                        skill_name=skill,
                        question_type="written",
                        difficulty="medium",
                        question_text=wr_data["question"],
                        options_json="[]",
                        correct_answer="Written rubric evaluated",
                        scoring_rubric_json=json.dumps(wr_data["rubric"]),
                        explanation="Evaluated on conceptual correctness, technical details, and reasoning.",
                        points=15,
                        order_index=order_idx
                    )
                    questions.append(q_wr)
                    order_idx += 1
            else:
                # Dynamic generic template tailored to the specific skill
                q_mcq = QuizQuestion(
                    quiz_id=quiz.id,
                    requirement_id=req.requirement_id,
                    skill_name=skill,
                    question_type="mcq",
                    difficulty="medium",
                    question_text=f"When designing scalable production systems utilizing {skill}, which architectural pattern best ensures maintainability and fault isolation?",
                    options_json=json.dumps([
                        {"key": "A", "text": "Tightly coupling data layer with UI components without abstraction"},
                        {"key": "B", "text": "Decoupled modules with explicit interfaces, automated test coverage, and clear boundary contracts"},
                        {"key": "C", "text": "Hardcoding credentials and configuration in production binaries"},
                        {"key": "D", "text": "Disabling logging and monitoring to maximize CPU throughput"}
                    ]),
                    correct_answer="B",
                    explanation=f"Clean architecture with decoupled modules and automated tests guarantees maintainability and resilience for {skill}.",
                    points=10,
                    order_index=order_idx
                )
                questions.append(q_mcq)
                order_idx += 1

                if order_idx <= 6:
                    q_wr = QuizQuestion(
                        quiz_id=quiz.id,
                        requirement_id=req.requirement_id,
                        skill_name=skill,
                        question_type="written",
                        difficulty="medium",
                        question_text=f"Explain how you would architect, test, and deploy a robust production feature using {skill}. Detail key trade-offs and error scenarios.",
                        options_json="[]",
                        correct_answer="Evaluated on architectural reasoning, testing strategy, and concrete technical trade-offs.",
                        scoring_rubric_json=json.dumps({
                            "core_concepts": [skill.lower(), "testing", "architecture", "error handling", "performance"],
                            "criteria": f"Candidate must explain concrete implementation structure, error handling, and testing strategies for {skill}."
                        }),
                        explanation=f"Demonstrates practical mastery and problem-solving reasoning in {skill}.",
                        points=15,
                        order_index=order_idx
                    )
                    questions.append(q_wr)
                    order_idx += 1

    # Ensure at least 5 questions total
    if len(questions) < 5:
        backup_template = SKILL_QUESTION_TEMPLATES["python"]
        mcq_data = backup_template["mcq"]
        q_backup = QuizQuestion(
            quiz_id=quiz.id,
            requirement_id="REQ-CORE",
            skill_name="Python / Core Engineering",
            question_type="mcq",
            difficulty="easy",
            question_text=mcq_data["question"],
            options_json=json.dumps(mcq_data["options"]),
            correct_answer=mcq_data["correct"],
            explanation=mcq_data["explanation"],
            points=10,
            order_index=order_idx
        )
        questions.append(q_backup)

    for q in questions:
        db.add(q)

    quiz.total_questions = len(questions)
    quiz.total_points = sum(q.points for q in questions)
    db.commit()
    db.refresh(quiz)
    return quiz


def format_quiz_for_candidate(quiz: Quiz) -> QuizClientResponse:
    """Format quiz for client consumption with correct answers securely hidden."""
    client_questions: List[QuizQuestionClientResponse] = []
    for q in quiz.questions:
        options: List[QuestionOptionItem] = []
        if q.question_type == "mcq":
            try:
                raw_opts = json.loads(q.options_json)
                options = [QuestionOptionItem(key=o["key"], text=o["text"]) for o in raw_opts]
            except Exception:
                options = []

        client_questions.append(
            QuizQuestionClientResponse(
                id=q.id,
                requirement_id=q.requirement_id,
                skill_name=q.skill_name,
                question_type=q.question_type,
                difficulty=q.difficulty,
                question_text=q.question_text,
                options=options,
                points=q.points,
                order_index=q.order_index
            )
        )

    return QuizClientResponse(
        id=quiz.id,
        assessment_id=quiz.assessment_id,
        title=quiz.title,
        description=quiz.description,
        total_questions=quiz.total_questions,
        total_points=quiz.total_points,
        created_at=quiz.created_at,
        questions=client_questions
    )


def evaluate_written_answer_rubric(
    question: QuizQuestion,
    user_answer: str
) -> Dict[str, Any]:
    """
    Transparent rubric evaluation for written answers:
    - Conceptual correctness
    - Technical details
    - Reasoning and clarity
    - Omissions / Missing concepts
    """
    clean_ans = user_answer.strip()
    max_pts = float(question.points)

    if not clean_ans or len(clean_ans) < 15:
        return {
            "score_awarded": 0.0,
            "max_points": max_pts,
            "is_correct": False,
            "feedback": "Answer was too brief or empty to assess technical proficiency.",
            "rubric_breakdown": {
                "conceptual_correctness": 0.0,
                "technical_depth": 0.0,
                "reasoning_clarity": 0.0,
                "identified_concepts": [],
                "missing_concepts": ["core technical explanation", "concrete implementation details"]
            }
        }

    # Load rubric
    rubric = {}
    try:
        rubric = json.loads(question.scoring_rubric_json)
    except Exception:
        pass

    expected_concepts = rubric.get("core_concepts", [question.skill_name.lower()])
    ans_lower = clean_ans.lower()

    matched_concepts = [c for c in expected_concepts if c in ans_lower]
    missing_concepts = [c for c in expected_concepts if c not in ans_lower]

    # Reasoning indicators
    reasoning_terms = ["because", "since", "prevents", "ensures", "trade-off", "performance", "pattern", "isolation", "transaction", "scale", "latency", "maintainability"]
    reasoning_count = sum(1 for term in reasoning_terms if term in ans_lower)

    # Word count and elaboration check
    words = clean_ans.split()
    word_count = len(words)

    # Calculate rubric components
    # 1. Concept Coverage (up to 40% of points)
    concept_ratio = len(matched_concepts) / max(len(expected_concepts), 1)
    concept_score = concept_ratio * (max_pts * 0.4)

    # 2. Technical Elaboration (up to 30% of points)
    if word_count >= 50:
        tech_score = max_pts * 0.3
    elif word_count >= 25:
        tech_score = max_pts * 0.2
    else:
        tech_score = max_pts * 0.1

    # 3. Reasoning & Architectural Clarity (up to 30% of points)
    if reasoning_count >= 2:
        reason_score = max_pts * 0.3
    elif reasoning_count >= 1:
        reason_score = max_pts * 0.2
    else:
        reason_score = max_pts * 0.1

    total_awarded = round(min(concept_score + tech_score + reason_score, max_pts), 1)
    is_satisfactory = total_awarded >= (max_pts * 0.6)

    feedback_parts = []
    if matched_concepts:
        feedback_parts.append(f"Demonstrated solid grasp of key concepts: {', '.join(matched_concepts)}.")
    if missing_concepts:
        feedback_parts.append(f"Consider clarifying details regarding: {', '.join(missing_concepts)}.")
    if reasoning_count >= 1:
        feedback_parts.append("Good architectural reasoning explaining why these choices matter.")
    else:
        feedback_parts.append("Deepen your answer by explaining trade-offs and error-handling mechanisms.")

    return {
        "score_awarded": total_awarded,
        "max_points": max_pts,
        "is_correct": is_satisfactory,
        "feedback": " ".join(feedback_parts),
        "rubric_breakdown": {
            "conceptual_correctness": round(concept_score, 1),
            "technical_depth": round(tech_score, 1),
            "reasoning_clarity": round(reason_score, 1),
            "identified_concepts": matched_concepts,
            "missing_concepts": missing_concepts
        }
    }


def grade_and_submit_quiz(
    db: Session,
    quiz_id: str,
    assessment_id: str,
    user_id: str,
    submission: QuizSubmitRequest
) -> QuizAttemptResultResponse:
    """Deterministic MCQ scoring and transparent rubric written evaluation."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == user_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    answers_map = {a.question_id: a.answer_text.strip() for a in submission.answers}

    total_score = 0.0
    max_score = 0.0
    mcq_score = 0.0
    written_score = 0.0

    graded_answers: List[QuestionResultResponse] = []
    attempt_answers_db: List[QuizAttemptAnswer] = []
    skill_performance: Dict[str, Dict[str, float]] = {}

    for q in quiz.questions:
        user_ans = answers_map.get(q.id, "")
        max_score += float(q.points)
        skill = q.skill_name
        if skill not in skill_performance:
            skill_performance[skill] = {"awarded": 0.0, "max": 0.0}
        skill_performance[skill]["max"] += float(q.points)

        if q.question_type == "mcq":
            clean_user = user_ans.upper()
            correct_key = q.correct_answer.strip().upper()

            # Check if user passed letter ("B") or full option text matching
            is_correct = (clean_user == correct_key)
            awarded = float(q.points) if is_correct else 0.0
            mcq_score += awarded
            total_score += awarded
            skill_performance[skill]["awarded"] += awarded

            feedback = f"Correct answer is {correct_key}." if is_correct else f"Incorrect. Correct answer is {correct_key}."

            res_item = QuestionResultResponse(
                question_id=q.id,
                requirement_id=q.requirement_id,
                skill_name=q.skill_name,
                question_type="mcq",
                question_text=q.question_text,
                user_answer=user_ans,
                correct_answer=correct_key,
                is_correct=is_correct,
                score_awarded=awarded,
                max_points=float(q.points),
                explanation=q.explanation,
                evaluation_feedback=feedback,
                rubric_breakdown={"deterministic_mcq": True}
            )
            graded_answers.append(res_item)

            attempt_ans = QuizAttemptAnswer(
                question_id=q.id,
                user_answer=user_ans,
                is_correct=is_correct,
                score_awarded=awarded,
                max_points=float(q.points),
                evaluation_feedback=feedback,
                rubric_breakdown_json=json.dumps({"deterministic_mcq": True})
            )
            attempt_answers_db.append(attempt_ans)

        else:
            # Written question rubric evaluation
            eval_result = evaluate_written_answer_rubric(q, user_ans)
            awarded = eval_result["score_awarded"]
            written_score += awarded
            total_score += awarded
            skill_performance[skill]["awarded"] += awarded

            res_item = QuestionResultResponse(
                question_id=q.id,
                requirement_id=q.requirement_id,
                skill_name=q.skill_name,
                question_type="written",
                question_text=q.question_text,
                user_answer=user_ans,
                correct_answer=q.correct_answer,
                is_correct=eval_result["is_correct"],
                score_awarded=awarded,
                max_points=float(q.points),
                explanation=q.explanation,
                evaluation_feedback=eval_result["feedback"],
                rubric_breakdown=eval_result["rubric_breakdown"]
            )
            graded_answers.append(res_item)

            attempt_ans = QuizAttemptAnswer(
                question_id=q.id,
                user_answer=user_ans,
                is_correct=eval_result["is_correct"],
                score_awarded=awarded,
                max_points=float(q.points),
                evaluation_feedback=eval_result["feedback"],
                rubric_breakdown_json=json.dumps(eval_result["rubric_breakdown"])
            )
            attempt_answers_db.append(attempt_ans)

    percentage = round((total_score / max_score) * 100.0, 1) if max_score > 0 else 0.0
    passed = percentage >= 70.0

    # Skill observations summary
    observations = []
    recommended_steps = []
    for skill, scores in skill_performance.items():
        pct = round((scores["awarded"] / scores["max"]) * 100.0, 1) if scores["max"] > 0 else 0.0
        status_label = "Strong Concept Mastery" if pct >= 80 else ("Competent with Minor Gaps" if pct >= 60 else "Requires Practical Reinforcement")
        observations.append({
            "skill": skill,
            "score": round(scores["awarded"], 1),
            "max_score": round(scores["max"], 1),
            "percentage": pct,
            "status": status_label
        })
        if pct < 70:
            recommended_steps.append(f"Review core implementation patterns and documentation for {skill}.")

    if not recommended_steps:
        recommended_steps.append("Outstanding technical test performance! Continue showcasing your verified code evidence in your portfolio.")

    summary_text = (
        f"Candidate scored {total_score}/{max_score} ({percentage}%). "
        f"MCQ Performance: {mcq_score} pts; Written Technical Evaluation: {written_score} pts. "
        + ("Result demonstrates verified competency for target job requirements." if passed else "Result indicates areas where further hands-on code examples are recommended.")
    )

    # Persist attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        assessment_id=assessment_id,
        user_id=user_id,
        total_score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        mcq_score=mcq_score,
        written_score=written_score,
        feedback_summary=summary_text,
        skill_observations_json=json.dumps(observations),
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    db.flush()

    for ans in attempt_answers_db:
        ans.attempt_id = attempt.id
        db.add(ans)

    db.commit()
    db.refresh(attempt)

    return QuizAttemptResultResponse(
        id=attempt.id,
        quiz_id=quiz.id,
        assessment_id=assessment_id,
        total_score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        mcq_score=mcq_score,
        written_score=written_score,
        feedback_summary=summary_text,
        skill_observations=observations,
        submitted_at=attempt.submitted_at,
        answers=graded_answers,
        recommended_next_steps=recommended_steps
    )
