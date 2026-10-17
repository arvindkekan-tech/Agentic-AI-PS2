import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  ExternalLink,
  Trash2,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import type { JobApplication } from '../types';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<JobApplication['status']>('applied');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getJobApplications();
      setApplications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role) return;

    try {
      const newApp = await api.addJobApplication({
        company,
        role,
        status,
        notes,
        match_score: 88,
        applied_date: new Date().toISOString().split('T')[0]
      });
      setApplications((prev) => [newApp, ...prev]);
      setShowAddModal(false);
      setCompany('');
      setRole('');
      setNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: JobApplication['status']) => {
    try {
      await api.updateJobApplication(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await api.deleteJobApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error(err);
    }
  };

  const stages: Array<{ key: JobApplication['status']; label: string; color: string }> = [
    { key: 'saved', label: 'Saved', color: 'bg-slate-100 text-slate-700' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { key: 'interviewing', label: 'Interviewing', color: 'bg-violet-100 text-violet-800' },
    { key: 'offer', label: 'Offer Received', color: 'bg-emerald-100 text-emerald-800' },
    { key: 'rejected', label: 'Archived', color: 'bg-slate-100 text-slate-500' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              <span>Application Pipeline Tracker</span>
              <span>•</span>
              <span className="text-slate-500">Evidence Link Sharing</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Active Job Applications
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Track hiring progress, interview notes, and verified match scores across prospective tech employers.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Track Application</span>
          </button>
        </div>

        {/* Kanban Board / Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((st) => {
            const stageApps = applications.filter((a) => a.status === st.key);

            return (
              <div key={st.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${st.color}`}>
                    {st.label} ({stageApps.length})
                  </span>
                </div>

                <div className="space-y-3 min-h-[350px] p-2 rounded-2xl bg-slate-100/60 border border-slate-200/80">
                  {stageApps.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{a.company}</div>
                          <div className="text-[11px] text-slate-500 font-medium leading-snug">{a.role}</div>
                        </div>
                        {a.match_score && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">
                            {a.match_score}%
                          </span>
                        )}
                      </div>

                      {a.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                          {a.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>{a.applied_date || 'Active'}</span>

                        <div className="flex items-center gap-1">
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a.id, e.target.value as any)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                          >
                            <option value="saved">Saved</option>
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="rejected">Archived</option>
                          </select>

                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-slate-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
              <h2 className="text-base font-bold text-slate-900">Track New Job Application</h2>

              <form onSubmit={handleCreateApplication} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Razorpay, Anthropic"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Platform Engineer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Pipeline Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Notes / Recruiter Feedback</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Shared recruiter proof report; scheduled technical screen on Tuesday."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                  >
                    Save Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
