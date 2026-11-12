import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Compass, 
  ListFilter, 
  Map as MapIcon, 
  Sparkles, 
  ArrowLeft,
  RefreshCw,
  Route,
  BarChart2,
  MapPin,
  Search
} from 'lucide-react';
import { fetchNearbyPlaces, fetchPlacesInBounds, fetchHealth, discoverCity, searchLocation } from '../services/placesApi';
import DiscoveryControls from '../components/discovery/DiscoveryControls';
import NearbySearchControl from '../components/discovery/NearbySearchControl';
import PlaceList from '../components/discovery/PlaceList';
import InteractiveMap from '../components/discovery/InteractiveMap';
import { LoadingSkeleton, ErrorState } from '../components/discovery/StateViews';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Default discovery center: Bengaluru coordinates
const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;
const DEFAULT_RADIUS = 15;
const PAGE_SIZE = 6;

const POPULAR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Tokyo',
  'London',
  'Paris',
  'New York',
  'San Francisco',
  'Zürich',
  'Jaipur',
];

export default function DiscoveryPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Helper to parse query parameters and location state safely
  const getInitialCoords = () => {
    const qLat = searchParams.get('lat');
    const qLng = searchParams.get('lng');
    const qRadius = searchParams.get('radius');
    const qCity = searchParams.get('city');

    const sLat = location.state?.lat;
    const sLng = location.state?.lng;
    const sRadius = location.state?.radius;
    const sCity = location.state?.city;

    const parsedLat = parseFloat(qLat ?? sLat);
    const parsedLng = parseFloat(qLng ?? sLng);
    const parsedRadius = parseFloat(qRadius ?? sRadius);

    const initialLat = !isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : DEFAULT_LAT;
    const initialLng = !isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : DEFAULT_LNG;
    const initialRadius = !isNaN(parsedRadius) && parsedRadius > 0 ? parsedRadius : DEFAULT_RADIUS;
    const initialCity = qCity || sCity || (initialLat === DEFAULT_LAT && initialLng === DEFAULT_LNG ? 'Bengaluru, India' : '');

    return { initialLat, initialLng, initialRadius, initialCity };
  };

  const initialValues = getInitialCoords();

  // Spatial Search Origin State
  const [lat, setLat] = useState(initialValues.initialLat);
  const [lng, setLng] = useState(initialValues.initialLng);
  const [radius, setRadius] = useState(initialValues.initialRadius);
  const [cityName, setCityName] = useState(initialValues.initialCity);
  const [cityInput, setCityInput] = useState(initialValues.initialCity || 'Bengaluru, India');

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
  const [discoveringCity, setDiscoveringCity] = useState(false);

  // Interactive Selection State
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);

  // Mobile View Switcher (either list or map)
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState({ online: false, data: null });

  // Race condition guards: ignore stale asynchronous responses
  const activeRequestIdRef = useRef(0);
  const activeDiscoveryIdRef = useRef(0);
  const skipNextFetchRef = useRef(false);

  // Method to discover authentic places for any selected city
  const triggerCityDiscovery = useCallback(async (targetCity) => {
    if (!targetCity || !targetCity.trim()) return;
    const discoveryId = ++activeDiscoveryIdRef.current;
    setDiscoveringCity(true);
    setLoading(true);
    setError(null);

    try {
      const res = await discoverCity({ city: targetCity.trim() });
      if (discoveryId !== activeDiscoveryIdRef.current) return;

      if (res.city) {
        if (typeof res.city.lat === 'number' && typeof res.city.lng === 'number') {
          skipNextFetchRef.current = true;
          setLat(res.city.lat);
          setLng(res.city.lng);
        }
        if (res.city.name) {
          setCityName(res.city.name);
          setCityInput(res.city.name);
        }
      }

      const returnedPlaces = res.places || [];
      setPlaces(returnedPlaces);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: returnedPlaces.length,
        totalPages: Math.ceil(returnedPlaces.length / PAGE_SIZE) || 1,
      });

      if (returnedPlaces.length > 0) {
        setSelectedPlaceId(returnedPlaces[0].id);
      } else {
        setSelectedPlaceId(null);
      }
    } catch (err) {
      if (discoveryId !== activeDiscoveryIdRef.current) return;
      console.warn('City discovery failed:', err.message);
      setError(`Failed to discover places for "${targetCity}". ${err.message}`);
    } finally {
      if (discoveryId === activeDiscoveryIdRef.current) {
        setDiscoveringCity(false);
        setLoading(false);
      }
    }
  }, []);

  const handleSelectCity = useCallback((c) => {
    if (!c || !c.trim()) return;
    setCityInput(c);
    setCityName(c);
    setPage(1);
    setSelectedCategory('all');
    setMinRating('');
    setMaxPrice('');
    setSearchQuery('');
    triggerCityDiscovery(c);
  }, [triggerCityDiscovery]);

  const handleCityInputSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (!cityInput || !cityInput.trim()) return;
    handleSelectCity(cityInput.trim());
  }, [cityInput, handleSelectCity]);

  // Synchronize state when query params or location state change (e.g., in-app navigation)
  useEffect(() => {
    const qLat = searchParams.get('lat');
    const qLng = searchParams.get('lng');
    const qRadius = searchParams.get('radius');
    const qCity = searchParams.get('city');

    const sLat = location.state?.lat;
    const sLng = location.state?.lng;
    const sRadius = location.state?.radius;
    const sCity = location.state?.city;

    const parsedLat = parseFloat(qLat ?? sLat);
    const parsedLng = parseFloat(qLng ?? sLng);
    const parsedRadius = parseFloat(qRadius ?? sRadius);

    const targetCity = qCity || sCity;

    if (
      !isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90 &&
      !isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180
    ) {
      setLat(parsedLat);
      setLng(parsedLng);
      if (!isNaN(parsedRadius) && parsedRadius > 0) {
        setRadius(parsedRadius);
      }
      const city = targetCity || '';
      setCityName(city);
      if (city) setCityInput(city);
      setPage(1);

      // If a non-Bengaluru city is selected, always trigger discovery to guarantee places & live map sync
      if (city && !city.toLowerCase().includes('bengaluru')) {
        triggerCityDiscovery(city);
      }
    } else if (targetCity) {
      setCityName(targetCity);
      setCityInput(targetCity);
      setPage(1);
      triggerCityDiscovery(targetCity);
    }
  }, [location.search, location.state, triggerCityDiscovery]);

  // Unified data fetcher querying PostGIS nearby API
  const fetchPlacesData = useCallback(async () => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (discoveringCity) return;

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
        city: cityName || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: apiSortBy,
        sortOrder: apiSortOrder,
        query: searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined,
      });

      // Discard if a newer request was dispatched while waiting
      if (requestId !== activeRequestIdRef.current) return;

      const loadedPlaces = result.places || [];

      // Auto-Discovery Fallback: If 0 places exist in database for this city, automatically discover from OpenStreetMap
      if (
        loadedPlaces.length === 0 &&
        cityName &&
        cityName.trim() !== '' &&
        (!searchQuery || !searchQuery.trim()) &&
        selectedCategory === 'all' &&
        !minRating &&
        !maxPrice
      ) {
        triggerCityDiscovery(cityName);
        return;
      }

      // Keyword City Smart-Redirect: If user typed a city name in the keyword search bar, switch to that city
      if (
        loadedPlaces.length === 0 &&
        searchQuery &&
        searchQuery.trim().length >= 3 &&
        selectedCategory === 'all'
      ) {
        try {
          const testLoc = await searchLocation(searchQuery.trim());
          if (
            testLoc &&
            testLoc.cityName &&
            (testLoc.cityName.toLowerCase() === searchQuery.trim().toLowerCase() ||
             testLoc.displayName.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          ) {
            setSearchQuery('');
            handleSelectCity(testLoc.cityName);
            return;
          }
        } catch {
          // Keep as regular search query
        }
      }

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
  }, [lat, lng, radius, cityName, selectedCategory, minRating, maxPrice, sortBy, page, searchQuery, discoveringCity, triggerCityDiscovery, handleSelectCity]);

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
  const handleNearbySearch = useCallback(({ lat: newLat, lng: newLng, radius: newRadius, category: newCategory, cityName: newCityName }) => {
    setLat(newLat);
    setLng(newLng);
    setRadius(newRadius);
    if (newCityName) {
      setCityName(newCityName);
    }
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
    setCityName('Bengaluru, India');
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

  // Search query handler — resets to page 1 on every new keyword
  const handleSearchQueryChange = useCallback((newQuery) => {
    setSearchQuery(newQuery);
    setPage(1);
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
          query: searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined,
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
    [selectedCategory, minRating, maxPrice, searchQuery]
  );

  // Backend handles keyword filtering; no client-side text filter needed.
  // filteredPlaces is an alias for places to preserve the existing prop interface.
  const filteredPlaces = places;

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
      {/* Unified Top Header / Navigation */}
      <Navbar
        healthStatus={backendStatus}
        pageTag="Discovery"
        extraActions={
          <button
            type="button"
            onClick={fetchPlacesData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-forest-800 bg-sand-100 hover:bg-sand-200 border border-sand-200 transition-colors disabled:opacity-50 cursor-pointer shadow-soft-sm"
            title="Refresh places from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

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
              Explore {cityName ? `${cityName}` : 'Verified Spots'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Live spatial distance calculations powered by PostgreSQL and PostGIS GiST indexing. Filter by radius, category, rating, budget, and sort deterministically.
            </p>
          </div>

          {/* Action: Plan Route in current city */}
          <div className="flex items-center gap-3">
            <Link
              to={`/route?city=${encodeURIComponent(cityName || 'Bengaluru')}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-forest-900 hover:bg-forest-800 text-teal-300 font-bold text-xs sm:text-sm shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
              title={`Open Route Planner for ${cityName || 'current city'}`}
            >
              <Route className="w-4 h-4 text-teal-400" />
              <span>Plan Route in {cityName || 'City'}</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Global City Switcher Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-forest-100 shadow-soft-sm mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-slate-500">Active City:</span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-forest-900 text-teal-300 shadow-sm">
                {cityName || 'Bengaluru, India'}
              </span>
            </div>
            {discoveringCity && (
              <span className="text-[11px] text-teal-700 font-semibold animate-pulse flex items-center gap-1.5 ml-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                Discovering OSM places...
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Quick city pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {POPULAR_CITIES.map((c) => {
                const isActive = (cityName || '').toLowerCase().includes(c.toLowerCase());
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectCity(c)}
                    disabled={discoveringCity}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-teal-500 text-forest-950 font-bold shadow-soft-sm'
                        : 'bg-sand-100 hover:bg-forest-100 text-slate-700 hover:text-forest-900'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Dynamic city search form */}
            <form onSubmit={handleCityInputSubmit} className="flex items-center gap-1.5">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  placeholder="Type any city..."
                  className="w-full pl-7 pr-2.5 py-1.5 bg-sand-50 rounded-xl text-xs text-forest-950 border border-sand-200 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={discoveringCity || !cityInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-teal-300 text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* OSM Discovery Notice Banner */}
        {discoveringCity && (
          <div className="mb-5 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2.5 text-xs font-semibold animate-pulse shadow-soft-sm">
            <RefreshCw className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
            <span>Discovering real local spots in <strong>{cityName}</strong> via OpenStreetMap Overpass API...</span>
          </div>
        )}

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

        {/* PostGIS Nearby Search Control */}
        <NearbySearchControl
          onSearchNearby={handleNearbySearch}
          onClearNearby={handleClearNearby}
          isNearbyActive={true}
          activeParams={{ lat, lng, radius, cityName, category: selectedCategory !== 'all' ? selectedCategory : undefined }}
          activeResultCount={pagination.total || places.length}
          loading={loading}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Discovery Controls (Search, Rating, Budget, Category Pills, Sort) */}
        <div className="mb-6">
          <DiscoveryControls
            searchQuery={searchQuery}
            onSearchChange={handleSearchQueryChange}
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
