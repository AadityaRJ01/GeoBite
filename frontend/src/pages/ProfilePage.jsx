import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Edit3,
  Check,
  X,
  LogOut,
  Compass,
  Route,
  BarChart2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleStartEdit = () => {
    setNameInput(user?.name || '');
    setIsEditing(true);
    setFeedback({ type: '', message: '' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNameInput(user?.name || '');
    setFeedback({ type: '', message: '' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setFeedback({
        type: 'error',
        message: 'Name must be at least 2 characters long.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await updateProfile({ name: nameInput.trim() });
      setIsEditing(false);
      setFeedback({
        type: 'success',
        message: 'Your profile name has been updated successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active member';

  return (
    <div className="min-h-screen flex flex-col bg-sand-50/60 text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      <Navbar pageTag="Profile" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Account & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
            User Profile
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your personal credentials, view account status, and control active sessions.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-900'
                : 'bg-rose-50 border border-rose-200/80 text-rose-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium">{feedback.message}</div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft-md border border-forest-100/80 mb-8">
          {/* Avatar & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-forest-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 text-teal-300 flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-soft-md border-2 border-teal-500/40">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-forest-950 flex items-center gap-2">
                  <span>{user?.name || 'Explorer'}</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded-full">
                    Verified
                  </span>
                </h2>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user?.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 text-sm font-bold transition-all cursor-pointer shadow-soft-sm active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* User Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            {/* Full Name attribute */}
            <div className="p-4 rounded-2xl bg-sand-50/70 border border-sand-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Display Name</span>
                </span>
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 mt-2">
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white text-forest-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    placeholder="Enter new name"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-forest-900 text-white text-xs font-bold flex items-center gap-1 shadow-soft-sm hover:bg-forest-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                      ) : (
                        <Check className="w-3 h-3 text-teal-400" />
                      )}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-base font-bold text-forest-950">{user?.name}</p>
              )}
            </div>

            {/* Email attribute (Immutable) */}
            <div className="p-4 rounded-2xl bg-sand-50/70 border border-sand-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <span>Email Address</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Primary ID
                </span>
              </div>
              <p className="text-base font-bold text-forest-950 font-mono text-sm sm:text-base">
                {user?.email}
              </p>
            </div>

            {/* Account Creation Date */}
            <div className="p-4 rounded-2xl bg-sand-50/70 border border-sand-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Member Since</span>
              </span>
              <p className="text-base font-bold text-forest-950">{formattedDate}</p>
            </div>

            {/* Session Security */}
            <div className="p-4 rounded-2xl bg-sand-50/70 border border-sand-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session Status</span>
              </span>
              <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active JWT Session (tab-isolated)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Cards for Platform Features */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-forest-900 mb-3">
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/discover"
              className="p-4 rounded-2xl bg-white border border-forest-100 hover:border-teal-300 hover:shadow-soft-md transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-forest-950 group-hover:text-teal-700 transition-colors">
                  Geospatial Discovery
                </p>
                <p className="text-xs text-slate-500">Search global city places</p>
              </div>
            </Link>

            <Link
              to="/route"
              className="p-4 rounded-2xl bg-white border border-forest-100 hover:border-teal-300 hover:shadow-soft-md transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-forest-950 group-hover:text-teal-700 transition-colors">
                  Route Planner
                </p>
                <p className="text-xs text-slate-500">Multi-stop OSRM routing</p>
              </div>
            </Link>

            <Link
              to="/benchmark"
              className="p-4 rounded-2xl bg-white border border-forest-100 hover:border-teal-300 hover:shadow-soft-md transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-forest-950 group-hover:text-teal-700 transition-colors">
                  Algorithm Benchmark
                </p>
                <p className="text-xs text-slate-500">NN vs 2-opt comparison</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
