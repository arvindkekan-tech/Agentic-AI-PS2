import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ShieldCheck, ArrowRight, Clock, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Assessment } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const AssessmentHistoryPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listAssessments();
      setAssessments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assessment history.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-bold uppercase tracking-wider mb-1">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Audit Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 tracking-tight">
              Assessment History & Version Archive
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              All prior assessments are preserved in PostgreSQL and permanently auditable with cryptographic code citations.
            </p>
          </div>

          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-xs transition-colors shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>New Assessment</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-mono">Loading historical records...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-headline font-bold text-base text-slate-900 mb-1">
              No Past Assessments Found
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed font-sans">
              When you evaluate a job posting and repository, each audit run will be recorded here with its exact analyzed commit SHA and citation findings.
            </p>
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-headline font-semibold text-xs shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch First Assessment</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-xs font-mono text-slate-500">
                      ID: <strong className="text-slate-800">{item.id.slice(0, 8)}</strong>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {item.provider_name} • {item.model_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-800 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-emerald-600">{item.summary_counts?.demonstrated || 0}</strong> demonstrated
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-amber-600">{item.summary_counts?.partial_or_needs_review || 0}</strong> needs review
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-500">{item.summary_counts?.not_demonstrated_in_analyzed_scope || 0}</strong> not in scope
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/assessments/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-blue-600 text-xs font-headline font-semibold transition-colors shadow-sm"
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
  );
};
