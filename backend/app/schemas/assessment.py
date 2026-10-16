from datetime import datetime
from typing import List, Optional, Dict
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
    created_at: datetime
    updated_at: datetime


class IntegritySignalSchema(BaseModel):
    signal_id: str
    signal_type: str
    severity: str  # "low", "medium", "high"
    reason: str
    observed_evidence: str
    limitation: str


class EvidenceCoverageSchema(BaseModel):
    inspected_files_count: int
    excluded_files_count: int
    total_files_discovered: int
    coverage_ratio: float
    excluded_disclosures: List[str]
    scope_limitations: str


class CitationValiditySchema(BaseModel):
    total_citations_count: int
    verified_citations_count: int
    citation_validity_ratio: float
    all_positive_claims_cited: bool
    citation_audit_notes: List[str]


class AssessmentConfidenceSchema(BaseModel):
    demonstrated_count: int
    partial_or_needs_review_count: int
    unassessed_or_missing_count: int
    average_confidence: float
    uncertainty_disclosure: str


class RepositoryProvenanceSchema(BaseModel):
    pinned_commit_sha: str
    branch: str
    repo_url: str
    commit_timestamp: Optional[str] = None
    commit_author: Optional[str] = None
    provenance_verified: bool


class TrustReportResponse(BaseModel):
    assessment_id: str
    evidence_coverage: EvidenceCoverageSchema
    citation_validity: CitationValiditySchema
    assessment_confidence: AssessmentConfidenceSchema
    provenance: RepositoryProvenanceSchema
    integrity_signals: List[IntegritySignalSchema]
    internal_evidence_index: float
    formula_explanation: str
    disclaimer: str


class AssessmentDetailResponse(AssessmentResponse):
    job: Optional[JobResponse] = None
    resume: Optional[ResumeResponse] = None
    repository: Optional[RepositoryResponse] = None
    requirements: List[RequirementAssessmentResponse] = []
    trust_report: Optional[TrustReportResponse] = None


class EvidenceResponse(BaseModel):
    assessment_id: str
    analyzed_sha: str
    total_citations: int
    valid_citations_count: int
    citations: List[CitationResponse]

