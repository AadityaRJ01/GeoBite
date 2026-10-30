import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import PlaceCard from './PlaceCard';
import { EmptyState } from './StateViews';

export default function PlaceList({
  places = [],
  selectedPlaceId,
  onSelectPlace,
  onFocusMap,
  isFiltered,
  onResetFilters,
  pagination = null,
  onPageChange,
  loading = false,
}) {
  const listRef = useRef(null);

  // Auto-scroll selected card into view when changed externally (e.g. clicked on map marker)
  useEffect(() => {
    if (!selectedPlaceId) return;
    const element = document.getElementById(`place-card-${selectedPlaceId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedPlaceId]);

  if (places.length === 0 && !loading) {
    return (
      <EmptyState
        isFiltered={isFiltered}
        onReset={onResetFilters}
      />
    );
  }

  const { page = 1, limit = 10, total = places.length, totalPages = 1 } = pagination || {};
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div
      ref={listRef}
      className="space-y-3.5 pr-1"
      aria-label="List of discovered places"
    >
      {/* Places Card List */}
      <div className="space-y-3.5">
        {places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={place.id === selectedPlaceId}
            onSelect={onSelectPlace}
            onFocusMap={onFocusMap}
          />
        ))}
      </div>

      {/* Backend Pagination Bar */}
      {pagination && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-forest-100 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Showing <strong className="text-forest-950 font-bold">{startItem}–{endItem}</strong> of{' '}
              <strong className="text-forest-950 font-bold">{total}</strong> places
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="pagination-prev-btn"
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-sand-300 bg-sand-50 hover:bg-sand-100 text-forest-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-soft-sm"
              title="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-forest-900 text-white shadow-soft-sm">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              id="pagination-next-btn"
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-sand-300 bg-sand-50 hover:bg-sand-100 text-forest-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-soft-sm"
              title="Go to next page"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
