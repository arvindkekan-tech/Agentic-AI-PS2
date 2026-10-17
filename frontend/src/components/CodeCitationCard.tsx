import React from 'react';
import { ExternalLink, Check, AlertTriangle, FileCode } from 'lucide-react';
import type { Citation } from '../types';

interface CodeCitationCardProps {
  citation: Citation;
}

export const CodeCitationCard: React.FC<CodeCitationCardProps> = ({ citation }) => {
  const isRepoEvidence = citation.evidence_type !== 'resume_claim';

  const getEvidenceTypeBadge = () => {
    switch (citation.evidence_type) {
      case 'implementation':
        return { label: 'Implementation', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'test_code':
        return { label: 'Test Suite', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'configuration':
        return { label: 'Configuration', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'documentation':
        return { label: 'Documentation', color: 'text-slate-700 bg-slate-100 border-slate-200' };
      case 'resume_claim':
      default:
        return { label: 'Résumé Claim', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    }
  };

  const badge = getEvidenceTypeBadge();
  const lines = citation.excerpt.split('\n');
  const startLine = citation.start_line || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden my-3 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-800">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-900">
            {citation.file_path || 'Extracted Document Text'}
          </span>
          {citation.start_line && citation.end_line && (
            <span className="text-slate-500 font-normal">
              L{citation.start_line}–L{citation.end_line}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className={`px-2 py-0.5 rounded-full text-[11px] border font-sans font-medium ${badge.color}`}>
            {badge.label}
          </span>

          {citation.is_valid ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <Check className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              Unverified
            </span>
          )}

          {citation.commit_url && (
            <a
              href={citation.commit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-sans text-[11px] font-medium p-1 rounded hover:bg-blue-50 transition-colors"
              title="Open commit-pinned view on GitHub"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Code Block with line numbers */}
      <div className="p-3 bg-slate-950 font-mono text-xs overflow-x-auto text-slate-100">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNum = isRepoEvidence ? startLine + idx : idx + 1;
              return (
                <tr key={idx} className="hover:bg-slate-900 leading-relaxed">
                  <td className="w-10 pr-3 text-right select-none text-slate-500 text-[11px] border-r border-slate-800">
                    {lineNum}
                  </td>
                  <td className="pl-3 font-mono whitespace-pre text-slate-200">
                    {lineText || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Validation Note Footer */}
      {citation.validation_note && (
        <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 font-sans flex items-center justify-between">
          <span>{citation.validation_note}</span>
          {citation.commit_sha && (
            <span className="font-mono text-[10px] text-slate-500">
              SHA: {citation.commit_sha.slice(0, 8)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
