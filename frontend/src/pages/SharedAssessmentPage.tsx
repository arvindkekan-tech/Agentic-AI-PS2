import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Briefcase,
  FileText,
  GitBranch,
  AlertCircle,
  Loader2,
  Check,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import type { Assessment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CodeCitationCard } from '../components/CodeCitationCard';
import { TrustReportCard } from '../components/TrustReportCard';

export const SharedAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (id) {
      loadSharedAssessment(id);
    }
  }, [id]);

  const loadSharedAssessment = async (assessmentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSharedAssessment(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      setError(err.message || 'Shared assessment not found or link has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#C7F36B]" />
          <p className="text-sm font-semibold">Loading Shared Candidate Assessment...</p>
          <p className="text-xs font-mono text-[#9A9FB1] mt-1">Verifying code snapshot provenance</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[#111318] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#16181F] border border-[#282B36] rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="w-10 h-10 text-[#E77D83] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Assessment Not Found</h2>
          <p className="text-xs text-[#9A9FB1] mb-6">{error || 'This shared link may have expired or is invalid.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#282B36] text-white hover:text-[#C7F36B] text-xs font-semibold transition-colors"
          >
            ProofPath Home
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
    <div className="min-h-screen bg-[#111318] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Recruiter / Mentor Shared Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#1B1D24] border border-[#282B36]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#A99BFF]/15 text-[#A99BFF] border border-[#A99BFF]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Recruiter & Mentor Shared Evidence Audit
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B]/15 text-[#C7F36B] border border-[#C7F36B]/30">
                  Read-Only Verified
                </span>
              </div>
              <p className="text-[11px] text-[#9A9FB1]">
                Candidate credentials isolated. Evaluated directly against Git commit SHA lines.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282B36] hover:bg-[#3B4050] text-xs font-mono text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#C7F36B]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>
        </div>

        {/* Assessment Header Card */}
        <div className="bg-[#16181F] rounded-2xl p-6 sm:p-8 border border-[#282B36] shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#282B36]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <StatusBadge status={assessment.status} size="lg" />
                <span className="text-xs font-mono text-[#9A9FB1]">
                  Commit Snapshot: {repository?.analyzed_sha?.slice(0, 8) || 'Head'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {job?.title || 'Technical Skill Evidence Report'}
              </h1>
              {job?.company && (
                <div className="text-xs text-[#9A9FB1] font-mono mt-1">
                  Target Role at <span className="text-white font-semibold">{job.company}</span>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-bold text-[#C7F36B] font-mono">
                  {summary_counts.demonstrated || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Demonstrated</div>
              </div>

              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-bold text-[#F3B66D] font-mono">
                  {summary_counts.partial_or_needs_review || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Needs Review</div>
              </div>

              <div className="bg-[#1B1D24] px-4 py-2.5 rounded-xl border border-[#282B36] text-center min-w-[90px]">
                <div className="text-xl font-bold text-[#9A9FB1] font-mono">
                  {summary_counts.not_demonstrated_in_analyzed_scope || 0}
                </div>
                <div className="text-[10px] font-mono text-[#9A9FB1] uppercase">Not in Scope</div>
              </div>
            </div>
          </div>

          {/* Triangulation Metadata Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-xs font-mono">
            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <Briefcase className="w-4 h-4 text-[#A99BFF] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Job: </span>
                <span>{job?.title || 'Software Role'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <FileText className="w-4 h-4 text-[#F3B66D] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Résumé: </span>
                <span>{resume?.filename || 'Candidate Résumé'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-[#9A9FB1]">
              <GitBranch className="w-4 h-4 text-[#C7F36B] shrink-0" />
              <div className="truncate">
                <span className="text-white font-medium">Repository: </span>
                <span>{repository?.owner}/{repository?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Evidence Integrity Report Card */}
        {assessment.trust_report && (
          <TrustReportCard report={assessment.trust_report} />
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282B36] pb-3">
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { key: 'all', label: `All Requirements (${requirements.length})` },
              { key: 'demonstrated', label: `Demonstrated (${summary_counts.demonstrated || 0})` },
              { key: 'partial_or_needs_review', label: `Needs Review (${summary_counts.partial_or_needs_review || 0})` },
              { key: 'not_demonstrated_in_analyzed_scope', label: `Not in Scope (${summary_counts.not_demonstrated_in_analyzed_scope || 0})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                  filter === tab.key
                    ? 'bg-[#C7F36B] text-[#111318] font-bold shadow'
                    : 'bg-[#1B1D24] text-[#9A9FB1] hover:text-white border border-[#282B36]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requirements & Citations List */}
        <div className="space-y-4">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12 bg-[#16181F] rounded-xl border border-[#282B36] text-[#9A9FB1] text-xs">
              No requirements match the selected filter.
            </div>
          ) : (
            filteredRequirements.map((req) => (
              <div
                key={req.id}
                className="bg-[#16181F] rounded-xl p-5 border border-[#282B36] shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282B36] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1B1D24] text-[#A99BFF] border border-[#282B36]">
                      {req.requirement_id}
                    </span>
                    <h3 className="text-sm font-bold text-white">{req.normalized_skill}</h3>
                    <span className="text-[11px] font-mono text-[#9A9FB1]">
                      ({req.priority_type})
                    </span>
                  </div>
                  <StatusBadge status={req.combined_status} size="sm" />
                </div>

                <div className="text-xs text-[#9A9FB1] leading-relaxed">
                  <span className="text-white font-medium">Job requirement text: </span>
                  "{req.original_wording}"
                </div>

                {/* Evidence Interpretation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#111318] p-3 rounded-lg border border-[#282B36]">
                  <div>
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#F3B66D]" />
                      Résumé Mention: <StatusBadge status={req.resume_status} size="sm" showIcon={false} />
                    </div>
                    <p className="text-[#9A9FB1]">{req.resume_explanation || 'No explicit claim found.'}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[#C7F36B]" />
                      Repository Evidence: <StatusBadge status={req.repo_status} size="sm" showIcon={false} />
                    </div>
                    <p className="text-[#9A9FB1]">{req.repo_explanation || 'No implementation found in inspected files.'}</p>
                  </div>
                </div>

                {/* Scope Limitation Disclosure */}
                {req.limitations_note && (
                  <div className="text-xs text-[#F3B66D]/90 bg-[#F3B66D]/10 p-2.5 rounded border border-[#F3B66D]/20">
                    <span className="font-bold">Scope limitation: </span>
                    {req.limitations_note}
                  </div>
                )}

                {/* Code Citations */}
                {req.citations && req.citations.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-mono font-semibold text-white mb-1">
                      Validated Git Citations ({req.citations.length}):
                    </div>
                    {req.citations.map((citation) => (
                      <CodeCitationCard key={citation.id} citation={citation} />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
