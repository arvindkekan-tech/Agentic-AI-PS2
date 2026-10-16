import json
from unittest.mock import patch, MagicMock
from app.models.repository import Repository
from app.models.job import Job
from app.models.resume import Resume
from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment
from app.models.citation import Citation
from app.models.change_event import ChangeEvent
from app.services.watcher_service import (
    calculate_status_delta,
    check_repository_for_updates,
    poll_all_monitored_repositories
)
from app.schemas.repository import SnapshotCoverage, InspectedFileItem, ExcludedFileItem


def test_calculate_status_delta():
    assert calculate_status_delta("not_demonstrated_in_analyzed_scope", "demonstrated") == "improved"
    assert calculate_status_delta("partial_or_needs_review", "demonstrated") == "improved"
    assert calculate_status_delta("demonstrated", "partial_or_needs_review") == "regressed"
    assert calculate_status_delta("demonstrated", "demonstrated") == "unchanged"
    assert calculate_status_delta("partial_or_needs_review", "partial_or_needs_review") == "unchanged"


def test_watcher_deduplication(db_session, test_user):
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/testowner/testrepo",
        owner="testowner",
        name="testrepo",
        branch="main",
        analyzed_sha="a1b2c3d4e5f67890123456789012345678901234",
        last_observed_head_sha="a1b2c3d4e5f67890123456789012345678901234",
        monitoring_enabled=True
    )
    db_session.add(repo)
    db_session.commit()

    with patch("app.services.watcher_service.get_branch_head_sha") as mock_head:
        mock_head.return_value = ("main", "a1b2c3d4e5f67890123456789012345678901234")
        evt = check_repository_for_updates(db_session, repo.id, force=False)
        assert evt is None

        # Verify no duplicate change events created
        events = db_session.query(ChangeEvent).filter(ChangeEvent.repository_id == repo.id).all()
        assert len(events) == 0


def test_watcher_new_commit_detection_and_reassessment(db_session, test_user):
    # Setup initial Job, Resume, Repo, Assessment
    job = Job(
        user_id=test_user.id,
        title="Full Stack Engineer",
        source_type="pasted",
        raw_text="Must have FastAPI and React experience.",
        extracted_requirements_json=json.dumps([
            {
                "id": "REQ-1",
                "original_wording": "FastAPI backend services",
                "normalized_skill": "FastAPI",
                "priority_type": "required"
            }
        ])
    )
    db_session.add(job)

    resume = Resume(
        user_id=test_user.id,
        filename="resume.txt",
        safe_path="uploads/resume.txt",
        file_size=100,
        mime_type="text/plain",
        extracted_text="Built APIs with FastAPI.",
        metadata_json="{}"
    )
    db_session.add(resume)


    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/testowner/testrepo",
        owner="testowner",
        name="testrepo",
        branch="main",
        analyzed_sha="old_sha_1111111111111111111111111111111111",
        last_observed_head_sha="old_sha_1111111111111111111111111111111111",
        monitoring_enabled=True
    )
    db_session.add(repo)
    db_session.commit()

    # Initial Assessment
    old_assess = Assessment(
        user_id=test_user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo.id,
        status="not_demonstrated_in_analyzed_scope",
        processing_status="completed",
        provider_name="deterministic",
        model_name="rule-engine-v1",
        summary_counts_json=json.dumps({"not_demonstrated_in_analyzed_scope": 1})
    )
    db_session.add(old_assess)
    db_session.flush()

    old_req = RequirementAssessment(
        assessment_id=old_assess.id,
        requirement_id="REQ-1",
        original_wording="FastAPI backend services",
        normalized_skill="FastAPI",
        priority_type="required",
        resume_status="not_demonstrated_in_analyzed_scope",
        resume_explanation="No mention found.",
        repo_status="not_demonstrated_in_analyzed_scope",
        repo_explanation="No code found.",
        combined_status="not_demonstrated_in_analyzed_scope",
        combined_interpretation="Missing in both sources.",
        limitations_note="Snapshot bounded."
    )
    db_session.add(old_req)
    db_session.commit()


    new_head_sha = "new_sha_2222222222222222222222222222222222"

    mock_snapshot = {
        "owner": "testowner",
        "name": "testrepo",
        "branch": "main",
        "analyzed_sha": new_head_sha,
        "repo_url": "https://github.com/testowner/testrepo",
        "files": {
            "app/main.py": {
                "path": "app/main.py",
                "size": 250,
                "lines": ["from fastapi import FastAPI", "app = FastAPI()"],
                "lines_count": 2,
                "language": "Python"
            }
        },
        "inspected_files": [
            InspectedFileItem(path="app/main.py", size=250, lines_count=2, language="Python")
        ],
        "excluded_files": [],
        "coverage": SnapshotCoverage(
            inspected_files_count=1,
            excluded_files_count=0,
            total_files_count=1,
            inspected_lines_total=2,
            languages_detected=["Python"],
            limitations=["Snapshot bounded to 1 file."]
        )
    }

    mock_commit_details = {
        "commit_sha": new_head_sha,
        "parent_sha": "old_sha_1111111111111111111111111111111111",
        "commit_message": "feat: add FastAPI app entrypoint",
        "commit_author": "Arvind K",
        "commit_url": f"https://github.com/testowner/testrepo/commit/{new_head_sha}",
        "changed_files": [
            {"filename": "app/main.py", "status": "added", "additions": 2, "deletions": 0}
        ]
    }

    mock_finding = {
        "requirement_id": "REQ-1",
        "original_wording": "FastAPI backend services",
        "normalized_skill": "FastAPI",
        "priority_type": "required",
        "resume_status": "demonstrated",
        "resume_explanation": "Mentions FastAPI.",
        "repo_status": "demonstrated",
        "repo_explanation": "Found FastAPI instance in app/main.py.",
        "combined_status": "demonstrated",
        "combined_interpretation": "Demonstrated in both resume and repo code.",
        "limitations_note": "Single file analyzed.",
        "improvement_action": None,
        "citations": [
            {
                "evidence_type": "implementation",
                "repo_url": "https://github.com/testowner/testrepo",
                "branch": "main",
                "commit_sha": new_head_sha,
                "file_path": "app/main.py",
                "start_line": 1,
                "end_line": 2,
                "excerpt": "from fastapi import FastAPI\napp = FastAPI()",
                "commit_url": f"https://github.com/testowner/testrepo/commit/{new_head_sha}",
                "is_valid": True,
                "validation_note": "Verified exact lines in snapshot."
            }
        ]
    }

    mock_provider = MagicMock()
    mock_provider.assess_requirements.return_value = [mock_finding]

    with patch("app.services.watcher_service.get_branch_head_sha", return_value=("main", new_head_sha)), \
         patch("app.services.watcher_service.get_commit_details_or_compare", return_value=mock_commit_details), \
         patch("app.services.watcher_service.fetch_repository_snapshot", return_value=mock_snapshot), \
         patch("app.services.watcher_service.get_ai_provider", return_value=mock_provider):

        event = check_repository_for_updates(db_session, repo.id)

        assert event is not None
        assert event.status == "completed"
        assert event.commit_sha == new_head_sha
        assert event.commit_author == "Arvind K"
        assert event.assessment_id is not None
        assert event.previous_assessment_id == old_assess.id

        diff = json.loads(event.before_after_diff_json)
        assert len(diff) == 1
        assert diff[0]["requirement_id"] == "REQ-1"
        assert diff[0]["previous_status"] == "not_demonstrated_in_analyzed_scope"
        assert diff[0]["current_status"] == "demonstrated"
        assert diff[0]["status_delta"] == "improved"

        # Verify old assessment is preserved
        prior = db_session.query(Assessment).filter(Assessment.id == old_assess.id).first()
        assert prior is not None
        assert prior.status == "not_demonstrated_in_analyzed_scope"

        # Verify new assessment was created
        new_assess = db_session.query(Assessment).filter(Assessment.id == event.assessment_id).first()
        assert new_assess is not None
        assert new_assess.status == "demonstrated"
        assert len(new_assess.requirements[0].citations) == 1


def test_watcher_handles_failure_without_erasing_prior_assessment(db_session, test_user):
    job = Job(
        user_id=test_user.id,
        title="Software Engineer",
        source_type="pasted",
        raw_text="Python experience required.",
        extracted_requirements_json=json.dumps([{"id": "REQ-1", "original_wording": "Python", "normalized_skill": "Python", "priority_type": "required"}])
    )
    db_session.add(job)

    resume = Resume(
        user_id=test_user.id,
        filename="resume.txt",
        safe_path="uploads/resume.txt",
        file_size=100,
        mime_type="text/plain",
        extracted_text="Python developer.",
        metadata_json="{}"
    )
    db_session.add(resume)

    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/testowner/testrepo",
        owner="testowner",
        name="testrepo",
        branch="main",
        analyzed_sha="sha_prior",
        last_observed_head_sha="sha_prior",
        monitoring_enabled=True
    )
    db_session.add(repo)
    db_session.commit()

    prior_assess = Assessment(
        user_id=test_user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo.id,
        status="demonstrated",
        processing_status="completed"
    )
    db_session.add(prior_assess)
    db_session.commit()

    failing_sha = "sha_fail_9999"

    with patch("app.services.watcher_service.get_branch_head_sha", return_value=("main", failing_sha)), \
         patch("app.services.watcher_service.get_commit_details_or_compare", return_value={
             "commit_sha": failing_sha,
             "parent_sha": "sha_prior",
             "commit_message": "broken commit",
             "commit_author": "Tester",
             "commit_url": "https://github.com",
             "changed_files": []
         }), \
         patch("app.services.watcher_service.fetch_repository_snapshot", side_effect=RuntimeError("GitHub API rate limit exceeded")):

        event = check_repository_for_updates(db_session, repo.id)
        assert event is not None
        assert event.status == "failed"
        assert "rate limit exceeded" in event.error_message

        # Verify prior assessment remains untouched
        preserved = db_session.query(Assessment).filter(Assessment.id == prior_assess.id).first()
        assert preserved is not None
        assert preserved.status == "demonstrated"

