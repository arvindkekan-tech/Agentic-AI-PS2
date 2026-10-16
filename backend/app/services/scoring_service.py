from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ScoringMetrics(BaseModel):
    compatibility_score: float = Field(..., description="Weighted compatibility percentage (0-100)")
    evidence_coverage: float = Field(..., description="Percentage of requirements assessable by available scope (0-100)")
    evidence_match_score: float = Field(..., description="Repository code-grounded match percentage (0-100)")
    resume_alignment_score: float = Field(..., description="Résumé-claimed alignment percentage (0-100)")
    scoring_version: str = "v1.0"
    total_requirements_count: int
    assessable_requirements_count: int
    unassessable_requirements_count: int
    total_weight: int
    assessable_weight: int
    demonstrated_weight: float
    partial_weight: float
    status_weights: Dict[str, float]
    priority_weights: Dict[str, int]
    methodology_notes: List[str]


STATUS_CONTRIBUTIONS: Dict[str, float] = {
    "demonstrated": 1.0,
    "partial_or_needs_review": 0.5,
    "not_demonstrated_in_analyzed_scope": 0.0,
    "unable_to_assess": 0.0,  # excluded from assessable denominator
}

PRIORITY_WEIGHTS: Dict[str, int] = {
    "required": 2,
    "preferred": 1,
}


def calculate_assessment_scores(requirements: List[Dict[str, Any]]) -> ScoringMetrics:
    """
    Calculate deterministic weighted assessment scores based on Phase 2 specifications:
    - Required weight: 2
    - Preferred weight: 1
    - Demonstrated: 1.0
    - Partial/Needs Review: 0.5
    - Not Demonstrated: 0.0
    - Unable to Assess: Excluded from assessable denominator

    Compatibility Score = 100 * sum(weight * combined_status_val) / sum(weight of assessable reqs)
    Evidence Coverage = 100 * sum(weight of assessable reqs) / sum(weight of all reqs)
    Evidence Match Score = 100 * sum(weight * repo_status_val) / sum(weight of assessable reqs)
    Resume Alignment Score = 100 * sum(weight * resume_status_val) / sum(weight of assessable reqs)
    """
    total_weight = 0
    assessable_weight = 0
    
    combined_weighted_sum = 0.0
    repo_weighted_sum = 0.0
    resume_weighted_sum = 0.0
    
    demonstrated_weight = 0.0
    partial_weight = 0.0

    total_count = len(requirements)
    assessable_count = 0
    unassessable_count = 0

    for req in requirements:
        priority = str(req.get("priority_type", "required")).lower()
        weight = PRIORITY_WEIGHTS.get(priority, 2)
        total_weight += weight

        comb_status = req.get("combined_status", "not_demonstrated_in_analyzed_scope")
        repo_status = req.get("repo_status", "not_demonstrated_in_analyzed_scope")
        resume_status = req.get("resume_status", "not_demonstrated_in_analyzed_scope")

        # Check if assessable
        is_unassessable = (
            comb_status == "unable_to_assess"
            or (repo_status == "unable_to_assess" and resume_status == "unable_to_assess")
        )

        if is_unassessable:
            unassessable_count += 1
            continue

        assessable_count += 1
        assessable_weight += weight

        comb_contrib = STATUS_CONTRIBUTIONS.get(comb_status, 0.0)
        repo_contrib = STATUS_CONTRIBUTIONS.get(repo_status, 0.0)
        resume_contrib = STATUS_CONTRIBUTIONS.get(resume_status, 0.0)

        combined_weighted_sum += weight * comb_contrib
        repo_weighted_sum += weight * repo_contrib
        resume_weighted_sum += weight * resume_contrib

        if comb_contrib == 1.0:
            demonstrated_weight += weight
        elif comb_contrib == 0.5:
            partial_weight += weight * 0.5

    # Denominator safety
    if assessable_weight > 0:
        compatibility_score = round(100.0 * (combined_weighted_sum / assessable_weight), 1)
        evidence_match_score = round(100.0 * (repo_weighted_sum / assessable_weight), 1)
        resume_alignment_score = round(100.0 * (resume_weighted_sum / assessable_weight), 1)
    else:
        compatibility_score = 0.0
        evidence_match_score = 0.0
        resume_alignment_score = 0.0

    if total_weight > 0:
        evidence_coverage = round(100.0 * (assessable_weight / total_weight), 1)
    else:
        evidence_coverage = 0.0

    notes = [
        "Compatibility Score weights 'required' requirements at 2x and 'preferred' at 1x.",
        "Demonstrated items provide 100% value, Partial items provide 50% value, and Not Demonstrated provide 0%.",
        "Requirements marked 'unable_to_assess' are excluded from the score denominator to avoid penalizing out-of-scope factors.",
        f"Evidence Coverage ({evidence_coverage}%) indicates what fraction of the job specification could be verified with current artifacts."
    ]

    return ScoringMetrics(
        compatibility_score=compatibility_score,
        evidence_coverage=evidence_coverage,
        evidence_match_score=evidence_match_score,
        resume_alignment_score=resume_alignment_score,
        scoring_version="v1.0",
        total_requirements_count=total_count,
        assessable_requirements_count=assessable_count,
        unassessable_requirements_count=unassessable_count,
        total_weight=total_weight,
        assessable_weight=assessable_weight,
        demonstrated_weight=demonstrated_weight,
        partial_weight=partial_weight,
        status_weights=STATUS_CONTRIBUTIONS,
        priority_weights=PRIORITY_WEIGHTS,
        methodology_notes=notes
    )
