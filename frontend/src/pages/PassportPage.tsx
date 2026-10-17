import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { CareerProofPassport } from '../types';
import {
  ShieldCheck,
  Share2,
  Copy,
  Check,
  GitBranch,
  GitCommit,
  ExternalLink,
  Award,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  FileCode,
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  Info
} from 'lucide-react';

export const PassportPage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const isPublicView = Boolean(token);

  const [passport, setPassport] = useState<CareerProofPassport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadPassport();
  }, [token]);

  const loadPassport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (token) {
        // Public view
        const data = await api.getPublicPassport(token);
        setPassport(data);
      } else {
        // Authenticated student view
        const data = await api.getCareerProofPassport();
        setPassport(data);
      }
    } catch (err: any) {
      console.error('Failed to load Career Proof Passport:', err);
      setError(
        token
          ? 'This Career Proof Passport link is invalid, private, or has been revoked by the candidate.'
          : 'Failed to load passport. Please check connectivity or initialize demo data.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShare = async (field: 'is_public_shared' | 'share_skill_sprint' | 'allow_recruiter_challenges') => {
    if (!passport || isPublicView) return;
    setUpdating(true);
    try {
      const updated = await api.updatePassportSettings({
        [field]: !passport[field]
      });
      setPassport(prev => prev ? { ...prev, [field]: updated[field] } : null);
    } catch (err) {
      console.error('Failed to update share settings:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!passport || isPublicView) return;
    if (!window.confirm('Regenerating your share token will immediately invalidate all previously shared passport links. Continue?')) {
      return;
    }
    setUpdating(true);
    try {
      const updated = await api.updatePassportSettings({ regenerate_token: true });
      await loadPassport();
    } catch (err) {
      console.error('Failed to regenerate token:', err);
    } finally {
      setUpdating(false);
    }
  };

  const fullShareUrl = passport ? `${window.location.origin}/passport/view/${passport.share_token}` : '';

  const copyShareLink = () => {
    if (!fullShareUrl) return;
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm font-semibold text-slate-700">Verifying Cryptographic Evidence Passport...</div>
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Passport Unavailable</h2>
          <p className="text-xs text-slate-600 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ProofPath Career Proof Passport • Cryptographically Pinned SHA
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                {passport.student_name}
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {passport.headline} • Target: <span className="text-slate-900 font-semibold">{passport.target_role}</span>
              </p>
            </div>

            {/* Verification Badge */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">
                  {passport.evidence_coverage_percent}%
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Evidence Coverage
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Privacy & Sharing Controls for Student */}
          {!isPublicView && (
            <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/70 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 rounded-b-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleToggleShare('is_public_shared')}
                    disabled={updating}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      passport.is_public_shared
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {passport.is_public_shared ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {passport.is_public_shared ? 'Public Link Active' : 'Access Revoked (Private)'}
                  </button>

                  <button
                    onClick={() => handleToggleShare('share_skill_sprint')}
                    disabled={updating}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      passport.share_skill_sprint
                        ? 'bg-white text-slate-800 border-slate-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {passport.share_skill_sprint ? 'Include Skill Sprint' : 'Hide Skill Sprint'}
                  </button>

                  <button
                    onClick={handleRegenerateToken}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate Share Token
                  </button>
                </div>

                {/* Share Link Copy Field */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullShareUrl}
                    className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-700 w-64 select-all"
                  />
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPublicView && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>You are inspecting an authorized, read-only Career Proof Passport. All claims link to verifiable GitHub commit artifacts.</span>
              </div>
              <span className="font-semibold text-blue-900">Verified Read-Only View</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Passport Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Demonstrated Skills & Citations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demonstrated Skills Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Demonstrated Skills (Repository-Verified)
            </h3>
            <p className="text-xs text-slate-500">
              Each skill has verified AST syntax and implementation proof in inspected commits.
            </p>

            <div className="space-y-2">
              {passport.demonstrated_skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-900"
                >
                  <span>{skill}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 text-[10px]">
                    Verified Proof
                  </span>
                </div>
              ))}
            </div>

            {passport.partially_demonstrated_skills.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                  Partially Demonstrated (In Scope)
                </div>
                <div className="space-y-1.5">
                  {passport.partially_demonstrated_skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Validated Git Citations & File Proof */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-blue-600" />
                Validated Commit Citations ({passport.validated_citations.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Deterministic Line Bounds
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Recruiters can inspect the exact repository source file and commit SHA where the skill was executed.
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {passport.validated_citations.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-600" />
                      {c.file_path}
                    </div>
                    <div className="text-slate-500 flex items-center gap-3">
                      <span>Lines {c.start_line}–{c.end_line}</span>
                      <span>•</span>
                      <span>Symbol: <code className="bg-slate-200/60 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-800">{c.symbol_name}</code></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-slate-200 text-slate-800">
                      commit {c.commit_sha}
                    </span>
                    <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Completed Proof Tasks & Skill Sprint Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completed Proof Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              Completed Proof Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Practical coding tasks successfully resolved and verified via commit inspection.
            </p>

            {passport.completed_proof_tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                Candidate is currently implementing active proof tasks in the repository.
              </div>
            ) : (
              <div className="space-y-3">
                {passport.completed_proof_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{task.title}</div>
                      <div className="text-slate-500 mt-0.5">Skill: {task.skill}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Authorized Skill Sprint Badges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Authorized Skill Sprint Badges ({passport.skill_sprint_badges.length})
            </h3>
            <p className="text-xs text-slate-500">
              Verified conceptual understanding via versioned deterministic question banks.
            </p>

            {passport.skill_sprint_badges.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                No Skill Sprint results shared yet.
              </div>
            ) : (
              <div className="space-y-3">
                {passport.skill_sprint_badges.map((badge, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                        {badge.score_percent}%
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{badge.skill}</div>
                        <div className="text-[11px] text-slate-500">{badge.type} • {badge.date}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {badge.badge_level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Explainable Limitations Notice */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-500" />
            Verification Scope & Limitations Disclosure
          </h4>
          <ul className="space-y-1 text-xs text-slate-600">
            {passport.limitations.map((lim, idx) => (
              <li key={idx}>• {lim}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
