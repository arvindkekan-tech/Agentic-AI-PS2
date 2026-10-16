import React, { useState } from 'react';
import {
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  Info,
  AlertTriangle
} from 'lucide-react';
import type { TrustReport } from '../types';

interface TrustReportCardProps {
  report: TrustReport;
}

export const TrustReportCard: React.FC<TrustReportCardProps> = ({ report }) => {
  const [showFormula, setShowFormula] = useState(false);

  const {
    evidence_coverage,
    citation_validity,
    assessment_confidence,
    provenance,
    integrity_signals,
    internal_evidence_index,
    formula_explanation,
    disclaimer
  } = report;

  const coveragePercent = Math.round(evidence_coverage.coverage_ratio * 100);
  const citationPercent = Math.round(citation_validity.citation_validity_ratio * 100);

  return (
    <div className="rounded-xl border border-[#282B36] bg-[#16181F] p-6 shadow-xl space-y-6">
      {/* Header with Evidence Index */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#282B36] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#C7F36B]/15 border border-[#C7F36B]/30 text-[#C7F36B]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Evidence & Trust Integrity Report
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-[#A99BFF]/15 text-[#A99BFF] border border-[#A99BFF]/30">
                5-Dimension Audit
              </span>
            </h3>
            <p className="text-xs text-[#9A9FB1] mt-0.5">
              Decoupled, explainable verification of code snapshot evidence, line citations, and provenance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#1B1D24] border border-[#282B36] rounded-lg px-4 py-3">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-[#9A9FB1] font-mono">
              Evidence Quality Index
            </div>
            <div className="text-2xl font-black font-mono text-[#C7F36B]">
              {internal_evidence_index.toFixed(1)}
              <span className="text-xs text-[#9A9FB1] font-normal"> / 100</span>
            </div>
          </div>
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="p-1.5 text-[#9A9FB1] hover:text-white rounded hover:bg-[#282B36] transition-colors"
            title="Inspect scoring formula"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formula Explanation Accordion */}
      {showFormula && (
        <div className="rounded-lg bg-[#111318] border border-[#3B4050] p-4 text-xs space-y-2 text-[#9A9FB1] font-mono">
          <div className="text-white font-semibold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#A99BFF]" />
            Scoring Formula Breakdown
          </div>
          <p>{formula_explanation}</p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded bg-[#1B1D24] border border-[#282B36]">
              <div className="text-[#9A9FB1]">Coverage (30%)</div>
              <div className="text-white font-bold">{coveragePercent}%</div>
            </div>
            <div className="p-2 rounded bg-[#1B1D24] border border-[#282B36]">
              <div className="text-[#9A9FB1]">Citations (40%)</div>
              <div className="text-white font-bold">{citationPercent}%</div>
            </div>
            <div className="p-2 rounded bg-[#1B1D24] border border-[#282B36]">
              <div className="text-[#9A9FB1]">Demonstrated (30%)</div>
              <div className="text-white font-bold">{assessment_confidence.demonstrated_count} reqs</div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Regulatory / Ethical Disclaimer */}
      <div className="rounded-lg bg-[#F3B66D]/10 border border-[#F3B66D]/30 p-3.5 flex items-start gap-3 text-xs text-[#F3B66D]">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Transparent Scope Boundary: </span>
          {disclaimer}
        </div>
      </div>

      {/* 5-Dimension Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dimension 1: Evidence Coverage */}
        <div className="rounded-lg border border-[#282B36] bg-[#111318] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-[#C7F36B]" />
                1. Evidence Coverage
              </span>
              <span className="font-mono text-[#C7F36B]">{coveragePercent}%</span>
            </div>
            <div className="w-full bg-[#282B36] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#C7F36B] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <div className="text-xs text-[#9A9FB1] flex justify-between pt-1">
              <span>Inspected files:</span>
              <span className="text-white font-mono">{evidence_coverage.inspected_files_count} / {evidence_coverage.total_files_discovered}</span>
            </div>
            {evidence_coverage.excluded_files_count > 0 && (
              <div className="text-xs text-[#9A9FB1] flex justify-between">
                <span>Excluded files:</span>
                <span className="text-[#F3B66D] font-mono">{evidence_coverage.excluded_files_count}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-[#282B36] text-[11px] text-[#9A9FB1] leading-relaxed">
            {evidence_coverage.scope_limitations}
          </div>
        </div>

        {/* Dimension 2: Citation Validity */}
        <div className="rounded-lg border border-[#282B36] bg-[#111318] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#A99BFF]" />
                2. Citation Verification
              </span>
              <span className="font-mono text-[#A99BFF]">{citationPercent}%</span>
            </div>
            <div className="w-full bg-[#282B36] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#A99BFF] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${citationPercent}%` }}
              />
            </div>
            <div className="text-xs text-[#9A9FB1] flex justify-between pt-1">
              <span>Verified citations:</span>
              <span className="text-white font-mono">{citation_validity.verified_citations_count} / {citation_validity.total_citations_count}</span>
            </div>
            <div className="text-xs text-[#9A9FB1] flex justify-between">
              <span>Claims backed:</span>
              <span className={`font-mono ${citation_validity.all_positive_claims_cited ? 'text-[#C7F36B]' : 'text-[#F3B66D]'}`}>
                {citation_validity.all_positive_claims_cited ? '100% Verified' : 'Gaps Flagged'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#282B36] text-[11px] text-[#9A9FB1] space-y-1">
            {citation_validity.citation_audit_notes.slice(0, 2).map((note, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 text-[#C7F36B] flex-shrink-0" />
                <span className="truncate">{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension 3: Assessment Confidence */}
        <div className="rounded-lg border border-[#282B36] bg-[#111318] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#F3B66D]" />
                3. Uncertainty Disclosure
              </span>
              <span className="font-mono text-[#F3B66D]">{Math.round(assessment_confidence.average_confidence * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono text-xs">
              <div className="p-1.5 rounded bg-[#C7F36B]/10 border border-[#C7F36B]/20 text-[#C7F36B]">
                <div className="font-bold">{assessment_confidence.demonstrated_count}</div>
                <div className="text-[10px]">Proven</div>
              </div>
              <div className="p-1.5 rounded bg-[#F3B66D]/10 border border-[#F3B66D]/20 text-[#F3B66D]">
                <div className="font-bold">{assessment_confidence.partial_or_needs_review_count}</div>
                <div className="text-[10px]">Review</div>
              </div>
              <div className="p-1.5 rounded bg-[#282B36] border border-[#3B4050] text-[#9A9FB1]">
                <div className="font-bold">{assessment_confidence.unassessed_or_missing_count}</div>
                <div className="text-[10px]">Missing</div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#282B36] text-[11px] text-[#9A9FB1] leading-relaxed italic">
            "{assessment_confidence.uncertainty_disclosure}"
          </div>
        </div>

        {/* Dimension 4: Repository Provenance */}
        <div className="rounded-lg border border-[#282B36] bg-[#111318] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-[#C7F36B]" />
                4. Commit Provenance
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#C7F36B]/15 text-[#C7F36B] border border-[#C7F36B]/30">
                {provenance.provenance_verified ? 'Verified SHA' : 'Unverified'}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#9A9FB1]">Pinned SHA:</span>
                <span className="font-mono text-white bg-[#1B1D24] px-1.5 py-0.5 rounded border border-[#282B36]">
                  {provenance.pinned_commit_sha.slice(0, 10)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9A9FB1]">Branch:</span>
                <span className="font-mono text-white">{provenance.branch}</span>
              </div>
              {provenance.commit_author && (
                <div className="flex items-center justify-between">
                  <span className="text-[#9A9FB1]">Author:</span>
                  <span className="font-mono text-white truncate max-w-[140px]">{provenance.commit_author}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#282B36] text-[11px] text-[#9A9FB1] truncate font-mono">
            {provenance.repo_url}
          </div>
        </div>

        {/* Dimension 5: Integrity Signals */}
        <div className="rounded-lg border border-[#282B36] bg-[#111318] p-4 flex flex-col justify-between md:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#E77D83]" />
                5. Integrity Signals & Disclosures
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1B1D24] border border-[#282B36] text-[#9A9FB1]">
                {integrity_signals.length} {integrity_signals.length === 1 ? 'signal' : 'signals'}
              </span>
            </div>

            {integrity_signals.length === 0 ? (
              <div className="p-3 rounded bg-[#C7F36B]/10 border border-[#C7F36B]/20 text-[#C7F36B] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero integrity anomalies detected. All evaluated evidence aligns with candidate claims.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {integrity_signals.map((sig) => (
                  <div
                    key={sig.signal_id}
                    className="p-2.5 rounded bg-[#1B1D24] border border-[#282B36] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1">
                        <span className="text-[10px] font-mono px-1 rounded bg-[#E77D83]/20 text-[#E77D83] uppercase">
                          {sig.signal_type.replace(/_/g, ' ')}
                        </span>
                      </span>
                      <span className="text-[10px] text-[#9A9FB1] font-mono">{sig.signal_id}</span>
                    </div>
                    <p className="text-[#9A9FB1] leading-tight">{sig.reason}</p>
                    <div className="text-[11px] text-[#F3B66D] italic">
                      Limitation: {sig.limitation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
