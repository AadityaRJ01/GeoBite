import React from 'react';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  Route, 
  Clock, 
  Star,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_ITINERARY = [
  { step: '01', name: 'Artisan Coffee Roasters', time: '09:00 AM', tag: 'Specialty Café', duration: '45m' },
  { step: '02', name: 'Historic Botanical Pavilion', time: '10:30 AM', tag: 'Cultural Landmark', duration: '1h 15m' },
  { step: '03', name: 'Coastal Seafood Kitchen', time: '01:00 PM', tag: 'Culinary Gem', duration: '1h' },
  { step: '04', name: 'Sunset Ridge Promenade', time: '05:30 PM', tag: 'Panoramic Viewpoint', duration: '50m' },
];

export default function MapPreviewPlaceholder({ activeCity, selectedCategory }) {
  const displayCity = activeCity ? activeCity.split(',')[0] : 'Bengaluru';

  return (
    <section className="py-16 md:py-24 bg-sand-50/60 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-3">
            <Route className="w-3.5 h-3.5 text-teal-600" />
            <span>Interactive Itinerary Sequencer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight font-sans">
            How GeoBite Eliminates Detours in {displayCity}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Select favorite stops anywhere in the city. Our algorithm orders them by geographic proximity, calculates driving routes, and visualizes turn sequences.
          </p>
        </div>

        {/* Feature showcase card */}
        <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left: Interactive Itinerary Sequence */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-white to-sand-50/40 border-b lg:border-b-0 lg:border-r border-forest-100/80">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-forest-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-forest-900 text-teal-300 flex items-center justify-center font-bold text-xs">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-forest-950 font-sans">Sample Optimized Corridor</h3>
                    <p className="text-[11px] text-slate-500">{displayCity} • 4 Stops • 2-Opt TSP</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                  -28% Distance
                </span>
              </div>

              {/* Waypoint List */}
              <div className="mt-6 space-y-4">
                {MOCK_ITINERARY.map((item, idx) => (
                  <div key={item.step} className="flex items-start gap-3.5 group">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-forest-900 text-white font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                        {item.step}
                      </div>
                      {idx < MOCK_ITINERARY.length - 1 && (
                        <div className="w-0.5 h-10 bg-teal-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 bg-white p-3.5 rounded-2xl border border-forest-100 shadow-soft-sm group-hover:border-teal-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                          {item.tag}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{item.time}</span>
                      </div>
                      <h4 className="text-sm font-bold text-forest-950 mt-1">{item.name}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.duration}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">Verified Location</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-forest-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Route</span>
                <p className="text-lg font-extrabold text-forest-950 font-mono">11.4 km <span className="text-xs text-slate-500 font-sans">(~42 min drive)</span></p>
              </div>

              <Link
                to={`/route?city=${encodeURIComponent(displayCity)}`}
                className="px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-teal-300 text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95"
              >
                Launch Trip Planner →
              </Link>
            </div>
          </div>

          {/* Right: Modern Simulated Map View */}
          <div className="lg:col-span-7 bg-slate-900 relative p-8 flex flex-col justify-between min-h-[420px] overflow-hidden">
            {/* Dark background topographic effect */}
            <div className="absolute inset-0 bg-geo-dots opacity-20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Floating top bar */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>Live PostGIS Spatial Bounding View</span>
              </div>
              <span className="text-xs font-mono text-teal-300">
                EPSG:4326 PostGIS
              </span>
            </div>

            {/* Center Vector Graph Graphic */}
            <div className="relative z-10 my-auto py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-full max-w-md h-44 flex items-center justify-between px-6">
                {/* SVG Route Connector */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <path
                    d="M 50 110 C 130 30, 220 150, 390 60"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    className="animate-pulse"
                  />
                  <path
                    d="M 50 110 C 130 30, 220 150, 390 60"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Pin 1 */}
                <div className="relative z-10 bg-forest-950 p-2 rounded-2xl border-2 border-teal-400 shadow-lg text-teal-300 flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <span className="text-[9px] font-bold mt-1">Start</span>
                </div>

                {/* Pin 2 */}
                <div className="relative z-10 bg-forest-950 p-2 rounded-2xl border-2 border-teal-400 shadow-lg text-teal-300 flex flex-col items-center -mt-10">
                  <Compass className="w-5 h-5 text-teal-400" />
                  <span className="text-[9px] font-bold mt-1">Stop 2</span>
                </div>

                {/* Pin 3 */}
                <div className="relative z-10 bg-forest-950 p-2 rounded-2xl border-2 border-teal-400 shadow-lg text-teal-300 flex flex-col items-center mt-12">
                  <Route className="w-5 h-5 text-teal-400" />
                  <span className="text-[9px] font-bold mt-1">Stop 3</span>
                </div>

                {/* Pin 4 */}
                <div className="relative z-10 bg-forest-950 p-2 rounded-2xl border-2 border-teal-400 shadow-lg text-teal-300 flex flex-col items-center -mt-8">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  <span className="text-[9px] font-bold mt-1">End</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-white font-extrabold text-base tracking-tight font-sans">
                  Dynamic TSP Uncrossing Engine
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  2-opt automatically detects crossing path segments and flips reverse sub-tours to yield the mathematically shortest loop.
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-slate-400">
              <span>Leaflet Tile Layers • OSM Overpass POI Pipeline</span>
              <Link
                to="/discover"
                className="text-teal-400 font-bold hover:underline"
              >
                Explore Live Maps →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
