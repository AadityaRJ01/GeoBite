import React, { useEffect, useRef } from 'react';
import PlaceCard from './PlaceCard';
import { EmptyState } from './StateViews';

export default function PlaceList({
  places = [],
  selectedPlaceId,
  onSelectPlace,
  onFocusMap,
  isFiltered,
  onResetFilters,
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

  if (places.length === 0) {
    return (
      <EmptyState
        isFiltered={isFiltered}
        onReset={onResetFilters}
      />
    );
  }

  return (
    <div
      ref={listRef}
      className="space-y-3.5 pr-1"
      aria-label="List of discovered places"
    >
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
  );
}
