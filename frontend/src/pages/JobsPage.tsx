import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import type { Job } from '../types';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await api.listJobs();
      setJobs(res);
      if (res.length > 0) {
        setSelectedJob(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider mb-1">
              <span>Job Discovery & Market Requirements</span>
              <span>•</span>
              <span className="text-slate-500">Live & Verified Criteria</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Target Job Requisitions
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Explore open positions with verified technical criteria. Run instant evidence assessments against your GitHub repositories to identify proven strengths and gaps.
            </p>
          </div>

          <Link
            to="/wizard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Import Job URL</span>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title, company, or tech stack..."
            className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
          />
        </div>

        {/* Job Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center shadow-sm space-y-3">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">
                  {searchTerm ? 'No Matching Job Opportunities Found' : 'No Saved Job Opportunities'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {searchTerm
                    ? `No job listings matched "${searchTerm}". Try broadening your search terms or clearing the search filter.`
                    : 'Import a target job posting from a public URL or paste requirements to start evaluating your code citations.'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Clear Search Filter
                  </button>
                ) : (
                  <Link
                    to="/wizard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Import Target Job</span>
                  </Link>
                )}
              </div>
            ) : (
              filteredJobs.map((j) => {
                const isSelected = selectedJob?.id === j.id;

                return (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJob(j)}
                    className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{j.title}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-semibold text-slate-700">{j.company || 'Enterprise Partner'}</span>
                          <span>•</span>
                          <span>{j.source_type === 'url' ? 'Verified URL' : 'Pasted Text'}</span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                        {j.extracted_requirements?.length || 4} criteria
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {j.raw_text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Job Details Drawer */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {selectedJob ? (
              <>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedJob.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedJob.company || 'Enterprise'}</p>
                  </div>
                  <Link
                    to="/wizard"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Assess My Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Extracted Technical Criteria
                  </h3>
                  <div className="space-y-2">
                    {(selectedJob.extracted_requirements || []).map((req, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-900 font-semibold mb-1">
                          <span>{req.normalized_skill}</span>
                          <span className="text-[10px] font-mono uppercase text-slate-500">
                            {req.priority_type || 'Required'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {req.original_wording}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Source: <span className="font-mono text-slate-700">{selectedJob.source_url || 'Direct employer requirement'}</span>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Select a job requisition to inspect criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
