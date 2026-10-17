import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ShieldCheck,
  FileCode,
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Assessment, MentorChatResponse } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: Array<{ label: string; action: string; target?: string; text?: string }>;
  citations?: Array<{ skill: string; file: string; lines: string; excerpt: string }>;
  timestamp: string;
}

export const MentorPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initMentor();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initMentor = async () => {
    try {
      const assessList = await api.listAssessments().catch(() => []);
      setAssessments(assessList);
      const latestId = assessList.length > 0 ? assessList[0].id : '';
      setSelectedAssessmentId(latestId);

      // Initial greeting
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello ${user?.full_name || 'Candidate'}! I am your ProofPath AI Career Coach, grounded in your real GitHub code artifacts and market requirements. I help you address skill gaps, prepare for technical defense, and optimize your evidence portfolio.`,
          actions: [
            { label: 'Explain My Biggest Skill Gap', action: 'query', text: 'Explain my biggest skill gap and how to fix it' },
            { label: 'Prepare Technical Defense', action: 'query', text: 'Give me an interview question based on my code' },
            { label: 'Review My Resume Citations', action: 'query', text: 'Review my resume claims against my repository citations' }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: MentorChatResponse = await api.chatWithMentor(textToSend, selectedAssessmentId);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        actions: res.suggested_actions,
        citations: res.evidence_citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I encountered an issue connecting to the AI evidence engine. Your deterministic repository profile is active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>AI Career Mentor</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  RAG Grounded
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Connected to verifiable repository code and market requirements
              </div>
            </div>
          </div>

          {assessments.length > 0 && (
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.job?.title || 'Assessment'} ({a.job?.company || 'Target'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                    isUser ? 'bg-blue-600' : 'bg-violet-600'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <div
                      className={`text-[10px] mt-2 font-mono ${
                        isUser ? 'text-blue-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {/* Grounded Citations attached to message */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>Referenced Repository Citations</span>
                      </div>
                      <div className="space-y-1">
                        {m.citations.map((c, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700 font-mono flex items-center justify-between">
                            <span>{c.file} ({c.lines})</span>
                            <span className="text-[10px] text-blue-600 font-sans font-medium">{c.skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Action Chips */}
                  {!isUser && m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (act.action === 'query' && act.text) {
                              handleSend(act.text);
                            } else if (act.action === 'navigate' && act.target) {
                              window.location.href = act.target;
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3 h-3 text-violet-600" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                <span>Searching AST chunks and formulating grounded response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your code evidence, interview preparation, or closing skill gaps..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
