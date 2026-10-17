from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class InspectedFileItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    path: str
    size: int = 0
    lines_count: int = 0
    language: str = "Code"

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "path" not in data and "file_path" in data:
                data["path"] = data["file_path"]
            if "size" not in data:
                data["size"] = data.get("file_size", 0)
        return data


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
