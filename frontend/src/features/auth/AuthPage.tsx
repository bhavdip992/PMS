import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password, rememberMe);
    setLoading(false);
    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl" />

      <div className="w-full max-w-md z-10">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <img src="/logo.png" alt="esparkPM" className="w-16 h-16 object-contain rounded-2xl shadow-lg" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Welcome to esparkPM
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in with the credentials provided by your administrator
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">

          {/* Header */}
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-800">
            <Lock size={16} className="text-violet-400" />
            <span className="text-sm font-bold text-slate-200">Employee Sign In</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-2 px-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-violet-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition-all text-sm mt-4 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

          </form>

          <p className="text-center text-[10px] text-slate-600 mt-6">
            Don't have credentials? Contact your Super Admin to get access.
          </p>

        </div>
      </div>
    </div>
  );
}
