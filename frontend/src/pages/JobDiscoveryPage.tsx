import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import type { DiscoveredJob, JobSourceInfo, Assessment } from '../types';

export const JobDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();

  const [sources, setSources] = useState<JobSourceInfo[]>([]);
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [query, setQuery] = useState('Python');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [selectedSources, setSelectedSources] = useState<string[]>(['remotive', 'arbeitnow']);

  // Match Mode state
  const [matchMode, setMatchMode] = useState(false);
  const [skillsInput, setSkillsInput] = useState('Python, FastAPI, Docker, PostgreSQL, React, TypeScript');
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Load sources
  useEffect(() => {
    async function init() {
      try {
        const srcList = await api.getJobSources();
        setSources(srcList);
      } catch {
        // Fallback gracefully
      }
    }
    init();
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (matchMode) {
        setMatchingLoading(true);
        const parsedSkills = skillsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const results = await api.matchDiscoveredJobs({
          candidate_skills: parsedSkills,
          query: query.trim() || undefined,
          remote: remoteOnly,
          sources: selectedSources.length > 0 ? selectedSources : undefined,
          limit: 12
        });
        setJobs(results);
      } else {
        const results = await api.searchDiscoveredJobs({
          query: query.trim() || undefined,
          remote: remoteOnly,
          sources: selectedSources.length > 0 ? selectedSources : undefined,
          limit: 15
        });
        setJobs(results);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search job sources.';
      setError(msg);
    } finally {
      setLoading(false);
      setMatchingLoading(false);
    }
  }, [query, remoteOnly, selectedSources, matchMode, skillsInput]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Quick-load candidate skills from previous assessment
  const handleAutoLoadSkills = async () => {
    try {
      const history = await api.listAssessments();
      if (history.length > 0) {
        const fullAssess: Assessment = await api.getAssessment(history[0].id);
        if (fullAssess.requirements && fullAssess.requirements.length > 0) {
          const verifiedSkills = fullAssess.requirements
            .filter((r) => r.combined_status === 'demonstrated' || r.repo_status === 'demonstrated')
            .map((r) => r.normalized_skill);
          if (verifiedSkills.length > 0) {
            setSkillsInput(Array.from(new Set(verifiedSkills)).join(', '));
            setMatchMode(true);
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  // Import job and start assessment
  const handleAssessJob = async (job: DiscoveredJob) => {
    setImportingId(job.id);
    try {
      const importedJob = await api.importDiscoveredJob(job);
      navigate('/wizard', {
        state: {
          preselectedJob: importedJob
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import opportunity.';
      alert(msg);
      setImportingId(null);
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="border-b border-slate-200/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold mb-3">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Job Discovery Engine v2.0</span>
              </div>
              <h1 className="text-3xl font-headline font-bold text-slate-900">
                Discover Opportunities Grounded in Code
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl font-sans">
                Search verified live engineering postings across Remotive, Arbeitnow, and Schema.org feeds.
                Match them directly against your verified portfolio strengths.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMatchMode(!matchMode)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  matchMode
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{matchMode ? 'Skill Match Active' : 'Match With My Skills'}</span>
              </button>
            </div>
          </div>

          {/* Match Mode Drawer */}
          {matchMode && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Candidate Skills for Fit Scoring (comma separated)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoLoadSkills}
                  className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors font-semibold"
                >
                  Load from my latest assessment
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Python, FastAPI, Docker, PostgreSQL, React, Kubernetes"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
                <button
                  onClick={fetchJobs}
                  disabled={matchingLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {matchingLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Calculate Fit'}
                </button>
              </div>
            </div>
          )}

          {/* Search Controls */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                placeholder="Search by role or keywords (e.g. Python, Full-Stack, React, Go)..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap font-medium ${
                  remoteOnly
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Remote Only</span>
              </button>

              {sources.map((src) => {
                const isSelected = selectedSources.includes(src.source_id);
                return (
                  <button
                    key={src.source_id}
                    onClick={() => toggleSource(src.source_id)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap font-medium ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{src.source_name.split(' ')[0]}</span>
                  </button>
                );
              })}

              <button
                onClick={fetchJobs}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 mb-6 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="text-sm font-sans">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-mono">Aggregating live developer postings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center rounded-2xl glass-card p-8">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-headline font-semibold text-slate-900">No matches found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto font-sans">
              Try searching with broader terms like &quot;Python&quot;, &quot;Full-Stack&quot;, or toggle additional providers.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedSources(['remotive', 'arbeitnow']);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-mono text-blue-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-slate-500">
                Found <strong className="text-slate-800">{jobs.length}</strong> relevant opportunit{jobs.length === 1 ? 'y' : 'ies'}
              </span>
              {matchMode && (
                <span className="text-xs font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sorted by portfolio skill compatibility
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                const isImporting = importingId === job.id;
                return (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between rounded-2xl glass-card hover:border-blue-300 p-5 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Top Bar with source & fit badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          {job.source_name.split(' ')[0]}
                        </span>

                        {job.match_score !== undefined && job.match_score !== null && (
                          <div
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1 ${
                              job.match_score >= 70
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : job.match_score >= 40
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{Math.round(job.match_score)}% Fit</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-headline font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        <span>{job.company}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{job.location || 'Remote'}</span>
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salary_range}</span>
                          </span>
                        )}
                        {job.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(job.published_at).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      {/* Description excerpt */}
                      <p className="text-xs text-slate-600 mt-3 line-clamp-3 font-sans leading-relaxed">
                        {job.description}
                      </p>

                      {/* Tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.tags.slice(0, 5).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                          {job.tags.length > 5 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 text-slate-400">
                              +{job.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Matched skills highlight */}
                      {job.matched_skills && job.matched_skills.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[10px] font-mono text-emerald-700 font-bold block mb-1">
                            Verified Skills Matched:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {job.matched_skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-mono transition-colors"
                      >
                        <span>Original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleAssessJob(job)}
                        disabled={isImporting}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <span>Assess Fit</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
