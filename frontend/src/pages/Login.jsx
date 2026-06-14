import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, DollarSign } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/10 dark:bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center animate-fade-in">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white shadow-xl shadow-primary-500/25">
            <DollarSign className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-primary-950 to-primary-600 dark:from-white dark:to-primary-450 bg-clip-text text-transparent">
            Welcome back to SplitWise
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to analyze expenses, splits, and settle debts.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md animate-scale-up">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-450 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input font-medium"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 active:scale-[0.98] shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Switch page */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-450">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-bold text-primary-500 hover:text-primary-650 transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
