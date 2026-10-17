import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  FileCode,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import type { RoadmapMilestone } from '../types';

export const RoadmapPage: React.FC = () => {
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.getRoadmap();
      setMilestones(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 font-semibold uppercase tracking-wider mb-1">
              <span>Career Trajectory</span>
              <span>•</span>
              <span className="text-slate-500">6-Week Milestone Progression</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-600" />
              Personalized Career Roadmap
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Target Role: <strong className="text-slate-900">Full-Stack Platform Engineer</strong>. Milestones update dynamically as your repository evidence grows and proof tasks are completed.
            </p>
          </div>

          <Link
            to="/tasks"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Proof Tasks</span>
          </Link>
        </div>

        {/* Milestone Timeline Cards */}
        <div className="space-y-4">
          {milestones.map((m) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';

            return (
              <div
                key={m.id}
                className={`p-6 rounded-2xl bg-white border transition-all shadow-sm ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isInProgress
                    ? 'border-blue-400 bg-blue-50/20 ring-2 ring-blue-500/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase text-slate-500">
                        Week {m.week_number}
                      </span>
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Current Milestone
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Planned
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{m.title}</h2>
                    <p className="text-xs text-slate-500">Target Role: {m.target_role}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {m.skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subtasks */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {m.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          task.done ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {task.done && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={task.done ? 'line-through text-slate-400' : ''}>
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
