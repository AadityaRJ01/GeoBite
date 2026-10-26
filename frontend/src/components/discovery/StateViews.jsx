import React from 'react';
import { AlertCircle, RefreshCw, Compass, SearchX } from 'lucide-react';

/**
 * Skeleton loader representing place cards during API loading
 */
export function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="space-y-4" aria-label="Loading places...">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-white rounded-2xl p-5 border border-forest-100/80 shadow-soft-sm animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 bg-sand-200 rounded-md w-1/2" />
            <div className="h-5 bg-sand-200 rounded-full w-20" />
          </div>
          <div className="h-3.5 bg-sand-100 rounded w-4/5" />
          <div className="h-3 bg-sand-100 rounded w-3/4" />
          <div className="pt-2 flex items-center justify-between border-t border-sand-100">
            <div className="h-4 bg-sand-200 rounded w-16" />
            <div className="h-4 bg-sand-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error state with actionable retry button
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-soft-md text-center max-w-lg mx-auto my-12">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-forest-950 mb-2">
        Unable to Load Places
      </h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        {message || 'The backend service could not be reached. Ensure the Express server is running on port 5000 and PostgreSQL is accessible.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-800 transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}

/**
 * Empty state when no places match active search/filters
 */
export function EmptyState({ isFiltered = false, onReset }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-forest-100 shadow-soft-sm text-center max-w-md mx-auto my-12">
      <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-4">
        {isFiltered ? <SearchX className="w-7 h-7" /> : <Compass className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-forest-950 mb-1">
        {isFiltered ? 'No Matches Found' : 'No Places Available'}
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        {isFiltered
          ? 'Try adjusting your search keywords, clearing selected category filters, or resetting sorting.'
          : 'No place records are currently active in the database. Run the database seed script to populate places.'}
      </p>
      {isFiltered && onReset && (
        <button
          onClick={onReset}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
