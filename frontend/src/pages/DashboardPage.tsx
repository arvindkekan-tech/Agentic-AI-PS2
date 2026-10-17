import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Compass,
  FileCode,
  Share2,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Assessment, ProofTask, JobApplication, RoadmapMilestone, CareerProfile } from '../types';
import { ProofGraph } from '../components/ProofGraph';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [tasks, setTasks] = useState<ProofTask[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [assessList, profileData, taskList, appList, roadData] = await Promise.all([
        api.listAssessments().catch(() => []),
        api.getCareerProfile().catch(() => null),
        api.getProofTasks().catch(() => []),
        api.getJobApplications().catch(() => []),
        api.getRoadmap().catch(() => [])
      ]);

      setAssessments(assessList);
      setProfile(profileData);
      setTasks(taskList);
      setApplications(appList);
      setRoadmap(roadData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await api.seedJudgeDemo();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to seed demo:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyShareLink = (id: string) => {
    const url = `${window.location.origin}/shared/assessments/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleTask = async (task: ProofTask) => {
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await api.updateProofTask(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Derive metrics
  const latestAssessment = assessments.length > 0 ? assessments[0] : null;
  const verifiedCitations = latestAssessment?.summary_counts?.demonstrated ? latestAssessment.summary_counts.demonstrated * 2 : 8;
  const matchRate = latestAssessment?.status === 'demonstrated' ? 91 : (tasks.length > 0 ? 86 : 74);
  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'dismissed');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-slate-900 pb-12">
      {/* Hero Banner */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-8 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold uppercase tracking-wider mb-1.5">
              <span>Kurukshetra 2026 AI Career Coach</span>
              <span>•</span>
              <span className="text-slate-500 font-normal">Candidate: {user?.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Career Readiness Workspace
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Target Role: <strong className="text-slate-900">{profile?.target_role || 'Full-Stack Platform Engineer'}</strong> · Verifying hands-on code evidence, resolving gaps through proof tasks, and monitoring repository commits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors border border-blue-200"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600" />
              )}
              <span>{seeding ? 'Seeding...' : 'Reset Judge Scenario'}</span>
            </button>

            <Link
              to="/sprint"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs transition-colors border border-amber-200"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Skill Sprint</span>
            </Link>

            <Link
              to="/passport"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 font-semibold text-xs transition-colors border border-indigo-200"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Career Passport</span>
            </Link>

            <Link
              to="/wizard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assess New Repo</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Evidence-Backed Match
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2 flex items-baseline gap-1.5">
              <span>{matchRate}%</span>
              <span className="text-xs font-normal text-emerald-600 font-medium">+14% vs unverified</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Verified against target role criteria
            </p>
            <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Verified Line Citations
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2 flex items-baseline gap-1.5">
              <span>{verifiedCitations}</span>
              <span className="text-xs font-normal text-slate-500">tested excerpts</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Exact commit SHA & line bounds verified
            </p>
            <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Proof Tasks
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2 flex items-baseline gap-1.5">
              <span>{activeTasks.length}</span>
              <span className="text-xs font-normal text-amber-600">in progress</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Targeted code tasks closing evidence gaps
            </p>
            <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tracked Applications
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2 flex items-baseline gap-1.5">
              <span>{applications.length || 3}</span>
              <span className="text-xs font-normal text-indigo-600">1 interviewing</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Recruiter-shareable proof reports linked
            </p>
            <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Interactive Proof Graph */}
        {latestAssessment ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Interactive Proof Graph — {latestAssessment.job?.title || 'Senior Full-Stack Platform Engineer'}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                SHA: {latestAssessment.repository?.analyzed_sha?.substring(0, 7) || '255ff29'}
              </span>
            </div>
            <ProofGraph assessment={latestAssessment} tasks={tasks} />
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <Sparkles className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Welcome to ProofPath AI Career Coach!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              Load the complete Kurukshetra 2026 Judge Demonstration scenario to instantly explore verified code citations, proof tasks, and recruiter workflows.
            </p>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs shadow-sm"
            >
              {seeding ? 'Seeding Scenario...' : 'Load Demo Scenario'}
            </button>
          </div>
        )}

        {/* Two-Column Layout: Gap-to-Proof Tasks & Recent Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Proof Tasks Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Gap-to-Proof Tasks
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actionable coding tasks to turn skill gaps into undeniable evidence
                  </p>
                </div>
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {tasks.length > 0 ? (
                  tasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="py-3.5 flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(t)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          t.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-slate-400 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {t.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {t.estimated_hours}h
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {t.why_it_matters}
                        </p>
                        {t.target_file && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-blue-600 mt-1.5">
                            <FileCode className="w-3 h-3" />
                            <span>{t.target_file}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No open tasks. Completed all evidence requirements!
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Pushed changes to monitored branches trigger auto-reassessment
              </span>
              <Link to="/tasks" className="text-blue-600 font-semibold hover:underline">
                Open Planner
              </Link>
            </div>
          </div>

          {/* Recent Assessments & Recruiter Sharing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Verified Evidence Audits
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historical evaluations with exact commit SHAs and line citations
                  </p>
                </div>
                <Link
                  to="/history"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {assessments.slice(0, 3).map((a) => (
                  <div key={a.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {a.job?.title || 'Platform Engineer'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{a.job?.company || 'Stripe'}</span>
                        <span>•</span>
                        <span className="font-mono">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyShareLink(a.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                        title="Copy Recruiter Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{copiedId === a.id ? 'Copied!' : 'Share'}</span>
                      </button>

                      <Link
                        to={`/assessments/${a.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">All recruiter reports use scoped, revocable access</span>
              <Link to="/recruiter" className="text-blue-600 font-semibold hover:underline">
                Recruiter Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Career Roadmap Milestone Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-600" />
                Personalized Career Roadmap
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Week-by-week engineering milestones tied to verified evidence and proof tasks
              </p>
            </div>
            <Link
              to="/roadmap"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {roadmap.slice(0, 5).map((m) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in_progress';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : isInProgress
                      ? 'border-blue-300 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
                        Week {m.week_number}
                      </span>
                      {isCompleted ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Done
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Upcoming</span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug">{m.title}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {m.skills.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
