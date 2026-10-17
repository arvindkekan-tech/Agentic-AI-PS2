def test_demo_seed_endpoint(client):
    res = client.post("/api/v1/demo/seed")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["user"]["email"] == "demo@proofpath.dev"
    assert "target_job" in data


def test_career_profile_flow(client, auth_headers):
    # Get profile
    res = client.get("/api/v1/career/profile", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "headline" in data
    assert "skills" in data

    # Update profile
    update_res = client.put("/api/v1/career/profile", headers=auth_headers, json={
        "headline": "Senior Platform Architect",
        "target_role": "Principal Systems Engineer"
    })
    assert update_res.status_code == 200
    assert update_res.json()["headline"] == "Senior Platform Architect"


def test_proof_tasks_flow(client, auth_headers):
    # Create a task
    create_res = client.post("/api/v1/career/tasks", headers=auth_headers, json={
        "skill": "Docker",
        "title": "Build multi-stage Dockerfile",
        "description": "Create production image",
        "why_it_matters": "Closes containerization gap",
        "acceptance_criteria": ["Size < 150MB"],
        "test_scenarios": ["docker build succeeds"],
        "estimated_hours": 3
    })
    assert create_res.status_code == 201
    task_id = create_res.json()["id"]

    # List tasks
    list_res = client.get("/api/v1/career/tasks", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(t["id"] == task_id for t in list_res.json())

    # Update task
    patch_res = client.patch(f"/api/v1/career/tasks/{task_id}", headers=auth_headers, json={
        "status": "completed"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "completed"


def test_job_applications_flow(client, auth_headers):
    create_res = client.post("/api/v1/career/applications", headers=auth_headers, json={
        "company": "Stripe",
        "role": "Staff Platform Engineer",
        "status": "applied",
        "match_score": 92
    })
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    list_res = client.get("/api/v1/career/applications", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    del_res = client.delete(f"/api/v1/career/applications/{app_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_roadmap_flow(client, auth_headers):
    res = client.get("/api/v1/career/roadmap", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert data[0]["week_number"] == 1


def test_mentor_chat(client, auth_headers):
    res = client.post("/api/v1/career/mentor/chat", headers=auth_headers, json={
        "message": "What are my biggest skill gaps and how do I fix them?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "suggested_actions" in data
    assert "provider" in data


def test_interview_evaluate(client, auth_headers):
    res = client.post("/api/v1/career/interview/evaluate", headers=auth_headers, json={
        "role_title": "Full-Stack Platform Engineer",
        "question": "How do you handle database migrations?",
        "question_type": "technical",
        "user_answer": "I run idempotent migrations using schema inspectors before executing ALTER TABLE statements."
    })
    assert res.status_code == 200
    data = res.json()
    assert "overall_score" in data
    assert "rubric_scores" in data
    assert "feedback" in data


def test_recruiter_dashboard(client):
    res = client.get("/api/v1/recruiter/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "candidates" in data
    assert len(data["candidates"]) >= 1
    assert "verified_candidates_count" in data


def test_college_dashboard(client):
    res = client.get("/api/v1/college/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "students" in data
    assert "top_skill_gaps" in data
    assert data["placement_ready_percentage"] > 0
