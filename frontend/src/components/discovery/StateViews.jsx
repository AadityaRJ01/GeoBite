import React from 'react';
import { AlertCircle, RefreshCw, Compass, SearchX } from 'lucide-react';

/**
 * Skeleton loader representing place cards during API loading
 */
export function LoadingSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4" aria-label="Loading places...">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-white rounded-3xl p-4 border border-[#e2eae5] shadow-xs animate-pulse flex flex-col md:flex-row gap-4"
        >
          <div className="w-full md:w-5/12 h-56 md:h-44 bg-[#edf6f0] rounded-2xl" />
          <div className="w-full md:w-7/12 flex flex-col justify-between py-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-[#edf6f0] rounded-full w-28" />
              <div className="h-5 bg-[#edf6f0] rounded-full w-14" />
            </div>
            <div className="h-6 bg-[#edf6f0] rounded-md w-3/4" />
            <div className="h-3.5 bg-[#edf6f0] rounded w-1/2" />
            <div className="h-10 bg-[#edf6f0] rounded-lg w-full" />
            <div className="pt-2 flex items-center justify-between border-t border-[#edf6f0]">
              <div className="h-4 bg-[#edf6f0] rounded-full w-24" />
              <div className="h-6 bg-[#edf6f0] rounded-full w-32" />
            </div>
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
    <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-md text-center max-w-lg mx-auto my-12">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-[#00140f] mb-2">
        Unable to Load Curated Spots
      </h3>
      <p className="font-sans text-xs sm:text-sm text-[#414846] mb-6 leading-relaxed">
        {message || 'The backend service could not be reached. Ensure the Express server is running on port 5000 and PostgreSQL is accessible.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00140f] text-white text-xs font-semibold hover:bg-[#0e2a24] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
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
    <div className="bg-white rounded-3xl p-8 border border-[#e2eae5] shadow-xs text-center max-w-md mx-auto my-12">
      <div className="w-14 h-14 rounded-2xl bg-[#edf6f0] border border-[#dce5df] text-[#096a5f] flex items-center justify-center mx-auto mb-4">
        {isFiltered ? <SearchX className="w-7 h-7" /> : <Compass className="w-7 h-7" />}
      </div>
      <h3 className="font-serif text-xl font-bold text-[#00140f] mb-1.5">
        {isFiltered ? 'No Curated Spots Match Your Filters' : 'No Places Currently Recorded'}
      </h3>
      <p className="font-sans text-xs text-[#727976] mb-6 leading-relaxed">
        {isFiltered
          ? 'Try adjusting your search keywords, clearing selected category filters, or widening your search radius.'
          : 'No place records are currently active in this city. Select another city or trigger discovery to populate places from OpenStreetMap.'}
      </p>
      {isFiltered && onReset && (
        <button
          onClick={onReset}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#096a5f] text-white font-sans text-xs font-semibold hover:bg-[#136f63] transition-colors cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
