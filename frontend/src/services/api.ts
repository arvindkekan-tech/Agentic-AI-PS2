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
  ExtractedRequirementItem
} from '../types';


const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

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
}


export const api = new ApiClient();
