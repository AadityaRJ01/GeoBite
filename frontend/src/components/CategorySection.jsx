import React from 'react';
import { Utensils, Coffee, Landmark, Mountain, Sparkles, ArrowRight, Check } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'food',
    name: 'Food & Culinary',
    tagline: 'Artisan Eats & Hidden Eateries',
    description: 'Curated farm-to-table dining, heritage street food lanes, wood-fired hearths, and local neighborhood favorites off tourist trails.',
    icon: Utensils,
    spotCount: '620+ Spots',
    accentColor: 'from-amber-500/10 to-emerald-500/10',
    iconBg: 'bg-emerald-50 text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    tags: ['Artisanal', 'Farm-to-Table', 'Night Markets', 'Craft Fermentation'],
    stat: '98% Top Rated'
  },
  {
    id: 'cafes',
    name: 'Cafés & Micro-Roasters',
    tagline: 'Single Origin & Quiet Sanctuaries',
    description: 'Third-wave roasteries, tranquil courtyards for deep work, historic espresso counters, and botanical tea ateliers.',
    icon: Coffee,
    spotCount: '410+ Spots',
    accentColor: 'from-amber-600/10 to-teal-500/10',
    iconBg: 'bg-teal-50 text-teal-700',
    badgeBg: 'bg-teal-100 text-teal-800',
    tags: ['Pour Over', 'Quiet Workspaces', 'Matcha', 'House Roasted'],
    stat: 'High-speed Wi-Fi'
  },
  {
    id: 'attractions',
    name: 'Heritage & Culture',
    tagline: 'Historic Gems & Architecture',
    description: 'Centuries-old stone alleys, indie art foundations, preserved architectural landmarks, and vibrant community plazas.',
    icon: Landmark,
    spotCount: '340+ Spots',
    accentColor: 'from-forest-500/10 to-teal-600/10',
    iconBg: 'bg-forest-50 text-forest-800',
    badgeBg: 'bg-forest-100 text-forest-800',
    tags: ['Historic', 'Architecture', 'Museums', 'Local Crafts'],
    stat: 'Curated History'
  },
  {
    id: 'viewpoints',
    name: 'Scenic Viewpoints',
    tagline: 'Sunsets, Horizons & Overlooks',
    description: 'Elevated ridgelines, waterfront boardwalks, hidden hilltop clearings, and skyline observatories timed with golden hour.',
    icon: Mountain,
    spotCount: '290+ Spots',
    accentColor: 'from-teal-500/10 to-sky-500/10',
    iconBg: 'bg-teal-50 text-teal-800',
    badgeBg: 'bg-teal-100 text-teal-900',
    tags: ['Golden Hour', 'Panoramic', 'Stargazing', 'Trailheads'],
    stat: 'Peak Sunset Angles'
  }
];

export default function CategorySection({ selectedCategory, onSelectCategory }) {
  return (
    <section id="categories" className="py-20 bg-sand-100/60 border-y border-forest-100/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Multi-Layer Discovery Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
              Curated Geo-Categories
            </h2>
            <p className="mt-2 text-base sm:text-lg text-slate-600 max-w-xl">
              Filter spatial points of interest by category to generate your bespoke route through the city.
            </p>
          </div>
          <div className="text-sm font-medium text-forest-800 flex items-center gap-1.5 self-start md:self-end bg-white px-4 py-2 rounded-xl border border-forest-200/80 shadow-soft-sm">
            <span>Showing active categories for geospatial queries</span>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectCategory(cat.id);
                  }
                }}
                className={`relative group bg-white rounded-3xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 shadow-soft-lg ring-2 ring-teal-500/20 translate-y-[-4px]'
                    : 'border-slate-200/80 hover:border-forest-300 shadow-soft-sm hover:shadow-soft-md hover:translate-y-[-2px]'
                }`}
              >
                {/* Active selection tick badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                <div>
                  {/* Icon & Count */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.badgeBg}`}>
                      {cat.spotCount}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-bold text-forest-950 tracking-tight group-hover:text-forest-800 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs font-medium text-teal-700 mt-1 mb-3">
                    {cat.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {cat.description}
                  </p>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sand-100 text-slate-700 border border-slate-200/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer of card */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-xs font-semibold text-forest-700">
                    {cat.stat}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:text-forest-900 group-hover:translate-x-1 transition-all">
                    <span>{isSelected ? 'Filter Active' : 'Filter by this'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
