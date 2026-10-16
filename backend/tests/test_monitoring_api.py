import json
import hmac
import hashlib
from unittest.mock import patch
from app.models.repository import Repository
from app.models.change_event import ChangeEvent
from app.core.config import settings


def test_monitoring_status_endpoint(client, auth_headers, test_user, db_session):
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/myorg/myproject",
        owner="myorg",
        name="myproject",
        branch="main",
        analyzed_sha="init_sha_123",
        inspected_files_count=5,
        total_files_count=10,
        snapshot_metadata_json="{}"
    )
    db_session.add(repo)
    db_session.commit()

    res = client.get(f"/api/v1/monitoring/status/{repo.id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["repository_id"] == repo.id
    assert data["branch"] == "main"
    assert data["monitoring_enabled"] is True
    assert data["events_count"] == 0


def test_monitoring_check_now_endpoint(client, auth_headers, test_user, db_session):
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/myorg/myproject",
        owner="myorg",
        name="myproject",
        branch="main",
        analyzed_sha="sha_old_111",
        last_observed_head_sha="sha_old_111",
        inspected_files_count=5,
        total_files_count=10,
        snapshot_metadata_json="{}"
    )
    db_session.add(repo)
    db_session.commit()

    with patch("app.services.watcher_service.get_branch_head_sha", return_value=("main", "sha_new_222")), \
         patch("app.services.watcher_service.get_commit_details_or_compare", return_value={
             "commit_sha": "sha_new_222",
             "parent_sha": "sha_old_111",
             "commit_message": "docs: update readme",
             "commit_author": "Dev",
             "commit_url": "https://github.com/myorg/myproject/commit/sha_new_222",
             "changed_files": [{"filename": "README.md", "status": "modified", "additions": 1, "deletions": 0}]
         }):
        res = client.post(f"/api/v1/monitoring/check-now/{repo.id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data is not None
        assert data["commit_sha"] == "sha_new_222"
        assert data["status"] == "completed"


def test_monitoring_events_list_and_detail(client, auth_headers, test_user, db_session):
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/myorg/myproject",
        owner="myorg",
        name="myproject",
        branch="main",
        analyzed_sha="sha_init",
        inspected_files_count=1,
        total_files_count=1,
        snapshot_metadata_json="{}"
    )
    db_session.add(repo)
    db_session.commit()

    event = ChangeEvent(
        repository_id=repo.id,
        branch="main",
        commit_sha="sha_event_456",
        parent_sha="sha_init",
        commit_message="fix: bugfix",
        commit_author="QA Lead",
        changed_files_json=json.dumps([{"filename": "app.py", "status": "modified", "additions": 3, "deletions": 1}]),
        before_after_diff_json=json.dumps([{
            "requirement_id": "REQ-1",
            "skill": "Python",
            "previous_status": "partial_or_needs_review",
            "current_status": "demonstrated",
            "status_delta": "improved",
            "previous_citations_count": 1,
            "current_citations_count": 2,
            "citations_diff_summary": "1 new citation added"
        }]),
        status="completed",
        summary="Reassessed 1 requirement."
    )
    db_session.add(event)
    db_session.commit()

    # List events
    res = client.get("/api/v1/monitoring/events", headers=auth_headers)
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    assert events[0]["id"] == event.id
    assert len(events[0]["changed_files"]) == 1
    assert len(events[0]["before_after_diff"]) == 1

    # Single event detail
    detail_res = client.get(f"/api/v1/monitoring/events/{event.id}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["commit_author"] == "QA Lead"


def test_monitoring_update_settings(client, auth_headers, test_user, db_session):
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/myorg/myproject",
        owner="myorg",
        name="myproject",
        branch="main",
        analyzed_sha="sha_init",
        monitoring_enabled=True,
        monitoring_interval_seconds=30
    )
    db_session.add(repo)
    db_session.commit()

    update_payload = {"monitoring_enabled": False, "monitoring_interval_seconds": 60}
    res = client.patch(f"/api/v1/monitoring/repositories/{repo.id}", json=update_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["monitoring_enabled"] is False
    assert data["monitoring_interval_seconds"] == 60


def test_github_webhook_signature_and_event(client, db_session, test_user):
    secret = "test-webhook-secret"
    with patch.object(settings, "GITHUB_WEBHOOK_SECRET", secret):
        payload = {
            "ref": "refs/heads/main",
            "after": "sha_webhook_789",
            "repository": {
                "name": "myproject",
                "html_url": "https://github.com/myorg/myproject",
                "owner": {"login": "myorg"}
            }
        }
        raw_body = json.dumps(payload).encode("utf-8")
        mac = hmac.new(secret.encode(), msg=raw_body, digestmod=hashlib.sha256)
        signature = "sha256=" + mac.hexdigest()

        headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": signature,
            "Content-Type": "application/json"
        }

        # Test valid signature and event
        res = client.post("/api/v1/monitoring/webhook/github", data=raw_body, headers=headers)
        assert res.status_code == 200
        assert res.json()["status"] == "processed"

        # Test invalid signature rejected with 401
        bad_headers = {
            "X-GitHub-Event": "push",
            "X-Hub-Signature-256": "sha256=invalid_hash",
            "Content-Type": "application/json"
        }
        res_bad = client.post("/api/v1/monitoring/webhook/github", data=raw_body, headers=bad_headers)
        assert res_bad.status_code == 401
