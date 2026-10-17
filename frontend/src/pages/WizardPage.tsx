import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Upload,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import type { Job, Resume, Repository, Assessment, ParsedResumeProfile } from '../types';

export const WizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state: Step 1 (Job), Step 2 (Résumé), Step 3 (Repo), Step 4 (Review & Execute)
  const [step, setStep] = useState<number>(1);

  // Step 1: Job state
  const [jobSourceType, setJobSourceType] = useState<'pasted' | 'url'>('pasted');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobRequiredSkills, setJobRequiredSkills] = useState('');
  const [jobPreferredSkills, setJobPreferredSkills] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [createdJob, setCreatedJob] = useState<Job | null>(null);

  // Step 2: Résumé state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [createdResume, setCreatedResume] = useState<Resume | null>(null);
  const [parsedProfile, setParsedProfile] = useState<ParsedResumeProfile | null>(null);
  const [confirmingProfile, setConfirmingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedHeadline, setEditedHeadline] = useState('');
  const [editedTargetRole, setEditedTargetRole] = useState('');
  const [editedGithub, setEditedGithub] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedSkills, setEditedSkills] = useState<Array<{ name: string; level: string; category: string }>>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Step 3: Repo state
  const [repoUrl, setRepoUrl] = useState('');
  const [repoBranch, setRepoBranch] = useState('');
  const [createdRepo, setCreatedRepo] = useState<Repository | null>(null);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Handle Step 1 Submit (Job)
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let payloadText = jobText;
      if (jobSourceType === 'pasted') {
        const parts = [];
        if (jobTitle) parts.push(`Position: ${jobTitle}`);
        if (jobCompany) parts.push(`Company: ${jobCompany}`);
        if (jobLocation) parts.push(`Location: ${jobLocation}`);
        if (jobText) parts.push(`Description:\n${jobText}`);
        if (jobResponsibilities) parts.push(`Key Responsibilities:\n${jobResponsibilities}`);
        if (jobRequiredSkills) parts.push(`Required Skills:\n${jobRequiredSkills}`);
        if (jobPreferredSkills) parts.push(`Preferred Skills:\n${jobPreferredSkills}`);
        payloadText = parts.join('\n\n');
      }

      const res = await api.importJob({
        source_type: jobSourceType,
        title: jobTitle || undefined,
        company: jobCompany || undefined,
        url: jobSourceType === 'url' ? jobUrl : undefined,
        text: jobSourceType === 'pasted' ? payloadText : undefined
      });
      setCreatedJob(res);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to import and analyze job requirements.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Upload (Résumé)
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please select a valid PDF or DOCX résumé file.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.uploadAndParseResume(resumeFile);
      setCreatedResume(res.resume);
      setParsedProfile(res.parsed_profile);
      setEditedName(res.parsed_profile.name || '');
      setEditedHeadline(res.parsed_profile.headline || '');
      setEditedTargetRole(res.parsed_profile.target_role || createdJob?.title || 'Full-Stack Platform Engineer');
      setEditedGithub(res.parsed_profile.github_username || '');
      setEditedBio(res.parsed_profile.bio || '');
      setEditedSkills(res.parsed_profile.skills || []);
      setConfirmingProfile(true);
    } catch (err: any) {
      setError(err.message || 'Failed to parse and extract text from résumé.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirm Profile Fields & Save to Career Profile
  const handleConfirmProfile = async () => {
    setError(null);
    setLoading(true);

    try {
      await api.updateCareerProfile({
        headline: editedHeadline || `${editedName} | ${editedTargetRole}`,
        target_role: editedTargetRole,
        bio: editedBio,
        github_username: editedGithub,
        skills: editedSkills.map((s) => ({ name: s.name, level: s.level, verified: false })),
        education: (parsedProfile?.education || []).map((e) => ({ degree: e.degree, institution: e.institution, year: e.year, gpa: '' }))
      });
      setConfirmingProfile(false);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save confirmed career profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const skillName = newSkillInput.trim();
    if (!editedSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      setEditedSkills([...editedSkills, { name: skillName, level: 'proficient', category: 'General' }]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setEditedSkills(editedSkills.filter((s) => s.name !== skillName));
  };

  // Handle Step 3 Submit (GitHub Repository)
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

  // Handle Step 4 Submit (Run Assessment Engine)
  const handleRunAssessment = async () => {
    if (!createdJob || !createdResume || !createdRepo) {
      setError('Missing prerequisites. Please ensure job, résumé, and repository are set.');
      return;
    }

    setError(null);
    setAnalyzing(true);

    try {
      const assessment: Assessment = await api.createAssessment(
        createdJob.id,
        createdResume.id,
        createdRepo.id
      );
      navigate(`/assessments/${assessment.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to execute evidence triangulation audit.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Stepper Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
              <span>Evidence Triangulation Pipeline</span>
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Step {step} of 4
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Job Criteria', icon: Briefcase },
              { num: 2, label: 'Upload Résumé', icon: FileText },
              { num: 3, label: 'Connect GitHub', icon: GitBranch },
              { num: 4, label: 'Verify Evidence', icon: ShieldCheck }
            ].map((s) => {
              const Icon = s.icon;
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    isCurrent
                      ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600/20'
                      : isPast
                      ? 'bg-blue-50/50 border-blue-200 text-slate-700'
                      : 'bg-white/50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: JOB CRITERIA INGESTION */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Step 1: Target Job Requisition
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Enter your target position via public job posting URL or enter the requirements manually.
              </p>
            </div>

            <form onSubmit={handleJobSubmit} className="space-y-5">
              {/* Source Type Selector */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setJobSourceType('pasted')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    jobSourceType === 'pasted'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Manual Job Details & Description</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJobSourceType('url')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    jobSourceType === 'url'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Public Job Posting URL</span>
                </button>
              </div>

              {jobSourceType === 'url' ? (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-semibold">
                    Job Posting URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://company.com/careers/senior-fullstack-engineer"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                    Protected by SSRF validation. Private subnets, loopbacks, and non-HTTP protocols are rejected.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={jobCompany}
                        onChange={(e) => setJobCompany(e.target.value)}
                        placeholder="e.g. Modern Systems Inc."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                        Location / Mode
                      </label>
                      <input
                        type="text"
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        placeholder="e.g. Remote / Bengaluru"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                      Job Description & Overview *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      placeholder="Paste the core job description, role summary, and engineering mission..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                        Required Technical Skills
                      </label>
                      <textarea
                        rows={3}
                        value={jobRequiredSkills}
                        onChange={(e) => setJobRequiredSkills(e.target.value)}
                        placeholder="e.g. Python, FastAPI, React, TypeScript, SQL, Docker, Automated Testing"
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1 font-semibold">
                        Preferred Qualifications
                      </label>
                      <textarea
                        rows={3}
                        value={jobPreferredSkills}
                        onChange={(e) => setJobPreferredSkills(e.target.value)}
                        placeholder="e.g. Kubernetes, CI/CD, Microservices architecture, GraphQL"
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Criteria...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Résumé Upload</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: RÉSUMÉ UPLOAD & CONFIRMATION */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Step 2: Upload Real Résumé Document
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Upload an authentic PDF or DOCX file. The server parses text, validates bytes, and extracts your skills.
                </p>
              </div>
            </div>

            {!confirmingProfile ? (
              <form onSubmit={handleResumeUpload} className="space-y-6">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-600 transition-colors bg-slate-50/50">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Select a text-based PDF or DOCX file
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Maximum size: 10MB. Stored locally outside public roots.
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Browse Local File
                  </label>

                  {resumeFile && (
                    <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 inline-flex items-center gap-2 text-xs font-mono text-slate-800 shadow-sm">
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
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !resumeFile}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating & Parsing Résumé...</span>
                      </>
                    ) : (
                      <>
                        <span>Parse & Review Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Profile Confirmation Screen */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-blue-900">
                      Extraction Complete — Review & Confirm Extracted Fields
                    </h3>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Verify your parsed details before saving to your verified Career Profile. You can adjust your target role, headline, and skills.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-600 font-semibold mb-1">
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-600 font-semibold mb-1">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={editedTargetRole}
                      onChange={(e) => setEditedTargetRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-600 font-semibold mb-1">
                    Profile Headline
                  </label>
                  <input
                    type="text"
                    value={editedHeadline}
                    onChange={(e) => setEditedHeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-600 font-semibold mb-1">
                      GitHub Username
                    </label>
                    <input
                      type="text"
                      value={editedGithub}
                      onChange={(e) => setEditedGithub(e.target.value)}
                      placeholder="e.g. arvindkekan-tech"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-600 font-semibold mb-1">
                      Parsed Email / Phone
                    </label>
                    <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
                      {parsedProfile?.email || 'Not specified'} {parsedProfile?.phone ? `• ${parsedProfile.phone}` : ''}
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono uppercase text-slate-600 font-semibold">
                      Extracted Technical Skills ({editedSkills.length})
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        placeholder="Add skill tag..."
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[60px]">
                    {editedSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-sm"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({s.level})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.name)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConfirmingProfile(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Re-upload File
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmProfile}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Connect GitHub</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PUBLIC GITHUB REPOSITORY */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Step 3: Connect Public GitHub Repository
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Point to an accessible public repository. The system clones an isolated snapshot, resolves exact commit SHAs, and indexes verifiable implementation citations.
              </p>
            </div>

            <form onSubmit={handleRepoSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-semibold">
                  GitHub Repository URL *
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
                  Read-only analysis. No tokens or write permissions required for public repositories.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 mb-1.5 font-semibold">
                  Branch (Optional)
                </label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="main (or master)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Snapshot Guardrails & Exclusions:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Build artifacts and dependency trees (node_modules, venv) are excluded</li>
                  <li>Binary blobs and lockfiles are skipped to enforce safety bounds</li>
                  <li>Exact commit SHA is resolved to generate non-forgeable citation links</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inspecting Repository Tree...</span>
                    </>
                  ) : (
                    <>
                      <span>Inspect Repository & Review Scope</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: REVIEW SCOPE & RUN TRIANGULATION ASSESSMENT */}
        {step === 4 && createdJob && createdResume && createdRepo && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Step 4: Review Scope & Run Evidence Assessment
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Compare job requirements, résumé claims, and inspected repository code.
              </p>
            </div>

            {/* Scope Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Target Position</span>
                </div>
                <div className="font-semibold text-sm text-white mb-1 truncate">
                  {createdJob.title}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {createdJob.extracted_requirements.length} technical criteria
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Saved Résumé</span>
                </div>
                <div className="font-semibold text-sm text-white mb-1 truncate">
                  {createdResume.filename}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {createdResume.word_count} words parsed
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Repository Evidence</span>
                </div>
                <div className="font-semibold text-sm text-white mb-1 truncate">
                  {createdRepo.owner}/{createdRepo.name}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {createdRepo.inspected_files_count} files • SHA: {createdRepo.analyzed_sha.slice(0, 7)}
                </div>
              </div>
            </div>

            {/* Technical Criteria to Evaluate */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-3">
                Extracted Criteria to Triangulate ({createdJob.extracted_requirements.length})
              </h3>
              <div className="space-y-2">
                {createdJob.extracted_requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 mr-2">
                        {req.id}:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {req.normalized_skill}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        "{req.original_wording}"
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${
                        req.priority_type === 'preferred'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleRunAssessment}
                disabled={analyzing}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Triangulation Engine...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
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
