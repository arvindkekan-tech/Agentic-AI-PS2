import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Briefcase,
  FileText,
  GitBranch,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Info,
  Lightbulb,
  Loader2,
  Activity,
  Check,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import type { Assessment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CodeCitationCard } from '../components/CodeCitationCard';
import { CoverageModal } from '../components/CoverageModal';
import { EvidenceChangeLedger } from '../components/EvidenceChangeLedger';
import { TrustReportCard } from '../components/TrustReportCard';

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requirements' | 'trust' | 'ledger'>('requirements');
  const [copied, setCopied] = useState(false);

  // Filter tab: 'all' | 'demonstrated' | 'partial_or_needs_review' | 'not_demonstrated_in_analyzed_scope'
  const [filter, setFilter] = useState<string>('all');
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    }
  }, [id]);

  const loadAssessment = async (assessmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAssessment(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment report.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] flex items-center justify-center p-4">
        <div className="text-center text-[#111318]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#111318]" />
          <p className="text-sm font-headline font-semibold">Loading Assessment Report...</p>
          <p className="text-xs font-mono text-[#50566A] mt-1">Verifying deterministic citations</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] p-8">
        <div className="max-w-2xl mx-auto bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-[#E77D83] mx-auto mb-3" />
          <h2 className="text-lg font-headline font-bold text-[#111318] mb-1">
            Unable to Load Assessment
          </h2>
          <p className="text-xs text-[#50566A] mb-6">{error || 'Assessment not found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111318] text-[#C7F36B] text-xs font-headline font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const { job, resume, repository, requirements = [], summary_counts = {} } = assessment;

  const filteredRequirements = requirements.filter((req) => {
    if (filter === 'all') return true;
    return req.combined_status === filter;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] text-[#111318] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#50566A] hover:text-[#111318] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/shared/assessments/${assessment.id}`;
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111318] text-white hover:text-[#C7F36B] text-xs font-mono border border-[#282B36] transition-colors shadow-sm"
              title="Copy public read-only link for recruiters"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#C7F36B]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Share Link Copied!' : 'Share with Recruiter'}</span>
            </button>

            {repository && (
              <button
                onClick={() => setCoverageModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111318] text-white hover:text-[#C7F36B] text-xs font-mono border border-[#282B36] transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>Coverage & Trust Audit</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-[#111318] text-white rounded-2xl p-6 sm:p-8 border border-[#282B36] shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#282B36]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <StatusBadge status={assessment.status} size="lg" />
                <span className="text-xs font-mono text-[#9A9FB1]">
                  Audit Run: {assessment.id.slice(0, 8)}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1B1D24] text-[#A99BFF] border border-[#282B36]">
                  {assessment.provider_name} • {assessment.model_name}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-white tracking-tight">
                {job?.title || 'Technical Skill Evidence Report'}
              </h1>
              {job?.company && (
                <div className="text-xs text-[#9A9FB1] font-mono mt-1">
                  Target Company: <span className="text-white font-semibold">{job.company}</span>
                </div>
              )}
            </div>

            {/* Quick Count Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-headline font-bold text-[#C7F36B]">
                  {summary_counts.demonstrated || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Demonstrated</div>
              </div>

              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-headline font-bold text-[#F3B66D]">
                  {summary_counts.partial_or_needs_review || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Needs Review</div>
              </div>

              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-headline font-bold text-[#9A9FB1]">
                  {summary_counts.not_demonstrated_in_analyzed_scope || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Not in Scope</div>
              </div>
            </div>
          </div>

          {/* 3-Source Triangulation Metadata Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <Briefcase className="w-4 h-4 text-[#A99BFF] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Job Source: </span>
                <span>{job?.source_type === 'url' ? 'Public Posting URL' : 'Pasted Job Text'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <FileText className="w-4 h-4 text-[#F3B66D] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Résumé: </span>
                <span>{resume?.filename}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <GitBranch className="w-4 h-4 text-[#C7F36B] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Repository: </span>
                <span title={repository?.analyzed_sha}>
                  {repository?.owner}/{repository?.name} (SHA: {repository?.analyzed_sha.slice(0, 7)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary View Switcher */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E2DDD3] pb-2">
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all cursor-pointer ${
              activeTab === 'requirements'
                ? 'bg-[#111318] text-[#C7F36B] shadow-sm'
                : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Skill Requirements & Citations ({requirements.length})</span>
          </button>

          {assessment.trust_report && (
            <button
              onClick={() => setActiveTab('trust')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all cursor-pointer ${
                activeTab === 'trust'
                  ? 'bg-[#111318] text-[#C7F36B] shadow-sm'
                  : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Evidence & Trust Integrity</span>
              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-600">
                {assessment.trust_report.internal_evidence_index.toFixed(1)} / 100
              </span>
            </button>
          )}

          {repository && (
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#111318] text-[#C7F36B] shadow-sm'
                  : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
              }`}
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Evidence Change Ledger</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          )}
        </div>

        {activeTab === 'trust' && assessment.trust_report ? (
          <div className="pt-2">
            <TrustReportCard report={assessment.trust_report} />
          </div>
        ) : activeTab === 'ledger' && repository ? (
          <div className="pt-2">
            <EvidenceChangeLedger
              repositoryId={repository.id}
              onSelectAssessment={(newAssessId) => {
                navigate(`/assessments/${newAssessId}`);
                loadAssessment(newAssessId);
              }}
            />
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2DDD3] pb-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filter === 'all'
                    ? 'bg-[#111318] text-[#C7F36B] font-bold'
                    : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
                }`}
              >
                All Requirements ({requirements.length})
              </button>

              <button
                onClick={() => setFilter('demonstrated')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filter === 'demonstrated'
                    ? 'bg-[#111318] text-[#C7F36B] font-bold'
                    : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
                }`}
              >
                Demonstrated ({summary_counts.demonstrated || 0})
              </button>

              <button
                onClick={() => setFilter('partial_or_needs_review')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filter === 'partial_or_needs_review'
                    ? 'bg-[#111318] text-[#F3B66D] font-bold'
                    : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
                }`}
              >
                Needs Review ({summary_counts.partial_or_needs_review || 0})
              </button>

              <button
                onClick={() => setFilter('not_demonstrated_in_analyzed_scope')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  filter === 'not_demonstrated_in_analyzed_scope'
                    ? 'bg-[#111318] text-white font-bold'
                    : 'bg-[#FFFEFA] text-[#50566A] hover:bg-[#EFECE3]'
                }`}
              >
                Not in Scope ({summary_counts.not_demonstrated_in_analyzed_scope || 0})
              </button>
            </div>

            {/* Requirement-by-Requirement Cards */}
            <div className="space-y-6">
              {filteredRequirements.map((req) => (
                <div

              key={req.id}
              className="bg-[#FFFEFA] rounded-2xl border border-[#E2DDD3] p-6 shadow-sm space-y-6"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DDD3]">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-[#111318] text-[#C7F36B]">
                    {req.requirement_id}
                  </span>
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#111318]">
                      {req.normalized_skill}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      req.priority_type === 'preferred'
                        ? 'bg-[#F3B66D]/15 text-[#A75D00] border-[#F3B66D]/30'
                        : 'bg-[#111318]/10 text-[#111318] border-[#111318]/20'
                    }`}
                  >
                    {req.priority_type}
                  </span>
                  <StatusBadge status={req.combined_status} size="md" />
                </div>
              </div>

              {/* Original Job Wording */}
              <div className="text-xs bg-[#F9F7F1] p-3.5 rounded-xl border border-[#E2DDD3] font-mono">
                <span className="text-[#50566A] uppercase text-[10px] tracking-wider block mb-1">
                  Source Job Requirement:
                </span>
                <span className="text-[#111318] leading-relaxed">
                  "{req.original_wording}"
                </span>
              </div>

              {/* 3-Column Triangulation Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Résumé Column */}
                <div className="p-4 rounded-xl border border-[#E2DDD3] bg-[#FFFEFA] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#50566A]">
                      <FileText className="w-3.5 h-3.5 text-[#F3B66D]" />
                      <span>Résumé Evidence</span>
                    </div>
                    <StatusBadge status={req.resume_status} size="sm" showIcon={false} />
                  </div>
                  <p className="text-xs text-[#111318] leading-relaxed pt-1">
                    {req.resume_explanation}
                  </p>
                </div>

                {/* Repository Column */}
                <div className="p-4 rounded-xl border border-[#E2DDD3] bg-[#FFFEFA] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD3]">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#50566A]">
                      <GitBranch className="w-3.5 h-3.5 text-[#C7F36B]" />
                      <span>Repository Code</span>
                    </div>
                    <StatusBadge status={req.repo_status} size="sm" showIcon={false} />
                  </div>
                  <p className="text-xs text-[#111318] leading-relaxed pt-1">
                    {req.repo_explanation}
                  </p>
                </div>

                {/* Combined Synthesis Column */}
                <div className="p-4 rounded-xl border border-[#111318]/20 bg-[#111318] text-white space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#282B36]">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#C7F36B]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Combined Interpretation</span>
                    </div>
                    <StatusBadge status={req.combined_status} size="sm" showIcon={false} />
                  </div>
                  <p className="text-xs text-[#F4F1E8] leading-relaxed pt-1">
                    {req.combined_interpretation}
                  </p>
                </div>
              </div>

              {/* Code Citations List */}
              {req.citations.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#50566A] mb-2">
                    Verified Citations & Excerpts ({req.citations.length})
                  </h4>
                  <div className="space-y-3">
                    {req.citations.map((citation, citIdx) => (
                      <CodeCitationCard key={citIdx} citation={citation} />
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations & Practical Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                {/* Limitations */}
                <div className="p-3.5 rounded-xl bg-[#F9F7F1] border border-[#E2DDD3] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[#50566A] uppercase text-[10px] tracking-wider">
                    <Info className="w-3.5 h-3.5 text-[#F3B66D]" />
                    <span>Evidence Limitations:</span>
                  </div>
                  <p className="text-[#50566A] leading-relaxed">
                    {req.limitations_note}
                  </p>
                </div>

                {/* Practical Improvement Action */}
                {req.improvement_action && (
                  <div className="p-3.5 rounded-xl bg-[#C7F36B]/10 border border-[#C7F36B]/30 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[#2F6F0E] uppercase text-[10px] tracking-wider font-semibold">
                      <Lightbulb className="w-3.5 h-3.5 text-[#2F6F0E]" />
                      <span>Recommended Action:</span>
                    </div>
                    <p className="text-[#111318] leading-relaxed">
                      {req.improvement_action}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
        )}
      </div>


      {/* Coverage & Trust Audit Modal */}
      {repository && (
        <CoverageModal
          repository={repository}
          isOpen={coverageModalOpen}
          onClose={() => setCoverageModalOpen(false)}
        />
      )}
    </div>
  );
};
