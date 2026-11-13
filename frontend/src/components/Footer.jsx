import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, Heart, Shield, Terminal, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-950 text-forest-100 border-t border-forest-900/80 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-forest-900/60">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-forest-800 flex items-center justify-center shadow-soft-sm border border-teal-400/30">
                <Compass className="w-5 h-5 text-forest-950" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                Geo<span className="text-teal-400">Bite</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-forest-300/80 leading-relaxed max-w-sm font-normal">
              High-precision travel-tech platform combining PostgreSQL + PostGIS spatial discovery, traveling salesperson heuristics, and real road navigation.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-forest-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-900/80 border border-teal-500/20 text-teal-300 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                PostGIS EPSG:4326 Ready
              </span>
            </div>
          </div>

          {/* Column 1: Core Engine */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Travel Intelligence
            </p>
            <ul className="space-y-2 text-xs text-forest-300/90 font-medium">
              <li>
                <Link to="/discover" className="hover:text-teal-300 transition-colors">
                  Explore Places
                </Link>
              </li>
              <li>
                <Link to="/route" className="hover:text-teal-300 transition-colors">
                  Trip Planner (TSP)
                </Link>
              </li>
              <li>
                <Link to="/benchmark" className="hover:text-teal-300 transition-colors">
                  Algorithm Benchmarks
                </Link>
              </li>
              <li>
                <Link to="/saved-trips" className="hover:text-teal-300 transition-colors">
                  Saved Itineraries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Supported Cities */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              Featured Metros
            </p>
            <ul className="space-y-2 text-xs text-forest-300/90 font-medium">
              <li>
                <Link to="/discover?city=Mumbai" className="hover:text-teal-300 transition-colors">
                  Mumbai, India
                </Link>
              </li>
              <li>
                <Link to="/discover?city=Delhi" className="hover:text-teal-300 transition-colors">
                  Delhi, India
                </Link>
              </li>
              <li>
                <Link to="/discover?city=Bengaluru" className="hover:text-teal-300 transition-colors">
                  Bengaluru, India
                </Link>
              </li>
              <li>
                <Link to="/discover?city=Tokyo" className="hover:text-teal-300 transition-colors">
                  Tokyo, Japan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Engineering Spec */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              System Architecture
            </p>
            <ul className="space-y-2 text-xs text-forest-300/90 font-medium">
              <li>
                <a href="/#architecture" className="hover:text-teal-300 transition-colors">
                  Spatial Architecture
                </a>
              </li>
              <li>
                <span className="text-forest-400">2-opt Local Search Heuristic</span>
              </li>
              <li>
                <span className="text-forest-400">OSRM Road Geometry</span>
              </li>
              <li>
                <span className="text-forest-400">Stateless JWT Authorization</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-forest-400">
          <p>© {currentYear} GeoBite Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with React 19, Express & PostGIS</span>
            <span className="text-forest-700">•</span>
            <span className="text-teal-400 font-medium">Zero-Backtrack Travel Routing</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
