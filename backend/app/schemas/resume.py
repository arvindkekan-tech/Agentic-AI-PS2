from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    file_size: int
    mime_type: str
    word_count: int
    char_count: int
    preview_text: str
    metadata: Dict[str, Any]
    created_at: datetime


class ResumeDetailResponse(ResumeResponse):
    extracted_text: str
