import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Route,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Navigation,
  MapPin,
  Coffee,
  Utensils,
  Mountain,
  Landmark,
  Zap,
  BarChart2,
  Info,
  RefreshCw,
  Flag,
} from 'lucide-react';
import { fetchPlaces, optimizeRoute } from '../services/placesApi';
import RouteMap from '../components/route/RouteMap';
import Footer from '../components/Footer';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  restaurant: { label: 'Restaurant', icon: Utensils, badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  cafe:       { label: 'Café',       icon: Coffee,   badge: 'bg-teal-50 text-teal-800 border-teal-200' },
  viewpoint:  { label: 'Viewpoint',  icon: Mountain, badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  attraction: { label: 'Attraction', icon: Landmark, badge: 'bg-purple-50 text-purple-800 border-purple-200' },
};

const ALGO_META = {
  baseline: {
    key: 'baseline',
    label: 'Baseline',
    sublabel: 'Original selection order',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    ring: 'ring-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    lineColor: '#94a3b8',
    complexity: 'O(N)',
  },
  nearestNeighbor: {
    key: 'nearestNeighbor',
    label: 'Nearest Neighbor',
    sublabel: 'Greedy heuristic',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    ring: 'ring-amber-300',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    lineColor: '#f59e0b',
    complexity: 'O(N²)',
  },
  twoOpt: {
    key: 'twoOpt',
    label: '2-opt (NN + Local Search)',
    sublabel: 'Best route guarantee',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-400',
    ring: 'ring-teal-400',
    badge: 'bg-teal-100 text-teal-800 border-teal-400',
    lineColor: '#0d9488',
    complexity: 'O(K·N²)',
  },
};

// ─── Helper: total visit time ──────────────────────────────────────────────────

function totalVisitMinutes(places) {
  return places.reduce((acc, p) => acc + (p.estimatedVisitMinutes || 0), 0);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryIcon({ category, className = 'w-3.5 h-3.5' }) {
  const cfg = CATEGORY_CONFIG[category];
  if (!cfg) return <Compass className={className} />;
  const Icon = cfg.icon;
  return <Icon className={className} />;
}

function PlaceSelector({ allPlaces, selectedIds, startPlaceId, onToggle, onSetStart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(allPlaces.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [allPlaces]);

  const filtered = useMemo(() => {
    let result = [...allPlaces];
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPlaces, categoryFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Filter row */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search places…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-forest-200 rounded-xl bg-white text-forest-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-forest-200 rounded-xl bg-white text-forest-900 focus:outline-none focus:ring-2 focus:ring-teal-400 transition cursor-pointer"
        >
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_CONFIG[c]?.label || c}
            </option>
          ))}
        </select>
      </div>

      {/* Place list */}
      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-0.5">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-6">No places match your search.</div>
        )}
        {filtered.map((place) => {
          const isSelected = selectedIds.includes(place.id);
          const isStart = place.id === startPlaceId;
          const cfg = CATEGORY_CONFIG[place.category];

          return (
            <div
              key={place.id}
              className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 select-none ${
                isSelected
                  ? 'bg-teal-50/60 border-teal-400 ring-2 ring-teal-400/20 shadow-soft-sm'
                  : 'bg-white border-forest-100 hover:border-teal-300 hover:shadow-soft-sm'
              }`}
              onClick={() => onToggle(place.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(place.id); } }}
            >
              {/* Checkbox */}
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                isSelected ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-300 group-hover:border-teal-400'
              }`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 10">
                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-forest-950 truncate">{place.name}</span>
                  {isStart && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 border border-teal-300 px-1.5 py-0.5 rounded-full">
                      <Flag className="w-2.5 h-2.5" />
                      Start
                    </span>
                  )}
                  {cfg && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                      <CategoryIcon category={place.category} className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{place.address}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {typeof place.averageRating === 'number' && place.averageRating > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {place.averageRating.toFixed(1)}
                    </span>
                  )}
                  {place.estimatedVisitMinutes && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {place.estimatedVisitMinutes}m
                    </span>
                  )}
                </div>
              </div>

              {/* Set as Start button (only when selected) */}
              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetStart(isStart ? null : place.id); }}
                  title={isStart ? 'Unset start point' : 'Set as starting point'}
                  className={`shrink-0 mt-0.5 p-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isStart
                      ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelectedStopsList({ places, startPlaceId, onRemove, onSetStart }) {
  if (places.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-8 flex flex-col items-center gap-2">
        <Route className="w-8 h-8 text-slate-300" />
        <span>Select 2–10 places to build your itinerary</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {places.map((place, idx) => {
        const isStart = place.id === startPlaceId;
        return (
          <div
            key={place.id}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all ${
              isStart
                ? 'bg-teal-50 border-teal-400'
                : 'bg-white border-forest-100'
            }`}
          >
            {/* Stop number */}
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 ${
              isStart
                ? 'bg-forest-900 text-white border-forest-900'
                : 'bg-sand-100 text-forest-900 border-forest-200'
            }`}>
              {isStart ? '★' : idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-forest-950 truncate">{place.name}</div>
              <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1">
                <CategoryIcon category={place.category} className="w-3 h-3 text-slate-400 shrink-0" />
                {CATEGORY_CONFIG[place.category]?.label || place.category}
                {place.estimatedVisitMinutes && (
                  <span className="ml-2 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {place.estimatedVisitMinutes}m
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle start */}
              <button
                type="button"
                onClick={() => onSetStart(isStart ? null : place.id)}
                title={isStart ? 'Remove start flag' : 'Set as start'}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isStart
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'bg-white text-slate-400 border-slate-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                <Flag className="w-3 h-3" />
              </button>
              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(place.id)}
                title="Remove from itinerary"
                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlgoTab({ meta, isActive, result, isRecommended, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-start px-4 py-3 rounded-2xl border-2 text-left transition-all duration-150 ${
        isActive
          ? `${meta.bg} ${meta.border} ring-2 ${meta.ring}/30 shadow-soft-sm`
          : 'bg-white border-forest-100 hover:border-teal-200 hover:bg-teal-50/30'
      }`}
    >
      <div className="flex items-center gap-2 w-full">
        <span className={`text-sm font-extrabold ${isActive ? meta.color : 'text-forest-900'}`}>
          {meta.label}
        </span>
        {isRecommended && (
          <span className="text-[10px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded-full">
            Best
          </span>
        )}
        <span className="ml-auto text-[10px] font-mono text-slate-400">{meta.complexity}</span>
      </div>
      <span className="text-[11px] text-slate-500 mt-0.5">{meta.sublabel}</span>
      {result && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs font-bold text-forest-900 font-mono">
            {result.totalDistanceKm?.toFixed(2)} km
          </span>
          {result.improvementPercent > 0 && (
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
              -{result.improvementPercent}%
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            {result.executionTimeMs?.toFixed(2)}ms
          </span>
        </div>
      )}
    </button>
  );
}

function LegTable({ legs }) {
  const [expanded, setExpanded] = useState(false);

  if (!legs || legs.length === 0) return null;

  const displayLegs = expanded ? legs : legs.slice(0, 3);

  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded-2xl border border-forest-100">
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="bg-sand-100/80 text-forest-700 font-bold">
              <th className="px-4 py-2.5 text-left">Leg</th>
              <th className="px-4 py-2.5 text-left">From</th>
              <th className="px-4 py-2.5 text-left">To</th>
              <th className="px-4 py-2.5 text-right">Distance</th>
            </tr>
          </thead>
          <tbody>
            {displayLegs.map((leg) => (
              <tr key={leg.legIndex} className="border-t border-forest-100/60 hover:bg-teal-50/20 transition-colors">
                <td className="px-4 py-2.5 font-bold text-forest-900">{leg.legIndex}</td>
                <td className="px-4 py-2.5 text-forest-800 max-w-[140px] truncate">{leg.fromPlaceName}</td>
                <td className="px-4 py-2.5 text-forest-800 max-w-[140px] truncate">{leg.toPlaceName}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-teal-700">
                  {leg.distanceKm?.toFixed(2)} km
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legs.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-teal-700 font-semibold hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show all {legs.length} legs</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RoutePlannerPage() {
  // All available places
  const [allPlaces, setAllPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  // User itinerary selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [startPlaceId, setStartPlaceId] = useState(null);

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState(null);
  const [routeResult, setRouteResult] = useState(null);

  // Active algorithm tab
  const [activeAlgo, setActiveAlgo] = useState('twoOpt');

  // Sidebar tab (place picker vs. selected stops)
  const [sidebarTab, setSidebarTab] = useState('pick'); // 'pick' | 'stops'

  // Load all places on mount
  useEffect(() => {
    let mounted = true;
    setLoadingPlaces(true);
    fetchPlaces()
      .then((data) => {
        if (mounted) {
          setAllPlaces(data.places || []);
          setLoadingPlaces(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setPlacesError(err.message || 'Failed to load places.');
          setLoadingPlaces(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  // Derived: selected place objects in selection order
  const selectedPlaces = useMemo(() => {
    return selectedIds
      .map((id) => allPlaces.find((p) => p.id === id))
      .filter(Boolean);
  }, [selectedIds, allPlaces]);

  // Toggle a place in/out of the selection
  const handleToggle = useCallback((placeId) => {
    setSelectedIds((prev) => {
      if (prev.includes(placeId)) {
        const next = prev.filter((id) => id !== placeId);
        // Clear startPlaceId if it was the toggled one
        setStartPlaceId((s) => (s === placeId ? null : s));
        return next;
      }
      if (prev.length >= 10) return prev; // max 10
      return [...prev, placeId];
    });
    // Reset results when selection changes
    setRouteResult(null);
    setOptimizeError(null);
  }, []);

  const handleSetStart = useCallback((placeId) => {
    setStartPlaceId(placeId);
  }, []);

  const handleRemove = useCallback((placeId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== placeId));
    setStartPlaceId((s) => (s === placeId ? null : s));
    setRouteResult(null);
    setOptimizeError(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
    setStartPlaceId(null);
    setRouteResult(null);
    setOptimizeError(null);
  }, []);

  // Run route optimization
  const handleOptimize = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setOptimizing(true);
    setOptimizeError(null);
    setRouteResult(null);
    try {
      const result = await optimizeRoute({
        placeIds: selectedIds,
        startPlaceId: startPlaceId || undefined,
      });
      setRouteResult(result);
      setActiveAlgo(result.recommended || 'twoOpt');
      setSidebarTab('stops');
    } catch (err) {
      setOptimizeError(err.message || 'Route optimization failed.');
    } finally {
      setOptimizing(false);
    }
  }, [selectedIds, startPlaceId]);

  // Computed totals
  const totalVisit = useMemo(() => totalVisitMinutes(selectedPlaces), [selectedPlaces]);
  const canOptimize = selectedIds.length >= 2 && selectedIds.length <= 10;

  // Active route result for current algo tab
  const activeResult = routeResult?.results?.[activeAlgo] || routeResult?.bestRoute || null;

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-forest-100 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 p-2 rounded-xl text-forest-700 hover:text-forest-900 hover:bg-forest-50 transition-colors"
                title="Back to Discovery"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-xs font-semibold hidden sm:inline">Discover</span>
              </Link>

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 border border-teal-500/30">
                  <Compass className="w-4.5 h-4.5 text-teal-400 group-hover:rotate-45 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-forest-950">
                    Geo<span className="text-teal-600">Bite</span>
                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                      Route Planner
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                  <Route className="w-3.5 h-3.5" />
                  <span>{selectedIds.length} / 10 stops</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleOptimize}
                disabled={!canOptimize || optimizing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm ${
                  canOptimize && !optimizing
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 hover:shadow-md active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {optimizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{optimizing ? 'Optimizing…' : 'Optimize Route'}</span>
                <span className="sm:hidden">{optimizing ? '…' : 'Run'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold mb-2">
            <Route className="w-3.5 h-3.5 text-teal-600" />
            <span>Multi-Stop Route Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
            Plan Your Bengaluru Itinerary
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Select 2–10 places, optionally pin a starting stop, then compare Baseline, Nearest Neighbor, and 2-opt optimized routes side-by-side.
          </p>
        </div>

        {/* Error alerts */}
        {placesError && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {placesError}
          </div>
        )}
        {optimizeError && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            {optimizeError}
          </div>
        )}

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left Sidebar ───────────────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Sidebar tab switcher */}
            <div className="flex bg-sand-200/70 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSidebarTab('pick')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  sidebarTab === 'pick'
                    ? 'bg-white text-forest-950 shadow-soft-sm'
                    : 'text-forest-700 hover:text-forest-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Pick Places
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('stops')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  sidebarTab === 'stops'
                    ? 'bg-white text-forest-950 shadow-soft-sm'
                    : 'text-forest-700 hover:text-forest-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                My Stops ({selectedIds.length})
              </button>
            </div>

            {/* Sidebar content card */}
            <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5">
              {sidebarTab === 'pick' ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-base text-forest-950 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Available Places
                    </h2>
                    <span className="text-xs text-slate-500">
                      {allPlaces.length} spots
                    </span>
                  </div>

                  {loadingPlaces ? (
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-sand-100 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <PlaceSelector
                      allPlaces={allPlaces}
                      selectedIds={selectedIds}
                      startPlaceId={startPlaceId}
                      onToggle={handleToggle}
                      onSetStart={handleSetStart}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-base text-forest-950 flex items-center gap-2">
                      <Route className="w-4 h-4 text-teal-600" />
                      My Stops
                    </h2>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear all
                      </button>
                    )}
                  </div>

                  <SelectedStopsList
                    places={selectedPlaces}
                    startPlaceId={startPlaceId}
                    onRemove={handleRemove}
                    onSetStart={handleSetStart}
                  />

                  {/* Summary */}
                  {selectedPlaces.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-forest-100 flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Navigation className="w-3.5 h-3.5 text-teal-600 rotate-45" />
                        <span className="font-semibold">{selectedPlaces.length}</span>
                        <span>stops</span>
                      </div>
                      {totalVisit > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">~{totalVisit}</span>
                          <span>min visit time</span>
                        </div>
                      )}
                      {startPlaceId && (
                        <div className="flex items-center gap-1.5 text-teal-700">
                          <Flag className="w-3.5 h-3.5" />
                          <span>Start pinned</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optimize CTA */}
                  {selectedIds.length < 2 && (
                    <div className="mt-4 p-3 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-slate-600 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Add at least 2 stops to run optimization.
                    </div>
                  )}

                  {canOptimize && !routeResult && (
                    <button
                      type="button"
                      onClick={handleOptimize}
                      disabled={optimizing}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 transition-all active:scale-95 shadow-sm disabled:opacity-60"
                    >
                      {optimizing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {optimizing ? 'Optimizing…' : 'Run Route Optimization'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Hint card */}
            {!routeResult && !loadingPlaces && (
              <div className="bg-gradient-to-br from-forest-900 to-forest-800 rounded-3xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span className="font-bold text-sm">How It Works</span>
                </div>
                <ol className="space-y-2 text-xs text-forest-100">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center justify-center mt-0.5">1</span>
                    <span>Click places in the picker to add them to your itinerary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center justify-center mt-0.5">2</span>
                    <span>Optionally flag a starting stop with the <Flag className="w-3 h-3 inline text-teal-300" /> icon</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center justify-center mt-0.5">3</span>
                    <span>Hit <strong className="text-white">Optimize Route</strong> to compare 3 algorithms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-teal-500/30 text-teal-300 font-bold text-[11px] flex items-center justify-center mt-0.5">4</span>
                    <span>Explore Baseline, Nearest Neighbor, and 2-opt routes on the map</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* ── Right Panel ────────────────────────────────────────── */}
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* No result yet — placeholder map hint */}
            {!routeResult && !optimizing && (
              <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-8 flex flex-col items-center gap-4 text-center min-h-[320px] justify-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-forest-50 to-teal-50 border border-teal-200 flex items-center justify-center">
                  <Route className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-forest-950">No Route Yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Select {selectedIds.length < 2 ? `${2 - selectedIds.length} more` : 'your'} place{selectedIds.length < 1 ? 's' : ''} and click <strong>Optimize Route</strong> to see the comparison map.
                  </p>
                </div>
                {canOptimize && (
                  <button
                    type="button"
                    onClick={handleOptimize}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 transition-all active:scale-95 shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    Optimize Route ({selectedIds.length} stops)
                  </button>
                )}
              </div>
            )}

            {/* Optimizing spinner */}
            {optimizing && (
              <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-8 flex flex-col items-center gap-4 text-center min-h-[320px] justify-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-50 to-forest-50 border border-teal-200 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-forest-950">Running Algorithms…</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Computing Baseline, Nearest Neighbor, and 2-opt routes.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {routeResult && !optimizing && (
              <>
                {/* Summary banner */}
                <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-5 text-white flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-sm">Optimization Complete</span>
                    </div>
                    <div className="text-xs text-forest-200">
                      Best algorithm:{' '}
                      <span className="font-extrabold text-white">
                        {ALGO_META[routeResult.recommended]?.label || routeResult.recommended}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-white font-mono">
                        {routeResult.summary?.optimizedDistanceKm?.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-forest-300 font-semibold uppercase tracking-wider">km optimized</div>
                    </div>
                    {routeResult.summary?.distanceSavedKm > 0 && (
                      <div className="text-center">
                        <div className="text-xl font-extrabold text-teal-300 font-mono">
                          -{routeResult.summary.distanceSavedKm?.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-forest-300 font-semibold uppercase tracking-wider">km saved</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-white">
                        {routeResult.placeCount}
                      </div>
                      <div className="text-[10px] text-forest-300 font-semibold uppercase tracking-wider">stops</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOptimize}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-run
                  </button>
                </div>

                {/* Algorithm tabs */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {Object.values(ALGO_META).map((meta) => (
                    <AlgoTab
                      key={meta.key}
                      meta={meta}
                      isActive={activeAlgo === meta.key}
                      result={routeResult.results?.[meta.key]}
                      isRecommended={routeResult.recommended === meta.key}
                      onClick={() => setActiveAlgo(meta.key)}
                    />
                  ))}
                </div>

                {/* Route Map */}
                <RouteMap
                  routeResult={routeResult}
                  algorithm={activeAlgo}
                />

                {/* Leg breakdown */}
                {activeResult && (
                  <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-forest-950 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-teal-600 rotate-45" />
                        Route Legs — {ALGO_META[activeAlgo]?.label}
                      </h3>
                      <div className="text-xs font-mono text-teal-700 font-bold">
                        {activeResult.totalDistanceKm?.toFixed(2)} km
                      </div>
                    </div>
                    <LegTable legs={activeResult.legs} />
                  </div>
                )}

                {/* Disclaimer */}
                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{routeResult.disclaimer}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
