import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import type { RequirementAssessment } from '../types';

interface SkillRadarChartProps {
  requirements: RequirementAssessment[];
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ requirements }) => {
  if (!requirements || requirements.length < 3) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500 p-4 text-center">
        Skill radar requires at least 3 requirements to render topology.
      </div>
    );
  }

  const scoreMap: Record<string, number> = {
    demonstrated: 100,
    partial_or_needs_review: 50,
    not_demonstrated_in_analyzed_scope: 10,
    unable_to_assess: 30
  };

  const data = requirements.slice(0, 8).map((req) => ({
    skill: req.normalized_skill.length > 14 ? `${req.normalized_skill.slice(0, 12)}…` : req.normalized_skill,
    fullSkill: req.normalized_skill,
    score: scoreMap[req.combined_status] ?? 10,
    repoScore: scoreMap[req.repo_status] ?? 10,
    resumeScore: scoreMap[req.resume_status] ?? 10
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#64748B', fontSize: 9 }}
            stroke="#CBD5E1"
          />
          <Radar
            name="Code Evidence"
            dataKey="repoScore"
            stroke="#2563EB"
            fill="#3B82F6"
            fillOpacity={0.25}
          />
          <Radar
            name="Résumé Claims"
            dataKey="resumeScore"
            stroke="#6366F1"
            fill="#818CF8"
            fillOpacity={0.2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E2E8F0',
              borderRadius: '0.75rem',
              color: '#0F172A',
              fontSize: '12px',
              fontFamily: 'Inter',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
