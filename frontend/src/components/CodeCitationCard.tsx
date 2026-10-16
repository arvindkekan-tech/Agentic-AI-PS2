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
        return { label: 'Implementation', color: 'text-[#C7F36B] bg-[#C7F36B]/10 border-[#C7F36B]/30' };
      case 'test_code':
        return { label: 'Test Suite', color: 'text-[#A99BFF] bg-[#A99BFF]/10 border-[#A99BFF]/30' };
      case 'configuration':
        return { label: 'Configuration', color: 'text-[#F3B66D] bg-[#F3B66D]/10 border-[#F3B66D]/30' };
      case 'documentation':
        return { label: 'Documentation', color: 'text-[#9A9FB1] bg-[#282B36] border-[#3B4050]' };
      case 'resume_claim':
      default:
        return { label: 'Résumé Claim', color: 'text-[#A99BFF] bg-[#A99BFF]/10 border-[#A99BFF]/30' };
    }
  };

  const badge = getEvidenceTypeBadge();
  const lines = citation.excerpt.split('\n');
  const startLine = citation.start_line || 1;

  return (
    <div className="rounded-lg border border-[#282B36] bg-[#111318] overflow-hidden my-3 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#1B1D24] border-b border-[#282B36] text-xs">
        <div className="flex items-center gap-2 font-mono text-[#F4F1E8]/90">
          <FileCode className="w-4 h-4 text-[#A99BFF]" />
          <span className="font-semibold text-white">
            {citation.file_path || 'Extracted Document Text'}
          </span>
          {citation.start_line && citation.end_line && (
            <span className="text-[#9A9FB1]">
              L{citation.start_line}–L{citation.end_line}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className={`px-2 py-0.5 rounded text-[11px] border font-sans font-medium ${badge.color}`}>
            {badge.label}
          </span>

          {citation.is_valid ? (
            <span className="inline-flex items-center gap-1 text-[#C7F36B] text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-[#C7F36B]/10 border border-[#C7F36B]/20">
              <Check className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#F3B66D] text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-[#F3B66D]/10 border border-[#F3B66D]/20">
              <AlertTriangle className="w-3 h-3" />
              Unverified
            </span>
          )}

          {citation.commit_url && (
            <a
              href={citation.commit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#9A9FB1] hover:text-[#C7F36B] transition-colors p-1 rounded hover:bg-[#282B36]"
              title="Open commit-pinned view on GitHub"
            >
              <span className="text-[11px]">GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Code Block with line numbers */}
      <div className="p-3 bg-[#0D0F12] font-mono text-xs overflow-x-auto text-[#F4F1E8]">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((lineText, idx) => {
              const lineNum = isRepoEvidence ? startLine + idx : idx + 1;
              return (
                <tr key={idx} className="hover:bg-[#1B1D24]/50 leading-relaxed">
                  <td className="w-10 pr-3 text-right select-none text-[#50566A] text-[11px] border-r border-[#282B36]/60">
                    {lineNum}
                  </td>
                  <td className="pl-3 font-mono whitespace-pre text-[#E6E4DD]">
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
        <div className="px-3.5 py-1.5 bg-[#16181F] border-t border-[#282B36]/50 text-[11px] text-[#9A9FB1] font-sans flex items-center justify-between">
          <span>{citation.validation_note}</span>
          {citation.commit_sha && (
            <span className="font-mono text-[10px] text-[#50566A]">
              SHA: {citation.commit_sha.slice(0, 8)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
