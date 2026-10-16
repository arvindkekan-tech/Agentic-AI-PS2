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
  Terminal,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'demonstrated' | 'unverified' | 'hidden'>('demonstrated');
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#090D12] text-[#F4F5F2] selection:bg-[#D6FF63] selection:text-[#090D12] relative overflow-hidden">
      {/* Background ambient radial glow matching owl's glowing eye */}
      <div className="absolute top-0 right-1/4 w-[750px] h-[550px] bg-[#D6FF63]/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-[500px] h-[450px] bg-[#A99BFF]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-10 w-[600px] h-[400px] bg-[#D6FF63]/4 blur-[150px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-20 sm:pb-28 border-b border-[#29313B]/70">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Area: Narrative & CTAs */}
            <div className="lg:col-span-5 flex flex-col justify-center z-10">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#171D25] border border-[#29313B] text-xs font-mono text-[#D6FF63] mb-6 w-fit shadow-[0_0_15px_rgba(214,255,99,0.12)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6FF63] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D6FF63]" />
                </span>
                <span className="tracking-wide">AI EVIDENCE SENTINEL // PROOFPATH CORE</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-headline font-bold text-[#F4F5F2] tracking-tight leading-[1.08] mb-6">
                Your code tells a story.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6FF63] via-[#E8FFA1] to-[#A99BFF] drop-shadow-[0_0_30px_rgba(214,255,99,0.35)]">
                  Make the evidence visible.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-[#A9B0BC] leading-relaxed mb-8 max-w-lg font-sans">
                ProofPath performs rigorous multi-source triangulation between employer job requirements, your résumé claims, and verified GitHub repositories — extracting commit-pinned code citations with zero hallucinations.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Link
                  to={user ? "/wizard" : "/register"}
                  className="inline-flex items-center gap-2.5 px-6 py-4 rounded-xl bg-[#D6FF63] text-[#090D12] font-headline font-bold text-sm hover:bg-[#c2ec4b] transition-all shadow-[0_0_25px_rgba(214,255,99,0.28)] hover:shadow-[0_0_35px_rgba(214,255,99,0.45)] hover:-translate-y-0.5"
                >
                  <span>{user ? "Launch Setup Wizard" : "Audit Your Evidence Now"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <Link
                  to={user ? "/jobs/discover" : "/login"}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[#171D25] text-[#F4F5F2] border border-[#29313B] font-headline font-medium text-sm hover:bg-[#222933] hover:border-[#D6FF63]/40 transition-all hover:-translate-y-0.5"
                >
                  <span>{user ? "Explore Discovered Jobs" : "Sign In to Workspace"}</span>
                </Link>
              </div>

              {/* Integrity Checklist Chips */}
              <div className="pt-6 border-t border-[#29313B]/60 flex flex-wrap gap-y-2 gap-x-6 text-xs text-[#A9B0BC] font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6FF63]" />
                  <span>Exact Commit SHA Line Numbers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6FF63]" />
                  <span>Anti-Hallucination Verifier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D6FF63]" />
                  <span>Safe Static Read-Only AST</span>
                </div>
              </div>
            </div>

            {/* Right Area: Futuristic Owl Animation Centerpiece (Expanded) */}
            <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center">
              {/* Circular Illuminated Ring Glow complementing the owl platform */}
              <div className="absolute inset-0 -m-6 sm:-m-12 rounded-full bg-gradient-to-tr from-[#D6FF63]/18 via-[#D6FF63]/5 to-[#A99BFF]/15 blur-[65px] pointer-events-none" />

              {/* Outer HUD Showcase Container */}
              <div className="relative w-full rounded-2xl sm:rounded-3xl border border-[#29313B] bg-[#090D12] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(214,255,99,0.12)] group">
                
                {/* Top HUD Telemetry Bar */}
                <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#090D12]/75 backdrop-blur-md border-b border-[#29313B]/80 text-[11px] sm:text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D6FF63] shadow-[0_0_10px_#D6FF63] animate-pulse" />
                    <span className="text-[#F4F5F2] font-semibold tracking-wider">PROOFPATH AI SENTINEL</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#A9B0BC]">
                    <span className="hidden sm:inline">STATE: MONITORING</span>
                    <span className="px-2.5 py-0.5 rounded bg-[#171D25] text-[#D6FF63] border border-[#29313B] font-semibold">
                      60 FPS STREAM
                    </span>
                  </div>
                </div>

                {/* Looping Owl Video Player - Expanded Height & Scale */}
                <div className="relative w-full aspect-video min-h-[320px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[540px] xl:min-h-[580px] bg-[#090D12] flex items-center justify-center overflow-hidden">
                  <video
                    src="/hero-owl.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedData={() => setVideoLoaded(true)}
                    className={`w-full h-full object-contain sm:scale-105 lg:scale-110 transition-all duration-700 ${
                      videoLoaded ? 'opacity-100' : 'opacity-80'
                    }`}
                  />

                  {/* Seamless Vignette Overlay to blend video boundaries naturally into the page */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090D12]/60 via-transparent to-[#090D12]/40" />
                  <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-[#090D12]/40" />

                  {/* Corner Targeting Reticles */}
                  <div className="pointer-events-none absolute top-14 left-5 w-5 h-5 border-t-2 border-l-2 border-[#D6FF63]/60" />
                  <div className="pointer-events-none absolute top-14 right-5 w-5 h-5 border-t-2 border-r-2 border-[#D6FF63]/60" />
                  <div className="pointer-events-none absolute bottom-14 left-5 w-5 h-5 border-b-2 border-l-2 border-[#D6FF63]/60" />
                  <div className="pointer-events-none absolute bottom-14 right-5 w-5 h-5 border-b-2 border-r-2 border-[#D6FF63]/60" />
                </div>

                {/* Bottom HUD Telemetry Status */}
                <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[#090D12]/75 backdrop-blur-md border-t border-[#29313B]/80 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-[#A9B0BC]">
                    <Cpu className="w-3.5 h-3.5 text-[#D6FF63]" />
                    <span>NEURAL CITATION AUDITOR</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#D6FF63]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="font-semibold tracking-wide">100% EVIDENCE GROUNDED</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Philosophy Banner */}
      <section className="py-8 bg-[#11161D]/60 border-b border-[#29313B]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#A9B0BC]">
            <div className="flex items-center gap-2.5 text-[#F4F5F2]">
              <ShieldCheck className="w-4 h-4 text-[#D6FF63]" />
              <span className="font-semibold tracking-wide">The ProofPath Integrity Manifesto:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] sm:text-xs">
              <span className="text-[#F4F5F2]">Missing résumé ≠ Missing skill</span>
              <span className="text-[#29313B]">•</span>
              <span className="text-[#F4F5F2]">Not in repo ≠ Incompetence</span>
              <span className="text-[#29313B]">•</span>
              <span className="text-[#F4F5F2]">README mention ≠ Production implementation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Evidence Simulator (Multi-Source Triangulation Demo) */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171D25] border border-[#29313B] text-xs font-mono text-[#D6FF63] mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>TRIANGULATION ENGINE IN ACTION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-headline font-bold text-[#F4F5F2] mb-4">
            How ProofPath Evaluates Real Code
          </h2>
          <p className="text-sm sm:text-base text-[#A9B0BC] leading-relaxed">
            Hiring managers don't trust self-reported skills. We correlate job requirements against résumé claims and inspect actual source code lines to prove genuine experience.
          </p>

          {/* Interactive Scenario Switcher */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-[#11161D] border border-[#29313B] max-w-xl mx-auto">
            <button
              onClick={() => setActiveTab('demonstrated')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'demonstrated'
                  ? 'bg-[#D6FF63] text-[#090D12] font-semibold shadow-[0_0_15px_rgba(214,255,99,0.25)]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]'
              }`}
            >
              1. Full Multi-Source Match
            </button>
            <button
              onClick={() => setActiveTab('unverified')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'unverified'
                  ? 'bg-[#F3B66D] text-[#090D12] font-semibold shadow-[0_0_15px_rgba(243,182,109,0.25)]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]'
              }`}
            >
              2. Unverified Résumé Claim
            </button>
            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-4 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === 'hidden'
                  ? 'bg-[#A99BFF] text-[#090D12] font-semibold shadow-[0_0_15px_rgba(169,155,255,0.25)]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]'
              }`}
            >
              3. Hidden Repo Strength
            </button>
          </div>
        </div>

        {/* Dynamic Triangulation Card */}
        <div className="rounded-3xl border border-[#29313B] bg-[#11161D] p-6 sm:p-8 shadow-2xl relative">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#29313B]">
            <div>
              <div className="text-xs font-mono text-[#D6FF63] uppercase tracking-wider mb-1">
                {activeTab === 'demonstrated' && 'CONFIRMED COMPETENCY // HIGH HIRING VALUE'}
                {activeTab === 'unverified' && 'POTENTIAL ATS RISK // CODE ARTIFACT MISSING'}
                {activeTab === 'hidden' && 'UNDER-REPRESENTED SKILL // PORTFOLIO ASSET FOUND'}
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold text-white">
                {activeTab === 'demonstrated' && 'FastAPI & REST Architecture'}
                {activeTab === 'unverified' && 'Kubernetes & Helm Orchestration'}
                {activeTab === 'hidden' && 'PostgreSQL Optimization & Indexing'}
              </h3>
            </div>
            <div>
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
          </div>

          {/* 3 Source Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 1. Job Requirement */}
            <div className="bg-[#171D25] p-5 rounded-2xl border border-[#29313B]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A99BFF] mb-3">
                <Briefcase className="w-4 h-4" />
                <span className="font-semibold">1. Employer Requirement</span>
              </div>
              <div className="text-xs font-medium text-white mb-2">
                {activeTab === 'demonstrated' && 'Senior Backend Engineer: Must demonstrate production experience building REST microservices in FastAPI.'}
                {activeTab === 'unverified' && 'DevOps Engineer: Hands-on experience configuring Kubernetes clusters, Helm charts, and ingress routing.'}
                {activeTab === 'hidden' && 'Database Reliability: Proficiency analyzing slow SQL queries, table indexes, and transaction isolation.'}
              </div>
              <div className="text-[11px] font-mono text-[#A9B0BC]">Priority: Required (Weight: 2)</div>
            </div>

            {/* 2. Résumé Claim */}
            <div className="bg-[#171D25] p-5 rounded-2xl border border-[#29313B]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#F3B66D] mb-3">
                <FileText className="w-4 h-4" />
                <span className="font-semibold">2. Applicant Résumé</span>
              </div>
              <div className="text-xs font-medium text-white mb-2">
                {activeTab === 'demonstrated' && '"Architected high-throughput FastAPI services processing 15M monthly requests with 99.98% uptime."'}
                {activeTab === 'unverified' && '"Managed multi-region Kubernetes deployments and automated cluster failover policies."'}
                {activeTab === 'hidden' && 'Not explicitly mentioned on résumé. (Candidate under-promoted their actual database work!)'}
              </div>
              <div className="text-[11px] font-mono text-[#A9B0BC]">
                Status:{' '}
                {activeTab === 'hidden' ? (
                  <span className="text-[#F3B66D]">Omitted from CV</span>
                ) : (
                  <span className="text-[#D6FF63]">Explicitly Claimed</span>
                )}
              </div>
            </div>

            {/* 3. GitHub Codebase */}
            <div className="bg-[#171D25] p-5 rounded-2xl border border-[#29313B]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#D6FF63] mb-3">
                <Code2 className="w-4 h-4" />
                <span className="font-semibold">3. Repository Verification</span>
              </div>
              <div className="text-xs font-medium text-white mb-2">
                {activeTab === 'demonstrated' && 'Verified router declarations, dependency injection, and Pydantic validation across 4 modules.'}
                {activeTab === 'unverified' && '0 Kubernetes manifests or Helm charts detected across analyzed repository scope.'}
                {activeTab === 'hidden' && 'Discovered composite B-Tree indexes and migration rollback scripts in backend/app/db/.'}
              </div>
              <div className="text-[11px] font-mono text-[#A9B0BC]">
                Evidence:{' '}
                {activeTab === 'unverified' ? (
                  <span className="text-[#E77D83]">Zero Supporting Code</span>
                ) : (
                  <span className="text-[#D6FF63]">Verified In Code Snapshot</span>
                )}
              </div>
            </div>
          </div>

          {/* Cryptographic Citation Output */}
          <div className="bg-[#090D12] rounded-2xl border border-[#29313B] p-5 font-mono text-xs overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-[#29313B] text-[11px] text-[#A9B0BC] gap-2">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#D6FF63]" />
                <span className="text-white font-semibold">
                  {activeTab === 'demonstrated' && 'backend/app/api/v1/jobs.py'}
                  {activeTab === 'unverified' && 'infrastructure/k8s/deployment.yaml'}
                  {activeTab === 'hidden' && 'backend/app/db/migrations/004_indexes.sql'}
                </span>
                <span className="text-[#50566A]">
                  SHA: {activeTab === 'unverified' ? 'NO_MATCH' : '9df382a'}
                </span>
              </div>
              <div className="text-[11px] text-[#D6FF63]">
                {activeTab === 'demonstrated' && 'Lines 42–48 (Verified Match)'}
                {activeTab === 'unverified' && 'File Not Found in Analyzed Tree'}
                {activeTab === 'hidden' && 'Lines 12–19 (Verified Match)'}
              </div>
            </div>

            {activeTab === 'demonstrated' && (
              <div className="space-y-1 text-[#F4F5F2]">
                <div><span className="text-[#50566A] mr-4 select-none">42</span>@router.post("/import", response_model=JobResponse, status_code=201)</div>
                <div><span className="text-[#50566A] mr-4 select-none">43</span>def import_job(job_in: JobImportRequest, db: Session = Depends(get_db)):</div>
                <div><span className="text-[#50566A] mr-4 select-none">44</span>    raw_text = fetch_job_url_safely(job_in.url)</div>
                <div><span className="text-[#50566A] mr-4 select-none">45</span>    extracted = extract_grounded_requirements(raw_text)</div>
                <div><span className="text-[#50566A] mr-4 select-none">46</span>    return save_and_format_job(db, job_in, extracted)</div>
              </div>
            )}

            {activeTab === 'unverified' && (
              <div className="py-2 text-[#E77D83] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>[AUDIT WARNING]: Repository contains no matching Kubernetes configuration. In technical screens, interviewers may challenge this claim.</span>
              </div>
            )}

            {activeTab === 'hidden' && (
              <div className="space-y-1 text-[#F4F5F2]">
                <div><span className="text-[#50566A] mr-4 select-none">12</span>CREATE INDEX CONCURRENTLY idx_assessments_user_status</div>
                <div><span className="text-[#50566A] mr-4 select-none">13</span>ON assessments (user_id, status)</div>
                <div><span className="text-[#50566A] mr-4 select-none">14</span>WHERE deleted_at IS NULL;</div>
              </div>
            )}
          </div>

          {/* Actionable Recommendation Bar */}
          <div className="mt-6 p-4 rounded-xl bg-[#171D25] border border-[#29313B] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-[#A9B0BC]">
              <Sparkles className="w-4 h-4 text-[#D6FF63]" />
              <span className="text-white font-semibold">Recommended Candidate Action:</span>
              <span>
                {activeTab === 'demonstrated' && 'Keep automated test coverage active to preserve demonstrated status.'}
                {activeTab === 'unverified' && 'Add sample Helm charts or clarify proprietary cluster scope on résumé.'}
                {activeTab === 'hidden' && 'Add "PostgreSQL query index optimization" to your CV project bullets immediately!'}
              </span>
            </div>
            <Link to={user ? "/wizard" : "/register"} className="hidden sm:inline-flex items-center gap-1 text-[#D6FF63] hover:underline">
              <span>Run on your repo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* Triangulation Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#29313B]/70">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-[#F4F5F2] mb-3">
            Engineered for Grounded Authenticity
          </h2>
          <p className="text-sm text-[#A9B0BC]">
            We reject arbitrary AI scores. ProofPath operates like a senior principal engineer reviewing technical PRs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#11161D] p-7 rounded-2xl border border-[#29313B] relative hover:border-[#D6FF63]/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-[#D6FF63]/15 border border-[#D6FF63]/30 flex items-center justify-center text-[#D6FF63] mb-6 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2.5">
              SSRF-Protected Ingestion
            </h3>
            <p className="text-xs text-[#A9B0BC] leading-relaxed">
              Job descriptions can be imported directly from live postings. ProofPath resolves DNS records deterministically and blocks cloud metadata IPs and private VPC CIDRs.
            </p>
          </div>

          <div className="bg-[#11161D] p-7 rounded-2xl border border-[#29313B] relative hover:border-[#A99BFF]/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-[#A99BFF]/15 border border-[#A99BFF]/30 flex items-center justify-center text-[#A99BFF] mb-6 group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2.5">
              Bounded Source Inspection
            </h3>
            <p className="text-xs text-[#A9B0BC] leading-relaxed">
              We never execute untrusted user code or run arbitrary scripts. Static AST inspection is capped at 30 source files and 50KB per file, ensuring deterministic evaluation.
            </p>
          </div>

          <div className="bg-[#11161D] p-7 rounded-2xl border border-[#29313B] relative hover:border-[#F3B66D]/50 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-xl bg-[#F3B66D]/15 border border-[#F3B66D]/30 flex items-center justify-center text-[#F3B66D] mb-6 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2.5">
              Deterministic Citation Audit
            </h3>
            <p className="text-xs text-[#A9B0BC] leading-relaxed">
              Every positive finding requires a verifiable commit-pinned SHA and line excerpt. Any citation that fails SHA or line bounds check is immediately downgraded.
            </p>
          </div>
        </div>
      </section>

      {/* Ready to Proof Your Skills CTA Banner */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#090D12] via-[#11161D] to-[#090D12] border-t border-[#29313B]/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-14 rounded-3xl border border-[#29313B] bg-[#171D25]/90 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D6FF63]/10 blur-[90px] pointer-events-none rounded-full" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-white mb-4">
                Ready to make your engineering evidence indisputable?
              </h2>
              <p className="text-sm sm:text-base text-[#A9B0BC] max-w-2xl mx-auto mb-8 font-sans">
                Connect your public GitHub repository, upload your current résumé, and generate a verified multi-source report in under 60 seconds.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to={user ? "/wizard" : "/register"}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#D6FF63] text-[#090D12] font-headline font-bold text-sm hover:bg-[#c2ec4b] transition-all shadow-[0_0_25px_rgba(214,255,99,0.3)] hover:-translate-y-0.5"
                >
                  <span>{user ? "Start New Assessment" : "Create Free Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#090D12] text-[#F4F5F2] border border-[#29313B] font-headline font-medium text-sm hover:bg-[#11161D] transition-colors"
                >
                  <span>{user ? "Go to Workspace" : "Sign In to Existing Account"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#29313B]/80 bg-[#090D12] text-xs font-mono text-[#A9B0BC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#D6FF63] flex items-center justify-center text-[#090D12] font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-bold tracking-tight">ProofPath Sentinel</span>
              <span className="mx-2 text-[#29313B]">•</span>
              <span>Developer Evidence Intelligence Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/jobs/discover" className="hover:text-[#D6FF63] transition-colors">
              Job Discovery
            </Link>
            <Link to="/wizard" className="hover:text-[#D6FF63] transition-colors">
              Assessment Wizard
            </Link>
            <Link to="/dashboard" className="hover:text-[#D6FF63] transition-colors">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
