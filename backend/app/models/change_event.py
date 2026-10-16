import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id = Column(String(36), ForeignKey("repositories.id"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=True, index=True)
    previous_assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=True)

    branch = Column(String(100), nullable=False)
    commit_sha = Column(String(40), nullable=False, index=True)
    parent_sha = Column(String(40), nullable=True)
    commit_message = Column(Text, nullable=True)
    commit_author = Column(String(150), nullable=True)
    commit_url = Column(String(500), nullable=True)

    # JSON lists
    changed_files_json = Column(Text, nullable=False, default="[]")
    before_after_diff_json = Column(Text, nullable=False, default="[]")

    # State: "detected", "running", "completed", "failed"
    status = Column(String(50), nullable=False, default="detected", index=True)
    summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    repository = relationship("Repository", back_populates="change_events")
    assessment = relationship("Assessment", foreign_keys=[assessment_id])
    previous_assessment = relationship("Assessment", foreign_keys=[previous_assessment_id])
