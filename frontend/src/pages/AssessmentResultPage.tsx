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
  FolderArchive,
  BookOpen,
  ExternalLink,
  Award
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
import { PersonalizedQuizModal } from '../components/PersonalizedQuizModal';

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
  const [quizModalOpen, setQuizModalOpen] = useState(false);

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center text-slate-800">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-sm font-headline font-semibold text-slate-900">
            Analyzing Career Intelligence & Code Evidence...
          </p>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Computing weighted compatibility metrics & 3-way alignment in PostgreSQL
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-headline font-bold text-slate-900 mb-1">
            Unable to Load Assessment
          </h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Assessment not found.'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-semibold shadow-sm"
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      {/* Top Action Header */}
      <div className="border-b border-slate-200/80 bg-white/75 backdrop-blur-md px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-1.5">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span>/</span>
              <span>Assessment Report</span>
              <span>/</span>
              <span className="text-blue-600 font-semibold">{assessment.id.slice(0, 8)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 tracking-tight">
                {assessment.job?.title || 'Target Role Assessment'}
              </h1>
              {assessment.job?.company && (
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono border border-blue-100 font-medium">
                  {assessment.job.company}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 mt-2">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-800 font-medium">
                  {assessment.repository?.owner}/{assessment.repository?.name}
                </span>
                <span className="text-slate-500">({assessment.repository?.branch})</span>
              </span>
              <span>•</span>
              <span className="text-slate-500">
                SHA: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-semibold">{assessment.repository?.analyzed_sha?.slice(0, 7) || 'HEAD'}</code>
              </span>
              <span>•</span>
              <span className="text-slate-500">
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
              onClick={() => setQuizModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-headline font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-white" />
              <span>Personalized Skill Test</span>
            </button>

            <button
              onClick={() => setCoverageModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer shadow-sm"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Audit Scope</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Analytics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Compatibility Score */}
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Compatibility Score</span>
              </span>
              <button
                onClick={() => setFormulaModalOpen(true)}
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title="View Weighted Formula"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-slate-900">
                {compatibilityScore.toFixed(1)}%
              </span>
              <span className={`text-xs font-mono font-semibold ${
                compatibilityScore >= 75 ? 'text-emerald-600' : compatibilityScore >= 45 ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {compatibilityScore >= 75 ? 'Strong Match' : compatibilityScore >= 45 ? 'Partial Match' : 'Developing'}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, compatibilityScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-slate-500 mt-2">
              Weighted by priority: Required (2x) • Preferred (1x)
            </p>
          </div>

          {/* Evidence Coverage */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Evidence Coverage</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-slate-900">
                {evidenceCoverage.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-indigo-600 font-semibold">
                {assessment.scoring_metadata?.assessable_requirements_count ?? requirements.length}/
                {assessment.scoring_metadata?.total_requirements_count ?? requirements.length} assessable
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, evidenceCoverage)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-slate-500 mt-2">
              Requirements verifiable via static repository snapshot
            </p>
          </div>

          {/* Code Match Score */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>Repository Match</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-emerald-600">
                {evidenceMatchScore.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, evidenceMatchScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-slate-500 mt-2">
              Ground-truth code implementations and tests in GitHub
            </p>
          </div>

          {/* Résumé Alignment */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Résumé Alignment</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-headline font-bold text-amber-600">
                {resumeAlignmentScore.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, resumeAlignmentScore)}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-slate-500 mt-2">
              Stated skills and experiences parsed from CV
            </p>
          </div>
        </div>

        {/* Banner CTA for Personalized Skill Test */}
        <div className="glass-panel-blue p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-blue-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Interactive Skill Verification</span>
            </div>
            <h3 className="text-lg font-headline font-bold text-slate-900">
              Personalized MCQ & Architecture Written-Answer Test
            </h3>
            <p className="text-xs text-slate-600 font-sans max-w-2xl leading-relaxed">
              Validate your actual conceptual depth and solve architectural prompts tailored to this specific job requirement analysis. Scored deterministically with transparent AI evaluation rubrics.
            </p>
          </div>

          <button
            onClick={() => setQuizModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Launch Personalized Test</span>
          </button>
        </div>

        {/* Visualizations & Radar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skill Radar Topology */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-headline font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Verified Skill Topology</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-source comparison: Code Evidence (Royal Blue) vs Résumé Claims (Indigo)
                </p>
              </div>
            </div>

            <SkillRadarChart requirements={requirements} />
          </div>

          {/* Status Breakdown & Summary */}
          <div className="p-6 rounded-2xl glass-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-headline font-bold text-slate-900 mb-4">
                Requirement Breakdown
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Demonstrated</span>
                  </span>
                  <span className="font-bold text-emerald-900">{demonstratedCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="flex items-center gap-2 text-amber-800 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Partial / Needs Review</span>
                  </span>
                  <span className="font-bold text-amber-900">{partialCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-2 text-slate-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Not in Analyzed Scope</span>
                  </span>
                  <span className="font-bold text-slate-900">{notDemonstratedCount}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="flex items-center gap-2 text-indigo-800 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Unable to Assess</span>
                  </span>
                  <span className="font-bold text-indigo-900">{unableCount}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-sans">
              <span className="font-mono font-semibold text-blue-600">Engine:</span> {assessment.provider_name} ({assessment.model_name}) with deterministic SHA-pinned citation verification.
            </div>
          </div>
        </div>

        {/* Evidence Change Ledger (Version Comparison Card) */}
        {allAssessments.length > 0 && (
          <div className="p-6 rounded-2xl glass-card no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-headline font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Evidence Change Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track skill progress and citation evolution against previous audits of this role
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={compareAssessmentId}
                  onChange={(e) => handleCompare(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
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
              <div className="py-8 text-center text-xs font-mono text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Calculating delta metrics in PostgreSQL...
              </div>
            ) : comparisonResult ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl font-headline font-bold ${
                        comparisonResult.score_delta > 0
                          ? 'text-emerald-600'
                          : comparisonResult.score_delta < 0
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {comparisonResult.score_delta > 0 ? `+${comparisonResult.score_delta}%` : `${comparisonResult.score_delta}%`}
                    </div>
                    <div className="text-xs font-mono text-slate-600">
                      Compatibility Shift ({comparisonResult.previous_score}% → {comparisonResult.current_score}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-700 font-semibold">✓ {comparisonResult.improved_count} Improved</span>
                    <span className="text-rose-700 font-semibold">✗ {comparisonResult.regressed_count} Regressed</span>
                    <span className="text-slate-600 font-semibold">• {comparisonResult.stable_count} Stable</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-sans bg-white p-3 rounded-lg border border-slate-200">
                  {comparisonResult.narrative_summary}
                </p>

                {/* Transition Matrix List */}
                <div className="space-y-2 mt-2">
                  {comparisonResult.requirement_changes.map((change) => (
                    <div
                      key={change.requirement_id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{change.requirement_id}</span>
                        <span className="font-medium text-slate-900">{change.normalized_skill}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                            change.transition_type === 'improved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : change.transition_type === 'regressed'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {change.transition_label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
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
        <div className="border-b border-slate-200 no-print">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>3-Way Alignment Matrix</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {alignmentMatrix.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'recommendations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Actionable Roadmap</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {recommendations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'files'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderArchive className="w-4 h-4 text-indigo-500" />
              <span>File Evidence Explorer</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {fileFindings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`pb-4 px-1 text-sm font-headline font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'requirements'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Citations & Proofs</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
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
              <span className="text-xs font-mono text-slate-500 mr-1">Filter Alignment:</span>
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
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                    className={`p-6 rounded-2xl glass-card transition-all ${
                      isHiddenStrength
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : isUnverified
                        ? 'border-amber-200 bg-amber-50/20'
                        : isFullMatch
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isGap
                        ? 'border-rose-200 bg-rose-50/20'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {item.requirement_id}
                        </span>
                        <h4 className="text-base font-headline font-bold text-slate-900">
                          {item.normalized_skill}
                        </h4>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                          ({item.priority_type})
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1.5 ${
                          isFullMatch
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isHiddenStrength
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : isUnverified
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isGap
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.category_label}
                      </span>
                    </div>

                    {/* Source Status Comparison Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">
                          1. Target Requirement
                        </span>
                        <span className="font-semibold text-slate-900">{item.normalized_skill}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">
                          2. Résumé Claim
                        </span>
                        <StatusBadge status={item.resume_status} />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">
                          3. Repository Evidence
                        </span>
                        <StatusBadge status={item.repo_status} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans mb-3">
                      {item.discrepancy_explanation}
                    </p>

                    {/* Actionable Suggestions */}
                    {(item.resume_action_suggestion || item.repo_action_suggestion) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {item.resume_action_suggestion && (
                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-slate-800">
                            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block mb-1">
                              💡 Résumé Optimization Suggestion:
                            </span>
                            <span className="font-sans leading-relaxed text-slate-600">
                              {item.resume_action_suggestion}
                            </span>
                          </div>
                        )}

                        {item.repo_action_suggestion && (
                          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-slate-800">
                            <span className="text-[10px] font-mono text-indigo-700 uppercase font-bold block mb-1">
                              🛠️ Repository Artifact Suggestion:
                            </span>
                            <span className="font-sans leading-relaxed text-slate-600">
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

        {/* TAB 2: ACTIONABLE RECOMMENDATIONS WITH RAG LEARNING CITATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-headline font-bold text-slate-900">
                  Prioritized Evidence Roadmap
                </h3>
                <p className="text-xs text-slate-500">
                  Concrete actions to neutralize skill gaps and convert partial evaluations into verified demonstrated code, grounded in indexed knowledge
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
                    className="rounded-2xl glass-card overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                              isQuickWin
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isTargeted
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {rec.effort_label}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            Est: {rec.estimated_timeframe}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-slate-500">
                          Requirement: <strong className="text-slate-800">{rec.requirement_id}</strong> ({rec.normalized_skill})
                        </span>
                      </div>

                      <h4 className="text-base font-headline font-bold text-slate-900 mt-1">
                        {rec.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed">
                        {rec.description}
                      </p>

                      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] font-mono uppercase text-blue-700 font-bold block mb-1">
                          Implementation Blueprint:
                        </span>
                        <p className="font-mono text-slate-800 text-[11px] leading-relaxed">
                          {rec.suggested_implementation}
                        </p>
                      </div>

                      {/* Cited Learning Resources (RAG Knowledge Citations) */}
                      {rec.learning_resources && rec.learning_resources.length > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-blue-800 font-bold uppercase mb-2">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Retrieved Learning Resources ({rec.learning_resources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {rec.learning_resources.map((res, ridx) => (
                              <div
                                key={ridx}
                                className="p-3 bg-white rounded-lg border border-blue-100 shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-headline font-bold text-slate-900">
                                    {res.title}
                                  </span>
                                  {(res.source_url || res.url) && (
                                    <a
                                      href={res.source_url || res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Open Source URL"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 font-sans leading-relaxed line-clamp-3">
                                  {res.cited_excerpt || res.excerpt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verification Checklist Toggle */}
                      {rec.verification_checklist && rec.verification_checklist.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setExpandedRecId(isExpanded ? null : rec.requirement_id)}
                            className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
                          >
                            <span>
                              {isExpanded ? 'Hide Verification Checklist' : `View Verification Checklist (${rec.verification_checklist.length} steps)`}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100">
                              {rec.verification_checklist.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] flex items-center justify-center font-bold">
                                      {step.step_number}
                                    </span>
                                    <span className="font-medium text-slate-900">{step.action}</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-7 text-[11px] text-slate-600">
                                    <div>
                                      <span className="font-mono text-blue-700 font-semibold">Expected Artifact:</span>{' '}
                                      {step.expected_artifact}
                                    </div>
                                    <div>
                                      <span className="font-mono text-indigo-700 font-semibold">Criterion:</span>{' '}
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
                <h3 className="text-lg font-headline font-bold text-slate-900">
                  Inspected Files & Source Mapping
                </h3>
                <p className="text-xs text-slate-500">
                  Direct audit of files inspected by GitHub scanner mapped to positive, partial, or inconclusive citations
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {fileFindings.map((file, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-semibold text-slate-900">{file.file_path}</span>
                    </div>

                    {file.summary_excerpt && (
                      <p className="text-[11px] font-mono text-slate-600 pl-6 line-clamp-1">
                        &quot;{file.summary_excerpt}&quot;
                      </p>
                    )}

                    {file.lines_referenced.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-6">
                        <span className="text-[10px] font-mono text-slate-500">Lines:</span>
                        {file.lines_referenced.map((line, lidx) => (
                          <span
                            key={lidx}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200"
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
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                          >
                            {reqName}
                          </span>
                        ))}
                      </div>
                    )}

                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold uppercase ${
                        file.finding_type === 'positive_evidence'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : file.finding_type === 'partial_evidence'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
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
                <span className="text-xs font-mono text-slate-500 mr-1">Filter by Status:</span>
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
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
                  className="rounded-2xl glass-card p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          {req.requirement_id}
                        </span>
                        <span className="uppercase tracking-wider">
                          Priority: {req.priority_type} (Weight {req.weight ?? 2})
                        </span>
                      </div>
                      <h3 className="text-base font-headline font-bold text-slate-900">
                        {req.normalized_skill}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 font-sans italic">
                        &quot;{req.original_wording}&quot;
                      </p>
                    </div>

                    <StatusBadge status={req.combined_status} />
                  </div>

                  {/* Findings breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-sans">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-slate-600 uppercase font-semibold">
                          Résumé Analysis
                        </span>
                        <StatusBadge status={req.resume_status} />
                      </div>
                      <p className="text-slate-600 leading-relaxed">{req.resume_explanation}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-slate-600 uppercase font-semibold">
                          Repository Analysis
                        </span>
                        <StatusBadge status={req.repo_status} />
                      </div>
                      <p className="text-slate-600 leading-relaxed">{req.repo_explanation}</p>
                    </div>
                  </div>

                  {/* Citations section */}
                  {req.citations && req.citations.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-mono text-blue-700 uppercase tracking-wider mb-3 font-bold">
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

      {/* Personalized Skill Test Modal */}
      {quizModalOpen && assessment && (
        <PersonalizedQuizModal
          assessmentId={assessment.id}
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
        />
      )}

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-headline font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Deterministic Scoring Methodology v1.0</span>
              </h3>
              <button
                onClick={() => setFormulaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">Compatibility Score Formula:</strong>
                <br />
                <code className="text-blue-700 font-mono text-[11px] block bg-blue-50/60 p-2 rounded mt-1 border border-blue-100">
                  Score = 100 × ∑(Weight × Status Contribution) / ∑(Weight of Assessable Requirements)
                </code>
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-blue-700 font-bold">Required Priority:</span> 2x Weight
                  <br />
                  <span className="text-amber-700 font-bold">Preferred Priority:</span> 1x Weight
                </div>
                <div>
                  <span className="text-emerald-700 font-bold">Demonstrated:</span> 1.0 (100%)
                  <br />
                  <span className="text-amber-700 font-bold">Partial:</span> 0.5 (50%)
                  <br />
                  <span className="text-rose-700 font-bold">Not Demonstrated:</span> 0.0 (0%)
                </div>
              </div>

              <p>
                <strong className="text-slate-900">Unassessable Exclusion:</strong> Requirements marked{' '}
                <code className="text-indigo-700 font-mono bg-indigo-50 px-1 py-0.5 rounded">unable_to_assess</code> are omitted from the
                denominator so candidates are never penalized for aspects outside repository scope.
              </p>

              <p>
                <strong className="text-slate-900">Evidence Coverage:</strong> Indicates the percentage
                of total job specification requirements assessable with available code and resume artifacts.
              </p>
            </div>

            <button
              onClick={() => setFormulaModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-headline font-semibold text-white transition-colors cursor-pointer shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
