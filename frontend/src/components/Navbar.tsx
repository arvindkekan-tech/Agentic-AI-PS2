import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutDashboard, History, LogOut, Compass, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-headline font-bold text-base tracking-tight text-slate-900 flex items-center gap-2">
              ProofPath
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold tracking-wider border border-blue-200">
                Evidence AI
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium tracking-tight -mt-0.5">
              Multi-Source Developer Verification
            </div>
          </div>
        </Link>

        {/* Navigation links for logged-in users */}
        {user ? (
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/dashboard')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Workspace</span>
            </Link>

            <Link
              to="/jobs/discover"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/jobs/discover')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Discover Jobs</span>
            </Link>

            <Link
              to="/wizard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/wizard')
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-md'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/history')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 mx-1.5" />

            {/* User profile & logout */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                <UserIcon className="w-3 h-3 text-blue-600" />
                <span className="truncate max-w-[130px]">{user.email}</span>
              </span>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
