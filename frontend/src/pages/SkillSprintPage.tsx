import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type {
  SkillSprintTrack,
  SkillSprintQuestion,
  SkillSprintResult,
  SkillSprintAttempt,
  Job
} from '../types';
import {
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Briefcase,
  AlertTriangle,
  Award,
  Layers,
  Code2,
  Terminal,
  ShieldAlert,
  Search,
  PlusCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SkillSprintPage: React.FC = () => {
  const [tracks, setTracks] = useState<SkillSprintTrack[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('Python');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetJobs, setTargetJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  // Sprint State: 'library' | 'taking' | 'result' | 'history'
  const [stage, setStage] = useState<'library' | 'taking' | 'result' | 'history'>('library');
  const [questions, setQuestions] = useState<SkillSprintQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<SkillSprintResult | null>(null);
  const [history, setHistory] = useState<SkillSprintAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tList, jobs, hList] = await Promise.all([
        api.getSkillSprintTracks(),
        api.getJobs(),
        api.getSkillSprintHistory()
      ]);
      setTracks(tList);
      setTargetJobs(jobs);
      if (jobs.length > 0) {
        setSelectedJobId(jobs[0].id);
      }
      setHistory(hList);
    } catch (err: any) {
      console.error('Failed to load Skill Sprint library:', err);
      setError('Unable to load skill library. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const startSprint = async (skillToStart?: string) => {
    const skill = skillToStart || selectedSkill;
    setSelectedSkill(skill);
    setError(null);
    setLoading(true);
    try {
      const qList = await api.getSkillSprintQuestions(skill);
      if (qList.length === 0) {
        setError(`No active question bank for ${skill}.`);
        return;
      }
      setQuestions(qList);
      setCurrentIdx(0);
      setAnswers({});
      setResult(null);
      setStage('taking');
    } catch (err: any) {
      setError(`Failed to retrieve questions for ${skill}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, answerText: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answerText }));
  };

  const handleSubmit = async () => {
    if (!questions.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const answersPayload = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        answer: ans
      }));

      const res = await api.submitSkillSprint(selectedSkill, answersPayload, selectedJobId || undefined);
      setResult(res);
      setStage('result');
      // Refresh history
      const updatedHistory = await api.getSkillSprintHistory();
      setHistory(updatedHistory);
    } catch (err: any) {
      setError('Submission error. Please ensure all answers are recorded and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTracks = tracks.filter(t =>
    t.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                <Zap className="w-3.5 h-3.5" />
                ProofPath Skill Sprint • W-PS-2 Interactive Testing
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Job-Targeted Skill Sprints
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Test your conceptual and debugging mastery against target role requirements. Results recommend actionable proof tasks and update your career roadmap.
              </p>
            </div>

            {/* Knowledge vs Project Evidence Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 max-w-md">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">Knowledge vs Project Evidence:</span> Quiz performance measures conceptual understanding. Project verification in the Proof Graph requires validated GitHub repository commits.
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage('library')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stage === 'library'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Skill Library ({tracks.length})
            </button>
            <button
              onClick={async () => {
                setStage('history');
                const hList = await api.getSkillSprintHistory();
                setHistory(hList);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stage === 'history'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Attempt History ({history.length})
            </button>
            {stage === 'result' && (
              <button
                onClick={() => setStage('result')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white"
              >
                Latest Sprint Result
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs text-rose-600 underline">Dismiss</button>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: SKILL SPRINT LIBRARY & TARGET JOB PICKER
        ========================================================================== */}
        {stage === 'library' && (
          <div className="space-y-8">
            {/* Target Job Selector Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Job Context</div>
                  <div className="text-sm font-medium text-slate-900">
                    Align sprint feedback with job requirements
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {targetJobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} • {j.company || 'Enterprise Partner'}
                    </option>
                  ))}
                  {targetJobs.length === 0 && (
                    <option value="">Full-Stack Platform Engineer (Default Job Scenario)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search skills (e.g. Python, SQL, REST APIs, Git, React, Cloud)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Grid of 10 Skill Tracks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTracks.map(track => {
                const isSelected = selectedSkill === track.skill;
                return (
                  <div
                    key={track.skill}
                    className={`bg-white rounded-2xl border p-6 transition-all duration-200 shadow-sm flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {track.category}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {track.questions_count} Versioned Questions
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {track.skill}
                      </h3>
                      <p className="text-xs text-slate-600 mb-4">
                        5–10 minute sprint with multiple-choice, debugging, and code-reading scenarios.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Deterministic Bank
                      </div>
                      <button
                        onClick={() => startSprint(track.skill)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
                      >
                        Start Sprint
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 2: TEST-TAKING SCREEN
        ========================================================================== */}
        {stage === 'taking' && questions.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Sprint Progress Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>Skill Track: {selectedSkill}</span>
                <span>Question {currentIdx + 1} of {questions.length}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Pills */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {(() => {
              const currentQ = questions[currentIdx];
              const selectedAns = answers[currentQ.id];

              return (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {currentQ.question_type.replace('_', ' ').toUpperCase()} • {currentQ.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {currentQ.id}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                      {currentQ.title}
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {currentQ.prompt}
                    </p>
                  </div>

                  {/* Code Snippet Box if present */}
                  {currentQ.code_snippet && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                      <pre>{currentQ.code_snippet}</pre>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Select your answer:
                    </div>
                    {currentQ.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedAns === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectAnswer(currentQ.id, opt)}
                          className={`w-full text-left p-4 rounded-xl text-sm transition-all border flex items-start gap-3 ${
                            isOptionSelected
                              ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium ring-1 ring-blue-500'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isOptionSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isOptionSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Navigation Controls */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>

                    <div className="flex items-center gap-3">
                      {currentIdx < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          Next Question
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Grading on Backend...' : 'Submit Sprint'}
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            STAGE 3: RESULTS REPORT & AUTOMATIC CAREER ACTIONS
        ========================================================================== */}
        {stage === 'result' && result && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Score Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Skill Sprint Complete • {result.skill}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    Sprint Performance Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed at {new Date(result.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-extrabold text-slate-900">
                      {result.score_percent}%
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {result.correct_answers} of {result.total_questions} Correct
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
                    result.score_percent >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : result.score_percent >= 60
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Award className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Validated Conceptual Strengths
                  </div>
                  {result.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {result.strengths.map((s, idx) => (
                        <li key={idx} className="text-xs text-emerald-900 font-medium">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-slate-500 italic">No strong concepts identified in this attempt.</div>
                  )}
                </div>

                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Concepts Requiring Practice
                  </div>
                  {result.weak_concepts.length > 0 ? (
                    <ul className="space-y-1">
                      {result.weak_concepts.map((w, idx) => (
                        <li key={idx} className="text-xs text-amber-900 font-medium">
                          • {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-emerald-700 font-medium">
                      All concepts answered correctly!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => startSprint(result.skill)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Take Retest
                </button>
                <div className="flex items-center gap-3">
                  <Link
                    to="/tasks"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    View Proof Tasks
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* AUTOMATIC CAREER ACTION CARD */}
            {result.recommended_task && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Automatic Career Action • Gap-to-Proof Bridge
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {result.recommended_task.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                        Based on your weak concept in {result.skill}, this practical proof task has been connected to your career roadmap. Implementing this code in your GitHub repository will turn this conceptual gap into verifiable commit evidence.
                      </p>
                      {result.recommended_task.target_file && (
                        <div className="mt-2 text-xs font-mono text-slate-700 bg-white/70 px-2.5 py-1 rounded-md inline-block border border-blue-200">
                          Target file: {result.recommended_task.target_file}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/tasks"
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                  >
                    Open in Planner
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* DETAILED QUESTION-BY-QUESTION REVIEW */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                Detailed Answer & Citation Review
              </h3>

              {result.review_details.map((rev, idx) => (
                <div
                  key={rev.question_id}
                  className={`bg-white rounded-2xl border p-6 transition-all shadow-sm ${
                    rev.is_correct ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Question {idx + 1} • {rev.concept_tag}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      rev.is_correct
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rev.is_correct ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+20 pts)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> {rev.user_answer ? 'Incorrect (0 pts)' : 'Skipped (0 pts)'}
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-2">
                    {rev.title}
                  </h4>
                  <p className="text-xs text-slate-700 mb-3">
                    {rev.prompt}
                  </p>

                  {rev.code_snippet && (
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                      <pre>{rev.code_snippet}</pre>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                    <div>
                      <span className="font-semibold text-slate-500">Your Answer: </span>
                      <span className={rev.is_correct ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                        {rev.user_answer || '(Skipped - No Answer)'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Correct Answer: </span>
                      <span className="text-emerald-700 font-bold">
                        {rev.correct_answer}
                      </span>
                    </div>
                  </div>

                  {/* Explanation Note */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
                    <span className="font-bold text-blue-800">Concept Explanation: </span>
                    {rev.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 4: ATTEMPT HISTORY & RETEST TRACKER
        ========================================================================== */}
        {stage === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Your Skill Sprint History
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                All attempts are version-tracked and preserved. Retesting after code practice demonstrates learning progression.
              </p>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-slate-700">No Sprint Attempts Yet</div>
                  <p className="text-xs text-slate-500 mt-1">Select any skill from the library to take your first 5-minute sprint.</p>
                  <button
                    onClick={() => setStage('library')}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                  >
                    Browse Skill Library
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(att => (
                    <div
                      key={att.id}
                      className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                          att.score_percent >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.score_percent >= 60
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.score_percent}%
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{att.skill}</div>
                          <div className="text-xs text-slate-500">
                            {att.correct_answers} of {att.total_questions} Correct • {new Date(att.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startSprint(att.skill)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Retest
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
