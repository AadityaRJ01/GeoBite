import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { fetchNearbyPlaces, fetchPlacesInBounds, fetchHealth } from '../services/placesApi';
import DiscoveryControls from '../components/discovery/DiscoveryControls';
import NearbySearchControl from '../components/discovery/NearbySearchControl';
import PlaceList from '../components/discovery/PlaceList';
import InteractiveMap from '../components/discovery/InteractiveMap';
import { LoadingSkeleton, ErrorState } from '../components/discovery/StateViews';
import Footer from '../components/Footer';

// Default discovery center: Bengaluru coordinates
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
const DEFAULT_RADIUS = 5;
const PAGE_SIZE = 6;

export default function DiscoveryPage() {
  // Spatial Search Origin State
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  // Multi-criteria Filter State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('distance-asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  // Data & Status State
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive Selection State
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);

  // Mobile View Switcher (either list or map)
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState({ online: false, data: null });

  // Race condition guard: ignore stale asynchronous responses
  const activeRequestIdRef = useRef(0);

  // Unified data fetcher querying PostGIS nearby API
  const fetchPlacesData = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    // Map UI sort identifier to backend parameters
    let apiSortBy = 'distance';
    let apiSortOrder = 'asc';
    if (sortBy === 'rating-desc') {
      apiSortBy = 'rating';
      apiSortOrder = 'desc';
    } else if (sortBy === 'rating-asc') {
      apiSortBy = 'rating';
      apiSortOrder = 'asc';
    } else if (sortBy === 'distance-desc') {
      apiSortBy = 'distance';
      apiSortOrder = 'desc';
    }

    try {
      const result = await fetchNearbyPlaces({
        lat,
        lng,
        radius,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: apiSortBy,
        sortOrder: apiSortOrder,
      });

      // Discard if a newer request was dispatched while waiting
      if (requestId !== activeRequestIdRef.current) return;

      const loadedPlaces = result.places || [];
      setPlaces(loadedPlaces);

      if (result.pagination) {
        setPagination(result.pagination);
      } else {
        setPagination({
          page,
          limit: PAGE_SIZE,
          total: loadedPlaces.length,
          totalPages: Math.ceil(loadedPlaces.length / PAGE_SIZE) || 1,
        });
      }

      // Default select the top place if none selected or previous selection is gone
      if (loadedPlaces.length > 0) {
        setSelectedPlaceId((prev) => {
          const exists = loadedPlaces.some((p) => p.id === prev);
          return exists ? prev : loadedPlaces[0].id;
        });
      } else {
        setSelectedPlaceId(null);
      }
    } catch (err) {
      if (requestId !== activeRequestIdRef.current) return;
      console.error('Nearby search request failed:', err);
      setError(err.message || 'Failed to complete nearby search.');
      setPlaces([]);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [lat, lng, radius, selectedCategory, minRating, maxPrice, sortBy, page]);

  // Execute query whenever filters, location, or page changes
  useEffect(() => {
    fetchPlacesData();
  }, [fetchPlacesData]);

  // Check backend health on initial mount
  useEffect(() => {
    let isMounted = true;
    fetchHealth()
      .then((health) => {
        if (isMounted) setBackendStatus({ online: true, data: health });
      })
      .catch(() => {
        if (isMounted) setBackendStatus({ online: false, data: null });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Spatial search submit handler from NearbySearchControl
  const handleNearbySearch = useCallback(({ lat: newLat, lng: newLng, radius: newRadius, category: newCategory }) => {
    setLat(newLat);
    setLng(newLng);
    setRadius(newRadius);
    if (newCategory) {
      setSelectedCategory(newCategory);
    }
    setPage(1);
  }, []);

  // Reset to default Bengaluru coordinates and radius
  const handleClearNearby = useCallback(() => {
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setRadius(DEFAULT_RADIUS);
    setSelectedCategory('all');
    setMinRating('');
    setMaxPrice('');
    setSortBy('distance-asc');
    setSearchQuery('');
    setPage(1);
  }, []);

  // Filter change handlers (all reset page to 1)
  const handleCategoryChange = useCallback((newCategory) => {
    setSelectedCategory(newCategory);
    setPage(1);
  }, []);

  const handleMinRatingChange = useCallback((newRating) => {
    setMinRating(newRating);
    setPage(1);
  }, []);

  const handleMaxPriceChange = useCallback((newPrice) => {
    setMaxPrice(newPrice);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Search within visible map bounding box
  const handleSearchBounds = useCallback(
    async ({ minLat, minLng, maxLat, maxLng, center }) => {
      const requestId = ++activeRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPlacesInBounds({
          minLat,
          minLng,
          maxLat,
          maxLng,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          minRating: minRating ? parseFloat(minRating) : undefined,
          maxPrice: maxPrice || undefined,
          limit: 50,
        });

        if (requestId !== activeRequestIdRef.current) return;

        const loadedPlaces = result.places || [];
        setPlaces(loadedPlaces);
        setPagination({
          page: 1,
          limit: 50,
          total: loadedPlaces.length,
          totalPages: 1,
        });

        // Synchronize search center with the visible map center
        if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
          setLat(Number(center.lat.toFixed(4)));
          setLng(Number(center.lng.toFixed(4)));
        }

        if (loadedPlaces.length > 0) {
          setSelectedPlaceId(loadedPlaces[0].id);
        } else {
          setSelectedPlaceId(null);
        }
      } catch (err) {
        if (requestId !== activeRequestIdRef.current) return;
        console.error('Bounds search failed:', err);
        setError(err.message || 'Failed to search within map bounds.');
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [selectedCategory, minRating, maxPrice]
  );

  // Client-side text search filter (matches name, address, category, or description on current page)
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const query = searchQuery.trim().toLowerCase();
    return places.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.address && p.address.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [places, searchQuery]);

  // Selection handlers
  const handleSelectPlace = useCallback((id) => {
    setSelectedPlaceId(id);
    const target = places.find((p) => p.id === id);
    if (target) {
      setFocusTarget(target);
    }
  }, [places]);

  const handleFocusMap = useCallback((place) => {
    setSelectedPlaceId(place.id);
    setFocusTarget(place);
    setMobileTab('map');
  }, []);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    Boolean(minRating) ||
    Boolean(maxPrice) ||
    sortBy !== 'distance-asc' ||
    lat !== DEFAULT_LAT ||
    lng !== DEFAULT_LNG ||
    radius !== DEFAULT_RADIUS;

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

            {/* Header Right: Route Planner Shortcut, Refresh, Health Pill */}
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
                onClick={fetchPlacesData}
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
              <span>PostGIS Geospatial Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 tracking-tight">
              Explore Verified Culinary & Scenic Spots
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Live spatial distance calculations powered by PostgreSQL and PostGIS GiST indexing. Filter by radius, category, rating, budget, and sort deterministically.
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
          isNearbyActive={true}
          activeParams={{ lat, lng, radius, category: selectedCategory !== 'all' ? selectedCategory : undefined }}
          activeResultCount={pagination.total || places.length}
          loading={loading}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Discovery Controls (Search, Rating, Budget, Category Pills, Sort) */}
        <div className="mb-6">
          <DiscoveryControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            minRating={minRating}
            onMinRatingChange={handleMinRatingChange}
            maxPrice={maxPrice}
            onMaxPriceChange={handleMaxPriceChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onClearFilters={handleClearNearby}
            totalCount={pagination.total || places.length}
            filteredCount={filteredPlaces.length}
          />
        </div>

        {/* Error State */}
        {error && !loading && (
          <ErrorState message={error} onRetry={fetchPlacesData} />
        )}

        {/* Two-Column Responsive Split: List & Interactive Map */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Place List / Skeletons / Pagination */}
            <div
              className={`lg:col-span-5 lg:block ${
                mobileTab === 'list' ? 'block' : 'hidden'
              }`}
            >
              <div className="lg:max-h-[calc(100vh-210px)] lg:overflow-y-auto lg:pr-2">
                {loading ? (
                  <LoadingSkeleton count={PAGE_SIZE} />
                ) : (
                  <PlaceList
                    places={filteredPlaces}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={handleSelectPlace}
                    onFocusMap={handleFocusMap}
                    isFiltered={isFiltered}
                    onResetFilters={handleClearNearby}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    loading={loading}
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
                searchCenter={{ lat: Number(lat), lng: Number(lng) }}
                searchRadius={Number(radius)}
                isNearbyActive={true}
                onSearchBounds={handleSearchBounds}
                loading={loading}
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
