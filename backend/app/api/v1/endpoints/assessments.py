import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.assessment import Assessment
from app.schemas.assessment import (
    AssessmentCreateRequest,
    AssessmentResponse,
    AssessmentDetailResponse,
    RequirementAssessmentResponse,
    CitationResponse,
    EvidenceResponse
)
from app.services.change_ledger_service import compare_assessments, AssessmentComparisonResponse
from app.api.v1.endpoints.jobs import format_job_response
from app.api.v1.endpoints.resumes import format_resume_response
from app.api.v1.endpoints.repositories import format_repo_response
from app.services.auth_service import get_current_user
from app.services.assessment_service import create_and_run_assessment
from app.models.quiz import Quiz, QuizAttempt
from app.schemas.quiz import (
    QuizClientResponse,
    QuizSubmitRequest,
    QuizAttemptResultResponse,
    QuestionResultResponse
)
from app.services.quiz_service import (
    generate_personalized_quiz,
    format_quiz_for_candidate,
    grade_and_submit_quiz
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def safe_json_loads(json_str: str, default_val):
    if not json_str:
        return default_val
    try:
        return json.loads(json_str)
    except Exception:
        return default_val


def format_assessment_summary(assessment: Assessment) -> AssessmentResponse:
    counts = safe_json_loads(assessment.summary_counts_json, {})

    return AssessmentResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        job_id=assessment.job_id,
        resume_id=assessment.resume_id,
        repository_id=assessment.repository_id,
        status=assessment.status,
        processing_status=assessment.processing_status,
        error_message=assessment.error_message,
        provider_name=assessment.provider_name,
        model_name=assessment.model_name,
        summary_counts=counts,
        compatibility_score=getattr(assessment, "compatibility_score", 0.0) or 0.0,
        evidence_coverage=getattr(assessment, "evidence_coverage", 0.0) or 0.0,
        evidence_match_score=getattr(assessment, "evidence_match_score", 0.0) or 0.0,
        resume_alignment_score=getattr(assessment, "resume_alignment_score", 0.0) or 0.0,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at
    )


def format_assessment_detail(assessment: Assessment) -> AssessmentDetailResponse:
    base = format_assessment_summary(assessment)
    
    req_responses: List[RequirementAssessmentResponse] = []
    for req in assessment.requirements:
        cit_responses = [CitationResponse.model_validate(c) for c in req.citations]
        req_responses.append(
            RequirementAssessmentResponse(
                id=req.id,
                requirement_id=req.requirement_id,
                original_wording=req.original_wording,
                normalized_skill=req.normalized_skill,
                priority_type=req.priority_type,
                weight=getattr(req, "weight", 2) or 2,
                resume_status=req.resume_status,
                resume_explanation=req.resume_explanation,
                repo_status=req.repo_status,
                repo_explanation=req.repo_explanation,
                combined_status=req.combined_status,
                combined_interpretation=req.combined_interpretation,
                limitations_note=req.limitations_note,
                improvement_action=req.improvement_action,
                citations=cit_responses
            )
        )

    job_res = format_job_response(assessment.job) if assessment.job else None
    resume_res = format_resume_response(assessment.resume) if assessment.resume else None
    repo_res = format_repo_response(assessment.repository) if assessment.repository else None

    scoring_meta = safe_json_loads(getattr(assessment, "scoring_metadata_json", "{}"), {})
    recs = safe_json_loads(getattr(assessment, "recommendations_json", "[]"), [])
    alignment_mat = safe_json_loads(getattr(assessment, "alignment_matrix_json", "[]"), [])
    file_finds = safe_json_loads(getattr(assessment, "file_findings_json", "[]"), [])

    return AssessmentDetailResponse(
        **base.model_dump(),
        job=job_res,
        resume=resume_res,
        repository=repo_res,
        requirements=req_responses,
        scoring_metadata=scoring_meta,
        recommendations=recs,
        alignment_matrix=alignment_mat,
        file_findings=file_finds
    )


@router.post("", response_model=AssessmentDetailResponse, status_code=status.HTTP_201_CREATED, summary="Create and execute an assessment")
def run_new_assessment(
    assess_in: AssessmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run an end-to-end assessment comparing:
    - Job requirements
    - Résumé text
    - Repository code evidence
    Deterministically validates all citations and persists full audit trail.
    """
    assessment = create_and_run_assessment(
        db=db,
        user=current_user,
        job_id=assess_in.job_id,
        resume_id=assess_in.resume_id,
        repository_id=assess_in.repository_id
    )
    return format_assessment_detail(assessment)


@router.get("", response_model=List[AssessmentResponse], summary="List all assessments for current user")
def list_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessments = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    return [format_assessment_summary(a) for a in assessments]


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse, summary="Get full assessment details with requirements and citations")
def get_assessment(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    return format_assessment_detail(assessment)


@router.get("/{assessment_id}/evidence", response_model=EvidenceResponse, summary="Get evidence and citations for an assessment")
def get_assessment_evidence(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    all_citations: List[CitationResponse] = []
    valid_count = 0
    for req in assessment.requirements:
        for c in req.citations:
            cit_res = CitationResponse.model_validate(c)
            all_citations.append(cit_res)
            if cit_res.is_valid:
                valid_count += 1

    analyzed_sha = assessment.repository.analyzed_sha if assessment.repository else "unknown"

    return EvidenceResponse(
        assessment_id=assessment.id,
        analyzed_sha=analyzed_sha,
        total_citations=len(all_citations),
        valid_citations_count=valid_count,
        citations=all_citations
    )


@router.get("/{assessment_id}/compare/{previous_id}", response_model=AssessmentComparisonResponse, summary="Compare two assessments (Evidence Change Ledger)")
def compare_assessment_versions(
    assessment_id: str,
    previous_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evidence Change Ledger: compares two assessment runs for the same or different commits,
    providing delta metrics, status progression matrix, and narrative explanation.
    """
    return compare_assessments(
        db=db,
        current_assessment_id=assessment_id,
        previous_assessment_id=previous_id,
        user_id=current_user.id
    )


@router.post("/{assessment_id}/quiz/generate", response_model=QuizClientResponse, summary="Generate or retrieve personalized skill test")
def get_or_generate_assessment_quiz(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate or fetch a 5-8 question personalized skill test based on the assessment's requirements,
    demonstrated code evidence, and identified gaps. Answer keys are securely hidden from candidate view.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    quiz = generate_personalized_quiz(db=db, assessment=assessment, user=current_user)
    return format_quiz_for_candidate(quiz)


@router.get("/{assessment_id}/quiz", response_model=QuizClientResponse, summary="Get personalized skill test")
def get_assessment_quiz(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    quiz = db.query(Quiz).filter(Quiz.assessment_id == assessment_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        quiz = generate_personalized_quiz(db=db, assessment=assessment, user=current_user)

    return format_quiz_for_candidate(quiz)


@router.post("/{assessment_id}/quiz/submit", response_model=QuizAttemptResultResponse, summary="Submit and score personalized skill test")
def submit_assessment_quiz(
    assessment_id: str,
    submission: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit candidate answers for deterministic MCQ grading and transparent rubric evaluation for written questions.
    Persists attempt in PostgreSQL with full audit trail and returns transparent scoring breakdown.
    """
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    return grade_and_submit_quiz(
        db=db,
        quiz_id=submission.quiz_id,
        assessment_id=assessment_id,
        user_id=current_user.id,
        submission=submission
    )


@router.get("/{assessment_id}/quiz/attempts", response_model=List[QuizAttemptResultResponse], summary="List previous test attempts for an assessment")
def list_assessment_quiz_attempts(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.assessment_id == assessment_id,
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.submitted_at.desc()).all()

    results: List[QuizAttemptResultResponse] = []
    for att in attempts:
        obs = []
        try:
            obs = json.loads(att.skill_observations_json)
        except Exception:
            pass

        answer_responses: List[QuestionResultResponse] = []
        for ans in att.answers:
            q = ans.question
            rubric = {}
            try:
                rubric = json.loads(ans.rubric_breakdown_json)
            except Exception:
                pass

            answer_responses.append(
                QuestionResultResponse(
                    question_id=ans.question_id,
                    requirement_id=q.requirement_id if q else "REQ",
                    skill_name=q.skill_name if q else "General",
                    question_type=q.question_type if q else "written",
                    question_text=q.question_text if q else "",
                    user_answer=ans.user_answer,
                    correct_answer=q.correct_answer if q else "",
                    is_correct=ans.is_correct,
                    score_awarded=ans.score_awarded,
                    max_points=ans.max_points,
                    explanation=q.explanation if q else "",
                    evaluation_feedback=ans.evaluation_feedback,
                    rubric_breakdown=rubric
                )
            )

        results.append(
            QuizAttemptResultResponse(
                id=att.id,
                quiz_id=att.quiz_id,
                assessment_id=att.assessment_id,
                total_score=att.total_score,
                max_score=att.max_score,
                percentage=att.percentage,
                passed=att.passed,
                mcq_score=att.mcq_score,
                written_score=att.written_score,
                feedback_summary=att.feedback_summary,
                skill_observations=obs,
                submitted_at=att.submitted_at,
                answers=answer_responses,
                recommended_next_steps=[]
            )
        )

    return results
