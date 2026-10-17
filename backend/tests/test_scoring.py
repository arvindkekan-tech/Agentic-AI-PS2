import pytest
from app.services.scoring_service import calculate_assessment_scores, PRIORITY_WEIGHTS, STATUS_CONTRIBUTIONS


def test_calculate_scores_all_demonstrated():
    reqs = [
        {"priority_type": "required", "combined_status": "demonstrated", "repo_status": "demonstrated", "resume_status": "demonstrated"},
        {"priority_type": "preferred", "combined_status": "demonstrated", "repo_status": "demonstrated", "resume_status": "demonstrated"}
    ]
    metrics = calculate_assessment_scores(reqs)
    assert metrics.compatibility_score == 100.0
    assert metrics.evidence_coverage == 100.0
    assert metrics.evidence_match_score == 100.0
    assert metrics.resume_alignment_score == 100.0
    assert metrics.total_requirements_count == 2
    assert metrics.assessable_requirements_count == 2
    assert metrics.unassessable_requirements_count == 0


def test_calculate_scores_weighted_demonstrated_and_partial():
    # 1 required (weight 2) demonstrated (1.0 -> 2.0)
    # 1 preferred (weight 1) partial (0.5 -> 0.5)
    # Total assessable weight = 3. Combined sum = 2.5.
    # Score = 100 * (2.5 / 3) = 83.333... -> 83.3
    reqs = [
        {"priority_type": "required", "combined_status": "demonstrated", "repo_status": "demonstrated", "resume_status": "demonstrated"},
        {"priority_type": "preferred", "combined_status": "partial_or_needs_review", "repo_status": "not_demonstrated_in_analyzed_scope", "resume_status": "demonstrated"}
    ]
    metrics = calculate_assessment_scores(reqs)
    assert metrics.compatibility_score == 83.3
    assert metrics.evidence_coverage == 100.0
    # Repo: req (weight 2 * 1.0 = 2.0), pref (weight 1 * 0 = 0.0) -> 2.0 / 3 = 66.7
    assert metrics.evidence_match_score == 66.7
    # Resume: req (weight 2 * 1.0 = 2.0), pref (weight 1 * 1.0 = 1.0) -> 3.0 / 3 = 100.0
    assert metrics.resume_alignment_score == 100.0


def test_calculate_scores_unable_to_assess_excluded_from_denominator():
    # 1 required (weight 2) demonstrated
    # 1 required (weight 2) unable to assess
    # Total weight = 4. Assessable weight = 2.
    # Compatibility score = 100 * (2.0 / 2) = 100.0
    # Coverage = 100 * (2 / 4) = 50.0
    reqs = [
        {"priority_type": "required", "combined_status": "demonstrated", "repo_status": "demonstrated", "resume_status": "demonstrated"},
        {"priority_type": "required", "combined_status": "unable_to_assess", "repo_status": "unable_to_assess", "resume_status": "unable_to_assess"}
    ]
    metrics = calculate_assessment_scores(reqs)
    assert metrics.compatibility_score == 100.0
    assert metrics.evidence_coverage == 50.0
    assert metrics.assessable_requirements_count == 1
    assert metrics.unassessable_requirements_count == 1
    assert metrics.total_requirements_count == 2


def test_calculate_scores_zero_denominator_safely_handled():
    # Only unassessable requirements
    reqs = [
        {"priority_type": "required", "combined_status": "unable_to_assess", "repo_status": "unable_to_assess", "resume_status": "unable_to_assess"}
    ]
    metrics = calculate_assessment_scores(reqs)
    assert metrics.compatibility_score == 0.0
    assert metrics.evidence_coverage == 0.0
    assert metrics.assessable_requirements_count == 0
    assert metrics.unassessable_requirements_count == 1


def test_calculate_scores_empty_list():
    metrics = calculate_assessment_scores([])
    assert metrics.compatibility_score == 0.0
    assert metrics.evidence_coverage == 0.0
    assert metrics.total_requirements_count == 0
