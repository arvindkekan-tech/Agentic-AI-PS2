import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  Clock,
  AlertCircle,
  Loader2
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
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  // Derive real metric counts
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
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] text-[#111318]">
      {/* Top Banner */}
      <div className="border-b border-[#E2DDD3] bg-[#FFFEFA] px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#50566A] uppercase tracking-wider mb-1">
              <span>Developer Workspace</span>
              <span>•</span>
              <span className="text-[#111318] font-bold">{user?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[#111318] tracking-tight">
              Evidence Intelligence Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs/discover"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EFECE3] hover:bg-[#E2DDD3] text-[#111318] font-headline font-medium text-sm transition-all border border-[#D5CFBF]"
            >
              <span>Discover Jobs</span>
              <ArrowRight className="w-4 h-4 text-[#50566A]" />
            </Link>

            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-sm hover:bg-[#1B1D24] transition-all shadow-md hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-[#C7F36B]" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-[#E77D83]/15 border border-[#E77D83]/30 text-xs text-[#9E2A2B] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111318] text-white p-5 rounded-2xl border border-[#282B36] shadow-md">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9A9FB1] flex items-center justify-between">
              <span>Total Audits</span>
              <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-white">
              {totalAssessments}
            </div>
            <div className="text-[11px] font-sans text-[#9A9FB1] mt-1">
              Multi-source comparisons executed
            </div>
          </div>

          <div className="bg-[#111318] text-white p-5 rounded-2xl border border-[#282B36] shadow-md">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9A9FB1] flex items-center justify-between">
              <span>Demonstrated Skills</span>
              <span className="w-2 h-2 rounded-full bg-[#C7F36B]" />
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-[#C7F36B]">
              {demonstratedCount}
            </div>
            <div className="text-[11px] font-sans text-[#9A9FB1] mt-1">
              Verified with exact code citations
            </div>
          </div>

          <div className="bg-[#111318] text-white p-5 rounded-2xl border border-[#282B36] shadow-md">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9A9FB1] flex items-center justify-between">
              <span>Needs Review</span>
              <span className="w-2 h-2 rounded-full bg-[#F3B66D]" />
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-[#F3B66D]">
              {needsReviewCount}
            </div>
            <div className="text-[11px] font-sans text-[#9A9FB1] mt-1">
              Partial evidence or résumé-only claims
            </div>
          </div>

          <div className="bg-[#111318] text-white p-5 rounded-2xl border border-[#282B36] shadow-md">
            <div className="text-xs font-mono uppercase tracking-wider text-[#9A9FB1] flex items-center justify-between">
              <span>Not In Analyzed Scope</span>
              <span className="w-2 h-2 rounded-full bg-[#9A9FB1]" />
            </div>
            <div className="text-3xl font-headline font-bold mt-2 text-[#9A9FB1]">
              {notInScopeCount}
            </div>
            <div className="text-[11px] font-sans text-[#9A9FB1] mt-1">
              Uncovered in inspected snapshot
            </div>
          </div>
        </div>

        {/* Recent Audits Table */}
        <div className="bg-[#FFFEFA] rounded-2xl border border-[#E2DDD3] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2DDD3] flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-base text-[#111318]">
                Recent Evidence Assessments
              </h2>
              <p className="text-xs text-[#50566A]">
                Persisted audits stored locally in SQLite with full reproducible audit trails
              </p>
            </div>

            {assessments.length > 0 && (
              <Link
                to="/history"
                className="text-xs font-mono text-[#111318] hover:text-[#50566A] underline flex items-center gap-1"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#50566A]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111318]" />
              <p className="text-xs font-mono">Loading saved assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-[#EFECE3] border border-[#E2DDD3] flex items-center justify-center text-[#111318] mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-[#111318]" />
              </div>
              <h3 className="text-base font-headline font-semibold text-[#111318] mb-1">
                No Assessments Performed Yet
              </h3>
              <p className="text-xs text-[#50566A] leading-relaxed mb-6">
                Start your first assessment by uploading a job posting, your résumé, and a public GitHub repository. ProofPath will extract grounded requirements and verify your code evidence.
              </p>
              <Link
                to="/wizard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs hover:bg-[#1B1D24] transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-[#C7F36B]" />
                <span>Start First Assessment</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2DDD3]">
              {assessments.map((item) => (
                <div
                  key={item.id}
                  className="p-5 hover:bg-[#F9F7F1] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-xs font-mono text-[#50566A]">
                        Run ID: {item.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFECE3] text-[#50566A]">
                        {item.provider_name} ({item.model_name})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#50566A] pt-1">
                      <span className="flex items-center gap-1 text-[#111318] font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#50566A]" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-[#2F6F0E]">{item.summary_counts?.demonstrated || 0}</strong> demonstrated
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-[#A75D00]">{item.summary_counts?.partial_or_needs_review || 0}</strong> review
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-[#50566A]">{item.summary_counts?.not_demonstrated_in_analyzed_scope || 0}</strong> not in scope
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/assessments/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] text-white hover:text-[#C7F36B] text-xs font-headline font-semibold hover:bg-[#1B1D24] transition-colors"
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
