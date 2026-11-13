import React from 'react';
import { 
  Utensils, 
  Coffee, 
  Mountain, 
  Landmark, 
  Compass, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'food',
    name: 'Culinary & Restaurants',
    tagline: 'Authentic local bistros & chef-driven eateries',
    icon: Utensils,
    count: '300+ Verified Spots',
    color: 'from-amber-500/10 to-orange-500/5 text-amber-800 border-amber-200/80',
    iconColor: 'text-amber-600 bg-amber-100',
    stat: 'High-Rated Food'
  },
  {
    id: 'cafe',
    name: 'Specialty Cafés',
    tagline: 'Artisanal roasters, quiet workstations & matcha bars',
    icon: Coffee,
    count: '180+ Specialty Cafés',
    color: 'from-teal-500/10 to-emerald-500/5 text-teal-800 border-teal-200/80',
    iconColor: 'text-teal-600 bg-teal-100',
    stat: 'Fresh Roasts'
  },
  {
    id: 'viewpoint',
    name: 'Scenic Viewpoints',
    tagline: 'Rooftops, coastal promenades & panoramic ridges',
    icon: Mountain,
    count: '95+ Panoramic Vistas',
    color: 'from-sky-500/10 to-blue-500/5 text-sky-800 border-sky-200/80',
    iconColor: 'text-sky-600 bg-sky-100',
    stat: 'Golden Hour'
  },
  {
    id: 'culture',
    name: 'Heritage & Landmarks',
    tagline: 'Museums, historic fortresses & iconic architecture',
    icon: Landmark,
    count: '140+ Historic Sights',
    color: 'from-purple-500/10 to-indigo-500/5 text-purple-800 border-purple-200/80',
    iconColor: 'text-purple-600 bg-purple-100',
    stat: 'Curated Heritage'
  },
];

export default function CategorySection({ selectedCategory, onSelectCategory }) {
  return (
    <section id="categories" className="py-16 md:py-24 bg-white/70 border-t border-b border-forest-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 text-forest-900 border border-forest-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Curated Collections</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight font-sans">
              Explore by Experience
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-xl">
              Filter by tailored travel intents. Every spot includes verified geospatial coordinates, visit duration estimates, and ratings.
            </p>
          </div>

          <Link
            to="/discover"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors group"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory && onSelectCategory(cat.id);
                  }
                }}
                className={`group relative p-6 rounded-3xl border text-left transition-all duration-200 cursor-pointer outline-none bg-gradient-to-br ${cat.color} ${
                  isSelected
                    ? 'ring-4 ring-teal-500/20 shadow-soft-md scale-[1.02] border-teal-500 bg-white'
                    : 'hover:shadow-soft-md hover:scale-[1.01] hover:bg-white bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.iconColor} shadow-soft-sm group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-600">
                    {cat.stat}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-forest-950 font-sans tracking-tight mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {cat.tagline}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-slate-500">{cat.count}</span>
                  <span className="text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {isSelected ? 'Active' : 'Explore'} →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
