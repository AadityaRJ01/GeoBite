import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Sparkles,
  Navigation,
  RefreshCw,
  Compass,
  Utensils,
  Coffee,
  Mountain,
  Landmark
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Spots', iconName: 'explore' },
  { id: 'restaurant', label: 'Restaurants & Pintxos', iconName: 'restaurant' },
  { id: 'cafe', label: 'Specialty Cafés & Bakeries', iconName: 'local_cafe' },
  { id: 'viewpoint', label: 'Viewpoints & Miradors', iconName: 'landscape' },
  { id: 'attraction', label: 'Heritage & Cloisters', iconName: 'museum' },
];

const RADIUS_OPTIONS = [
  { value: 1, label: '1 km • Walk' },
  { value: 3, label: '3 km • Stroll' },
  { value: 5, label: '5 km • Local' },
  { value: 15, label: '15 km • Radius' },
  { value: 25, label: '25 km • Regional' },
];

export default function DiscoverySubheader({
  cityName,
  cityInput,
  setCityInput,
  onCitySubmit,
  onSelectCity,
  popularCities = [],
  discoveringCity = false,
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onCategoryChange,
  radius,
  onRadiusChange,
  minRating,
  onMinRatingChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortChange,
  onResetFilters,
  isFiltered,
  viewMode,
  onViewModeChange,
  totalCount = 0,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    onSearchQueryChange(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchQueryChange('');
  };

  const activeFiltersCount = [
    Boolean(searchQuery.trim()),
    selectedCategory !== 'all',
    Boolean(minRating),
    Boolean(maxPrice),
    sortBy !== 'distance-asc',
  ].filter(Boolean).length;

  return (
    <section className="w-full bg-white shadow-[0_4px_24px_rgba(14,42,36,0.03)] border-b border-[#e2eae5] px-4 sm:px-6 lg:px-12 py-4">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-4">
        {/* Search Capsule Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Input Capsule */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 flex flex-wrap items-center bg-[#edf6f0] rounded-3xl lg:rounded-full px-4 py-1.5 shadow-xs border border-[#dce5df] gap-2.5 transition-all focus-within:border-[#9eefe0]"
          >
            {/* Location Selector Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="flex items-center gap-1.5 pr-2 py-1 hover:opacity-80 transition-opacity cursor-pointer"
                title="Change active city"
              >
                <span className="material-symbols-outlined text-[20px] text-[#096a5f]">
                  location_on
                </span>
                <span className="font-sans text-xs font-bold text-[#00140f] whitespace-nowrap">
                  {cityName || 'Select City'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[#727976]">
                  expand_more
                </span>
              </button>

              {/* City Selection Popover */}
              {showCityPicker && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-[#e2eae5] p-3 animate-fade-in font-sans">
                  <div className="text-[11px] font-bold text-[#727976] uppercase tracking-wider mb-2">
                    Select Evocative Destination:
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {popularCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onSelectCity(c);
                          setShowCityPicker(false);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          (cityName || '').toLowerCase().includes(c.toLowerCase())
                            ? 'bg-[#00140f] text-white font-bold'
                            : 'bg-[#edf6f0] hover:bg-[#e2eae5] text-[#151d1a]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#edf6f0] flex items-center gap-1.5">
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Type any global city..."
                      className="flex-1 px-3 py-1 bg-[#edf6f0] rounded-xl text-xs text-[#00140f] focus:outline-none border border-[#dce5df]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        onCitySubmit(e);
                        setShowCityPicker(false);
                      }}
                      className="px-3 py-1 bg-[#00140f] text-white rounded-xl text-xs font-bold hover:bg-[#096a5f] transition-colors"
                    >
                      Go
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[#c1c8c5] select-none hidden md:inline">|</span>

            {/* Keyword Search Input */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#727976]">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search pintxos bars, panoramic miradors, artisan roasters..."
                className="w-full bg-transparent font-sans text-xs text-[#00140f] placeholder:text-[#727976] focus:outline-none font-medium"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-[#727976] hover:text-[#00140f]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Radius Selection Pill */}
            <div className="flex items-center gap-1.5 bg-[#e2eae5]/80 px-2.5 py-1 rounded-full text-[#414846] shrink-0">
              <span className="material-symbols-outlined text-[15px] text-[#096a5f]">
                radar
              </span>
              <select
                value={radius}
                onChange={(e) => onRadiusChange && onRadiusChange(Number(e.target.value))}
                className="bg-transparent font-sans text-[11px] font-bold text-[#00140f] focus:outline-none cursor-pointer"
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Explore Action Button */}
            <button
              type="submit"
              className="bg-[#0e2a24] text-white px-5 py-2 rounded-full font-sans text-xs font-semibold hover:bg-[#00140f] transition-all flex items-center gap-1 shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              <span>{discoveringCity ? 'Searching...' : 'Explore'}</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </form>

          {/* Utility Toggles: All Filters & Split/List/Map Mode */}
          <div className="flex items-center gap-2.5 justify-end shrink-0">
            {/* All Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-xs font-semibold transition-colors cursor-pointer border ${
                activeFiltersCount > 0
                  ? 'bg-[#9eefe0] text-[#096a5f] border-[#096a5f]/30'
                  : 'bg-[#edf6f0] text-[#00140f] hover:bg-[#e2eae5] border-[#dce5df]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>All Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* View Mode Toggle: Split / List / Map */}
            <div className="flex items-center p-1 bg-[#edf6f0] rounded-full border border-[#dce5df]">
              <button
                type="button"
                onClick={() => onViewModeChange('split')}
                className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-[#00140f] shadow-xs font-bold'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
                title="Split view (List & Map)"
              >
                <span className="material-symbols-outlined text-[15px]">vertical_split</span>
                <span className="hidden sm:inline">Split</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#00140f] shadow-xs font-bold'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
                title="List view only"
              >
                <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('map')}
                className={`px-3 py-1 rounded-full font-sans text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-[#00140f] shadow-xs font-bold'
                    : 'text-[#414846] hover:text-[#00140f]'
                }`}
                title="Map view only"
              >
                <span className="material-symbols-outlined text-[15px]">map</span>
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs (Horizontal scrolling) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onCategoryChange(tab.id)}
                className={`px-4 py-2 rounded-full font-sans text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#00140f] text-white border-[#00140f] shadow-xs'
                    : 'bg-[#edf6f0] text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5] border-[#dce5df]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {tab.iconName}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Refine Pills & Status Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#edf6f0]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[11px] uppercase tracking-wider text-[#727976] pr-1 font-bold">
              Refine:
            </span>

            {/* Price Filter Pill */}
            <select
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="px-3 py-1 rounded-full bg-[#edf6f0] hover:bg-[#e2eae5] text-[#00140f] font-sans text-xs font-medium border border-[#dce5df] cursor-pointer focus:outline-none"
            >
              <option value="">Price: Any</option>
              <option value="budget">€ Budget</option>
              <option value="moderate">€€ Moderate</option>
              <option value="premium">€€€ Premium</option>
            </select>

            {/* Rating Filter Pill */}
            <select
              value={minRating}
              onChange={(e) => onMinRatingChange(e.target.value)}
              className="px-3 py-1 rounded-full bg-[#edf6f0] hover:bg-[#e2eae5] text-[#00140f] font-sans text-xs font-medium border border-[#dce5df] cursor-pointer focus:outline-none"
            >
              <option value="">Rating: Any</option>
              <option value="4.5">Rating: 4.5+</option>
              <option value="4">Rating: 4.0+</option>
              <option value="3">Rating: 3.0+</option>
            </select>

            {/* Clear / Reset Filters */}
            {isFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[#096a5f] font-sans text-xs font-bold pl-2 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Status Meta on Right */}
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-[#414846]">
              <strong className="text-[#00140f] font-bold">{totalCount}</strong> culinary waypoints charted
            </span>

            <div className="flex items-center gap-1.5 font-sans text-xs text-[#00140f]">
              <span className="text-[#727976] font-normal">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent font-sans text-xs font-bold text-[#00140f] focus:outline-none cursor-pointer"
              >
                <option value="distance-asc">Nearest First</option>
                <option value="rating-desc">Curator Ranked (4.9+)</option>
                <option value="distance-desc">Farthest First</option>
                <option value="rating-asc">Lowest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filters Drawer */}
        {showFiltersModal && (
          <div className="bg-[#edf6f0] rounded-3xl p-5 border border-[#dce5df] mt-2 animate-fade-in font-sans">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#096a5f]">tune</span>
                <h4 className="font-serif text-lg font-bold text-[#00140f]">
                  Filter Gastronomic Experiences
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="p-1 rounded-full text-[#727976] hover:text-[#00140f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rating selection */}
              <div>
                <label className="text-xs font-bold text-[#727976] uppercase tracking-wider block mb-1.5">
                  Minimum Star Rating
                </label>
                <div className="flex gap-2">
                  {['', '3', '4', '4.5'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onMinRatingChange(r)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        minRating === r
                          ? 'bg-[#00140f] text-white border-[#00140f]'
                          : 'bg-white text-[#414846] border-[#dce5df]'
                      }`}
                    >
                      {r === '' ? 'Any' : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price level */}
              <div>
                <label className="text-xs font-bold text-[#727976] uppercase tracking-wider block mb-1.5">
                  Price Category
                </label>
                <div className="flex gap-2">
                  {[
                    { val: '', label: 'Any' },
                    { val: 'budget', label: '€ Budget' },
                    { val: 'moderate', label: '€€ Mid' },
                    { val: 'premium', label: '€€€ Prime' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => onMaxPriceChange(p.val)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        maxPrice === p.val
                          ? 'bg-[#00140f] text-white border-[#00140f]'
                          : 'bg-white text-[#414846] border-[#dce5df]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius selection */}
              <div>
                <label className="text-xs font-bold text-[#727976] uppercase tracking-wider block mb-1.5">
                  Search Proximity Radius
                </label>
                <div className="flex gap-1.5">
                  {[1, 3, 5, 15, 25].map((rad) => (
                    <button
                      key={rad}
                      type="button"
                      onClick={() => onRadiusChange(rad)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        radius === rad
                          ? 'bg-[#00140f] text-white border-[#00140f]'
                          : 'bg-white text-[#414846] border-[#dce5df]'
                      }`}
                    >
                      {rad} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#dce5df] flex items-center justify-between">
              <span className="text-xs text-[#727976]">
                Filters update automatically using PostGIS spatial indexing.
              </span>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="px-5 py-1.5 rounded-full bg-[#00140f] text-white font-sans text-xs font-bold hover:bg-[#096a5f] transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

