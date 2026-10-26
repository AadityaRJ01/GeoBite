import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Route, 
  Compass, 
  Sparkles,
  Clock,
  ArrowRight
} from 'lucide-react';

const MOCK_WAYPOINTS = [
  { id: '1', title: 'Atelier Sourdough Bakery', category: 'Food', time: '09:30 AM', coords: '37.7749° N, 122.4194° W', note: 'Start point • Morning bake batch' },
  { id: '2', title: 'Origin & Steam Espresso', category: 'Café', time: '11:15 AM', coords: '37.7833° N, 122.4167° W', note: 'Waypoint 1 • Single origin pour-over' },
  { id: '3', title: 'Horizon Point Overlook', category: 'Viewpoint', time: '02:45 PM', coords: '37.7699° N, 122.4469° W', note: 'Waypoint 2 • 360° bay panoramic' },
  { id: '4', title: 'Hearth & Ember Brasserie', category: 'Food', time: '06:30 PM', coords: '37.7812° N, 122.4089° W', note: 'Destination • Wood-fired seasonal menu' },
];

export default function MapPreviewPlaceholder({ activeCity, selectedCategory }) {
  const [activeLayer, setActiveLayer] = useState('vector');
  const [activeWaypoint, setActiveWaypoint] = useState('1');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <section id="map-preview" className="py-20 relative overflow-hidden bg-sand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Live Day 3 Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Day 3 Milestone Live: Frontend-Backend Integration Complete!</span>
            <Link
              to="/discover"
              className="ml-2 inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline font-bold"
            >
              <span>Explore Live Discovery Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
            Intelligent Multi-Stop Route Sequencing
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Preview how GeoBite connects food discoveries, caffeine stops, and scenic panoramas into zero-backtrack corridors.
          </p>
        </div>

        {/* Map Container Mockup Card */}
        <div className="bg-white rounded-3xl border border-forest-200/90 shadow-soft-lg overflow-hidden">
          {/* Top Control Bar */}
          <div className="px-6 py-4 bg-forest-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-forest-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Route className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-wide text-white flex items-center gap-2">
                  <span>Corridor: {activeCity || 'San Francisco Corridor'}</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Day 1 Placeholder
                  </span>
                </span>
                <p className="text-xs text-forest-300">
                  Active Filter: <span className="text-teal-400 capitalize">{selectedCategory}</span> • 4 Optimized Waypoints
                </p>
              </div>
            </div>

            {/* Layer Switcher & Simulator Button */}
            <div className="flex items-center gap-2 text-xs">
              <div className="hidden sm:flex bg-forest-900/80 p-1 rounded-xl border border-forest-800">
                <button
                  type="button"
                  onClick={() => setActiveLayer('vector')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeLayer === 'vector'
                      ? 'bg-teal-500 text-forest-950 font-bold shadow'
                      : 'text-forest-200 hover:text-white'
                  }`}
                >
                  Vector Clean
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer('terrain')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeLayer === 'terrain'
                      ? 'bg-teal-500 text-forest-950 font-bold shadow'
                      : 'text-forest-200 hover:text-white'
                  }`}
                >
                  Elevation Relief
                </button>
              </div>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-forest-950 font-bold hover:bg-teal-400 active:scale-95 transition-all shadow-sm"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Recalculating...' : 'Optimize Waypoints'}</span>
              </button>
            </div>
          </div>

          {/* Map Layout: Vector Canvas + Waypoints Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
            {/* SVG Geospatial Canvas */}
            <div className="lg:col-span-8 bg-[#0d1a15] relative p-6 flex flex-col justify-between overflow-hidden select-none">
              {/* Subtle Map Grid lines */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(90deg, #2dd4bf 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />

              {/* Decorative Map Contour Topography Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M-100,200 Q200,80 500,220 T1000,180" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                <path d="M-100,280 Q250,150 550,300 T1100,240" fill="none" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M-100,380 Q300,240 600,380 T1100,320" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
                <path d="M100,-50 Q400,200 700,50 T1200,100" fill="none" stroke="#3f8c71" strokeWidth="1" />
              </svg>

              {/* Overlay Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900/90 backdrop-blur-md border border-teal-500/30 text-teal-300 text-xs font-mono">
                  <Compass className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '12s' }} />
                  <span>37.7749° N, 122.4194° W • EPSG:4326</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-forest-900/90 text-[11px] font-semibold text-forest-200 border border-forest-700">
                  Route Matrix: 4 Stops • 4.8 km
                </div>
              </div>

              {/* Interactive Vector Route Display */}
              <div className="relative my-auto py-10 z-10">
                <svg viewBox="0 0 700 280" className="w-full h-auto overflow-visible">
                  {/* Defs for gradients & filters */}
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="50%" stopColor="#2dd4bf" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Route Polyline Track */}
                  <path
                    d="M 90 200 C 180 80, 270 230, 370 120 S 520 220, 620 90"
                    fill="none"
                    stroke="#1b4d3e"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 90 200 C 180 80, 270 230, 370 120 S 520 220, 620 90"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="6 6"
                    className="animate-pulse"
                  />

                  {/* Waypoint Markers */}
                  {/* Node 1 */}
                  <g className="cursor-pointer transition-transform duration-200 hover:scale-110" onClick={() => setActiveWaypoint('1')}>
                    <circle cx="90" cy="200" r="14" fill="#0d211b" stroke="#14b8a6" strokeWidth="3" filter="url(#glow)" />
                    <circle cx="90" cy="200" r="5" fill="#2dd4bf" />
                    <rect x="35" y="222" width="110" height="26" rx="6" fill="#0d211b" stroke="#275947" strokeWidth="1" />
                    <text x="90" y="239" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
                      1. Atelier Sourdough
                    </text>
                  </g>

                  {/* Node 2 */}
                  <g className="cursor-pointer transition-transform duration-200 hover:scale-110" onClick={() => setActiveWaypoint('2')}>
                    <circle cx="280" cy="170" r="14" fill="#0d211b" stroke="#14b8a6" strokeWidth="3" filter="url(#glow)" />
                    <circle cx="280" cy="170" r="5" fill="#2dd4bf" />
                    <rect x="230" y="125" width="100" height="26" rx="6" fill="#0d211b" stroke="#275947" strokeWidth="1" />
                    <text x="280" y="142" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
                      2. Origin Espresso
                    </text>
                  </g>

                  {/* Node 3 */}
                  <g className="cursor-pointer transition-transform duration-200 hover:scale-110" onClick={() => setActiveWaypoint('3')}>
                    <circle cx="430" cy="140" r="14" fill="#0d211b" stroke="#14b8a6" strokeWidth="3" filter="url(#glow)" />
                    <circle cx="430" cy="140" r="5" fill="#2dd4bf" />
                    <rect x="375" y="95" width="110" height="26" rx="6" fill="#0d211b" stroke="#275947" strokeWidth="1" />
                    <text x="430" y="112" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
                      3. Horizon Overlook
                    </text>
                  </g>

                  {/* Node 4 */}
                  <g className="cursor-pointer transition-transform duration-200 hover:scale-110" onClick={() => setActiveWaypoint('4')}>
                    <circle cx="620" cy="90" r="16" fill="#0d211b" stroke="#10b981" strokeWidth="3.5" filter="url(#glow)" />
                    <circle cx="620" cy="90" r="6" fill="#10b981" />
                    <rect x="560" y="45" width="120" height="26" rx="6" fill="#0d211b" stroke="#275947" strokeWidth="1" />
                    <text x="620" y="62" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
                      4. Hearth Brasserie
                    </text>
                  </g>
                </svg>
              </div>

              {/* Map Footer metrics */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-forest-800/80 text-xs text-forest-300">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Total Walk: 4.8 km (58 mins)</span>
                  </span>
                  <span className="hidden sm:inline text-forest-600">•</span>
                  <span className="hidden sm:inline">Elevation Gain: +42m</span>
                </div>
                <div className="text-[11px] font-mono text-teal-400 bg-forest-900/60 px-2 py-0.5 rounded border border-forest-700">
                  Ready for MapLibre GL tile render in Day 2
                </div>
              </div>
            </div>

            {/* Right Waypoint Sequencer Panel */}
            <div className="lg:col-span-4 bg-white p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-forest-950 text-sm tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Curated Waypoint Sequence</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-sand-100 px-2 py-0.5 rounded-full">
                    Day 1 Mock
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {MOCK_WAYPOINTS.map((wp, index) => {
                    const isActive = activeWaypoint === wp.id;
                    return (
                      <div
                        key={wp.id}
                        onClick={() => setActiveWaypoint(wp.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-forest-50/70 border-teal-500 shadow-soft-sm ring-1 ring-teal-500/20'
                            : 'bg-white border-slate-200/80 hover:border-forest-200 hover:bg-sand-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive ? 'bg-forest-900 text-teal-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-bold text-sm text-forest-950">
                              {wp.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sand-200/60 text-forest-800">
                            {wp.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 pl-7">
                          {wp.note}
                        </p>

                        <div className="mt-2 pl-7 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>{wp.time}</span>
                          <span>{wp.coords}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day 2 Architecture Plan Teaser */}
              <div className="mt-6 p-4 rounded-2xl bg-forest-900 text-forest-100 text-xs border border-forest-800">
                <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Next: Day 2 Geospatial Routing</span>
                </p>
                <p className="text-forest-200/90 leading-relaxed text-[11px]">
                  Subsequent days will connect PostGIS geospatial indexing, OSRM/Valhalla routing algorithms, and live MapLibre canvas mapping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
