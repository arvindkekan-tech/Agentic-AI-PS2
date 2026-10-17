import pytest
from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.models.repository import Repository
from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment
from app.core.security import hash_password, create_access_token


@pytest.fixture
def test_user_and_token(db_session):
    user = User(email="p2user@example.com", hashed_password=hash_password("Pass12345!"))
    db_session.add(user)
    db_session.commit()
    token = create_access_token(subject=user.id)
    return user, token


def test_get_job_sources_endpoint(client):
    res = client.get("/api/v1/job-sources")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    sources = [s["source_id"] for s in data]
    assert "remotive" in sources
    assert "arbeitnow" in sources


def test_job_discovery_search_endpoint(client):
    res = client.get("/api/v1/job-discovery/search?query=Python&limit=3")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "title" in data[0]
    assert "company" in data[0]


def test_job_discovery_match_endpoint(client):
    payload = {
        "candidate_skills": ["Python", "FastAPI"],
        "query": "Python",
        "limit": 3
    }
    res = client.post("/api/v1/job-discovery/match", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["match_score"] is not None


def test_import_discovered_job_endpoint(client, test_user_and_token):
    user, token = test_user_and_token
    payload = {
        "id": "disc-456",
        "source_id": "remotive",
        "source_name": "Remotive",
        "title": "Backend Python Lead",
        "company": "Scale Dynamics",
        "url": "https://example.com/scale-job",
        "description": "Required: 5+ years experience in Python, PostgreSQL, and Docker. Preferred: Redis and RabbitMQ.",
        "tags": ["Python", "Docker", "PostgreSQL"]
    }
    res = client.post(
        "/api/v1/jobs/import-discovered",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Backend Python Lead"
    assert len(data["extracted_requirements"]) >= 3


def test_evidence_change_ledger_comparison_endpoint(client, db_session, test_user_and_token):
    user, token = test_user_and_token

    job = Job(
        user_id=user.id,
        title="Software Engineer",
        source_type="pasted",
        raw_text="Required: Python and Docker",
        extracted_requirements_json="[]"
    )
    resume = Resume(
        user_id=user.id,
        filename="cv.pdf",
        safe_path="cv.pdf",
        file_size=100,
        mime_type="application/pdf",
        extracted_text="Python developer",
        metadata_json="{}"
    )
    repo = Repository(
        user_id=user.id,
        repo_url="https://github.com/test/repo",
        owner="test",
        name="repo",
        branch="main",
        analyzed_sha="sha111",
        inspected_files_count=1,
        total_files_count=1,
        snapshot_metadata_json="{}"
    )
    db_session.add_all([job, resume, repo])
    db_session.commit()

    # Previous assessment
    prev_assess = Assessment(
        user_id=user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo.id,
        status="partial_or_needs_review",
        compatibility_score=50.0,
        evidence_coverage=100.0,
        evidence_match_score=50.0,
        resume_alignment_score=50.0
    )
    db_session.add(prev_assess)
    db_session.commit()

    prev_req = RequirementAssessment(
        assessment_id=prev_assess.id,
        requirement_id="REQ-1",
        original_wording="Python",
        normalized_skill="Python",
        priority_type="required",
        resume_status="demonstrated",
        resume_explanation="Claimed",
        repo_status="partial_or_needs_review",
        repo_explanation="Partial",
        combined_status="partial_or_needs_review",
        combined_interpretation="Partial",
        limitations_note="None"
    )
    db_session.add(prev_req)
    db_session.commit()

    # Current assessment (improved!)
    curr_assess = Assessment(
        user_id=user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo.id,
        status="demonstrated",
        compatibility_score=100.0,
        evidence_coverage=100.0,
        evidence_match_score=100.0,
        resume_alignment_score=100.0
    )
    db_session.add(curr_assess)
    db_session.commit()

    curr_req = RequirementAssessment(
        assessment_id=curr_assess.id,
        requirement_id="REQ-1",
        original_wording="Python",
        normalized_skill="Python",
        priority_type="required",
        resume_status="demonstrated",
        resume_explanation="Claimed",
        repo_status="demonstrated",
        repo_explanation="Verified in code",
        combined_status="demonstrated",
        combined_interpretation="Demonstrated",
        limitations_note="None"
    )
    db_session.add(curr_req)
    db_session.commit()

    res = client.get(
        f"/api/v1/assessments/{curr_assess.id}/compare/{prev_assess.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    comp_data = res.json()
    assert comp_data["score_delta"] == 50.0
    assert comp_data["improved_count"] == 1
    assert comp_data["regressed_count"] == 0
    assert len(comp_data["requirement_changes"]) == 1
    assert comp_data["requirement_changes"][0]["transition_type"] == "improved"
    assert "increased" in comp_data["narrative_summary"]
