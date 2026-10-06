import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../../components/common/Logo';
import Button from '../../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@librax.com');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  const fillDemoStudent = () => {
    setEmail('sarah.j@student.edu');
    setPassword('Student@123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen aurora-bg flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient Aurora Orbs */}
      <div className="glow-orb top-[-50px] left-[-50px] w-[500px] h-[500px] bg-gradient-to-tr from-brand-600/35 to-violet-600/25" />
      <div className="glow-orb bottom-[-80px] right-[-80px] w-[550px] h-[550px] bg-gradient-to-bl from-accent-cyan/30 via-indigo-600/25 to-accent-fuchsia/20" />
      <div className="glow-orb top-[40%] right-[10%] w-[350px] h-[350px] bg-gradient-to-br from-emerald-500/15 to-accent-cyan/15" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8 text-center animate-fade-in">
          <Logo size="large" showSubtitle={true} className="mb-2" />
        </div>

        {/* Frosted Glass Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-3xl shadow-2xl relative">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In to LibraX
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a role profile or enter your institutional credentials
            </p>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs backdrop-blur-md">
              Your session has expired. Please authenticate again.
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs backdrop-blur-md">
              {errorMessage}
            </div>
          )}

          {/* Quick Demo Credentials Capsules */}
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-500" />
                1-Click Quick Demo Sign-in:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Admin
              </button>
              <button
                type="button"
                onClick={fillDemoStudent}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <UserCheck className="w-4 h-4 text-cyan-500" />
                Student
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@librax.com"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Authenticate & Continue
            </Button>
          </form>

          {/* Registration Footer */}
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-white/5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a new student account?{' '}
              <Link
                to="/register"
                className="font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Sign Up as Student
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
