import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def demo_auth_token():
    """Obtain token for demo user."""
    # Seed demo user
    client.post("/api/v1/demo/seed")
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@proofpath.dev", "password": "ProofPath2026!"}
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


def test_skill_sprint_supported_tracks():
    """Verify that all 10 supported skills are discoverable."""
    resp = client.get("/api/v1/career/skill-sprint/skills")
    assert resp.status_code == 200
    skills = resp.json()
    assert len(skills) >= 10
    skill_names = [s["skill"] for s in skills]
    expected_skills = [
        "Java", "Python", "JavaScript and TypeScript", "React",
        "SQL and databases", "REST APIs", "Git and GitHub",
        "Data structures and algorithms", "Testing and debugging",
        "Cloud and deployment fundamentals"
    ]
    for exp in expected_skills:
        assert exp in skill_names


def test_skill_sprint_questions_payload_security():
    """CRITICAL TEST: Ensure delivered questions NEVER expose correct answers or explanations before submission."""
    resp = client.get("/api/v1/career/skill-sprint/questions?skill=Python")
    assert resp.status_code == 200
    questions = resp.json()
    assert len(questions) >= 5

    for q in questions:
        assert "correct_answer" not in q, f"SECURITY VIOLATION: correct_answer leaked in {q['id']}"
        assert "explanation" not in q, f"SECURITY VIOLATION: explanation leaked in {q['id']}"
        assert "title" in q
        assert "prompt" in q
        assert "options" in q
        assert len(q["options"]) > 0


def test_skill_sprint_grading_and_career_action(demo_auth_token):
    """Test full sprint submission, grading, skipped question handling, and automatic proof task generation."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}

    # Fetch Python questions
    q_resp = client.get("/api/v1/career/skill-sprint/questions?skill=Python")
    questions = q_resp.json()

    # Answer question 1 correctly, answer question 2 wrong, skip remaining questions
    answers = [
        {"question_id": "py-01", "answer": "[10, 11, 12]"},  # correct
        {"question_id": "py-02", "answer": "Declare global metrics_log inside the function."},  # incorrect
        # py-03, py-04, py-05 are skipped!
    ]

    submit_resp = client.post(
        "/api/v1/career/skill-sprint/submit",
        json={"skill": "Python", "answers": answers},
        headers=headers
    )
    assert submit_resp.status_code == 200
    result = submit_resp.json()

    assert result["skill"] == "Python"
    assert result["total_questions"] == len(questions)
    assert result["correct_answers"] == 1
    # Skipped questions get 0, so 1/5 = 20%
    assert result["score_percent"] == 20
    assert len(result["weak_concepts"]) > 0

    # Verify explanations ARE provided AFTER submission
    assert len(result["review_details"]) == len(questions)
    for rev in result["review_details"]:
        assert "correct_answer" in rev
        assert "explanation" in rev
        assert len(rev["explanation"]) > 10

    # Verify automatic career action: proof task generated for weakest concept
    assert result["recommended_task"] is not None
    assert result["recommended_task"]["skill"] == "Python"
    assert result["recommended_task"]["action"] in ["created_new_proof_task", "linked_existing_proof_task"]

    # Verify duplicate prevention: taking sprint again does not create redundant pending tasks
    second_submit = client.post(
        "/api/v1/career/skill-sprint/submit",
        json={"skill": "Python", "answers": answers},
        headers=headers
    )
    assert second_submit.status_code == 200
    second_result = second_submit.json()
    assert second_result["recommended_task"]["action"] == "linked_existing_proof_task"


def test_skill_sprint_attempt_history(demo_auth_token):
    """Verify attempt history persistence and attempt comparison."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}
    resp = client.get("/api/v1/career/skill-sprint/history", headers=headers)
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) >= 1
    latest = history[0]
    assert "score_percent" in latest
    assert "total_questions" in latest


def test_career_proof_passport_lifecycle(demo_auth_token):
    """Verify passport generation, public sharing link, view counter, and revocation."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}

    # 1. Fetch passport
    get_resp = client.get("/api/v1/career/passport", headers=headers)
    assert get_resp.status_code == 200
    passport = get_resp.json()
    token = passport["share_token"]
    assert len(token) > 10
    assert passport["is_public_shared"] is True
    assert "limitations" in passport
    assert len(passport["limitations"]) > 0

    # 2. Public unauthenticated inspection using share token
    pub_resp = client.get(f"/api/v1/career/passport/public/{token}")
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()
    assert pub_data["share_token"] == token
    assert pub_data["student_name"] is not None

    # 3. Revoke access (set is_public_shared = False)
    settings_resp = client.post(
        "/api/v1/career/passport/settings",
        json={"is_public_shared": False},
        headers=headers
    )
    assert settings_resp.status_code == 200
    assert settings_resp.json()["is_public_shared"] is False

    # 4. Public inspection must now return 403 Forbidden
    forbidden_resp = client.get(f"/api/v1/career/passport/public/{token}")
    assert forbidden_resp.status_code == 403

    # 5. Restore sharing
    client.post(
        "/api/v1/career/passport/settings",
        json={"is_public_shared": True},
        headers=headers
    )


def test_opportunity_to_action_radar(demo_auth_token):
    """Verify Opportunity Radar compares requirements and highlights actionable proof recommendations."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}
    resp = client.get("/api/v1/career/opportunity-radar", headers=headers)
    assert resp.status_code == 200
    radar = resp.json()
    assert "target_role" in radar
    assert len(radar["opportunities"]) > 0
    assert len(radar["trending_skills"]) > 0


def test_skill_proof_diff(demo_auth_token):
    """Verify assessment diff calculates score delta, citations added, and newly proven skills."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}
    resp = client.get("/api/v1/career/assessments/diff", headers=headers)
    assert resp.status_code == 200
    diff = resp.json()
    assert "current_assessment_id" in diff
    assert "score_delta" in diff
    assert "newly_demonstrated_skills" in diff
    assert "explanation" in diff


def test_career_what_if_simulator(demo_auth_token):
    """Verify What-If Simulator projects evidence score and gap closure effort."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}
    req = {
        "current_role": "Full-Stack Platform Engineer",
        "alternative_role": "Cloud Infrastructure & DevOps Engineer"
    }
    resp = client.post("/api/v1/career/what-if", json=req, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_role"] == req["current_role"]
    assert data["alternative_role"] == req["alternative_role"]
    assert len(data["shared_skills"]) > 0
    assert len(data["role_specific_gaps"]) > 0
    assert data["estimated_weeks_to_ready"] > 0


def test_recruiter_skill_sprint_authorization(demo_auth_token):
    """Recruiter can view sprint results only when authorized by student."""
    headers = {"Authorization": f"Bearer {demo_auth_token}"}
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    user_id = me_resp.json()["id"]

    # 1. When authorized
    resp = client.get(f"/api/v1/recruiter/candidates/{user_id}/skill-sprint")
    assert resp.status_code == 200
    data = resp.json()
    assert data["authorized"] is True

    # 2. When disabled by student
    client.post(
        "/api/v1/career/passport/settings",
        json={"share_skill_sprint": False},
        headers=headers
    )
    revoked_resp = client.get(f"/api/v1/recruiter/candidates/{user_id}/skill-sprint")
    assert revoked_resp.status_code == 200
    assert revoked_resp.json()["authorized"] is False

    # Restore
    client.post(
        "/api/v1/career/passport/settings",
        json={"share_skill_sprint": True},
        headers=headers
    )


def test_college_sprint_assignment_and_early_warning():
    """Verify College T&P batch assignment distribution and early warning telemetry."""
    # List assignments
    list_resp = client.get("/api/v1/college/skill-sprint/assignments")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) > 0

    # Create assignment
    create_resp = client.post(
        "/api/v1/college/skill-sprint/assignments",
        json={
            "target_batch": "Class of 2026 - CS/IT",
            "skill": "Testing and debugging",
            "due_date": "2026-11-20"
        }
    )
    assert create_resp.status_code == 200
    assert create_resp.json()["status"] == "assigned"

    # Early warning report
    warn_resp = client.get("/api/v1/college/early-warning")
    assert warn_resp.status_code == 200
    warn_data = warn_resp.json()
    assert warn_data["cohort_size"] > 0
    assert len(warn_data["early_warning_alerts"]) > 0
