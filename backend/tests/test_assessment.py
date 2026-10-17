import json
from unittest.mock import patch
import pytest
from app.models.repository import Repository
from app.models.assessment import Assessment


@pytest.fixture
def mock_repo_record(db_session, test_user):
    meta = {
        "inspected_files": [
            {"path": "app/main.py", "size": 300, "lines_count": 8, "language": "Python"}
        ],
        "excluded_files": [],
        "coverage": {
            "inspected_files_count": 1,
            "excluded_files_count": 0,
            "total_files_count": 1,
            "inspected_lines_total": 8,
            "languages_detected": ["Python"],
            "limitations": ["Limited snapshot"]
        }
    }
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/proofpath-org/test-repo",
        owner="proofpath-org",
        name="test-repo",
        branch="main",
        analyzed_sha="f1234567890abcdef1234567890abcdef1234567",
        inspected_files_count=1,
        total_files_count=1,
        snapshot_metadata_json=json.dumps(meta)
    )
    db_session.add(repo)
    db_session.commit()
    db_session.refresh(repo)
    return repo


from app.schemas.repository import InspectedFileItem


@pytest.fixture
def mock_snapshot_data():
    return {
        "owner": "proofpath-org",
        "name": "test-repo",
        "branch": "main",
        "analyzed_sha": "f1234567890abcdef1234567890abcdef1234567",
        "repo_url": "https://github.com/proofpath-org/test-repo",
        "files": {
            "app/main.py": {
                "path": "app/main.py",
                "size": 300,
                "lines_count": 8,
                "language": "Python",
                "lines": [
                    "from fastapi import FastAPI",
                    "app = FastAPI(title='TestApp')",
                    "",
                    "@app.get('/items')",
                    "def read_items():",
                    "    return [{'id': 1, 'name': 'Item'}]",
                    "",
                    "# End of items endpoint"
                ]
            }
        },
        "inspected_files": [
            InspectedFileItem(
                path="app/main.py",
                size=300,
                lines_count=8,
                language="Python"
            )
        ],
        "excluded_files": [],
        "coverage": None
    }


def test_full_assessment_flow_deterministic(
    client,
    auth_headers,
    mock_repo_record,
    mock_snapshot_data
):
    # 1. Create Job
    job_res = client.post("/api/v1/jobs/import", headers=auth_headers, json={
        "source_type": "pasted",
        "title": "Backend Python / FastAPI Engineer",
        "company": "Tech Corp",
        "text": (
            "We are looking for a Backend Engineer.\n"
            "Requirements:\n"
            "- Strong experience developing services in Python and FastAPI.\n"
            "- Familiarity with REST API Architecture and endpoints.\n"
            "- Experience with SQL and database design.\n"
            "- Knowledge of Automated Testing is preferred.\n"
        )
    })
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 2. Upload Résumé
    from tests.test_resumes import create_sample_docx_bytes
    resume_bytes = create_sample_docx_bytes()
    resume_res = client.post("/api/v1/resumes", headers=auth_headers, files={
        "file": ("dev_resume.docx", resume_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    })
    assert resume_res.status_code == 201
    resume_id = resume_res.json()["id"]

    # 3. Execute Assessment (mocking network GitHub snapshot to use test snapshot data)
    with patch("app.services.assessment_service.fetch_repository_snapshot", return_value=mock_snapshot_data):
        assess_res = client.post("/api/v1/assessments", headers=auth_headers, json={
            "job_id": job_id,
            "resume_id": resume_id,
            "repository_id": mock_repo_record.id
        })

    assert assess_res.status_code == 201
    data = assess_res.json()
    assert data["status"] in ("demonstrated", "partial_or_needs_review", "not_demonstrated_in_analyzed_scope")
    assert data["processing_status"] == "completed"
    assert "summary_counts" in data
    assert len(data["requirements"]) >= 4

    # Verify at least one requirement has citations
    citations_found = [c for req in data["requirements"] for c in req["citations"]]
    assert len(citations_found) > 0

    assessment_id = data["id"]

    # 4. Fetch detail
    get_res = client.get(f"/api/v1/assessments/{assessment_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == assessment_id

    # 5. Fetch evidence
    ev_res = client.get(f"/api/v1/assessments/{assessment_id}/evidence", headers=auth_headers)
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["assessment_id"] == assessment_id
    assert ev_data["analyzed_sha"] == mock_snapshot_data["analyzed_sha"]
    assert len(ev_data["citations"]) > 0


def test_preserve_prior_successful_assessment_on_failure(
    client,
    auth_headers,
    db_session,
    test_user,
    mock_repo_record,
    mock_snapshot_data
):
    # Setup job and resume
    job_res = client.post("/api/v1/jobs/import", headers=auth_headers, json={
        "source_type": "pasted",
        "title": "Engineer",
        "text": "Need Python, FastAPI, React, TypeScript skills."
    })
    job_id = job_res.json()["id"]

    from tests.test_resumes import create_sample_docx_bytes
    resume_res = client.post("/api/v1/resumes", headers=auth_headers, files={
        "file": ("resume.docx", create_sample_docx_bytes(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    })
    resume_id = resume_res.json()["id"]

    # Run first successful assessment
    with patch("app.services.assessment_service.fetch_repository_snapshot", return_value=mock_snapshot_data):
        res1 = client.post("/api/v1/assessments", headers=auth_headers, json={
            "job_id": job_id,
            "resume_id": resume_id,
            "repository_id": mock_repo_record.id
        })
    assert res1.status_code == 201
    first_assessment_id = res1.json()["id"]

    # Attempt a second assessment where the snapshot fetcher fails (e.g. GitHub API error)
    with patch("app.services.assessment_service.fetch_repository_snapshot", side_effect=Exception("GitHub rate limit or network outage")):
        res2 = client.post("/api/v1/assessments", headers=auth_headers, json={
            "job_id": job_id,
            "resume_id": resume_id,
            "repository_id": mock_repo_record.id
        })
    assert res2.status_code == 502

    # Verify that the first successful assessment was NOT corrupted or overwritten
    res_check = client.get(f"/api/v1/assessments/{first_assessment_id}", headers=auth_headers)
    assert res_check.status_code == 200
    assert res_check.json()["status"] in ("demonstrated", "partial_or_needs_review", "not_demonstrated_in_analyzed_scope")
    assert res_check.json()["processing_status"] == "completed"
