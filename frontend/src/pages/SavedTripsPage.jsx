import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchSavedRoutes, updateSavedRoute, deleteSavedRoute } from '../services/authApi.js';
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
  Compass
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SavedTripsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityFilter, setCityFilter] = useState('');

  // Rename modal state
  const [editingTrip, setEditingTrip] = useState(null);
  const [newName, setNewName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  // Delete modal state
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deletingTrip) return;

    try {
      setDeleting(true);
      await deleteSavedRoute(deletingTrip.id);
      setTrips((prev) => prev.filter((t) => t.id !== deletingTrip.id));
      setDeletingTrip(null);
    } catch (err) {
      alert(`Could not delete trip: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleViewRoute = (trip) => {
    navigate(`/route?savedRouteId=${trip.id}`);
  };

  const cities = Array.from(new Set(trips.map((t) => t.cityName))).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      <Navbar pageTag="Saved Trips" />

      <main className="flex-1 max-w-7xl mx-auto w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-forest-100 pb-8 mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 text-forest-900 border border-forest-200 text-xs font-bold uppercase tracking-wider mb-2">
              <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Personal Itineraries</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight font-sans">
              My Saved Trips
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
              Restore optimized waypoint sequences on the interactive map with road-network navigation.
            </p>
          </div>

          <Link
            to="/route"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-forest-950 to-forest-800 hover:from-forest-900 hover:to-forest-700 text-teal-300 text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Plan New Route</span>
          </Link>
        </div>

        {/* Filter Bar */}
        {trips.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 font-sans">
              Filter City:
            </span>
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                cityFilter === ''
                  ? 'bg-forest-900 text-teal-300 shadow-soft-sm'
                  : 'bg-sand-100 text-slate-700 hover:bg-forest-100/70 hover:text-forest-900'
              }`}
            >
              All Destinations ({trips.length})
            </button>
            {cities.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCityFilter(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  cityFilter === c
                    ? 'bg-forest-900 text-teal-300 shadow-soft-sm'
                    : 'bg-sand-100 text-slate-700 hover:bg-forest-100/70 hover:text-forest-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-teal-200 flex items-center justify-center animate-pulse">
              <Compass className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
            <p className="text-sm font-bold text-forest-950 font-sans">Loading your itineraries...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && trips.length === 0 && (
          <div className="text-center py-20 px-6 bg-white rounded-3xl border border-dashed border-forest-200 max-w-2xl mx-auto shadow-soft-sm">
            <div className="w-16 h-16 rounded-3xl bg-forest-50 border border-forest-200/80 flex items-center justify-center text-teal-600 mx-auto mb-4">
              <Route className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-forest-950 font-sans tracking-tight">No itineraries saved yet</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Discover local cafés, restaurants, and viewpoints in any city, sequence them with our TSP optimizer, and hit "Save Trip" to store them here.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/route"
                className="px-5 py-2.5 bg-forest-900 text-teal-300 rounded-xl text-xs font-bold shadow-soft-sm hover:bg-forest-800 transition-all"
              >
                Go to Trip Planner
              </Link>
              <Link
                to="/discover"
                className="px-5 py-2.5 bg-sand-100 text-forest-900 rounded-xl text-xs font-bold hover:bg-sand-200 transition-all"
              >
                Discover Places
              </Link>
            </div>
          </div>
        )}

        {/* Trips Cards Grid */}
        {!loading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const formattedDate = new Date(trip.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:-translate-y-0.5"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider font-sans">
                        {trip.cityName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-forest-950 font-sans tracking-tight line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {trip.name}
                    </h3>

                    {/* Metrics Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-sand-50/70 p-3.5 rounded-2xl border border-sand-200/80">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waypoints</span>
                        <span className="font-extrabold text-forest-950 text-sm font-sans">
                          {trip.stopCount} stops
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Route Distance</span>
                        <span className="font-extrabold text-teal-700 text-sm font-mono">
                          {trip.totalDistanceKm} km
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Algorithm</span>
                        <span className="font-bold text-forest-900 uppercase text-[11px]">
                          {trip.algorithm || '2-opt'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Driving</span>
                        <span className="font-bold text-forest-900 text-[11px]">
                          {trip.estimatedTravelMinutes
                            ? `~${Math.round(trip.estimatedTravelMinutes)} mins`
                            : 'Direct Preview'}
                        </span>
                      </div>
                    </div>

                    {/* Stops sequence preview */}
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Waypoint Order:
                      </span>
                      <ol className="mt-1.5 space-y-1 text-xs text-slate-600 list-decimal list-inside">
                        {(trip.stops || []).slice(0, 3).map((stop, idx) => (
                          <li key={idx} className="truncate font-medium">
                            <span className="text-forest-950 font-semibold">{stop.name}</span>
                          </li>
                        ))}
                        {(trip.stops || []).length > 3 && (
                          <li className="text-slate-400 list-none italic text-[11px] pt-0.5">
                            + {(trip.stops || []).length - 3} more stops
                          </li>
                        )}
                      </ol>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="bg-sand-50/90 px-6 py-3.5 border-t border-forest-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTrip(trip);
                          setNewName(trip.name);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-forest-950 font-bold transition-colors cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTrip(trip)}
                        className="px-2.5 py-1 text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewRoute(trip)}
                      className="px-3.5 py-1.5 bg-forest-900 hover:bg-forest-800 text-teal-300 font-bold rounded-xl shadow-soft-sm transition-all active:scale-95 cursor-pointer"
                    >
                      View Route →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Rename Modal */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-soft-lg border border-forest-100">
            <div className="flex items-center justify-between pb-3 border-b border-forest-100">
              <h3 className="text-lg font-extrabold text-forest-950 font-sans">Rename Saved Trip</h3>
              <button
                type="button"
                onClick={() => setEditingTrip(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit} className="mt-4 space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-forest-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                placeholder="Trip Name"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRename}
                  className="px-4 py-2 bg-forest-900 text-teal-300 rounded-xl text-xs font-bold hover:bg-forest-800"
                >
                  {savingRename ? 'Saving...' : 'Save Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-soft-lg border border-forest-100">
            <h3 className="text-lg font-extrabold text-rose-600 font-sans">Delete Saved Trip?</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-forest-950">"{deletingTrip.name}"</span>? This will permanently remove the itinerary.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTrip(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-sand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-soft-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
