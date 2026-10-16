import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id"), nullable=False, index=True)
    repository_id = Column(String(36), ForeignKey("repositories.id"), nullable=False, index=True)
    
    # Overall summary status
    status = Column(String(50), nullable=False, default="partial_or_needs_review")
    processing_status = Column(String(50), nullable=False, default="completed")  # "queued", "running", "completed", "failed", "stale"
    error_message = Column(Text, nullable=True)
    
    provider_name = Column(String(50), nullable=False, default="deterministic")
    model_name = Column(String(100), nullable=False, default="heuristic-v1")
    summary_counts_json = Column(Text, nullable=False, default="{}")
    
    # Phase 2 Advanced Career Intelligence Metrics
    compatibility_score = Column(Float, nullable=False, default=0.0)
    evidence_coverage = Column(Float, nullable=False, default=0.0)
    evidence_match_score = Column(Float, nullable=False, default=0.0)
    resume_alignment_score = Column(Float, nullable=False, default=0.0)
    scoring_metadata_json = Column(Text, nullable=False, default="{}")
    recommendations_json = Column(Text, nullable=False, default="[]")
    alignment_matrix_json = Column(Text, nullable=False, default="[]")
    file_findings_json = Column(Text, nullable=False, default="[]")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="assessments")
    job = relationship("Job", back_populates="assessments")
    resume = relationship("Resume", back_populates="assessments")
    repository = relationship("Repository", back_populates="assessments")
    requirements = relationship("RequirementAssessment", back_populates="assessment", cascade="all, delete-orphan", order_by="RequirementAssessment.requirement_id")
