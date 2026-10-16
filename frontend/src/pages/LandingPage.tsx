import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Code2,
  FileText,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  GitCommit,
  Terminal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#111318] text-[#F4F1E8]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-[#282B36]/80">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C7F36B]/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[400px] h-[300px] bg-[#A99BFF]/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B1D24] border border-[#282B36] text-xs font-mono text-[#C7F36B] mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#C7F36B] animate-pulse" />
              <span>Developer Evidence Intelligence • Phase 1</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-headline font-bold tracking-tight text-white leading-[1.1] mb-6">
              Your code tells a story.{' '}
              <span className="text-[#C7F36B]">Make the evidence visible.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-[#9A9FB1] leading-relaxed mb-10 font-sans">
              ProofPath performs strict, multi-source audits comparing what employers ask for, what your résumé claims, and what your analyzed GitHub source code actually demonstrates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? "/wizard" : "/register"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C7F36B] text-[#111318] font-headline font-bold text-sm hover:bg-[#b8e458] transition-all shadow-lg shadow-[#C7F36B]/10 hover:translate-y-[-1px]"
              >
                <span>{user ? "Launch Setup Wizard" : "Audit Your Evidence Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1B1D24] text-white border border-[#282B36] font-headline font-medium text-sm hover:bg-[#282B36] transition-colors"
              >
                <span>{user ? "View Workspace" : "Sign In to Workspace"}</span>
              </Link>
            </div>
          </div>

          {/* Core Philosophy Banner */}
          <div className="mt-16 p-4 rounded-xl bg-[#1B1D24]/80 border border-[#282B36] text-xs font-mono text-[#9A9FB1] flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
              <span className="font-semibold">ProofPath Integrity Rule:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>Missing résumé ≠ Missing skill</span>
              <span className="text-[#50566A]">•</span>
              <span>Not in repo ≠ Incompetence</span>
              <span className="text-[#50566A]">•</span>
              <span>README mention ≠ Implementation</span>
            </div>
          </div>

          {/* Interactive Evidence Preview Card (DEMO DATA) */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-[#282B36] bg-[#16181F] p-6 shadow-2xl relative">
            <div className="absolute top-4 right-4 text-[10px] font-mono px-2 py-0.5 rounded bg-[#282B36] text-[#F3B66D] border border-[#3B4050] tracking-wider">
              DEMO DATA PREVIEW
            </div>

            <div className="text-xs font-mono text-[#9A9FB1] uppercase tracking-wider mb-3">
              Multi-Source Triangulation
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Job Requirement */}
              <div className="bg-[#111318] p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#A99BFF] mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>1. Job Requirement</span>
                </div>
                <div className="text-sm font-headline font-semibold text-white mb-1">
                  FastAPI & Python
                </div>
                <p className="text-xs text-[#9A9FB1] leading-relaxed">
                  "Must have experience designing REST APIs using modern Python frameworks like FastAPI."
                </p>
              </div>

              {/* Résumé Claim */}
              <div className="bg-[#111318] p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F3B66D] mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>2. Résumé Claim</span>
                </div>
                <div className="text-sm font-headline font-semibold text-white mb-1">
                  Explicitly Documented
                </div>
                <p className="text-xs text-[#9A9FB1] leading-relaxed">
                  "Architected backend microservices in FastAPI with PostgreSQL, serving 10k requests/min."
                </p>
              </div>

              {/* Repository Code */}
              <div className="bg-[#111318] p-4 rounded-xl border border-[#282B36]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C7F36B] mb-2">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>3. Repository Evidence</span>
                </div>
                <div className="text-sm font-headline font-semibold text-white mb-1">
                  Demonstrated Implementation
                </div>
                <p className="text-xs text-[#9A9FB1] leading-relaxed">
                  Found active routes and dependency injection in <span className="font-mono text-[#C7F36B]">app/api/v1/jobs.py</span> (L42-L48).
                </p>
              </div>
            </div>

            {/* Verified Citation Box */}
            <div className="bg-[#0D0F12] rounded-xl border border-[#282B36] p-4 font-mono text-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282B36] text-[11px] text-[#9A9FB1]">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span className="text-white font-semibold">app/api/v1/jobs.py (Lines 42–46)</span>
                  <span className="text-[#50566A]">SHA: 9df382a</span>
                </div>
                <StatusBadge status="demonstrated" size="sm" />
              </div>
              <div className="space-y-0.5 text-[#E6E4DD]">
                <div><span className="text-[#50566A] mr-3">42</span>@router.post("/import", response_model=JobResponse, status_code=201)</div>
                <div><span className="text-[#50566A] mr-3">43</span>def import_job(job_in: JobImportRequest, db: Session = Depends(get_db)):</div>
                <div><span className="text-[#50566A] mr-3">44</span>    raw_text = fetch_job_url_safely(job_in.url)</div>
                <div><span className="text-[#50566A] mr-3">45</span>    extracted = extract_grounded_requirements(raw_text)</div>
                <div><span className="text-[#50566A] mr-3">46</span>    return save_and_format_job(db, job_in, extracted)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triangulation Pillars */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white mb-3">
            Why ProofPath is Different
          </h2>
          <p className="text-sm text-[#9A9FB1]">
            We do not guess employability or assign arbitrary scores. We provide deterministic citations grounded in actual code lines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1B1D24] p-6 rounded-2xl border border-[#282B36] relative hover:border-[#C7F36B]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#C7F36B]/15 border border-[#C7F36B]/30 flex items-center justify-center text-[#C7F36B] mb-5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2">
              SSRF-Protected Ingestion
            </h3>
            <p className="text-xs text-[#9A9FB1] leading-relaxed">
              Job descriptions can be pasted or ingested from public postings with strict DNS resolution checks that block loopback and private cloud metadata networks.
            </p>
          </div>

          <div className="bg-[#1B1D24] p-6 rounded-2xl border border-[#282B36] relative hover:border-[#A99BFF]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#A99BFF]/15 border border-[#A99BFF]/30 flex items-center justify-center text-[#A99BFF] mb-5">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2">
              Bounded Repo Inspection
            </h3>
            <p className="text-xs text-[#9A9FB1] leading-relaxed">
              We never clone untrusted code or execute tests. We inspect a bounded set of source files, exclude binaries and lockfiles, and preserve exact 1-indexed line numbers.
            </p>
          </div>

          <div className="bg-[#1B1D24] p-6 rounded-2xl border border-[#282B36] relative hover:border-[#F3B66D]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#F3B66D]/15 border border-[#F3B66D]/30 flex items-center justify-center text-[#F3B66D] mb-5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-headline font-semibold text-white mb-2">
              Deterministic Citation Audit
            </h3>
            <p className="text-xs text-[#9A9FB1] leading-relaxed">
              Every positive claim requires a verified code citation matching the commit SHA, file path, line numbers, and excerpt. Zero-evidence claims are rejected.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
