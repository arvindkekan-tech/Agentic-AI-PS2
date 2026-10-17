import React from 'react';
import { X, ShieldCheck, FileCheck, FileX, Info, ExternalLink } from 'lucide-react';
import type { Repository } from '../types';

interface CoverageModalProps {
  repository: Repository;
  isOpen: boolean;
  onClose: () => void;
}

export const CoverageModal: React.FC<CoverageModalProps> = ({
  repository,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const { coverage, inspected_files, excluded_files, analyzed_sha, repo_url } = repository;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Repository Evidence Scope & Trust Audit
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic bounding and source verification metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-medium text-slate-500">Inspected Files</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {coverage.inspected_files_count}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-medium text-slate-500">Excluded Files</div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {coverage.excluded_files_count}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-medium text-slate-500">Lines Analyzed</div>
              <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {coverage.inspected_lines_total.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-medium text-slate-500">Commit SHA</div>
              <div className="text-xs font-mono font-bold text-indigo-600 mt-2 truncate">
                {analyzed_sha.slice(0, 10)}
              </div>
            </div>
          </div>

          {/* Languages detected */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              Detected Languages
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {coverage.languages_detected.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Explicit Limitations */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Info className="w-4 h-4" />
              <span>Evidence Audit Limitations</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-900/80 leading-relaxed">
              {coverage.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Inspected Files List */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Inspected Files ({inspected_files.length})</span>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
              {inspected_files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 text-xs hover:bg-white transition-colors">
                  <span className="font-mono text-slate-800 truncate">{file.path}</span>
                  <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px] shrink-0">
                    <span>{file.lines_count} lines</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {file.language}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Excluded Files List */}
          {excluded_files.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
                <FileX className="w-4 h-4 text-slate-400" />
                <span>Excluded Files / Patterns ({excluded_files.length})</span>
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-36 overflow-y-auto bg-slate-50/50">
                {excluded_files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 text-xs hover:bg-white transition-colors">
                    <span className="font-mono text-slate-500 truncate">{file.path}</span>
                    <span className="text-[11px] text-amber-700 italic shrink-0">
                      {file.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl text-xs">
          <a
            href={repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>View Source on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
