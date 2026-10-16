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
    <header className="sticky top-0 z-40 w-full border-b border-[#282B36] bg-[#111318]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#C7F36B] flex items-center justify-center text-[#111318] shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-headline font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              ProofPath
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#282B36] text-[#C7F36B] tracking-wider border border-[#3B4050]">
                Phase 2
              </span>
            </div>
            <div className="text-[10px] text-[#9A9FB1] font-mono tracking-tight -mt-0.5">
              Career Intelligence & Verified Evidence
            </div>
          </div>
        </Link>

        {/* Navigation links for logged-in users */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-[#1B1D24] text-white border border-[#282B36]'
                  : 'text-[#9A9FB1] hover:text-white hover:bg-[#1B1D24]/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span className="hidden sm:inline">Workspace</span>
            </Link>

            <Link
              to="/jobs/discover"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/jobs/discover')
                  ? 'bg-[#1B1D24] text-[#C7F36B] border border-[#282B36]'
                  : 'text-[#9A9FB1] hover:text-white hover:bg-[#1B1D24]/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#C7F36B]" />
              <span className="hidden sm:inline">Discover Jobs</span>
            </Link>

            <Link
              to="/wizard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/wizard')
                  ? 'bg-[#C7F36B] text-[#111318]'
                  : 'bg-[#C7F36B]/15 text-[#C7F36B] hover:bg-[#C7F36B]/25 border border-[#C7F36B]/30'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/history')
                  ? 'bg-[#1B1D24] text-white border border-[#282B36]'
                  : 'text-[#9A9FB1] hover:text-white hover:bg-[#1B1D24]/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#A99BFF]" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <div className="h-4 w-px bg-[#282B36] mx-2" />

            {/* User profile & logout */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#9A9FB1] font-mono px-2 py-1 rounded bg-[#1B1D24] border border-[#282B36]">
                <UserIcon className="w-3 h-3 text-[#C7F36B]" />
                <span className="truncate max-w-[120px]">{user.email}</span>
              </span>

              <button
                onClick={handleLogout}
                className="p-1.5 text-[#9A9FB1] hover:text-white hover:bg-[#282B36] rounded-lg transition-colors cursor-pointer"
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
              className="text-xs font-medium text-[#9A9FB1] hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#C7F36B] text-[#111318] hover:bg-[#b8e458] transition-colors shadow-sm"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
