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
      <div className="h-64 flex items-center justify-center text-xs font-mono text-[#9A9FB1] p-4 text-center">
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
          <PolarGrid stroke="#282B36" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#F4F1E8', fontSize: 11, fontFamily: 'Space Grotesk' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#6B7280', fontSize: 9 }}
            stroke="#282B36"
          />
          <Radar
            name="Code Evidence"
            dataKey="repoScore"
            stroke="#C7F36B"
            fill="#C7F36B"
            fillOpacity={0.25}
          />
          <Radar
            name="Résumé Claims"
            dataKey="resumeScore"
            stroke="#A99BFF"
            fill="#A99BFF"
            fillOpacity={0.2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1B1D24',
              borderColor: '#323644',
              borderRadius: '0.75rem',
              color: '#F4F1E8',
              fontSize: '12px',
              fontFamily: 'Inter'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
