import pytest
from app.services.career_intelligence_service import (
    build_3way_alignment_matrix,
    generate_actionable_recommendations,
    map_file_evidence_findings
)


def test_build_3way_alignment_matrix_categories():
    reqs = [
        {
            "requirement_id": "REQ-1",
            "normalized_skill": "FastAPI",
            "priority_type": "required",
            "resume_status": "demonstrated",
            "repo_status": "demonstrated",
            "combined_status": "demonstrated",
            "citations": []
        },
        {
            "requirement_id": "REQ-2",
            "normalized_skill": "GraphQL",
            "priority_type": "required",
            "resume_status": "demonstrated",
            "repo_status": "not_demonstrated_in_analyzed_scope",
            "combined_status": "partial_or_needs_review",
            "citations": []
        },
        {
            "requirement_id": "REQ-3",
            "normalized_skill": "Docker",
            "priority_type": "preferred",
            "resume_status": "not_demonstrated_in_analyzed_scope",
            "repo_status": "demonstrated",
            "combined_status": "demonstrated",
            "citations": [{"is_valid": True, "file_path": "Dockerfile"}]
        },
        {
            "requirement_id": "REQ-4",
            "normalized_skill": "Kubernetes",
            "priority_type": "required",
            "resume_status": "not_demonstrated_in_analyzed_scope",
            "repo_status": "not_demonstrated_in_analyzed_scope",
            "combined_status": "not_demonstrated_in_analyzed_scope",
            "citations": []
        }
    ]

    matrix = build_3way_alignment_matrix(reqs)
    assert len(matrix) == 4
    
    assert matrix[0].alignment_category == "full_match"
    assert matrix[1].alignment_category == "unverified_resume_claim"
    assert matrix[2].alignment_category == "hidden_repo_strength"
    assert "Dockerfile" in (matrix[2].resume_action_suggestion or "")
    assert matrix[3].alignment_category == "complete_gap"


def test_generate_actionable_recommendations():
    reqs = [
        # 1 hidden repo strength -> quick win
        {
            "requirement_id": "REQ-3",
            "normalized_skill": "Docker",
            "priority_type": "preferred",
            "resume_status": "not_demonstrated_in_analyzed_scope",
            "repo_status": "demonstrated",
            "combined_status": "demonstrated",
        },
        # 1 partial -> targeted project
        {
            "requirement_id": "REQ-2",
            "normalized_skill": "PostgreSQL",
            "priority_type": "required",
            "resume_status": "demonstrated",
            "repo_status": "partial_or_needs_review",
            "combined_status": "partial_or_needs_review",
            "improvement_action": "Add migration tests."
        },
        # 1 missing required -> deep skill build
        {
            "requirement_id": "REQ-4",
            "normalized_skill": "Rust",
            "priority_type": "required",
            "resume_status": "not_demonstrated_in_analyzed_scope",
            "repo_status": "not_demonstrated_in_analyzed_scope",
            "combined_status": "not_demonstrated_in_analyzed_scope",
        }
    ]

    recs = generate_actionable_recommendations(reqs)
    assert len(recs) == 3
    # First should be quick_win
    assert recs[0].effort_category == "quick_win"
    assert len(recs[0].verification_checklist) >= 1
    # Second should be targeted_project
    assert recs[1].effort_category == "targeted_project"
    # Third should be deep_skill_build
    assert recs[2].effort_category == "deep_skill_build"


def test_map_file_evidence_findings():
    inspected_files = [
        {"path": "app/main.py"},
        {"path": "app/routes.py"},
        {"path": "README.md"}
    ]
    reqs = [
        {
            "requirement_id": "REQ-1",
            "normalized_skill": "FastAPI",
            "citations": [
                {
                    "file_path": "app/main.py",
                    "start_line": 10,
                    "end_line": 20,
                    "excerpt": "app = FastAPI()",
                    "is_valid": True
                }
            ]
        },
        {
            "requirement_id": "REQ-2",
            "normalized_skill": "Docker",
            "citations": [
                {
                    "file_path": "app/routes.py",
                    "start_line": 5,
                    "end_line": 15,
                    "excerpt": "some code",
                    "is_valid": False
                }
            ]
        }
    ]

    findings = map_file_evidence_findings(reqs, inspected_files)
    assert len(findings) == 3
    
    # Positive evidence first
    assert findings[0].file_path == "app/main.py"
    assert findings[0].finding_type == "positive_evidence"
    assert findings[0].citations_count == 1
    assert "REQ-1 (FastAPI)" in findings[0].associated_requirements

    # Partial evidence second
    assert findings[1].file_path == "app/routes.py"
    assert findings[1].finding_type == "partial_evidence"

    # Inconclusive third
    assert findings[2].file_path == "README.md"
    assert findings[2].finding_type == "inconclusive"
