import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class RequirementAssessment(Base):
    __tablename__ = "requirement_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False, index=True)
    requirement_id = Column(String(50), nullable=False)  # e.g., "REQ-1"
    original_wording = Column(Text, nullable=False)
    normalized_skill = Column(String(255), nullable=False)
    priority_type = Column(String(50), nullable=False, default="required")  # "required", "preferred"
    
    # Résumé finding
    resume_status = Column(String(50), nullable=False)  # demonstrated, partial_or_needs_review, not_demonstrated_in_analyzed_scope, unable_to_assess
    resume_explanation = Column(Text, nullable=False)
    
    # Repository finding
    repo_status = Column(String(50), nullable=False)
    repo_explanation = Column(Text, nullable=False)
    
    # Combined interpretation
    combined_status = Column(String(50), nullable=False)
    combined_interpretation = Column(Text, nullable=False)
    
    # Limitations & Action
    limitations_note = Column(Text, nullable=False)
    improvement_action = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    assessment = relationship("Assessment", back_populates="requirements")
    citations = relationship("Citation", back_populates="requirement_assessment", cascade="all, delete-orphan")
