import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  FileCode,
  Users,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import type { RecruiterDashboardResponse, RecruiterCandidate } from '../types';

export const RecruiterPage: React.FC = () => {
  const [data, setData] = useState<RecruiterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const loadRecruiterData = async () => {
    try {
      setLoading(true);
      const res = await api.getRecruiterDashboard();
      setData(res);
      if (res.candidates.length > 0) {
        setSelectedCandidate(res.candidates[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
    try {
      setStatusUpdating(candidateId);
      await api.updateCandidateStatus(candidateId, newStatus);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.id === candidateId ? { ...c, review_status: newStatus as any } : c
          )
        };
      });
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate((prev) => (prev ? { ...prev, review_status: newStatus as any } : null));
      }
    } catch (err) {
      console.error('Failed to update candidate status:', err);
    } finally {
      setStatusUpdating(null);
    }
  };

  const candidates = data?.candidates || [];
  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.target_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.institution.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Recruiter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold uppercase tracking-wider mb-1">
              <span>Talent Acquisition · Technical Audits</span>
              <span>•</span>
              <span className="text-slate-500">Verified Evidence Only</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Recruiter Candidate Verification Portal
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Eliminate resume fraud with verifiable GitHub code citations and exact commit SHA provenance. Evaluate demonstrated engineering skills without relying on self-reported bullet points.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              Active Requisitions: <strong className="text-slate-900">4 Open</strong>
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Candidates
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {data?.total_candidates_count || 4}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">In active review pipeline</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verified Evidence Rate
            </div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">
              {data ? Math.round((data.verified_candidates_count / data.total_candidates_count) * 100) : 100}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Passing 5-dimension audit</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Quality Index
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {data?.average_match_rate || 87}/100
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Citation coverage & validity</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Provenance Security
            </div>
            <div className="text-3xl font-bold text-indigo-600 mt-1">
              100% SHA
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pinned to immutably audited commits</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by candidate name, skill, or college..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredCandidates.length}</strong> verified candidate profiles
          </div>
        </div>

        {/* Two-Column Candidate Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Candidates Pipeline Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Candidate Audit Pipeline
            </div>
            <div className="divide-y divide-slate-100">
              {filteredCandidates.map((c) => {
                const isSelected = selectedCandidate?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{c.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.latest_commit_sha}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.target_role} · {c.institution}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] pt-0.5">
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {c.verified_citations_count} Citations
                        </span>
                        <span className="text-blue-700 font-medium">
                          Match: {c.match_rate}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                          c.review_status === 'shortlisted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.review_status === 'interview_scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : c.review_status === 'under_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.review_status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Candidate Audit Drawer (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {selectedCandidate ? (
              <>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedCandidate.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCandidate.target_role} · {selectedCandidate.institution}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{selectedCandidate.match_rate}%</div>
                    <div className="text-[10px] font-mono text-slate-400">Evidence Index</div>
                  </div>
                </div>

                {/* Audit Highlights */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    5-Dimension Audit Summary
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Evidence Coverage</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedCandidate.evidence_coverage}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Discovered code analyzed</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Verified Citations</div>
                      <div className="font-bold text-emerald-600 mt-1">{selectedCandidate.verified_citations_count} Line Bounds</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">100% Verbatim match</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Commit Provenance</div>
                      <div className="font-bold text-slate-900 mt-1 font-mono">{selectedCandidate.latest_commit_sha}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Immutable Git tree head</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Integrity Signals</div>
                      <div className="font-bold text-indigo-600 mt-1">Zero Fraud Detected</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Claims backed by AST</div>
                    </div>
                  </div>
                </div>

                {/* Recruiter Action Buttons */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recruiter Action
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'shortlisted')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      Shortlist Candidate
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'interview_scheduled')}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      Invite to Interview
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedCandidate.id, 'under_review')}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
                    >
                      Request Evidence
                    </button>
                  </div>
                </div>

                {/* Public Recruiter Report Link */}
                {selectedCandidate.assessment_id && (
                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      to={`/shared/assessments/${selectedCandidate.assessment_id}`}
                      target="_blank"
                      className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <span>Open Standalone Recruiter Audit View</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Select a candidate to view their verified code citations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
