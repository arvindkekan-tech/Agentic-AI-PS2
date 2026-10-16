import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    repo_url = Column(String(500), nullable=False)
    owner = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    branch = Column(String(100), nullable=False)
    analyzed_sha = Column(String(40), nullable=False)
    inspected_files_count = Column(Integer, nullable=False, default=0)
    total_files_count = Column(Integer, nullable=False, default=0)
    snapshot_metadata_json = Column(Text, nullable=False, default="{}")

    # Change tracking & monitoring fields
    last_checked_at = Column(DateTime, nullable=True)
    last_observed_head_sha = Column(String(40), nullable=True)
    monitoring_enabled = Column(Boolean, nullable=False, default=True)
    monitoring_interval_seconds = Column(Integer, nullable=False, default=30)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="repositories")
    assessments = relationship("Assessment", back_populates="repository", cascade="all, delete-orphan")
    change_events = relationship("ChangeEvent", back_populates="repository", cascade="all, delete-orphan", order_by="desc(ChangeEvent.created_at)")

