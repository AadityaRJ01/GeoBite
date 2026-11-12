import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
  Activity,
  X,
  Car,
} from 'lucide-react';
import { fetchPlaces, optimizeRoute, benchmarkRoutes, fetchRoadRoute, fetchHealth, discoverCity } from '../services/placesApi';
import RouteMap from '../components/route/RouteMap';
import Navbar from '../components/Navbar';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const urlCity = searchParams.get('city') || location.state?.city || 'Bengaluru';
  const [currentCity, setCurrentCity] = useState(urlCity);
  const [discoveringCity, setDiscoveringCity] = useState(false);

  // All available places
  const [allPlaces, setAllPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  // Sync city state when URL searchParams or location state change
  useEffect(() => {
    const qCity = searchParams.get('city') || location.state?.city;
    if (qCity && qCity !== currentCity) {
      setCurrentCity(qCity);
      setSelectedIds([]);
      setStartPlaceId(null);
      setRouteResult(null);
      setRoadRoute(null);
    }
  }, [searchParams, location.state]);

  // User itinerary selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [startPlaceId, setStartPlaceId] = useState(null);

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState(null);
  const [routeResult, setRouteResult] = useState(null);

  // Benchmark state
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [benchmarkError, setBenchmarkError] = useState(null);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Active algorithm tab
  const [activeAlgo, setActiveAlgo] = useState('twoOpt');

  // Sidebar tab (place picker vs. selected stops)
  const [sidebarTab, setSidebarTab] = useState('pick'); // 'pick' | 'stops'

  // Mobile layout tab (planner picker vs map results)
  const [mobilePlannerTab, setMobilePlannerTab] = useState('planner'); // 'planner' | 'results'

  // Backend Health Status
  const [healthStatus, setHealthStatus] = useState({ online: false, data: null });

  // Load backend health on mount
  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then((data) => {
        if (mounted) setHealthStatus({ online: true, data });
      })
      .catch(() => {
        if (mounted) setHealthStatus({ online: false, data: null });
      });
    return () => { mounted = false; };
  }, []);

  // Load places for the current city
  useEffect(() => {
    let mounted = true;
    setLoadingPlaces(true);
    setPlacesError(null);

    const loadPlaces = async () => {
      try {
        let data = await fetchPlaces({ city: currentCity });
        let cityPlaces = data.places || [];

        // If no places exist yet for this city, automatically discover from Overpass API
        if (cityPlaces.length === 0 && currentCity) {
          if (mounted) setDiscoveringCity(true);
          try {
            await discoverCity({ city: currentCity });
            data = await fetchPlaces({ city: currentCity });
            cityPlaces = data.places || [];
          } catch (discErr) {
            console.warn('Auto city discovery in route planner:', discErr);
          } finally {
            if (mounted) setDiscoveringCity(false);
          }
        }

        if (mounted) {
          setAllPlaces(cityPlaces);
          setLoadingPlaces(false);
        }
      } catch (err) {
        if (mounted) {
          setPlacesError(err.message || 'Failed to load places.');
          setLoadingPlaces(false);
        }
      }
    };

    loadPlaces();
    return () => { mounted = false; };
  }, [currentCity]);

  // Derived: city center coordinates for map view
  const cityCenter = useMemo(() => {
    if (allPlaces && allPlaces.length > 0) {
      const valid = allPlaces.filter((p) => p.hasValidCoordinates);
      if (valid.length > 0) {
        return [valid[0].latitude, valid[0].longitude];
      }
    }
    return null;
  }, [allPlaces]);

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
      setMobilePlannerTab('results');
    } catch (err) {
      setOptimizeError(err.message || 'Route optimization failed.');
    } finally {
      setOptimizing(false);
    }
  }, [selectedIds, startPlaceId]);

  // Run performance benchmark (5 iterations for median execution times)
  const handleBenchmark = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setBenchmarking(true);
    setBenchmarkError(null);
    setShowBenchmark(true);
    try {
      const data = await benchmarkRoutes({
        placeIds: selectedIds,
        startPlaceId: startPlaceId || undefined,
        runs: 5,
      });
      setBenchmarkResult(data);
    } catch (err) {
      setBenchmarkError(err.message || 'Benchmark execution failed.');
    } finally {
      setBenchmarking(false);
    }
  }, [selectedIds, startPlaceId]);

  // Computed totals
  const totalVisit = useMemo(() => totalVisitMinutes(selectedPlaces), [selectedPlaces]);
  const canOptimize = selectedIds.length >= 2 && selectedIds.length <= 10;

  // Active route result for current algo tab
  const activeResult = routeResult?.results?.[activeAlgo] || routeResult?.bestRoute || null;

  // Road Routing (OSRM) State
  const [roadRoute, setRoadRoute] = useState(null);
  const [roadLoading, setRoadLoading] = useState(false);
  const [roadError, setRoadError] = useState(null);

  // Automatically retrieve real road routing whenever active route or algorithm changes
  useEffect(() => {
    if (!activeResult || !activeResult.orderedPlaces || activeResult.orderedPlaces.length < 2) {
      setRoadRoute(null);
      setRoadLoading(false);
      setRoadError(null);
      return;
    }

    let isMounted = true;
    setRoadLoading(true);
    setRoadError(null);

    const stops = activeResult.orderedPlaces.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    fetchRoadRoute({ stops })
      .then((data) => {
        if (isMounted) {
          setRoadRoute(data);
          setRoadLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('OSRM road routing fallback:', err.message);
          setRoadError(err.message || 'Road routing temporarily unavailable.');
          setRoadRoute(null);
          setRoadLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeResult]);

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      {/* ── Top Header Navigation ──────────────────────────────────── */}
      <Navbar
        healthStatus={healthStatus}
        pageTag="Route Planner"
        extraActions={
          <>
            {selectedIds.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold shadow-soft-sm">
                <Route className="w-3.5 h-3.5 text-teal-600" />
                <span>{selectedIds.length} / 10 stops</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleOptimize}
              disabled={!canOptimize || optimizing}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-soft-sm ${
                canOptimize && !optimizing
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-500 hover:to-teal-400 hover:shadow-soft-md active:scale-95 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80'
              }`}
              title={!canOptimize ? 'Select 2-10 stops to optimize' : 'Compute optimized multi-stop route'}
            >
              {optimizing ? (
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              )}
              <span className="hidden sm:inline">{optimizing ? 'Optimizing…' : 'Optimize Route'}</span>
              <span className="sm:hidden">{optimizing ? '…' : 'Run'}</span>
            </button>
          </>
        }
      />

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold mb-2">
            <Route className="w-3.5 h-3.5 text-teal-600" />
            <span>Multi-Stop Route Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
            Plan Your {currentCity} Itinerary
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Select 2–10 places in {currentCity}, optionally pin a starting stop, then compare Baseline, Nearest Neighbor, and 2-opt optimized routes side-by-side with real road routing.
          </p>
        </div>

        {/* Global City Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-forest-100 shadow-soft-sm mb-6">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-bold text-slate-500">Route City:</span>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-forest-900 text-teal-300 shadow-sm">
              {currentCity}
            </span>
            {discoveringCity && (
              <span className="text-[11px] text-teal-700 font-semibold animate-pulse flex items-center gap-1.5 ml-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching OSM places...
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {['Bengaluru', 'Tokyo', 'San Francisco', 'Zürich', 'Jaipur'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  if (currentCity.toLowerCase() !== c.toLowerCase()) {
                    setCurrentCity(c);
                    setSearchParams({ city: c });
                    setSelectedIds([]);
                    setStartPlaceId(null);
                    setRouteResult(null);
                    setRoadRoute(null);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentCity.toLowerCase() === c.toLowerCase()
                    ? 'bg-teal-500 text-forest-950 font-bold shadow-soft-sm'
                    : 'bg-sand-100 hover:bg-forest-100 text-slate-700 hover:text-forest-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
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

        {/* Mobile View Toggle (Planner stops vs Map & Results) */}
        <div className="flex lg:hidden bg-sand-200/70 p-1 rounded-2xl mb-4 w-full">
          <button
            type="button"
            onClick={() => setMobilePlannerTab('planner')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              mobilePlannerTab === 'planner'
                ? 'bg-white text-forest-950 shadow-soft-sm'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            <Route className="w-3.5 h-3.5 text-teal-600" />
            <span>Stops & Picker ({selectedIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePlannerTab('results')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              mobilePlannerTab === 'results'
                ? 'bg-white text-forest-950 shadow-soft-sm'
                : 'text-forest-700 hover:text-forest-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-teal-600 rotate-45" />
            <span>Map & Route {routeResult ? '✓' : ''}</span>
          </button>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left Sidebar ───────────────────────────────────────── */}
          <div className={`lg:col-span-4 flex-col gap-4 ${mobilePlannerTab === 'planner' ? 'flex' : 'hidden lg:flex'}`}>

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

          {/* ── Right Panel (Map & Route Results) ───────────────────── */}
          <div className={`lg:col-span-8 flex-col gap-5 ${mobilePlannerTab === 'results' ? 'flex' : 'hidden lg:flex'}`}>

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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBenchmark}
                      disabled={benchmarking}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Run a 5-iteration benchmark to calculate median runtimes"
                    >
                      <Activity className={`w-3.5 h-3.5 ${benchmarking ? 'animate-pulse text-teal-300' : ''}`} />
                      <span>{benchmarking ? 'Benchmarking...' : 'Benchmark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOptimize}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-run
                    </button>
                  </div>
                </div>

                {/* Compact Benchmark Summary */}
                {showBenchmark && (
                  <div className="bg-white rounded-3xl border border-teal-200/80 shadow-soft-sm p-4 sm:p-5 relative animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <h3 className="font-bold text-sm text-forest-950">
                          Performance Benchmark Foundation (5 Runs Median)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBenchmark(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                        title="Dismiss benchmark view"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {benchmarking && (
                      <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        <span>Benchmarking Baseline, Nearest Neighbor, and 2-opt across 5 iterations...</span>
                      </div>
                    )}

                    {benchmarkError && !benchmarking && (
                      <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                        {benchmarkError}
                      </div>
                    )}

                    {benchmarkResult && !benchmarking && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Baseline */}
                          <div className="bg-sand-50/80 rounded-2xl p-3 border border-sand-200">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Baseline (O(N))
                            </div>
                            <div className="text-sm font-extrabold text-forest-950 font-mono mt-1">
                              {benchmarkResult.metrics?.baseline?.distanceKm?.toFixed(2)} km
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Median: <span className="font-semibold text-slate-700">{benchmarkResult.metrics?.baseline?.medianTimeMs?.toFixed(3)} ms</span>
                            </div>
                          </div>

                          {/* Nearest Neighbor */}
                          <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/80">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Nearest Neighbor (O(N²))
                            </div>
                            <div className="text-sm font-extrabold text-forest-950 font-mono mt-1">
                              {benchmarkResult.metrics?.nearestNeighbor?.distanceKm?.toFixed(2)} km
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Median: <span className="font-semibold text-slate-700">{benchmarkResult.metrics?.nearestNeighbor?.medianTimeMs?.toFixed(3)} ms</span>
                              <span className="ml-1 text-emerald-600 font-bold">(-{benchmarkResult.metrics?.nearestNeighbor?.improvementPercent}%)</span>
                            </div>
                          </div>

                          {/* 2-opt */}
                          <div className="bg-teal-50/60 rounded-2xl p-3 border border-teal-200/80">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                              2-opt Local Search (O(K·N²))
                            </div>
                            <div className="text-sm font-extrabold text-forest-950 font-mono mt-1">
                              {benchmarkResult.metrics?.twoOpt?.distanceKm?.toFixed(2)} km
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Median: <span className="font-semibold text-slate-700">{benchmarkResult.metrics?.twoOpt?.medianTimeMs?.toFixed(3)} ms</span>
                              <span className="ml-1 text-emerald-600 font-bold">(-{benchmarkResult.metrics?.twoOpt?.improvementPercent}%)</span>
                            </div>
                          </div>
                        </div>

                        {benchmarkResult.recommendation?.reason && (
                          <div className="text-xs text-forest-800 bg-teal-50/50 border border-teal-100 p-2.5 rounded-xl">
                            <span className="font-bold text-teal-900">Recommendation: </span>
                            {benchmarkResult.recommendation.reason}
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between border-t border-forest-100/60 text-xs">
                          <span className="text-slate-500">Want deeper scalability & multi-dataset analysis?</span>
                          <Link
                            to="/benchmark"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-100/70 hover:bg-teal-200/80 border border-teal-300 transition-colors shadow-soft-sm"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>View Full Benchmark Dashboard</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Navigation Estimate (OSRM Road Network) */}
                <div className="bg-white rounded-2xl border border-teal-200/80 shadow-soft-sm p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-teal-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                          Navigation Estimate (Road Network)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {roadRoute?.provider || 'OSRM'} • {roadRoute?.profile || 'driving'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Road-following driving route for <span className="font-semibold text-forest-900">{ALGO_META[activeAlgo]?.label}</span>. Distinct from straight-line optimization distance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {roadLoading && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        <span>Fetching road geometry...</span>
                      </div>
                    )}

                    {!roadLoading && roadRoute && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-forest-950 font-mono">
                            {roadRoute.distanceKm?.toFixed(2)} km
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Road Distance
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-teal-700 font-mono">
                            ~{roadRoute.durationMinutes} min
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Est. Driving
                          </div>
                        </div>
                      </div>
                    )}

                    {!roadLoading && roadError && (
                      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span>Road estimates unavailable (using straight-line preview)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Route Map */}
                <RouteMap
                  routeResult={routeResult}
                  algorithm={activeAlgo}
                  roadRoute={roadRoute}
                  roadLoading={roadLoading}
                  roadError={roadError}
                  center={cityCenter}
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
