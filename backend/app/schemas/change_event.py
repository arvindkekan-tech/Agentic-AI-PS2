from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ChangedFileItem(BaseModel):
    filename: str
    status: str = "modified"  # "added", "modified", "removed", "renamed"
    additions: int = 0
    deletions: int = 0


class RequirementDiffItem(BaseModel):
    requirement_id: str
    skill: str
    previous_status: str
    current_status: str
    status_delta: str = "unchanged"  # "improved", "regressed", "unchanged"
    previous_citations_count: int = 0
    current_citations_count: int = 0
    citations_diff_summary: Optional[str] = None


class ChangeEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    repository_id: str
    assessment_id: Optional[str] = None
    previous_assessment_id: Optional[str] = None
    branch: str
    commit_sha: str
    parent_sha: Optional[str] = None
    commit_message: Optional[str] = None
    commit_author: Optional[str] = None
    commit_url: Optional[str] = None
    changed_files: List[ChangedFileItem] = []
    status: str  # "detected", "running", "completed", "failed"
    summary: Optional[str] = None
    error_message: Optional[str] = None
    before_after_diff: List[RequirementDiffItem] = []
    created_at: datetime
    updated_at: datetime


class MonitoringStatusResponse(BaseModel):
    repository_id: str
    repo_url: str
    branch: str
    analyzed_sha: str
    last_observed_head_sha: Optional[str] = None
    last_checked_at: Optional[datetime] = None
    monitoring_enabled: bool = True
    monitoring_interval_seconds: int = 30
    latest_event: Optional[ChangeEventResponse] = None
    events_count: int = 0


class MonitoringUpdateRequest(BaseModel):
    monitoring_enabled: Optional[bool] = None
    monitoring_interval_seconds: Optional[int] = None
