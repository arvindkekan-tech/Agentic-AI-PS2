export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'student' | 'recruiter' | 'college_tp' | string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ExtractedRequirementItem {
  id: string;
  original_wording: string;
  normalized_skill: string;
  priority_type: string; // 'required' | 'preferred'
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  source_type: 'pasted' | 'url';
  source_url?: string;
  raw_text: string;
  extracted_requirements: ExtractedRequirementItem[];
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  word_count: number;
  char_count: number;
  preview_text: string;
  metadata: Record<string, any>;
  created_at: string;
  extracted_text?: string;
}

export interface ParsedResumeProfile {
  name?: string;
  headline?: string;
  target_role?: string;
  bio?: string;
  email?: string;
  phone?: string;
  github_username?: string;
  skills: Array<{ name: string; level: string; category: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  preferred_locations?: string[];
}

export interface ResumeUploadParseResponse {
  resume: Resume;
  parsed_profile: ParsedResumeProfile;
}

export interface InspectedFileItem {
  path: string;
  size: number;
  lines_count: number;
  language: string;
}

export interface ExcludedFileItem {
  path: string;
  reason: string;
}

export interface SnapshotCoverage {
  inspected_files_count: number;
  excluded_files_count: number;
  total_files_count: number;
  inspected_lines_total: number;
  languages_detected: string[];
  limitations: string[];
}

export interface Repository {
  id: string;
  user_id: string;
  repo_url: string;
  owner: string;
  name: string;
  branch: string;
  analyzed_sha: string;
  inspected_files_count: number;
  total_files_count: number;
  inspected_files: InspectedFileItem[];
  excluded_files: ExcludedFileItem[];
  coverage: SnapshotCoverage;
  created_at: string;
}

export type AssessmentStatus =
  | 'demonstrated'
  | 'partial_or_needs_review'
  | 'not_demonstrated_in_analyzed_scope'
  | 'unable_to_assess';

export type EvidenceType =
  | 'implementation'
  | 'test_code'
  | 'configuration'
  | 'documentation'
  | 'resume_claim';

export interface Citation {
  id: string;
  evidence_type: EvidenceType;
  repo_url?: string;
  branch?: string;
  commit_sha?: string;
  file_path?: string;
  start_line?: number;
  end_line?: number;
  excerpt: string;
  commit_url?: string;
  is_valid: boolean;
  validation_note: string;
}

export interface RequirementAssessment {
  id: string;
  requirement_id: string;
  original_wording: string;
  normalized_skill: string;
  priority_type: string;
  
  resume_status: AssessmentStatus;
  resume_explanation: string;
  
  repo_status: AssessmentStatus;
  repo_explanation: string;
  
  combined_status: AssessmentStatus;
  combined_interpretation: string;
  
  limitations_note: string;
  improvement_action?: string;
  
  citations: Citation[];
}

export interface Assessment {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string;
  repository_id: string;
  status: AssessmentStatus;
  processing_status: 'queued' | 'running' | 'completed' | 'failed' | 'stale';
  error_message?: string;
  provider_name: string;
  model_name: string;
  summary_counts: {
    demonstrated?: number;
    partial_or_needs_review?: number;
    not_demonstrated_in_analyzed_scope?: number;
    unable_to_assess?: number;
  };
  created_at: string;
  updated_at: string;
  job?: Job;
  resume?: Resume;
  repository?: Repository;
  requirements?: RequirementAssessment[];
  trust_report?: TrustReport;
}

export interface IntegritySignal {
  signal_id: string;
  signal_type: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  observed_evidence: string;
  limitation: string;
}

export interface EvidenceCoverage {
  inspected_files_count: number;
  excluded_files_count: number;
  total_files_discovered: number;
  coverage_ratio: number;
  excluded_disclosures: string[];
  scope_limitations: string;
}

export interface CitationValidity {
  total_citations_count: number;
  verified_citations_count: number;
  citation_validity_ratio: number;
  all_positive_claims_cited: boolean;
  citation_audit_notes: string[];
}

export interface AssessmentConfidence {
  demonstrated_count: number;
  partial_or_needs_review_count: number;
  unassessed_or_missing_count: number;
  average_confidence: number;
  uncertainty_disclosure: string;
}

export interface RepositoryProvenance {
  pinned_commit_sha: string;
  branch: string;
  repo_url: string;
  commit_timestamp?: string;
  commit_author?: string;
  provenance_verified: boolean;
}

export interface TrustReport {
  assessment_id: string;
  evidence_coverage: EvidenceCoverage;
  citation_validity: CitationValidity;
  assessment_confidence: AssessmentConfidence;
  provenance: RepositoryProvenance;
  integrity_signals: IntegritySignal[];
  internal_evidence_index: number;
  formula_explanation: string;
  disclaimer: string;
}

export interface EvidenceReport {
  assessment_id: string;
  analyzed_sha: string;
  total_citations: number;
  valid_citations_count: number;
  citations: Citation[];
}

export interface ChangedFileItem {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface RequirementDiffItem {
  requirement_id: string;
  skill: string;
  previous_status: AssessmentStatus;
  current_status: AssessmentStatus;
  status_delta: 'improved' | 'regressed' | 'unchanged';
  previous_citations_count: number;
  current_citations_count: number;
  citations_diff_summary?: string;
}

export interface ChangeEvent {
  id: string;
  repository_id: string;
  assessment_id?: string;
  previous_assessment_id?: string;
  branch: string;
  commit_sha: string;
  parent_sha?: string;
  commit_message?: string;
  commit_author?: string;
  commit_url?: string;
  changed_files: ChangedFileItem[];
  status: 'detected' | 'running' | 'completed' | 'failed';
  summary?: string;
  error_message?: string;
  before_after_diff: RequirementDiffItem[];
  created_at: string;
  updated_at: string;
}

export interface MonitoringStatusResponse {
  repository_id: string;
  repo_url: string;
  branch: string;
  analyzed_sha: string;
  last_observed_head_sha?: string;
  last_checked_at?: string;
  monitoring_enabled: boolean;
  monitoring_interval_seconds: number;
  latest_event?: ChangeEvent;
  events_count: number;
}

export interface CareerProfile {
  id: string;
  user_id: string;
  headline: string;
  target_role: string;
  bio?: string;
  education: Array<{ institution: string; degree: string; year: string; gpa: string }>;
  skills: Array<{ name: string; level: string; verified: boolean }>;
  github_username?: string;
  preferred_locations: string[];
}

export interface ProofTask {
  id: string;
  user_id: string;
  assessment_id?: string;
  requirement_id?: string;
  skill: string;
  title: string;
  description: string;
  why_it_matters: string;
  target_file?: string;
  acceptance_criteria: string[];
  test_scenarios: string[];
  estimated_hours: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id?: string;
  company: string;
  role: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  source_url?: string;
  notes?: string;
  match_score?: number;
  applied_date?: string;
  created_at: string;
}

export interface RoadmapMilestone {
  id: string;
  user_id: string;
  week_number: number;
  title: string;
  target_role: string;
  status: 'not_started' | 'in_progress' | 'completed';
  skills: string[];
  tasks: Array<{ name: string; done: boolean }>;
}

export interface MentorChatResponse {
  reply: string;
  suggested_actions: Array<{ label: string; action: string; target?: string; text?: string }>;
  evidence_citations: Array<{ skill: string; file: string; lines: string; excerpt: string }>;
  provider: string;
}

export interface InterviewQuestion {
  id: string;
  type: string;
  question: string;
  context: string;
  rubric: {
    criteria: string[];
    max_score: number;
  };
}

export interface InterviewEvaluation {
  id: string;
  role_title: string;
  question: string;
  user_answer: string;
  feedback: string;
  rubric_scores: Record<string, number>;
  overall_score: number;
}

export interface RecruiterCandidate {
  id: string;
  name: string;
  email: string;
  target_role: string;
  institution: string;
  match_rate: number;
  verified_citations_count: number;
  provenance_status: string;
  review_status: 'new' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected';
  evidence_coverage: number;
  latest_commit_sha: string;
  assessment_id?: string;
}

export interface RecruiterDashboardResponse {
  active_requisitions_count: number;
  total_candidates_count: number;
  verified_candidates_count: number;
  average_match_rate: number;
  candidates: RecruiterCandidate[];
}

export interface CollegeStudentBatchItem {
  id: string;
  name: string;
  roll_number: string;
  department: string;
  target_role: string;
  readiness_tier: string;
  evidence_score: number;
  verified_citations: number;
  top_skill_gap: string;
  active_proof_tasks: number;
  target_company: string;
}

export interface SkillGapMetric {
  skill: string;
  frequency_percentage: number;
  unverified_students_count: number;
  recommended_workshop: string;
}

export interface CollegeDashboardResponse {
  institution_name: string;
  batch_year: string;
  total_students_registered: number;
  placement_ready_percentage: number;
  average_evidence_score: number;
  top_skill_gaps: SkillGapMetric[];
  students: CollegeStudentBatchItem[];
}

export interface SkillSprintTrack {
  skill: string;
  category: string;
  icon: string;
  questions_count: number;
}

export interface SkillSprintQuestion {
  id: string;
  skill: string;
  question_type: 'multiple_choice' | 'code_reading' | 'debugging' | 'short_answer';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  prompt: string;
  code_snippet?: string;
  options: string[];
  concept_tag: string;
  version: number;
}

export interface SkillSprintResultDetail {
  question_id: string;
  title: string;
  prompt: string;
  code_snippet?: string;
  options: string[];
  user_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  concept_tag: string;
}

export interface SkillSprintResult {
  id: string;
  skill: string;
  target_job_id?: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  strengths: string[];
  weak_concepts: string[];
  recommended_task?: {
    id: string;
    title: string;
    skill: string;
    target_file?: string;
    status: string;
    action: string;
  };
  review_details: SkillSprintResultDetail[];
  created_at: string;
}

export interface SkillSprintAttempt {
  id: string;
  skill: string;
  score_percent: number;
  total_questions: number;
  correct_answers: number;
  strengths: string[];
  weak_concepts: string[];
  created_at: string;
}

export interface CareerProofPassport {
  user_id: string;
  student_name: string;
  target_role: string;
  headline: string;
  github_username?: string;
  share_token: string;
  share_url: string;
  is_public_shared: boolean;
  share_skill_sprint: boolean;
  allow_recruiter_challenges: boolean;
  evidence_coverage_percent: number;
  demonstrated_skills: string[];
  partially_demonstrated_skills: string[];
  validated_citations: Array<{
    file_path: string;
    start_line: number;
    end_line: number;
    commit_sha: string;
    symbol_name: string;
    validation_status: string;
  }>;
  completed_proof_tasks: Array<{
    id: string;
    title: string;
    skill: string;
    target_file?: string;
    status: string;
  }>;
  skill_sprint_badges: Array<{
    id: string;
    skill: string;
    score_percent: number;
    date: string;
    badge_level: string;
    type: string;
  }>;
  assessment_history: Array<{
    id: string;
    score: number;
    coverage: number;
    date: string;
    model: string;
  }>;
  limitations: string[];
}

export interface OpportunityRadarItem {
  job_id: string;
  title: string;
  company: string;
  location: string;
  match_score: number;
  new_requirements: string[];
  already_proved_skills: string[];
  priority_gaps: string[];
  recommended_action: string;
  is_live: boolean;
}

export interface OpportunityRadar {
  market_summary: string;
  target_role: string;
  opportunities: OpportunityRadarItem[];
  trending_skills: Array<{ skill: string; growth_delta: string; relevance: string }>;
}

export interface SkillProofDiff {
  previous_assessment_id?: string;
  current_assessment_id: string;
  previous_score?: number;
  current_score: number;
  score_delta: number;
  newly_demonstrated_skills: string[];
  stale_or_invalidated_skills: string[];
  new_citations_count: number;
  completed_tasks_applied: string[];
  remaining_critical_gaps: string[];
  explanation: string;
}

export interface CareerWhatIf {
  current_role: string;
  alternative_role: string;
  current_evidence_score: number;
  alternative_evidence_score: number;
  shared_skills: string[];
  role_specific_gaps: string[];
  high_leverage_tasks: Array<{ title: string; skill: string; impact: string; hours: number }>;
  estimated_weeks_to_ready: number;
}

export interface RecruiterChallenge {
  id: string;
  recruiter_id: string;
  student_id: string;
  requirement_skill: string;
  challenge_title: string;
  instructions: string;
  acceptance_criteria: string;
  submission_repo_url?: string;
  status: string;
  evaluation_notes?: string;
  created_at: string;
}

export interface CollegeSprintAssignment {
  id: string;
  target_batch: string;
  skill: string;
  due_date: string;
  created_at: string;
  completion_rate: string;
  status: string;
}



