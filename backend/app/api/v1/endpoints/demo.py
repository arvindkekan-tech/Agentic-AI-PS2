import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.models.repository import Repository
from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment
from app.models.citation import Citation
from app.models.career import CareerProfile, ProofTask, JobApplication, RoadmapMilestone, InterviewSession
from app.core.security import hash_password

router = APIRouter(prefix="/demo", tags=["Judge Demo Seeder"])


@router.post("/seed", status_code=status.HTTP_200_OK, summary="Seed complete Kurukshetra 2026 Judge Scenario")
def seed_judge_scenario(db: Session = Depends(get_db)):
    """
    Idempotent seeder that sets up a complete, interconnected, evidence-backed
    AI Career Coach demonstration for Students, Recruiters, and College Placement Officers.
    """
    # 1. Ensure Demo User exists
    user = db.query(User).filter(User.email == "demo@proofpath.dev").first()
    if not user:
        user = User(
            email="demo@proofpath.dev",
            hashed_password=hash_password("ProofPath2026!"),
            full_name="Arvind Kekan (Demo Candidate)",
            is_active=True
        )
        db.add(user)
    else:
        user.hashed_password = hash_password("ProofPath2026!")
    db.commit()
    db.refresh(user)

    # 2. Seed Career Profile
    profile = db.query(CareerProfile).filter(CareerProfile.user_id == user.id).first()
    if not profile:
        profile = CareerProfile(
            user_id=user.id,
            headline="Full-Stack Platform Engineer & AI Systems Specialist",
            target_role="Full-Stack Platform Engineer",
            bio="Software engineer dedicated to building high-reliability distributed systems with verifiable code evidence.",
            education_json=json.dumps([
                {
                    "institution": "National Institute of Technology",
                    "degree": "B.Tech in Computer Science and Engineering",
                    "year": "2026",
                    "gpa": "8.9 / 10.0"
                }
            ]),
            skills_json=json.dumps([
                {"name": "Python & FastAPI", "level": "Expert", "verified": True},
                {"name": "React & TypeScript", "level": "Advanced", "verified": True},
                {"name": "SQLAlchemy & SQLite", "level": "Advanced", "verified": True},
                {"name": "Automated Testing (pytest/vitest)", "level": "Expert", "verified": True},
                {"name": "Docker & Kubernetes", "level": "Intermediate", "verified": False},
                {"name": "Distributed Systems", "level": "Intermediate", "verified": False}
            ]),
            github_username="arvindkekan-tech",
            preferred_locations_json=json.dumps(["Bengaluru", "Hyderabad", "Remote (Global)"])
        )
        db.add(profile)
        db.commit()

    # 3. Seed Target Jobs
    job1 = db.query(Job).filter(Job.user_id == user.id, Job.title == "Senior Full-Stack Platform Engineer").first()
    if not job1:
        job1 = Job(
            user_id=user.id,
            title="Senior Full-Stack Platform Engineer",
            company="Stripe",
            source_type="url",
            source_url="https://stripe.com/jobs/senior-full-stack-platform-engineer",
            raw_text="Stripe is seeking an engineer to build high-scale developer platform infrastructure with FastAPI, React, TypeScript, and robust automated test suites.",
            extracted_requirements_json=json.dumps([
                {
                    "id": "REQ-1",
                    "wording": "Design and maintain high-performance asynchronous REST and GraphQL APIs using Python and FastAPI.",
                    "normalized_skill": "Python / FastAPI",
                    "priority": "required"
                },
                {
                    "id": "REQ-2",
                    "wording": "Build responsive, accessible user interfaces with modern React, TypeScript, and clean state management.",
                    "normalized_skill": "React / TypeScript",
                    "priority": "required"
                },
                {
                    "id": "REQ-3",
                    "wording": "Implement relational database access layer with SQLAlchemy and execute zero-downtime schema migrations.",
                    "normalized_skill": "SQLAlchemy Database Layer",
                    "priority": "required"
                },
                {
                    "id": "REQ-4",
                    "wording": "Write comprehensive unit, integration, and regression tests ensuring >90% code coverage.",
                    "normalized_skill": "Automated Testing & QA",
                    "priority": "required"
                },
                {
                    "id": "REQ-5",
                    "wording": "Deploy and orchestrate containerized microservices using Docker and Kubernetes in production environments.",
                    "normalized_skill": "Docker & Kubernetes Orchestration",
                    "priority": "preferred"
                }
            ])
        )
        db.add(job1)
        db.commit()
        db.refresh(job1)

    # 4. Seed Resume
    resume = db.query(Resume).filter(Resume.user_id == user.id).first()
    if not resume:
        resume = Resume(
            user_id=user.id,
            filename="Arvind_Kekan_Resume_2026.pdf",
            safe_path="uploads/demo_resume.pdf",
            file_size=10240,
            mime_type="application/pdf",
            extracted_text="Arvind Kekan — Full-Stack Engineer experienced in Python, FastAPI, React, TypeScript, SQLAlchemy, and automated test-driven development.",
            metadata_json=json.dumps([
                {"claim_id": "CLM-1", "skill": "Python / FastAPI", "wording": "Engineered REST microservices using FastAPI."},
                {"claim_id": "CLM-2", "skill": "React / TypeScript", "wording": "Built reactive web applications using React and TypeScript."},
                {"claim_id": "CLM-3", "skill": "SQLAlchemy Database Layer", "wording": "Architected database models with SQLAlchemy and SQLite."},
                {"claim_id": "CLM-4", "skill": "Automated Testing & QA", "wording": "Developed comprehensive test suites using pytest."},
                {"claim_id": "CLM-5", "skill": "Docker & Kubernetes Orchestration", "wording": "Packaged and deployed services using Docker."}
            ])
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

    # 5. Seed Repository
    repo = db.query(Repository).filter(Repository.user_id == user.id).first()
    if not repo:
        repo = Repository(
            user_id=user.id,
            repo_url="https://github.com/arvindkekan-tech/kurukshetra-2026",
            owner="arvindkekan-tech",
            name="kurukshetra-2026",
            branch="feat/proofpath-intelligence-v2",
            analyzed_sha="255ff29188a91c9bd0478e7bbef0694e9f73da8f",
            inspected_files_count=18,
            total_files_count=24,
            monitoring_enabled=True,
            snapshot_metadata_json=json.dumps({
                "owner": "arvindkekan-tech",
                "repo": "kurukshetra-2026",
                "files": [
                    "backend/app/main.py",
                    "backend/app/api/v1/endpoints/auth.py",
                    "backend/app/services/citation_validator.py",
                    "backend/app/services/trust_engine.py",
                    "backend/tests/test_citation_validator.py",
                    "frontend/src/services/api.ts"
                ]
            })
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)

    # 6. Seed Assessment with 5-dimension Trust & Evidence Citations
    assessment = db.query(Assessment).filter(Assessment.user_id == user.id, Assessment.job_id == job1.id).first()
    if not assessment:
        assessment = Assessment(
            user_id=user.id,
            job_id=job1.id,
            resume_id=resume.id,
            repository_id=repo.id,
            status="demonstrated",
            processing_status="completed",
            provider_name="deterministic",
            model_name="proofpath-evidence-engine-v2",
            summary_counts_json=json.dumps({
                "demonstrated": 4,
                "partial_or_needs_review": 0,
                "not_demonstrated_in_analyzed_scope": 1,
                "unable_to_assess": 0
            })
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Requirement 1: FastAPI
        req1 = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id="REQ-1",
            original_wording="Design and maintain high-performance asynchronous REST APIs using Python and FastAPI.",
            normalized_skill="Python / FastAPI",
            priority_type="required",
            resume_status="demonstrated",
            resume_explanation="Candidate résumé explicitly documents engineering REST microservices with FastAPI.",
            repo_status="demonstrated",
            repo_explanation="Verified multiple asynchronous routes in backend/app/main.py and backend/app/api/v1/endpoints/auth.py.",
            combined_status="demonstrated",
            combined_interpretation="Strong alignment: Both resume claims and repository source code demonstrate production FastAPI patterns.",
            limitations_note="Assessment restricted to files within inspected backend directory."
        )
        db.add(req1)
        db.commit()
        db.refresh(req1)

        c1 = Citation(
            requirement_assessment_id=req1.id,
            evidence_type="implementation",
            repo_url=repo.repo_url,
            branch=repo.branch,
            commit_sha=repo.analyzed_sha,
            file_path="backend/app/main.py",
            start_line=24,
            end_line=45,
            excerpt='app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)\napp.include_router(api_router, prefix=settings.API_V1_STR)',
            commit_url=f"{repo.repo_url}/commit/{repo.analyzed_sha}",
            is_valid=True,
            validation_note="Line bounds and verbatim content verified against repository snapshot."
        )
        db.add(c1)

        # Requirement 2: React & TypeScript
        req2 = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id="REQ-2",
            original_wording="Build responsive, accessible user interfaces with modern React, TypeScript, and clean state management.",
            normalized_skill="React / TypeScript",
            priority_type="required",
            resume_status="demonstrated",
            resume_explanation="Candidate résumé highlights extensive React and TypeScript development experience.",
            repo_status="demonstrated",
            repo_explanation="Verified strongly-typed API client and UI components in frontend/src/services/api.ts and frontend/src/App.tsx.",
            combined_status="demonstrated",
            combined_interpretation="Strong alignment: Typed interfaces and clean component hierarchy verified.",
            limitations_note="TypeScript strict mode enabled across client modules."
        )
        db.add(req2)
        db.commit()
        db.refresh(req2)

        c2 = Citation(
            requirement_assessment_id=req2.id,
            evidence_type="implementation",
            repo_url=repo.repo_url,
            branch=repo.branch,
            commit_sha=repo.analyzed_sha,
            file_path="frontend/src/services/api.ts",
            start_line=18,
            end_line=45,
            excerpt='class ApiClient {\n  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> { ... }',
            commit_url=f"{repo.repo_url}/commit/{repo.analyzed_sha}",
            is_valid=True,
            validation_note="Class method signatures and type safety verified against repository snapshot."
        )
        db.add(c2)

        # Requirement 3: SQLAlchemy Database Layer
        req3 = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id="REQ-3",
            original_wording="Implement relational database access layer with SQLAlchemy and execute zero-downtime schema migrations.",
            normalized_skill="SQLAlchemy Database Layer",
            priority_type="required",
            resume_status="demonstrated",
            resume_explanation="Résumé states architecture of database models with SQLAlchemy.",
            repo_status="demonstrated",
            repo_explanation="Verified database sessions, schema declarations, and migration runner in backend/app/db/migrations.py.",
            combined_status="demonstrated",
            combined_interpretation="Strong alignment: Robust idempotent migration execution verified in source code.",
            limitations_note="Tested with SQLite dialect in local environment."
        )
        db.add(req3)
        db.commit()
        db.refresh(req3)

        c3 = Citation(
            requirement_assessment_id=req3.id,
            evidence_type="implementation",
            repo_url=repo.repo_url,
            branch=repo.branch,
            commit_sha=repo.analyzed_sha,
            file_path="backend/app/db/migrations.py",
            start_line=24,
            end_line=40,
            excerpt='def run_schema_migrations(engine: Engine) -> None:\n    inspector = inspect(engine)\n    existing_tables = set(inspector.get_table_names())',
            commit_url=f"{repo.repo_url}/commit/{repo.analyzed_sha}",
            is_valid=True,
            validation_note="Verified idempotent migration logic in active database module."
        )
        db.add(c3)

        # Requirement 4: Automated Testing
        req4 = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id="REQ-4",
            original_wording="Write comprehensive unit, integration, and regression tests ensuring >90% code coverage.",
            normalized_skill="Automated Testing & QA",
            priority_type="required",
            resume_status="demonstrated",
            resume_explanation="Résumé mentions developing automated test suites with pytest.",
            repo_status="demonstrated",
            repo_explanation="Verified 52 passing pytest tests in backend/tests covering auth, citation validation, trust engine, and watcher.",
            combined_status="demonstrated",
            combined_interpretation="Strong alignment: Multiple test suites verify system robustness and edge-case handling.",
            limitations_note="Verified using pytest test runner."
        )
        db.add(req4)
        db.commit()
        db.refresh(req4)

        c4 = Citation(
            requirement_assessment_id=req4.id,
            evidence_type="test_code",
            repo_url=repo.repo_url,
            branch=repo.branch,
            commit_sha=repo.analyzed_sha,
            file_path="backend/tests/test_citation_validator.py",
            start_line=12,
            end_line=30,
            excerpt='def test_valid_citation_exact_match(sample_snapshot):\n    result = validate_citation(sample_snapshot, "src/main.py", 1, 3, "def hello():")\n    assert result.is_valid is True',
            commit_url=f"{repo.repo_url}/commit/{repo.analyzed_sha}",
            is_valid=True,
            validation_note="Line citation bounds and assertions verified in test suite."
        )
        db.add(c4)

        # Requirement 5: Docker & Kubernetes (GAP)
        req5 = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id="REQ-5",
            original_wording="Deploy and orchestrate containerized microservices using Docker and Kubernetes in production environments.",
            normalized_skill="Docker & Kubernetes Orchestration",
            priority_type="preferred",
            resume_status="demonstrated",
            resume_explanation="Candidate résumé claims familiarity with Docker container packaging.",
            repo_status="not_demonstrated_in_analyzed_scope",
            repo_explanation="No Dockerfile, docker-compose.yml, or Kubernetes manifests were found in the inspected repository snapshot.",
            combined_status="not_demonstrated_in_analyzed_scope",
            combined_interpretation="Evidence Gap: Claimed in résumé but unverified in inspected GitHub repository. Recommended action: generate proof task.",
            limitations_note="Does not mean the candidate lacks skill; simply unevidenced in this specific code snapshot."
        )
        db.add(req5)
        db.commit()

    # 7. Seed Proof Tasks
    task1 = db.query(ProofTask).filter(ProofTask.user_id == user.id, ProofTask.skill == "Docker & Kubernetes Orchestration").first()
    if not task1:
        task1 = ProofTask(
            user_id=user.id,
            assessment_id=assessment.id,
            requirement_id="REQ-5",
            skill="Docker & Kubernetes Orchestration",
            title="Create Production Multi-Stage Dockerfile & Compose Specification",
            description="Author an optimized Dockerfile with non-root security context and healthchecks, plus a docker-compose.yml orchestrating the API and SQLite volume.",
            why_it_matters="Closes the sole evidence gap for Stripe Senior Platform Engineer role, proving production container readiness to recruiters.",
            target_file="Dockerfile",
            acceptance_criteria_json=json.dumps([
                "Multi-stage build reducing final image size under 150MB",
                "Non-root appuser execution for security hardening",
                "Docker Compose file linking backend and testing services"
            ]),
            test_scenarios_json=json.dumps([
                "docker build succeeds with 0 security warnings",
                "docker run passes healthcheck at /api/v1/health"
            ]),
            estimated_hours=4,
            status="in_progress"
        )
        db.add(task1)

        task2 = db.query(ProofTask).filter(ProofTask.user_id == user.id, ProofTask.skill == "Distributed Systems").first()
        if not task2:
            task2 = ProofTask(
                user_id=user.id,
                assessment_id=assessment.id,
                requirement_id="REQ-X",
                skill="Distributed Systems",
                title="Implement Distributed Rate-Limiter with Redis Token Bucket",
                description="Build a high-throughput middleware applying sliding-window token bucket algorithms to protect public API endpoints against burst traffic.",
                why_it_matters="Demonstrates distributed synchronization skills required by top platform engineering teams.",
                target_file="backend/app/core/rate_limiter.py",
                acceptance_criteria_json=json.dumps([
                    "Token bucket algorithm handles 10,000 req/sec",
                    "Atomic Redis EVAL scripts prevent race conditions"
                ]),
                test_scenarios_json=json.dumps([
                    "Concurrent requests exceeding limit return HTTP 429",
                    "Tokens replenish smoothly according to configured rate"
                ]),
                estimated_hours=6,
                status="pending"
            )
            db.add(task2)
        db.commit()

    # 8. Seed Job Applications
    app1 = db.query(JobApplication).filter(JobApplication.user_id == user.id, JobApplication.company == "Stripe").first()
    if not app1:
        app1 = JobApplication(
            user_id=user.id,
            job_id=job1.id,
            company="Stripe",
            role="Senior Full-Stack Platform Engineer",
            status="interviewing",
            source_url="https://stripe.com/jobs",
            notes="Passed initial technical screen! Recruiter praised verified code citations in FastAPI and SQLAlchemy.",
            match_score=91,
            applied_date="2026-10-10"
        )
        db.add(app1)

        app2 = JobApplication(
            user_id=user.id,
            job_id=None,
            company="Razorpay",
            role="Backend Platform Developer",
            status="applied",
            source_url="https://razorpay.com/jobs",
            notes="Submitted evidence-backed application via Recruiter Share link.",
            match_score=88,
            applied_date="2026-10-14"
        )
        db.add(app2)

        app3 = JobApplication(
            user_id=user.id,
            job_id=None,
            company="Anthropic",
            role="AI Infrastructure Engineer",
            status="saved",
            source_url="https://anthropic.com/careers",
            notes="Target role once Docker/K8s proof task is completed.",
            match_score=84,
            applied_date=None
        )
        db.add(app3)
        db.commit()

    # 9. Seed Roadmap Milestones
    existing_ms = db.query(RoadmapMilestone).filter(RoadmapMilestone.user_id == user.id).count()
    if existing_ms == 0:
        seed_milestones = [
            {
                "week": 1,
                "title": "Evidence Verification & Foundation",
                "role": "Full-Stack Platform Engineer",
                "status": "completed",
                "skills": ["Python", "FastAPI", "SQLAlchemy"],
                "tasks": [
                    {"name": "Audit existing repositories against job criteria", "done": True},
                    {"name": "Extract AST code chunks and eliminate unsupported claims", "done": True}
                ]
            },
            {
                "week": 2,
                "title": "Robust API Contracts & Citation Bounds",
                "role": "Full-Stack Platform Engineer",
                "status": "completed",
                "skills": ["Pydantic v2", "Line Bounds", "Automated Testing"],
                "tasks": [
                    {"name": "Implement deterministic citation validator with line-level bounds", "done": True},
                    {"name": "Add comprehensive pytest suite achieving >90% coverage", "done": True}
                ]
            },
            {
                "week": 3,
                "title": "Change Detection & Evidence Change Ledger",
                "role": "Full-Stack Platform Engineer",
                "status": "in_progress",
                "skills": ["Git Watcher", "Polling", "State Diffing"],
                "tasks": [
                    {"name": "Set up commit-watcher service for tracked branches", "done": True},
                    {"name": "Record Evidence Change Ledger upon commit detection", "done": True}
                ]
            },
            {
                "week": 4,
                "title": "Container Orchestration & Proof Tasks",
                "role": "Full-Stack Platform Engineer",
                "status": "not_started",
                "skills": ["Docker", "Kubernetes", "CI/CD"],
                "tasks": [
                    {"name": "Author multi-stage Dockerfile closing REQ-5 gap", "done": False},
                    {"name": "Deploy production web service with database volume persistence", "done": False}
                ]
            },
            {
                "week": 5,
                "title": "Recruiter Presentation & Technical Defense",
                "role": "Full-Stack Platform Engineer",
                "status": "not_started",
                "skills": ["Interview Rubric", "Architecture Review", "System Design"],
                "tasks": [
                    {"name": "Complete mock interview simulations with rubric feedback", "done": False},
                    {"name": "Share verified recruiter assessment link with hiring managers", "done": False}
                ]
            }
        ]
        for m in seed_milestones:
            rec = RoadmapMilestone(
                user_id=user.id,
                week_number=m["week"],
                title=m["title"],
                target_role=m["role"],
                status=m["status"],
                skills_json=json.dumps(m["skills"]),
                tasks_json=json.dumps(m["tasks"])
            )
            db.add(rec)
        db.commit()

    return {
        "status": "success",
        "message": "Kurukshetra 2026 Judge Scenario successfully seeded!",
        "user": {
            "email": "demo@proofpath.dev",
            "full_name": user.full_name
        },
        "target_job": job1.title,
        "company": job1.company,
        "assessment_id": assessment.id if assessment else None
    }
