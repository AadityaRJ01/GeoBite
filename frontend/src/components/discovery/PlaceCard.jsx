import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Compass, 
  Coffee, 
  Utensils, 
  Mountain, 
  Landmark, 
  Navigation,
  Route,
  ArrowUpRight
} from 'lucide-react';

const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurant',
    badge: 'bg-amber-50 text-amber-800 border-amber-200/90',
    icon: Utensils,
    iconBg: 'bg-amber-100 text-amber-700',
  },
  cafe: {
    label: 'Café',
    badge: 'bg-teal-50 text-teal-800 border-teal-200/90',
    icon: Coffee,
    iconBg: 'bg-teal-100 text-teal-700',
  },
  viewpoint: {
    label: 'Viewpoint',
    badge: 'bg-sky-50 text-sky-800 border-sky-200/90',
    icon: Mountain,
    iconBg: 'bg-sky-100 text-sky-700',
  },
  attraction: {
    label: 'Attraction',
    badge: 'bg-purple-50 text-purple-800 border-purple-200/90',
    icon: Landmark,
    iconBg: 'bg-purple-100 text-purple-700',
  },
};

function renderPriceSymbols(priceLevel) {
  const normalized = (priceLevel || '').toLowerCase();
  let count = 2;
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
    iconBg: 'bg-slate-100 text-slate-700',
  };
  const CategoryIcon = config.icon;

  const handleCardClick = () => {
    if (onSelect) onSelect(place.id);
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
      className={`group relative bg-white rounded-3xl p-5 border text-left transition-all duration-200 cursor-pointer outline-none shadow-soft-sm ${
        isSelected
          ? 'border-teal-500 ring-4 ring-teal-500/15 shadow-soft-md bg-teal-50/15'
          : 'border-forest-100/80 hover:border-teal-300 hover:shadow-soft-md hover:-translate-y-0.5'
      }`}
    >
      {/* Top Header: Category & Rating */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badge}`}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
        </span>

        <div className="flex items-center gap-2">
          {typeof place.averageRating === 'number' && place.averageRating > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{place.averageRating.toFixed(1)}</span>
            </div>
          )}

          {isSelected && (
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm animate-pulse" />
          )}
        </div>
      </div>

      {/* Title & Address */}
      <h3 className="font-extrabold text-base sm:text-lg text-forest-950 group-hover:text-teal-700 transition-colors truncate">
        {place.name}
      </h3>

      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{place.address || 'Address verified on map'}</span>
      </div>

      {/* Description */}
      {place.description && (
        <p className="text-xs text-slate-600 line-clamp-2 my-3 leading-relaxed font-normal">
          {place.description}
        </p>
      )}

      {/* Metadata Row: Distance, Pricing, Duration */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-forest-100/70 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* PostGIS Calculated Proximity */}
          {typeof place.distanceMeters === 'number' && (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs"
              title={`PostGIS geographic distance: ${place.distanceMeters} m`}
            >
              <Navigation className="w-3 h-3 text-teal-600 rotate-45" />
              <span>
                {place.distanceKm < 1 ? `${place.distanceMeters} m` : `${place.distanceKm} km`}
              </span>
            </div>
          )}

          {/* Price Level */}
          {place.priceLevel && (
            <div className="flex items-center gap-1 text-slate-600 bg-sand-50 px-2 py-0.5 rounded-lg border border-sand-200">
              {renderPriceSymbols(place.priceLevel)}
              <span className="capitalize text-[10px] text-slate-500 hidden sm:inline">
                {place.priceLevel}
              </span>
            </div>
          )}

          {/* Time estimate */}
          {place.estimatedVisitMinutes && (
            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{place.estimatedVisitMinutes}m stop</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleFocusClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-all cursor-pointer"
            title="Focus on map"
          >
            <Navigation className="w-3 h-3 text-teal-600" />
            <span>Map</span>
          </button>

          <Link
            to="/route"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-forest-900 bg-sand-100 hover:bg-forest-100 border border-sand-200 transition-all shadow-xs cursor-pointer"
            title="Add this place to Route Planner"
          >
            <Route className="w-3 h-3 text-teal-600" />
            <span>Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
