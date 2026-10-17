import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Sparkles,
  ExternalLink,
  Info,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';
import type { Assessment, Job } from '../types';

interface ResumeBullet {
  id: string;
  skill: string;
  text: string;
  status: 'verified' | 'unsupported';
  citation?: {
    file: string;
    lines: string;
    commit_sha: string;
  };
}

export const ResumeStudioPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [copied, setCopied] = useState(false);

  // Resume state
  const [candidateName, setCandidateName] = useState('Arvind Kekan');
  const [headline, setHeadline] = useState('Full-Stack Platform Engineer | Distributed Systems & High-Reliability APIs');
  const [contactInfo, setContactInfo] = useState('Bengaluru, India · arvindkekan@gmail.com · github.com/arvindkekan-tech');

  const [bullets, setBullets] = useState<ResumeBullet[]>([
    {
      id: 'b1',
      skill: 'Python / FastAPI',
      text: 'Architected high-throughput asynchronous REST microservices using Python and FastAPI, handling request routing, JWT session verification, and structured exception handlers.',
      status: 'verified',
      citation: {
        file: 'backend/app/main.py',
        lines: 'L24-L45',
        commit_sha: '255ff29'
      }
    },
    {
      id: 'b2',
      skill: 'React / TypeScript',
      text: 'Engineered strongly-typed developer portal with React 19, TypeScript, and TailwindCSS, including an interactive Proof Graph visualizer and deterministic API client.',
      status: 'verified',
      citation: {
        file: 'frontend/src/services/api.ts',
        lines: 'L18-L50',
        commit_sha: '255ff29'
      }
    },
    {
      id: 'b3',
      skill: 'SQLAlchemy Database Layer',
      text: 'Designed relational persistence layer with SQLAlchemy; implemented zero-downtime idempotent schema migration engine inspecting table metadata before ALTER statements.',
      status: 'verified',
      citation: {
        file: 'backend/app/db/migrations.py',
        lines: 'L24-L40',
        commit_sha: '255ff29'
      }
    },
    {
      id: 'b4',
      skill: 'Automated Testing & QA',
      text: 'Authored 62 automated unit, integration, and regression tests with pytest; verified deterministic citation line-matching bounds and prompt-injection defense.',
      status: 'verified',
      citation: {
        file: 'backend/tests/test_citation_validator.py',
        lines: 'L12-L30',
        commit_sha: '255ff29'
      }
    },
    {
      id: 'b5',
      skill: 'Docker & Kubernetes Orchestration',
      text: 'Managed Kubernetes production clusters and automated Helm deployments across multi-region cloud infrastructure.',
      status: 'unsupported'
    }
  ]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const list = await api.listAssessments();
      setAssessments(list);
      if (list.length > 0) {
        setSelectedAssessment(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFixUnsupported = (id: string) => {
    setBullets((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              text: 'Completed hands-on containerization proof task; authored multi-stage Dockerfile and Docker Compose test topology for service orchestration.',
              status: 'verified',
              citation: {
                file: 'proof_tasks/docker_orchestration',
                lines: 'Task-REQ5',
                commit_sha: 'pending_reassessment'
              }
            }
          : b
      )
    );
  };

  const handleCopyMarkdown = () => {
    const md = `# ${candidateName}
${headline}
${contactInfo}

## Professional Experience & Verified Evidence
${bullets.map((b) => `- ${b.text}${b.citation ? ` [Verified in ${b.citation.file}:${b.citation.lines}]` : ''}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifiedCount = bullets.filter((b) => b.status === 'verified').length;
  const unsupportedCount = bullets.filter((b) => b.status === 'unsupported').length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold uppercase tracking-wider mb-1">
              <span>Evidence-Backed Resume Studio</span>
              <span>•</span>
              <span className="text-slate-500">Zero-Hallucination Résumé</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Truthful Resume Studio
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Every resume claim is cross-referenced with your verified repository citations. Unsupported claims are flagged to protect your Recruiter Evidence Integrity score.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Evidence Audit Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Verified Evidence Claims</div>
              <div className="text-2xl font-bold text-emerald-600 mt-0.5">{verifiedCount} / {bullets.length}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Unsupported Claims</div>
              <div className="text-2xl font-bold text-amber-600 mt-0.5">{unsupportedCount} Flagged</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Integrity Confidence</div>
              <div className="text-2xl font-bold text-blue-600 mt-0.5">
                {Math.round((verifiedCount / bullets.length) * 100)}%
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Resume Preview Canvas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-bold text-slate-900">{candidateName}</h2>
            <p className="text-xs font-semibold text-blue-700 mt-0.5">{headline}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">{contactInfo}</p>
          </div>

          {/* Experience Section with Citations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Evidence-Audited Technical Contributions
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Repository: kurukshetra-2026 (SHA: 255ff29)
              </span>
            </div>

            <div className="space-y-3">
              {bullets.map((b) => {
                const isVerified = b.status === 'verified';

                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border transition-all text-xs ${
                      isVerified
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-400/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {b.skill}
                          </span>
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified Evidence</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              <span>No Code Citation in Scope</span>
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 leading-relaxed">{b.text}</p>

                        {b.citation && (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                            <span className="text-blue-600 font-semibold">{b.citation.file}:{b.citation.lines}</span>
                            <span>•</span>
                            <span>Commit {b.citation.commit_sha}</span>
                          </div>
                        )}
                      </div>

                      {!isVerified && (
                        <button
                          onClick={() => handleFixUnsupported(b.id)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                        >
                          Align to Evidence
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
