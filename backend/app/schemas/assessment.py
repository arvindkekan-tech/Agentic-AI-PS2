from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.job import JobResponse
from app.schemas.resume import ResumeResponse
from app.schemas.repository import RepositoryResponse


class CitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_type: str  # "implementation", "test_code", "configuration", "documentation", "resume_claim"
    repo_url: Optional[str] = None
    branch: Optional[str] = None
    commit_sha: Optional[str] = None
    file_path: Optional[str] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    excerpt: str
    commit_url: Optional[str] = None
    is_valid: bool
    validation_note: str


class RequirementAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requirement_id: str
    original_wording: str
    normalized_skill: str
    priority_type: str
    weight: int = 2
    
    resume_status: str
    resume_explanation: str
    
    repo_status: str
    repo_explanation: str
    
    combined_status: str
    combined_interpretation: str
    
    limitations_note: str
    improvement_action: Optional[str] = None
    
    citations: List[CitationResponse] = []


class AssessmentCreateRequest(BaseModel):
    job_id: str
    resume_id: str
    repository_id: str


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    job_id: str
    resume_id: str
    repository_id: str
    status: str
    processing_status: str
    error_message: Optional[str] = None
    provider_name: str
    model_name: str
    summary_counts: Dict[str, int]
    
    # Phase 2 Analytics
    compatibility_score: float = 0.0
    evidence_coverage: float = 0.0
    evidence_match_score: float = 0.0
    resume_alignment_score: float = 0.0
    
    created_at: datetime
    updated_at: datetime


class AssessmentDetailResponse(AssessmentResponse):
    job: Optional[JobResponse] = None
    resume: Optional[ResumeResponse] = None
    repository: Optional[RepositoryResponse] = None
    requirements: List[RequirementAssessmentResponse] = []
    
    # Phase 2 Detailed Intelligence
    scoring_metadata: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    alignment_matrix: Optional[List[Dict[str, Any]]] = None
    file_findings: Optional[List[Dict[str, Any]]] = None


class EvidenceResponse(BaseModel):
    assessment_id: str
    analyzed_sha: str
    total_citations: int
    valid_citations_count: int
    citations: List[CitationResponse]
