import React, { useState } from 'react';
import { 
  Navigation, 
  Crosshair, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Filter
} from 'lucide-react';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

// Clearly labeled demo coordinate presets for Bengaluru testing
const DEMO_PRESETS = [
  { name: 'MG Road (Central)', lat: 12.9716, lng: 77.5946 },
  { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { name: 'Lalbagh Botanical', lat: 12.9507, lng: 77.5848 },
];

export default function NearbySearchControl({
  onSearchNearby,
  onClearNearby,
  isNearbyActive,
  activeParams,
  activeResultCount = 0,
  loading = false,
  availableCategories = [],
  selectedCategory = 'all',
  onCategoryChange,
}) {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [radius, setRadius] = useState(5);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null); // { type: 'error' | 'success' | 'info', message: string }
  const [validationError, setValidationError] = useState('');

  // Use browser geolocation
  const handleUseMyLocation = () => {
    setValidationError('');
    setGeoNotice(null);

    if (!navigator.geolocation) {
      setGeoNotice({
        type: 'error',
        message: 'Browser Geolocation is not supported by your current browser. You can enter coordinates manually.',
      });
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLatInput(userLat.toFixed(6));
        setLngInput(userLng.toFixed(6));
        setGeoLoading(false);
        setGeoNotice({
          type: 'success',
          message: `Acquired your device location (±${Math.round(position.coords.accuracy || 0)}m). Ready to search!`,
        });
      },
      (error) => {
        setGeoLoading(false);
        let errorMsg = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied in your browser. You can still enter coordinates manually or use a demo preset.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is currently unavailable. Please enter coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to obtain your location timed out. Please enter coordinates manually.';
            break;
          default:
            errorMsg = error.message || 'An unknown error occurred while requesting location.';
        }
        setGeoNotice({
          type: 'error',
          message: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Set demo preset
  const handleSelectPreset = (preset) => {
    setLatInput(preset.lat.toFixed(6));
    setLngInput(preset.lng.toFixed(6));
    setValidationError('');
    setGeoNotice({
      type: 'info',
      message: `Selected demo centre: ${preset.name} (${preset.lat}, ${preset.lng}).`,
    });
  };

  // Handle submit search
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    const latNum = parseFloat(latInput);
    const lngNum = parseFloat(lngInput);

    if (latInput.trim() === '' || isNaN(latNum)) {
      setValidationError('Please provide a valid numeric Latitude (-90° to 90°).');
      return;
    }
    if (latNum < -90 || latNum > 90) {
      setValidationError('Latitude must be between -90 and 90 degrees.');
      return;
    }

    if (lngInput.trim() === '' || isNaN(lngNum)) {
      setValidationError('Please provide a valid numeric Longitude (-180° to 180°).');
      return;
    }
    if (lngNum < -180 || lngNum > 180) {
      setValidationError('Longitude must be between -180 and 180 degrees.');
      return;
    }

    onSearchNearby({
      lat: latNum,
      lng: lngNum,
      radius,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
  };

  // Handle reset/clear
  const handleClear = () => {
    setLatInput('');
    setLngInput('');
    setRadius(5);
    setValidationError('');
    setGeoNotice(null);
    onClearNearby();
  };

  return (
    <div className="bg-white rounded-2xl border border-forest-100 shadow-soft-sm overflow-hidden mb-6 transition-all">
      {/* Top Header Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-forest-900 via-forest-850 to-forest-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Crosshair className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base tracking-tight text-white">
                PostGIS Nearby Search
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                Spatial Radius
              </span>
            </div>
            <p className="text-xs text-forest-200 mt-0.5">
              Locate spots within a geographic radius using PostgreSQL ST_DWithin and ST_Distance.
            </p>
          </div>
        </div>

        {/* Quick action: Clear nearby search if active */}
        {isNearbyActive && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            title="Reset to all-places discovery mode"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Nearby Search</span>
          </button>
        )}
      </div>

      {/* Control Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Active Search Banner */}
        {isNearbyActive && activeParams && (
          <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Active Radius Search:</span> Within{' '}
                <span className="font-extrabold text-teal-950">{activeParams.radius} km</span> of center (
                <span className="font-mono">{Number(activeParams.lat).toFixed(4)}°</span>,{' '}
                <span className="font-mono">{Number(activeParams.lng).toFixed(4)}°</span>)
                {activeParams.category && (
                  <span>
                    {' '}• Category: <strong className="capitalize">{activeParams.category}</strong>
                  </span>
                )}
                {' '}• <span className="font-bold text-teal-950">{activeResultCount}</span> {activeResultCount === 1 ? 'place' : 'places'} found (ordered nearest first)
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Back to All Places
            </button>
          </div>
        )}

        {/* Geolocation / Validation Notification Notice */}
        {geoNotice && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              geoNotice.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : geoNotice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-sand-100 border border-sand-200 text-forest-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{geoNotice.message}</div>
            <button
              type="button"
              onClick={() => setGeoNotice(null)}
              className="text-slate-400 hover:text-slate-600 font-bold shrink-0 text-sm leading-none"
            >
              ×
            </button>
          </div>
        )}

        {validationError && (
          <div className="p-3 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Inputs & Radius Grid */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* Latitude Input */}
            <div className="md:col-span-3">
              <label
                htmlFor="nearby-lat-input"
                className="block text-xs font-bold text-forest-900 mb-1.5"
              >
                Center Latitude (°N/S)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nearby-lat-input"
                  value={latInput}
                  onChange={(e) => {
                    setLatInput(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="e.g. 12.9716"
                  className="w-full pl-3.5 pr-3 py-2 rounded-xl border border-sand-300 text-xs sm:text-sm font-mono text-forest-950 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all bg-sand-50/50"
                />
              </div>
            </div>

            {/* Longitude Input */}
            <div className="md:col-span-3">
              <label
                htmlFor="nearby-lng-input"
                className="block text-xs font-bold text-forest-900 mb-1.5"
              >
                Center Longitude (°E/W)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nearby-lng-input"
                  value={lngInput}
                  onChange={(e) => {
                    setLngInput(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="e.g. 77.5946"
                  className="w-full pl-3.5 pr-3 py-2 rounded-xl border border-sand-300 text-xs sm:text-sm font-mono text-forest-950 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all bg-sand-50/50"
                />
              </div>
            </div>

            {/* Geolocation Button */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Device Location
              </label>
              <button
                type="button"
                id="nearby-use-my-location-btn"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-teal-300 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Detect current coordinates using navigator.geolocation"
              >
                <Crosshair className={`w-3.5 h-3.5 text-teal-600 ${geoLoading ? 'animate-spin' : ''}`} />
                <span>{geoLoading ? 'Detecting...' : 'Use My Location'}</span>
              </button>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1.5 hidden md:block">
                Action
              </label>
              <button
                type="submit"
                id="nearby-search-submit-btn"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-forest-900 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-soft-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Navigation className={`w-4 h-4 text-teal-400 rotate-45 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Searching...' : 'Search Nearby'}</span>
              </button>
            </div>
          </div>

          {/* Radius Selector & Demo Presets Row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-forest-100/70">
            {/* Radius Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-forest-900 inline-flex items-center gap-1.5 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                Radius:
              </span>
              <div className="inline-flex bg-sand-100 p-1 rounded-xl border border-sand-200">
                {RADIUS_OPTIONS.map((r) => {
                  const isSelected = radius === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      id={`nearby-radius-${r}km-btn`}
                      onClick={() => setRadius(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-soft-sm'
                          : 'text-forest-800 hover:text-forest-950 hover:bg-sand-200/60'
                      }`}
                    >
                      {r} km
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Category Selector */}
            {availableCategories && availableCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-forest-900 inline-flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Category:
                </span>
                <select
                  id="nearby-category-select"
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
                  className="py-1 px-2.5 rounded-xl border border-sand-300 text-xs font-semibold text-forest-900 bg-sand-100 hover:bg-white focus:outline-none focus:border-teal-500 cursor-pointer capitalize"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Demo Presets Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-forest-100/50">
              <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Demo presets:
              </span>
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-sand-100 hover:bg-sand-200 text-forest-800 border border-sand-200/80 transition-colors cursor-pointer"
                  title={`Fill coordinates for ${preset.name} (${preset.lat}, ${preset.lng})`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
        </form>
      </div>
    </div>
  );
}
