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
    <header className="sticky top-0 z-40 w-full border-b border-[#29313B] bg-[#090D12]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#D6FF63] flex items-center justify-center text-[#090D12] shadow-[0_0_20px_rgba(214,255,99,0.3)] group-hover:scale-105 transition-all">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-headline font-bold text-base tracking-tight text-[#F4F5F2] flex items-center gap-1.5">
              ProofPath
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#171D25] text-[#D6FF63] tracking-wider border border-[#29313B]">
                AI Sentinel
              </span>
            </div>
            <div className="text-[10px] text-[#A9B0BC] font-mono tracking-tight -mt-0.5">
              Evidence Intelligence Platform
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
                  ? 'bg-[#171D25] text-white border border-[#29313B]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#D6FF63]" />
              <span className="hidden sm:inline">Workspace</span>
            </Link>

            <Link
              to="/jobs/discover"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/jobs/discover')
                  ? 'bg-[#171D25] text-[#D6FF63] border border-[#29313B]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#D6FF63]" />
              <span className="hidden sm:inline">Discover Jobs</span>
            </Link>

            <Link
              to="/wizard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive('/wizard')
                  ? 'bg-[#D6FF63] text-[#090D12] shadow-[0_0_15px_rgba(214,255,99,0.25)]'
                  : 'bg-[#D6FF63]/15 text-[#D6FF63] hover:bg-[#D6FF63]/25 border border-[#D6FF63]/30'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/history')
                  ? 'bg-[#171D25] text-white border border-[#29313B]'
                  : 'text-[#A9B0BC] hover:text-white hover:bg-[#171D25]/60'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#A99BFF]" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <div className="h-4 w-px bg-[#29313B] mx-2" />

            {/* User profile & logout */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#A9B0BC] font-mono px-2.5 py-1 rounded-lg bg-[#171D25] border border-[#29313B]">
                <UserIcon className="w-3 h-3 text-[#D6FF63]" />
                <span className="truncate max-w-[120px]">{user.email}</span>
              </span>

              <button
                onClick={handleLogout}
                className="p-1.5 text-[#A9B0BC] hover:text-white hover:bg-[#171D25] rounded-lg border border-transparent hover:border-[#29313B] transition-colors cursor-pointer"
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
              className="text-xs font-medium text-[#A9B0BC] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#171D25]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#D6FF63] text-[#090D12] hover:bg-[#c2ec4b] transition-all shadow-[0_0_15px_rgba(214,255,99,0.2)] hover:shadow-[0_0_20px_rgba(214,255,99,0.35)]"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
