import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Compass, User, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      <Navbar pageTag="Create Account" />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background ambient elements */}
        <div className="absolute inset-0 bg-geo-dots opacity-40 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-teal-200/20 via-forest-100/30 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-md w-full relative z-10">
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-soft-lg border border-forest-100">
            
            {/* Header Icon */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-950 to-forest-900 text-teal-300 mx-auto flex items-center justify-center shadow-soft-sm border border-teal-500/30 mb-4">
                <Compass className="w-6 h-6 text-teal-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 font-sans tracking-tight">
                Create an account
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                Join GeoBite to optimize trips, save routes, and explore any city across the globe.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-sans">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest-200 bg-sand-50/50 text-forest-950 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-sans">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest-200 bg-sand-50/50 text-forest-950 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-sans">
                  Password (min. 8 characters)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-forest-200 bg-sand-50/50 text-forest-950 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-sans">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest-200 bg-sand-50/50 text-forest-950 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 hover:from-forest-900 hover:to-forest-700 active:scale-95 text-teal-300 font-bold text-sm shadow-soft-sm hover:shadow-soft-md transition-all duration-200 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-400" />
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <Link
                  to="/login"
                  state={{ from }}
                  className="font-bold text-teal-700 hover:text-teal-800 transition-colors"
                >
                  Sign in to your account
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
