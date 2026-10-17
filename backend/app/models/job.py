import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    source_type = Column(String(50), nullable=False)  # "pasted" or "url"
    source_url = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=False)
    extracted_requirements_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="jobs")
    assessments = relationship("Assessment", back_populates="job", cascade="all, delete-orphan")
