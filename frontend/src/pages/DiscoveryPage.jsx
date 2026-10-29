import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  ListFilter, 
  Map as MapIcon, 
  Sparkles, 
  ArrowLeft,
  RefreshCw,
  Route
} from 'lucide-react';
import { fetchPlaces, fetchNearbyPlaces, fetchHealth } from '../services/placesApi';
import DiscoveryControls from '../components/discovery/DiscoveryControls';
import NearbySearchControl from '../components/discovery/NearbySearchControl';
import PlaceList from '../components/discovery/PlaceList';
import InteractiveMap from '../components/discovery/InteractiveMap';
import { LoadingSkeleton, ErrorState } from '../components/discovery/StateViews';
import Footer from '../components/Footer';


export default function DiscoveryPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Discovery Controls State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating-desc');

  // PostGIS Nearby Search State
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const [nearbyParams, setNearbyParams] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Interactive Selection State
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);

  // Mobile View Switcher (either list or map)
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState({ online: false, data: null });

  // Handle nearby search trigger
  const handleNearbySearch = useCallback(async ({ lat, lng, radius, category }) => {
    setNearbyLoading(true);
    setError(null);
    try {
      const data = await fetchNearbyPlaces({
        lat,
        lng,
        radius,
        category: category !== 'all' ? category : undefined,
      });
      setPlaces(data.places || []);
      setIsNearbyActive(true);
      setNearbyParams({ lat, lng, radius, category });
      setSortBy('distance-asc');
      if (data.places && data.places.length > 0) {
        setSelectedPlaceId(data.places[0].id);
      } else {
        setSelectedPlaceId(null);
      }
    } catch (err) {
      console.error('Nearby search failed:', err);
      setError(err.message || 'Failed to complete nearby search.');
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Handle clear nearby search to return to all-places discovery
  const handleClearNearby = useCallback(async () => {
    setIsNearbyActive(false);
    setNearbyParams(null);
    setSortBy('rating-desc');
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlaces();
      setPlaces(data.places || []);
      if (data.places && data.places.length > 0) {
        setSelectedPlaceId(data.places[0].id);
      }
    } catch (err) {
      console.error('Failed to reload places:', err);
      setError(err.message || 'Failed to reload places.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (isNearbyActive && nearbyParams) {
      handleNearbySearch(nearbyParams);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlaces();
      setPlaces(data.places || []);
      if (data.places && data.places.length > 0) {
        setSelectedPlaceId(data.places[0].id);
      }
    } catch (err) {
      console.error('Failed to load places from GeoBite backend:', err);
      setError(err.message || 'Failed to fetch places from the server.');
    } finally {
      setLoading(false);
    }
  }, [isNearbyActive, nearbyParams, handleNearbySearch]);

  // Check backend health and load places on mount
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const health = await fetchHealth();
        if (isMounted) setBackendStatus({ online: true, data: health });
      } catch {
        if (isMounted) setBackendStatus({ online: false, data: null });
      }

      try {
        const data = await fetchPlaces();
        if (isMounted) {
          setPlaces(data.places || []);
          if (data.places && data.places.length > 0) {
            setSelectedPlaceId(data.places[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch places from the server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Derive unique categories present in the data
  const availableCategories = useMemo(() => {
    const cats = new Set(places.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [places]);

  // Client-side filtering & sorting without triggering redundant API calls
  const filteredPlaces = useMemo(() => {
    let result = [...places];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter (matches name, address, category, or description)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.address && p.address.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'distance-asc') {
        return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
      }
      if (sortBy === 'distance-desc') {
        return (b.distanceMeters ?? 0) - (a.distanceMeters ?? 0);
      }
      if (sortBy === 'rating-desc') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'duration-asc') {
        return (a.estimatedVisitMinutes || 0) - (b.estimatedVisitMinutes || 0);
      }
      if (sortBy === 'duration-desc') {
        return (b.estimatedVisitMinutes || 0) - (a.estimatedVisitMinutes || 0);
      }
      return 0;
    });

    return result;
  }, [places, selectedCategory, searchQuery, sortBy]);

  // Selection handler from card or marker
  const handleSelectPlace = useCallback(
    (id) => {
      setSelectedPlaceId(id);
      const target = places.find((p) => p.id === id);
      if (target) {
        setFocusTarget(target);
      }
    },
    [places]
  );

  // Focus on map handler from card action
  const handleFocusMap = useCallback((place) => {
    setSelectedPlaceId(place.id);
    setFocusTarget(place);
    // On mobile, switch to map tab so the user sees the map
    setMobileTab('map');
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy(isNearbyActive ? 'distance-asc' : 'rating-desc');
  }, [isNearbyActive]);

  const defaultSort = isNearbyActive ? 'distance-asc' : 'rating-desc';
  const isFiltered =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    sortBy !== defaultSort;

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-forest-100 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Back to Home */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 p-2 rounded-xl text-forest-700 hover:text-forest-900 hover:bg-forest-50 transition-colors"
                title="Return to Home Landing Page"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-xs font-semibold hidden sm:inline">Home</span>
              </Link>

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 border border-teal-500/30">
                  <Compass className="w-4.5 h-4.5 text-teal-400 group-hover:rotate-45 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-forest-950 flex items-center">
                    Geo<span className="text-teal-600">Bite</span>
                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                      Discovery
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Header Right: Live Health Pill & Quick Refresh */}
            <div className="flex items-center gap-3">
              <Link
                to="/route"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                title="Open the multi-stop Route Planner"
              >
                <Route className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Plan Route</span>
              </Link>

              <button

                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-forest-800 bg-sand-100 hover:bg-sand-200 transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh places from backend"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  backendStatus.online
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
                title="PostgreSQL + Express Backend Health Status"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      backendStatus.online ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      backendStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="hidden sm:inline">
                  {backendStatus.online ? 'Backend Connected' : 'Connecting API...'}
                </span>
                <span className="sm:hidden font-mono text-[10px]">API</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title Strip */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Bengaluru Local Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
              Explore Verified Culinary & Scenic Spots
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Real-time records powered by PostgreSQL and PostGIS spatial indexing. Select any place to highlight its location on the interactive map.
            </p>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex lg:hidden bg-sand-200/70 p-1 rounded-2xl w-full sm:w-auto self-start">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mobileTab === 'list'
                  ? 'bg-white text-forest-950 shadow-soft-sm'
                  : 'text-forest-700 hover:text-forest-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Places ({filteredPlaces.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('map')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mobileTab === 'map'
                  ? 'bg-white text-forest-950 shadow-soft-sm'
                  : 'text-forest-700 hover:text-forest-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* PostGIS Nearby Search Control */}
        <NearbySearchControl
          onSearchNearby={handleNearbySearch}
          onClearNearby={handleClearNearby}
          isNearbyActive={isNearbyActive}
          activeParams={nearbyParams}
          activeResultCount={filteredPlaces.length}
          loading={nearbyLoading}
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Discovery Controls (Search, Category Pills, Sort) */}
        <div className="mb-6">
          <DiscoveryControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            availableCategories={availableCategories}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
            totalCount={places.length}
            filteredCount={filteredPlaces.length}
            isNearbyActive={isNearbyActive}
          />
        </div>

        {/* Error State */}
        {error && !loading && !nearbyLoading && (
          <ErrorState message={error} onRetry={handleRefresh} />
        )}

        {/* Two-Column Responsive Split: List & Interactive Map */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Place List / Skeletons */}
            <div
              className={`lg:col-span-5 lg:block ${
                mobileTab === 'list' ? 'block' : 'hidden'
              }`}
            >
              <div className="lg:max-h-[calc(100vh-210px)] lg:overflow-y-auto lg:pr-2">
                {loading || nearbyLoading ? (
                  <LoadingSkeleton count={5} />
                ) : (
                  <PlaceList
                    places={filteredPlaces}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={handleSelectPlace}
                    onFocusMap={handleFocusMap}
                    isFiltered={isFiltered}
                    onResetFilters={handleClearFilters}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Interactive Leaflet Map */}
            <div
              className={`lg:col-span-7 lg:sticky lg:top-24 lg:block ${
                mobileTab === 'map' ? 'block' : 'hidden'
              }`}
            >
              <InteractiveMap
                places={filteredPlaces}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlace}
                focusTarget={focusTarget}
                searchCenter={nearbyParams ? { lat: nearbyParams.lat, lng: nearbyParams.lng } : null}
                searchRadius={nearbyParams?.radius || 5}
                isNearbyActive={isNearbyActive}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
