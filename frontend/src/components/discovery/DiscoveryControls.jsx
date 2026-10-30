import React from 'react';
import { 
  Search, 
  X, 
  ArrowUpDown, 
  Utensils, 
  Coffee, 
  Mountain, 
  Landmark, 
  Compass,
  RotateCcw,
  Star,
  DollarSign,
  SlidersHorizontal
} from 'lucide-react';

const CATEGORY_ICONS = {
  restaurant: Utensils,
  cafe: Coffee,
  viewpoint: Mountain,
  attraction: Landmark,
};

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: Compass },
  { id: 'restaurant', label: 'Restaurants', icon: Utensils },
  { id: 'cafe', label: 'Cafés', icon: Coffee },
  { id: 'viewpoint', label: 'Viewpoints', icon: Mountain },
  { id: 'attraction', label: 'Attractions', icon: Landmark },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '3', label: '3+ Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '4.5', label: '4.5+ Stars' },
];

const PRICE_OPTIONS = [
  { value: '', label: 'Any Budget' },
  { value: 'budget', label: '$ Budget' },
  { value: 'moderate', label: '$$ Moderate' },
  { value: 'premium', label: '$$$ Premium' },
];

export default function DiscoveryControls({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  minRating,
  onMinRatingChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
}) {
  const isFiltered =
    Boolean(searchQuery.trim()) ||
    (selectedCategory && selectedCategory !== 'all') ||
    Boolean(minRating) ||
    Boolean(maxPrice) ||
    sortBy !== 'distance-asc';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-forest-100 shadow-soft-sm space-y-4">
      {/* Top Row: Search Input + Sort Selection */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="places-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by spot name, address, or cuisine..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-sand-300 text-sm placeholder-slate-400 text-forest-950 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all bg-sand-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              id="places-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-sand-300 text-xs sm:text-sm font-medium text-forest-900 bg-sand-50/50 hover:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="distance-asc">Nearest First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="distance-desc">Farthest First</option>
              <option value="rating-asc">Lowest Rated</option>
            </select>
          </div>

          {/* Clear Filters Action */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0 cursor-pointer"
              title="Reset all search queries, category filters, and sorting"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Middle Row: Rating & Budget Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-forest-100/60">
        <div className="flex flex-wrap items-center gap-3">
          {/* Minimum Rating Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest-900 inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              Rating:
            </span>
            <div className="inline-flex bg-sand-100 p-0.5 rounded-xl border border-sand-200">
              {RATING_OPTIONS.map((opt) => {
                const isSelected = minRating === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onMinRatingChange(opt.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-soft-sm'
                        : 'text-forest-800 hover:text-forest-950 hover:bg-sand-200/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget / Price Tier Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest-900 inline-flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-forest-700" />
              Budget:
            </span>
            <div className="inline-flex bg-sand-100 p-0.5 rounded-xl border border-sand-200">
              {PRICE_OPTIONS.map((opt) => {
                const isSelected = maxPrice === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onMaxPriceChange(opt.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-forest-900 text-white shadow-soft-sm'
                        : 'text-forest-800 hover:text-forest-950 hover:bg-sand-200/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-forest-900">{filteredCount}</span> of{' '}
          <span className="font-bold text-forest-900">{totalCount}</span> verified places
        </div>
      </div>

      {/* Bottom Row: Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-forest-100/60" role="radiogroup" aria-label="Filter by category">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-soft-sm'
                  : 'bg-sand-100 text-forest-800 hover:bg-sand-200/80 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
