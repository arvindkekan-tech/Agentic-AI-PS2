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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1B1D24] border border-[#282B36] rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-[#F4F1E8]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282B36]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C7F36B]" />
            <h3 className="text-lg font-headline font-semibold text-white">
              Repository Evidence Scope & Trust Audit
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#9A9FB1] hover:text-white hover:bg-[#282B36] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111318] p-3 rounded-lg border border-[#282B36]">
              <div className="text-xs text-[#9A9FB1]">Inspected Files</div>
              <div className="text-xl font-headline font-bold text-white mt-1">
                {coverage.inspected_files_count}
              </div>
            </div>
            <div className="bg-[#111318] p-3 rounded-lg border border-[#282B36]">
              <div className="text-xs text-[#9A9FB1]">Excluded Files</div>
              <div className="text-xl font-headline font-bold text-[#F3B66D] mt-1">
                {coverage.excluded_files_count}
              </div>
            </div>
            <div className="bg-[#111318] p-3 rounded-lg border border-[#282B36]">
              <div className="text-xs text-[#9A9FB1]">Lines Analyzed</div>
              <div className="text-xl font-headline font-bold text-[#C7F36B] mt-1 font-mono">
                {coverage.inspected_lines_total.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#111318] p-3 rounded-lg border border-[#282B36]">
              <div className="text-xs text-[#9A9FB1]">Commit SHA</div>
              <div className="text-xs font-mono font-bold text-[#A99BFF] mt-2 truncate">
                {analyzed_sha.slice(0, 10)}
              </div>
            </div>
          </div>

          {/* Languages detected */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-2">
              Detected Languages
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {coverage.languages_detected.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-[#111318] text-[#C7F36B] text-xs font-mono border border-[#C7F36B]/20"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Explicit Limitations */}
          <div className="bg-[#111318] p-4 rounded-lg border border-[#282B36] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F3B66D]">
              <Info className="w-4 h-4" />
              <span>Evidence Audit Limitations</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-[#9A9FB1] leading-relaxed">
              {coverage.limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* Inspected Files List */}
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-2">
              <FileCheck className="w-4 h-4 text-[#C7F36B]" />
              <span>Inspected Source Files ({inspected_files.length})</span>
            </h4>
            <div className="bg-[#111318] rounded-lg border border-[#282B36] max-h-48 overflow-y-auto divide-y divide-[#282B36]/50 font-mono text-xs">
              {inspected_files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 hover:bg-[#1B1D24]/50">
                  <span className="text-[#F4F1E8] truncate max-w-md">{file.path}</span>
                  <div className="flex items-center gap-3 text-[#9A9FB1] text-[11px]">
                    <span>{file.lines_count} lines</span>
                    <span className="text-[#C7F36B]">{file.language}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Excluded Files Sample */}
          {excluded_files.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-2">
                <FileX className="w-4 h-4 text-[#F3B66D]" />
                <span>Excluded Files & Reasons (Sample)</span>
              </h4>
              <div className="bg-[#111318] rounded-lg border border-[#282B36] max-h-40 overflow-y-auto divide-y divide-[#282B36]/50 font-mono text-xs">
                {excluded_files.slice(0, 15).map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                    <span className="text-[#9A9FB1] truncate max-w-xs">{ex.path}</span>
                    <span className="text-[#F3B66D]/80 font-sans">{ex.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#282B36] bg-[#16181F] text-xs text-[#9A9FB1]">
          <a
            href={`${repo_url}/tree/${analyzed_sha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C7F36B] hover:underline"
          >
            <span>View Snapshot at Commit {analyzed_sha.slice(0, 7)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#282B36] text-white hover:bg-[#3B4050] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
