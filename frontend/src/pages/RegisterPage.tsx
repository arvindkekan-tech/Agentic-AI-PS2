import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await register(email, password, fullName || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#111318]">
      <div className="max-w-md w-full bg-[#1B1D24] border border-[#282B36] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#C7F36B] flex items-center justify-center text-[#111318] mx-auto mb-4 shadow-md">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight">
            Create Your Account
          </h2>
          <p className="text-xs text-[#9A9FB1] mt-1 font-sans">
            Start verifying your repository evidence against real job requirements
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#E77D83]/15 border border-[#E77D83]/30 text-xs text-[#E77D83] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-1.5">
              Full Name (Optional)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-[#50566A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex River"
                className="w-full bg-[#111318] border border-[#282B36] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F4F1E8] placeholder-[#50566A] focus:outline-none focus:border-[#C7F36B] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#50566A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full bg-[#111318] border border-[#282B36] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F4F1E8] placeholder-[#50566A] focus:outline-none focus:border-[#C7F36B] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#9A9FB1] mb-1.5">
              Password (min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#50566A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111318] border border-[#282B36] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F4F1E8] placeholder-[#50566A] focus:outline-none focus:border-[#C7F36B] transition-colors"
              />
            </div>
          </div>

          <div className="bg-[#111318] p-3 rounded-xl border border-[#282B36] text-[11px] text-[#9A9FB1] space-y-1 font-mono">
            <div className="flex items-center gap-1.5 text-[#C7F36B]">
              <Check className="w-3.5 h-3.5" />
              <span>Passwords securely hashed with Argon2</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A99BFF]">
              <Check className="w-3.5 h-3.5" />
              <span>Signed JWT session tokens (24h validity)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#C7F36B] text-[#111318] font-headline font-bold text-sm hover:bg-[#b8e458] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#9A9FB1]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#C7F36B] hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
