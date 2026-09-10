import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    // Mock validation: Username: admin, Password: admin
    setTimeout(() => {
      if (username.trim().toLowerCase() === 'admin' && password === 'admin') {
        onLoginSuccess(username.trim(), rememberMe);
      } else {
        setError('Invalid username or password. (Hint: use admin / admin)');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto my-12 glass-card rounded-3xl p-8 shadow-2xl animate-fade-in-up border border-slate-800/80">
      
      {/* Back button */}
      <button
        onClick={onCancel}
        className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-bold uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-200 tracking-tight">Admin Authentication</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Please sign in to access security and SRE tools</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Username</label>
          <div className="relative bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 flex items-center gap-2.5 focus-within:border-indigo-500/70 transition-all shadow-inner">
            <User className="text-slate-500 h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600 py-3"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Password</label>
          <div className="relative bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 flex items-center gap-2.5 focus-within:border-indigo-500/70 transition-all shadow-inner">
            <Lock className="text-slate-500 h-4 w-4 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600 py-3"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-350 transition-colors p-1"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-400 font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500/25 bg-slate-900/60 h-4 w-4"
              disabled={loading}
            />
            <span>Remember Me</span>
          </label>
          <button
            type="button"
            onClick={() => setError('Contact the database administrator to reset password. (Hint: use admin / admin)')}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Login to Admin Dashboard'}
        </button>

      </form>
    </div>
  );
}
