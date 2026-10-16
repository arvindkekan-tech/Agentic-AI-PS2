from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ExtractedRequirementItem(BaseModel):
    id: str = Field(..., description="Unique ID for requirement e.g. REQ-1")
    original_wording: str = Field(..., description="Exact or grounded text from job description")
    normalized_skill: str = Field(..., description="Normalized standard skill name e.g. FastAPI, TypeScript")
    priority_type: str = Field("required", description="required or preferred")


class JobImportRequest(BaseModel):
    source_type: str = Field(..., description="'pasted' or 'url'")
    title: Optional[str] = Field(None, description="Job title, inferred if omitted")
    company: Optional[str] = Field(None, description="Company name")
    url: Optional[str] = Field(None, description="Public job URL (validated with SSRF protection)")
    text: Optional[str] = Field(None, description="Pasted job description text")


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    company: Optional[str] = None
    source_type: str
    source_url: Optional[str] = None
    raw_text: str
    extracted_requirements: List[ExtractedRequirementItem]
    created_at: datetime
