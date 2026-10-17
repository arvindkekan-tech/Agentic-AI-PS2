import pytest
from app.core.security import verify_password


def test_register_user_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@proofpath.dev",
        "password": "strongPassword123",
        "full_name": "Jordan Lee"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@proofpath.dev"
    assert data["user"]["full_name"] == "Jordan Lee"


def test_register_duplicate_email_fails(client, test_user):
    res = client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "password": "anotherPassword123",
        "full_name": "Duplicate User"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_register_short_password_fails(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "shortpass@proofpath.dev",
        "password": "123",
        "full_name": "Short Pass"
    })
    assert res.status_code == 422


def test_login_success(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["id"] == test_user.id


def test_login_invalid_password_fails(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "wrongPassword"
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]


def test_get_me_authenticated(client, auth_headers, test_user):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email


def test_get_me_unauthenticated_fails(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_demo_user_seeded_and_can_login(client, db_session):
    from app.db.init_db import seed_demo_user
    seed_demo_user(db_session)
    res = client.post("/api/v1/auth/login", json={
        "email": "demo@proofpath.dev",
        "password": "ProofPath2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "demo@proofpath.dev"
    assert "access_token" in data


def test_user_role_assignment_and_update(client, auth_headers):
    # Verify default role
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "student"

    # Switch to recruiter
    update_res = client.put("/api/v1/auth/role", headers=auth_headers, json={"role": "recruiter"})
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "recruiter"

    # Switch to college_tp
    tp_res = client.put("/api/v1/auth/role", headers=auth_headers, json={"role": "college_tp"})
    assert tp_res.status_code == 200
    assert tp_res.json()["role"] == "college_tp"

    # Invalid role fails with 400
    invalid_res = client.put("/api/v1/auth/role", headers=auth_headers, json={"role": "superadmin_hacker"})
    assert invalid_res.status_code == 400
    assert "invalid role" in invalid_res.json()["detail"].lower()

