import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Navigation,
  Sparkles,
  Route,
  Search,
  Star,
  Bookmark,
  ArrowRight,
  Utensils,
  Coffee,
  Calendar,
  Layers
} from 'lucide-react';
import { geocodeCity } from '../services/geocoding';

const FEATURED_TERROIRS = [
  {
    id: 'kyoto',
    name: 'Kyoto, Japan',
    title: 'Kyoto: Kaiseki Rituals & Teahouses',
    region: 'Kansai • Japan',
    score: '4.98',
    spots: '24 Curated Spots',
    badge: 'Best in Autumn',
    badgeColor: 'bg-[#096a5f] text-white',
    description:
      'Wander wet stone flagstones of Gion toward hidden dashi specialists, third-wave matcha laboratories, and quiet cedar garden temples.',
    recommendation: 'Recommended: 4 Days',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7_KVmXOBsccVbPIyLenn4FOz_09h3F5JCHP2NDy7ivnjHnGnmQrsBU5fGakk1EP0d7wjcsj0Cxt8_ZXer98ocf-mdrlTA5xFrgPGBRMj0i9wZcXNdMBGUMb3J0qPS9LlRzdr-5TWev6AV8QALqscs6qPxTLbPGjTR9LKgkoscMPTw8HCdcU8-99YwJhBfoWbgdmDa2pdM8xkorzmrBn_TuKMPMeWANDlL9oCT2nQ',
    alt: 'Traditional Kyoto stone-paved Gion alleyway at dusk during light rain',
    category: 'culture',
  },
  {
    id: 'copenhagen',
    name: 'Copenhagen, Denmark',
    title: 'Copenhagen: New Nordic Bakeries & Craft',
    region: 'Hovedstaden • Denmark',
    score: '4.92',
    spots: '18 Curated Spots',
    badge: 'Design & Flavour',
    badgeColor: 'bg-[#00140f] text-white',
    description:
      'Cardamom buns glazed in syrup, fermentation labs turned casual diners, and organic roast houses tucked along the Nørrebro canals.',
    recommendation: 'Recommended: 3 Days',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDOXS03wjA_nVxjufL1szXOq7_XWPy3vp_xjXQY9w22fFpRAJnkbtd4LFdy6lUKw4x1Up9ox3e5hvQP7vHkuHCnqRCuyMBwEjSEQlc2jZdDunMM4VVCgU6nxAzWR83mc6wlBmqEaaXXoGJ1TynO9Aq5m-g8sm_NWO2OyRV4ZK_in5WlcJD8gabbyz7ufXZpWN5cqi0tU_3A_ze4rChHp5nJ3P3dZ2QL_V1zzaI8uI',
    alt: 'Sunlit Scandinavian artisanal bakery and cafe in Copenhagen with cardamom buns',
    category: 'cafe',
  },
  {
    id: 'san-sebastian',
    name: 'San Sebastián, Spain',
    title: 'San Sebastián: Pintxos Crawls & Sea Ridges',
    region: 'Basque Country • Spain',
    score: '4.97',
    spots: '31 Curated Spots',
    badge: 'Ocean & Vine',
    badgeColor: 'bg-[#9eefe0] text-[#136f63]',
    description:
      'From charred txuleta steaks in the crowded Parte Vieja to peaceful oceanfront aperitivos beside Monte Igueldo.',
    recommendation: 'Recommended: 3-4 Days',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWMarR3K6dTcSUabyXla3Qdh9vBe5wrN5jgbHo4ag89Q38lkZkTbVJGQvxc5oykGJQ-WAIrjXj0LJTU9UeUdpUSCYZjsgEDt32xEVyMb6VDtWdHBnRsSvrZBw-oCHkp9tIgcWUXrQD8oa0yhwSom4bT3tXL4TZC7z9ruSsj4hMcKoaFUTIcgfV8_jxIN-3ld_A2VAJAzCza9J5m6HvC0hMhRZbmqfm1sAyHGqnR4',
    alt: 'Golden late afternoon perspective of San Sebastian Basque bay',
    category: 'food',
  },
];

const POPULAR_DESTINATIONS = [
  { name: 'San Sebastián, Spain', tag: 'Pintxos & Bay' },
  { name: 'Kyoto, Japan', tag: 'Kaiseki & Tea' },
  { name: 'Copenhagen, Denmark', tag: 'New Nordic' },
  { name: 'Mumbai, India', tag: 'Coastal & Street Food' },
  { name: 'Delhi, India', tag: 'Old Delhi Heritage' },
  { name: 'Bengaluru, India', tag: 'Third-Wave Coffee' },
  { name: 'Tokyo, Japan', tag: 'Ramen & Ginza' },
];

const CULINARY_FOCUS_OPTIONS = [
  { label: 'Pintxos, Natural Wine, Roasters', category: 'food' },
  { label: 'Michelin & Secret Bistros', category: 'food' },
  { label: 'Artisan Roasters & Bakeries', category: 'cafe' },
  { label: 'Heritage Shrines & Monasteries', category: 'culture' },
  { label: 'Panoramic Ridges & Coastlines', category: 'viewpoint' },
];

const PACE_OPTIONS = [
  { label: '1 km • Leisurely Walking', radius: '1 km', km: 1 },
  { label: '3 km • Neighborhood Stroll', radius: '3 km', km: 3 },
  { label: '5 km • Urban Terroir', radius: '5 km', km: 5 },
  { label: '15 km • Regional Excursion', radius: '15 km', km: 15 },
];

export default function HeroSection({ onSearch, activeCity, setActiveCity }) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(activeCity || 'San Sebastián, Spain');
  const [selectedFocusIndex, setSelectedFocusIndex] = useState(0);
  const [selectedPaceIndex, setSelectedPaceIndex] = useState(1); // 3 km default
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('All Regions');
  const [savedTerroirs, setSavedTerroirs] = useState({});

  useEffect(() => {
    if (activeCity) {
      setSearchInput(activeCity);
    }
  }, [activeCity]);

  const handleSelectCity = (city) => {
    const cityName = typeof city === 'string' ? city : city.name;
    if (setActiveCity) setActiveCity(cityName);
    setSearchInput(cityName);
    const radiusStr = PACE_OPTIONS[selectedPaceIndex].radius;
    if (onSearch) onSearch(cityName, radiusStr);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const query = searchInput.trim() || activeCity || 'San Sebastián, Spain';
    setIsSearching(true);

    const radiusKm = PACE_OPTIONS[selectedPaceIndex].km;
    const focusCategory = CULINARY_FOCUS_OPTIONS[selectedFocusIndex].category;

    try {
      const resolved = await geocodeCity(query);
      if (setActiveCity) setActiveCity(resolved.name);
      setSearchInput(resolved.name);
      if (onSearch) onSearch(resolved.name, `${radiusKm} km`);

      const searchParams = new URLSearchParams({
        lat: resolved.lat.toString(),
        lng: resolved.lng.toString(),
        city: resolved.name,
        radius: radiusKm.toString(),
      });
      if (focusCategory) {
        searchParams.set('category', focusCategory);
      }

      navigate(`/discover?${searchParams.toString()}`, {
        state: {
          lat: resolved.lat,
          lng: resolved.lng,
          city: resolved.name,
          radius: radiusKm,
          category: focusCategory,
        },
      });
    } catch (err) {
      navigate(`/discover?city=${encodeURIComponent(query)}&category=${encodeURIComponent(focusCategory)}`, {
        state: { city: query, category: focusCategory },
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const lat = Number(position.coords.latitude.toFixed(4));
          const lng = Number(position.coords.longitude.toFixed(4));
          const coordString = `${lat}, ${lng}`;
          if (setActiveCity) setActiveCity(coordString);
          setSearchInput(coordString);
          const radiusStr = PACE_OPTIONS[selectedPaceIndex].radius;
          if (onSearch) onSearch(coordString, radiusStr);
        },
        () => {
          setIsLocating(false);
          if (setActiveCity) setActiveCity('San Sebastián, Spain');
          setSearchInput('San Sebastián, Spain');
        },
        { timeout: 8000 }
      );
    }
  };

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setSavedTerroirs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavigateToTerroir = async (terroir) => {
    setIsSearching(true);
    try {
      const resolved = await geocodeCity(terroir.name);
      if (setActiveCity) setActiveCity(resolved.name);
      const searchParams = new URLSearchParams({
        lat: resolved.lat.toString(),
        lng: resolved.lng.toString(),
        city: resolved.name,
        radius: '5',
        category: terroir.category,
      });
      navigate(`/discover?${searchParams.toString()}`);
    } catch {
      navigate(`/discover?city=${encodeURIComponent(terroir.name)}&category=${terroir.category}`);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredTerroirs = FEATURED_TERROIRS.filter((item) => {
    if (activeFilterTab === 'All Regions') return true;
    if (activeFilterTab === 'Michelin & Street Bites') return item.category === 'food';
    if (activeFilterTab === 'Third-Wave Coffee') return item.category === 'cafe';
    if (activeFilterTab === 'Historic Quarters') return item.category === 'culture';
    if (activeFilterTab === 'Scenic Overlooks') return item.category === 'viewpoint';
    return true;
  });

  return (
    <div className="w-full">
      {/* Top Hero & Discovery Exploration */}
      <section className="relative w-full overflow-hidden bg-[#f3fbf6] pt-6 pb-16 md:pt-10 md:pb-24">
        {/* Subtle Background Organic Washes */}
        <div className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full bg-[#9eefe0]/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-[#e2eae5]/40 blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Editorial Title & Header Block */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-4 pb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#edf6f0] text-[#096a5f] font-sans text-xs font-semibold mb-6 shadow-xs border border-[#dce5df]/60">
              <span className="material-symbols-outlined text-[16px] text-[#096a5f]" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <span>Curated Gastronomic Journeys • Issue No. 24</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#00140f] tracking-tight mb-4 leading-[1.15]">
              Travel for the palate.{' '}
              <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#096a5f]">Planned with precision.</span>
            </h1>

            <p className="font-sans text-base sm:text-lg md:text-xl text-[#414846] max-w-2xl leading-relaxed">
              Discover unmapped coastal bistros, third-wave roasters, and architectural sanctuaries—seamlessly stitched into beautifully paced multi-stop itineraries.
            </p>
          </div>

          {/* Floating Architectural Trip Search Pill */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-3xl md:rounded-full p-2.5 sm:p-3 shadow-[0_16px_40px_-8px_rgba(14,42,36,0.08)] border border-[#e2eae5] flex flex-col md:flex-row items-center justify-between gap-2 transition-all hover:border-[#9eefe0]/70"
            >
              {/* Destination Field */}
              <div className="w-full md:w-1/3 flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#edf6f0] transition-colors group">
                <span className="material-symbols-outlined text-[#096a5f] text-[22px] shrink-0">explore</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-sans text-[11px] font-bold text-[#727976] uppercase tracking-wider">
                    Destination
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="e.g. San Sebastián, Kyoto..."
                      className="font-sans text-sm font-semibold text-[#00140f] bg-transparent focus:outline-none truncate w-full"
                    />
                    <button
                      type="button"
                      onClick={handleCurrentLocation}
                      title="Near me"
                      className="p-1 rounded-full text-[#096a5f] hover:bg-[#e2eae5] transition-colors shrink-0"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-[#dce5df]" />

              {/* Culinary Focus Field */}
              <div className="w-full md:w-1/3 flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#edf6f0] transition-colors group">
                <span className="material-symbols-outlined text-[#096a5f] text-[22px] shrink-0">restaurant</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-sans text-[11px] font-bold text-[#727976] uppercase tracking-wider">
                    Culinary Focus
                  </span>
                  <select
                    value={selectedFocusIndex}
                    onChange={(e) => setSelectedFocusIndex(Number(e.target.value))}
                    className="font-sans text-sm font-semibold text-[#00140f] bg-transparent focus:outline-none truncate cursor-pointer w-full"
                  >
                    {CULINARY_FOCUS_OPTIONS.map((opt, idx) => (
                      <option key={opt.label} value={idx}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px h-8 bg-[#dce5df]" />

              {/* Pace & Days Field */}
              <div className="w-full md:w-1/4 flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-[#edf6f0] transition-colors group">
                <span className="material-symbols-outlined text-[#096a5f] text-[22px] shrink-0">calendar_today</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-sans text-[11px] font-bold text-[#727976] uppercase tracking-wider">
                    Pace &amp; Radius
                  </span>
                  <select
                    value={selectedPaceIndex}
                    onChange={(e) => setSelectedPaceIndex(Number(e.target.value))}
                    className="font-sans text-sm font-semibold text-[#00140f] bg-transparent focus:outline-none truncate cursor-pointer w-full"
                  >
                    {PACE_OPTIONS.map((opt, idx) => (
                      <option key={opt.label} value={idx}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#00140f] text-white font-sans text-sm font-semibold hover:bg-[#0e2a24] transition-all shadow-[0_4px_16px_rgba(0,20,15,0.18)] active:scale-95 whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">route</span>
                <span>{isSearching ? 'Resolving...' : 'Explore Routes'}</span>
              </button>
            </form>

            {/* Quick Destination Pills */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 px-2">
              <span className="text-xs font-semibold text-[#727976] mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#096a5f]" /> Featured:
              </span>
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  type="button"
                  key={dest.name}
                  onClick={() => handleSelectCity(dest.name)}
                  className={`text-xs px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                    searchInput.toLowerCase().includes(dest.name.split(',')[0].toLowerCase())
                      ? 'bg-[#00140f] text-[#9eefe0] shadow-xs'
                      : 'bg-[#edf6f0] hover:bg-[#e2eae5] text-[#151d1a]'
                  }`}
                >
                  {dest.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Visual Showcase / Feature Banner */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_20px_48px_-12px_rgba(14,42,36,0.14)] border border-[#e2eae5]/80">
            <div
              className="relative h-[480px] lg:h-[560px] w-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBLSu8e-ZRzknmQ3Jz07oyWl_cdjI5XrNOWeopRyZx1WlzZpLexX2hBIo3BeICi3XR5X2hGWN2-O5NNk89B0R_u_1oeBr1oXCCILPatMjIKy-IcG-rn-Ub02-r3bmPSDf1d6Q3Vqsussg2yiMkgzfTK2YCVbiHC4rP8k3mVa77GZNBwYAfDoA5QDmNpAy9T7mPddHH0wERA-C3HZKgGWFm8TX6TEtqbnFMxdiG2rO4')",
              }}
            >
              {/* Ambient Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00140f]/90 via-[#00140f]/30 to-transparent" />

              {/* Top Editorial Curators Tag */}
              <div className="absolute top-6 left-6 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#00140f] font-sans text-xs font-semibold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#096a5f]" />
                  <span>Curator's Top Pick: Basque Coast Trail</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-[#00140f]/75 backdrop-blur-md text-white font-sans text-xs font-medium border border-white/10">
                  14 handpicked stops
                </div>
              </div>

              {/* Bottom Card Content Overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-xl text-white">
                  <div className="flex items-center gap-2 mb-1.5 text-[#a1f1e3]">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="font-sans text-xs tracking-wider uppercase font-bold">4.96 Regional Score</span>
                    <span className="text-white/40">•</span>
                    <span className="font-sans text-xs font-medium text-white/90">Donostia-San Sebastián</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-medium tracking-tight mb-2">
                    Terraza Miramar &amp; La Concha Promenade
                  </h2>
                  <p className="font-sans text-sm text-[#eaf3ee] line-clamp-2 max-w-lg leading-relaxed">
                    Crisp ocean breeze, aged Txakoli pours, and freshly grilled turbot perched right above the golden shoreline of the Bay of Biscay.
                  </p>
                </div>

                {/* Interactive Micro-Card Action */}
                <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/80 shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-[#9eefe0] flex items-center justify-center text-[#136f63]">
                    <span className="material-symbols-outlined text-[22px]">map</span>
                  </div>
                  <div className="pr-3">
                    <div className="font-sans text-[11px] font-bold text-[#727976] uppercase tracking-wider">
                      Active Segment
                    </div>
                    <div className="font-sans text-xs font-bold text-[#00140f]">Stop 02 of 05 • Lunch</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectCity('San Sebastián, Spain')}
                    className="px-4 py-2 rounded-full bg-[#00140f] text-white font-sans text-xs font-semibold hover:bg-[#096a5f] transition-colors cursor-pointer"
                  >
                    View Stop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Trending Destinations Section */}
      <section className="w-full bg-[#edf6f0] py-16 md:py-20 border-t border-[#dce5df]/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Section Title & Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-sans text-xs text-[#096a5f] uppercase tracking-widest font-bold">
                Featured Terroirs
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#00140f] tracking-tight mt-1">
                Epicurean Capitals &amp; Coastal Enclaves
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#414846] mt-1 max-w-xl">
                Cities revered for distinct regional terroir, historic craft, and unhurried dining rituals.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                'All Regions',
                'Michelin & Street Bites',
                'Third-Wave Coffee',
                'Historic Quarters',
                'Scenic Overlooks',
              ].map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveFilterTab(tab)}
                  className={`px-4 py-2 rounded-full font-sans text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilterTab === tab
                      ? 'bg-[#00140f] text-white shadow-xs'
                      : 'bg-white text-[#414846] hover:text-[#00140f] border border-[#dce5df]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTerroirs.map((dest) => {
              const isSaved = !!savedTerroirs[dest.id];
              return (
                <div
                  key={dest.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] hover:shadow-[0_16px_36px_-6px_rgba(14,42,36,0.12)] transition-all duration-300 flex flex-col border border-[#e2eae5]"
                >
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url('${dest.image}')` }}
                    />
                    <div className="absolute top-4 left-4 flex gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[#00140f] font-sans text-xs font-semibold shadow-xs">
                        {dest.spots}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-sans text-xs font-semibold ${dest.badgeColor}`}>
                        {dest.badge}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(dest.id, e)}
                      aria-label="Save destination"
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm text-[#151d1a] flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#096a5f] text-[#096a5f]' : ''}`} />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[#096a5f] mb-1">
                        <span className="font-sans text-xs uppercase tracking-wider font-bold">
                          {dest.region}
                        </span>
                        <span className="flex items-center text-[#00140f] font-sans text-xs font-bold">
                          <span
                            className="material-symbols-outlined text-[16px] text-[#096a5f] mr-1"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {dest.score}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-[#00140f] group-hover:text-[#096a5f] transition-colors mb-2">
                        {dest.title}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-[#414846] line-clamp-2 mb-4 leading-relaxed">
                        {dest.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#edf6f0] flex items-center justify-between">
                      <span className="font-sans text-xs text-[#727976]">{dest.recommendation}</span>
                      <button
                        type="button"
                        onClick={() => handleNavigateToTerroir(dest)}
                        className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#096a5f] hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>View Route</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
