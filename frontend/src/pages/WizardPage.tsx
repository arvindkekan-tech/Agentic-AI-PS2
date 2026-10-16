import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      `- Strong background in SQL database design and optimization with SQLite or PostgreSQL.\n` +
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
    } catch (err: any) {
      setError(err.message || 'Failed to import job posting.');
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
    } catch (err: any) {
      setError(err.message || 'Failed to parse and upload résumé.');
    } finally {
      setLoading(false);
    }
  };

  // Quick create synthetic text-based resume for test convenience
  const handleCreateSyntheticResume = async () => {
    setError(null);
    setLoading(true);
    try {
      // Create a text file or docx
      const resumeContent = 
        `Alex River - Full-Stack Engineer\n` +
        `Summary: Full-stack software developer with 5+ years of experience building modern web apps.\n` +
        `Technical Skills:\n` +
        `- Languages & Frameworks: Python, FastAPI, React, TypeScript, JavaScript, SQL.\n` +
        `- Testing & Tools: Automated Testing with pytest, Git version control, Docker, REST API Architecture.\n` +
        `Experience:\n` +
        `Senior Software Engineer at Modern Systems (2022-2026):\n` +
        `- Built scalable backend REST APIs using Python and FastAPI with SQLite and PostgreSQL.\n` +
        `- Developed modern frontend client interfaces using React and TypeScript.\n` +
        `- Maintained 90%+ code coverage through automated unit testing and CI/CD pipelines.\n`;

      // Since backend accepts .docx and .pdf, let's create a minimal PDF blob
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
    } catch (err: any) {
      setError(err.message || 'Failed to process sample résumé.');
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
    } catch (err: any) {
      setError(err.message || 'Failed to inspect GitHub repository.');
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
    } catch (err: any) {
      setError(err.message || 'Assessment execution failed.');
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] text-[#111318] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Wizard Stepper Header */}
        <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 1
                    ? 'bg-[#111318] text-[#C7F36B] ring-4 ring-[#111318]/10'
                    : step > 1
                    ? 'bg-[#C7F36B] text-[#111318]'
                    : 'bg-[#EFECE3] text-[#9A9FB1]'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-[11px] font-mono mt-2 font-medium">Job Posting</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 ${step > 1 ? 'bg-[#C7F36B]' : 'bg-[#E2DDD3]'}`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 2
                    ? 'bg-[#111318] text-[#C7F36B] ring-4 ring-[#111318]/10'
                    : step > 2
                    ? 'bg-[#C7F36B] text-[#111318]'
                    : 'bg-[#EFECE3] text-[#9A9FB1]'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-[11px] font-mono mt-2 font-medium">Résumé</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 ${step > 2 ? 'bg-[#C7F36B]' : 'bg-[#E2DDD3]'}`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 3
                    ? 'bg-[#111318] text-[#C7F36B] ring-4 ring-[#111318]/10'
                    : step > 3
                    ? 'bg-[#C7F36B] text-[#111318]'
                    : 'bg-[#EFECE3] text-[#9A9FB1]'
                }`}
              >
                {step > 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
              </div>
              <span className="text-[11px] font-mono mt-2 font-medium">GitHub Repo</span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 ${step > 3 ? 'bg-[#C7F36B]' : 'bg-[#E2DDD3]'}`} />

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 4
                    ? 'bg-[#111318] text-[#C7F36B] ring-4 ring-[#111318]/10'
                    : 'bg-[#EFECE3] text-[#9A9FB1]'
                }`}
              >
                4
              </div>
              <span className="text-[11px] font-mono mt-2 font-medium">Review & Audit</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#E77D83]/15 border border-[#E77D83]/30 text-xs text-[#9E2A2B] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: JOB POSTING */}
        {step === 1 && (
          <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DDD3]">
              <div>
                <h2 className="text-xl font-headline font-bold text-[#111318]">
                  Step 1: Job Requirements Ingestion
                </h2>
                <p className="text-xs text-[#50566A] mt-0.5">
                  Paste the job posting description or supply a public URL (SSRF-protected).
                </p>
              </div>

              <button
                type="button"
                onClick={fillSampleJob}
                className="text-xs font-mono text-[#111318] hover:text-[#50566A] underline bg-[#EFECE3] px-3 py-1.5 rounded-lg border border-[#E2DDD3]"
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
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-headline font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    jobSourceType === 'pasted'
                      ? 'bg-[#111318] text-[#C7F36B] border-[#111318]'
                      : 'bg-[#FFFEFA] text-[#50566A] border-[#E2DDD3] hover:bg-[#F9F7F1]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Description (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJobSourceType('url')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-headline font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    jobSourceType === 'url'
                      ? 'bg-[#111318] text-[#C7F36B] border-[#111318]'
                      : 'bg-[#FFFEFA] text-[#50566A] border-[#E2DDD3] hover:bg-[#F9F7F1]'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Public Job URL</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                    Job Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl px-4 py-2.5 text-sm text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. Modern Systems Inc."
                    className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl px-4 py-2.5 text-sm text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318]"
                  />
                </div>
              </div>

              {jobSourceType === 'pasted' ? (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                    Job Description Text
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder="Paste the full job posting requirements and responsibilities here..."
                    className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl p-4 text-xs font-mono text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318] leading-relaxed"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                    Public Job Posting URL
                  </label>
                  <input
                    type="url"
                    required
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://example.com/careers/senior-engineer"
                    className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl px-4 py-2.5 text-sm text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318]"
                  />
                  <p className="text-[11px] text-[#50566A] mt-1 font-mono">
                    Protected by SSRF firewall: localhost, private subnets (RFC 1918), and redirect attacks are rejected.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs hover:bg-[#1B1D24] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C7F36B]" />
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
          <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DDD3]">
              <div>
                <h2 className="text-xl font-headline font-bold text-[#111318]">
                  Step 2: Upload Your Résumé
                </h2>
                <p className="text-xs text-[#50566A] mt-0.5">
                  Supported formats: PDF or DOCX. Document text will be extracted safely without running scripts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateSyntheticResume}
                disabled={loading}
                className="text-xs font-mono text-[#111318] hover:text-[#50566A] underline bg-[#EFECE3] px-3 py-1.5 rounded-lg border border-[#E2DDD3]"
              >
                Use Sample PDF Résumé
              </button>
            </div>

            <form onSubmit={handleResumeSubmit} className="space-y-6">
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-[#E2DDD3] rounded-2xl p-8 text-center hover:border-[#111318] transition-colors bg-[#F9F7F1]/50">
                <Upload className="w-10 h-10 text-[#50566A] mx-auto mb-3" />
                <h3 className="text-sm font-headline font-semibold text-[#111318] mb-1">
                  Choose a PDF or DOCX file
                </h3>
                <p className="text-xs text-[#50566A] mb-4">
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111318] text-white text-xs font-headline font-semibold cursor-pointer hover:bg-[#1B1D24] transition-colors"
                >
                  Browse Files
                </label>

                {resumeFile && (
                  <div className="mt-4 p-3 rounded-xl bg-[#FFFEFA] border border-[#E2DDD3] inline-flex items-center gap-2 text-xs font-mono text-[#111318]">
                    <FileText className="w-4 h-4 text-[#C7F36B]" />
                    <span className="font-semibold">{resumeFile.name}</span>
                    <span className="text-[#50566A]">
                      ({(resumeFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2DDD3] text-xs font-headline font-semibold text-[#50566A] hover:text-[#111318] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !resumeFile}
                  className="px-6 py-3 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs hover:bg-[#1B1D24] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C7F36B]" />
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
          <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2DDD3]">
              <div>
                <h2 className="text-xl font-headline font-bold text-[#111318]">
                  Step 3: Public GitHub Repository
                </h2>
                <p className="text-xs text-[#50566A] mt-0.5">
                  Fetch commit-pinned file snapshot. No code is executed; binaries and lockfiles are safely excluded.
                </p>
              </div>

              <button
                type="button"
                onClick={fillSampleRepo}
                className="text-xs font-mono text-[#111318] hover:text-[#50566A] underline bg-[#EFECE3] px-3 py-1.5 rounded-lg border border-[#E2DDD3]"
              >
                Use Sample Repo (FastAPI)
              </button>
            </div>

            <form onSubmit={handleRepoSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-[#50566A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318]"
                  />
                </div>
                <p className="text-[11px] text-[#50566A] mt-1 font-mono">
                  Phase 1 supports public repositories. No OAuth authorization or private write permissions needed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#50566A] mb-1.5">
                  Branch (Optional)
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="main (or master / develop)"
                  className="w-full bg-[#FFFEFA] border border-[#E2DDD3] rounded-xl px-4 py-2.5 text-sm text-[#111318] placeholder-[#9A9FB1] focus:outline-none focus:border-[#111318]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#F9F7F1] border border-[#E2DDD3] text-xs font-mono text-[#50566A] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#111318] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
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
                  className="px-4 py-2.5 rounded-xl border border-[#E2DDD3] text-xs font-headline font-semibold text-[#50566A] hover:text-[#111318] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs hover:bg-[#1B1D24] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C7F36B]" />
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
          <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-8 shadow-sm space-y-6">
            <div className="border-b border-[#E2DDD3] pb-4">
              <h2 className="text-xl font-headline font-bold text-[#111318]">
                Step 4: Review Scope & Run Audit
              </h2>
              <p className="text-xs text-[#50566A] mt-0.5">
                Verify inputs before launching the multi-source evidence triangulation engine.
              </p>
            </div>

            {/* Scope Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Job Scope */}
              <div className="bg-[#111318] text-white p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#A99BFF] mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Job Requirements</span>
                </div>
                <div className="font-headline font-semibold text-sm text-white mb-1 truncate">
                  {createdJob.title}
                </div>
                <div className="text-xs text-[#9A9FB1] font-mono">
                  {createdJob.extracted_requirements.length} grounded requirements
                </div>
              </div>

              {/* Résumé Scope */}
              <div className="bg-[#111318] text-white p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F3B66D] mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Applicant Résumé</span>
                </div>
                <div className="font-headline font-semibold text-sm text-white mb-1 truncate">
                  {createdResume.filename}
                </div>
                <div className="text-xs text-[#9A9FB1] font-mono">
                  {createdResume.word_count} words extracted
                </div>
              </div>

              {/* Repo Scope */}
              <div className="bg-[#111318] text-white p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B] mb-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </div>
                <div className="font-headline font-semibold text-sm text-white mb-1 truncate">
                  {createdRepo.owner}/{createdRepo.name}
                </div>
                <div className="text-xs text-[#9A9FB1] font-mono">
                  {createdRepo.inspected_files_count} files • SHA: {createdRepo.analyzed_sha.slice(0, 7)}
                </div>
              </div>
            </div>

            {/* Grounded Requirements Preview */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#50566A] mb-3">
                Grounded Job Requirements to Evaluate ({createdJob.extracted_requirements.length})
              </h3>
              <div className="space-y-2">
                {createdJob.extracted_requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#F9F7F1] border border-[#E2DDD3] flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#111318] mr-2">
                        {req.id}:
                      </span>
                      <span className="font-semibold text-[#111318]">
                        {req.normalized_skill}
                      </span>
                      <p className="text-[11px] text-[#50566A] mt-1 leading-relaxed">
                        "{req.original_wording}"
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${
                        req.priority_type === 'preferred'
                          ? 'bg-[#F3B66D]/15 text-[#A75D00] border-[#F3B66D]/30'
                          : 'bg-[#111318]/10 text-[#111318] border-[#111318]/20'
                      }`}
                    >
                      {req.priority_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2DDD3]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-[#E2DDD3] text-xs font-headline font-semibold text-[#50566A] hover:text-[#111318] flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleRunAssessment}
                disabled={analyzing}
                className="px-8 py-3.5 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-bold text-sm hover:bg-[#1B1D24] transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:scale-[1.02]"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C7F36B]" />
                    <span>Executing Triangulation Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
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
