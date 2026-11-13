import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Navigation,
  Sparkles,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  TrendingUp,
  Compass,
  ArrowRight
} from 'lucide-react';
import { geocodeCity } from '../services/geocoding';

const POPULAR_DESTINATIONS = [
  { name: 'Mumbai, India', tag: 'Culinary & Coastal', count: '50+ curated' },
  { name: 'Delhi, India', tag: 'Heritage & Street Eats', count: '45+ curated' },
  { name: 'Bengaluru, India', tag: 'Cafés & Tech Hub', count: '40+ curated' },
  { name: 'Tokyo, Japan', tag: 'Ramen & Neon Sights', count: '80+ curated' },
  { name: 'San Francisco, CA', tag: 'Scenic & Coffee Roasters', count: '60+ curated' },
  { name: 'Zürich, Switzerland', tag: 'Alpine & Lakeside', count: '35+ curated' },
];

export default function HeroSection({ onSearch, activeCity, setActiveCity }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(activeCity || 'Bengaluru, India');
  const [selectedRadius, setSelectedRadius] = useState('15 km');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (activeCity) {
      setSearchInput(activeCity);
    }
  }, [activeCity]);

  const handleSelectCity = (city) => {
    if (setActiveCity) setActiveCity(city.name);
    setSearchInput(city.name);
    if (onSearch) onSearch(city.name, selectedRadius);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = searchInput.trim() || activeCity || 'Bengaluru, India';
    setIsSearching(true);

    try {
      const resolved = await geocodeCity(query);
      if (setActiveCity) setActiveCity(resolved.name);
      setSearchInput(resolved.name);
      if (onSearch) onSearch(resolved.name, selectedRadius);

      const radiusKm = parseInt(selectedRadius, 10) || 5;
      const searchParams = new URLSearchParams({
        lat: resolved.lat.toString(),
        lng: resolved.lng.toString(),
        city: resolved.name,
        radius: radiusKm.toString(),
      });

      navigate(`/discover?${searchParams.toString()}`, {
        state: {
          lat: resolved.lat,
          lng: resolved.lng,
          city: resolved.name,
          radius: radiusKm,
        },
      });
    } catch (err) {
      navigate(`/discover?city=${encodeURIComponent(query)}`, {
        state: { city: query },
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const lat = Number(position.coords.latitude.toFixed(4));
          const lng = Number(position.coords.longitude.toFixed(4));
          const coordString = `${lat}, ${lng}`;
          if (setActiveCity) setActiveCity(coordString);
          setSearchInput(coordString);
          if (onSearch) onSearch(coordString, selectedRadius);
        },
        () => {
          setIsLocating(false);
          if (setActiveCity) setActiveCity('Bengaluru, India');
          setSearchInput('Bengaluru, India');
        },
        { timeout: 8000 }
      );
    } else {
      if (setActiveCity) setActiveCity('Bengaluru, India');
      setSearchInput('Bengaluru, India');
    }
  };

  return (
    <section id="hero" className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute inset-0 bg-geo-dots pointer-events-none opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-teal-200/25 via-forest-100/35 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-forest-200/80 shadow-soft-sm text-forest-950 text-xs sm:text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Next-Gen Travel-Tech Platform</span>
            <span className="text-slate-300">|</span>
            <span className="text-forest-700 font-medium">Real-Time Routing Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-forest-950 tracking-tight leading-[1.12]">
            Curate Perfect City Days{' '}
            <span className="bg-gradient-to-r from-forest-900 via-teal-700 to-teal-500 bg-clip-text text-transparent">
              Without Backtracking
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Discover verified culinary gems, specialty coffee roasters, and scenic panoramic sights—sequenced into the optimal itinerary with zero wasted miles.
          </p>

          {/* Modern Floating Search Bar */}
          <div className="mt-8 bg-white p-3 sm:p-4 rounded-3xl border border-forest-100 shadow-soft-lg text-left transition-all duration-200 focus-within:ring-4 focus-within:ring-teal-500/10 focus-within:border-teal-500/50">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                
                {/* Search input with location pin icon */}
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-3.5 pointer-events-none text-forest-700">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search city, neighborhood, or landmark (e.g. Mumbai, Tokyo, Zürich...)"
                    className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-sand-50/70 border border-slate-200 text-forest-950 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none focus:bg-white focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCurrentLocation}
                    title="Detect Current Location"
                    className="absolute right-2 px-2.5 py-1.5 rounded-xl hover:bg-forest-100 text-forest-800 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-teal-600 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Near me</span>
                  </button>
                </div>

                {/* Radius Select */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-sand-50/70 rounded-2xl border border-slate-200 shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-forest-700" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Radius:</span>
                  <select
                    value={selectedRadius}
                    onChange={(e) => setSelectedRadius(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-bold text-forest-900 focus:outline-none cursor-pointer"
                  >
                    <option value="1 km">1 km (Walk)</option>
                    <option value="3 km">3 km (Cycle)</option>
                    <option value="5 km">5 km (Local)</option>
                    <option value="15 km">15 km (Drive)</option>
                  </select>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 hover:from-forest-900 hover:to-forest-700 active:scale-95 text-teal-300 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 disabled:opacity-70 cursor-pointer shrink-0"
                >
                  <Search className={`w-4 h-4 text-teal-400 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Locating...' : 'Explore City'}</span>
                </button>
              </div>

              {/* Quick Destination Pills */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-teal-600" /> Popular:
                </span>
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    type="button"
                    key={dest.name}
                    onClick={() => handleSelectCity(dest)}
                    className={`text-xs px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      activeCity === dest.name
                        ? 'bg-forest-900 text-teal-300 shadow-soft-sm'
                        : 'bg-sand-100 hover:bg-forest-100/80 text-slate-700 hover:text-forest-900'
                    }`}
                  >
                    {dest.name}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Social Proof & Value Proposition Highlights */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-forest-100 shadow-soft-sm hover:shadow-soft-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-200/60 flex items-center justify-center shrink-0 text-teal-700 mb-3">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-forest-950 font-sans tracking-tight">PostGIS Precision</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sub-50ms spatial indexing calculating real spatial bounding boxes and radius proximity.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-forest-100 shadow-soft-sm hover:shadow-soft-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-200/60 flex items-center justify-center shrink-0 text-teal-700 mb-3">
                <Compass className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-forest-950 font-sans tracking-tight">TSP Heuristics</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Solves traveling salesperson routes using 2-opt local search and nearest-neighbor permutations.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-forest-100 shadow-soft-sm hover:shadow-soft-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-forest-50 border border-forest-200/60 flex items-center justify-center shrink-0 text-teal-700 mb-3">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-forest-950 font-sans tracking-tight">OSRM Live Geometry</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connects waypoint itineraries to real driving road networks with duration and turn predictions.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
