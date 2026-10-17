import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Code2,
  FileText,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  GitCommit,
  Sparkles,
  Database,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'demonstrated' | 'unverified' | 'hidden'>('demonstrated');

  return (
    <div className="min-h-screen text-slate-900 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[650px] h-[450px] bg-blue-400/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-[500px] h-[400px] bg-indigo-400/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-10 w-[550px] h-[350px] bg-sky-300/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-20 sm:pb-28 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Area: Value Proposition */}
            <div className="lg:col-span-6 flex flex-col justify-center z-10">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-6 w-fit shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span>PROOFPATH ENTERPRISE AI SENTINEL</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-headline font-bold text-slate-900 tracking-tight leading-[1.08] mb-6">
                Your code tells a story.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
                  Make the evidence visible.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                ProofPath performs rigorous multi-source verification across employer job requirements, your résumé claims, and verified GitHub repositories — extracting commit-pinned code citations with zero hallucinations.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Link
                  to={user ? "/wizard" : "/register"}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span>{user ? "Launch Setup Wizard" : "Start New Assessment"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to={user ? "/jobs/discover" : "/login"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/90 text-slate-800 border border-slate-200 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs hover:-translate-y-0.5"
                >
                  <span>{user ? "Explore Discovered Jobs" : "Sign In to Workspace"}</span>
                </Link>
              </div>

              {/* Integrity Checklist */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Exact Commit SHA Line Numbers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Deterministic Citation Verifier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PostgreSQL & Supabase Hosted</span>
                </div>
              </div>
            </div>

            {/* Right Area: Interactive Triangulation Preview Hero Card */}
            <div className="lg:col-span-6 relative">
              <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 border border-slate-200/90 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                      3W
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Multi-Source Verification Engine</div>
                      <div className="text-[11px] text-slate-500">Live comparison: Job vs Résumé vs GitHub Code</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Audit Grade
                  </span>
                </div>

                {/* 3 Columns Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Job Posting</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-snug">
                      "FastAPI & PostgreSQL backend microservices with automated testing"
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Weight: 2 (Required)</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Applicant Résumé</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-snug">
                      "Architected high-throughput FastAPI services processing 15M requests"
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">Claim Extracted</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>GitHub Source</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-snug">
                      Verified APIRouters, dependency injection, and pytest fixtures
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono">SHA: 9df382a</div>
                  </div>
                </div>

                {/* Live Code Excerpt Preview */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <GitCommit className="w-3.5 h-3.5" />
                      backend/app/main.py:L28-L34
                    </span>
                    <span className="text-emerald-400 font-semibold">Verified Match</span>
                  </div>
                  <div className="text-slate-400 select-none text-[11px]">28  app.include_router(api_router, prefix="/api/v1")</div>
                  <div className="text-slate-300 select-none text-[11px]">29  app.add_middleware(CORSMiddleware, allow_origins=...)</div>
                  <div className="text-slate-400 select-none text-[11px]">30  # Verified dependency injection & session lifecycle</div>
                </div>

                {/* Confidence Metrics Bar */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-600 font-medium">Estimated Compatibility:</span>
                  <span className="font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    94.2% (Evidence-Backed)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triangulation Deep Dive Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-slate-900 tracking-tight">
            How Triangulation Detects Real Hiring Signals
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Most tools analyze only a résumé or run generic quiz trivia. ProofPath independently cross-verifies all three sources.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('demonstrated')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'demonstrated'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Full Multi-Source Match
            </button>
            <button
              onClick={() => setActiveTab('unverified')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'unverified'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Unverified Résumé Claim
            </button>
            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'hidden'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Hidden Repo Strength
            </button>
          </div>
        </div>

        {/* Dynamic Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                {activeTab === 'demonstrated' && 'CONFIRMED COMPETENCY // HIGH HIRING VALUE'}
                {activeTab === 'unverified' && 'POTENTIAL ATS RISK // CODE ARTIFACT MISSING'}
                {activeTab === 'hidden' && 'UNDER-REPRESENTED SKILL // PORTFOLIO ASSET FOUND'}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeTab === 'demonstrated' && 'FastAPI & REST Architecture'}
                {activeTab === 'unverified' && 'Kubernetes & Helm Orchestration'}
                {activeTab === 'hidden' && 'PostgreSQL Optimization & Indexing'}
              </h3>
            </div>
            <StatusBadge
              status={
                activeTab === 'demonstrated'
                  ? 'demonstrated'
                  : activeTab === 'unverified'
                  ? 'partial_or_needs_review'
                  : 'demonstrated'
              }
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 mb-2">
                <Briefcase className="w-4 h-4" />
                <span>1. Employer Requirement</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed">
                {activeTab === 'demonstrated' && 'Senior Backend Engineer: Must demonstrate production experience building REST microservices in FastAPI.'}
                {activeTab === 'unverified' && 'DevOps Engineer: Hands-on experience configuring Kubernetes clusters, Helm charts, and ingress routing.'}
                {activeTab === 'hidden' && 'Database Reliability: Proficiency analyzing slow SQL queries, table indexes, and transaction isolation.'}
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>2. Applicant Résumé</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed">
                {activeTab === 'demonstrated' && '"Architected high-throughput FastAPI services processing 15M monthly requests with 99.98% uptime."'}
                {activeTab === 'unverified' && '"Managed multi-region Kubernetes deployments and automated cluster failover policies."'}
                {activeTab === 'hidden' && 'Not explicitly mentioned on résumé. (Candidate under-promoted their actual database work!)'}
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 mb-2">
                <Code2 className="w-4 h-4" />
                <span>3. Repository Verification</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed">
                {activeTab === 'demonstrated' && 'Verified router declarations, dependency injection, and Pydantic validation across 4 modules.'}
                {activeTab === 'unverified' && '0 Kubernetes manifests or Helm charts detected across analyzed repository scope.'}
                {activeTab === 'hidden' && 'Discovered composite B-Tree indexes and migration rollback scripts in backend/app/db/.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="text-blue-400">
                {activeTab === 'demonstrated' && 'backend/app/api/v1/jobs.py:42-46'}
                {activeTab === 'unverified' && 'infrastructure/k8s/deployment.yaml'}
                {activeTab === 'hidden' && 'backend/app/db/migrations/004_indexes.sql:12-16'}
              </span>
              <span className="text-emerald-400">
                {activeTab === 'unverified' ? 'File Not in Tree' : 'Verified Commit SHA: 9df382a'}
              </span>
            </div>
            {activeTab === 'demonstrated' && (
              <div className="space-y-1">
                <div><span className="text-slate-600 mr-3">42</span>@router.post("/import", response_model=JobResponse, status_code=201)</div>
                <div><span className="text-slate-600 mr-3">43</span>def import_job(job_in: JobImportRequest, db: Session = Depends(get_db)):</div>
                <div><span className="text-slate-600 mr-3">44</span>    raw_text = fetch_job_url_safely(job_in.url)</div>
                <div><span className="text-slate-600 mr-3">45</span>    return save_and_format_job(db, job_in, extracted)</div>
              </div>
            )}
            {activeTab === 'unverified' && (
              <div className="text-amber-400 italic">
                Scope Limitation: No matching Kubernetes configuration files found in repository snapshot.
              </div>
            )}
            {activeTab === 'hidden' && (
              <div className="space-y-1">
                <div><span className="text-slate-600 mr-3">12</span>CREATE INDEX CONCURRENTLY idx_assessments_user_created</div>
                <div><span className="text-slate-600 mr-3">13</span>ON assessments (user_id, created_at DESC);</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-16 bg-white/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Deterministic Validation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every code finding is verified against line numbers, content hashes, and commit SHAs with zero fabricated quotes.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Personalized Testing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Custom MCQ and written architecture questions scored deterministically and against transparent rubrics.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Local RAG Retrieval</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full-text search in PostgreSQL grounds improvement tasks in verified documentation and learning resources.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">PostgreSQL & Supabase</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unified relational schema with Alembic migrations, connection pooling, and strict user-scoped security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>ProofPath Platform</span>
            <span className="font-normal text-slate-400">| Kurukshetra 2026 Production Edition</span>
          </div>
          <div className="text-slate-500">
            Built for enterprise-grade developer evidence verification.
          </div>
        </div>
      </footer>
    </div>
  );
};
