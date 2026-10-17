import type {
  AuthResponse,
  User,
  Job,
  Resume,
  Repository,
  Assessment,
  EvidenceReport,
  ChangeEvent,
  MonitoringStatusResponse,
  TrustReport,
  ExtractedRequirementItem,
  CareerProfile,
  ProofTask,
  JobApplication,
  RoadmapMilestone,
  MentorChatResponse,
  InterviewQuestion,
  InterviewEvaluation,
  RecruiterDashboardResponse,
  CollegeDashboardResponse,
  SkillSprintTrack,
  SkillSprintQuestion,
  SkillSprintResult,
  SkillSprintAttempt,
  CareerProofPassport,
  OpportunityRadar,
  SkillProofDiff,
  CareerWhatIf,
  RecruiterChallenge,
  CollegeSprintAssignment
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes(':8000')) 
  ? import.meta.env.VITE_API_URL 
  : '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('proofpath_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('proofpath_token', token);
  }

  public clearToken(): void {
    localStorage.removeItem('proofpath_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('proofpath:auth_expired'));
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail && errorData.detail !== 'Not Found') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (response.status === 404) {
          errorMessage = `Service endpoint not found (${url}). Please verify backend is running on the configured port.`;
        } else {
          errorMessage = errorData.detail || errorMessage;
        }
      } catch {
        if (response.status === 404) {
          errorMessage = `Service endpoint not found (${url}). Please verify backend is running on the configured port.`;
        }
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Health
  async checkHealth() {
    return this.request<{ status: string; service: string; version: string }>('/health');
  }

  // Auth
  async register(data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Jobs
  async importJob(data: {
    source_type: 'pasted' | 'url';
    title?: string;
    company?: string;
    url?: string;
    text?: string;
  }): Promise<Job> {
    return this.request<Job>('/jobs/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async listJobs(): Promise<Job[]> {
    return this.request<Job[]>('/jobs');
  }

  async getJobs(): Promise<Job[]> {
    return this.listJobs();
  }

  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async updateJobRequirements(
    id: string,
    data: { title?: string; company?: string; extracted_requirements: ExtractedRequirementItem[] }
  ): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/requirements`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Résumés
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<Resume>('/resumes', {
      method: 'POST',
      body: formData
    });
  }

  async listResumes(): Promise<Resume[]> {
    return this.request<Resume[]>('/resumes');
  }

  async getResume(id: string): Promise<Resume> {
    return this.request<Resume>(`/resumes/${id}`);
  }

  // Repositories
  async inspectRepository(repoUrl: string, branch?: string): Promise<Repository> {
    return this.request<Repository>('/repositories', {
      method: 'POST',
      body: JSON.stringify({ repo_url: repoUrl, branch })
    });
  }

  async listRepositories(): Promise<Repository[]> {
    return this.request<Repository[]>('/repositories');
  }

  async getRepository(id: string): Promise<Repository> {
    return this.request<Repository>(`/repositories/${id}`);
  }

  // Assessments
  async createAssessment(jobId: string, resumeId: string, repositoryId: string): Promise<Assessment> {
    return this.request<Assessment>('/assessments', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        resume_id: resumeId,
        repository_id: repositoryId
      })
    });
  }

  async listAssessments(): Promise<Assessment[]> {
    return this.request<Assessment[]>('/assessments');
  }

  async getAssessment(id: string): Promise<Assessment> {
    return this.request<Assessment>(`/assessments/${id}`);
  }

  async getAssessmentTrustReport(id: string): Promise<TrustReport> {
    return this.request<TrustReport>(`/assessments/${id}/trust-report`);
  }

  async getSharedAssessment(id: string): Promise<Assessment> {
    return this.request<Assessment>(`/assessments/${id}/shared`);
  }

  async getAssessmentEvidence(id: string): Promise<EvidenceReport> {
    return this.request<EvidenceReport>(`/assessments/${id}/evidence`);
  }

  async getAiHealthDiagnostic(): Promise<any> {
    return this.request<any>('/health/ai');
  }

  // Monitoring & Change Detection
  async getMonitoringStatus(repositoryId: string): Promise<MonitoringStatusResponse> {
    return this.request<MonitoringStatusResponse>(`/monitoring/status/${repositoryId}`);
  }

  async checkMonitoringNow(repositoryId: string, force: boolean = false): Promise<ChangeEvent | null> {
    return this.request<ChangeEvent | null>(`/monitoring/check-now/${repositoryId}?force=${force}`, {
      method: 'POST'
    });
  }

  async listChangeEvents(repositoryId?: string, limit: number = 20): Promise<ChangeEvent[]> {
    const query = repositoryId ? `?repository_id=${repositoryId}&limit=${limit}` : `?limit=${limit}`;
    return this.request<ChangeEvent[]>(`/monitoring/events${query}`);
  }

  async getChangeEvent(eventId: string): Promise<ChangeEvent> {
    return this.request<ChangeEvent>(`/monitoring/events/${eventId}`);
  }

  async updateMonitoringSettings(
    repositoryId: string,
    data: { monitoring_enabled?: boolean; monitoring_interval_seconds?: number }
  ): Promise<MonitoringStatusResponse> {
    return this.request<MonitoringStatusResponse>(`/monitoring/repositories/${repositoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Career Profile
  async getCareerProfile(): Promise<CareerProfile> {
    return this.request<CareerProfile>('/career/profile');
  }

  async updateCareerProfile(data: Partial<CareerProfile>): Promise<CareerProfile> {
    return this.request<CareerProfile>('/career/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Proof Tasks (Gap-to-Proof Planner)
  async getProofTasks(): Promise<ProofTask[]> {
    return this.request<ProofTask[]>('/career/tasks');
  }

  async createProofTask(data: Partial<ProofTask>): Promise<ProofTask> {
    return this.request<ProofTask>('/career/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProofTask(taskId: string, data: { status?: string; estimated_hours?: number }): Promise<ProofTask> {
    return this.request<ProofTask>(`/career/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async generateProofTasksFromAssessment(assessmentId: string): Promise<ProofTask[]> {
    return this.request<ProofTask[]>(`/career/tasks/generate-from-assessment/${assessmentId}`, {
      method: 'POST'
    });
  }

  // Job Applications Tracker
  async getJobApplications(): Promise<JobApplication[]> {
    return this.request<JobApplication[]>('/career/applications');
  }

  async addJobApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    return this.request<JobApplication>('/career/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateJobApplication(appId: string, data: Partial<JobApplication>): Promise<JobApplication> {
    return this.request<JobApplication>(`/career/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteJobApplication(appId: string): Promise<void> {
    await this.request<void>(`/career/applications/${appId}`, {
      method: 'DELETE'
    });
  }

  // Roadmap
  async getRoadmap(): Promise<RoadmapMilestone[]> {
    return this.request<RoadmapMilestone[]>('/career/roadmap');
  }

  // AI Career Mentor
  async chatWithMentor(message: string, assessmentId?: string): Promise<MentorChatResponse> {
    return this.request<MentorChatResponse>('/career/mentor/chat', {
      method: 'POST',
      body: JSON.stringify({ message, assessment_id: assessmentId })
    });
  }

  // Interview Coach
  async getInterviewQuestions(role?: string): Promise<InterviewQuestion[]> {
    const q = role ? `?role=${encodeURIComponent(role)}` : '';
    return this.request<InterviewQuestion[]>(`/career/interview/questions${q}`);
  }

  async evaluateInterviewAnswer(data: {
    role_title: string;
    question: string;
    question_type: string;
    user_answer: string;
  }): Promise<InterviewEvaluation> {
    return this.request<InterviewEvaluation>('/career/interview/evaluate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Recruiter Portal
  async getRecruiterDashboard(): Promise<RecruiterDashboardResponse> {
    return this.request<RecruiterDashboardResponse>('/recruiter/dashboard');
  }

  async updateCandidateStatus(candidateId: string, review_status: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/recruiter/candidates/${candidateId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status })
    });
  }

  // College T&P Portal
  async getCollegeDashboard(): Promise<CollegeDashboardResponse> {
    return this.request<CollegeDashboardResponse>('/college/dashboard');
  }

  // Judge Demo Seeder
  async seedJudgeDemo(): Promise<{ status: string; message: string; target_job: string; assessment_id?: string }> {
    return this.request<{ status: string; message: string; target_job: string; assessment_id?: string }>('/demo/seed', {
      method: 'POST'
    });
  }

  // ==================== SKILL SPRINT ====================
  async getSkillSprintTracks(): Promise<SkillSprintTrack[]> {
    return this.request<SkillSprintTrack[]>('/career/skill-sprint/skills');
  }

  async getSkillSprintQuestions(skill: string): Promise<SkillSprintQuestion[]> {
    return this.request<SkillSprintQuestion[]>(`/career/skill-sprint/questions?skill=${encodeURIComponent(skill)}`);
  }

  async submitSkillSprint(
    skill: string,
    answers: Array<{ question_id: string; answer: string }>,
    target_job_id?: string
  ): Promise<SkillSprintResult> {
    return this.request<SkillSprintResult>('/career/skill-sprint/submit', {
      method: 'POST',
      body: JSON.stringify({ skill, target_job_id, answers })
    });
  }

  async getSkillSprintHistory(): Promise<SkillSprintAttempt[]> {
    return this.request<SkillSprintAttempt[]>('/career/skill-sprint/history');
  }

  // ==================== CAREER PROOF PASSPORT ====================
  async getCareerProofPassport(): Promise<CareerProofPassport> {
    return this.request<CareerProofPassport>('/career/passport');
  }

  async updatePassportSettings(settings: {
    is_public_shared?: boolean;
    share_skill_sprint?: boolean;
    allow_recruiter_challenges?: boolean;
    authorized_recruiter_emails?: string[];
    regenerate_token?: boolean;
  }): Promise<any> {
    return this.request<any>('/career/passport/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  async getPublicPassport(shareToken: string): Promise<CareerProofPassport> {
    return this.request<CareerProofPassport>(`/career/passport/public/${encodeURIComponent(shareToken)}`);
  }

  // ==================== OPPORTUNITY-TO-ACTION RADAR ====================
  async getOpportunityRadar(): Promise<OpportunityRadar> {
    return this.request<OpportunityRadar>('/career/opportunity-radar');
  }

  // ==================== SKILL PROOF DIFF ====================
  async getAssessmentDiff(): Promise<SkillProofDiff> {
    return this.request<SkillProofDiff>('/career/assessments/diff');
  }

  // ==================== CAREER WHAT-IF SIMULATOR ====================
  async simulateWhatIf(currentRole: string, alternativeRole: string): Promise<CareerWhatIf> {
    return this.request<CareerWhatIf>('/career/what-if', {
      method: 'POST',
      body: JSON.stringify({ current_role: currentRole, alternative_role: alternativeRole })
    });
  }

  // ==================== RECRUITER CHALLENGES ====================
  async getRecruiterCandidateSkillSprint(candidateId: string): Promise<any> {
    return this.request<any>(`/recruiter/candidates/${encodeURIComponent(candidateId)}/skill-sprint`);
  }

  async createRecruiterChallenge(data: {
    student_id: string;
    requirement_skill: string;
    challenge_title: string;
    instructions: string;
    acceptance_criteria: string;
  }): Promise<any> {
    return this.request<any>('/recruiter/challenges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getStudentChallenges(): Promise<RecruiterChallenge[]> {
    return this.request<RecruiterChallenge[]>('/career/challenges');
  }

  async submitStudentChallenge(challengeId: string, submission_repo_url: string): Promise<any> {
    return this.request<any>(`/career/challenges/${challengeId}/submit?submission_repo_url=${encodeURIComponent(submission_repo_url)}`, {
      method: 'POST'
    });
  }

  // ==================== COLLEGE SPRINT ASSIGNMENTS & EARLY WARNING ====================
  async getCollegeSprintAssignments(): Promise<CollegeSprintAssignment[]> {
    return this.request<CollegeSprintAssignment[]>('/college/skill-sprint/assignments');
  }

  async createCollegeSprintAssignment(data: { target_batch: string; skill: string; due_date: string }): Promise<any> {
    return this.request<any>('/college/skill-sprint/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCollegeEarlyWarning(): Promise<any> {
    return this.request<any>('/college/early-warning');
  }
}


export const api = new ApiClient();
