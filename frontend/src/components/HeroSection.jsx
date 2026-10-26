import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Sparkles, SlidersHorizontal, ShieldCheck, Zap } from 'lucide-react';

const POPULAR_DESTINATIONS = [
  { name: 'Bengaluru, India', coords: '12.9716° N, 77.5946° E', count: '18 verified spots' },
  { name: 'Tokyo, Japan', coords: '35.6762° N, 139.6503° E', count: '1.2k+ spots' },
  { name: 'San Francisco, CA', coords: '37.7749° N, 122.4194° W', count: '850+ spots' },
  { name: 'Zürich, Switzerland', coords: '47.3769° N, 8.5417° E', count: '410+ spots' },
];

export default function HeroSection({ onSearch, activeCity, setActiveCity }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('5 km');
  const [isLocating, setIsLocating] = useState(false);

  const handleSelectCity = (city) => {
    setActiveCity(city.name);
    setSearchInput(city.name);
    if (onSearch) onSearch(city.name, selectedRadius);
    navigate('/discover');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim() || activeCity;
    setActiveCity(query);
    if (onSearch) onSearch(query, selectedRadius);
    navigate('/discover');
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      setActiveCity('Current Location (Detected: Silicon Valley)');
      setSearchInput('Current Location (Detected: Silicon Valley)');
    }, 600);
  };

  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Subtle geospatial background decorative elements */}
      <div className="absolute inset-0 bg-geo-dots pointer-events-none opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-teal-200/20 via-forest-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200/80 shadow-sm text-forest-900 text-xs sm:text-sm font-semibold mb-6 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Next-Gen Geospatial Discovery & Route Optimization</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-forest-950 tracking-tight leading-[1.12]">
            Discover Authentic Flavors & Panoramic Sights{' '}
            <span className="bg-gradient-to-r from-forest-800 via-teal-700 to-teal-500 bg-clip-text text-transparent">
              Without Detours
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            GeoBite indexes local culinary hubs, specialty coffee roasters, and scenic viewpoints along optimized travel corridors. Built for discerning travelers and urban explorers.
          </p>

          {/* Search Box Card */}
          <div className="mt-10 bg-white p-3 sm:p-4 rounded-3xl border border-forest-100 shadow-soft-lg transition-all duration-200 focus-within:border-teal-500/60 focus-within:ring-4 focus-within:ring-teal-500/10 text-left">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search input with location pin icon */}
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-forest-700">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Enter city, neighborhood, or landmark (e.g., Tokyo, San Francisco...)"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-sand-50/70 border border-slate-200/80 text-forest-950 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:bg-white focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCurrentLocation}
                    title="Detect Current Location"
                    className="absolute right-3 p-1.5 rounded-xl hover:bg-forest-100 text-forest-700 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Navigation className={`w-4 h-4 text-teal-600 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Near me</span>
                  </button>
                </div>

                {/* Radius Select */}
                <div className="flex items-center gap-2 px-3 py-2 bg-sand-50/70 rounded-2xl border border-slate-200/80">
                  <SlidersHorizontal className="w-4 h-4 text-forest-700" />
                  <span className="text-xs font-semibold text-slate-500">Radius:</span>
                  <select
                    value={selectedRadius}
                    onChange={(e) => setSelectedRadius(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-forest-900 focus:outline-none cursor-pointer"
                  >
                    <option value="1 km">1 km (Walk)</option>
                    <option value="3 km">3 km (Cycle)</option>
                    <option value="5 km">5 km (Local)</option>
                    <option value="15 km">15 km (Drive)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-forest-900 hover:bg-forest-800 active:scale-95 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Search className="w-4 h-4 text-teal-400" />
                  <span>Discover Now</span>
                </button>
              </div>

              {/* Quick Destination Tags */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-teal-600" /> Quick select:
                </span>
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    type="button"
                    key={dest.name}
                    onClick={() => handleSelectCity(dest)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      activeCity === dest.name
                        ? 'bg-forest-900 text-teal-300 shadow-sm'
                        : 'bg-sand-100 hover:bg-forest-100 text-slate-700 hover:text-forest-900'
                    }`}
                  >
                    {dest.name}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Social Proof & Metrics Badges */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-forest-100 shadow-soft-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0 text-forest-700">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-forest-950 font-sans tracking-tight">Verified Gems</p>
                <p className="text-xs text-slate-500 mt-0.5">Vetted food & viewpoint nodes</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-forest-100 shadow-soft-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0 text-forest-700">
                <Zap className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-forest-950 font-sans tracking-tight">&lt; 50ms Query</p>
                <p className="text-xs text-slate-500 mt-0.5">High-speed spatial radius lookups</p>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-forest-100 shadow-soft-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0 text-forest-700">
                <Navigation className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-forest-950 font-sans tracking-tight">TSP Sequencing</p>
                <p className="text-xs text-slate-500 mt-0.5">Optimized waypoint ordering</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
