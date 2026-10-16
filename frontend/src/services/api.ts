import type {
  AuthResponse,
  User,
  Job,
  Resume,
  Repository,
  Assessment,
  EvidenceReport
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
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Non-JSON response
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

  async getAssessmentEvidence(id: string): Promise<EvidenceReport> {
    return this.request<EvidenceReport>(`/assessments/${id}/evidence`);
  }
}

export const api = new ApiClient();
