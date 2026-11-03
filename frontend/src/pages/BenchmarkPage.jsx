import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Route,
  Play,
  Layers,
  Zap,
  BarChart2,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  MapPin,
  Activity,
  Award,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { benchmarkRoutes, fetchHealth } from '../services/placesApi';
import Footer from '../components/Footer';

// ─── Supported Standard Datasets ──────────────────────────────────────────────
export const BENCHMARK_DATASETS = [
  {
    id: 'small',
    name: 'Small Dataset',
    stopsCount: 5,
    tag: 'Central Bengaluru',
    description: 'Central Bengaluru culinary and cultural route with 5 stops (MG Road, Cubbon Park, Karavalli, Truffles, Lalbagh).',
  },
  {
    id: 'medium',
    name: 'Medium Dataset',
    stopsCount: 15,
    tag: 'Citywide Hubs',
    description: '15 stops distributed across diverse Bengaluru neighborhoods (Indiranagar, Koramangala, Malleshwaram, etc.).',
  },
  {
    id: 'large',
    name: 'Large Dataset',
    stopsCount: 40,
    tag: 'Greater Bengaluru Scalability',
    description: '40 stops across Greater Bengaluru testing algorithmic scalability, convergence, and execution runtimes.',
  },
  {
    id: 'clustered',
    name: 'Clustered Dataset',
    stopsCount: 12,
    tag: 'Dense Micro-Cluster',
    description: '12 stops densely packed within a 600m commercial micro-cluster in Indiranagar testing local search uncrossing.',
  },
  {
    id: 'dispersed',
    name: 'Dispersed Dataset',
    stopsCount: 10,
    tag: 'Regional Hubs (Karnataka)',
    description: '10 widely separated stops distributed across Karnataka (50–400 km apart) testing long-haul regional paths.',
  },
];

// Algorithm Metadata
const ALGO_DETAILS = {
  baseline: {
    key: 'baseline',
    label: 'Baseline',
    sublabel: 'Original selection order',
    complexity: 'O(N)',
    color: '#64748b',
    borderClass: 'border-slate-200',
    bgClass: 'bg-slate-50',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  nearestNeighbor: {
    key: 'nearestNeighbor',
    label: 'Nearest Neighbor',
    sublabel: 'Greedy heuristic',
    complexity: 'O(N²)',
    color: '#d97706',
    borderClass: 'border-amber-200',
    bgClass: 'bg-amber-50/60',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  twoOpt: {
    key: 'twoOpt',
    label: '2-opt Local Search',
    sublabel: 'Nearest Neighbor + 2-opt',
    complexity: 'O(K·N²)',
    color: '#0d9488',
    borderClass: 'border-teal-300',
    bgClass: 'bg-teal-50/70',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
  },
};

export default function BenchmarkPage() {
  // Single Dataset Benchmark State
  const [selectedDatasetId, setSelectedDatasetId] = useState('small');
  const [runs, setRuns] = useState(3);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Multi-Dataset Suite State
  const [suiteResults, setSuiteResults] = useState(null);
  const [suiteLoading, setSuiteLoading] = useState(false);
  const [suiteProgress, setSuiteProgress] = useState({ current: 0, total: 5, label: '' });
  const [suiteError, setSuiteError] = useState(null);

  // Backend Health
  const [healthStatus, setHealthStatus] = useState({ online: false, data: null });

  // Race condition guard
  const activeRequestIdRef = useRef(0);

  // Current dataset info
  const activeDatasetInfo = BENCHMARK_DATASETS.find((d) => d.id === selectedDatasetId) || BENCHMARK_DATASETS[0];

  // Check health on mount
  useEffect(() => {
    let isMounted = true;
    fetchHealth()
      .then((data) => {
        if (isMounted) setHealthStatus({ online: true, data });
      })
      .catch(() => {
        if (isMounted) setHealthStatus({ online: false, data: null });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Run benchmark for currently selected dataset
  const executeBenchmark = useCallback(
    async (datasetId = selectedDatasetId, runCount = runs) => {
      const requestId = ++activeRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const data = await benchmarkRoutes({
          scenario: datasetId,
          runs: runCount,
        });

        // Guard against stale asynchronous responses
        if (requestId === activeRequestIdRef.current) {
          setBenchmarkResult(data);
        }
      } catch (err) {
        if (requestId === activeRequestIdRef.current) {
          setError(err.message || 'Failed to execute algorithm benchmark.');
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [selectedDatasetId, runs]
  );

  // Auto-run first benchmark on mount
  useEffect(() => {
    executeBenchmark('small', 3);
  }, [executeBenchmark]);

  // Execute All Benchmarks sequentially to give progress feedback without overwhelming backend
  const executeAllBenchmarks = useCallback(async () => {
    setSuiteLoading(true);
    setSuiteError(null);
    const results = [];

    try {
      for (let i = 0; i < BENCHMARK_DATASETS.length; i++) {
        const preset = BENCHMARK_DATASETS[i];
        setSuiteProgress({
          current: i + 1,
          total: BENCHMARK_DATASETS.length,
          label: `Benchmarking ${preset.name} (${preset.stopsCount} stops)...`,
        });

        try {
          const res = await benchmarkRoutes({
            scenario: preset.id,
            runs: runs,
          });
          results.push({
            id: preset.id,
            name: preset.name,
            stopsCount: preset.stopsCount,
            tag: preset.tag,
            data: res,
            success: true,
          });
        } catch (err) {
          results.push({
            id: preset.id,
            name: preset.name,
            stopsCount: preset.stopsCount,
            tag: preset.tag,
            error: err.message || 'Dataset benchmark failed',
            success: false,
          });
        }
      }
      setSuiteResults(results);
    } catch (globalErr) {
      setSuiteError(globalErr.message || 'Suite execution failed.');
    } finally {
      setSuiteLoading(false);
      setSuiteProgress({ current: 0, total: 5, label: '' });
    }
  }, [runs]);

  // Handle dataset switch
  const handleDatasetChange = (datasetId) => {
    setSelectedDatasetId(datasetId);
    executeBenchmark(datasetId, runs);
  };

  // Metrics extraction
  const metrics = benchmarkResult?.metrics;
  const recommendation = benchmarkResult?.recommendation;

  const baselineMetric = metrics?.baseline;
  const nnMetric = metrics?.nearestNeighbor;
  const twoOptMetric = metrics?.twoOpt;

  // Best metrics
  const bestAlgoKey = recommendation?.recommendedAlgorithm || 'twoOpt';
  const bestAlgoMeta = ALGO_DETAILS[bestAlgoKey] || ALGO_DETAILS.twoOpt;
  const bestMetric = metrics?.[bestAlgoKey] || twoOptMetric;
  const distanceSaved = recommendation?.distanceSavedKm ?? (baselineMetric && bestMetric ? baselineMetric.distanceKm - bestMetric.distanceKm : 0);
  const percentSaved = recommendation?.improvementPercent ?? (baselineMetric && bestMetric ? ((distanceSaved / baselineMetric.distanceKm) * 100).toFixed(1) : 0);

  // Max distance for relative chart bars
  const maxDistance = baselineMetric
    ? Math.max(baselineMetric.distanceKm, nnMetric?.distanceKm || 0, twoOptMetric?.distanceKm || 0, 0.001)
    : 1;

  // Max median time for relative chart bars
  const maxTime = baselineMetric
    ? Math.max(baselineMetric.medianTimeMs, nnMetric?.medianTimeMs || 0, twoOptMetric?.medianTimeMs || 0, 0.001)
    : 1;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-forest-950">
      {/* ── Top Header Navigation ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-forest-100 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Tag */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 border border-teal-500/30">
                  <Compass className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform duration-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-forest-950 flex items-center">
                    Geo<span className="text-teal-600">Bite</span>
                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/60 rounded">
                      Benchmark
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest-900 hover:bg-forest-50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Discover Places</span>
              </Link>

              <Link
                to="/route"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-forest-900 hover:bg-forest-50 transition-colors"
              >
                <Route className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Route Planner</span>
              </Link>

              {/* API Status indicator */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  healthStatus.online
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
                title="PostgreSQL & Express API Status"
              >
                <span className="relative flex h-2 w-2">
                  {healthStatus.online && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      healthStatus.online ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="hidden md:inline font-mono text-[11px]">
                  {healthStatus.online ? 'Express Online' : 'Connecting API'}
                </span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ── Section A: Page Header & Quick Controls ───────────────────────── */}
        <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold tracking-wide">
              <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Performance & Scalability Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-forest-950 tracking-tight">
              Algorithm Benchmark Dashboard
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Compare route optimization algorithms across different geospatial datasets. Rigorously evaluate
              travel distance reduction, median CPU runtime, and local search uncrossing guarantees.
            </p>
          </div>

          {/* Action buttons & run configuration */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Iterations selector */}
            <div className="flex items-center bg-sand-100 rounded-2xl p-1 border border-sand-200" title="Iterations executed per algorithm to compute median execution time">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-slate-400" />
                Runs
              </span>
              {[1, 3, 5, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setRuns(count);
                    executeBenchmark(selectedDatasetId, count);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                    runs === count
                      ? 'bg-white text-forest-950 shadow-soft-sm'
                      : 'text-slate-600 hover:text-forest-900'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Run Benchmark Button */}
            <button
              type="button"
              onClick={() => executeBenchmark(selectedDatasetId, runs)}
              disabled={loading || suiteLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-sm shadow-soft-sm hover:from-teal-500 hover:to-teal-400 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-4 h-4 fill-white ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Benchmarking…' : 'Run Benchmark'}</span>
            </button>

            {/* Run All Benchmarks Button */}
            <button
              type="button"
              onClick={executeAllBenchmarks}
              disabled={suiteLoading || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-forest-900 text-white font-bold text-sm shadow-soft-sm hover:bg-forest-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Execute all 5 benchmark scenarios sequentially"
            >
              <Layers className={`w-4 h-4 text-teal-400 ${suiteLoading ? 'animate-bounce' : ''}`} />
              <span>{suiteLoading ? 'Running Suite…' : 'Run All Benchmarks'}</span>
            </button>
          </div>
        </div>

        {/* ── Section C: Dataset Selector Tabs ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Select Benchmark Dataset Topology</span>
            </h2>
            <span className="text-xs text-slate-500">5 standard reproducible scenarios</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {BENCHMARK_DATASETS.map((dataset) => {
              const isSelected = dataset.id === selectedDatasetId;
              return (
                <button
                  key={dataset.id}
                  type="button"
                  onClick={() => handleDatasetChange(dataset.id)}
                  disabled={loading || suiteLoading}
                  className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-soft-sm'
                      : 'bg-white/80 border-forest-100 hover:border-teal-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-teal-100 text-teal-900' : 'bg-sand-200 text-slate-700'
                    }`}>
                      {dataset.stopsCount} Stops
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-forest-950 mt-1">
                    {dataset.name}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {dataset.tag}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Dataset Description Banner */}
          <div className="bg-sand-100/80 rounded-2xl px-4 py-3 border border-sand-200 flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-forest-950">{activeDatasetInfo.name} ({activeDatasetInfo.stopsCount} stops): </span>
              <span>{activeDatasetInfo.description}</span>
            </div>
          </div>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => executeBenchmark(selectedDatasetId, runs)}
              className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs"
            >
              Retry Benchmark
            </button>
          </div>
        )}

        {/* ── Section B: KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Best Performing Algorithm */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Best Performing</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            {loading ? (
              <div className="h-8 w-32 bg-sand-200 rounded animate-pulse my-2" />
            ) : (
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-forest-950 truncate">
                  {bestAlgoMeta.label}
                </div>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  Recommended ({bestAlgoMeta.complexity})
                </div>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-2">
              Determined by multi-criteria optimization
            </div>
          </div>

          {/* KPI 2: Best Optimization Distance */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Optimized Distance</span>
              <Route className="w-4 h-4 text-teal-600" />
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-sand-200 rounded animate-pulse my-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-forest-950 font-mono">
                  {bestMetric?.distanceKm?.toFixed(2) ?? '—'} <span className="text-sm font-semibold text-slate-500">km</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Haversine straight-line sum
                </div>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-2">
              Baseline: {baselineMetric?.distanceKm?.toFixed(2) ?? '—'} km
            </div>
          </div>

          {/* KPI 3: Distance Saved vs Baseline */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Distance Saved</span>
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            {loading ? (
              <div className="h-8 w-28 bg-sand-200 rounded animate-pulse my-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                  {Number(distanceSaved).toFixed(2)} <span className="text-sm font-semibold text-slate-500">km</span>
                </div>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span>-{Number(percentSaved).toFixed(1)}% vs Baseline</span>
                </div>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-2">
              Reduction in total travel itinerary
            </div>
          </div>

          {/* KPI 4: Best Algorithm Execution Time */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Median Latency</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-sand-200 rounded animate-pulse my-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-black text-forest-950 font-mono">
                  {bestMetric?.medianTimeMs !== undefined ? `${bestMetric.medianTimeMs.toFixed(3)}` : '—'} <span className="text-sm font-semibold text-slate-500">ms</span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Median over {runs} {runs === 1 ? 'iteration' : 'iterations'}
                </div>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-2">
              High-resolution CPU timing
            </div>
          </div>
        </div>

        {/* ── Section D: Algorithm Comparison Cards ────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Algorithm Performance Matrix</span>
            </h2>
            <span className="text-xs text-slate-500">
              {activeDatasetInfo.stopsCount} stops ({benchmarkResult?.runsExecuted || runs} runs)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Baseline */}
            <div className={`bg-white rounded-3xl border ${ALGO_DETAILS.baseline.borderClass} shadow-soft-sm p-6 relative flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order 1: Input Order
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${ALGO_DETAILS.baseline.badgeClass}`}>
                    Reference {ALGO_DETAILS.baseline.complexity}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-forest-950">Baseline Selection</h3>
                <p className="text-xs text-slate-500 mt-0.5">Visits stops in their raw unoptimized sequence.</p>

                {loading ? (
                  <div className="space-y-3 my-6 animate-pulse">
                    <div className="h-8 bg-sand-200 rounded" />
                    <div className="h-4 bg-sand-200 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="my-6 space-y-4">
                    <div>
                      <span className="text-xs text-slate-500">Total Distance</span>
                      <div className="text-3xl font-black text-forest-950 font-mono">
                        {baselineMetric?.distanceKm?.toFixed(2) ?? '—'} <span className="text-base font-normal text-slate-500">km</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Median Runtime</span>
                        <div className="text-sm font-bold text-forest-950 font-mono">
                          {baselineMetric?.medianTimeMs !== undefined ? `${baselineMetric.medianTimeMs.toFixed(3)} ms` : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Improvement</span>
                        <div className="text-sm font-bold text-slate-500">
                          0.0% (Base)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Iterations: 0</span>
                <span>Valid: {baselineMetric?.isValid ? 'Yes' : '—'}</span>
              </div>
            </div>

            {/* 2. Nearest Neighbor */}
            <div className={`bg-white rounded-3xl border ${
              bestAlgoKey === 'nearestNeighbor' ? 'border-amber-400 ring-2 ring-amber-400/20' : ALGO_DETAILS.nearestNeighbor.borderClass
            } shadow-soft-sm p-6 relative flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Order 2: Greedy Heuristic
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${ALGO_DETAILS.nearestNeighbor.badgeClass}`}>
                    {ALGO_DETAILS.nearestNeighbor.complexity}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-forest-950">Nearest Neighbor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Greedily visits the closest unvisited stop next.</p>

                {loading ? (
                  <div className="space-y-3 my-6 animate-pulse">
                    <div className="h-8 bg-sand-200 rounded" />
                    <div className="h-4 bg-sand-200 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="my-6 space-y-4">
                    <div>
                      <span className="text-xs text-slate-500">Total Distance</span>
                      <div className="text-3xl font-black text-forest-950 font-mono">
                        {nnMetric?.distanceKm?.toFixed(2) ?? '—'} <span className="text-base font-normal text-slate-500">km</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Median Runtime</span>
                        <div className="text-sm font-bold text-forest-950 font-mono">
                          {nnMetric?.medianTimeMs !== undefined ? `${nnMetric.medianTimeMs.toFixed(3)} ms` : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Distance Saved</span>
                        <div className="text-sm font-bold text-emerald-700 font-mono">
                          -{nnMetric?.improvementPercent?.toFixed(1) ?? '0.0'}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Iterations: {nnMetric?.iterations ?? '—'}</span>
                {bestAlgoKey === 'nearestNeighbor' ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Best Choice
                  </span>
                ) : (
                  <span>Valid: {nnMetric?.isValid ? 'Yes' : '—'}</span>
                )}
              </div>
            </div>

            {/* 3. 2-opt */}
            <div className={`bg-white rounded-3xl border ${
              bestAlgoKey === 'twoOpt' ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md' : ALGO_DETAILS.twoOpt.borderClass
            } shadow-soft-sm p-6 relative flex flex-col justify-between`}>
              {bestAlgoKey === 'twoOpt' && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Recommended
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Order 3: Local Search
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${ALGO_DETAILS.twoOpt.badgeClass}`}>
                    {ALGO_DETAILS.twoOpt.complexity}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-forest-950">Nearest Neighbor + 2-opt</h3>
                <p className="text-xs text-slate-500 mt-0.5">Iteratively uncrosses intersecting legs until local optimum.</p>

                {loading ? (
                  <div className="space-y-3 my-6 animate-pulse">
                    <div className="h-8 bg-sand-200 rounded" />
                    <div className="h-4 bg-sand-200 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="my-6 space-y-4">
                    <div>
                      <span className="text-xs text-slate-500">Total Distance</span>
                      <div className="text-3xl font-black text-forest-950 font-mono">
                        {twoOptMetric?.distanceKm?.toFixed(2) ?? '—'} <span className="text-base font-normal text-slate-500">km</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500">Median Runtime</span>
                        <div className="text-sm font-bold text-forest-950 font-mono">
                          {twoOptMetric?.medianTimeMs !== undefined ? `${twoOptMetric.medianTimeMs.toFixed(3)} ms` : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Improvement vs Base</span>
                        <div className="text-sm font-bold text-emerald-700 font-mono">
                          -{twoOptMetric?.improvementPercent?.toFixed(1) ?? '0.0'}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Iterations: {twoOptMetric?.iterations ?? '—'}</span>
                <span className="text-teal-700 font-bold">
                  {twoOptMetric?.twoOptOverNNPercent > 0
                    ? `-${twoOptMetric.twoOptOverNNPercent.toFixed(1)}% over NN`
                    : 'Non-worsening'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section E & F: Responsive Comparative Charts ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* E. Distance Comparison Chart */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-forest-950 flex items-center gap-2">
                  <Route className="w-4 h-4 text-teal-600" />
                  <span>Distance Comparison (Lower is Better)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Kilometres</span>
              </div>

              {loading ? (
                <div className="space-y-4 py-6 animate-pulse">
                  <div className="h-10 bg-sand-200 rounded-xl" />
                  <div className="h-10 bg-sand-200 rounded-xl" />
                  <div className="h-10 bg-sand-200 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-5 my-4">
                  {/* Baseline Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Baseline (Original Order)</span>
                      <span className="font-mono font-bold text-slate-800">
                        {baselineMetric?.distanceKm?.toFixed(2)} km
                      </span>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-slate-400 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(12, ((baselineMetric?.distanceKm || 0) / maxDistance) * 100)}%` }}
                      >
                        100%
                      </div>
                    </div>
                  </div>

                  {/* Nearest Neighbor Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-800">Nearest Neighbor</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-900">
                          {nnMetric?.distanceKm?.toFixed(2)} km
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          (-{nnMetric?.improvementPercent?.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-amber-500 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(12, ((nnMetric?.distanceKm || 0) / maxDistance) * 100)}%` }}
                      >
                        {((((nnMetric?.distanceKm || 0) / (baselineMetric?.distanceKm || 1))) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* 2-opt Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-teal-900 font-bold flex items-center gap-1">
                        2-opt Local Search
                        {bestAlgoKey === 'twoOpt' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-900">
                          {twoOptMetric?.distanceKm?.toFixed(2)} km
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          (-{twoOptMetric?.improvementPercent?.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(12, ((twoOptMetric?.distanceKm || 0) / maxDistance) * 100)}%` }}
                      >
                        {((((twoOptMetric?.distanceKm || 0) / (baselineMetric?.distanceKm || 1))) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> 2-opt saves {distanceSaved.toFixed(2)} km
              </span>
              <span>Metric: Haversine distance</span>
            </div>
          </div>

          {/* F. Execution Time Comparison Chart */}
          <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-forest-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>Execution Time Comparison (Median Runtime)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Milliseconds</span>
              </div>

              {loading ? (
                <div className="space-y-4 py-6 animate-pulse">
                  <div className="h-10 bg-sand-200 rounded-xl" />
                  <div className="h-10 bg-sand-200 rounded-xl" />
                  <div className="h-10 bg-sand-200 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-5 my-4">
                  {/* Baseline Timing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Baseline O(N)</span>
                      <span className="font-mono font-bold text-slate-800">
                        {baselineMetric?.medianTimeMs?.toFixed(3)} ms
                      </span>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-slate-400 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(10, ((baselineMetric?.medianTimeMs || 0.001) / maxTime) * 100)}%` }}
                      >
                        {baselineMetric?.medianTimeMs?.toFixed(3)} ms
                      </div>
                    </div>
                  </div>

                  {/* Nearest Neighbor Timing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-amber-800">Nearest Neighbor O(N²)</span>
                      <span className="font-mono font-bold text-amber-900">
                        {nnMetric?.medianTimeMs?.toFixed(3)} ms
                      </span>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-amber-500 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(12, ((nnMetric?.medianTimeMs || 0.001) / maxTime) * 100)}%` }}
                      >
                        {nnMetric?.medianTimeMs?.toFixed(3)} ms
                      </div>
                    </div>
                  </div>

                  {/* 2-opt Timing */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-teal-900 font-bold">2-opt Local Search O(K·N²)</span>
                      <span className="font-mono font-bold text-teal-900">
                        {twoOptMetric?.medianTimeMs?.toFixed(3)} ms
                      </span>
                    </div>
                    <div className="h-8 bg-sand-100 rounded-xl overflow-hidden p-1 flex items-center">
                      <div
                        className="h-full bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg transition-all duration-700 flex items-center px-2 text-[11px] font-bold text-white shadow-sm"
                        style={{ width: `${Math.max(15, ((twoOptMetric?.medianTimeMs || 0.001) / maxTime) * 100)}%` }}
                      >
                        {twoOptMetric?.medianTimeMs?.toFixed(3)} ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Runs: {runs} iterations with median filtering</span>
              <span className="font-mono text-[11px]">Sub-millisecond resolution</span>
            </div>
          </div>
        </div>

        {/* ── Section G: Detailed Benchmark Results Table ──────────────────── */}
        <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm overflow-hidden">
          <div className="p-6 border-b border-forest-100/60 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-forest-950 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Benchmark Verification Results</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact algorithmic metrics for {activeDatasetInfo.name} ({activeDatasetInfo.stopsCount} stops)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {benchmarkResult?.runsExecuted || runs} Iterations Tested
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand-50 border-b border-forest-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-6">Algorithm</th>
                  <th className="py-3 px-6">Complexity</th>
                  <th className="py-3 px-6">Optimization Distance</th>
                  <th className="py-3 px-6">Execution Time (Median)</th>
                  <th className="py-3 px-6">Time Range (Min – Max)</th>
                  <th className="py-3 px-6">Improvement</th>
                  <th className="py-3 px-6">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1: Baseline */}
                <tr className="hover:bg-sand-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-forest-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Baseline (Original)</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">O(N)</td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">
                    {baselineMetric?.distanceKm?.toFixed(2)} km
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-700">
                    {baselineMetric?.medianTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">
                    {baselineMetric?.minTimeMs?.toFixed(3)} – {baselineMetric?.maxTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 text-slate-400 font-semibold">0.0% (Ref)</td>
                  <td className="py-4 px-6">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      Baseline
                    </span>
                  </td>
                </tr>

                {/* Row 2: Nearest Neighbor */}
                <tr className={`hover:bg-sand-50/50 transition-colors ${bestAlgoKey === 'nearestNeighbor' ? 'bg-amber-50/40' : ''}`}>
                  <td className="py-4 px-6 font-bold text-forest-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Nearest Neighbor</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">O(N²)</td>
                  <td className="py-4 px-6 font-mono font-bold text-slate-900">
                    {nnMetric?.distanceKm?.toFixed(2)} km
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-700">
                    {nnMetric?.medianTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">
                    {nnMetric?.minTimeMs?.toFixed(3)} – {nnMetric?.maxTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-600 font-mono">
                    -{nnMetric?.improvementPercent?.toFixed(1)}%
                  </td>
                  <td className="py-4 px-6">
                    {bestAlgoKey === 'nearestNeighbor' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1 w-max">
                        <Award className="w-3 h-3" /> Recommended
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        Alternative
                      </span>
                    )}
                  </td>
                </tr>

                {/* Row 3: 2-opt */}
                <tr className={`hover:bg-sand-50/50 transition-colors ${bestAlgoKey === 'twoOpt' ? 'bg-teal-50/50' : ''}`}>
                  <td className="py-4 px-6 font-bold text-forest-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span>Nearest Neighbor + 2-opt</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">O(K·N²)</td>
                  <td className="py-4 px-6 font-mono font-bold text-teal-950">
                    {twoOptMetric?.distanceKm?.toFixed(2)} km
                  </td>
                  <td className="py-4 px-6 font-mono text-teal-800 font-bold">
                    {twoOptMetric?.medianTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">
                    {twoOptMetric?.minTimeMs?.toFixed(3)} – {twoOptMetric?.maxTimeMs?.toFixed(3)} ms
                  </td>
                  <td className="py-4 px-6 font-semibold text-emerald-600 font-mono">
                    -{twoOptMetric?.improvementPercent?.toFixed(1)}%
                  </td>
                  <td className="py-4 px-6">
                    {bestAlgoKey === 'twoOpt' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 font-bold border border-teal-300 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3 text-teal-600" /> Recommended
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                        Alternative
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section H: Dataset Insights ──────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h3 className="font-extrabold text-base text-forest-950">
              Analytical Dataset Insights & Tradeoffs
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 space-y-1.5">
              <span className="font-bold text-forest-950 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Optimization Efficacy:
              </span>
              <p>
                {recommendation?.reason ||
                  `${bestAlgoMeta.label} achieved the shortest route distance of ${bestMetric?.distanceKm?.toFixed(2)} km, delivering a ${percentSaved}% reduction compared to the raw selection baseline.`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 space-y-1.5">
              <span className="font-bold text-forest-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Computational Complexity & Latency:
              </span>
              <p>
                For {activeDatasetInfo.stopsCount} stops, Nearest Neighbor completed in {nnMetric?.medianTimeMs?.toFixed(3)} ms, while 2-opt completed in {twoOptMetric?.medianTimeMs?.toFixed(3)} ms ({twoOptMetric?.iterations || 0} iterations). Both operate well within real-time interactive thresholds (&lt; 20ms).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs text-forest-900 leading-relaxed">
            <span className="font-bold text-teal-950">Algorithmic Correctness Guarantee: </span>
            GeoBite implements deterministic tie-breaking and a non-worsening invariant for 2-opt local search (Distance 2-opt ≤ Distance NN). Start locations are preserved when pinned. Note that 2-opt resolves local crossings and delivers high-quality approximations, but does not guarantee the NP-hard global optimum for large instances.
          </div>
        </div>

        {/* ── Section 5: Multi-Dataset Suite Comparison ─────────────────────── */}
        <div className="bg-white rounded-3xl border border-forest-100 shadow-soft-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-bold mb-2">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Multi-Dataset Suite Evaluation</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-forest-950">
                Cross-Topology Scalability Suite
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Evaluate algorithm performance across all 5 benchmark datasets: Small (5), Medium (15), Large (40), Clustered (12), Dispersed (10).
              </p>
            </div>

            <button
              type="button"
              onClick={executeAllBenchmarks}
              disabled={suiteLoading || loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-forest-900 text-white font-bold text-sm shadow-soft-sm hover:bg-forest-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 text-teal-400 ${suiteLoading ? 'animate-spin' : ''}`} />
              <span>{suiteLoading ? 'Benchmarking Suite…' : 'Run All 5 Datasets'}</span>
            </button>
          </div>

          {/* Suite Progress Bar */}
          {suiteLoading && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-teal-900">
                <span>{suiteProgress.label}</span>
                <span>{suiteProgress.current} / {suiteProgress.total}</span>
              </div>
              <div className="w-full bg-teal-200/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(suiteProgress.current / suiteProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Suite Error */}
          {suiteError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              {suiteError}
            </div>
          )}

          {/* Multi-dataset comparison table */}
          {suiteResults && suiteResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand-50 border-b border-forest-100 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Dataset Topology</th>
                    <th className="py-3 px-4">Stops</th>
                    <th className="py-3 px-4">Baseline (km)</th>
                    <th className="py-3 px-4">Nearest Neighbor</th>
                    <th className="py-3 px-4">2-opt Local Search</th>
                    <th className="py-3 px-4">Best Performer</th>
                    <th className="py-3 px-4">Distance Reduction</th>
                    <th className="py-3 px-4">Winner Runtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suiteResults.map((item) => {
                    if (!item.success) {
                      return (
                        <tr key={item.id} className="bg-red-50/50">
                          <td className="py-4 px-4 font-bold text-red-900">{item.name}</td>
                          <td className="py-4 px-4 text-xs">{item.stopsCount}</td>
                          <td colSpan="6" className="py-4 px-4 text-xs text-red-600 italic">
                            Benchmark failed: {item.error}
                          </td>
                        </tr>
                      );
                    }

                    const m = item.data.metrics;
                    const rec = item.data.recommendation;
                    const winnerKey = rec?.recommendedAlgorithm || 'twoOpt';
                    const winnerMeta = ALGO_DETAILS[winnerKey] || ALGO_DETAILS.twoOpt;
                    const winnerMetric = m?.[winnerKey];

                    return (
                      <tr key={item.id} className="hover:bg-sand-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-forest-950">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.tag}</div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-xs text-slate-700">
                          {item.stopsCount}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-800">
                          {m?.baseline?.distanceKm?.toFixed(2)} km
                        </td>
                        <td className="py-4 px-4 font-mono text-amber-900">
                          {m?.nearestNeighbor?.distanceKm?.toFixed(2)} km
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-teal-950">
                          {m?.twoOpt?.distanceKm?.toFixed(2)} km
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${winnerMeta.badgeClass}`}>
                            {winnerMeta.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                          -{rec?.improvementPercent?.toFixed(1) ?? m?.twoOpt?.improvementPercent?.toFixed(1)}%
                          <span className="text-[11px] text-slate-500 ml-1">
                            ({rec?.distanceSavedKm?.toFixed(2) ?? m?.twoOpt?.distanceSavedKm?.toFixed(2)} km)
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-700">
                          {winnerMetric?.medianTimeMs?.toFixed(3)} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-sand-50 rounded-2xl border border-dashed border-sand-300">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-forest-950">No Multi-Dataset Results Yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Click &ldquo;Run All 5 Datasets&rdquo; above to execute and compare all 5 standard benchmarks in one consolidated view.
              </p>
              <button
                type="button"
                onClick={executeAllBenchmarks}
                disabled={suiteLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-800 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Suite Now</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Route Planner Link Callout ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <Route className="w-5 h-5 text-teal-400" />
              <span>Ready to plan custom multi-stop routes?</span>
            </h3>
            <p className="text-xs sm:text-sm text-sand-200 max-w-xl">
              Switch to the interactive Route Planner to pick real Bengaluru spots, pin departure hubs, inspect real OSRM road driving geometry, and view turn-by-turn distance estimates.
            </p>
          </div>
          <Link
            to="/route"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 text-forest-950 font-extrabold text-sm hover:bg-teal-400 transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>Open Route Planner</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
