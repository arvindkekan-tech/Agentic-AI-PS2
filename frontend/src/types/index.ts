export interface User {
  id: string;
  email: string;
  full_name?: string;
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

