import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Send,
  Sparkles,
  ShieldCheck,
  Award,
  Loader2,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import type { InterviewQuestion, InterviewEvaluation } from '../types';

export const InterviewPage: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.getInterviewQuestions('Full-Stack Platform Engineer');
      setQuestions(res);
      if (res.length > 0) {
        setActiveQuestion(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!activeQuestion || !userAnswer.trim() || evaluating) return;

    try {
      setEvaluating(true);
      const res = await api.evaluateInterviewAnswer({
        role_title: 'Full-Stack Platform Engineer',
        question: activeQuestion.question,
        question_type: activeQuestion.type,
        user_answer: userAnswer
      });
      setEvaluation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-mono text-violet-600 font-semibold uppercase tracking-wider mb-1">
            <span>Technical & Behavioral Defense</span>
            <span>•</span>
            <span className="text-slate-500">Rubric Feedback</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-violet-600" />
            Interview Coach & Code Defense
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Practice answering architecture and behavioral questions grounded in your actual GitHub repository evidence. Receive rubric-scored feedback on technical depth and citation clarity.
          </p>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setActiveQuestion(q);
                setEvaluation(null);
                setUserAnswer('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeQuestion?.id === q.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Question {idx + 1}: {q.type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Active Question Card */}
        {activeQuestion && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-bold">
                  {activeQuestion.type}
                </span>
                <span className="text-xs text-slate-500 font-medium">{activeQuestion.context}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {activeQuestion.question}
              </h2>
            </div>

            {/* Rubric Criteria */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Evaluation Rubric Criteria</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                {activeQuestion.rubric.criteria.map((cr, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>{cr}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Spoken or Written Response
              </label>
              <textarea
                rows={5}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Walk through your architectural approach. Mention specific design trade-offs, database considerations, and error handling practices..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white leading-relaxed transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Tip: Reference specific repository files or commit artifacts to demonstrate evidence-backed execution.
              </span>
              <button
                onClick={handleEvaluate}
                disabled={evaluating || !userAnswer.trim()}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {evaluating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{evaluating ? 'Evaluating Rubric...' : 'Evaluate My Answer'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Evaluation Feedback Result */}
        {evaluation && (
          <div className="bg-white rounded-2xl border border-violet-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900">Rubric Evaluation Results</h3>
              </div>
              <div className="flex items-baseline gap-1 text-2xl font-bold text-violet-600">
                <span>{evaluation.overall_score}</span>
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>

            {/* Rubric Score Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(evaluation.rubric_scores).map(([key, score]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{score}%</div>
                </div>
              ))}
            </div>

            {/* AI Feedback */}
            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="font-bold text-violet-900">Coach Recommendations:</div>
              <p>{evaluation.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
