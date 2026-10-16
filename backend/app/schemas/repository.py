from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class InspectedFileItem(BaseModel):
    path: str
    size: int
    lines_count: int
    language: str


class ExcludedFileItem(BaseModel):
    path: str
    reason: str


class SnapshotCoverage(BaseModel):
    inspected_files_count: int
    excluded_files_count: int
    total_files_count: int
    inspected_lines_total: int
    languages_detected: List[str]
    limitations: List[str]


class RepositoryInspectRequest(BaseModel):
    repo_url: str = Field(..., description="Public GitHub repository URL (e.g. https://github.com/owner/repo)")
    branch: Optional[str] = Field(None, description="Branch to analyze (defaults to default branch or main)")


class RepositoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    repo_url: str
    owner: str
    name: str
    branch: str
    analyzed_sha: str
    inspected_files_count: int
    total_files_count: int
    inspected_files: List[InspectedFileItem]
    excluded_files: List[ExcludedFileItem]
    coverage: SnapshotCoverage
    created_at: datetime
    last_checked_at: Optional[datetime] = None
    last_observed_head_sha: Optional[str] = None
    monitoring_enabled: bool = True
    monitoring_interval_seconds: int = 30

