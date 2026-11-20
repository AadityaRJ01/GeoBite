import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  RefreshCw,
  Route,
  MapPin,
  Search,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { fetchNearbyPlaces, fetchPlacesInBounds, fetchHealth, discoverCity, searchLocation } from '../services/placesApi';
import DiscoverySubheader from '../components/discovery/DiscoverySubheader';
import PlaceList from '../components/discovery/PlaceList';
import InteractiveMap from '../components/discovery/InteractiveMap';
import { LoadingSkeleton, ErrorState } from '../components/discovery/StateViews';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Default discovery center: San Sebastián / Bengaluru coordinates
const DEFAULT_LAT = 43.3183;
const DEFAULT_LNG = -1.9812;
const DEFAULT_RADIUS = 5;
const PAGE_SIZE = 6;

const POPULAR_CITIES = [
  'San Sebastián',
  'Kyoto',
  'Copenhagen',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Tokyo',
  'London',
  'Paris',
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
    const initialCity = qCity || sCity || (initialLat === DEFAULT_LAT && initialLng === DEFAULT_LNG ? 'San Sebastián, Spain' : 'Bengaluru, India');

    return { initialLat, initialLng, initialRadius, initialCity };
  };

  const initialValues = getInitialCoords();

  // Spatial Search Origin State
  const [lat, setLat] = useState(initialValues.initialLat);
  const [lng, setLng] = useState(initialValues.initialLng);
  const [radius, setRadius] = useState(initialValues.initialRadius);
  const [cityName, setCityName] = useState(initialValues.initialCity);
  const [cityInput, setCityInput] = useState(initialValues.initialCity || 'San Sebastián, Spain');

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

  // View Mode: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState('split');

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

  // Synchronize state when query params or location state change
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

      if (requestId !== activeRequestIdRef.current) return;

      const loadedPlaces = result.places || [];

      // Auto-Discovery Fallback: If 0 places exist in database for this city, automatically discover from Overpass
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

      // Keyword City Smart-Redirect
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

  const handleClearNearby = useCallback(() => {
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setRadius(DEFAULT_RADIUS);
    setCityName('San Sebastián, Spain');
    setSelectedCategory('all');
    setMinRating('');
    setMaxPrice('');
    setSortBy('distance-asc');
    setSearchQuery('');
    setPage(1);
  }, []);

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

  const handleSearchQueryChange = useCallback((newQuery) => {
    setSearchQuery(newQuery);
    setPage(1);
  }, []);

  const handleRadiusChange = useCallback((newRadius) => {
    setRadius(newRadius);
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

  const filteredPlaces = places;

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
    if (viewMode === 'list') {
      setViewMode('split');
    }
  }, [viewMode]);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    Boolean(minRating) ||
    Boolean(maxPrice) ||
    sortBy !== 'distance-asc';

  return (
    <div className="min-h-screen flex flex-col bg-[#f3fbf6] text-[#151d1a] selection:bg-[#9eefe0] selection:text-[#00140f]">
      {/* Top Navigation */}
      <Navbar
        healthStatus={backendStatus}
        pageTag="Discovery"
        extraActions={
          <button
            type="button"
            onClick={fetchPlacesData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#00140f] bg-[#edf6f0] hover:bg-[#e2eae5] border border-[#dce5df] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh places from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#096a5f] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-[#f3fbf6] flex-1 flex flex-col">
        {/* Discovery Sub-header & Filtering Hub (Google Stitch Style) */}
        <DiscoverySubheader
          cityName={cityName}
          cityInput={cityInput}
          setCityInput={setCityInput}
          onCitySubmit={handleCityInputSubmit}
          onSelectCity={handleSelectCity}
          popularCities={POPULAR_CITIES}
          discoveringCity={discoveringCity}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          radius={radius}
          onRadiusChange={handleRadiusChange}
          minRating={minRating}
          onMinRatingChange={handleMinRatingChange}
          maxPrice={maxPrice}
          onMaxPriceChange={handleMaxPriceChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onResetFilters={handleClearNearby}
          isFiltered={isFiltered}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={pagination.total || places.length}
        />

        {/* Dynamic Overpass Discovery Notice Banner */}
        {discoveringCity && (
          <div className="w-full px-4 sm:px-6 lg:px-12 pt-4">
            <div className="max-w-[1440px] mx-auto p-3.5 rounded-2xl bg-[#9eefe0]/30 border border-[#9eefe0] text-[#096a5f] flex items-center gap-2.5 text-xs font-semibold animate-pulse shadow-xs font-sans">
              <RefreshCw className="w-4 h-4 text-[#096a5f] animate-spin shrink-0" />
              <span>
                Discovering authentic places in <strong>{cityName}</strong> via OpenStreetMap Overpass &amp; PostGIS...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="w-full px-4 sm:px-6 lg:px-12 py-8">
            <ErrorState message={error} onRetry={fetchPlacesData} />
          </div>
        )}

        {/* Split View Core Content Area (Left: 52%, Right: 48%) */}
        {!error && (
          <div className="w-full flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* LEFT PANEL: Curated Destination List (52% on split, 100% on list, hidden on map) */}
              {(viewMode === 'split' || viewMode === 'list') && (
                <div
                  className={`w-full ${
                    viewMode === 'split' ? 'lg:w-[52%]' : 'max-w-4xl mx-auto'
                  } flex flex-col gap-6`}
                >
                  {/* Editorial Curated Notice (Stitch Style) */}
                  <div className="bg-[#edf6f0] rounded-3xl p-5 border border-[#dce5df] flex items-start justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#096a5f] text-[24px] mt-0.5">
                        verified
                      </span>
                      <div>
                        <h4 className="font-serif text-lg font-bold text-[#00140f] mb-1">
                          Gastronomic Dispatch: {cityName ? cityName.split(',')[0] : 'Curated Region'}
                        </h4>
                        <p className="font-sans text-xs text-[#414846] leading-relaxed">
                          Curated by GeoBite Editorial and verified with PostGIS spatial indexing. Seasonal produce, artisan cellars, and tranquil walking intervals.
                        </p>
                      </div>
                    </div>
                    <span className="font-sans text-[11px] font-semibold bg-[#e2eae5] text-[#00140f] px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                      EPSG:4326 Live
                    </span>
                  </div>

                  {/* Place List / Skeletons */}
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

                  {/* Curator's Rhythm Note Banner (Stitch Style) */}
                  <div className="p-6 bg-[#edf6f0] rounded-3xl border border-[#dce5df] flex items-center justify-between gap-4 shadow-xs mt-2">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#9eefe0] flex items-center justify-center text-[#136f63] shrink-0">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-serif text-base font-bold text-[#00140f] mb-0.5">
                          Curator's Travel Rhythm
                        </h5>
                        <p className="font-sans text-xs text-[#414846] leading-relaxed max-w-lg">
                          Schedule morning roasters before 11:00 AM and seaside viewpoints for golden hour. GeoBite automatically eliminates detour backtracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RIGHT PANEL: Interactive Cartographic Companion (48% on split, 100% on map, hidden on list) */}
              {(viewMode === 'split' || viewMode === 'map') && (
                <div
                  className={`w-full ${
                    viewMode === 'split' ? 'lg:w-[48%] lg:sticky lg:top-24' : 'w-full'
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
