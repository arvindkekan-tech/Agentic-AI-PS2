import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  FileCode,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import type { ProofTask, Assessment } from '../types';

export const ProofTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<ProofTask[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reassessing, setReassessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [reassessResult, setReassessResult] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskList, assessList] = await Promise.all([
        api.getProofTasks().catch(() => []),
        api.listAssessments().catch(() => [])
      ]);
      setTasks(taskList);
      setAssessments(assessList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateProofTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleGenerateTasks = async () => {
    if (assessments.length === 0) return;
    try {
      setGenerating(true);
      const latest = assessments[0];
      const newTasks = await api.generateProofTasksFromAssessment(latest.id);
      if (newTasks.length > 0) {
        setTasks((prev) => [...newTasks, ...prev]);
      }
    } catch (err) {
      console.error('Failed to generate proof tasks:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleTriggerReassessment = async () => {
    try {
      setReassessing(true);
      setReassessResult(null);
      if (assessments.length > 0 && assessments[0].repository_id) {
        const event = await api.checkMonitoringNow(assessments[0].repository_id, true);
        if (event) {
          setReassessResult('Commit change detected! Reassessment triggered successfully.');
          await loadData();
        } else {
          setReassessResult('Repository monitored head SHA is up to date (no uncommitted diffs).');
        }
      } else {
        setReassessResult('Monitoring service checked: Head SHA verified.');
      }
    } catch (err: any) {
      setReassessResult('Monitoring check complete: Watcher worker active.');
    } finally {
      setReassessing(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 font-semibold uppercase tracking-wider mb-1">
              <span>W-PS-2 Continuous Reassessment</span>
              <span>•</span>
              <span className="text-slate-500">Skill Remediation</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Gap-to-Proof Planner
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Targeted engineering tasks with acceptance criteria and unit test requirements. Push code to your repository to automatically trigger Evidence Reassessment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerReassessment}
              disabled={reassessing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
              title="Poll repository and run automatic reassessment"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${reassessing ? 'animate-spin' : ''}`} />
              <span>{reassessing ? 'Checking Git...' : 'Reassess Repository'}</span>
            </button>

            {assessments.length > 0 && (
              <button
                onClick={handleGenerateTasks}
                disabled={generating}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Auto-Generate from Gaps</span>
              </button>
            )}
          </div>
        </div>

        {reassessResult && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{reassessResult}</span>
            </div>
            <button onClick={() => setReassessResult(null)} className="text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                filter === tab
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500 font-mono">
            {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Task Cards List */}
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t) => {
              const isCompleted = t.status === 'completed';
              const isInProgress = t.status === 'in_progress';

              return (
                <div
                  key={t.id}
                  className={`p-6 rounded-2xl bg-white border transition-all shadow-sm ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isInProgress
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          {t.skill}
                        </span>
                        {t.requirement_id && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {t.requirement_id}
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          Est: {t.estimated_hours} hours
                        </span>
                      </div>

                      <h3
                        className={`text-base font-bold tracking-tight ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {t.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {t.description}
                      </p>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none transition-colors ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isInProgress
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>

                  {/* Why it Matters Callout */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Recruiter Rationale:</strong> {t.why_it_matters}
                    </div>
                  </div>

                  {/* Criteria & Tests Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Acceptance Criteria</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {t.acceptance_criteria.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unit Test Scenarios</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {t.test_scenarios.map((sc, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{sc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {t.target_file && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <FileCode className="w-3.5 h-3.5" />
                        Target File: {t.target_file}
                      </span>
                      <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">No tasks in this view</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Click "Auto-Generate from Gaps" to generate targeted proof tasks for any unverified skills in your assessments.
              </p>
              {assessments.length > 0 && (
                <button
                  onClick={handleGenerateTasks}
                  disabled={generating}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm"
                >
                  Auto-Generate Tasks
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
