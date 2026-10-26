import React from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  Compass, 
  Coffee, 
  Utensils, 
  Mountain, 
  Landmark, 
  Navigation
} from 'lucide-react';

/**
 * Category styling and icon configuration
 */
const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurant',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Utensils,
  },
  cafe: {
    label: 'Café',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: Coffee,
  },
  viewpoint: {
    label: 'Viewpoint',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Mountain,
  },
  attraction: {
    label: 'Attraction',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: Landmark,
  },
};

/**
 * Price level visual representation
 */
function renderPriceSymbols(priceLevel) {
  const normalized = (priceLevel || '').toLowerCase();
  let count = 2; // default moderate
  if (normalized === 'budget') count = 1;
  else if (normalized === 'moderate') count = 2;
  else if (normalized === 'premium' || normalized === 'luxury') count = 3;

  return (
    <div className="flex items-center text-xs font-semibold text-forest-800" title={`Price level: ${priceLevel || 'Moderate'}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={i < count ? 'text-forest-900 font-bold' : 'text-slate-300 font-normal'}
        >
          $
        </span>
      ))}
    </div>
  );
}

export default function PlaceCard({
  place,
  isSelected,
  onSelect,
  onFocusMap,
}) {
  const config = CATEGORY_CONFIG[place.category] || {
    label: place.category || 'Spot',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: Compass,
  };
  const CategoryIcon = config.icon;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(place.id);
    }
  };

  const handleFocusClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(place.id);
    if (onFocusMap) onFocusMap(place);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      id={`place-card-${place.id}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative bg-white rounded-2xl p-5 border text-left transition-all duration-200 cursor-pointer outline-none ${
        isSelected
          ? 'border-teal-500 ring-4 ring-teal-500/15 shadow-soft-md bg-teal-50/20'
          : 'border-forest-100 hover:border-teal-300 hover:shadow-soft-md bg-white'
      }`}
    >
      {/* Top Header: Name and Category Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-forest-950 group-hover:text-teal-700 transition-colors truncate">
              {place.name}
            </h3>
            {isSelected && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            )}
          </div>
          
          {/* Address with icon */}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{place.address}</span>
          </div>
        </div>

        {/* Category Pill */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
        </span>
      </div>

      {/* Description if present */}
      {place.description && (
        <p className="text-xs text-slate-600 line-clamp-2 my-2.5 leading-relaxed">
          {place.description}
        </p>
      )}

      {/* Metrics Row: Rating, Price Level, Estimated Visit Minutes */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-forest-100/70 text-xs">
        <div className="flex items-center gap-3">
          {/* Rating */}
          {typeof place.averageRating === 'number' && place.averageRating > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{place.averageRating.toFixed(1)}</span>
            </div>
          )}

          {/* Price Level */}
          {place.priceLevel && (
            <div className="flex items-center gap-1 text-slate-600 bg-sand-50 px-2 py-0.5 rounded-md border border-sand-200">
              {renderPriceSymbols(place.priceLevel)}
              <span className="capitalize text-[11px] text-slate-500 hidden sm:inline">
                ({place.priceLevel})
              </span>
            </div>
          )}

          {/* Visit Duration */}
          {place.estimatedVisitMinutes && (
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{place.estimatedVisitMinutes} min</span>
            </div>
          )}
        </div>

        {/* Focus on Map Action */}
        <button
          type="button"
          onClick={handleFocusClick}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/70 transition-colors"
          title="Center this location on the map"
        >
          <Navigation className="w-3 h-3 text-teal-600" />
          <span>Locate</span>
        </button>
      </div>

      {/* Coordinate strip */}
      {place.hasValidCoordinates && (
        <div className="mt-2 text-[10px] text-slate-400 font-mono tracking-tight">
          Lat {place.latitude.toFixed(4)}° • Lng {place.longitude.toFixed(4)}°
        </div>
      )}
    </div>
  );
}
