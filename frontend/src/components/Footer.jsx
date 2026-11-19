import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Check } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#0e2a24] text-[#dce5df] pt-16 pb-12 mt-auto border-t border-[#1b3b30]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-[#21473a]/60">
          {/* Brand & Newsletter Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 pr-0 lg:pr-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#00140f] flex items-center justify-center border border-[#9eefe0]/30 shadow-xs">
                <Compass className="w-5 h-5 text-[#9eefe0]" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-white">
                Geo<span className="text-[#9eefe0] italic font-normal">Bite</span>
              </span>
            </Link>

            <p className="font-sans text-xs sm:text-sm text-[#afcdc4] leading-relaxed max-w-sm">
              An editorial, geospatial companion for the culinarily curious. Orchestrating sensory journeys, cultural preservation, and seamless transit across the world's most evocative food regions.
            </p>

            <div className="pt-2">
              <div className="font-serif text-sm font-bold text-white mb-1">
                The Gastronomic Compass
              </div>
              <p className="font-sans text-xs text-[#afcdc4] mb-3">
                Curated field notes, seasonal routes, and secret tables delivered weekly.
              </p>

              {subscribed ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#096a5f]/40 border border-[#9eefe0]/40 text-[#9eefe0] text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Welcome aboard. First dispatch arriving Thursday.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex items-center gap-1.5 bg-[#002b25] p-1.5 rounded-full max-w-md border border-[#21473a]"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent px-3 py-1 font-sans text-xs text-white placeholder:text-[#76928a] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-[#096a5f] text-white font-sans text-xs font-semibold hover:bg-[#136f63] transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Column 1: Destinations (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-white uppercase tracking-wider">
              Destinations
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs text-[#afcdc4]">
              <Link to="/discover?city=Kyoto" className="hover:text-white transition-colors">Kyoto</Link>
              <Link to="/discover?city=San%20Sebastián" className="hover:text-white transition-colors">San Sebastián</Link>
              <Link to="/discover?city=Copenhagen" className="hover:text-white transition-colors">Copenhagen</Link>
              <Link to="/discover?city=Mumbai" className="hover:text-white transition-colors">Mumbai</Link>
              <Link to="/discover?city=Delhi" className="hover:text-white transition-colors">Delhi</Link>
              <Link to="/discover?city=Bengaluru" className="hover:text-white transition-colors">Bengaluru</Link>
              <Link to="/discover?city=Tokyo" className="hover:text-white transition-colors">Tokyo</Link>
            </div>
          </div>

          {/* Column 2: Curations (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-white uppercase tracking-wider">
              Curations
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs text-[#afcdc4]">
              <Link to="/discover?category=food" className="hover:text-white transition-colors">Michelin &amp; street bites</Link>
              <Link to="/discover?category=cafe" className="hover:text-white transition-colors">Historic coffee houses</Link>
              <Link to="/discover?category=viewpoint" className="hover:text-white transition-colors">Hidden viewpoints</Link>
              <Link to="/discover?category=culture" className="hover:text-white transition-colors">Heritage shrines</Link>
              <Link to="/discover" className="hover:text-white transition-colors">Regional food markets</Link>
            </div>
          </div>

          {/* Column 3: Trip Optimizer (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-white uppercase tracking-wider">
              Trip Optimizer
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs text-[#afcdc4]">
              <Link to="/route" className="hover:text-white transition-colors">AI route efficiency</Link>
              <Link to="/route" className="hover:text-white transition-colors">Multi-stop transit (TSP)</Link>
              <Link to="/benchmark" className="hover:text-white transition-colors">Algorithmic benchmarks</Link>
              <Link to="/saved-trips" className="hover:text-white transition-colors">Saved itineraries</Link>
              <a href="/#architecture" className="hover:text-white transition-colors">Spatial architecture</a>
            </div>
          </div>

          {/* Column 4: GeoBite Journal (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-sans text-xs font-bold text-white uppercase tracking-wider">
              GeoBite Journal
            </span>
            <div className="flex flex-col gap-2 font-sans text-xs text-[#afcdc4]">
              <span className="text-[#76928a]">Editorial Issue No. 24</span>
              <span className="text-[#76928a]">Culinary anthropology</span>
              <span className="text-[#76928a]">PostGIS spatial indexing</span>
              <span className="text-[#76928a]">Press &amp; monographs</span>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#76928a] font-sans">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {currentYear} GeoBite Travel Technologies Ltd. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          </div>

          <div className="flex items-center gap-4 text-[#afcdc4]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9eefe0] animate-pulse" />
              <span>Zero-Backtrack TSP Engine Active</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
