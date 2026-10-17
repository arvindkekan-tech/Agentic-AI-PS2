import pytest
from app.services.job_service import is_safe_ip, validate_url_for_ssrf
from fastapi import HTTPException


def test_ssrf_ip_filtering():
    # Loopback & private IPs must be blocked
    assert not is_safe_ip("127.0.0.1")
    assert not is_safe_ip("10.0.0.5")
    assert not is_safe_ip("172.16.0.1")
    assert not is_safe_ip("192.168.1.100")
    assert not is_safe_ip("169.254.169.254")  # AWS/Cloud metadata service
    assert not is_safe_ip("::1")
    assert not is_safe_ip("0.0.0.0")

    # Public internet IPs must be permitted
    assert is_safe_ip("8.8.8.8")
    assert is_safe_ip("1.1.1.1")
    assert is_safe_ip("142.250.190.46")


def test_ssrf_scheme_and_host_validation():
    # Block unsafe schemes
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("file:///etc/passwd")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("ftp://internal-server/data")
    assert exc.value.status_code == 400

    # Block localhost
    with pytest.raises(HTTPException) as exc:
        validate_url_for_ssrf("http://localhost:8080/admin")
    assert exc.value.status_code == 400


def test_import_job_pasted_text_success(client, auth_headers):
    job_description = """
    Senior Full Stack Engineer
    Company: ModernTech Labs
    Responsibilities:
    - Build performant web applications using React and TypeScript.
    - Develop scalable backend REST APIs using Python and FastAPI.
    - Design and optimize relational database models in SQL / PostgreSQL.
    - Write unit and integration tests using Automated Testing with pytest.
    - Familiarity with Docker and Containerization is preferred.
    - Experience with Git & Version Control workflows.
    """
    res = client.post("/api/v1/jobs/import", headers=auth_headers, json={
        "source_type": "pasted",
        "title": "Senior Full Stack Engineer",
        "company": "ModernTech Labs",
        "text": job_description
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Senior Full Stack Engineer"
    assert data["company"] == "ModernTech Labs"
    assert data["source_type"] == "pasted"
    
    reqs = data["extracted_requirements"]
    assert 4 <= len(reqs) <= 6
    skills = [r["normalized_skill"] for r in reqs]
    assert any("React" in s or "TypeScript" in s for s in skills)
    assert any("Python" in s or "FastAPI" in s for s in skills)


def test_import_job_too_short_fails(client, auth_headers):
    res = client.post("/api/v1/jobs/import", headers=auth_headers, json={
        "source_type": "pasted",
        "text": "Too brief"
    })
    assert res.status_code == 400


def test_job_ownership_isolation(client, auth_headers, second_auth_headers):
    # User 1 imports job
    res1 = client.post("/api/v1/jobs/import", headers=auth_headers, json={
        "source_type": "pasted",
        "title": "Job for User 1",
        "text": "We need a Python and FastAPI backend developer with React and TypeScript and SQL skills."
    })
    job1_id = res1.json()["id"]

    # User 2 lists jobs; must not see User 1's job
    res2 = client.get("/api/v1/jobs", headers=second_auth_headers)
    assert res2.status_code == 200
    user2_job_ids = [j["id"] for j in res2.json()]
    assert job1_id not in user2_job_ids

    # User 2 tries to fetch User 1's job directly; must be 404
    res3 = client.get(f"/api/v1/jobs/{job1_id}", headers=second_auth_headers)
    assert res3.status_code == 404
