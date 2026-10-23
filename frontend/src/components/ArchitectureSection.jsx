import React from 'react';
import { Server, Layout, Cpu, Compass, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const TECH_PILLARS = [
  {
    icon: Layout,
    title: 'Frontend Architecture',
    subtitle: 'React 19 & Vite 8',
    details: [
      'Engineered with modern React and lightning-fast Vite bundling',
      'Configured with custom Tailwind CSS forest/teal design system',
      'Fully responsive, accessible, mobile-first component hierarchy',
      'Modular client structure prepared for tile rendering layers'
    ]
  },
  {
    icon: Server,
    title: 'Backend API Foundation',
    subtitle: 'Node.js & Express ES Modules',
    details: [
      'Native ES Modules architecture with clean route encapsulation',
      'Centralized error handling and uniform JSON 404 routing',
      'Configurable CORS and environment isolation via dotenv',
      'Verified GET /api/health diagnostics endpoint'
    ]
  },
  {
    icon: Cpu,
    title: 'Geospatial Engineering Plan',
    subtitle: 'High-Throughput Spatial Math',
    details: [
      'Spatial point indexing for sub-50ms neighborhood lookups',
      'Haversine distance calculation and bounding-box pruning',
      'Traveling Salesperson (TSP) heuristic for zero-backtrack routes',
      'Decoupled architecture ready for database and tile server'
    ]
  }
];

export default function ArchitectureSection({ healthData }) {
  return (
    <section id="architecture" className="py-20 bg-white border-t border-forest-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-900 text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>Engineering Placement Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
            Production-Grade Full-Stack Architecture
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Engineered with clean separation of concerns, strict error boundaries, and scalable design patterns.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TECH_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-sand-50/70 rounded-3xl p-7 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-forest-900 text-teal-300 flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-forest-950 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-semibold text-teal-700 mt-1 mb-5">
                    {pillar.subtitle}
                  </p>
                  <ul className="space-y-3">
                    {pillar.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-medium text-forest-800">
                  <span>Production Ready</span>
                  <span className="text-teal-600 font-bold">Foundation v1</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live System Diagnostics Box */}
        <div className="mt-12 bg-forest-950 text-white rounded-3xl p-6 sm:p-8 border border-forest-800 shadow-soft-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Backend Health Diagnostic Check</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    GET /api/health
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-forest-300 mt-0.5">
                  Direct connectivity between React frontend and Express backend on port 5000
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-forest-900 border border-forest-800 text-xs">
                <span className="text-forest-400">Status: </span>
                <span className="font-bold text-emerald-400">
                  {healthData?.status || 'Active'}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-forest-900 border border-forest-800 text-xs">
                <span className="text-forest-400">Service: </span>
                <span className="font-bold text-teal-300">
                  {healthData?.service || 'GeoBite API'}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-forest-900 border border-forest-800 text-xs font-mono">
                <span className="text-forest-400">Environment: </span>
                <span className="text-white">
                  {healthData?.environment || 'development'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
