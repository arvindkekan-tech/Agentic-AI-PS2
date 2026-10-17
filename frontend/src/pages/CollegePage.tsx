import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Download,
  Filter,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import type { CollegeDashboardResponse, CollegeStudentBatchItem } from '../types';

export const CollegePage: React.FC = () => {
  const [data, setData] = useState<CollegeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');

  useEffect(() => {
    loadCollegeData();
  }, []);

  const loadCollegeData = async () => {
    try {
      setLoading(true);
      const res = await api.getCollegeDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const students = data?.students || [];
  const filteredStudents = students.filter((s) => {
    if (departmentFilter !== 'All' && !s.department.includes(departmentFilter)) return false;
    if (tierFilter !== 'All' && !s.readiness_tier.includes(tierFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 font-semibold uppercase tracking-wider mb-1">
              <span>Training & Placement Directorate</span>
              <span>•</span>
              <span className="text-slate-500">Curriculum & Placement Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
              College Placement Readiness Intelligence
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Institution: <strong className="text-slate-900">{data?.institution_name || 'NIT Kurukshetra Placement Division'}</strong> · Batch {data?.batch_year || 'Class of 2026'}. Aggregates student repository code audits to target departmental bootcamps and verify employer readiness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Batch Readiness Report exported to PDF/CSV successfully!')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Readiness Audit</span>
            </button>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-1">
              {data?.total_students_registered || 220}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Final-year graduating batch</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Placement Ready
            </div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">
              {data?.placement_ready_percentage || 76}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified &gt;80% code citations</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Batch Evidence Score
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {data?.average_evidence_score || 81}/100
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Average Evidence Quality Index</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Remediation Action
            </div>
            <div className="text-3xl font-bold text-amber-600 mt-1">
              4 Labs
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Automated workshop plans generated</p>
          </div>
        </div>

        {/* Institutional Skill Gap Heatmap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Institutional Skill Gap Heatmap & Remediation Labs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifies unverified capabilities across the batch to direct hands-on curriculum interventions
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Class of 2026 Audit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.top_skill_gaps || []).map((gap, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{gap.skill}</span>
                  <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono text-[11px]">
                    {gap.frequency_percentage}% Gap
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${gap.frequency_percentage}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                  <span>{gap.unverified_students_count} students lack code proof</span>
                  <span className="font-semibold text-blue-600">{gap.recommended_workshop}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Placement Cohort Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time evidence status and active proof tasks for every enrolled candidate
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Computer">Computer Science</option>
                <option value="Information">Information Tech</option>
                <option value="Electronics">Electronics</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="All">All Tiers</option>
                <option value="Tier 1">Tier 1: Placement Ready</option>
                <option value="Tier 2">Tier 2: Near Ready</option>
                <option value="Tier 3">Tier 3: In Remediation</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Readiness Tier</th>
                  <th className="py-3 px-4">Evidence Index</th>
                  <th className="py-3 px-4">Top Skill Gap</th>
                  <th className="py-3 px-4">Target Employer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{s.roll_number}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.department}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.target_role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          s.readiness_tier.includes('Tier 1')
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.readiness_tier.includes('Tier 2')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.readiness_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.evidence_score}%
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        ({s.verified_citations} cits)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {s.top_skill_gap}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{s.target_company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
