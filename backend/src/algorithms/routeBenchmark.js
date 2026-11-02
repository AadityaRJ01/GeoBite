import { performance } from 'perf_hooks';
import {
  solveBaseline,
  solveNearestNeighbor,
  solveTwoOpt,
} from './routeOptimizer.js';
import { recommendBestRoute, isValidRouteResult } from './routeRecommender.js';

/**
 * Standard Deterministic Benchmark Datasets
 * All coordinates are fixed and reproducible.
 */
export const BENCHMARK_DATASETS = {
  // Scenario A: Small route (5 stops, Central Bengaluru)
  small: {
    id: 'small',
    name: 'Dataset A: Small Route (5 stops)',
    description: 'Central Bengaluru culinary and cultural route with 5 stops',
    places: [
      { id: 'sm-1', name: 'MG Road Metro', latitude: 12.9756, longitude: 77.6066 },
      { id: 'sm-2', name: 'Cubbon Park', latitude: 12.9763, longitude: 77.5929 },
      { id: 'sm-3', name: 'Karavalli', latitude: 12.9718, longitude: 77.5988 },
      { id: 'sm-4', name: 'Truffles St Marks', latitude: 12.9715, longitude: 77.6010 },
      { id: 'sm-5', name: 'Lalbagh Botanical Garden', latitude: 12.9494, longitude: 77.5852 },
    ],
  },

  // Scenario B: Medium route (15 stops across Bengaluru neighborhoods)
  medium: {
    id: 'medium',
    name: 'Dataset B: Medium Route (15 stops)',
    description: '15 stops distributed across diverse Bengaluru neighborhoods',
    places: [
      { id: 'md-01', name: 'MG Road', latitude: 12.9756, longitude: 77.6066 },
      { id: 'md-02', name: 'Indiranagar 100ft Rd', latitude: 12.9719, longitude: 77.6412 },
      { id: 'md-03', name: 'Koramangala 5th Block', latitude: 12.9345, longitude: 77.6200 },
      { id: 'md-04', name: 'Jayanagar 4th Block', latitude: 12.9299, longitude: 77.5834 },
      { id: 'md-05', name: 'JP Nagar Mini Forest', latitude: 12.9063, longitude: 77.5857 },
      { id: 'md-06', name: 'Basavanagudi Bull Temple', latitude: 12.9421, longitude: 77.5683 },
      { id: 'md-07', name: 'Mavalli Tiffin Room', latitude: 12.9493, longitude: 77.5812 },
      { id: 'md-08', name: 'Cubbon Park High Court', latitude: 12.9779, longitude: 77.5912 },
      { id: 'md-09', name: 'Malleshwaram 8th Cross', latitude: 13.0033, longitude: 77.5694 },
      { id: 'md-10', name: 'Sankey Tank High Grounds', latitude: 13.0101, longitude: 77.5742 },
      { id: 'md-11', name: 'Sadashivanagar', latitude: 13.0069, longitude: 77.5803 },
      { id: 'md-12', name: 'Hebbal Flyover', latitude: 13.0358, longitude: 77.5970 },
      { id: 'md-13', name: 'Ulsoor Lake', latitude: 12.9825, longitude: 77.6180 },
      { id: 'md-14', name: 'Commercial Street', latitude: 12.9822, longitude: 77.6083 },
      { id: 'md-15', name: 'Frazer Town Mosque Rd', latitude: 12.9984, longitude: 77.6148 },
    ],
  },

  // Scenario C: Large route (40 stops across Greater Bengaluru)
  large: {
    id: 'large',
    name: 'Dataset C: Large Route (40 stops)',
    description: '40 stops across Greater Bengaluru testing scalability',
    places: Array.from({ length: 40 }, (_, i) => ({
      id: `lg-${String(i + 1).padStart(2, '0')}`,
      name: `Greater Bengaluru Spot ${i + 1}`,
      latitude: Number((12.9000 + (i % 8) * 0.02 + Math.sin(i * 1.3) * 0.008).toFixed(4)),
      longitude: Number((77.5000 + Math.floor(i / 8) * 0.03 + Math.cos(i * 1.3) * 0.008).toFixed(4)),
    })),
  },

  // Scenario D: Clustered locations (12 stops concentrated within ~600m in Indiranagar)
  clustered: {
    id: 'clustered',
    name: 'Dataset D: Clustered Locations (12 stops)',
    description: '12 stops densely packed within a 600m commercial micro-cluster',
    places: [
      { id: 'cl-01', name: 'Cluster Hub 1', latitude: 12.9710, longitude: 77.6390 },
      { id: 'cl-02', name: 'Cluster Hub 2', latitude: 12.9714, longitude: 77.6394 },
      { id: 'cl-03', name: 'Cluster Hub 3', latitude: 12.9718, longitude: 77.6398 },
      { id: 'cl-04', name: 'Cluster Hub 4', latitude: 12.9722, longitude: 77.6402 },
      { id: 'cl-05', name: 'Cluster Hub 5', latitude: 12.9726, longitude: 77.6406 },
      { id: 'cl-06', name: 'Cluster Hub 6', latitude: 12.9730, longitude: 77.6410 },
      { id: 'cl-07', name: 'Cluster Hub 7', latitude: 12.9734, longitude: 77.6414 },
      { id: 'cl-08', name: 'Cluster Hub 8', latitude: 12.9738, longitude: 77.6418 },
      { id: 'cl-09', name: 'Cluster Hub 9', latitude: 12.9742, longitude: 77.6422 },
      { id: 'cl-10', name: 'Cluster Hub 10', latitude: 12.9746, longitude: 77.6426 },
      { id: 'cl-11', name: 'Cluster Hub 11', latitude: 12.9750, longitude: 77.6430 },
      { id: 'cl-12', name: 'Cluster Hub 12', latitude: 12.9754, longitude: 77.6434 },
    ],
  },

  // Scenario E: Dispersed locations (10 major regional hubs across Karnataka)
  dispersed: {
    id: 'dispersed',
    name: 'Dataset E: Dispersed Locations (10 regional hubs)',
    description: '10 widely separated stops distributed across Karnataka (50–400 km apart)',
    places: [
      { id: 'dp-01', name: 'Bengaluru MG Road', latitude: 12.9716, longitude: 77.5946 },
      { id: 'dp-02', name: 'Nandi Hills Chikkaballapur', latitude: 13.3702, longitude: 77.6835 },
      { id: 'dp-03', name: 'Mysuru Palace', latitude: 12.3051, longitude: 76.6551 },
      { id: 'dp-04', name: 'Hassan Belur', latitude: 13.0033, longitude: 76.1004 },
      { id: 'dp-05', name: 'Shivamogga Jog Falls', latitude: 14.2285, longitude: 74.8124 },
      { id: 'dp-06', name: 'Mangaluru Panambur', latitude: 12.9141, longitude: 74.8560 },
      { id: 'dp-07', name: 'Udupi Krishna Temple', latitude: 13.3409, longitude: 74.7421 },
      { id: 'dp-08', name: 'Hubballi Dharwad', latitude: 15.3647, longitude: 75.1240 },
      { id: 'dp-09', name: 'Belagavi Fort', latitude: 15.8497, longitude: 74.4977 },
      { id: 'dp-10', name: 'Ballari Hampi Heritage', latitude: 15.3350, longitude: 76.4600 },
    ],
  },
};

/**
 * Calculate median of a numeric array.
 * @param {number[]} numbers
 * @returns {number}
 */
export function calculateMedian(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0.0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2.0).toFixed(3));
  }
  return Number(sorted[mid].toFixed(3));
}

/**
 * Benchmark a specific dataset across Baseline, Nearest Neighbor, and 2-opt.
 * Executes multiple runs to calculate median execution time and minimize JIT / system jitter.
 *
 * @param {Array<Object>} places - List of stop records
 * @param {string} datasetName - Descriptive scenario label
 * @param {Object} [options]
 * @param {number} [options.runs=5] - Number of iterations for timing measurement (clamped to 1-10)
 * @param {string|null} [options.startPlaceId=null] - Fixed start stop ID
 * @param {boolean} [options.fixStart=true] - Whether to preserve start stop
 * @returns {Object} Structured benchmark metrics
 */
export function benchmarkDataset(places, datasetName = 'Custom Route', options = {}) {
  const safePlaces = Array.isArray(places) ? places : [];
  const stopCount = safePlaces.length;

  // Bound benchmark runs to prevent runaway execution
  const runs = Math.max(1, Math.min(10, Number(options.runs) || 5));
  const startPlaceId = options.startPlaceId || safePlaces[0]?.id || null;
  const fixStart = options.fixStart !== false;

  const baselineTimes = [];
  const nnTimes = [];
  const twoOptTimes = [];

  let lastBaselineResult = null;
  let lastNNResult = null;
  let lastTwoOptResult = null;

  for (let r = 0; r < runs; r++) {
    // 1. Baseline
    const t0 = performance.now();
    lastBaselineResult = solveBaseline(safePlaces);
    baselineTimes.push(performance.now() - t0);

    // 2. Nearest Neighbor
    const t1 = performance.now();
    lastNNResult = solveNearestNeighbor(safePlaces, startPlaceId, lastBaselineResult.totalDistanceKm);
    nnTimes.push(performance.now() - t1);

    // 3. 2-opt
    const t2 = performance.now();
    lastTwoOptResult = solveTwoOpt(lastNNResult.orderedPlaces, fixStart, lastBaselineResult.totalDistanceKm);
    twoOptTimes.push(performance.now() - t2);
  }

  // Validate results
  const isBaselineValid = isValidRouteResult(lastBaselineResult, stopCount);
  const isNNValid = isValidRouteResult(lastNNResult, stopCount);
  const isTwoOptValid = isValidRouteResult(lastTwoOptResult, stopCount);

  // Compute recommendation
  const recommendation = recommendBestRoute(
    {
      baseline: lastBaselineResult,
      nearestNeighbor: lastNNResult,
      twoOpt: lastTwoOptResult,
    },
    stopCount
  );

  return {
    datasetName,
    stopCount,
    runsExecuted: runs,
    metrics: {
      baseline: {
        algorithm: 'baseline',
        name: 'Original Selection (Baseline)',
        distanceKm: lastBaselineResult.totalDistanceKm,
        medianTimeMs: calculateMedian(baselineTimes),
        minTimeMs: Number(Math.min(...baselineTimes).toFixed(3)),
        maxTimeMs: Number(Math.max(...baselineTimes).toFixed(3)),
        improvementPercent: 0.0,
        iterations: 0,
        isValid: isBaselineValid,
      },
      nearestNeighbor: {
        algorithm: 'nearestNeighbor',
        name: 'Nearest Neighbor',
        distanceKm: lastNNResult.totalDistanceKm,
        medianTimeMs: calculateMedian(nnTimes),
        minTimeMs: Number(Math.min(...nnTimes).toFixed(3)),
        maxTimeMs: Number(Math.max(...nnTimes).toFixed(3)),
        improvementPercent: recommendation.improvements.nnImprovementPercent,
        distanceSavedKm: recommendation.improvements.nnSavedOverBaselineKm,
        iterations: lastNNResult.iterations,
        isValid: isNNValid,
      },
      twoOpt: {
        algorithm: 'twoOpt',
        name: 'Nearest Neighbor + 2-opt',
        distanceKm: lastTwoOptResult.totalDistanceKm,
        medianTimeMs: calculateMedian(twoOptTimes),
        minTimeMs: Number(Math.min(...twoOptTimes).toFixed(3)),
        maxTimeMs: Number(Math.max(...twoOptTimes).toFixed(3)),
        improvementPercent: recommendation.improvements.twoOptImprovementPercent,
        twoOptOverNNPercent: recommendation.improvements.twoOptOverNNPercent,
        distanceSavedKm: recommendation.improvements.twoOptSavedOverBaselineKm,
        iterations: lastTwoOptResult.iterations,
        isValid: isTwoOptValid,
      },
    },
    recommendation: {
      recommendedAlgorithm: recommendation.recommendedAlgorithm,
      distanceSavedKm: recommendation.distanceSavedKm,
      improvementPercent: recommendation.improvementPercent,
      twoOptOverNNPercent: recommendation.improvements.twoOptOverNNPercent,
      reason: recommendation.reason,
    },
  };
}

/**
 * Execute benchmarks across all 5 standard datasets (Small, Medium, Large, Clustered, Dispersed).
 * @param {Object} [options]
 * @param {number} [options.runs=5]
 * @returns {Object} Comprehensive suite benchmark report
 */
export function runStandardBenchmarkSuite(options = {}) {
  const runs = Math.max(1, Math.min(10, Number(options.runs) || 5));
  const startTime = performance.now();

  const scenarios = Object.keys(BENCHMARK_DATASETS).map((key) => {
    const dataset = BENCHMARK_DATASETS[key];
    return benchmarkDataset(dataset.places, dataset.name, { ...options, runs });
  });

  const totalTimeMs = Number((performance.now() - startTime).toFixed(3));

  return {
    suiteName: 'GeoBite Route Optimization Benchmark Suite',
    timestamp: new Date().toISOString(),
    runsPerAlgorithm: runs,
    scenarioCount: scenarios.length,
    totalBenchmarkTimeMs: totalTimeMs,
    scenarios,
  };
}

