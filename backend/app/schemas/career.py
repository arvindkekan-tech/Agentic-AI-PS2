from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CareerProfileUpdate(BaseModel):
    headline: Optional[str] = None
    target_role: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[Dict[str, Any]]] = None
    github_username: Optional[str] = None
    preferred_locations: Optional[List[str]] = None


class CareerProfileResponse(BaseModel):
    id: str
    user_id: str
    headline: str
    target_role: str
    bio: Optional[str] = None
    education: List[Dict[str, Any]] = []
    skills: List[Dict[str, Any]] = []
    github_username: Optional[str] = None
    preferred_locations: List[str] = []


class ProofTaskCreate(BaseModel):
    assessment_id: Optional[str] = None
    requirement_id: Optional[str] = None
    skill: str
    title: str
    description: str
    why_it_matters: str
    target_file: Optional[str] = None
    acceptance_criteria: List[str] = []
    test_scenarios: List[str] = []
    estimated_hours: int = 4


class ProofTaskUpdate(BaseModel):
    status: Optional[str] = None  # pending, in_progress, completed, dismissed
    estimated_hours: Optional[int] = None


class ProofTaskResponse(BaseModel):
    id: str
    user_id: str
    assessment_id: Optional[str] = None
    requirement_id: Optional[str] = None
    skill: str
    title: str
    description: str
    why_it_matters: str
    target_file: Optional[str] = None
    acceptance_criteria: List[str] = []
    test_scenarios: List[str] = []
    estimated_hours: int = 4
    status: str
    created_at: str


class JobApplicationCreate(BaseModel):
    job_id: Optional[str] = None
    company: str
    role: str
    status: str = "applied"
    source_url: Optional[str] = None
    notes: Optional[str] = None
    match_score: Optional[int] = 85
    applied_date: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    match_score: Optional[int] = None


class JobApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_id: Optional[str] = None
    company: str
    role: str
    status: str
    source_url: Optional[str] = None
    notes: Optional[str] = None
    match_score: Optional[int] = None
    applied_date: Optional[str] = None
    created_at: str


class RoadmapMilestoneResponse(BaseModel):
    id: str
    user_id: str
    week_number: int
    title: str
    target_role: str
    status: str
    skills: List[str] = []
    tasks: List[Dict[str, Any]] = []


class MentorChatRequest(BaseModel):
    message: str
    assessment_id: Optional[str] = None


class MentorChatResponse(BaseModel):
    reply: str
    suggested_actions: List[Dict[str, Any]] = []
    evidence_citations: List[Dict[str, Any]] = []
    provider: str


class InterviewEvaluateRequest(BaseModel):
    role_title: str
    question: str
    question_type: str = "technical"
    user_answer: str


class InterviewEvaluateResponse(BaseModel):
    id: str
    role_title: str
    question: str
    user_answer: str
    feedback: str
    rubric_scores: Dict[str, int]
    overall_score: int


# ==================== SKILL SPRINT SCHEMAS ====================

class SkillSprintQuestionOut(BaseModel):
    id: str
    skill: str
    question_type: str  # multiple_choice, code_reading, debugging, short_answer
    difficulty: str
    title: str
    prompt: str
    code_snippet: Optional[str] = None
    options: List[str] = []
    concept_tag: str
    version: int = 1


class SkillSprintAnswer(BaseModel):
    question_id: str
    answer: str


class SkillSprintSubmitIn(BaseModel):
    skill: str
    target_job_id: Optional[str] = None
    answers: List[SkillSprintAnswer]


class SkillSprintResultDetail(BaseModel):
    question_id: str
    title: str
    prompt: str
    code_snippet: Optional[str] = None
    options: List[str] = []
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: str
    concept_tag: str


class SkillSprintResultOut(BaseModel):
    id: str
    skill: str
    target_job_id: Optional[str] = None
    total_questions: int
    correct_answers: int
    score_percent: int
    strengths: List[str]
    weak_concepts: List[str]
    recommended_task: Optional[Dict[str, Any]] = None
    review_details: List[SkillSprintResultDetail]
    created_at: str


class SkillSprintAttemptSummary(BaseModel):
    id: str
    skill: str
    score_percent: int
    total_questions: int
    correct_answers: int
    strengths: List[str] = []
    weak_concepts: List[str] = []
    created_at: str


# ==================== CAREER PROOF PASSPORT SCHEMAS ====================

class CareerProofPassportOut(BaseModel):
    user_id: str
    student_name: str
    target_role: str
    headline: str
    github_username: Optional[str] = None
    share_token: str
    share_url: str
    is_public_shared: bool
    share_skill_sprint: bool
    allow_recruiter_challenges: bool
    evidence_coverage_percent: int
    demonstrated_skills: List[str] = []
    partially_demonstrated_skills: List[str] = []
    validated_citations: List[Dict[str, Any]] = []
    completed_proof_tasks: List[Dict[str, Any]] = []
    skill_sprint_badges: List[Dict[str, Any]] = []
    assessment_history: List[Dict[str, Any]] = []
    limitations: List[str] = []


class PassportShareSettingsIn(BaseModel):
    is_public_shared: Optional[bool] = None
    share_skill_sprint: Optional[bool] = None
    allow_recruiter_challenges: Optional[bool] = None
    authorized_recruiter_emails: Optional[List[str]] = None
    regenerate_token: Optional[bool] = False


# ==================== OPPORTUNITY-TO-ACTION RADAR SCHEMAS ====================

class OpportunityRadarItem(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    match_score: int
    new_requirements: List[str] = []
    already_proved_skills: List[str] = []
    priority_gaps: List[str] = []
    recommended_action: str
    is_live: bool = False


class OpportunityRadarOut(BaseModel):
    market_summary: str
    target_role: str
    opportunities: List[OpportunityRadarItem]
    trending_skills: List[Dict[str, Any]] = []


# ==================== SKILL PROOF DIFF SCHEMAS ====================

class SkillProofDiffOut(BaseModel):
    previous_assessment_id: Optional[str] = None
    current_assessment_id: str
    previous_score: Optional[int] = None
    current_score: int
    score_delta: int
    newly_demonstrated_skills: List[str] = []
    stale_or_invalidated_skills: List[str] = []
    new_citations_count: int = 0
    completed_tasks_applied: List[str] = []
    remaining_critical_gaps: List[str] = []
    explanation: str


# ==================== CAREER WHAT-IF SIMULATOR SCHEMAS ====================

class CareerWhatIfIn(BaseModel):
    current_role: str
    alternative_role: str


class CareerWhatIfOut(BaseModel):
    current_role: str
    alternative_role: str
    current_evidence_score: int
    alternative_evidence_score: int
    shared_skills: List[str] = []
    role_specific_gaps: List[str] = []
    high_leverage_tasks: List[Dict[str, Any]] = []
    estimated_weeks_to_ready: int


# ==================== RECRUITER CHALLENGE SCHEMAS ====================

class RecruiterChallengeIn(BaseModel):
    student_id: str
    requirement_skill: str
    challenge_title: str
    instructions: str
    acceptance_criteria: str


class RecruiterChallengeOut(BaseModel):
    id: str
    recruiter_id: str
    student_id: str
    requirement_skill: str
    challenge_title: str
    instructions: str
    acceptance_criteria: str
    submission_repo_url: Optional[str] = None
    status: str
    evaluation_notes: Optional[str] = None
    created_at: str

