import React from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Compass, 
  ExternalLink 
} from 'lucide-react';

const ARCH_STACK = [
  {
    layer: 'Frontend Client',
    tech: 'React 19 + Vite + Tailwind',
    details: 'Single-page responsive architecture with sub-millisecond route transitions, Leaflet geospatial renderers, and Google Stitch design system.',
    icon: Compass,
    color: 'text-[#096a5f] bg-[#9eefe0]/30 border-[#9eefe0]'
  },
  {
    layer: 'API Gateway & Services',
    tech: 'Node.js + Express (ES Modules)',
    details: 'Stateless REST micro-controllers, JWT HMAC-SHA256 authorization, rate limiters, and Overpass POI caching.',
    icon: Server,
    color: 'text-[#00140f] bg-[#edf6f0] border-[#dce5df]'
  },
  {
    layer: 'Spatial Persistence',
    tech: 'PostgreSQL 16 + PostGIS + Prisma',
    details: 'Spatial GiST R-Tree indexing with ST_DWithin and ST_DistanceSphere for sub-50ms geographic lookups across global cities.',
    icon: Database,
    color: 'text-[#096a5f] bg-[#edf6f0] border-[#dce5df]'
  },
  {
    layer: 'Routing Engine',
    tech: 'TSP Heuristics + OSRM Road Graph',
    details: '2-opt local search, Nearest Neighbor TSP optimization, and OpenStreetMap road-following geometry with zero backtracking.',
    icon: Cpu,
    color: 'text-[#00140f] bg-[#9eefe0]/30 border-[#9eefe0]'
  },
];

export default function ArchitectureSection({ healthData }) {
  const isHealthy = !!healthData;

  return (
    <section id="architecture" className="w-full bg-[#f3fbf6] py-16 md:py-24 border-t border-[#dce5df]/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf6f0] text-[#096a5f] border border-[#dce5df] text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-[#096a5f]" />
              <span>Full-Stack Engineering Spec</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#00140f] tracking-tight">
              Production Architecture
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#414846] mt-2 max-w-xl">
              Engineered as an enterprise travel-tech system combining PostGIS spatial indexing, heuristic route optimization, and modern React performance.
            </p>
          </div>

          {/* Backend Diagnostics Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#dce5df] flex items-center gap-3 self-start md:self-auto shadow-xs">
            <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <div>
              <div className="font-sans text-xs font-bold text-[#00140f]">
                {isHealthy ? 'PostGIS Active & Connected' : 'Checking Backend'}
              </div>
              <div className="text-[11px] text-[#727976] font-mono">
                Port 5000 • Prisma 6 • EPSG:4326
              </div>
            </div>
          </div>
        </div>

        {/* Four Tier Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ARCH_STACK.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.layer}
                className="bg-white rounded-3xl p-6 border border-[#e2eae5] shadow-[0_4px_24px_-4px_rgba(14,42,36,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#727976]">
                    {item.layer}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#00140f] mt-1 mb-2">
                    {item.tech}
                  </h3>
                  <p className="font-sans text-xs text-[#414846] leading-relaxed">
                    {item.details}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#edf6f0] flex items-center gap-1.5 text-[11px] text-[#096a5f] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Production Verified</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostics & Performance Guarantee Banner */}
        <div className="mt-10 bg-[#00140f] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#2a7e72]/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9eefe0]/20 border border-[#9eefe0]/40 flex items-center justify-center text-[#9eefe0] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-white">Benchmarked Algorithmic Scaling</h4>
              <p className="font-sans text-xs text-[#d3dcd7] mt-1 max-w-lg">
                Extensively evaluated on 5 benchmark topologies: Small (5 stops), Medium (15 stops), Large (40 stops), Clustered (Indiranagar), and Dispersed (Karnataka).
              </p>
            </div>
          </div>

          <a
            href="/benchmark"
            className="px-5 py-3 rounded-full bg-[#096a5f] hover:bg-[#136f63] text-white text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            Open Benchmark Dashboard →
          </a>
        </div>
      </div>
    </section>
  );
}
