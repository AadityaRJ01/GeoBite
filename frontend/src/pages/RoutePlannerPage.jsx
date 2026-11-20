import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Compass,
  Route,
  Trash2,
  CheckCircle2,
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
  RefreshCw,
  Flag,
  X,
  Car,
  Search,
  Share2,
  BookmarkCheck,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { fetchPlaces, optimizeRoute, benchmarkRoutes, fetchRoadRoute, fetchHealth, discoverCity } from '../services/placesApi';
import { saveRoute, fetchSavedRouteById } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { sharePlace } from '../services/shareUtils';
import RouteMap from '../components/route/RouteMap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ─── Constants ────────────────────────────────────────────────────────────────

const POPULAR_CITIES = [
  'San Sebastián',
  'Kyoto',
  'Copenhagen',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Tokyo',
  'Paris',
  'London',
  'Zürich',
  'Jaipur',
];

const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurant & Pintxos',
    tag: 'Terroir-Driven Dining',
    icon: Utensils,
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKAZdVUJWioVUlDHYvSxnahmqr_az3NT-TcvuCNrrkE3NDkYWfqhUxy0xOCav5jS4L97evecB-6fheoB0vS2QYd8eAFj7eC9lLUXEDTTGPy3SCd78cEnmnWLax8TFCmITScPOgOtuayp8k-T0P-2CjTXVMTBKE5du0Zz-NhWqEma-ii5gblQa_q30Zxkq0oK26zq14VPxtdiF5ynMci7tjab8LZoqIyhnelXhxiX8',
  },
  cafe: {
    label: 'Specialty Café & Bakery',
    tag: 'Morning Geographies',
    icon: Coffee,
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKkB1Kx68_Iughs6V-CgzRyOuQfewU2FgEsAa_tQwcwUajCTEUu2qMCSL8sxRpZH7oREEjps5yIgpRnx_bpR-YPQWNSQQP-1_nPxEmIalCpAohyCkwjUYwZ01lKPq-WLmjF2SrEOpvob1F2zic7iIPXyJ_WwheGqGNzLTPhVD07vBeNUWZL4ncL8VTj6fp9FjfXxTQ-CLOtbzLM65JTu9SI1hfl-wYHwW_LcOOnYY',
  },
  viewpoint: {
    label: 'Panoramic Mirador',
    tag: 'Topographic Vista',
    icon: Mountain,
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCovsQX6N4CzadPU7oGflxTllo78jhzFcKeBOd5Z0bfZz5Zqiqz4DWA0Lp44VAysRCOCOX7SgiTU6n1I9ALRYGnG1GW1d2aTrILlTnMLmw9R11l9OCviKgRCF30E-1WAGMSU4LJbsYa5f3d7H3JMMmBtkhcTZmYEkZbBhl5i4TG-IrP25whqczUJirwchZ1Mo0VhjQ1FZtKdOW1egk0XMGLe4zpmVRxWllta7CVyo8',
  },
  attraction: {
    label: 'Heritage & Cloister',
    tag: 'Cultural History',
    icon: Landmark,
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuACL9ZNmMNZlznUtgJNdm7iEWUNu4DtrSlbgZg7wY3st6ctnyVTDkXR115GVY1l359GQK65efIkDoRTAgn07lGd0jBb7n3xa3gmCE5FXaylLS0_314t3T_AXeLetmuJ3I412jRDhK0r9vsB0zG_8dOr3wChofz8klznul9f57JyQmHMBpxAbuL7OEpu5QTpT_e-BcdwFxSk2osO_IhfjWIezLtHv3ak7mMY7cHIM',
  },
};

const ALGO_META = {
  baseline: {
    key: 'baseline',
    label: 'Manual Entry',
    badgeLabel: 'Unordered',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    description: 'Original selection order without heuristic sorting. Often produces cross-town backtracking.',
  },
  nearestNeighbor: {
    key: 'nearestNeighbor',
    label: 'Nearest Neighbor',
    badgeLabel: 'Greedy Step',
    badgeClass: 'bg-[#edf6f0] text-[#00140f] border-[#dce5df]',
    description: 'Fast local greedy choice. Solves immediate proximity but can leave fragmented return legs.',
  },
  twoOpt: {
    key: 'twoOpt',
    label: '2-Opt Polynomial',
    badgeLabel: 'Global Solver',
    badgeClass: 'bg-[#9eefe0] text-[#096a5f] border-[#096a5f]/40 font-bold',
    description: 'Uncrosses geometric knots and untangles route crossings along the natural topography.',
  },
};

export default function RoutePlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const urlCity = searchParams.get('city') || location.state?.city || 'San Sebastián';
  const savedRouteId = searchParams.get('savedRouteId');
  const [currentCity, setCurrentCity] = useState(urlCity);
  const [cityInput, setCityInput] = useState(urlCity);
  const [cityCoords, setCityCoords] = useState(null);
  const [discoveringCity, setDiscoveringCity] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Available places in the current city
  const [allPlaces, setAllPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  // Place Catalog search & category filter in the injector bar
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);

  // Selected stop IDs and pinned starting place
  const [selectedIds, setSelectedIds] = useState([]);
  const [startPlaceId, setStartPlaceId] = useState(null);

  // Active itinerary planner day
  const [activeDay, setActiveDay] = useState(1);

  // Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [activeAlgo, setActiveAlgo] = useState('twoOpt');

  // Benchmark state
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Road Routing (OSRM) State
  const [roadRoute, setRoadRoute] = useState(null);
  const [roadLoading, setRoadLoading] = useState(false);
  const [roadError, setRoadError] = useState(null);

  // Save Trip state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [tripNameInput, setTripNameInput] = useState('');
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveTripSuccess, setSaveTripSuccess] = useState(false);
  const [saveTripError, setSaveTripError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Backend Health Status
  const [healthStatus, setHealthStatus] = useState({ online: false, data: null });

  // Race condition guard for city switching
  const activeCityRequestRef = useRef(0);

  // Fetch backend health
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

  // Switch to target city
  const handleSwitchCity = useCallback((targetCity) => {
    if (!targetCity || !targetCity.trim()) return;
    const cleanCity = targetCity.trim();
    if (currentCity.toLowerCase() !== cleanCity.toLowerCase()) {
      setCurrentCity(cleanCity);
      setCityInput(cleanCity);
      setSearchParams({ city: cleanCity });
      setSelectedIds([]);
      setStartPlaceId(null);
      setRouteResult(null);
      setRoadRoute(null);
    }
  }, [currentCity, setSearchParams]);

  const handleCityInputSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (cityInput && cityInput.trim()) {
      handleSwitchCity(cityInput.trim());
      setShowCityPicker(false);
    }
  }, [cityInput, handleSwitchCity]);

  // Load places for current city
  useEffect(() => {
    const requestId = ++activeCityRequestRef.current;
    let mounted = true;
    setLoadingPlaces(true);
    setPlacesError(null);

    const loadPlaces = async () => {
      try {
        let data = await fetchPlaces({ city: currentCity });
        if (requestId !== activeCityRequestRef.current) return;
        let cityPlaces = data.places || [];

        // If no places exist yet for this city, automatically discover from OSM Overpass/Nominatim
        if (cityPlaces.length === 0 && currentCity) {
          if (mounted) setDiscoveringCity(true);
          try {
            const discRes = await discoverCity({ city: currentCity });
            if (requestId !== activeCityRequestRef.current) return;
            if (discRes.city && typeof discRes.city.lat === 'number' && typeof discRes.city.lng === 'number') {
              setCityCoords([discRes.city.lat, discRes.city.lng]);
            }
            cityPlaces = discRes.places || [];
            if (cityPlaces.length === 0) {
              const refetch = await fetchPlaces({ city: currentCity });
              if (requestId !== activeCityRequestRef.current) return;
              cityPlaces = refetch.places || [];
            }
          } catch (discErr) {
            console.warn('Auto city discovery in route planner:', discErr);
          } finally {
            if (mounted && requestId === activeCityRequestRef.current) setDiscoveringCity(false);
          }
        }

        if (mounted && requestId === activeCityRequestRef.current) {
          setAllPlaces(cityPlaces);
          if (cityPlaces.length > 0) {
            const valid = cityPlaces.filter((p) => p.hasValidCoordinates);
            if (valid.length > 0) {
              setCityCoords([valid[0].latitude, valid[0].longitude]);
            }
            // If user hasn't selected any stops yet, auto-select first 4-5 spots for instant visual fidelity
            if (selectedIds.length === 0 && cityPlaces.length >= 2) {
              const initialBatch = cityPlaces.slice(0, Math.min(5, cityPlaces.length)).map((p) => p.id);
              setSelectedIds(initialBatch);
              setStartPlaceId(initialBatch[0]);
            }
          }
          setLoadingPlaces(false);
        }
      } catch (err) {
        if (mounted && requestId === activeCityRequestRef.current) {
          setPlacesError(err.message || 'Failed to load places.');
          setLoadingPlaces(false);
        }
      }
    };

    loadPlaces();
    return () => { mounted = false; };
  }, [currentCity]);

  // Restore saved route if savedRouteId query param is present
  useEffect(() => {
    if (!savedRouteId) return;

    let isMounted = true;
    const restoreSavedRoute = async () => {
      try {
        const routeData = await fetchSavedRouteById(savedRouteId);
        if (!isMounted || !routeData) return;

        if (routeData.cityName) {
          setCurrentCity(routeData.cityName);
          setCityInput(routeData.cityName);
        }

        const restoredStops = routeData.stops || [];
        if (restoredStops.length > 0) {
          const formattedPlaces = restoredStops.map((s, idx) => ({
            id: s.id || `stop-${idx}`,
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            category: s.category || 'General',
            address: s.address || '',
            hasValidCoordinates: true
          }));

          setAllPlaces(formattedPlaces);
          setSelectedIds(formattedPlaces.map((p) => p.id));
          if (restoredStops[0]?.id) {
            setStartPlaceId(restoredStops[0].id);
          }

          const algo = routeData.algorithm === 'nearestneighbor' ? 'nearestNeighbor' : (routeData.algorithm || 'twoOpt');
          setActiveAlgo(algo);
        }
      } catch (err) {
        console.warn('Could not restore saved route:', err);
      }
    };

    restoreSavedRoute();
    return () => { isMounted = false; };
  }, [savedRouteId]);

  // Derived: selected place objects in selection order
  const selectedPlaces = useMemo(() => {
    return selectedIds
      .map((id) => allPlaces.find((p) => p.id === id))
      .filter(Boolean);
  }, [selectedIds, allPlaces]);

  // Toggle stop in/out of itinerary
  const handleTogglePlace = useCallback((placeId) => {
    setSelectedIds((prev) => {
      if (prev.includes(placeId)) {
        const next = prev.filter((id) => id !== placeId);
        setStartPlaceId((s) => (s === placeId ? null : s));
        return next;
      }
      if (prev.length >= 10) return prev;
      return [...prev, placeId];
    });
    setRouteResult(null);
  }, []);

  const handleRemoveStop = useCallback((placeId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== placeId));
    setStartPlaceId((s) => (s === placeId ? null : s));
    setRouteResult(null);
  }, []);

  const handleSetStart = useCallback((placeId) => {
    setStartPlaceId((prev) => (prev === placeId ? null : placeId));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
    setStartPlaceId(null);
    setRouteResult(null);
    setRoadRoute(null);
  }, []);

  // Run Route Optimization (TSP)
  const handleOptimize = useCallback(async () => {
    if (selectedIds.length < 2) return;
    setOptimizing(true);
    setOptimizeError(null);
    try {
      const result = await optimizeRoute({
        placeIds: selectedIds,
        startPlaceId: startPlaceId || undefined,
      });
      setRouteResult(result);
      setActiveAlgo(result.recommended || 'twoOpt');
    } catch (err) {
      setOptimizeError(err.message || 'Route optimization failed.');
    } finally {
      setOptimizing(false);
    }
  }, [selectedIds, startPlaceId]);

  // Auto-optimize when places are initial loaded
  useEffect(() => {
    if (selectedIds.length >= 2 && !routeResult && !optimizing) {
      handleOptimize();
    }
  }, [selectedIds.length, routeResult, optimizing, handleOptimize]);

  // Active result for currently chosen algorithm
  const activeResult = routeResult?.results?.[activeAlgo] || routeResult?.bestRoute || null;
  const baselineResult = routeResult?.results?.baseline || null;

  // Retrieve OSRM real road routing
  useEffect(() => {
    if (!activeResult || !activeResult.orderedPlaces || activeResult.orderedPlaces.length < 2) {
      setRoadRoute(null);
      setRoadLoading(false);
      return;
    }

    let isMounted = true;
    setRoadLoading(true);
    setRoadError(null);

    const getRoadGeometry = async () => {
      try {
        const coordinates = activeResult.orderedPlaces.map((p) => ({
          lat: p.latitude,
          lng: p.longitude,
        }));
        const road = await fetchRoadRoute({ coordinates });
        if (isMounted) {
          setRoadRoute(road);
          setRoadLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setRoadError('OSRM unavailable; displaying straight-line topology.');
          setRoadLoading(false);
        }
      }
    };

    getRoadGeometry();
    return () => { isMounted = false; };
  }, [activeResult]);

  // Save Itinerary Modal Handlers
  const handleOpenSaveModal = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?from=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    setTripNameInput(`${currentCity} Curated Route (${selectedPlaces.length} stops)`);
    setSaveTripError(null);
    setSaveTripSuccess(false);
    setSaveModalOpen(true);
  };

  const handleConfirmSaveTrip = async (e) => {
    e.preventDefault();
    if (!tripNameInput.trim() || !activeResult) return;

    try {
      setSavingTrip(true);
      setSaveTripError(null);

      const orderedStops = (activeResult.orderedPlaces || selectedPlaces).map((p, index) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        category: p.category || 'General',
        address: p.address || '',
        visitOrder: index + 1
      }));

      await saveRoute({
        name: tripNameInput.trim(),
        cityName: currentCity,
        algorithm: activeAlgo,
        totalDistanceKm: activeResult.totalDistanceKm || 0,
        estimatedTravelMinutes: roadRoute?.durationMinutes || Math.round((activeResult.totalDistanceKm || 0) * 12),
        stops: orderedStops
      });

      setSaveTripSuccess(true);
      setTimeout(() => {
        setSaveModalOpen(false);
        setSaveTripSuccess(false);
      }, 1500);
    } catch (err) {
      setSaveTripError(err.message || 'Failed to save itinerary.');
    } finally {
      setSavingTrip(false);
    }
  };

  // Share Route Action
  const handleShareRoute = async () => {
    const routeUrl = window.location.href;
    const title = `${currentCity} Curated Route — GeoBite`;
    const text = `Explore our curated multi-stop route in ${currentCity} (${selectedPlaces.length} stops, ${activeResult?.totalDistanceKm?.toFixed(1) || ''} km).`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: routeUrl });
      } catch {
        // User cancelled share
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(routeUrl);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2500);
    }
  };

  // Run Performance Benchmarks
  const handleRunBenchmark = async () => {
    if (selectedIds.length < 2) return;
    setBenchmarking(true);
    setShowBenchmark(true);
    try {
      const data = await benchmarkRoutes({
        placeIds: selectedIds,
        startPlaceId: startPlaceId || undefined,
        runs: 5,
      });
      setBenchmarkResult(data);
    } catch (err) {
      console.warn('Benchmark error:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  // Filter places for the catalog injector drawer
  const filteredCatalogPlaces = useMemo(() => {
    let result = [...allPlaces];
    if (catalogCategory !== 'all') {
      result = result.filter((p) => p.category === catalogCategory);
    }
    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPlaces, catalogCategory, catalogSearch]);

  // Ordered list of places to display
  const displayOrderedPlaces = activeResult?.orderedPlaces || selectedPlaces;

  // Calculate metrics
  const totalWalkKm = activeResult?.totalDistanceKm 
    ? activeResult.totalDistanceKm.toFixed(1) 
    : '4.6';
  const baselineKm = baselineResult?.totalDistanceKm || (activeResult?.totalDistanceKm ? activeResult.totalDistanceKm * 1.4 : 7.8);
  const reductionPercent = baselineKm > 0 && activeResult?.totalDistanceKm 
    ? Math.max(0, Math.round(((baselineKm - activeResult.totalDistanceKm) / baselineKm) * 100))
    : 41;
  const transitMinutes = roadRoute?.durationMinutes 
    ? roadRoute.durationMinutes 
    : Math.round(parseFloat(totalWalkKm) * 12);

  return (
    <div className="min-h-screen flex flex-col bg-[#f3fbf6] text-[#151d1a] selection:bg-[#9eefe0] selection:text-[#00140f]">
      {/* Top Fixed Navigation */}
      <Navbar healthStatus={healthStatus} pageTag="Route Planner" />

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-[#f3fbf6] flex-1 flex flex-col">
        {/* Top Curatorial Banner & Route Title Bar (Stitch Design) */}
        <section className="w-full px-4 sm:px-6 lg:px-12 pt-6 pb-4 border-b border-[#e2eae5]/80">
          <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-1.5 text-[#096a5f] font-sans text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">route</span>
                <span>{currentCity} Gastronomic &amp; Scenic Topography</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#00140f] tracking-tight leading-tight">
                Plan Your Journey
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#414846] leading-relaxed">
                Build your perfect route, reduce pedestrian backtracking, and explore more regional tables in less time.
              </p>
            </div>

            {/* Destination Pill & Itinerary Day Switcher (Stitch Style) */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto bg-[#edf6f0] p-1.5 rounded-full border border-[#dce5df] shadow-xs">
              {/* City Location Chip */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCityPicker(!showCityPicker)}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#00140f] font-sans text-xs font-bold shadow-xs border border-[#dce5df] hover:bg-[#edf6f0] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#096a5f]">location_on</span>
                  <span>{currentCity}</span>
                  <span className="material-symbols-outlined text-[14px] text-[#727976]">expand_more</span>
                </button>

                {/* City Picker Popover */}
                {showCityPicker && (
                  <div className="absolute top-full right-0 lg:left-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-[#e2eae5] p-3 animate-fade-in font-sans">
                    <div className="text-[11px] font-bold text-[#727976] uppercase tracking-wider mb-2">
                      Switch Regional Terroir:
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {POPULAR_CITIES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            handleSwitchCity(c);
                            setShowCityPicker(false);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            currentCity.toLowerCase().includes(c.toLowerCase())
                              ? 'bg-[#00140f] text-white font-bold'
                              : 'bg-[#edf6f0] hover:bg-[#e2eae5] text-[#151d1a]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleCityInputSubmit} className="pt-2 border-t border-[#edf6f0] flex items-center gap-1.5">
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        placeholder="Type any global city..."
                        className="flex-1 px-3 py-1 bg-[#edf6f0] rounded-xl text-xs text-[#00140f] focus:outline-none border border-[#dce5df]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#00140f] text-white rounded-xl text-xs font-bold hover:bg-[#096a5f] transition-colors cursor-pointer"
                      >
                        Go
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Day Switcher Pills */}
              <button
                type="button"
                onClick={() => setActiveDay(1)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all cursor-pointer ${
                  activeDay === 1
                    ? 'bg-[#00140f] text-white shadow-xs'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-[#9eefe0]">calendar_today</span>
                <span>Day 1</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDay(2)}
                className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all cursor-pointer ${
                  activeDay === 2
                    ? 'bg-[#00140f] text-white shadow-xs'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
              >
                Day 2
              </button>

              <button
                type="button"
                onClick={() => setActiveDay(3)}
                className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all cursor-pointer ${
                  activeDay === 3
                    ? 'bg-[#00140f] text-white shadow-xs'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
              >
                Day 3
              </button>
            </div>
          </div>

          {/* Search & Quick Place Injector Bar (Stitch Style) */}
          <div className="max-w-[1440px] mx-auto mt-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input Bar */}
            <div className="lg:col-span-8 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727976] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  if (!showCatalogDrawer) setShowCatalogDrawer(true);
                }}
                onFocus={() => setShowCatalogDrawer(true)}
                placeholder="Search places, pincho bars, cider cellars or miradors to append to itinerary..."
                className="w-full pl-12 pr-28 py-3 bg-white rounded-full font-sans text-xs text-[#00140f] placeholder:text-[#727976] focus:outline-none focus:ring-2 focus:ring-[#9eefe0] shadow-xs border border-[#e2eae5]"
              />
              <button
                type="button"
                onClick={() => setShowCatalogDrawer(!showCatalogDrawer)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-[#00140f] text-white font-sans text-xs font-semibold hover:bg-[#0e2a24] transition-all cursor-pointer shadow-xs"
              >
                {showCatalogDrawer ? 'Done' : '+ Add Stop'}
              </button>
            </div>

            {/* Quick Filter Chips */}
            <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-2">
              <span className="font-sans text-[11px] text-[#727976] uppercase tracking-wider font-bold">
                Filter:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'restaurant', label: 'Pintxos' },
                  { id: 'viewpoint', label: 'Scenic' },
                  { id: 'cafe', label: 'Bakeries' },
                  { id: 'attraction', label: 'Heritage' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setCatalogCategory(chip.id);
                      setShowCatalogDrawer(true);
                    }}
                    className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-colors cursor-pointer border ${
                      catalogCategory === chip.id
                        ? 'bg-[#00140f] text-white border-[#00140f]'
                        : 'bg-[#edf6f0] text-[#00140f] border-[#dce5df] hover:bg-[#e2eae5]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Overpass Discovery Notice if actively fetching city places */}
        {discoveringCity && (
          <div className="w-full px-4 sm:px-6 lg:px-12 pt-4">
            <div className="max-w-[1440px] mx-auto p-3.5 rounded-2xl bg-[#9eefe0]/30 border border-[#9eefe0] text-[#096a5f] flex items-center gap-2.5 text-xs font-semibold animate-pulse shadow-xs font-sans">
              <RefreshCw className="w-4 h-4 text-[#096a5f] animate-spin shrink-0" />
              <span>
                Discovering authentic places in <strong>{currentCity}</strong> via OpenStreetMap &amp; PostGIS...
              </span>
            </div>
          </div>
        )}

        {/* Expandable Place Catalog Drawer (When user searches or clicks Add Stop) */}
        {showCatalogDrawer && (
          <div className="w-full px-4 sm:px-6 lg:px-12 pt-4">
            <div className="max-w-[1440px] mx-auto bg-white rounded-3xl p-5 border border-[#e2eae5] shadow-lg animate-fade-in font-sans">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#096a5f]">add_location_alt</span>
                  <h4 className="font-serif text-lg font-bold text-[#00140f]">
                    Select Places to Append ({filteredCatalogPlaces.length} available)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogDrawer(false)}
                  className="p-1 rounded-full text-[#727976] hover:text-[#00140f] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredCatalogPlaces.map((place) => {
                  const isSelected = selectedIds.includes(place.id);
                  const isStart = place.id === startPlaceId;
                  const cfg = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.restaurant;
                  const img = place.imageUrl || cfg.defaultImg;

                  return (
                    <div
                      key={place.id}
                      onClick={() => handleTogglePlace(place.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#edf6f0] border-[#096a5f] ring-1 ring-[#096a5f]'
                          : 'bg-white border-[#e2eae5] hover:border-[#9eefe0]'
                      }`}
                    >
                      <img
                        src={img}
                        alt={place.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase font-bold text-[#096a5f]">
                            {cfg.label}
                          </span>
                          {isStart && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#00140f] text-[#9eefe0] rounded-full">
                              Start ★
                            </span>
                          )}
                        </div>
                        <h5 className="font-serif text-sm font-bold text-[#00140f] truncate">
                          {place.name}
                        </h5>
                        <p className="text-[11px] text-[#727976] truncate">{place.address}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#00140f] text-white'
                            : 'border border-[#dce5df] text-[#727976]'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : '+'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Planner Split Stage (Left 5 Cols: Itinerary Sequence, Right 7 Cols: Map & Engine) */}
        <section className="w-full px-4 sm:px-6 lg:px-12 py-6">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANEL: Ordered Itinerary & Multi-Stop Waypoint Sequence (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Sequence Subheader Controls (Stitch Style) */}
              <div className="flex items-center justify-between bg-[#edf6f0] px-4 py-2.5 rounded-2xl border border-[#dce5df]">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#096a5f] animate-pulse" />
                  <span className="font-sans text-xs font-bold text-[#00140f]">
                    {selectedPlaces.length} Waypoints Added
                  </span>
                  <span className="font-sans text-xs text-[#727976]">
                    • {totalWalkKm} km Total Walk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={optimizing || selectedIds.length < 2}
                    className="p-1 rounded-full hover:bg-[#e2eae5] text-[#096a5f] transition-colors cursor-pointer disabled:opacity-50"
                    title="Re-optimize Sequence"
                  >
                    <RefreshCw className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[#727976] hover:text-red-700 font-sans text-[11px] font-bold tracking-wider uppercase px-2 py-1 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Waypoint Sequence Stream */}
              <div className="flex flex-col space-y-3">
                {displayOrderedPlaces.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-[#e2eae5] text-center shadow-xs">
                    <Route className="w-8 h-8 text-[#096a5f] mx-auto mb-2" />
                    <h4 className="font-serif text-base font-bold text-[#00140f] mb-1">
                      No Stops in Current Itinerary
                    </h4>
                    <p className="font-sans text-xs text-[#414846] mb-4">
                      Browse and select places from the search bar above to create an optimal multi-stop sequence.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCatalogDrawer(true)}
                      className="px-5 py-2 rounded-full bg-[#00140f] text-white text-xs font-bold hover:bg-[#096a5f] transition-colors cursor-pointer"
                    >
                      Browse Places
                    </button>
                  </div>
                ) : (
                  displayOrderedPlaces.map((place, idx) => {
                    const isStart = place.id === startPlaceId;
                    const cfg = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.restaurant;
                    const img = place.imageUrl || cfg.defaultImg;
                    const legFromHere = activeResult?.legs?.find((l) => l.fromPlaceId === place.id);

                    return (
                      <div key={place.id} className="flex flex-col">
                        {/* Waypoint Card (Stitch Style) */}
                        <div className="group relative flex flex-col bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-[#e2eae5]">
                          <div className="flex items-start gap-3">
                            {/* Waypoint Number Circle & Start Pin */}
                            <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                              <span
                                className={`flex items-center justify-center w-7 h-7 rounded-full font-sans text-xs font-bold shadow-xs ${
                                  isStart
                                    ? 'bg-[#00140f] text-[#9eefe0] ring-2 ring-[#096a5f]'
                                    : 'bg-[#0e2a24] text-white'
                                }`}
                              >
                                {isStart ? '★' : idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSetStart(place.id)}
                                title={isStart ? 'Unpin departure stop' : 'Set as departure point'}
                                className={`text-[10px] p-0.5 rounded cursor-pointer ${
                                  isStart ? 'text-[#096a5f]' : 'text-slate-300 hover:text-[#096a5f]'
                                }`}
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Thumbnail Photo */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#edf6f0]">
                              <img
                                src={img}
                                alt={place.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>

                            {/* Content Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <span className="font-sans text-[10px] text-[#096a5f] font-bold uppercase tracking-wider">
                                    {cfg.tag}
                                  </span>
                                  <h3 className="font-serif text-base font-bold text-[#00140f] leading-snug truncate">
                                    {place.name}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStop(place.id)}
                                  className="text-[#727976] hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                                  title="Remove stop"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <p className="font-sans text-xs text-[#414846] line-clamp-1 mt-0.5">
                                {place.description || place.address}
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#00140f] font-sans text-[11px] font-semibold border border-[#dce5df]">
                                  <Clock className="w-3 h-3 text-[#096a5f]" />
                                  <span>{0 + idx * 45}m window</span>
                                </span>
                                {place.estimatedVisitMinutes && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#edf6f0] text-[#414846] font-sans text-[11px]">
                                    {place.estimatedVisitMinutes} min stay
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Transit Connector Line & Interval (Between consecutive stops) */}
                          {legFromHere && (
                            <div className="mt-3 pt-2.5 border-t border-[#edf6f0] flex items-center justify-between font-sans text-xs text-[#414846]">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-[#096a5f]">
                                  directions_walk
                                </span>
                                <span>
                                  <strong>{legFromHere.distanceKm?.toFixed(2)} km</strong> walk (~{Math.round(legFromHere.distanceKm * 12)} min)
                                </span>
                                <span className="text-[#c1c8c5]">•</span>
                                <span className="text-[11px] text-[#727976] truncate max-w-[160px]">
                                  to {legFromHere.toPlaceName}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Intermediate Waypoint Insertion Slot (Stitch Style) */}
                <div
                  onClick={() => setShowCatalogDrawer(true)}
                  className="cursor-pointer border-2 border-dashed border-[#c1c8c5]/70 hover:border-[#096a5f] hover:bg-[#edf6f0]/70 transition-all rounded-2xl p-4 flex items-center justify-center gap-2 text-[#414846] group"
                >
                  <span className="material-symbols-outlined text-[#096a5f] text-[20px] group-hover:scale-110 transition-transform">
                    add_circle
                  </span>
                  <span className="font-sans text-xs font-semibold group-hover:text-[#00140f] transition-colors">
                    Click here to insert intermediate café or viewpoint stop
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Geospatial Cartographic Canvas & Algorithmic Engine (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5 lg:sticky lg:top-24">
              {/* Leaflet Route Map Canvas */}
              <RouteMap
                routeResult={routeResult}
                algorithm={activeAlgo}
                roadRoute={roadRoute}
                roadLoading={roadLoading}
                roadError={roadError}
                center={cityCoords}
                baselineResult={baselineResult}
              />

              {/* Section Title: Algorithmic Routing Engine */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-sans text-xs text-[#096a5f] font-bold uppercase tracking-wider">
                    Geospatial Optimization
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#00140f]">
                    Routing Algorithms Compared
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleRunBenchmark}
                  disabled={benchmarking || selectedIds.length < 2}
                  className="font-sans text-xs text-[#096a5f] hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{benchmarking ? 'Running Benchmarks...' : 'Run Benchmarks (5 runs)'}</span>
                </button>
              </div>

              {/* 3 Algorithmic Comparison Cards (Stitch Style) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Card 1: Manual Sequence (Baseline) */}
                <div
                  onClick={() => setActiveAlgo('baseline')}
                  className={`flex flex-col justify-between bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeAlgo === 'baseline'
                      ? 'border-[#00140f] shadow-md ring-2 ring-[#00140f]/20 bg-[#fbfdfb]'
                      : 'border-[#e2eae5] hover:border-[#c1c8c5]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#727976]">
                        Unordered
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-sans text-[10px] font-bold border border-red-200">
                        Inefficient
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#00140f]">Manual Entry</h4>
                    <p className="font-sans text-xs text-[#414846] mt-1 leading-relaxed">
                      Crosses city intersections needlessly in selection order.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#edf6f0] flex flex-col gap-1 font-sans text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Total Walk:</span>
                      <span className="font-bold text-red-700">
                        {baselineResult?.totalDistanceKm ? `${baselineResult.totalDistanceKm.toFixed(1)} km` : `${baselineKm.toFixed(1)} km`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Estimated:</span>
                      <span className="font-medium text-[#00140f]">
                        ~{Math.round(baselineKm * 12)} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Nearest Neighbor */}
                <div
                  onClick={() => setActiveAlgo('nearestNeighbor')}
                  className={`flex flex-col justify-between bg-white p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeAlgo === 'nearestNeighbor'
                      ? 'border-[#096a5f] shadow-md ring-2 ring-[#9eefe0] bg-[#fbfdfb]'
                      : 'border-[#e2eae5] hover:border-[#c1c8c5]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#096a5f]">
                        Greedy Step
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#edf6f0] text-[#00140f] font-sans text-[10px] font-bold border border-[#dce5df]">
                        30% Saved
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#00140f]">Nearest Neighbor</h4>
                    <p className="font-sans text-xs text-[#414846] mt-1 leading-relaxed">
                      Fast local greedy choice, but leaves unoptimized return paths.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#edf6f0] flex flex-col gap-1 font-sans text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Total Walk:</span>
                      <span className="font-bold text-[#00140f]">
                        {routeResult?.results?.nearestNeighbor?.totalDistanceKm
                          ? `${routeResult.results.nearestNeighbor.totalDistanceKm.toFixed(1)} km`
                          : '5.4 km'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Estimated:</span>
                      <span className="font-medium text-[#00140f]">
                        ~{Math.round((routeResult?.results?.nearestNeighbor?.totalDistanceKm || 5.4) * 12)} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: 2-Opt Polynomial (RECOMMENDED) */}
                <div
                  onClick={() => setActiveAlgo('twoOpt')}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeAlgo === 'twoOpt'
                      ? 'bg-[#edf6f0] border-[#096a5f] shadow-md ring-2 ring-[#9eefe0]'
                      : 'bg-white border-[#096a5f]/60 hover:bg-[#edf6f0]/50'
                  }`}
                >
                  <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-[#096a5f] text-white font-sans text-[10px] font-bold uppercase tracking-wider shadow-xs">
                    Recommended • -{reductionPercent}% Walk
                  </span>
                  <div>
                    <div className="flex items-center justify-between mb-2 pt-1">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#096a5f]">
                        Global Solver
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#9eefe0] text-[#096a5f] font-sans text-[10px] font-bold">
                        Active Flow
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#00140f]">2-Opt Polynomial</h4>
                    <p className="font-sans text-xs text-[#414846] mt-1 leading-relaxed">
                      Uncrosses geometric knots; flows along the natural city topography.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#dce5df] flex flex-col gap-1 font-sans text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Total Walk:</span>
                      <span className="font-bold text-[#096a5f]">
                        {routeResult?.results?.twoOpt?.totalDistanceKm
                          ? `${routeResult.results.twoOpt.totalDistanceKm.toFixed(1)} km`
                          : `${totalWalkKm} km`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#727976]">Estimated:</span>
                      <span className="font-bold text-[#00140f]">
                        {transitMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Benchmarks Comparison Panel if run */}
              {showBenchmark && benchmarkResult && (
                <div className="bg-white rounded-2xl p-4 border border-[#e2eae5] shadow-xs font-sans text-xs animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#00140f]">Live Benchmark Results (5 runs median)</span>
                    <button
                      type="button"
                      onClick={() => setShowBenchmark(false)}
                      className="text-[#727976] hover:text-[#00140f]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['baseline', 'nearestNeighbor', 'twoOpt'].map((k) => (
                      <div key={k} className="p-2 bg-[#edf6f0] rounded-xl">
                        <div className="font-bold text-[#00140f] uppercase text-[10px]">{k}</div>
                        <div>{benchmarkResult[k]?.distanceKm?.toFixed(2)} km</div>
                        <div className="text-[10px] text-[#727976]">{benchmarkResult[k]?.medianTimeMs?.toFixed(2)} ms</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Bottom Floating Action Dock & Metrics Summary (Stitch Design) */}
        <div className="w-full bg-white border-t border-[#e2eae5] py-4 px-4 sm:px-6 lg:px-12 sticky bottom-0 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] font-sans">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Metrics Quick Readout */}
            <div className="flex items-center flex-wrap gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#727976] uppercase tracking-wider font-bold">
                  Optimized Route
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-[#00140f]">
                  {totalWalkKm} km{' '}
                  <span className="font-sans text-xs text-[#096a5f] font-semibold">
                    (-{reductionPercent}%)
                  </span>
                </span>
              </div>

              <div className="h-8 w-px bg-[#e2eae5] hidden sm:block" />

              <div className="flex flex-col">
                <span className="text-[11px] text-[#727976] uppercase tracking-wider font-bold">
                  Transit Time
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-[#00140f]">
                  {transitMinutes} min{' '}
                  <span className="font-sans text-xs text-[#727976] font-normal">
                    walk / {Math.round(transitMinutes / 3)}m bike
                  </span>
                </span>
              </div>

              <div className="h-8 w-px bg-[#e2eae5] hidden sm:block" />

              <div className="flex flex-col">
                <span className="text-[11px] text-[#727976] uppercase tracking-wider font-bold">
                  Itinerary Stops
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-[#00140f]">
                  {selectedPlaces.length} curated spots
                </span>
              </div>
            </div>

            {/* Action Button Group */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Share Route */}
              <button
                type="button"
                onClick={handleShareRoute}
                className="px-4 py-2.5 rounded-full border border-[#096a5f] text-[#096a5f] hover:bg-[#9eefe0]/20 transition-colors font-sans text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {shareFeedback ? <Check className="w-4 h-4 text-[#096a5f]" /> : <Share2 className="w-4 h-4" />}
                <span>{shareFeedback ? 'Link Copied!' : 'Share Route'}</span>
              </button>

              {/* Save Itinerary */}
              <button
                type="button"
                onClick={handleOpenSaveModal}
                className="px-4 py-2.5 rounded-full bg-[#edf6f0] hover:bg-[#e2eae5] text-[#00140f] border border-[#dce5df] transition-colors font-sans text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-[#096a5f]" />
                <span>Save Itinerary</span>
              </button>

              {/* Apply Optimization CTA */}
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing || selectedIds.length < 2}
                className="px-6 py-2.5 rounded-full bg-[#00140f] hover:bg-[#0e2a24] text-white transition-all font-sans text-xs font-semibold flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[#9eefe0] text-[18px]">
                  auto_fix_high
                </span>
                <span>{optimizing ? 'Calculating Flow...' : 'Apply 2-Opt Optimization'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Route Modal Dialog */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#e2eae5] shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-[#096a5f]" />
                  <h3 className="font-serif text-xl font-bold text-[#00140f]">Save Itinerary</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="p-1 rounded-full text-[#727976] hover:text-[#00140f]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveTripSuccess ? (
                <div className="p-4 bg-[#9eefe0]/30 border border-[#9eefe0] rounded-2xl text-[#096a5f] text-center font-semibold text-xs flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Itinerary saved to your Saved Trips collection!</span>
                </div>
              ) : (
                <form onSubmit={handleConfirmSaveTrip} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#727976] uppercase tracking-wider mb-1.5">
                      Itinerary Name
                    </label>
                    <input
                      type="text"
                      required
                      value={tripNameInput}
                      onChange={(e) => setTripNameInput(e.target.value)}
                      placeholder="e.g. Basque Coast 1-Day Gastronomic Trail"
                      className="w-full px-4 py-2.5 bg-[#edf6f0] rounded-2xl text-xs text-[#00140f] border border-[#dce5df] focus:outline-none focus:ring-2 focus:ring-[#9eefe0]"
                    />
                  </div>

                  <div className="text-xs text-[#414846] bg-[#edf6f0] p-3 rounded-2xl border border-[#dce5df] space-y-1">
                    <div><strong>City:</strong> {currentCity}</div>
                    <div><strong>Stops:</strong> {selectedPlaces.length} waypoints</div>
                    <div><strong>Algorithm:</strong> 2-Opt ({totalWalkKm} km)</div>
                  </div>

                  {saveTripError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      {saveTripError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSaveModalOpen(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-[#727976] hover:text-[#00140f]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingTrip}
                      className="px-5 py-2 rounded-full bg-[#00140f] hover:bg-[#0e2a24] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {savingTrip ? 'Saving...' : 'Save Itinerary'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
