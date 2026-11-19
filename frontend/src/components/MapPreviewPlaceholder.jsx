import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Route,
  Navigation,
  Layers,
  MapPin
} from 'lucide-react';

const STOPS_DATA = [
  {
    step: '01',
    time: '09:30 AM • Breakfast & Roast',
    pill: 'Single Origin',
    name: 'Sakona Coffee Roasters',
    description: 'Pour-over Gesha, cardamom bun, terrace seating directly over the Urumea river bend.',
    transit: '14 min scenic park path to Stop 02',
    isHighlight: false,
  },
  {
    step: '02',
    time: '11:45 AM • Scenic Ridge Walk',
    pill: 'Panoramic Vista',
    name: 'Monte Urgull Historic Trail',
    description: 'Pine-scented ridge walk passing ancient artillery battery, ending with 360-degree views over Santa Clara Island.',
    transit: '8 min descent to Old Town',
    isHighlight: false,
  },
  {
    step: '03',
    time: '01:30 PM • Key Reservation',
    pill: 'Pre-Booked Bar Slot',
    name: 'Bar Nestor',
    description: 'The Holy Trinity: Txuleta ribeye cooked over charcoal, charred padrón peppers, and heirloom tomato carpaccio.',
    transit: 'Kitchen counter alert set for 1:25 PM',
    isHighlight: true,
  },
  {
    step: '04',
    time: '04:30 PM • Cultural Archive',
    pill: 'Basque Society',
    name: 'San Telmo Museum Cloister',
    description: '16th-century Dominican monastery blended with contemporary architecture exploring Basque ethnographic history.',
    transit: '6 min walk across Plaza de la Constitución',
    isHighlight: false,
  },
  {
    step: '05',
    time: '08:00 PM • The Finale',
    pill: 'Iconic Bite',
    name: 'La Viña',
    description: 'The birthplace of the creamy Basque burnt cheesecake, served with a glass of Pedro Ximénez sherry.',
    transit: null,
    isHighlight: false,
  },
];

export default function MapPreviewPlaceholder({ activeCity, selectedCategory }) {
  const navigate = useNavigate();
  const displayCity = activeCity ? activeCity.split(',')[0] : 'San Sebastián';

  const handleOpenRoutePlanner = () => {
    navigate(`/route?city=${encodeURIComponent(displayCity)}`);
  };

  return (
    <section className="w-full bg-[#edf6f0] py-16 md:py-24 border-t border-[#dce5df]/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12">
          <span className="font-sans text-xs text-[#096a5f] uppercase tracking-widest font-bold">
            Algorithmic Harmony
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#00140f] tracking-tight mt-1 leading-[1.15]">
            Optimized Multi-Stop Routes. Seamless Flow.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#414846] mt-3 leading-relaxed">
            Never hurry through a morning cortado or miss a kitchen closing. GeoBite dynamically orchestrates opening windows, peak crowds, and tranquil pedestrian corridors in {displayCity}.
          </p>
        </div>

        {/* Split Layout: Live Day Plan Mockup (Left 7 Cols) vs Tech Intelligence Pillars (Right 5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Live Day Plan Mockup (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_-6px_rgba(14,42,36,0.08)] border border-[#e2eae5]">
            {/* Itinerary Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-3 border-b border-[#edf6f0]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[#096a5f] font-sans text-xs uppercase font-bold tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Optimized Schedule • Route 02</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#00140f]">
                  A Day in {displayCity}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#edf6f0] text-[#00140f] font-sans text-xs font-semibold self-start sm:self-auto border border-[#dce5df]">
                <span className="material-symbols-outlined text-[16px] text-[#096a5f]">bolt</span>
                <span>AI Flow Score: 98/100</span>
              </div>
            </div>

            {/* Optimization Metrics Pill */}
            <div className="my-6 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#9eefe0]/35 text-[#096a5f] font-sans text-xs font-semibold border border-[#9eefe0]/60">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Saved 42 minutes walking • Consecutive reservations aligned • 0 backtracking</span>
            </div>

            {/* Timeline Waypoints */}
            <div className="relative pl-4 sm:pl-6 space-y-6">
              {/* Continuous Connecting Vertical Guideline */}
              <div className="absolute left-[29px] sm:left-[37px] top-6 bottom-6 w-0.5 bg-[#dce5df]" />

              {STOPS_DATA.map((stop) => (
                <div key={stop.step} className="relative flex items-start gap-4 group">
                  {/* Waypoint Number Circle */}
                  <div
                    className={`z-10 w-9 h-9 rounded-full flex items-center justify-center font-sans text-xs font-bold shadow-xs shrink-0 ${
                      stop.isHighlight
                        ? 'bg-[#096a5f] text-white ring-4 ring-[#9eefe0]'
                        : 'bg-[#00140f] text-white'
                    }`}
                  >
                    {stop.step}
                  </div>

                  {/* Waypoint Card Content */}
                  <div
                    className={`flex-1 p-4 rounded-2xl transition-all ${
                      stop.isHighlight
                        ? 'bg-[#9eefe0]/20 border border-[#9eefe0]'
                        : 'bg-[#edf6f0] group-hover:bg-[#e7f0eb] border border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="font-sans text-xs text-[#096a5f] font-bold">
                        {stop.time}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[#00140f] font-sans text-[11px] font-semibold shadow-2xs">
                        {stop.pill}
                      </span>
                    </div>

                    <div className="font-serif text-base font-bold text-[#00140f] mb-1">
                      {stop.name}
                    </div>

                    <p className="font-sans text-xs sm:text-sm text-[#414846] leading-relaxed">
                      {stop.description}
                    </p>

                    {stop.transit && (
                      <div className="mt-2.5 flex items-center gap-1.5 font-sans text-xs text-[#727976]">
                        <span className="material-symbols-outlined text-[14px]">
                          {stop.isHighlight ? 'alarm_on' : 'directions_walk'}
                        </span>
                        <span>{stop.transit}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Bar */}
            <div className="mt-8 pt-6 border-t border-[#edf6f0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#414846] font-sans text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#096a5f]">sync</span>
                <span>Auto-synced with Apple Wallet &amp; Google Maps</span>
              </div>
              <button
                type="button"
                onClick={handleOpenRoutePlanner}
                className="px-6 py-2.5 rounded-full bg-[#00140f] text-white hover:bg-[#0e2a24] font-sans text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Open Full Day Route
              </button>
            </div>
          </div>

          {/* Right: Architectural Tech Highlights (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Tech Pillar 1 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] border border-[#e2eae5]">
              <div className="w-12 h-12 rounded-2xl bg-[#edf6f0] flex items-center justify-center text-[#096a5f] mb-4">
                <span className="material-symbols-outlined text-[26px]">hub</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-[#00140f] mb-2">
                AI Cluster Routing (TSP)
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#414846] leading-relaxed">
                Unlike generic point-to-point GPS, GeoBite calculates culinary rhythm. It arranges destinations using 2-opt heuristic algorithms to prevent cross-town exhaustion, ensuring you arrive at bakeries before morning sell-outs and wine bars at prime aperitivo hours.
              </p>
            </div>

            {/* Tech Pillar 2 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] border border-[#e2eae5]">
              <div className="w-12 h-12 rounded-2xl bg-[#edf6f0] flex items-center justify-center text-[#096a5f] mb-4">
                <span className="material-symbols-outlined text-[26px]">cloud_off</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-[#00140f] mb-2">
                Offline Topography &amp; Notes
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#414846] leading-relaxed">
                Every curated itinerary caches automatically with PostGIS spatial bounding boxes. Access elevation-conscious walking directions, chef recommendations, and secret dish notes even in basement cellars or remote coastal paths.
              </p>
            </div>

            {/* Tech Pillar 3 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] border border-[#e2eae5]">
              <div className="w-12 h-12 rounded-2xl bg-[#edf6f0] flex items-center justify-center text-[#096a5f] mb-4">
                <span className="material-symbols-outlined text-[26px]">edit_calendar</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-[#00140f] mb-2">
                Table Reservation Sync
              </h4>
              <p className="font-sans text-xs sm:text-sm text-[#414846] leading-relaxed">
                Import reservations and dining slots. GeoBite automatically recalculates intervening pedestrian walks and cultural stops around fixed seating windows with real OSRM road travel geometry.
              </p>
            </div>

            {/* Custom Trip Generator CTA Banner */}
            <div className="bg-[#00140f] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-[#2a7e72]/20">
              <div className="mb-5">
                <span className="font-sans text-xs text-[#a1f1e3] uppercase tracking-widest font-bold">
                  Personalized Engine
                </span>
                <h4 className="font-serif text-xl text-white mt-1 mb-2 font-bold">
                  Have specific dietary tastes or dates?
                </h4>
                <p className="font-sans text-xs sm:text-sm text-[#eaf3ee] leading-relaxed">
                  Our bespoke route builder combines your personal pace, culinary obsessions, and travel companions in under 60 seconds.
                </p>
              </div>
              <Link
                to="/route"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-[#096a5f] text-white font-sans text-xs font-semibold hover:bg-[#136f63] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Build Your Custom Trip</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
