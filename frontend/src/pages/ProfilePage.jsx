import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Calendar, ShieldCheck, Edit3, LogOut, BookmarkCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-sand-50">
        <Navbar pageTag="Profile" />
        <main className="flex-1 max-w-xl mx-auto py-20 px-4 text-center">
          <div className="bg-white p-8 rounded-3xl border border-forest-100 shadow-soft-sm">
            <h2 className="text-2xl font-extrabold text-forest-950 font-sans">Authentication Required</h2>
            <p className="mt-2 text-sm text-slate-500">Please sign in to view and manage your traveler profile.</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-6 py-2.5 bg-forest-900 text-teal-300 rounded-xl font-bold text-xs shadow-soft-sm"
            >
              Go to Login
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: name.trim() });
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recent Member';

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      <Navbar pageTag="Profile" />

      <main className="flex-1 max-w-4xl mx-auto w-full py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-soft-lg border border-forest-100 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 px-6 sm:px-10 py-10 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 rounded-3xl bg-teal-500/20 backdrop-blur-md border-2 border-teal-400/40 flex items-center justify-center text-3xl font-extrabold text-teal-300 uppercase shadow-soft-sm">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight">{user.name}</h1>
                  <p className="text-teal-200/90 text-xs sm:text-sm mt-0.5 font-medium">{user.email}</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-bold uppercase tracking-wider mt-2 border border-teal-400/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Traveler</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/saved-trips')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 text-forest-950 hover:bg-teal-400 font-bold text-xs shadow-soft-sm transition-all cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>My Saved Trips</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-10 space-y-8">
            
            {message && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            {/* Information Grid */}
            <div className="border-b border-forest-100 pb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-forest-950 font-sans tracking-tight">Account Information</h3>
                  <p className="text-xs text-slate-500">Manage your personal credentials and preferences.</p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-200 text-xs font-bold text-slate-700 hover:bg-sand-100 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-sans">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-forest-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-forest-900 text-teal-300 rounded-xl text-xs font-bold hover:bg-forest-800 cursor-pointer shadow-soft-sm"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(user.name);
                        setEditing(false);
                        setError(null);
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-sand-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Full Name</span>
                    </div>
                    <p className="text-sm font-bold text-forest-950 font-sans">{user.name}</p>
                  </div>

                  <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Email Address</span>
                    </div>
                    <p className="text-sm font-bold text-forest-950 font-sans">{user.email}</p>
                  </div>

                  <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Member Since</span>
                    </div>
                    <p className="text-sm font-bold text-forest-950 font-sans">{formattedDate}</p>
                  </div>

                  <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Session Security</span>
                    </div>
                    <p className="text-sm font-bold text-teal-700 font-sans">JWT Encrypted Bearer</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/saved-trips')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-forest-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-teal-600" />
                <span>View My Saved Trips</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
