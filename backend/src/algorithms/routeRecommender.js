/**
 * GeoBite — Route Recommendation Engine
 *
 * Provides decoupled, deterministic logic to evaluate and recommend
 * the optimal route among Baseline, Nearest Neighbor, and 2-opt solutions.
 *
 * Core Guarantees:
 * 1. Recommends the route with the lowest valid total distance.
 * 2. Deterministic tie-breaking: when distances are numerically equivalent (within 1e-4 km),
 *    prefers twoOpt > nearestNeighbor > baseline.
 * 3. Never recommends an invalid or incomplete route (validates stop count and uniqueness).
 * 4. Division-by-zero resilience: safely handles zero-distance routes.
 * 5. Calculates exact percentage improvements over Baseline and between 2-opt and Nearest Neighbor.
 */

const TIE_BREAK_PRIORITY = {
  twoOpt: 0,
  nearestNeighbor: 1,
  baseline: 2,
};

/**
 * Validate that an algorithm result contains a complete, non-corrupted route.
 * @param {Object} result - Algorithm result object
 * @param {number|null} expectedStopCount - Expected number of stops
 * @returns {boolean} True if route is valid and complete
 */
export function isValidRouteResult(result, expectedStopCount = null) {
  if (!result || typeof result !== 'object') return false;

  // Total distance must be a finite, non-negative number
  if (
    typeof result.totalDistanceKm !== 'number' ||
    !Number.isFinite(result.totalDistanceKm) ||
    result.totalDistanceKm < 0
  ) {
    return false;
  }

  // Ordered place IDs must be an array
  if (!Array.isArray(result.orderedPlaceIds)) return false;

  // Check expected stop count if provided
  if (expectedStopCount !== null && result.orderedPlaceIds.length !== expectedStopCount) {
    return false;
  }

  // No duplicate stops allowed
  const uniqueCount = new Set(result.orderedPlaceIds).size;
  if (uniqueCount !== result.orderedPlaceIds.length) {
    return false;
  }

  return true;
}

/**
 * Calculate distance savings and percentage improvements across algorithms.
 * Division-by-zero safe.
 *
 * @param {number} baselineDistanceKm
 * @param {number} nearestNeighborDistanceKm
 * @param {number} twoOptDistanceKm
 * @returns {Object} Comprehensive improvement metrics
 */
export function calculateRouteImprovements(
  baselineDistanceKm,
  nearestNeighborDistanceKm,
  twoOptDistanceKm
) {
  const base = Math.max(0, Number(baselineDistanceKm) || 0);
  const nn = Math.max(0, Number(nearestNeighborDistanceKm) || 0);
  const twoOpt = Math.max(0, Number(twoOptDistanceKm) || 0);

  // Improvement over baseline
  const nnSavedOverBaselineKm = Number(Math.max(0, base - nn).toFixed(3));
  const nnImprovementPercent =
    base > 0
      ? Number((((base - nn) / base) * 100).toFixed(2))
      : 0.0;

  const twoOptSavedOverBaselineKm = Number(Math.max(0, base - twoOpt).toFixed(3));
  const twoOptImprovementPercent =
    base > 0
      ? Number((((base - twoOpt) / base) * 100).toFixed(2))
      : 0.0;

  // Additional improvement of 2-opt over Nearest Neighbor
  const twoOptSavedOverNNKm = Number(Math.max(0, nn - twoOpt).toFixed(3));
  const twoOptOverNNPercent =
    nn > 0
      ? Number((((nn - twoOpt) / nn) * 100).toFixed(2))
      : 0.0;

  return {
    baselineDistanceKm: Number(base.toFixed(3)),
    nearestNeighborDistanceKm: Number(nn.toFixed(3)),
    twoOptDistanceKm: Number(twoOpt.toFixed(3)),
    nnSavedOverBaselineKm,
    nnImprovementPercent,
    twoOptSavedOverBaselineKm,
    twoOptImprovementPercent,
    twoOptSavedOverNNKm,
    twoOptOverNNPercent,
  };
}

/**
 * Compare all algorithm results and select the recommended route.
 *
 * Selection Rules:
 * 1. Filter to valid candidates only.
 * 2. Sort by totalDistanceKm ascending.
 * 3. Break numerical ties (within 1e-4 km) using TIE_BREAK_PRIORITY (twoOpt > nearestNeighbor > baseline).
 *
 * @param {Object} results
 * @param {Object} results.baseline - Result from solveBaseline
 * @param {Object} results.nearestNeighbor - Result from solveNearestNeighbor
 * @param {Object} results.twoOpt - Result from solveTwoOpt
 * @param {number|null} [expectedStopCount=null] - Expected number of stops
 * @returns {Object} Recommendation result with explanation
 */
export function recommendBestRoute(results = {}, expectedStopCount = null) {
  const { baseline, nearestNeighbor, twoOpt } = results;

  const candidateEntries = [
    { key: 'baseline', result: baseline },
    { key: 'nearestNeighbor', result: nearestNeighbor },
    { key: 'twoOpt', result: twoOpt },
  ];

  // 1. Filter out invalid candidates
  const validCandidates = candidateEntries.filter(({ result }) =>
    isValidRouteResult(result, expectedStopCount)
  );

  if (validCandidates.length === 0) {
    throw new Error('No valid route candidate available for recommendation.');
  }

  // 2. Sort candidates by distance, with deterministic tie-breaking
  validCandidates.sort((a, b) => {
    const distA = a.result.totalDistanceKm;
    const distB = b.result.totalDistanceKm;
    const diff = distA - distB;

    // If difference is significant (> 0.1 meter), pick lower distance
    if (Math.abs(diff) > 1e-4) {
      return diff;
    }

    // Deterministic tie-breaker
    const prioA = TIE_BREAK_PRIORITY[a.key] ?? 99;
    const prioB = TIE_BREAK_PRIORITY[b.key] ?? 99;
    return prioA - prioB;
  });

  const bestEntry = validCandidates[0];
  const bestKey = bestEntry.key;
  const bestRoute = bestEntry.result;

  // 3. Compute relative improvement metrics
  const baseDist = baseline?.totalDistanceKm ?? bestRoute.totalDistanceKm;
  const nnDist = nearestNeighbor?.totalDistanceKm ?? bestRoute.totalDistanceKm;
  const twoOptDist = twoOpt?.totalDistanceKm ?? bestRoute.totalDistanceKm;

  const improvements = calculateRouteImprovements(baseDist, nnDist, twoOptDist);

  // 4. Formulate human-readable reason
  let reason = '';
  if (baseDist <= 0) {
    reason = 'All stops share identical coordinates or route has zero distance.';
  } else if (bestKey === 'twoOpt') {
    if (improvements.twoOptSavedOverNNKm > 0.001) {
      reason = `2-opt reduced distance by ${improvements.twoOptSavedOverBaselineKm} km (${improvements.twoOptImprovementPercent}%) over Baseline, and an additional ${improvements.twoOptSavedOverNNKm} km (${improvements.twoOptOverNNPercent}%) over Nearest Neighbor.`;
    } else if (improvements.twoOptSavedOverBaselineKm > 0.001) {
      reason = `2-opt and Nearest Neighbor achieved identical distance (${bestRoute.totalDistanceKm} km), reducing distance by ${improvements.twoOptSavedOverBaselineKm} km (${improvements.twoOptImprovementPercent}%) over Baseline. 2-opt verified local 2-optimality.`;
    } else {
      reason = 'All algorithms produced identical path distance; Baseline order was already locally optimal.';
    }
  } else if (bestKey === 'nearestNeighbor') {
    reason = `Nearest Neighbor achieved the shortest path (${bestRoute.totalDistanceKm} km), saving ${improvements.nnSavedOverBaselineKm} km (${improvements.nnImprovementPercent}%) over Baseline.`;
  } else {
    reason = 'Original user selection was already optimal or no shorter sequence was found.';
  }

  return {
    recommendedAlgorithm: bestKey,
    bestRoute,
    improvements,
    distanceSavedKm: Number(Math.max(0, baseDist - bestRoute.totalDistanceKm).toFixed(3)),
    improvementPercent: improvements.twoOptImprovementPercent,
    reason,
  };
}

