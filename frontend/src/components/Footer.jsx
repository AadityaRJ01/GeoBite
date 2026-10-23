import React from 'react';
import { Compass, MapPin, Heart, ArrowUp, Code2 } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-forest-950 text-forest-200 border-t border-forest-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-forest-900/80">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest-900 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                Geo<span className="text-teal-400">Bite</span>
              </span>
            </div>
            <p className="text-sm text-forest-300 max-w-sm leading-relaxed">
              Production-quality geospatial local discovery and route optimization platform. Engineered for seamless multi-stop explorations, local flavors, and panoramic scenic horizons.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-forest-900 text-teal-300 border border-forest-800">
                Day 1 • Foundation Setup
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-forest-900 text-forest-300 border border-forest-800">
                Port 5000 (API) : 5173 (Web)
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-forest-300">
              <li>
                <a href="#hero" className="hover:text-teal-400 transition-colors">
                  Local Discovery
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-teal-400 transition-colors">
                  Category Filters
                </a>
              </li>
              <li>
                <a href="#map-preview" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>Route Optimizer</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-forest-800 text-teal-300">Preview</span>
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-teal-400 transition-colors">
                  System Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Planned Days */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Roadmap
            </h4>
            <ul className="space-y-2.5 text-sm text-forest-300">
              <li className="text-teal-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>Day 1: Foundation (Done)</span>
              </li>
              <li className="text-forest-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                <span>Day 2: Geospatial & Tiles</span>
              </li>
              <li className="text-forest-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                <span>Day 3: TSP Route Planner</span>
              </li>
              <li className="text-forest-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                <span>Day 4: Performance & Benchmarks</span>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['React 19', 'Vite 8', 'Tailwind CSS', 'Node.js', 'Express', 'ES Modules', 'CORS', 'Lucide Icons'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded bg-forest-900/90 text-forest-300 border border-forest-800 text-[11px]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-forest-400">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} GeoBite. Engineered for Engineering Placement Excellence.</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-850 text-forest-200 hover:text-white transition-colors"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
