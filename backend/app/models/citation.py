import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requirement_assessment_id = Column(String(36), ForeignKey("requirement_assessments.id"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False)  # "implementation", "test_code", "configuration", "documentation", "resume_claim"
    repo_url = Column(String(500), nullable=True)
    branch = Column(String(100), nullable=True)
    commit_sha = Column(String(40), nullable=True)
    file_path = Column(String(500), nullable=True)
    start_line = Column(Integer, nullable=True)
    end_line = Column(Integer, nullable=True)
    excerpt = Column(Text, nullable=False)
    commit_url = Column(String(1000), nullable=True)
    is_valid = Column(Boolean, nullable=False, default=False)
    validation_note = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    requirement_assessment = relationship("RequirementAssessment", back_populates="citations")
