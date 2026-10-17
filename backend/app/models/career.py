import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class CareerProfile(Base):
    __tablename__ = "career_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    headline = Column(String(255), nullable=True, default="Aspiring Full-Stack Platform Engineer")
    target_role = Column(String(255), nullable=True, default="Full-Stack Platform Engineer")
    bio = Column(Text, nullable=True)
    education_json = Column(Text, nullable=False, default="[]")
    skills_json = Column(Text, nullable=False, default="[]")
    github_username = Column(String(100), nullable=True)
    preferred_locations_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class ProofTask(Base):
    __tablename__ = "proof_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(String(36), nullable=True, index=True)
    requirement_id = Column(String(50), nullable=True)
    skill = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    target_file = Column(String(500), nullable=True)
    acceptance_criteria_json = Column(Text, nullable=False, default="[]")
    test_scenarios_json = Column(Text, nullable=False, default="[]")
    estimated_hours = Column(Integer, nullable=False, default=4)
    status = Column(String(50), nullable=False, default="pending")  # pending, in_progress, completed, dismissed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(36), nullable=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="applied")  # saved, applied, interviewing, offer, rejected
    source_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    match_score = Column(Integer, nullable=True, default=85)
    applied_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class RoadmapMilestone(Base):
    __tablename__ = "roadmap_milestones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="not_started")  # not_started, in_progress, completed
    skills_json = Column(Text, nullable=False, default="[]")
    tasks_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role_title = Column(String(255), nullable=False)
    question_type = Column(String(50), nullable=False, default="technical")
    question = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=False)
    feedback = Column(Text, nullable=False)
    rubric_scores_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class SkillSprintQuestion(Base):
    __tablename__ = "skill_sprint_questions"

    id = Column(String(50), primary_key=True)  # stable deterministic ID
    skill = Column(String(100), nullable=False, index=True)
    question_type = Column(String(50), nullable=False, default="multiple_choice")  # multiple_choice, code_reading, debugging, short_answer
    difficulty = Column(String(50), nullable=False, default="intermediate")  # beginner, intermediate, advanced
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options_json = Column(Text, nullable=False, default="[]")
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    rubric_json = Column(Text, nullable=False, default="{}")
    concept_tag = Column(String(100), nullable=False, default="general")
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class SkillSprintAttempt(Base):
    __tablename__ = "skill_sprint_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    skill = Column(String(100), nullable=False, index=True)
    target_job_id = Column(String(36), nullable=True)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percent = Column(Integer, nullable=False)
    strengths_json = Column(Text, nullable=False, default="[]")
    weak_concepts_json = Column(Text, nullable=False, default="[]")
    user_answers_json = Column(Text, nullable=False, default="{}")
    review_details_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class SkillSprintAssignment(Base):
    __tablename__ = "skill_sprint_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assigned_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    target_batch = Column(String(100), nullable=False, index=True)
    skill = Column(String(100), nullable=False)
    due_date = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class CareerProofPassport(Base):
    __tablename__ = "career_proof_passports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    share_token = Column(String(64), nullable=False, unique=True, index=True)
    is_public_shared = Column(Integer, nullable=False, default=0)
    authorized_recruiter_emails_json = Column(Text, nullable=False, default="[]")
    share_skill_sprint = Column(Integer, nullable=False, default=1)
    allow_recruiter_challenges = Column(Integer, nullable=False, default=1)
    views_count = Column(Integer, nullable=False, default=0)
    last_shared_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class RecruiterChallenge(Base):
    __tablename__ = "recruiter_challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recruiter_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(36), nullable=True)
    requirement_skill = Column(String(100), nullable=False)
    challenge_title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    acceptance_criteria = Column(Text, nullable=False)
    submission_repo_url = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="requested")  # requested, accepted, submitted, verified, rejected
    evaluation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class OpportunitySnapshot(Base):
    __tablename__ = "opportunity_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role_title = Column(String(255), nullable=False, index=True)
    source_market = Column(String(100), nullable=False, default="Global Tech Hubs / Seeded")
    demanded_skills_json = Column(Text, nullable=False, default="[]")
    trending_delta_json = Column(Text, nullable=False, default="{}")
    retrieved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

