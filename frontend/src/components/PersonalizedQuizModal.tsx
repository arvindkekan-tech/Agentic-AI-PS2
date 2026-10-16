import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Loader2,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import type {
  QuizClient,
  QuizAttemptResult
} from '../types';

interface PersonalizedQuizModalProps {
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalizedQuizModal: React.FC<PersonalizedQuizModalProps> = ({
  assessmentId,
  isOpen,
  onClose
}) => {
  const [quiz, setQuiz] = useState<QuizClient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User responses: questionId -> answer string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'results' | 'history'>('test');
  const [attempts, setAttempts] = useState<QuizAttemptResult[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadQuizAndAttempts();
    }
  }, [isOpen, assessmentId]);

  const loadQuizAndAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizData, attemptsData] = await Promise.all([
        api.getAssessmentQuiz(assessmentId),
        api.getAssessmentQuizAttempts(assessmentId).catch(() => [])
      ]);
      setQuiz(quizData);
      setAttempts(attemptsData);
      if (attemptsData.length > 0) {
        setResult(attemptsData[0]);
        setActiveTab('results');
      } else {
        setActiveTab('test');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate personalized skill test.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    // Validate that at least some answers have been provided
    const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
    if (answeredCount === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([question_id, answer_text]) => ({
        question_id,
        answer_text
      }));

      const res = await api.submitAssessmentQuiz(assessmentId, {
        quiz_id: quiz.id,
        answers: formattedAnswers
      });

      setResult(res);
      setAttempts((prev) => [res, ...prev]);
      setActiveTab('results');
    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Failed to grade assessment.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Personalized Technical Skill Test
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  MCQ & Written Rubric
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Connected directly to your job requirements, résumé claims, and verified code evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attempts.length > 0 && (
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('test')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'test'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Take Test
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    activeTab === 'results'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Latest Result
                </button>
                {attempts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activeTab === 'history'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    History ({attempts.length})
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Generating personalized skill test tailored to your profile...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadQuizAndAttempts}
                className="px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          ) : activeTab === 'test' && quiz ? (
            /* Test Taking Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">{quiz.title}</span> — Answer keys are protected prior to submission.
                  Multiple choice questions are scored deterministically; written questions are evaluated against transparent technical rubrics.
                </div>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((q, idx) => {
                  const isMCQ = q.question_type === 'mcq';
                  const currentAnswer = answers[q.id] || '';

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {q.skill_name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {q.question_type === 'mcq' ? 'Multiple Choice' : 'Written Architecture Answer'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {q.points} Points
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.question_text}
                      </p>

                      {isMCQ ? (
                        /* MCQ Options */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt) => {
                            const isSelected = currentAnswer.toUpperCase() === opt.key.toUpperCase();
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleSelectOption(q.id, opt.key)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left text-xs transition-all ${
                                  isSelected
                                    ? 'bg-blue-50/90 border-blue-500 text-blue-900 font-medium ring-2 ring-blue-500/20'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white border border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <span className="leading-relaxed">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Written Short-Answer Editor */
                        <div className="pt-1 space-y-1.5">
                          <textarea
                            rows={4}
                            value={currentAnswer}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                            placeholder="Type your explanation in your own words. Detail architectural reasoning, concrete implementation steps, and error handling..."
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
                          />
                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                            <span>Scored on: Conceptual correctness, technical details, and reasoning.</span>
                            <span>{currentAnswer.length} characters</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating Answers...
                    </>
                  ) : (
                    <>
                      Submit Skill Test
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : activeTab === 'results' && result ? (
            /* Results & Transparent Rubric Breakdown */
            <div className="space-y-6">
              {/* Score Hero Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
                      Test Assessment Report
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        result.passed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {result.passed ? 'Verified Competency (Passed)' : 'Needs Practical Reinforcement'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-headline font-bold text-slate-900 mt-1">
                    {result.total_score} / {result.max_score} Points ({result.percentage}%)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    {result.feedback_summary}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Deterministic MCQ</div>
                    <div className="text-base font-bold text-blue-600">{result.mcq_score} pts</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Written Rubric</div>
                    <div className="text-base font-bold text-indigo-600">{result.written_score} pts</div>
                  </div>
                </div>
              </div>

              {/* Skill Observations Matrix */}
              {result.skill_observations.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">
                    Skill-Level Observations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {result.skill_observations.map((obs, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-xs"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{obs.skill}</span>
                          <span className="font-mono text-blue-600 font-semibold">{obs.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              obs.percentage >= 80
                                ? 'bg-emerald-500'
                                : obs.percentage >= 60
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${obs.percentage}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500">{obs.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question By Question Feedback */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Detailed Answer Breakdown & Evaluation Rubrics
                </h4>

                {result.answers.map((ans, idx) => {
                  const isMCQ = ans.question_type === 'mcq';
                  const rubric = ans.rubric_breakdown || {};
                  const missingConcepts = rubric.missing_concepts || [];
                  const identifiedConcepts = rubric.identified_concepts || [];

                  return (
                    <div
                      key={ans.question_id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900">{ans.skill_name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            ({isMCQ ? 'Multiple Choice' : 'Written Rubric'})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs px-2 py-0.5 rounded-full border ${
                              ans.score_awarded > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ans.score_awarded} / {ans.max_points} pts
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-800">{ans.question_text}</p>

                      {/* User's Submitted Answer */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="text-[11px] text-slate-500 font-medium mb-1">Your Submitted Answer:</div>
                        <div className="text-slate-800 font-mono whitespace-pre-wrap">
                          {ans.user_answer || '(No answer provided)'}
                        </div>
                      </div>

                      {/* Correct Concept / Rubric Breakdown */}
                      <div className="text-xs space-y-1.5 pt-1">
                        {isMCQ && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="font-semibold">Correct Option:</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              {ans.correct_answer}
                            </span>
                          </div>
                        )}

                        <div className="text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-700">Evaluation: </span>
                          {ans.evaluation_feedback}
                        </div>

                        {ans.explanation && (
                          <div className="text-slate-500 italic text-[11px]">
                            Note: {ans.explanation}
                          </div>
                        )}

                        {/* Concepts Identified vs Missing for Written Answers */}
                        {!isMCQ && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {identifiedConcepts.map((c: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {c}
                              </span>
                            ))}
                            {missingConcepts.map((c: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Steps */}
              {result.recommended_next_steps.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Recommended Next Steps</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-blue-950/80 leading-relaxed">
                    {result.recommended_next_steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setActiveTab('test');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Assessment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Historical Attempts */
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Previous Submissions
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => {
                      setResult(att);
                      setActiveTab('results');
                    }}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {att.total_score} / {att.max_score} ({att.percentage}%)
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(att.submitted_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          att.passed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {att.passed ? 'Passed' : 'Needs Review'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
