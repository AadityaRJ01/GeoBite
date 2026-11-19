import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Activity,
  Menu,
  X,
  MapPin,
  Route,
  BarChart2,
  BookmarkCheck,
  User,
  LogIn,
  LogOut,
  UserPlus,
  Navigation
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
  const isSavedTrips = location.pathname.startsWith('/saved-trips');
  const isProfile = location.pathname.startsWith('/profile');
  const isHome = location.pathname === '/';

  const searchParams = new URLSearchParams(location.search);
  const cityParam = searchParams.get('city');
  const cityQuery = cityParam ? `?city=${encodeURIComponent(cityParam)}` : '';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#f3fbf6]/90 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] border-b border-[#e2eae5]'
          : 'bg-[#f3fbf6]/80 backdrop-blur-md border-b border-[#e2eae5]/60'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 group focus-visible:outline-none rounded-2xl"
              aria-label="GeoBite Homepage"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#00140f] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-all duration-300 border border-[#2a7e72]/30">
                <Compass className="w-5 h-5 text-[#9eefe0] group-hover:rotate-45 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-2xl tracking-tight text-[#00140f] flex items-center">
                  Geo<span className="text-[#096a5f] italic font-normal">Bite</span>
                </span>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-[#414846] -mt-1 hidden sm:block">
                  Kinfolk & Cartography
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Pill Navigation (Stitch Style) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#edf6f0] p-1.5 rounded-full border border-[#dce5df] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <Link
              to={`/discover${cityQuery}`}
              aria-current={isDiscover ? 'page' : undefined}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                isDiscover
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold shadow-sm'
                  : 'text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5]/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#096a5f]" />
              <span>Discover Destinations</span>
            </Link>

            <Link
              to={`/route${cityQuery}`}
              aria-current={isRoute ? 'page' : undefined}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                isRoute
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold shadow-sm'
                  : 'text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5]/60'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-[#096a5f]" />
              <span>Route Planner</span>
            </Link>

            <Link
              to="/benchmark"
              aria-current={isBenchmark ? 'page' : undefined}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                isBenchmark
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold shadow-sm'
                  : 'text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5]/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#096a5f]" />
              <span>Engine Benchmarks</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/saved-trips"
                aria-current={isSavedTrips ? 'page' : undefined}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  isSavedTrips
                    ? 'bg-[#9eefe0] text-[#096a5f] font-bold shadow-sm'
                    : 'text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5]/60'
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-[#096a5f]" />
                <span>My Saved Lists</span>
              </Link>
            )}
          </nav>

          {/* Right Area: Location Chip, Plan CTA & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {extraActions && (
              <div className="flex items-center gap-2">
                {extraActions}
              </div>
            )}

            {/* PostGIS Active Indicator Pill */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                healthStatus?.online
                  ? 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="PostGIS Spatial Engine & API Status"
            >
              <span className="relative flex h-2 w-2">
                {healthStatus?.online && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#096a5f] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthStatus?.online ? 'bg-[#096a5f]' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="font-sans text-[11px] font-semibold text-[#151d1a]">
                {healthStatus?.online ? 'PostGIS Spatial Engine' : 'Connecting API'}
              </span>
            </div>

            {/* Plan Itinerary CTA Button */}
            <Link
              to="/route"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#0e2a24] hover:bg-[#00140f] text-[#ffffff] font-sans font-semibold text-xs tracking-wide shadow-[0_4px_16px_rgba(14,42,36,0.14)] hover:shadow-lg transition-all active:scale-95"
            >
              Plan Itinerary
            </Link>

            {/* Auth Nav: Profile / Sign Out or Login / Register */}
            <div className="flex items-center gap-2 border-l border-[#dce5df] pl-2 sm:pl-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-[#edf6f0] border border-[#dce5df] transition-all text-xs font-bold text-[#151d1a] bg-white shadow-sm group"
                    title="View Profile Settings"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#00140f] text-[#9eefe0] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[100px] truncate">{user?.name || 'Profile'}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 rounded-full text-[#414846] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-[#414846] hover:text-[#00140f] hover:bg-[#edf6f0] rounded-full transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#00140f] hover:bg-[#0e2a24] text-[#ffffff] rounded-full shadow-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#9eefe0]" />
                    <span>Join</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-[#151d1a] hover:bg-[#edf6f0] border border-[#dce5df] transition-all cursor-pointer"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[#00140f]" /> : <Menu className="w-5 h-5 text-[#00140f]" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#f3fbf6]/98 backdrop-blur-xl border-b border-[#dce5df] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
          {/* Status banner */}
          <div className="flex items-center justify-between py-2 border-b border-[#e2eae5]">
            <span className="text-[11px] font-bold text-[#414846] uppercase tracking-wider font-sans">
              Geospatial Engine
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                healthStatus?.online
                  ? 'bg-[#edf6f0] text-[#096a5f]'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Activity className="w-3 h-3" />
              {healthStatus?.online ? 'Connected (Port 5000)' : 'Reconnecting...'}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 pt-1">
            <Link
              to={`/discover${cityQuery}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isDiscover
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold'
                  : 'text-[#151d1a] hover:bg-[#edf6f0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#096a5f]" />
                <span>Discover Destinations</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white text-[#096a5f] font-bold shadow-xs">
                Live
              </span>
            </Link>

            <Link
              to={`/route${cityQuery}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isRoute
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold'
                  : 'text-[#151d1a] hover:bg-[#edf6f0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Route className="w-4 h-4 text-[#096a5f]" />
                <span>Route Planner</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#00140f] text-white font-bold">
                TSP + OSRM
              </span>
            </Link>

            <Link
              to="/benchmark"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isBenchmark
                  ? 'bg-[#9eefe0] text-[#096a5f] font-bold'
                  : 'text-[#151d1a] hover:bg-[#edf6f0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4 text-[#096a5f]" />
                <span>Engine Benchmarks</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white text-[#096a5f] font-bold">
                5 Topologies
              </span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/saved-trips"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isSavedTrips
                    ? 'bg-[#9eefe0] text-[#096a5f] font-bold'
                    : 'text-[#151d1a] hover:bg-[#edf6f0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookmarkCheck className="w-4 h-4 text-[#096a5f]" />
                  <span>My Saved Lists</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#096a5f] font-bold">
                  Saved
                </span>
              </Link>
            )}
          </div>

          {/* Auth in Mobile Drawer */}
          <div className="pt-2 border-t border-[#e2eae5]">
            {isAuthenticated ? (
              <div className="p-3.5 rounded-2xl bg-white border border-[#dce5df] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00140f] text-[#9eefe0] flex items-center justify-center font-bold text-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#151d1a]">{user?.name}</p>
                      <p className="text-[11px] text-[#414846] truncate max-w-[180px]">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2 rounded-xl bg-[#edf6f0] border border-[#dce5df] text-xs font-bold text-[#00140f] hover:bg-[#e2eae5]"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/saved-trips"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2 rounded-xl bg-[#00140f] text-white text-xs font-bold shadow-sm"
                  >
                    My Trips
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#edf6f0] hover:bg-[#e2eae5] text-[#151d1a] text-xs font-bold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#00140f] hover:bg-[#0e2a24] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Join GeoBite
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
