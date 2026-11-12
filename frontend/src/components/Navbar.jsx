import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Activity,
  Menu,
  X,
  ArrowUpRight,
  MapPin,
  Route,
  BarChart2,
  User,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ healthStatus, pageTag, extraActions }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isDiscover = location.pathname.startsWith('/discover') || location.pathname.startsWith('/places');
  const isRoute = location.pathname.startsWith('/route');
  const isBenchmark = location.pathname.startsWith('/benchmark');
  const isHome = location.pathname === '/';

  const searchParams = new URLSearchParams(location.search);
  const cityParam = searchParams.get('city');
  const cityQuery = cityParam ? `?city=${encodeURIComponent(cityParam)}` : '';

  // Track scroll for sticky backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change or Escape key
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-forest-100 shadow-soft-sm'
          : 'bg-white/70 backdrop-blur-sm border-b border-forest-100/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
              aria-label="GeoBite Homepage"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 border border-teal-500/30">
                <div className="relative">
                  <Compass className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform duration-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-forest-950 font-sans flex items-center">
                  Geo<span className="text-teal-600">Bite</span>
                  <span className="ml-1.5 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                    {pageTag || 'v1.0'}
                  </span>
                </span>
                <span className="text-[11px] font-medium tracking-wide text-forest-600/70 -mt-1 hidden sm:block">
                  Geospatial Discovery & Routing
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              to={`/discover${cityQuery}`}
              aria-current={isDiscover ? 'page' : undefined}
              className={`text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                isDiscover
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/80 shadow-soft-sm'
                  : 'text-slate-600 hover:text-forest-900 hover:bg-forest-50/70'
              }`}
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Discover</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-teal-100 text-teal-800 font-bold">
                Live
              </span>
            </Link>

            <Link
              to={`/route${cityQuery}`}
              aria-current={isRoute ? 'page' : undefined}
              className={`text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                isRoute
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/80 shadow-soft-sm'
                  : 'text-slate-600 hover:text-forest-900 hover:bg-forest-50/70'
              }`}
            >
              <Route className="w-4 h-4 text-teal-600" />
              <span>Route Planner</span>
            </Link>

            <Link
              to="/benchmark"
              aria-current={isBenchmark ? 'page' : undefined}
              className={`text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                isBenchmark
                  ? 'bg-teal-50 text-teal-900 border border-teal-200/80 shadow-soft-sm'
                  : 'text-slate-600 hover:text-forest-900 hover:bg-forest-50/70'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-teal-600" />
              <span>Benchmark</span>
            </Link>

            {isHome && (
              <>
                <a
                  href="/#categories"
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-forest-900 px-3 py-1.5 rounded-xl hover:bg-forest-50/70 transition-colors"
                >
                  Categories
                </a>
                <a
                  href="/#architecture"
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-forest-900 px-3 py-1.5 rounded-xl hover:bg-forest-50/70 transition-colors"
                >
                  Architecture
                </a>
              </>
            )}
          </nav>

          {/* Right Header Area: Extra Actions / Health Pill / CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Page-specific extra actions (e.g. Optimize Route button, Refresh button, stop counter) */}
            {extraActions && (
              <div className="flex items-center gap-2">
                {extraActions}
              </div>
            )}

            {/* Live API Health Pill */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                healthStatus?.online
                  ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50/80 text-amber-800 border-amber-200'
              }`}
              title="PostgreSQL + PostGIS + Express Backend Connection"
            >
              <span className="relative flex h-2 w-2">
                {healthStatus?.online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthStatus?.online ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="font-mono text-[11px]">
                {healthStatus?.online ? 'Express Online' : 'Connecting API'}
              </span>
            </div>

            {/* Home CTA Button */}
            {isHome && (
              <div className="hidden lg:flex items-center">
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-900 text-white text-xs sm:text-sm font-bold hover:bg-forest-800 transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95"
                >
                  <span>Explore Platform</span>
                  <ArrowUpRight className="w-4 h-4 text-teal-400" />
                </Link>
              </div>
            )}

            {/* Authentication Navigation (Desktop) */}
            <div className="hidden sm:flex items-center gap-2 border-l border-sand-200/80 pl-2 sm:pl-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-forest-50/80 border border-sand-200/60 transition-all text-xs font-bold text-forest-950 group"
                    title="View Profile"
                  >
                    <div className="w-6 h-6 rounded-lg bg-forest-900 text-teal-300 flex items-center justify-center font-bold text-xs shadow-soft-sm group-hover:scale-105 transition-transform">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-forest-950 hover:bg-forest-50 rounded-xl transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-soft-sm transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:text-forest-950 hover:bg-sand-100 border border-sand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-all cursor-pointer"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-forest-900" /> : <Menu className="w-5 h-5 text-forest-900" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-lg border-b border-forest-100 px-4 pt-3 pb-6 space-y-3 shadow-soft-lg animate-fadeIn">
          {/* Health status row in drawer */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Backend Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                healthStatus?.online
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {healthStatus?.online ? 'Connected (Port 5000)' : 'Reconnecting...'}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 pt-1">
            <Link
              to={`/discover${cityQuery}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isDiscover
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-soft-sm'
                  : 'text-slate-800 hover:bg-sand-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Discover Places</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                Live API
              </span>
            </Link>

            <Link
              to={`/route${cityQuery}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isRoute
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-soft-sm'
                  : 'text-slate-800 hover:bg-sand-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-teal-600" />
                <span>Route Planner</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 font-bold">
                TSP + OSRM
              </span>
            </Link>

            <Link
              to="/benchmark"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isBenchmark
                  ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-soft-sm'
                  : 'text-slate-800 hover:bg-sand-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Algorithm Benchmark</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                5 Topologies
              </span>
            </Link>
          </div>

          {/* Landing anchor links if on home */}
          {isHome && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <a
                href="/#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sand-50"
              >
                Categories
              </a>
              <a
                href="/#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-sand-50"
              >
                System Architecture
              </a>
            </div>
          )}

          {/* Authentication Section (Mobile Drawer) */}
          <div className="pt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="p-3 rounded-2xl bg-forest-50/60 border border-forest-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-forest-900 text-teal-300 flex items-center justify-center font-bold text-sm shadow-soft-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-forest-950">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 rounded-xl bg-white border border-forest-200 text-xs font-bold text-forest-900 hover:bg-forest-50 transition-colors shadow-soft-sm"
                >
                  Manage Profile
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-soft-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Drawer CTA */}
          <div className="pt-2">
            <Link
              to="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 rounded-xl bg-forest-900 text-white font-bold text-sm shadow-soft-sm hover:bg-forest-800 transition-colors"
            >
              Explore Verified Spots
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
