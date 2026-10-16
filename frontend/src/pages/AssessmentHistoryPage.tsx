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
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F1E8] text-[#111318] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#50566A] uppercase tracking-wider mb-1">
              <History className="w-3.5 h-3.5 text-[#A99BFF]" />
              <span>Audit Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[#111318] tracking-tight">
              Assessment History & Version Archive
            </h1>
            <p className="text-xs text-[#50566A] mt-1 font-sans">
              All prior assessments are preserved and permanently auditable.
            </p>
          </div>

          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs hover:bg-[#1B1D24] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-[#C7F36B]" />
            <span>New Assessment</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#E77D83]/15 border border-[#E77D83]/30 text-xs text-[#9E2A2B] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#50566A]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111318]" />
            <p className="text-xs font-mono">Loading historical records...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
            <ShieldCheck className="w-10 h-10 text-[#50566A] mx-auto mb-3" />
            <h3 className="font-headline font-bold text-base text-[#111318] mb-1">
              No Past Assessments Found
            </h3>
            <p className="text-xs text-[#50566A] mb-6 leading-relaxed">
              When you evaluate a job posting and repository, each audit run will be recorded here with its exact analyzed commit SHA and citation findings.
            </p>
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111318] text-[#C7F36B] font-headline font-semibold text-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#C7F36B]" />
              <span>Launch First Assessment</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFEFA] border border-[#E2DDD3] rounded-2xl p-6 shadow-sm hover:border-[#111318]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-xs font-mono text-[#50566A]">
                      ID: {item.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFECE3] text-[#50566A]">
                      {item.provider_name} • {item.model_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#50566A] pt-1">
                    <span className="flex items-center gap-1.5 text-[#111318] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#50566A]" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-[#2F6F0E]">{item.summary_counts?.demonstrated || 0}</strong> demonstrated
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-[#A75D00]">{item.summary_counts?.partial_or_needs_review || 0}</strong> needs review
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-[#50566A]">{item.summary_counts?.not_demonstrated_in_analyzed_scope || 0}</strong> not in scope
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/assessments/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111318] text-[#C7F36B] hover:bg-[#1B1D24] text-xs font-headline font-semibold transition-colors"
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
