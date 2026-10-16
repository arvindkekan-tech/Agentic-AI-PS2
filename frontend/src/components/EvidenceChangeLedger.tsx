import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import type { ChangeEvent, MonitoringStatusResponse } from '../types';
import { api } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface EvidenceChangeLedgerProps {
  repositoryId: string;
  onSelectAssessment?: (assessmentId: string) => void;
}

export const EvidenceChangeLedger: React.FC<EvidenceChangeLedgerProps> = ({
  repositoryId,
  onSelectAssessment
}) => {
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatusResponse | null>(null);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchStatusAndEvents = async () => {
    try {
      setError(null);
      const [statusRes, eventsRes] = await Promise.all([
        api.getMonitoringStatus(repositoryId),
        api.listChangeEvents(repositoryId, 25)
      ]);
      setMonitoringStatus(statusRes);
      setEvents(eventsRes);
      if (eventsRes.length > 0 && !expandedEventId) {
        setExpandedEventId(eventsRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load repository monitoring status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndEvents();
    // Auto-refresh polling every 15 seconds to reflect server-side commit detection
    const interval = setInterval(fetchStatusAndEvents, 15000);
    return () => clearInterval(interval);
  }, [repositoryId]);

  const handleCheckNow = async () => {
    setChecking(true);
    setError(null);
    try {
      const newEvent = await api.checkMonitoringNow(repositoryId, true);
      await fetchStatusAndEvents();
      if (newEvent) {
        setExpandedEventId(newEvent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error checking for updates');
    } finally {
      setChecking(false);
    }
  };

  const getDeltaBadge = (delta: 'improved' | 'regressed' | 'unchanged') => {
    if (delta === 'improved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-3 h-3" /> Improved
        </span>
      );
    }
    if (delta === 'regressed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Regressed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Unchanged
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center backdrop-blur-sm">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Connecting to server change detection ledger...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Activity className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">Evidence Change Ledger</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Server Poller ({monitoringStatus?.monitoring_interval_seconds || 30}s)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automatically inspects branch head, tracks commit deltas, and reassesses affected skill evidence without manual intervention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-slate-500">Tracked Head SHA</p>
            <p className="text-xs font-mono text-indigo-300">
              {monitoringStatus?.analyzed_sha ? monitoringStatus.analyzed_sha.slice(0, 7) : 'None'}
            </p>
          </div>
          <button
            onClick={handleCheckNow}
            disabled={checking}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
            id="ecl-check-now-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking GitHub...' : 'Check Head SHA'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Events Timeline */}
      <div className="mt-6 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
            <GitBranch className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No Commit Events Detected Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              ProofPath's background watcher is monitoring this repository's branch. Push a new commit to GitHub to watch automatic re-evaluation in real time.
            </p>
            <button
              onClick={handleCheckNow}
              disabled={checking}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <RefreshCw className="w-3 h-3" />
              Check Now
            </button>
          </div>
        ) : (
          events.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            return (
              <div
                key={evt.id}
                className="bg-slate-950/50 border border-slate-800/80 rounded-xl overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Event Summary Bar */}
                <div
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-lg bg-slate-800 text-slate-300 mt-0.5">
                      <GitCommit className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {evt.commit_sha.slice(0, 7)}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {evt.commit_message || 'Commit update'}
                        </h4>
                        {evt.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {evt.status === 'running' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Reassessing...
                          </span>
                        )}
                        {evt.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>by {evt.commit_author || 'Developer'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>{evt.changed_files.length} file(s) changed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {evt.commit_url && (
                      <a
                        href={evt.commit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                        title="View commit on GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 bg-slate-900/40">
                    {/* Changed Files */}
                    {evt.changed_files.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-slate-400" />
                          Changed Files in this Commit
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {evt.changed_files.map((file, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2"
                            >
                              <span className="text-slate-400">{file.filename}</span>
                              <span className="text-[10px] text-emerald-400">+{file.additions}</span>
                              <span className="text-[10px] text-rose-400">-{file.deletions}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Before / After Requirement Impact */}
                    {evt.before_after_diff.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Requirement Evidence Delta & Reassessment
                        </p>
                        <div className="overflow-x-auto border border-slate-800 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                              <tr>
                                <th className="p-3">Skill / Requirement</th>
                                <th className="p-3">Previous Status</th>
                                <th className="p-3">Current Status</th>
                                <th className="p-3">Impact</th>
                                <th className="p-3">Evidence Delta</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {evt.before_after_diff.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50">
                                  <td className="p-3 font-medium text-slate-200">
                                    <div className="font-semibold text-slate-100">{item.skill}</div>
                                    <div className="text-[11px] text-slate-400">{item.requirement_id}</div>
                                  </td>
                                  <td className="p-3">
                                    <StatusBadge status={item.previous_status} />
                                  </td>
                                  <td className="p-3">
                                    <StatusBadge status={item.current_status} />
                                  </td>
                                  <td className="p-3">
                                    {getDeltaBadge(item.status_delta)}
                                  </td>
                                  <td className="p-3 text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-400">{item.previous_citations_count} citations</span>
                                      <ArrowRight className="w-3 h-3 text-slate-500" />
                                      <span className="font-medium text-emerald-400">{item.current_citations_count} citations</span>
                                    </div>
                                    {item.citations_diff_summary && (
                                      <div className="text-[10px] text-slate-500 mt-0.5">{item.citations_diff_summary}</div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500 italic">
                        {evt.summary || 'No direct requirement status changes recorded for this commit.'}
                      </p>
                    )}

                    {/* Action Link to Newly Reassessed Report */}
                    {evt.assessment_id && onSelectAssessment && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => onSelectAssessment(evt.assessment_id!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                        >
                          View Reassessed Assessment Report
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
