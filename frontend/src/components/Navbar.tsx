import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Compass,
  FileText,
  MessageSquare,
  Building2,
  Users,
  Activity,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Loader2,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSeedJudgeDemo = async () => {
    try {
      setSeeding(true);
      await api.seedJudgeDemo();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      console.error('Failed to seed demo scenario:', err);
    } finally {
      setSeeding(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-headline font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              ProofPath
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 tracking-wider font-semibold border border-blue-200">
                W-PS-2
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans tracking-tight -mt-0.5">
              AI Career Coach · Kurukshetra 2026
            </div>
          </div>
        </Link>

        {/* Workspace Role Switcher & Navigation */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Student Links */}
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <Link
              to="/tasks"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/tasks')
                  ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Proof Tasks</span>
            </Link>

            <Link
              to="/sprint"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/sprint')
                  ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Skill Sprint</span>
            </Link>

            <Link
              to="/passport"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/passport')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Passport</span>
            </Link>

            <Link
              to="/mentor"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/mentor')
                  ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
              <span className="hidden xl:inline">AI Mentor</span>
            </Link>

            <Link
              to="/roadmap"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/roadmap')
                  ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden xl:inline">Roadmap</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Role Portals */}
            <Link
              to="/recruiter"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/recruiter')
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Recruiter</span>
            </Link>

            <Link
              to="/college"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/college')
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">College T&P</span>
            </Link>

            <Link
              to="/diagnostics"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isActive('/diagnostics')
                  ? 'bg-slate-100 text-blue-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title="Integration Status & Diagnostics"
            >
              <Activity className="w-4 h-4" />
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* 1-Click Judge Demo Seeder */}
            <button
              onClick={handleSeedJudgeDemo}
              disabled={seeding}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                seedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              }`}
              title="Reset and load complete Judge Demo Scenario (Jobs, Repo, Citations, Tasks, T&P)"
            >
              {seeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : seedSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {seeding ? 'Seeding...' : seedSuccess ? 'Scenario Ready' : 'Load Demo'}
              </span>
            </button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-1 ml-1">
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-600 px-2 py-1 rounded bg-slate-100 border border-slate-200">
                <UserIcon className="w-3 h-3 text-blue-600" />
                <span className="truncate max-w-[100px]">{user.email}</span>
              </span>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedJudgeDemo}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Demo Scenario</span>
            </button>

            <Link
              to="/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
