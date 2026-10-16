from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment


class RequirementChangeItem(BaseModel):
    requirement_id: str
    normalized_skill: str
    priority_type: str
    previous_status: Optional[str] = None
    current_status: str
    transition_type: str  # "improved", "regressed", "stable", "new"
    transition_label: str
    previous_citations_count: int = 0
    current_citations_count: int = 0
    explanation: str


class AssessmentComparisonResponse(BaseModel):
    current_assessment_id: str
    previous_assessment_id: str
    job_id: str
    job_title: str
    current_created_at: str
    previous_created_at: str
    current_score: float
    previous_score: float
    score_delta: float
    current_coverage: float
    previous_coverage: float
    coverage_delta: float
    improved_count: int
    regressed_count: int
    stable_count: int
    new_count: int
    requirement_changes: List[RequirementChangeItem]
    narrative_summary: str


STATUS_RANK = {
    "demonstrated": 3,
    "partial_or_needs_review": 2,
    "not_demonstrated_in_analyzed_scope": 1,
    "unable_to_assess": 0
}


def compare_assessments(
    db: Session,
    current_assessment_id: str,
    previous_assessment_id: str,
    user_id: str
) -> AssessmentComparisonResponse:
    current = (
        db.query(Assessment)
        .filter(Assessment.id == current_assessment_id, Assessment.user_id == user_id)
        .first()
    )
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Current assessment not found."
        )

    previous = (
        db.query(Assessment)
        .filter(Assessment.id == previous_assessment_id, Assessment.user_id == user_id)
        .first()
    )
    if not previous:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison baseline assessment not found."
        )

    prev_req_map: Dict[str, RequirementAssessment] = {
        r.requirement_id: r for r in previous.requirements
    }

    changes: List[RequirementChangeItem] = []
    improved = 0
    regressed = 0
    stable = 0
    new_items = 0

    for cur_req in current.requirements:
        prev_req = prev_req_map.get(cur_req.requirement_id)
        cur_status = cur_req.combined_status
        cur_cits = len(cur_req.citations)

        if prev_req:
            prev_status = prev_req.combined_status
            prev_cits = len(prev_req.citations)
            cur_rank = STATUS_RANK.get(cur_status, 1)
            prev_rank = STATUS_RANK.get(prev_status, 1)

            if cur_rank > prev_rank:
                trans = "improved"
                label = "Evidence Improved"
                improved += 1
                explanation = f"Upgraded from '{prev_status}' to '{cur_status}' with {cur_cits} verified citations."
            elif cur_rank < prev_rank:
                trans = "regressed"
                label = "Evidence Incomplete"
                regressed += 1
                explanation = f"Previously assessed as '{prev_status}', now '{cur_status}'."
            else:
                trans = "stable"
                label = "Status Unchanged"
                stable += 1
                explanation = f"Consistent verification at '{cur_status}'."

            changes.append(
                RequirementChangeItem(
                    requirement_id=cur_req.requirement_id,
                    normalized_skill=cur_req.normalized_skill,
                    priority_type=cur_req.priority_type,
                    previous_status=prev_status,
                    current_status=cur_status,
                    transition_type=trans,
                    transition_label=label,
                    previous_citations_count=prev_cits,
                    current_citations_count=cur_cits,
                    explanation=explanation
                )
            )
        else:
            new_items += 1
            changes.append(
                RequirementChangeItem(
                    requirement_id=cur_req.requirement_id,
                    normalized_skill=cur_req.normalized_skill,
                    priority_type=cur_req.priority_type,
                    previous_status=None,
                    current_status=cur_status,
                    transition_type="new",
                    transition_label="Newly Evaluated Requirement",
                    previous_citations_count=0,
                    current_citations_count=cur_cits,
                    explanation=f"New requirement assessed at '{cur_status}'."
                )
            )

    curr_score = getattr(current, "compatibility_score", 0.0) or 0.0
    prev_score = getattr(previous, "compatibility_score", 0.0) or 0.0
    score_delta = round(curr_score - prev_score, 1)

    curr_cov = getattr(current, "evidence_coverage", 0.0) or 0.0
    prev_cov = getattr(previous, "evidence_coverage", 0.0) or 0.0
    cov_delta = round(curr_cov - prev_cov, 1)

    job_title = current.job.title if current.job else "Target Role"

    if score_delta > 0:
        narrative = f"Compatibility score increased by +{score_delta}% (from {prev_score}% to {curr_score}%). {improved} requirement(s) advanced with fresh repository or résumé evidence."
    elif score_delta < 0:
        narrative = f"Compatibility score shifted by {score_delta}% (from {prev_score}% to {curr_score}%). {regressed} requirement(s) lost citation support or scope."
    else:
        narrative = f"Compatibility score remained stable at {curr_score}%. No net status regression detected across inspected commits."

    return AssessmentComparisonResponse(
        current_assessment_id=current.id,
        previous_assessment_id=previous.id,
        job_id=current.job_id,
        job_title=job_title,
        current_created_at=current.created_at.isoformat(),
        previous_created_at=previous.created_at.isoformat(),
        current_score=curr_score,
        previous_score=prev_score,
        score_delta=score_delta,
        current_coverage=curr_cov,
        previous_coverage=prev_cov,
        coverage_delta=cov_delta,
        improved_count=improved,
        regressed_count=regressed,
        stable_count=stable,
        new_count=new_items,
        requirement_changes=changes,
        narrative_summary=narrative
    )
