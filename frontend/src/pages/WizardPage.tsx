import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import type { Job, Resume, Repository } from '../types';

export const WizardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Wizard Step: 1, 2, 3, 4
  const [step, setStep] = useState<number>(1);

  // Step 1: Job state
  const [jobSourceType, setJobSourceType] = useState<'pasted' | 'url'>('pasted');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  // Step 2: Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [createdResume, setCreatedResume] = useState<Resume | null>(null);

  // Step 3: Repo state
  const [repoUrl, setRepoUrl] = useState('');
  const [repoBranch, setRepoBranch] = useState('');
  const [createdRepo, setCreatedRepo] = useState<Repository | null>(null);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Auto-advance if navigated from Job Discovery with a pre-imported job
  useEffect(() => {
    const state = location.state as { preselectedJob?: Job } | null;
    if (state?.preselectedJob) {
      setCreatedJob(state.preselectedJob);
      setStep(2);
    }
  }, [location.state]);

  // Quick fill sample job
  const fillSampleJob = () => {
    setJobSourceType('pasted');
    setJobTitle('Senior Full-Stack Engineer (Python / React)');
    setJobCompany('ProofPath Labs');
    setJobText(
      `Role: Senior Full-Stack Engineer\n` +
      `We are seeking a senior engineer to build high-performance data and developer intelligence tooling.\n\n` +
      `Requirements:\n` +
      `- Deep expertise in Python and FastAPI for microservice design.\n` +
      `- Production experience with React and TypeScript building accessible UIs.\n` +
      `- Strong background in SQL database design and optimization with PostgreSQL.\n` +
      `- Commitment to Automated Testing with pytest and robust error handling.\n` +
      `- Experience with Git version control and collaborative GitHub workflows.\n` +
      `- Experience with Docker containerization and cloud architecture is preferred.`
    );
  };

  // Quick fill sample repo
  const fillSampleRepo = () => {
    setRepoUrl('https://github.com/tiangolo/fastapi');
    setRepoBranch('master');
  };

  // Handle Step 1 Submit
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.importJob({
        source_type: jobSourceType,
        title: jobTitle || undefined,
        company: jobCompany || undefined,
        url: jobSourceType === 'url' ? jobUrl : undefined,
        text: jobSourceType === 'pasted' ? jobText : undefined
      });
      setCreatedJob(res);
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import job posting.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Submit
  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please select a PDF or DOCX file to upload.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.uploadResume(resumeFile);
      setCreatedResume(res);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse and upload résumé.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick create synthetic text-based resume for test convenience
  const handleCreateSyntheticResume = async () => {
    setError(null);
    setLoading(true);
    try {
      const resumeContent = 
        `Alex River - Full-Stack Engineer\n` +
        `Summary: Full-stack software developer with 5+ years of experience building modern web apps.\n` +
        `Technical Skills:\n` +
        `- Languages & Frameworks: Python, FastAPI, React, TypeScript, JavaScript, SQL, PostgreSQL.\n` +
        `- Testing & Tools: Automated Testing with pytest, Git version control, Docker, REST API Architecture.\n` +
        `Experience:\n` +
        `Senior Software Engineer at Modern Systems (2022-2026):\n` +
        `- Built scalable backend REST APIs using Python and FastAPI with PostgreSQL.\n` +
        `- Developed modern frontend client interfaces using React and TypeScript.\n` +
        `- Maintained 90%+ code coverage through automated unit testing and CI/CD pipelines.\n`;

      const pdfBytes = 
        `%PDF-1.4\n` +
        `1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
        `2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n` +
        `3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n` +
        `4 0 obj<</Length ${resumeContent.length + 80}>>stream\n` +
        `BT\n/F1 12 Tf\n50 700 Td\n(${resumeContent.replace(/\n/g, ' ')}) Tj\nET\n` +
        `endstream\nendobj\n` +
        `xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000192 00000 n \n` +
        `trailer<</Size 5/Root 1 0 R>>\nstartxref\n400\n%%EOF`;

      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const syntheticFile = new File([pdfBlob], 'developer_resume.pdf', { type: 'application/pdf' });
      
      const res = await api.uploadResume(syntheticFile);
      setCreatedResume(res);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process sample résumé.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3 Submit
  const handleRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) {
      setError('Please provide a public GitHub repository URL.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.inspectRepository(repoUrl, repoBranch || undefined);
      setCreatedRepo(res);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect GitHub repository.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 4 Final Execution
  const handleRunAssessment = async () => {
    if (!createdJob || !createdResume || !createdRepo) {
      setError('Missing required inputs to launch assessment.');
      return;
    }

    setError(null);
    setAnalyzing(true);

    try {
      const assessment = await api.createAssessment(
        createdJob.id,
        createdResume.id,
        createdRepo.id
      );
      navigate(`/assessments/${assessment.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Assessment execution failed.';
      setError(msg);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Wizard Stepper Header */}
        <div className="glass-card rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 1
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/20'
                    : step > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className={`text-[11px] font-mono mt-2 font-medium ${step === 1 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                Job Posting
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 2
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/20'
                    : step > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-[11px] font-mono mt-2 font-medium ${step === 2 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                Résumé
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 3
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/20'
                    : step > 3
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
              </div>
              <span className={`text-[11px] font-mono mt-2 font-medium ${step === 3 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                GitHub Repo
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  step === 4
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                4
              </div>
              <span className={`text-[11px] font-mono mt-2 font-medium ${step === 4 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                Review & Audit
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: JOB POSTING */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-headline font-bold text-slate-900">
                  Step 1: Job Requirements Ingestion
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste the job posting description or supply a public URL (SSRF-protected).
                </p>
              </div>

              <button
                type="button"
                onClick={fillSampleJob}
                className="text-xs font-mono text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                Load Sample Job
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="space-y-5">
              {/* Source Type Selector */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setJobSourceType('pasted')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-headline font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    jobSourceType === 'pasted'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Description (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJobSourceType('url')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-headline font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    jobSourceType === 'url'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Public Job URL</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                    Job Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. ProofPath Labs"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
              </div>

              {jobSourceType === 'pasted' ? (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                    Job Description Text
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="Paste the full job posting requirements and responsibilities here..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-4 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed shadow-2xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                    Public Job Posting URL
                  </label>
                  <input
                    type="url"
                    required
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://example.com/careers/senior-engineer"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Protected by SSRF firewall: localhost, private subnets (RFC 1918), and redirect attacks are blocked.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Extracting Grounded Requirements...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Upload Résumé</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: RÉSUMÉ UPLOAD */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-headline font-bold text-slate-900">
                  Step 2: Upload Your Résumé
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supported formats: PDF or DOCX. Document text will be extracted safely without running scripts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateSyntheticResume}
                disabled={loading}
                className="text-xs font-mono text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                Use Sample PDF Résumé
              </button>
            </div>

            <form onSubmit={handleResumeSubmit} className="space-y-6">
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-blue-50/30">
                <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="text-sm font-headline font-semibold text-slate-900 mb-1">
                  Choose a PDF or DOCX file
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-sans">
                  Maximum file size: 10MB. Stored locally outside public static web roots.
                </p>

                <input
                  type="file"
                  id="resume-file-input"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResumeFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="resume-file-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-headline font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                >
                  Browse Files
                </label>

                {resumeFile && (
                  <div className="mt-4 p-3 rounded-xl bg-white border border-blue-200 inline-flex items-center gap-2 text-xs font-mono text-slate-800 shadow-2xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{resumeFile.name}</span>
                    <span className="text-slate-500">
                      ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-headline font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !resumeFile}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Extracting Résumé Text...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Inspect Repository</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: GITHUB REPOSITORY */}
        {step === 3 && (
          <div className="glass-card rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-headline font-bold text-slate-900">
                  Step 3: Public GitHub Repository
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fetch commit-pinned file snapshot. No code is executed; binaries and lockfiles are safely excluded.
                </p>
              </div>

              <button
                type="button"
                onClick={fillSampleRepo}
                className="text-xs font-mono text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                Use Sample Repo (FastAPI)
              </button>
            </div>

            <form onSubmit={handleRepoSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Phase 1 supports public repositories. No OAuth authorization or private write permissions needed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1.5">
                  Branch (Optional)
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="main (or master / develop)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Snapshot Exclusions & Boundary Guarantees:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Dependency folders (node_modules, venv, vendor) are skipped</li>
                  <li>Binary assets, images, audio, video, and fonts are skipped</li>
                  <li>Files over 50KB and lockfiles are skipped</li>
                  <li>Exact commit SHA is resolved and recorded for stable line citations</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-headline font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Resolving Branch & Tree...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Review & Run Audit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: REVIEW & EXECUTE */}
        {step === 4 && createdJob && createdResume && createdRepo && (
          <div className="glass-card rounded-2xl p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-headline font-bold text-slate-900">
                Step 4: Review Scope & Run Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify inputs before launching the multi-source evidence triangulation engine in PostgreSQL.
              </p>
            </div>

            {/* Scope Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Job Scope */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-700 font-bold mb-2 uppercase">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Job Requirements</span>
                </div>
                <div className="font-headline font-bold text-sm text-slate-900 mb-1 truncate">
                  {createdJob.title}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {createdJob.extracted_requirements.length} grounded requirements
                </div>
              </div>

              {/* Résumé Scope */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-700 font-bold mb-2 uppercase">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Applicant Résumé</span>
                </div>
                <div className="font-headline font-bold text-sm text-slate-900 mb-1 truncate">
                  {createdResume.filename}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {createdResume.word_count} words extracted
                </div>
              </div>

              {/* Repo Scope */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-bold mb-2 uppercase">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </div>
                <div className="font-headline font-bold text-sm text-slate-900 mb-1 truncate">
                  {createdRepo.owner}/{createdRepo.name}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {createdRepo.inspected_files_count} files • SHA: {createdRepo.analyzed_sha.slice(0, 7)}
                </div>
              </div>
            </div>

            {/* Grounded Requirements Preview */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-3">
                Grounded Job Requirements to Evaluate ({createdJob.extracted_requirements.length})
              </h3>
              <div className="space-y-2">
                {createdJob.extracted_requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700 mr-2">
                        {req.id}:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {req.normalized_skill}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-sans italic">
                        &quot;{req.original_wording}&quot;
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 font-semibold ${
                        req.priority_type === 'preferred'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {req.priority_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-headline font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleRunAssessment}
                disabled={analyzing}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20 hover:scale-[1.02] cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Executing Triangulation Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Run Evidence Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
