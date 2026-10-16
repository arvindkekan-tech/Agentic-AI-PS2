import pytest
from app.services.job_discovery.discovery_service import discovery_service
from app.services.job_discovery.base import DiscoveredJob
from app.models.user import User
from app.core.security import hash_password


def test_list_job_sources():
    sources = discovery_service.list_sources()
    source_ids = [s.source_id for s in sources]
    assert "remotive" in source_ids
    assert "arbeitnow" in source_ids
    assert "schema_org" in source_ids
    assert all(s.is_active for s in sources)


def test_search_and_deduplicate_jobs():
    jobs = discovery_service.search_all_sources(query="Python", limit_per_source=5)
    assert len(jobs) > 0
    # Verify no duplicate URLs
    urls = [j.url for j in jobs]
    assert len(urls) == len(set(urls))
    assert all("python" in f"{j.title} {j.description} {' '.join(j.tags)}".lower() for j in jobs)


def test_match_jobs_with_skills():
    mock_jobs = [
        DiscoveredJob(
            id="job-1",
            source_id="test",
            source_name="Test",
            title="FastAPI Backend Engineer",
            company="Tech Corp",
            url="https://example.com/1",
            description="We build Python and FastAPI microservices with PostgreSQL and Docker.",
            tags=["FastAPI", "Python", "Docker"]
        ),
        DiscoveredJob(
            id="job-2",
            source_id="test",
            source_name="Test",
            title="iOS Mobile Engineer",
            company="Mobile Corp",
            url="https://example.com/2",
            description="Swift and SwiftUI iOS developer.",
            tags=["Swift", "iOS"]
        )
    ]

    matched = discovery_service.match_jobs_with_skills(
        mock_jobs,
        candidate_skills=["FastAPI", "Python", "Docker", "PostgreSQL"]
    )
    assert len(matched) == 2
    # The first job should have a high match score and come first
    assert matched[0].id == "job-1"
    assert matched[0].match_score is not None
    assert matched[0].match_score > 60.0
    assert "Fastapi" in matched[0].matched_skills or "FastAPI" in matched[0].matched_skills

    # The second job should have 0 or very low score
    assert matched[1].id == "job-2"
    assert (matched[1].match_score or 0.0) < 20.0


def test_import_job_for_user(db_session):
    user = User(email="discoverer@example.com", hashed_password=hash_password("Secret123!"))
    db_session.add(user)
    db_session.commit()

    disc_job = DiscoveredJob(
        id="disc-123",
        source_id="remotive",
        source_name="Remotive",
        title="Full-Stack Python Engineer",
        company="Startup Inc",
        url="https://example.com/job",
        description="Required: 3+ years experience in Python, FastAPI, and React. Preferred: AWS experience.",
        tags=["Python", "FastAPI", "React"]
    )

    imported_job = discovery_service.import_job_for_user(db_session, user, disc_job)
    assert imported_job.id is not None
    assert imported_job.title == "Full-Stack Python Engineer"
    assert imported_job.company == "Startup Inc"
    assert imported_job.user_id == user.id
    assert len(imported_job.extracted_requirements_json) > 10
