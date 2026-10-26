import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Activity, Menu, X, ArrowUpRight, MapPin } from 'lucide-react';

export default function Navbar({ healthStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-forest-100 shadow-soft-sm'
          : 'bg-transparent border-b border-forest-100/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 border border-teal-500/30">
                <div className="relative">
                  <Compass className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform duration-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight text-forest-950 font-sans flex items-center">
                  Geo<span className="text-teal-600">Bite</span>
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                    v1.0
                  </span>
                </span>
                <span className="text-[11px] font-medium tracking-wide text-forest-600/70 -mt-1 hidden sm:block">
                  Geospatial Discovery & Routing
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/discover"
              className="text-sm font-semibold text-teal-700 hover:text-forest-900 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Discover Places</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-teal-100 text-teal-800 font-bold">
                Live API
              </span>
            </Link>
            <a
              href="/#categories"
              className="text-sm font-medium text-slate-600 hover:text-forest-900 transition-colors"
            >
              Categories
            </a>
            <a
              href="/#map-preview"
              className="text-sm font-medium text-slate-600 hover:text-forest-900 transition-colors flex items-center gap-1.5"
            >
              Route Engine
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-forest-100 text-forest-800 font-semibold">
                Preview
              </span>
            </a>
            <a
              href="/#architecture"
              className="text-sm font-medium text-slate-600 hover:text-forest-900 transition-colors"
            >
              Architecture
            </a>

            {/* Live API Health Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                healthStatus?.online
                  ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50/80 text-amber-800 border-amber-200'
              }`}
              title="Backend API Connection"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    healthStatus?.online ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthStatus?.online ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span>
                {healthStatus?.online ? 'API Online' : 'Connecting API...'}
              </span>
            </div>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-800 transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95"
            >
              <span>Explore Platform</span>
              <ArrowUpRight className="w-4 h-4 text-teal-400" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-forest-50 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-forest-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Backend Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                healthStatus?.online
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {healthStatus?.online ? 'Express Healthy (5000)' : 'Reconnecting'}
            </span>
          </div>
          <Link
            to="/discover"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-teal-800 bg-teal-50 hover:bg-teal-100"
          >
            Discover Places (Live API)
          </Link>
          <a
            href="/#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-forest-50"
          >
            Categories
          </a>
          <a
            href="/#map-preview"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-forest-50"
          >
            Route Engine Preview
          </a>
          <a
            href="/#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-forest-50"
          >
            System Architecture
          </a>
          <div className="pt-2">
            <Link
              to="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 rounded-xl bg-forest-900 text-white font-semibold text-sm"
            >
              Explore Platform
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
