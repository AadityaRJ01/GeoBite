import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchSavedRoutes, updateSavedRoute, deleteSavedRoute } from '../services/authApi.js';

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
    // Navigate to Route Planner with savedRouteId
    navigate(`/routes?savedRouteId=${trip.id}`);
  };

  if (authLoading || (loading && trips.length === 0)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center space-x-3 text-emerald-600">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="font-medium text-gray-700">Loading your saved trips...</span>
        </div>
      </div>
    );
  }

  // Extract unique cities for filter pills
  const cities = Array.from(new Set(trips.map((t) => t.cityName))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Saved Trips
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View, restore, and manage your custom travel itineraries and optimized routes.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/routes"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            + Plan New Route
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {trips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">
            Filter by City:
          </span>
          <button
            onClick={() => setCityFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              cityFilter === ''
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Cities ({trips.length})
          </button>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                cityFilter === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {trips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl">
            🗺️
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">No saved trips yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            You haven't saved any routes yet. Explore cities, add your favorite cafes, restaurants, and sights, then optimize and save them to your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/routes"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Go to Route Planner
            </Link>
            <Link
              to="/discovery"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Discover Places
            </Link>
          </div>
        </div>
      ) : (
        /* Trips Grid */
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider mb-2">
                        {trip.cityName}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                        {trip.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 border-t border-b border-gray-100 py-3">
                    <div>
                      <span className="font-medium text-gray-400 block uppercase">Stops</span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {trip.stopCount} locations
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400 block uppercase">Distance</span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {trip.totalDistanceKm} km
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400 block uppercase">Algorithm</span>
                      <span className="font-semibold text-gray-800 uppercase">
                        {trip.algorithm || 'genetic'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400 block uppercase">Est. Time</span>
                      <span className="font-semibold text-gray-800">
                        {trip.estimatedTravelMinutes
                          ? `${Math.round(trip.estimatedTravelMinutes)} mins`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Stop previews */}
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Stops Sequence:
                    </span>
                    <ol className="mt-1 text-xs text-gray-600 space-y-1 list-decimal list-inside line-clamp-3">
                      {(trip.stops || []).slice(0, 3).map((stop, idx) => (
                        <li key={idx} className="truncate">
                          <span className="font-medium text-gray-800">{stop.name}</span>
                        </li>
                      ))}
                      {(trip.stops || []).length > 3 && (
                        <li className="text-gray-400 list-none italic pl-2">
                          + {(trip.stops || []).length - 3} more stops
                        </li>
                      )}
                    </ol>
                  </div>
                </div>

                {/* Footer with actions */}
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{formattedDate}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingTrip(trip);
                        setNewName(trip.name);
                      }}
                      className="px-2.5 py-1 text-gray-600 hover:text-gray-900 font-medium hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => setDeletingTrip(trip)}
                      className="px-2.5 py-1 text-red-600 hover:text-red-700 font-medium hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleViewRoute(trip)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      View Route
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Modal */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Rename Saved Trip</h3>
            <p className="mt-1 text-sm text-gray-500">
              Give your itinerary a memorable title.
            </p>
            <form onSubmit={handleRenameSubmit} className="mt-4 space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Trip Name"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRename}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-red-600">Delete Saved Trip?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingTrip.name}"</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTrip(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

