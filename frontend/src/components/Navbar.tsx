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
  ChevronDown,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      await switchRole(newRole);
      setRoleMenuOpen(false);
      if (newRole === 'recruiter') {
        navigate('/recruiter');
      } else if (newRole === 'college_tp') {
        navigate('/college');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const currentRole = user?.role || 'student';

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
            {/* STUDENT WORKSPACE NAVIGATION */}
            {currentRole === 'student' && (
              <>
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
                  to="/resume-studio"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/resume-studio')
                      ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Career Profile</span>
                </Link>

                <Link
                  to="/jobs"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive('/jobs')
                      ? 'bg-slate-100 text-blue-700 font-semibold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden lg:inline">Find Jobs</span>
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
              </>
            )}

            {/* RECRUITER WORKSPACE NAVIGATION */}
            {currentRole === 'recruiter' && (
              <>
                <Link
                  to="/recruiter"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive('/recruiter')
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Candidate Discovery & Provenance</span>
                </Link>
              </>
            )}

            {/* COLLEGE T&P WORKSPACE NAVIGATION */}
            {currentRole === 'college_tp' && (
              <>
                <Link
                  to="/college"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive('/college')
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Cohort Analytics & Sprints</span>
                </Link>
              </>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* System Diagnostics & Health Status */}
            <Link
              to="/diagnostics"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isActive('/diagnostics')
                  ? 'bg-slate-100 text-blue-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title="Integration Status & Diagnostic Tests"
            >
              <Activity className="w-4 h-4" />
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-medium transition-colors"
                title="Switch active role workspace"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="capitalize font-semibold">
                  {currentRole === 'college_tp' ? 'College T&P' : currentRole}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-semibold border-b border-slate-100">
                    Switch Workspace Role
                  </div>
                  <button
                    onClick={() => handleRoleChange('student')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'student' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>Student Workspace</span>
                    {currentRole === 'student' && <span className="text-[10px] font-mono text-blue-600">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange('recruiter')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'recruiter' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>Recruiter Workspace</span>
                    {currentRole === 'recruiter' && <span className="text-[10px] font-mono text-blue-600">Active</span>}
                  </button>
                  <button
                    onClick={() => handleRoleChange('college_tp')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'college_tp' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>College T&P Workspace</span>
                    {currentRole === 'college_tp' && <span className="text-[10px] font-mono text-blue-600">Active</span>}
                  </button>
                </div>
              )}
            </div>

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
