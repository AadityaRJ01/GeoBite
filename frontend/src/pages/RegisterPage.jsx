import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Real-time validation checks
  const isLengthValid = password.length >= 8;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter a valid name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/discover', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50/60 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar pageTag="Auth" />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 text-teal-400 shadow-soft-md border border-teal-500/30 mb-4">
              <Compass className="w-8 h-8 animate-spin-slow" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
              Join Geo<span className="text-teal-600">Bite</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Create an account to explore cities, save routes, and benchmark algorithms.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft-lg border border-forest-100/80">
            {errorMessage && (
              <div
                className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 animate-fadeIn"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-rose-800 font-medium">
                  {errorMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Explorer"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-sand-50/50 text-forest-950 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="explorer@geobite.app"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-sand-50/50 text-forest-950 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-sand-200 bg-sand-50/50 text-forest-950 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-forest-900 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-sand-50/50 text-forest-950 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Real-time Validation Hints */}
              {password.length > 0 && (
                <div className="p-3 rounded-xl bg-sand-50/80 border border-sand-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {isLengthValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={isLengthValid ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                      Minimum 8 characters
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2">
                      {doPasswordsMatch ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className={doPasswordsMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match yet'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-sm shadow-soft-sm hover:shadow-soft-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-forest-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-teal-700 hover:text-teal-800 transition-colors"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </div>

          {/* Quick guest note */}
          <div className="mt-6 text-center">
            <Link
              to="/discover"
              className="text-xs font-semibold text-slate-500 hover:text-forest-900 transition-colors inline-flex items-center gap-1"
            >
              <span>Explore as Guest without an account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

