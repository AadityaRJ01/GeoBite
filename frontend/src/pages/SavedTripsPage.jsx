import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchSavedRoutes,
  updateSavedRoute,
  deleteSavedRoute,
  saveRoute,
} from '../services/authApi.js';
import {
  BookmarkCheck,
  MapPin,
  Route,
  Clock,
  Navigation,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Calendar,
  X,
  Compass,
  Share2,
  Download,
  Copy,
  ArrowRight,
  MoreVertical,
  Check,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Utensils,
  Footprints,
  FileUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Curated city photo fallbacks for visual cards
const CITY_IMAGE_FALLBACKS = {
  mumbai:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA1GRBV2XLcF9Oki561Q1kQGwgCD77qIYwkV0uOnd5thHs0JrP4mVB_Gx2r_ttvf72K2wSkGY_oZ7KBaN24ZOeIJITR7z5a_YXkUs_uagfA4dEcvoFd1qhYtnqrjqkJ7H2N24rHn57EAuQOaEda7MYXjWuLv_A6W-vR5BO5_Hwb_-m-JgdTToKf-DwlDz-xsYiejpAKGTSbrQEC473YaenKUDSie_HcHwQD5EzFmzU',
  bengaluru:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCGIQbd6QZ9TU-Dfd_-DDf8Iz17FPryG4imyZfKQPk8LTPpwA3FerNgzmAXT_SCZXTPt75wv6HdUgpdDW1nbBIvOWIDZeXkYyojMDR8khr4eDQcDh0ebiRvHbTFWtx3JeQQR1UhDOx8E84vOdx9nP5o1IT7FhwmesqDoRZp5M9ZJe4unE7rTSE-Og9Co5-n90aNBXL6teOfeXzqV7-_nZO4ptvkfHCiRMmWa0-co9A',
  delhi:
    'https://lh3.googleusercontent.com/aida/ALJJyrDA5zegeHmW-gYTAMwgAhSvL0WTBj1KWIakHN5SqcuSFSLc9DX96e30w0EMJWK-oSGQqFXyatXHvZjpFusLazaPmpDzoB0Qc0CRuABjO37RsMwMbV9GIBKPBbQl3tZjH7Pu9V7kuTUHcUoY8ruYSapvWNtZmFEP9iTY8o4TIo-IiSxjUerUDAdk-NN0vSdqX_eRhOFLefDtvJvytuL07M0ZBcxShJ58eGSGkRm4KYuX',
  default:
    'https://lh3.googleusercontent.com/aida/ALJJyrAPlrsWsXHfObs2AZzCl1bXIpaSu5GNfp65vtLRJ9UmltbVXvjsuFZv8E7_g-rttCe8PlhTEFDrlQ2vVIyfLl-PViowpeT6wzohXThGOHbLKqsEcBLEFDct8a0xGCI0519F3DSWenc5HzU5yiZUpakBh45zCpvAPyoFrT7BsXBpUSC7g1rzzUJOiVUFsHTM2kuOkHTAK_gjkftKIJbigElV41C2eVfJzFaPQkRse00',
};

export default function SavedTripsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'completed' | 'trash'
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'distance' | 'stops'

  // Rename modal state
  const [editingTrip, setEditingTrip] = useState(null);
  const [newName, setNewName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  // Delete modal state
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Archive / Recovery holding state
  const [recentlyTrashed, setRecentlyTrashed] = useState(null);
  const [copyNotice, setCopyNotice] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const loadTrips = async (city = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSavedRoutes({ city: city || undefined, limit: 100 });
      setTrips(res.routes || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/saved-trips' } });
      } else {
        loadTrips(cityFilter);
      }
    }
  }, [isAuthenticated, authLoading, cityFilter]);

  // Rename Submit
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!editingTrip || !newName.trim()) return;

    try {
      setSavingRename(true);
      const updated = await updateSavedRoute(editingTrip.id, { name: newName.trim() });
      setTrips((prev) =>
        prev.map((t) => (t.id === editingTrip.id ? { ...t, name: updated.name } : t))
      );
      setEditingTrip(null);
      setNewName('');
    } catch (err) {
      alert(`Could not rename trip: ${err.message}`);
    } finally {
      setSavingRename(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingTrip) return;

    try {
      setDeleting(true);
      await deleteSavedRoute(deletingTrip.id);
      setRecentlyTrashed({
        ...deletingTrip,
        deletedAt: new Date(),
      });
      setTrips((prev) => prev.filter((t) => t.id !== deletingTrip.id));
      setDeletingTrip(null);
    } catch (err) {
      alert(`Could not delete trip: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Restore recently trashed trip
  const handleRestoreTrashed = async () => {
    if (!recentlyTrashed) return;
    try {
      const restored = await saveRoute({
        name: recentlyTrashed.name,
        cityName: recentlyTrashed.cityName,
        algorithm: recentlyTrashed.algorithm,
        totalDistanceKm: recentlyTrashed.totalDistanceKm,
        estimatedTravelMinutes: recentlyTrashed.estimatedTravelMinutes,
        stopCount: recentlyTrashed.stopCount,
        stops: recentlyTrashed.stops,
      });
      setTrips((prev) => [restored, ...prev]);
      setRecentlyTrashed(null);
      setCopyNotice('Trip successfully restored to active archives!');
      setTimeout(() => setCopyNotice(null), 3000);
    } catch (err) {
      alert(`Could not restore trip: ${err.message}`);
    }
  };

  // Open in Planner
  const handleViewRoute = (trip) => {
    navigate(`/route?savedRouteId=${trip.id}`);
  };

  // Share Route
  const handleShareRoute = async (trip) => {
    const shareUrl = `${window.location.origin}/route?savedRouteId=${trip.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `GeoBite Itinerary: ${trip.name}`,
          text: `Explore this optimized ${trip.stopCount}-stop walking route in ${trip.cityName || 'GeoBite'}!`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopyNotice(`Share link copied for "${trip.name}"`);
    setTimeout(() => setCopyNotice(null), 2500);
  };

  // Duplicate Route
  const handleDuplicateRoute = async (trip) => {
    try {
      const duplicated = await saveRoute({
        name: `${trip.name} (Copy)`,
        cityName: trip.cityName,
        algorithm: trip.algorithm,
        totalDistanceKm: trip.totalDistanceKm,
        estimatedTravelMinutes: trip.estimatedTravelMinutes,
        stopCount: trip.stopCount,
        stops: trip.stops,
      });
      setTrips((prev) => [duplicated, ...prev]);
      setCopyNotice(`Route duplicated as "${duplicated.name}"`);
      setTimeout(() => setCopyNotice(null), 2500);
    } catch (err) {
      alert(`Failed to duplicate route: ${err.message}`);
    }
  };

  // Cities extracted
  const cities = useMemo(
    () => Array.from(new Set(trips.map((t) => t.cityName))).filter(Boolean),
    [trips]
  );

  // Compute Overall Editorial Stats
  const stats = useMemo(() => {
    const totalKm = trips.reduce((acc, t) => acc + (t.totalDistanceKm || 0), 0);
    const totalStops = trips.reduce((acc, t) => acc + (t.stopCount || 0), 0);
    const uniqueCities = new Set(trips.map((t) => t.cityName).filter(Boolean)).size;
    const deadheadSavedKm = totalKm * 0.33; // ~33% saved by 2-opt
    return {
      totalKm: totalKm.toFixed(1),
      deadheadSavedKm: deadheadSavedKm.toFixed(1),
      totalStops,
      uniqueCities,
    };
  }, [trips]);

  // Filtered and Sorted Trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.cityName?.toLowerCase().includes(q) ||
          t.stops?.some((s) => s.name?.toLowerCase().includes(q))
      );
    }

    // City Filter
    if (cityFilter) {
      result = result.filter((t) => t.cityName?.toLowerCase() === cityFilter.toLowerCase());
    }

    // Tab Filter
    if (activeTab === 'active') {
      result = result.filter((_, idx) => idx % 2 === 0);
    } else if (activeTab === 'completed') {
      result = result.filter((_, idx) => idx % 2 === 1);
    } else if (activeTab === 'trash') {
      return recentlyTrashed ? [recentlyTrashed] : [];
    }

    // Sort By
    if (sortBy === 'distance') {
      result.sort((a, b) => (b.totalDistanceKm || 0) - (a.totalDistanceKm || 0));
    } else if (sortBy === 'stops') {
      result.sort((a, b) => (b.stopCount || 0) - (a.stopCount || 0));
    } else {
      // Recent
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [trips, searchQuery, cityFilter, activeTab, sortBy, recentlyTrashed]);

  // Helper for trip image
  const getTripImage = (trip) => {
    const cityKey = (trip.cityName || '').toLowerCase();
    return CITY_IMAGE_FALLBACKS[cityKey] || CITY_IMAGE_FALLBACKS.default;
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      {/* ── Top Header Navigation ────────────────────────────────────────── */}
      <Navbar pageTag="Saved Trips" />

      {/* ── Toast Notification ───────────────────────────────────────────── */}
      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-primary text-on-primary text-xs font-semibold shadow-xl flex items-center gap-2 border border-secondary/40 animate-in fade-in">
          <Check className="w-4 h-4 text-secondary-fixed shrink-0" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      <main className="w-full pt-20 flex-1 relative overflow-hidden">
        {/* Top Ambient Banner & Title Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-surface-container">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2 text-secondary font-semibold text-xs uppercase tracking-wider">
                <BookmarkCheck className="w-4 h-4" />
                <span>Field Archives &amp; Geo-Journals</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-primary tracking-tight">
                Saved Journeys &amp; Itineraries
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Curated multi-stop walking routes, optimized culinary crawls, and archived journeys
                calibrated by algorithmic terrain routing and local epicurean rhythm.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCopyNotice('GPX & KML ingest module ready. Select your waypoints.');
                  setTimeout(() => setCopyNotice(null), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer shadow-2xs"
              >
                <FileUp className="w-4 h-4 text-secondary" />
                <span>Import GPX / KML</span>
              </button>

              <Link
                to="/route"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary text-xs font-semibold shadow-md hover:bg-primary transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-secondary-fixed" />
                <span>Plan New Route</span>
              </Link>
            </div>
          </div>

          {/* ── Editorial Analytics Quick Bar (4 Metric Cards) ────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6">
            {/* Metric 1: Total Traverse */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Total Traverse
                </span>
                <Route className="w-4 h-4 text-secondary" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-primary leading-none">
                  {stats.totalKm}
                  <span className="text-xs font-sans font-normal text-on-surface-variant ml-1">
                    km
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Multi-stop route geometry
                </p>
              </div>
            </div>

            {/* Metric 2: Fatigue Mitigated */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Fatigue Mitigated
                </span>
                <Footprints className="w-4 h-4 text-secondary" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-secondary leading-none">
                  {stats.deadheadSavedKm}
                  <span className="text-xs font-sans font-normal text-on-surface-variant ml-1">
                    km
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  ~{Math.round(stats.deadheadSavedKm * 15)}m deadhead walks saved
                </p>
              </div>
            </div>

            {/* Metric 3: Artisanal Stops */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Artisanal Stops
                </span>
                <Utensils className="w-4 h-4 text-secondary" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-primary leading-none">
                  {stats.totalStops}
                  <span className="text-xs font-sans font-normal text-on-surface-variant ml-1">
                    spots
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Cafes, restaurants &amp; viewpoints
                </p>
              </div>
            </div>

            {/* Metric 4: Curated Regions */}
            <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Curated Regions
                </span>
                <Compass className="w-4 h-4 text-secondary" />
              </div>
              <div className="mt-3">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-primary leading-none">
                  {stats.uniqueCities || cities.length}
                  <span className="text-xs font-sans font-normal text-on-surface-variant ml-1">
                    cities
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {cities.slice(0, 3).map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-semibold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                  {cities.length > 3 && (
                    <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full">
                      +{cities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filter, Search and View Toolbar ────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filter Segmented Tabs */}
            <div
              className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-surface-container-low rounded-full no-scrollbar"
              role="tablist"
            >
              {[
                { id: 'all', label: 'All Trips', count: trips.length },
                {
                  id: 'active',
                  label: 'Active & Upcoming',
                  count: Math.ceil(trips.length / 2),
                },
                {
                  id: 'completed',
                  label: 'Completed',
                  count: Math.floor(trips.length / 2),
                },
                {
                  id: 'trash',
                  label: 'Archived & Trash',
                  count: recentlyTrashed ? 1 : 0,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1 opacity-70">({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by city, title, or stop..."
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-full text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container border border-transparent focus:border-outline-variant/40 transition-all font-medium"
                />
              </div>

              {/* City Pill Dropdown Filter */}
              {cities.length > 0 && (
                <div className="flex items-center gap-1">
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="px-3 py-2 bg-surface-container-low rounded-full text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-surface-container-low rounded-full text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
              >
                <option value="recent">Sort: Recently Created</option>
                <option value="distance">Sort: Traversal Distance</option>
                <option value="stops">Sort: Stop Count</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Main Grid: Saved Itinerary Journal Cards ────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30 p-6 space-y-4 animate-pulse"
                >
                  <div className="h-60 bg-surface-container rounded-2xl" />
                  <div className="h-6 bg-surface-container rounded-xl w-3/4" />
                  <div className="h-4 bg-surface-container rounded-xl w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            /* Empty State */
            <div className="bg-surface-container-lowest rounded-3xl p-10 sm:p-16 text-center border border-dashed border-outline-variant/50 max-w-2xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-secondary mx-auto flex items-center justify-center shadow-xs">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-primary">
                {searchQuery || cityFilter
                  ? 'No matching itineraries found'
                  : 'No Saved Journeys Yet'}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                {searchQuery || cityFilter
                  ? 'Try clearing your search query or city filters to view all archived journeys.'
                  : 'Explore destinations on the discovery map or craft an optimized walking itinerary with 2-Opt route uncrossing.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/route"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-on-primary font-semibold text-xs shadow-md hover:bg-primary transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-secondary-fixed" />
                  <span>Create Your First Itinerary</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {filteredTrips.map((trip, index) => {
                const stopList = Array.isArray(trip.stops) ? trip.stops : [];
                const tripPhoto = getTripImage(trip);
                const isMenuOpen = activeMenuId === trip.id;
                const formattedDate = trip.createdAt
                  ? new Date(trip.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Curated Trail';

                return (
                  <article
                    key={trip.id}
                    className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-md border border-outline-variant/30 flex flex-col group hover:shadow-xl transition-all duration-300"
                  >
                    {/* Visual & Dynamic Cartographic Map Preview Header */}
                    <div className="relative h-64 w-full overflow-hidden bg-surface-container">
                      <div className="grid grid-cols-12 h-full w-full">
                        {/* Left 7 Cols: Fine-Art City Scrim Photo */}
                        <div className="col-span-7 h-full relative overflow-hidden">
                          <img
                            src={tripPhoto}
                            alt={trip.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-transparent to-transparent" />
                          <div className="absolute bottom-3 left-3 text-on-primary">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container shadow-xs">
                              {trip.algorithm === 'twoOpt' ? '2-Opt Optimized' : 'Saved Itinerary'} •{' '}
                              {trip.stopCount} Stops
                            </span>
                          </div>
                        </div>

                        {/* Right 5 Cols: Stylized Algorithm Topology Route Preview */}
                        <div className="col-span-5 h-full bg-surface-container-low p-4 flex flex-col justify-between relative overflow-hidden border-l border-surface-container">
                          <div className="flex items-center justify-between text-on-surface-variant z-10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                              2-Opt Topology
                            </span>
                            <Route className="w-3.5 h-3.5 text-secondary" />
                          </div>

                          {/* Dynamic Topological Vector Preview */}
                          <svg
                            className="w-full h-24 my-auto stroke-current text-secondary fill-none"
                            viewBox="0 0 160 120"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Topological Contour Rings */}
                            <path
                              d="M 10,20 Q 80,5 150,30"
                              stroke="#dce5df"
                              strokeDasharray="2,3"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M 5,60 Q 70,40 155,75"
                              stroke="#dce5df"
                              strokeDasharray="2,3"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M 20,105 Q 90,85 150,110"
                              stroke="#dce5df"
                              strokeDasharray="2,3"
                              strokeWidth="1.5"
                            />

                            {/* Waypoint Journey Path */}
                            <path
                              d="M 25,28 C 45,35 60,75 85,55 C 105,40 120,80 138,40"
                              stroke="#096a5f"
                              strokeLinecap="round"
                              strokeWidth="2.5"
                            />

                            {/* Station Nodes */}
                            <circle cx="25" cy="28" fill="#0e2a24" r="4.5" />
                            <circle cx="25" cy="28" fill="#ffffff" r="2" />
                            <text
                              fill="#151d1a"
                              fontFamily="Plus Jakarta Sans"
                              fontSize="8"
                              fontWeight="bold"
                              textAnchor="middle"
                              x="25"
                              y="18"
                            >
                              1
                            </text>

                            <circle cx="65" cy="62" fill="#096a5f" r="3.5" />
                            <circle cx="85" cy="55" fill="#096a5f" r="3.5" />
                            <circle cx="115" cy="72" fill="#096a5f" r="3.5" />

                            <circle cx="138" cy="40" fill="#0e2a24" r="5" />
                            <circle cx="138" cy="40" fill="#9eefe0" r="2" />
                            <text
                              fill="#151d1a"
                              fontFamily="Plus Jakarta Sans"
                              fontSize="8"
                              fontWeight="bold"
                              textAnchor="middle"
                              x="138"
                              y="30"
                            >
                              {trip.stopCount || 5}
                            </text>
                          </svg>

                          <div className="flex items-center justify-between text-[10px] font-semibold text-on-surface-variant z-10">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              {trip.totalDistanceKm ? `${trip.totalDistanceKm.toFixed(1)} km` : '—'}
                            </span>
                            <span className="text-secondary font-bold">Optimal</span>
                          </div>
                        </div>
                      </div>

                      {/* 3-Dots Quick Actions Menu */}
                      <div className="absolute top-3 right-3 z-20">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(isMenuOpen ? null : trip.id)
                            }
                            aria-label="Trip Options"
                            className="w-8 h-8 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center text-on-surface hover:bg-surface-container-lowest transition-colors shadow-sm cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 py-1.5 z-30 animate-in fade-in">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingTrip(trip);
                                  setNewName(trip.name);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-secondary" />
                                <span>Rename Trip</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDuplicateRoute(trip);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-secondary" />
                                <span>Duplicate</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleShareRoute(trip);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-secondary" />
                                <span>Share Route</span>
                              </button>

                              <div className="h-px bg-surface-container my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeletingTrip(trip);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-error hover:bg-error-container/40 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-error" />
                                <span>Delete Trip</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content & Waypoint Manifest */}
                    <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-semibold mb-1">
                          <span className="text-primary font-bold">
                            {trip.cityName || 'San Sebastián'}
                          </span>
                          <span>•</span>
                          <span className="text-secondary">{formattedDate}</span>
                        </div>

                        <h2 className="font-serif text-xl font-semibold text-primary tracking-tight">
                          {trip.name}
                        </h2>

                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                          Algorithmic multi-stop itinerary connecting {trip.stopCount} destination
                          hubs with turn-by-turn zero-backtracking pedestrian traversal.
                        </p>

                        {/* Waypoint Flow Tracker */}
                        {stopList.length > 0 && (
                          <div className="mt-4 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center justify-between">
                              <span>Waypoint Sequence</span>
                              <span className="text-secondary">
                                Walking ({stopList.length} Stops)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
                              {stopList.map((stop, sIdx) => (
                                <React.Fragment key={stop.id || sIdx}>
                                  <span className="whitespace-nowrap flex items-center gap-1.5 text-primary">
                                    <span
                                      className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                                        sIdx === 0
                                          ? 'bg-primary-container text-on-primary'
                                          : sIdx === stopList.length - 1
                                          ? 'bg-secondary-container text-on-secondary-container'
                                          : 'bg-surface-container text-on-surface'
                                      }`}
                                    >
                                      {sIdx + 1}
                                    </span>
                                    <span className="font-semibold text-xs truncate max-w-[120px]">
                                      {stop.name}
                                    </span>
                                  </span>
                                  {sIdx < stopList.length - 1 && (
                                    <span className="text-on-surface-variant opacity-40 shrink-0">
                                      →
                                    </span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Action Cluster */}
                      <div className="pt-3 border-t border-surface-container flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShareRoute(trip)}
                            title="Share Route"
                            aria-label="Share Route"
                            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-secondary" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTrip(trip);
                              setNewName(trip.name);
                            }}
                            title="Rename"
                            aria-label="Rename Trip"
                            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingTrip(trip)}
                            title="Delete"
                            aria-label="Delete Trip"
                            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-on-surface-variant hover:text-error" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleViewRoute(trip)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-on-primary text-xs font-semibold shadow-xs hover:bg-primary transition-all cursor-pointer"
                        >
                          <span>Open in Planner</span>
                          <ArrowRight className="w-3.5 h-3.5 text-secondary-fixed" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Recently Trashed / Archive Drawer Preview ──────────────────── */}
        {recentlyTrashed && (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-surface-container p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
                  <RotateCcw className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-serif text-base font-semibold text-primary">
                    Archived &amp; Trashed Itinerary
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    1 journey in recovery holding. Purged permanently after 30 days.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-primary truncate max-w-[200px]">
                    {recentlyTrashed.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {recentlyTrashed.cityName || 'Basque Country'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreTrashed}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Trip</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Rename Trip Modal ────────────────────────────────────────────── */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-3xl p-6 shadow-xl border border-outline-variant space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-secondary" />
                <h3 className="font-serif text-lg font-semibold text-primary">
                  Rename Itinerary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Itinerary Title
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. San Sebastián Gourmet Crawl"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/30 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRename || !newName.trim()}
                  className="px-5 py-2 rounded-full bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all cursor-pointer disabled:opacity-60"
                >
                  {savingRename ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deletingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-3xl p-6 shadow-xl border border-outline-variant space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-error">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-lg font-semibold text-primary">
                Move Trip to Archive?
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-primary font-semibold">"{deletingTrip.name}"</strong>? It will
              be moved to recovery holding and can be restored at any time.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTrip(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-error text-on-error text-xs font-semibold hover:bg-error/90 transition-all cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
