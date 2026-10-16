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
    <div className="min-h-screen bg-[#111318] text-[#F4F1E8] pb-16">
      {/* Top Banner */}
      <div className="border-b border-[#282B36] bg-[#1B1D24]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[#C7F36B]/10 text-[#C7F36B] border border-[#C7F36B]/20 mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>Job Discovery Engine v2.0</span>
              </div>
              <h1 className="text-3xl font-headline font-bold text-[#FFFEFA]">
                Discover Opportunities Grounded in Code
              </h1>
              <p className="text-sm text-[#A0A5B5] mt-1 max-w-2xl font-sans">
                Search verified live engineering postings across Remotive, Arbeitnow, and Schema.org feeds.
                Match them directly against your verified portfolio strengths.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMatchMode(!matchMode)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  matchMode
                    ? 'bg-[#C7F36B] text-[#111318] shadow-lg shadow-[#C7F36B]/20'
                    : 'bg-[#282B36] hover:bg-[#323644] text-[#F4F1E8] border border-[#323644]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{matchMode ? 'Skill Match Active' : 'Match With My Skills'}</span>
              </button>
            </div>
          </div>

          {/* Match Mode Drawer */}
          {matchMode && (
            <div className="mt-6 p-4 rounded-xl bg-[#282B36]/80 border border-[#C7F36B]/30 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#C7F36B] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Candidate Skills for Fit Scoring (comma separated)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoLoadSkills}
                  className="text-xs text-[#A0A5B5] hover:text-[#C7F36B] underline cursor-pointer transition-colors"
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
                  className="flex-1 bg-[#111318] border border-[#323644] rounded-lg px-3.5 py-2 text-sm text-[#F4F1E8] focus:outline-none focus:border-[#C7F36B]"
                />
                <button
                  onClick={fetchJobs}
                  disabled={matchingLoading}
                  className="px-4 py-2 rounded-lg bg-[#C7F36B] text-[#111318] font-medium text-sm hover:bg-[#b5e05d] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {matchingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calculate Fit'}
                </button>
              </div>
            </div>
          )}

          {/* Search Controls */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#A0A5B5]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                placeholder="Search by role or keywords (e.g. Python, Full-Stack, React, Go)..."
                className="w-full bg-[#1B1D24] border border-[#323644] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F4F1E8] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  remoteOnly
                    ? 'bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/40'
                    : 'bg-[#1B1D24] text-[#A0A5B5] border border-[#323644]'
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
                    className={`px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#A99BFF]/20 text-[#A99BFF] border border-[#A99BFF]/40'
                        : 'bg-[#1B1D24] text-[#A0A5B5] border border-[#323644]'
                    }`}
                  >
                    <span>{src.source_name.split(' ')[0]}</span>
                  </button>
                );
              })}

              <button
                onClick={fetchJobs}
                className="px-4 py-2 rounded-lg bg-[#282B36] hover:bg-[#323644] text-[#F4F1E8] text-xs font-medium border border-[#323644] transition-colors cursor-pointer"
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
          <div className="p-4 rounded-xl bg-[#E77D83]/10 border border-[#E77D83]/30 text-[#E77D83] flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-sans">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7F36B] mx-auto mb-3" />
            <p className="text-sm text-[#A0A5B5] font-mono">Aggregating live developer postings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#1B1D24]/50 border border-[#282B36] p-8">
            <Briefcase className="w-12 h-12 text-[#A0A5B5] mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-headline font-semibold text-[#FFFEFA]">No matches found</h3>
            <p className="text-sm text-[#A0A5B5] mt-1 max-w-md mx-auto font-sans">
              Try searching with broader terms like &quot;Python&quot;, &quot;Full-Stack&quot;, or toggle additional providers.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedSources(['remotive', 'arbeitnow']);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#282B36] hover:bg-[#323644] text-xs font-mono text-[#C7F36B] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#A0A5B5]">
                Found {jobs.length} relevant opportunit{jobs.length === 1 ? 'y' : 'ies'}
              </span>
              {matchMode && (
                <span className="text-xs font-mono text-[#C7F36B] flex items-center gap-1">
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
                    className="flex flex-col justify-between rounded-2xl bg-[#1B1D24] border border-[#282B36] hover:border-[#323644] p-5 transition-all duration-200 group"
                  >
                    <div>
                      {/* Top Bar with source & fit badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#A0A5B5] px-2 py-0.5 rounded bg-[#282B36]">
                          {job.source_name.split(' ')[0]}
                        </span>

                        {job.match_score !== undefined && job.match_score !== null && (
                          <div
                            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1 ${
                              job.match_score >= 70
                                ? 'bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/30'
                                : job.match_score >= 40
                                ? 'bg-[#F3B66D]/20 text-[#F3B66D] border border-[#F3B66D]/30'
                                : 'bg-[#282B36] text-[#A0A5B5]'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{Math.round(job.match_score)}% Fit</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-headline font-bold text-[#FFFEFA] line-clamp-2 group-hover:text-[#C7F36B] transition-colors">
                        {job.title}
                      </h3>

                      <p className="text-xs text-[#A0A5B5] mt-1 font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#C7F36B]" />
                        <span>{job.company}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#A0A5B5]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#A0A5B5]" />
                          <span>{job.location || 'Remote'}</span>
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1 text-[#C7F36B]">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salary_range}</span>
                          </span>
                        )}
                        {job.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(job.published_at).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      {/* Description excerpt */}
                      <p className="text-xs text-[#A0A5B5] mt-3 line-clamp-3 font-sans leading-relaxed">
                        {job.description}
                      </p>

                      {/* Tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.tags.slice(0, 5).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F4F1E8]"
                            >
                              {t}
                            </span>
                          ))}
                          {job.tags.length > 5 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 text-[#A0A5B5]">
                              +{job.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Matched skills highlight */}
                      {job.matched_skills && job.matched_skills.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#282B36]/60">
                          <span className="text-[10px] font-mono text-[#C7F36B] block mb-1">
                            Verified Skills Matched:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {job.matched_skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C7F36B]/10 text-[#C7F36B] border border-[#C7F36B]/20"
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-3 border-t border-[#282B36] flex items-center justify-between gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#A0A5B5] hover:text-[#FFFEFA] flex items-center gap-1 font-mono transition-colors"
                      >
                        <span>Original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleAssessJob(job)}
                        disabled={isImporting}
                        className="px-3.5 py-2 rounded-xl bg-[#C7F36B] hover:bg-[#b5e05d] text-[#111318] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-[#C7F36B]/20 cursor-pointer disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
