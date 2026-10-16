import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Assessment } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listAssessments();
      setAssessments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assessments.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Derive metric counts
  const totalAssessments = assessments.length;
  let demonstratedCount = 0;
  let needsReviewCount = 0;
  let notInScopeCount = 0;

  assessments.forEach((a) => {
    demonstratedCount += a.summary_counts?.demonstrated || 0;
    needsReviewCount += a.summary_counts?.partial_or_needs_review || 0;
    notInScopeCount += a.summary_counts?.not_demonstrated_in_analyzed_scope || 0;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-900">
      {/* Top Banner */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5">
              <span className="font-semibold text-blue-600">Developer Workspace</span>
              <span>•</span>
              <span className="text-slate-800 font-bold">{user?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 tracking-tight">
              Evidence Intelligence Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Real-time audit verification powered by PostgreSQL and verifiable GitHub code citations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs/discover"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-headline font-medium text-sm transition-all border border-slate-200 shadow-sm"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Discover Jobs</span>
            </Link>

            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-sm transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Total Audits</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-slate-900">
              {totalAssessments}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-1">
              Multi-source comparisons executed
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Demonstrated Skills</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-emerald-600">
              {demonstratedCount}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-1">
              Verified with exact code citations
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Needs Review</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-amber-600">
              {needsReviewCount}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-1">
              Partial evidence or résumé-only claims
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Not In Analyzed Scope</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-slate-700">
              {notInScopeCount}
            </div>
            <div className="text-[11px] font-sans text-slate-500 mt-1">
              Uncovered in inspected snapshot
            </div>
          </div>
        </div>

        {/* Recent Audits Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-base text-slate-900">
                Recent Evidence Assessments
              </h2>
              <p className="text-xs text-slate-500">
                Persisted audits stored in PostgreSQL with verifiable cryptographic citations and reproducible audit trails
              </p>
            </div>

            {assessments.length > 0 && (
              <Link
                to="/history"
                className="text-xs font-mono text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-xs font-mono">Loading saved assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-headline font-semibold text-slate-900 mb-1">
                No Assessments Performed Yet
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-sans">
                Start your first assessment by uploading a job posting, your résumé, and a public GitHub repository. ProofPath will extract grounded requirements and verify your code evidence.
              </p>
              <Link
                to="/wizard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-headline font-semibold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start First Assessment</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assessments.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-xs font-mono text-slate-500">
                        Run ID: <strong className="text-slate-800">{item.id.slice(0, 8)}</strong>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {item.provider_name} ({item.model_name})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-emerald-600">{item.summary_counts?.demonstrated || 0}</strong> demonstrated
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-amber-600">{item.summary_counts?.partial_or_needs_review || 0}</strong> review
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-500">{item.summary_counts?.not_demonstrated_in_analyzed_scope || 0}</strong> not in scope
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assessments/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-blue-600 text-xs font-headline font-semibold transition-colors shadow-sm"
                    >
                      <span>View Audit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
