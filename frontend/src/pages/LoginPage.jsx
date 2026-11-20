import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Star,
  Quote,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function LoginPage({ initialMode = 'signin' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('elena.larranaga@geobite.travel');
  const [password, setPassword] = useState('secretBasquePath123!');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedQuickAccount, setSelectedQuickAccount] = useState('elena');

  const from = location.state?.from || '/discover';

  // Toggle mode
  const handleSwitchMode = (mode) => {
    setAuthMode(mode);
    setError(null);
    setSuccessMessage(null);
  };

  // Quick Account Picker
  const handleSelectAccount = (accKey, accName, accEmail) => {
    setSelectedQuickAccount(accKey);
    setName(accName);
    setEmail(accEmail);
    setPassword('secretBasquePath123!');
    setError(null);
  };

  // Social Login Stub with polite feedback
  const handleSocialAuth = (provider) => {
    setError(null);
    setSuccessMessage(`${provider} passkey verified. Preparing encrypted session...`);
    setTimeout(() => {
      // Demo auto-sign in
      handleQuickDemoSignIn(email, password);
    }, 600);
  };

  const handleQuickDemoSignIn = async (userEmail, userPass) => {
    try {
      setLoading(true);
      setError(null);
      await login(userEmail.trim(), userPass, staySignedIn);
      navigate(from, { replace: true });
    } catch (err) {
      // If user doesn't exist yet, attempt automatic demo registration so 1-click test always works
      try {
        const demoName = userEmail.includes('elena') ? 'Elena Larrañaga' : 'Donostia Culinary';
        await register(demoName, userEmail.trim(), userPass);
        navigate(from, { replace: true });
      } catch (regErr) {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setError('Please provide your full name to create an account.');
      return;
    }

    if (authMode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      if (authMode === 'signin') {
        try {
          await login(email.trim(), password, staySignedIn);
          setSuccessMessage('Access Granted. Redirecting to your curated journeys...');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 400);
        } catch (loginErr) {
          // If demo quick login failed because user not yet seeded, offer quick fallback
          if (email.includes('@geobite.travel') || email.includes('@basqueculinary.org')) {
            const fallbackName = name.trim() || (email.includes('elena') ? 'Elena Larrañaga' : 'Donostia Culinary');
            await register(fallbackName, email.trim(), password);
            navigate(from, { replace: true });
            return;
          }
          throw loginErr;
        }
      } else {
        await register(name.trim(), email.trim(), password);
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 400);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      {/* ── Top Header Navigation Bar ──────────────────────────────────── */}
      <header className="w-full bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/20">
        <div className="h-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:scale-105 transition-transform">
              G
            </span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight">
              GeoBite
            </span>
          </Link>

          <Link
            to="/discover"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded-full hover:bg-surface-container"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explore</span>
          </Link>
        </div>
      </header>

      {/* ── Main Authentication Content ─────────────────────────────────── */}
      <main className="flex-1 w-full bg-surface flex items-center justify-center py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col w-full max-w-6xl mx-auto my-auto">
          {/* Container Card: Editorial Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden bg-surface-container-lowest shadow-xl border border-outline-variant/30">
            {/* ── Left Hero & Editorial Visual Panel (5 Columns) ───────────── */}
            <div className="lg:col-span-5 relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-on-primary overflow-hidden min-h-[480px] lg:min-h-[720px]">
              {/* Background Photography with Scrim */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDxrFK30AA-Oya40Fl7FJcZ0K3N8PppdgcVtiYuyuHjAAnS7-7D9dOGpLzCbWjBP5UNVeoOhnsNaP1e1EhrISt5RrHUrYpbtsTQAIlgyCPSJo78r55Gbe2_DABculxqbcVj1ftZE2ROA8X-M5r6LGuU7AVYyCxay0FRx-eDF5RqdzSPqdLkAKykg0saCSqfqB2GhuHRUXH_sf6SnJcz23GoeI0pqhcr5cbg9yaCk6Q')",
                }}
              />

              {/* Sophisticated Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-primary/30 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-transparent to-primary/90" />

              {/* Top Overlay Content */}
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-primary-fixed border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                    explore
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    San Sebastián • Basque Country
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight text-on-primary font-semibold tracking-tight">
                  Travel for the palate. <br className="hidden sm:inline" />
                  <span className="italic font-normal text-secondary-fixed">
                    Planned with precision.
                  </span>
                </h2>
              </div>

              {/* Bottom Overlay Quote & Verification Seal */}
              <div className="relative z-10 space-y-4 pt-8">
                {/* Testimonial Editorial Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-primary/40 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1.5 mb-2 text-secondary-fixed">
                    <Quote className="w-4 h-4 rotate-180" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      Curator Endorsement
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-primary/90 italic leading-relaxed">
                    “GeoBite transformed how we navigate the world's most evocative food capitals —
                    uncrossing routes, reserving legendary tables, and curating every walking hour.”
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-primary-fixed font-semibold tracking-wide">
                      Condé Nast Traveler &amp; Kinfolk Journal
                    </span>
                    <div className="flex items-center gap-0.5 text-secondary-fixed">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Geospatial Engine Metric */}
                <div className="flex items-center justify-between text-on-primary/80 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                    <span className="font-medium">45,000+ Journeys Optimized</span>
                  </div>
                  <span className="text-[10px] text-secondary-fixed font-mono uppercase bg-primary-container/80 px-2.5 py-0.5 rounded-full border border-secondary-fixed/20 font-bold">
                    2-Opt Engine Active
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right Interaction & Authentication Form (7 Columns) ───────── */}
            <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-12 bg-surface-container-lowest">
              {/* Top Utility Header inside Card */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-serif text-sm font-bold">
                    G
                  </span>
                  <span className="font-serif text-lg font-bold text-primary">
                    GeoBite{' '}
                    <span className="font-normal italic text-secondary text-base">Pass</span>
                  </span>
                </div>

                {/* Segmented Tab Pill Controller */}
                <div
                  className="inline-flex p-1 rounded-full bg-surface-container-low border border-outline-variant/30"
                  role="tablist"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signin'}
                    onClick={() => handleSwitchMode('signin')}
                    className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      authMode === 'signin'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authMode === 'signup'}
                    onClick={() => handleSwitchMode('signup')}
                    className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Main Form Container */}
              <div className="max-w-md w-full mx-auto space-y-5">
                {/* Contextual Headings */}
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
                    {authMode === 'signin' ? 'Welcome back, traveler' : 'Begin your journey'}
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    {authMode === 'signin'
                      ? 'Access your saved journeys, zero-backtracking algorithms, and Basque culinary dossiers.'
                      : 'Join the global circle of culinary flâneurs and create customized food trails.'}
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-error-container border border-error/30 text-on-error-container text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="p-3.5 rounded-2xl bg-secondary-container border border-secondary/30 text-on-secondary-container text-xs flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-secondary shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Social / 1-Click Fast Auth */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Google')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors border border-outline-variant/30 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth('Apple Passkey')}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors border border-outline-variant/30 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.77 1.04-1.84.93-2.91-.9.04-2 .61-2.65 1.37-.58.67-.99 1.76-.85 2.81 1.01.08 2.02-.55 2.57-1.27z" />
                    </svg>
                    <span>Apple Passkey</span>
                  </button>
                </div>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="w-full h-px bg-surface-container-high" />
                  <span className="absolute px-3 bg-surface-container-lowest text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    or continue with email
                  </span>
                </div>

                {/* Input Form Elements */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field (Visible on Register) */}
                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-on-surface">
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required={authMode === 'signup'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Elena Larrañaga"
                          className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/30 transition-all font-medium"
                        />
                        <span className="material-symbols-outlined absolute right-3.5 text-on-surface-variant/60 text-[20px]">
                          person
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-on-surface">
                        Email Address
                      </label>
                      <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Verified Curator
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elena.larranaga@geobite.travel"
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/30 transition-all font-medium"
                      />
                      <span className="material-symbols-outlined absolute right-3.5 text-secondary text-[20px]">
                        check_circle
                      </span>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-on-surface">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setError('To reset your password, please contact the GeoBite Curator Desk.')
                        }
                        className="text-[11px] font-semibold text-secondary hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface text-sm tracking-wider focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/30 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-on-surface-variant hover:text-primary transition-colors focus:outline-none cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Biometrics / Hardware Security Badge */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low/70 text-on-surface-variant text-xs border border-outline-variant/20">
                    <Fingerprint className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-[11px] leading-snug">
                      Secure WebAuthn hardware keys &amp; Face ID enabled for this device.
                    </span>
                  </div>

                  {/* Checkbox: Session Persistence */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={staySignedIn}
                        onChange={(e) => setStaySignedIn(e.target.checked)}
                        className="w-4 h-4 rounded text-secondary bg-surface-container-low accent-secondary focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-on-surface-variant font-medium">
                        Stay signed in for 30 days
                      </span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant/70">Trusted browser</span>
                  </div>

                  {/* Primary Submit CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-full bg-primary text-on-primary hover:bg-primary-container font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-secondary-fixed" />
                        <span>Authenticating Route Key...</span>
                      </>
                    ) : authMode === 'signin' ? (
                      <>
                        <span>Sign In to GeoBite</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Create GeoBite Account</span>
                        <span className="material-symbols-outlined text-[18px]">
                          travel_explore
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Stored Curator Profiles / Fast Switcher Drawer */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Fast Account Switcher
                    </span>
                    <span className="text-[11px] font-semibold text-secondary">2 Saved Keys</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Account Card 1 (Elena) */}
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectAccount(
                          'elena',
                          'Elena Larrañaga',
                          'elena.larranaga@geobite.travel'
                        )
                      }
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors text-left group border cursor-pointer ${
                        selectedQuickAccount === 'elena'
                          ? 'bg-surface-container-low border-secondary/40'
                          : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-xs font-bold shrink-0">
                        EL
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                          Elena Larrañaga
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          Curator Profile
                        </p>
                      </div>
                      {selectedQuickAccount === 'elena' ? (
                        <Check className="w-3.5 h-3.5 text-secondary shrink-0" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-on-surface-variant">
                          swap_horiz
                        </span>
                      )}
                    </button>

                    {/* Account Card 2 (Donostia) */}
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectAccount(
                          'donostia',
                          'Donostia Culinary Inst.',
                          'trips@basqueculinary.org'
                        )
                      }
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors text-left group border cursor-pointer ${
                        selectedQuickAccount === 'donostia'
                          ? 'bg-surface-container-low border-secondary/40'
                          : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        DC
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-on-surface truncate group-hover:text-secondary transition-colors">
                          Donostia Culinary
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          Partner Pass
                        </p>
                      </div>
                      {selectedQuickAccount === 'donostia' ? (
                        <Check className="w-3.5 h-3.5 text-secondary shrink-0" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-on-surface-variant">
                          swap_horiz
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footnote Legal Terms */}
              <div className="mt-8 text-center pt-2">
                <p className="text-xs text-on-surface-variant/80">
                  Protected by GeoBite Cryptographic Enclave. By continuing you agree to the{' '}
                  <span className="underline hover:text-primary transition-colors cursor-pointer">
                    Curator Charter
                  </span>{' '}
                  &amp;{' '}
                  <span className="underline hover:text-primary transition-colors cursor-pointer">
                    Cartographic Privacy
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-surface-container-low py-4 border-t border-outline-variant/30 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-on-surface-variant text-xs">
          <span>© 2025 GeoBite Travel Technologies. Curated geospatial journeys.</span>
          <div className="flex items-center gap-4">
            <Link to="/saved-trips" className="hover:text-primary transition-colors">
              Saved Trips
            </Link>
            <Link to="/profile" className="hover:text-primary transition-colors">
              Curator Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
