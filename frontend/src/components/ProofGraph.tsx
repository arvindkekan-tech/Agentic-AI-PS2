import React, { useState } from 'react';
import {
  Briefcase,
  Code2,
  FileCode,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import type { Assessment, ProofTask } from '../types';

interface ProofGraphProps {
  assessment: Assessment;
  tasks?: ProofTask[];
}

interface GraphNode {
  id: string;
  stage: 'requirement' | 'skill' | 'evidence' | 'file' | 'commit' | 'status' | 'task';
  label: string;
  sublabel?: string;
  status: 'demonstrated' | 'gap' | 'info';
  details: {
    title: string;
    description: string;
    excerpt?: string;
    file_path?: string;
    lines?: string;
    commit_sha?: string;
    action?: string;
  };
}

export const ProofGraph: React.FC<ProofGraphProps> = ({ assessment, tasks = [] }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Build nodes from assessment requirements
  const nodesByStage: Record<string, GraphNode[]> = {
    requirement: [],
    skill: [],
    evidence: [],
    file: [],
    status: [],
    task: []
  };

  const reqs = assessment.requirements || [];

  reqs.forEach((r, idx) => {
    const isDem = r.combined_status === 'demonstrated';
    const firstCit = r.citations && r.citations.length > 0 ? r.citations[0] : null;

    // 1. Requirement Node
    const reqNode: GraphNode = {
      id: `req-${r.requirement_id}`,
      stage: 'requirement',
      label: r.requirement_id,
      sublabel: r.normalized_skill,
      status: isDem ? 'demonstrated' : 'gap',
      details: {
        title: `Job Requirement: ${r.requirement_id}`,
        description: r.original_wording,
        action: `Priority: ${r.priority_type.toUpperCase()}`
      }
    };
    nodesByStage.requirement.push(reqNode);

    // 2. Skill Node
    const skillNode: GraphNode = {
      id: `skill-${idx}`,
      stage: 'skill',
      label: r.normalized_skill,
      status: isDem ? 'demonstrated' : 'gap',
      details: {
        title: `Target Skill: ${r.normalized_skill}`,
        description: r.repo_explanation || r.resume_explanation,
        action: isDem ? 'Evidence Verified' : 'Remediation Required'
      }
    };
    nodesByStage.skill.push(skillNode);

    // 3. Evidence Node
    const evNode: GraphNode = {
      id: `ev-${idx}`,
      stage: 'evidence',
      label: firstCit ? firstCit.evidence_type : 'Missing Scope',
      status: isDem ? 'demonstrated' : 'gap',
      details: {
        title: firstCit ? `Citation: ${firstCit.evidence_type}` : 'Evidence Missing',
        description: firstCit ? firstCit.validation_note : r.limitations_note,
        excerpt: firstCit?.excerpt,
        lines: firstCit ? `L${firstCit.start_line}-L${firstCit.end_line}` : undefined
      }
    };
    nodesByStage.evidence.push(evNode);

    // 4. File Node
    const fileNode: GraphNode = {
      id: `file-${idx}`,
      stage: 'file',
      label: firstCit?.file_path ? firstCit.file_path.split('/').pop() || 'file' : 'Uncreated',
      sublabel: firstCit?.file_path || 'No source file',
      status: isDem ? 'demonstrated' : 'gap',
      details: {
        title: firstCit ? `Inspected File: ${firstCit.file_path}` : 'No Supporting File Found',
        description: firstCit ? `Verified lines ${firstCit.start_line} to ${firstCit.end_line}` : 'File absent from inspected repository snapshot.',
        file_path: firstCit?.file_path,
        commit_sha: firstCit?.commit_sha || assessment.repository?.analyzed_sha
      }
    };
    nodesByStage.file.push(fileNode);

    // 5. Status Node
    const statusNode: GraphNode = {
      id: `status-${idx}`,
      stage: 'status',
      label: isDem ? 'Demonstrated' : 'Evidence Gap',
      status: isDem ? 'demonstrated' : 'gap',
      details: {
        title: `Assessment Verdict: ${isDem ? 'Demonstrated' : 'Gap'}`,
        description: r.combined_interpretation,
        action: isDem ? '100% Citation Integrity Validated' : 'Proof Task Recommended'
      }
    };
    nodesByStage.status.push(statusNode);

    // 6. Proof Task Node
    const matchingTask = tasks.find((t) => t.requirement_id === r.requirement_id || t.skill === r.normalized_skill);
    const taskNode: GraphNode = {
      id: `task-${idx}`,
      stage: 'task',
      label: matchingTask ? matchingTask.title : (isDem ? 'Evidence Solid' : 'Create Task'),
      sublabel: matchingTask ? `${matchingTask.estimated_hours}h · ${matchingTask.status}` : undefined,
      status: isDem ? 'demonstrated' : (matchingTask ? 'info' : 'gap'),
      details: {
        title: matchingTask ? `Proof Task: ${matchingTask.title}` : (isDem ? 'Proficiency Proven' : 'Recommended Proof Task'),
        description: matchingTask ? matchingTask.why_it_matters : (isDem ? 'No additional proof needed for this requirement.' : 'Build a targeted module to close this gap and trigger automated reassessment.'),
        action: matchingTask ? `Status: ${matchingTask.status}` : undefined
      }
    };
    nodesByStage.task.push(taskNode);
  });

  const stages = [
    { key: 'requirement', label: '1. Requirement', icon: Briefcase },
    { key: 'skill', label: '2. Skill Target', icon: Code2 },
    { key: 'evidence', label: '3. Evidence Citations', icon: CheckCircle2 },
    { key: 'file', label: '4. Repository File', icon: FileCode },
    { key: 'status', label: '5. Assessment', icon: GitCommit },
    { key: 'task', label: '6. Proof Task', icon: Sparkles }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Interactive Proof Graph
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Trace verifiable linkages from Job Criteria → Code Citations → Proof Tasks
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Verified Evidence
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Evidence Gap / Remediable
          </span>
        </div>
      </div>

      {/* Proof Graph Columns */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const stageNodes = nodesByStage[stage.key] || [];

          return (
            <div key={stage.key} className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 px-1 uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span>{stage.label}</span>
              </div>

              <div className="space-y-2">
                {stageNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isDem = node.status === 'demonstrated';

                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : isDem
                          ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/70'
                          : 'border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/70'
                      }`}
                    >
                      <div className="font-semibold text-slate-900 truncate">{node.label}</div>
                      {node.sublabel && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{node.sublabel}</div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span
                          className={`font-mono px-1.5 py-0.5 rounded ${
                            isDem
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDem ? 'Demonstrated' : 'Gap'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  {selectedNode.stage} node
                </span>
                <span className="text-sm font-semibold text-slate-900">{selectedNode.details.title}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedNode.details.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>

          {selectedNode.details.excerpt && (
            <div className="mt-3">
              <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center justify-between">
                <span>Verified Source Excerpt {selectedNode.details.lines}</span>
                {selectedNode.details.file_path && <span>{selectedNode.details.file_path}</span>}
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {selectedNode.details.excerpt}
              </pre>
            </div>
          )}

          {selectedNode.details.action && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Info className="w-4 h-4 shrink-0" />
              <span>{selectedNode.details.action}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
