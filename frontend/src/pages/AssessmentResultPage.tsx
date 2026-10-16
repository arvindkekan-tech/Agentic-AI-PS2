import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Briefcase,
  GitBranch,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Info,
  Lightbulb,
  Loader2,
  Printer,
  ChevronDown,
  ChevronUp,
  FileCode,
  TrendingUp,
  Layers,
  HelpCircle,
  FolderArchive
} from 'lucide-react';
import { api } from '../services/api';
import type {
  Assessment,
  AssessmentComparisonResponse,
  AlignmentMatrixItem,
  ActionableRecommendation,
  FileEvidenceFinding
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CodeCitationCard } from '../components/CodeCitationCard';
import { CoverageModal } from '../components/CoverageModal';
import { SkillRadarChart } from '../components/SkillRadarChart';

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'matrix' | 'recommendations' | 'files' | 'requirements'>('matrix');

  // Filter for requirements
  const [filter, setFilter] = useState<string>('all');
  const [matrixFilter, setMatrixFilter] = useState<string>('all');

  // Modals & Panels
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);

  // Evidence Change Ledger Comparison state
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [compareAssessmentId, setCompareAssessmentId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<AssessmentComparisonResponse | null>(null);
  const [comparingLoading, setComparingLoading] = useState(false);

  // Recommendations checklist expand state
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

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

      // Load other assessments for comparison
      try {
        const list = await api.listAssessments();
        const otherList = list.filter((a) => a.id !== assessmentId);
        setAllAssessments(otherList);
      } catch {
        // Non-blocking
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assessment report.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (targetPrevId: string) => {
    setCompareAssessmentId(targetPrevId);
    if (!targetPrevId || !id) {
      setComparisonResult(null);
      return;
    }
    setComparingLoading(true);
    try {
      const result = await api.compareAssessments(id, targetPrevId);
      setComparisonResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Comparison failed.';
      alert(msg);
    } finally {
      setComparingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center p-4">
        <div className="text-center text-[#F4F1E8]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#C7F36B]" />
          <p className="text-sm font-headline font-semibold text-[#FFFEFA]">
            Analyzing Career Intelligence & Code Evidence...
          </p>
          <p className="text-xs font-mono text-[#9A9FB1] mt-1">
            Computing weighted compatibility metrics & 3-way alignment
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[#111318] p-8">
        <div className="max-w-2xl mx-auto bg-[#1B1D24] border border-[#282B36] rounded-2xl p-8 text-center shadow-sm text-[#F4F1E8]">
          <AlertCircle className="w-10 h-10 text-[#E77D83] mx-auto mb-3" />
          <h2 className="text-lg font-headline font-bold text-[#FFFEFA] mb-1">
            Unable to Load Assessment
          </h2>
          <p className="text-xs text-[#9A9FB1] mb-6">{error || 'Assessment not found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C7F36B] text-[#111318] text-xs font-headline font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const requirements = assessment.requirements || [];
  const recommendations: ActionableRecommendation[] = assessment.recommendations || [];
  const alignmentMatrix: AlignmentMatrixItem[] = assessment.alignment_matrix || [];
  const fileFindings: FileEvidenceFinding[] = assessment.file_findings || [];

  const counts = assessment.summary_counts || {};
  const demonstratedCount = counts.demonstrated || 0;
  const partialCount = counts.partial_or_needs_review || 0;
  const notDemonstratedCount = counts.not_demonstrated_in_analyzed_scope || 0;
  const unableCount = counts.unable_to_assess || 0;

  // Filter requirements
  const filteredRequirements = requirements.filter((req) => {
    if (filter === 'all') return true;
    return req.combined_status === filter;
  });

  // Filter matrix
  const filteredMatrix = alignmentMatrix.filter((item) => {
    if (matrixFilter === 'all') return true;
    return item.alignment_category === matrixFilter;
  });

  const compatibilityScore = assessment.compatibility_score ?? 0.0;
  const evidenceCoverage = assessment.evidence_coverage ?? 0.0;
  const evidenceMatchScore = assessment.evidence_match_score ?? 0.0;
  const resumeAlignmentScore = assessment.resume_alignment_score ?? 0.0;

  return (
    <div className="min-h-screen bg-[#111318] text-[#F4F1E8] pb-24">
      {/* Top Action Header */}
      <div className="border-b border-[#282B36] bg-[#1B1D24]/80 backdrop-blur-md px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#9A9FB1] mb-1.5">
              <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span>Assessment Report</span>
              <span>/</span>
              <span className="text-[#C7F36B]">{assessment.id.slice(0, 8)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[#FFFEFA] tracking-tight">
                {assessment.job?.title || 'Target Role Assessment'}
              </h1>
              {assessment.job?.company && (
                <span className="px-2.5 py-1 rounded-md bg-[#282B36] text-xs font-mono text-[#F4F1E8]">
                  {assessment.job.company}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9A9FB1] mt-2">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span className="text-[#F4F1E8]">
                  {assessment.repository?.owner}/{assessment.repository?.name}
                </span>
                <span className="text-[#A0A5B5]">({assessment.repository?.branch})</span>
              </span>
              <span>•</span>
              <span className="text-[#A0A5B5]">
                SHA: {assessment.repository?.analyzed_sha?.slice(0, 7) || 'HEAD'}
              </span>
              <span>•</span>
              <span className="text-[#A0A5B5]">
                {new Date(assessment.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            <button
              onClick={() => setCoverageModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#282B36] hover:bg-[#323644] text-[#F4F1E8] text-xs font-mono flex items-center gap-2 border border-[#323644] transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span>Audit Scope</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#282B36] hover:bg-[#323644] text-[#F4F1E8] text-xs font-mono flex items-center gap-2 border border-[#323644] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <Link
              to="/wizard"
              className="px-4 py-2 rounded-xl bg-[#C7F36B] hover:bg-[#b5e05d] text-[#111318] text-xs font-headline font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Audit</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Analytics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Compatibility Score */}
          <div className="p-5 rounded-2xl bg-[#1B1D24] border border-[#282B36] shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-mono text-[#9A9FB1] mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
                <span>Compatibility Score</span>
              </span>
              <button
                onClick={() => setFormulaModalOpen(true)}
                className="text-[#9A9FB1] hover:text-[#C7F36B] transition-colors cursor-pointer"
                title="View Weighted Formula"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-[#FFFEFA]">
                {compatibilityScore.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[#C7F36B]">
                {compatibilityScore >= 75 ? 'Strong' : compatibilityScore >= 45 ? 'Partial' : 'Developing'}
              </span>
            </div>

            <div className="w-full bg-[#282B36] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#C7F36B] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, compatibilityScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-[#A0A5B5] mt-2">
              Weighted by priority: Required (2x) • Preferred (1x)
            </p>
          </div>

          {/* Evidence Coverage */}
          <div className="p-5 rounded-2xl bg-[#1B1D24] border border-[#282B36] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9A9FB1] mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#A99BFF]" />
                <span>Evidence Coverage</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-[#FFFEFA]">
                {evidenceCoverage.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[#A99BFF]">
                {assessment.scoring_metadata?.assessable_requirements_count ?? requirements.length}/
                {assessment.scoring_metadata?.total_requirements_count ?? requirements.length} assessable
              </span>
            </div>

            <div className="w-full bg-[#282B36] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#A99BFF] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, evidenceCoverage)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-[#A0A5B5] mt-2">
              Requirements verifiable via static repository snapshot
            </p>
          </div>

          {/* Code Match Score */}
          <div className="p-5 rounded-2xl bg-[#1B1D24] border border-[#282B36] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9A9FB1] mb-2">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-[#C7F36B]" />
                <span>Repository Code Match</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-[#FFFEFA]">
                {evidenceMatchScore.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-[#282B36] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#C7F36B] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, evidenceMatchScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-[#A0A5B5] mt-2">
              Ground-truth code implementations and tests in GitHub
            </p>
          </div>

          {/* Résumé Alignment */}
          <div className="p-5 rounded-2xl bg-[#1B1D24] border border-[#282B36] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#9A9FB1] mb-2">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#F3B66D]" />
                <span>Résumé Claim Alignment</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-[#FFFEFA]">
                {resumeAlignmentScore.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-[#282B36] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#F3B66D] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, resumeAlignmentScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-[#A0A5B5] mt-2">
              Stated skills and experiences parsed from CV
            </p>
          </div>
        </div>

        {/* Visualizations & Radar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skill Radar Topology */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1B1D24] border border-[#282B36]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-headline font-bold text-[#FFFEFA] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C7F36B]" />
                  <span>Verified Skill Topology</span>
                </h3>
                <p className="text-xs text-[#9A9FB1] mt-0.5">
                  Multi-source comparison: Code Evidence (Green) vs Résumé Claims (Violet)
                </p>
              </div>
            </div>

            <SkillRadarChart requirements={requirements} />
          </div>

          {/* Status Breakdown & Summary */}
          <div className="p-6 rounded-2xl bg-[#1B1D24] border border-[#282B36] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-headline font-bold text-[#FFFEFA] mb-4">
                Requirement Breakdown
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#282B36]/60">
                  <span className="flex items-center gap-2 text-[#C7F36B]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C7F36B]" />
                    <span>Demonstrated</span>
                  </span>
                  <span className="font-bold text-[#FFFEFA]">{demonstratedCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#282B36]/60">
                  <span className="flex items-center gap-2 text-[#F3B66D]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F3B66D]" />
                    <span>Partial / Needs Review</span>
                  </span>
                  <span className="font-bold text-[#FFFEFA]">{partialCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#282B36]/60">
                  <span className="flex items-center gap-2 text-[#9A9FB1]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9A9FB1]" />
                    <span>Not in Analyzed Scope</span>
                  </span>
                  <span className="font-bold text-[#FFFEFA]">{notDemonstratedCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#282B36]/60">
                  <span className="flex items-center gap-2 text-[#A99BFF]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A99BFF]" />
                    <span>Unable to Assess</span>
                  </span>
                  <span className="font-bold text-[#FFFEFA]">{unableCount}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#282B36] text-[11px] text-[#A0A5B5] leading-relaxed">
              <span className="font-mono text-[#C7F36B]">Engine:</span> {assessment.provider_name} ({assessment.model_name}) with deterministic sha verification.
            </div>
          </div>
        </div>

        {/* Evidence Change Ledger (Version Comparison Card) */}
        {allAssessments.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#1B1D24] border border-[#282B36] shadow-sm no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-headline font-bold text-[#FFFEFA] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C7F36B]" />
                  <span>Evidence Change Ledger</span>
                </h3>
                <p className="text-xs text-[#9A9FB1] mt-0.5">
                  Track skill progress and citation evolution against previous audits of this role
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={compareAssessmentId}
                  onChange={(e) => handleCompare(e.target.value)}
                  className="bg-[#111318] border border-[#323644] rounded-xl px-3 py-1.5 text-xs font-mono text-[#F4F1E8] focus:outline-none focus:border-[#C7F36B] cursor-pointer"
                >
                  <option value="">Compare with past assessment...</option>
                  {allAssessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.created_at).toLocaleDateString()} — {a.job?.title || 'Audit'} ({a.compatibility_score || 0}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {comparingLoading ? (
              <div className="py-8 text-center text-xs font-mono text-[#9A9FB1]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C7F36B]" />
                Calculating delta metrics...
              </div>
            ) : comparisonResult ? (
              <div className="mt-4 p-4 rounded-xl bg-[#111318] border border-[#323644] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl font-headline font-bold ${
                        comparisonResult.score_delta > 0
                          ? 'text-[#C7F36B]'
                          : comparisonResult.score_delta < 0
                          ? 'text-[#E77D83]'
                          : 'text-[#9A9FB1]'
                      }`}
                    >
                      {comparisonResult.score_delta > 0 ? `+${comparisonResult.score_delta}%` : `${comparisonResult.score_delta}%`}
                    </div>
                    <div className="text-xs font-mono text-[#A0A5B5]">
                      Compatibility Shift ({comparisonResult.previous_score}% → {comparisonResult.current_score}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#C7F36B]">✓ {comparisonResult.improved_count} Improved</span>
                    <span className="text-[#E77D83]">✗ {comparisonResult.regressed_count} Regressed</span>
                    <span className="text-[#9A9FB1]">• {comparisonResult.stable_count} Stable</span>
                  </div>
                </div>

                <p className="text-xs text-[#F4F1E8] font-sans bg-[#282B36]/50 p-3 rounded-lg border border-[#323644]">
                  {comparisonResult.narrative_summary}
                </p>

                {/* Transition Matrix List */}
                <div className="space-y-2 mt-2">
                  {comparisonResult.requirement_changes.map((change) => (
                    <div
                      key={change.requirement_id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#1B1D24] border border-[#282B36]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#A0A5B5]">{change.requirement_id}</span>
                        <span className="font-medium text-[#FFFEFA]">{change.normalized_skill}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                            change.transition_type === 'improved'
                              ? 'bg-[#C7F36B]/20 text-[#C7F36B]'
                              : change.transition_type === 'regressed'
                              ? 'bg-[#E77D83]/20 text-[#E77D83]'
                              : 'bg-[#282B36] text-[#A0A5B5]'
                          }`}
                        >
                          {change.transition_label}
                        </span>
                        <span className="text-[11px] font-mono text-[#A0A5B5] hidden sm:inline">
                          {change.current_citations_count} citations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-[#282B36] no-print">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'border-[#C7F36B] text-[#C7F36B]'
                  : 'border-transparent text-[#9A9FB1] hover:text-[#F4F1E8]'
              }`}
            >
              <span>3-Way Alignment Matrix</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F4F1E8]">
                {alignmentMatrix.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'recommendations'
                  ? 'border-[#C7F36B] text-[#C7F36B]'
                  : 'border-transparent text-[#9A9FB1] hover:text-[#F4F1E8]'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-[#F3B66D]" />
              <span>Actionable Recommendations</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F4F1E8]">
                {recommendations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'border-[#C7F36B] text-[#C7F36B]'
                  : 'border-transparent text-[#9A9FB1] hover:text-[#F4F1E8]'
              }`}
            >
              <FolderArchive className="w-4 h-4 text-[#A99BFF]" />
              <span>File Evidence Explorer</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F4F1E8]">
                {fileFindings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'requirements'
                  ? 'border-[#C7F36B] text-[#C7F36B]'
                  : 'border-transparent text-[#9A9FB1] hover:text-[#F4F1E8]'
              }`}
            >
              <span>Citations & Proofs</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F4F1E8]">
                {requirements.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: 3-WAY ALIGNMENT MATRIX */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <span className="text-xs font-mono text-[#9A9FB1] mr-1">Filter Alignment:</span>
              {[
                { id: 'all', label: 'All Requirements' },
                { id: 'full_match', label: 'Full Match' },
                { id: 'unverified_resume_claim', label: 'Unverified Résumé Claim' },
                { id: 'hidden_repo_strength', label: 'Hidden Repo Strength' },
                { id: 'complete_gap', label: 'Skill Gap' },
                { id: 'scope_limitation', label: 'Scope Limitation' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setMatrixFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    matrixFilter === f.id
                      ? 'bg-[#C7F36B] text-[#111318] font-bold'
                      : 'bg-[#1B1D24] text-[#9A9FB1] hover:text-[#F4F1E8] border border-[#282B36]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Matrix Items Grid */}
            <div className="space-y-4">
              {filteredMatrix.map((item) => {
                const isHiddenStrength = item.alignment_category === 'hidden_repo_strength';
                const isUnverified = item.alignment_category === 'unverified_resume_claim';
                const isFullMatch = item.alignment_category === 'full_match';
                const isGap = item.alignment_category === 'complete_gap';

                return (
                  <div
                    key={item.requirement_id}
                    className={`p-6 rounded-2xl bg-[#1B1D24] border transition-all ${
                      isHiddenStrength
                        ? 'border-[#A99BFF]/40 bg-[#A99BFF]/5'
                        : isUnverified
                        ? 'border-[#F3B66D]/40 bg-[#F3B66D]/5'
                        : isFullMatch
                        ? 'border-[#C7F36B]/30'
                        : isGap
                        ? 'border-[#E77D83]/30'
                        : 'border-[#282B36]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#A0A5B5]">
                          {item.requirement_id}
                        </span>
                        <h4 className="text-base font-headline font-bold text-[#FFFEFA]">
                          {item.normalized_skill}
                        </h4>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#9A9FB1]">
                          ({item.priority_type})
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                          isFullMatch
                            ? 'bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/40'
                            : isHiddenStrength
                            ? 'bg-[#A99BFF]/20 text-[#A99BFF] border border-[#A99BFF]/40'
                            : isUnverified
                            ? 'bg-[#F3B66D]/20 text-[#F3B66D] border border-[#F3B66D]/40'
                            : isGap
                            ? 'bg-[#E77D83]/20 text-[#E77D83] border border-[#E77D83]/40'
                            : 'bg-[#282B36] text-[#A0A5B5]'
                        }`}
                      >
                        {item.category_label}
                      </span>
                    </div>

                    {/* Source Status Comparison Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-[#111318] border border-[#282B36]">
                        <span className="text-[10px] text-[#9A9FB1] uppercase block mb-1">
                          1. Target Requirement
                        </span>
                        <span className="font-semibold text-[#FFFEFA]">{item.normalized_skill}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#111318] border border-[#282B36]">
                        <span className="text-[10px] text-[#9A9FB1] uppercase block mb-1">
                          2. Résumé Claim
                        </span>
                        <StatusBadge status={item.resume_status} />
                      </div>

                      <div className="p-3 rounded-xl bg-[#111318] border border-[#282B36]">
                        <span className="text-[10px] text-[#9A9FB1] uppercase block mb-1">
                          3. Repository Evidence
                        </span>
                        <StatusBadge status={item.repo_status} />
                      </div>
                    </div>

                    <p className="text-xs text-[#A0A5B5] leading-relaxed font-sans mb-3">
                      {item.discrepancy_explanation}
                    </p>

                    {/* Actionable Suggestions */}
                    {(item.resume_action_suggestion || item.repo_action_suggestion) && (
                      <div className="mt-3 pt-3 border-t border-[#282B36] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {item.resume_action_suggestion && (
                          <div className="p-3 rounded-xl bg-[#282B36]/40 border border-[#323644] text-[#F4F1E8]">
                            <span className="text-[10px] font-mono text-[#C7F36B] uppercase font-bold block mb-1">
                              💡 Résumé Optimization Suggestion:
                            </span>
                            <span className="font-sans leading-relaxed text-[#A0A5B5]">
                              {item.resume_action_suggestion}
                            </span>
                          </div>
                        )}

                        {item.repo_action_suggestion && (
                          <div className="p-3 rounded-xl bg-[#282B36]/40 border border-[#323644] text-[#F4F1E8]">
                            <span className="text-[10px] font-mono text-[#A99BFF] uppercase font-bold block mb-1">
                              🛠️ Repository Artifact Suggestion:
                            </span>
                            <span className="font-sans leading-relaxed text-[#A0A5B5]">
                              {item.repo_action_suggestion}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIONABLE RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-headline font-bold text-[#FFFEFA]">
                  Prioritized Evidence Roadmap
                </h3>
                <p className="text-xs text-[#9A9FB1]">
                  Concrete actions to neutralize skill gaps and convert partial evaluations into verified demonstrated code
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => {
                const isExpanded = expandedRecId === rec.requirement_id;
                const isQuickWin = rec.effort_category === 'quick_win';
                const isTargeted = rec.effort_category === 'targeted_project';

                return (
                  <div
                    key={rec.requirement_id}
                    className="rounded-2xl bg-[#1B1D24] border border-[#282B36] overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                              isQuickWin
                                ? 'bg-[#C7F36B]/20 text-[#C7F36B]'
                                : isTargeted
                                ? 'bg-[#F3B66D]/20 text-[#F3B66D]'
                                : 'bg-[#A99BFF]/20 text-[#A99BFF]'
                            }`}
                          >
                            {rec.effort_label}
                          </span>
                          <span className="text-xs font-mono text-[#9A9FB1]">
                            Est: {rec.estimated_timeframe}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-[#A0A5B5]">
                          Requirement: {rec.requirement_id} ({rec.normalized_skill})
                        </span>
                      </div>

                      <h4 className="text-base font-headline font-bold text-[#FFFEFA] mt-1">
                        {rec.title}
                      </h4>

                      <p className="text-xs text-[#A0A5B5] mt-2 font-sans leading-relaxed">
                        {rec.description}
                      </p>

                      <div className="mt-4 p-3.5 rounded-xl bg-[#111318] border border-[#282B36] text-xs">
                        <span className="text-[10px] font-mono uppercase text-[#C7F36B] font-bold block mb-1">
                          Implementation Blueprint:
                        </span>
                        <p className="font-mono text-[#F4F1E8] text-[11px] leading-relaxed">
                          {rec.suggested_implementation}
                        </p>
                      </div>

                      {/* Verification Checklist Toggle */}
                      {rec.verification_checklist && rec.verification_checklist.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setExpandedRecId(isExpanded ? null : rec.requirement_id)}
                            className="text-xs font-mono text-[#C7F36B] hover:underline flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>
                              {isExpanded ? 'Hide Verification Checklist' : `View Verification Checklist (${rec.verification_checklist.length} steps)`}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2.5 pt-3 border-t border-[#282B36]/60">
                              {rec.verification_checklist.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="p-3 rounded-lg bg-[#282B36]/40 border border-[#323644] text-xs space-y-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-[#C7F36B]/20 text-[#C7F36B] font-mono text-[10px] flex items-center justify-center font-bold">
                                      {step.step_number}
                                    </span>
                                    <span className="font-medium text-[#FFFEFA]">{step.action}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-7 text-[11px] text-[#A0A5B5]">
                                    <div>
                                      <span className="font-mono text-[#C7F36B]">Expected Artifact:</span>{' '}
                                      {step.expected_artifact}
                                    </div>
                                    <div>
                                      <span className="font-mono text-[#A99BFF]">Criterion:</span>{' '}
                                      {step.verification_criterion}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FILE EVIDENCE EXPLORER */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-headline font-bold text-[#FFFEFA]">
                  Inspected Files & Source Mapping
                </h3>
                <p className="text-xs text-[#9A9FB1]">
                  Direct audit of files inspected by GitHub scanner mapped to positive, partial, or inconclusive citations
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {fileFindings.map((file, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#1B1D24] border border-[#282B36] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-[#C7F36B]" />
                      <span className="font-mono font-medium text-[#FFFEFA]">{file.file_path}</span>
                    </div>

                    {file.summary_excerpt && (
                      <p className="text-[11px] font-mono text-[#A0A5B5] pl-6 line-clamp-1">
                        &quot;{file.summary_excerpt}&quot;
                      </p>
                    )}

                    {file.lines_referenced.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-6">
                        <span className="text-[10px] font-mono text-[#9A9FB1]">Lines:</span>
                        {file.lines_referenced.map((line, lidx) => (
                          <span
                            key={lidx}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#282B36] text-[#F4F1E8]"
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {file.associated_requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.associated_requirements.map((reqName, ridx) => (
                          <span
                            key={ridx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#C7F36B]"
                          >
                            {reqName}
                          </span>
                        ))}
                      </div>
                    )}

                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold uppercase ${
                        file.finding_type === 'positive_evidence'
                          ? 'bg-[#C7F36B]/20 text-[#C7F36B]'
                          : file.finding_type === 'partial_evidence'
                          ? 'bg-[#F3B66D]/20 text-[#F3B66D]'
                          : 'bg-[#282B36] text-[#9A9FB1]'
                      }`}
                    >
                      {file.finding_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CITATIONS & REQUIREMENTS DETAIL */}
        {activeTab === 'requirements' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-[#9A9FB1] mr-1">Filter by Status:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'demonstrated', label: 'Demonstrated' },
                  { id: 'partial_or_needs_review', label: 'Partial / Needs Review' },
                  { id: 'not_demonstrated_in_analyzed_scope', label: 'Not in Analyzed Scope' },
                  { id: 'unable_to_assess', label: 'Unable to Assess' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      filter === f.id
                        ? 'bg-[#C7F36B] text-[#111318] font-bold'
                        : 'bg-[#1B1D24] text-[#9A9FB1] hover:text-[#F4F1E8] border border-[#282B36]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {filteredRequirements.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-[#1B1D24] border border-[#282B36] p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#282B36]">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#9A9FB1] mb-1">
                        <span className="px-2 py-0.5 rounded bg-[#282B36] text-[#C7F36B]">
                          {req.requirement_id}
                        </span>
                        <span className="uppercase tracking-wider">
                          Priority: {req.priority_type} (Weight {req.weight ?? 2})
                        </span>
                      </div>
                      <h3 className="text-base font-headline font-bold text-[#FFFEFA]">
                        {req.normalized_skill}
                      </h3>
                      <p className="text-xs text-[#A0A5B5] mt-1 font-sans italic">
                        &quot;{req.original_wording}&quot;
                      </p>
                    </div>

                    <StatusBadge status={req.combined_status} />
                  </div>

                  {/* Findings breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-sans">
                    <div className="p-4 rounded-xl bg-[#111318] border border-[#282B36]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-[#A0A5B5] uppercase">
                          Résumé Analysis
                        </span>
                        <StatusBadge status={req.resume_status} />
                      </div>
                      <p className="text-[#A0A5B5] leading-relaxed">{req.resume_explanation}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#111318] border border-[#282B36]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-[#A0A5B5] uppercase">
                          Repository Analysis
                        </span>
                        <StatusBadge status={req.repo_status} />
                      </div>
                      <p className="text-[#A0A5B5] leading-relaxed">{req.repo_explanation}</p>
                    </div>
                  </div>

                  {/* Citations section */}
                  {req.citations && req.citations.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-[#282B36]">
                      <h4 className="text-xs font-mono text-[#C7F36B] uppercase tracking-wider mb-3">
                        Grounded Evidence ({req.citations.length} citation{req.citations.length === 1 ? '' : 's'})
                      </h4>
                      <div className="space-y-3">
                        {req.citations.map((cit) => (
                          <CodeCitationCard key={cit.id} citation={cit} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coverage Modal */}
      {coverageModalOpen && assessment.repository && (
        <CoverageModal
          repository={assessment.repository}
          isOpen={coverageModalOpen}
          onClose={() => setCoverageModalOpen(false)}
        />
      )}

      {/* Formula Explanation Modal */}
      {formulaModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111318]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1D24] border border-[#282B36] rounded-2xl max-w-lg w-full p-6 text-[#F4F1E8] space-y-4">
            <div className="flex items-center justify-between border-b border-[#282B36] pb-3">
              <h3 className="font-headline font-bold text-base text-[#FFFEFA] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
                <span>Deterministic Scoring Methodology v1.0</span>
              </h3>
              <button
                onClick={() => setFormulaModalOpen(false)}
                className="text-[#9A9FB1] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans text-[#A0A5B5] leading-relaxed">
              <p>
                <strong className="text-[#FFFEFA]">Compatibility Score Formula:</strong>
                <br />
                <code className="text-[#C7F36B] font-mono text-[11px] block bg-[#111318] p-2 rounded mt-1">
                  Score = 100 × ∑(Weight × Status Contribution) / ∑(Weight of Assessable Requirements)
                </code>
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#111318] p-3 rounded-lg">
                <div>
                  <span className="text-[#C7F36B]">Required Priority:</span> 2x Weight
                  <br />
                  <span className="text-[#F3B66D]">Preferred Priority:</span> 1x Weight
                </div>
                <div>
                  <span className="text-[#C7F36B]">Demonstrated:</span> 1.0 (100%)
                  <br />
                  <span className="text-[#F3B66D]">Partial:</span> 0.5 (50%)
                  <br />
                  <span className="text-[#E77D83]">Not Demonstrated:</span> 0.0 (0%)
                </div>
              </div>

              <p>
                <strong className="text-[#FFFEFA]">Unassessable Exclusion:</strong> Requirements marked{' '}
                <code className="text-[#A99BFF] font-mono">unable_to_assess</code> are omitted from the
                denominator so candidates are never penalized for aspects outside repository scope.
              </p>

              <p>
                <strong className="text-[#FFFEFA]">Evidence Coverage:</strong> Indicates the percentage
                of total job specification requirements assessable with available code and resume artifacts.
              </p>
            </div>

            <button
              onClick={() => setFormulaModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#282B36] hover:bg-[#323644] text-xs font-headline font-semibold text-[#FFFEFA] transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
