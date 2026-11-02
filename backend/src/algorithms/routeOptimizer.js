import { performance } from 'perf_hooks';

/**
 * GeoBite Route Optimization Engine
 *
 * Provides modular algorithm implementations:
 * 1. Haversine great-circle distance
 * 2. Baseline user-order route evaluation
 * 3. Nearest Neighbor heuristic
 * 4. 2-opt local search heuristic
 *
 * NOTE: All calculated distances are estimated straight-line (great-circle)
 * distances, not actual road/turn-by-turn routes. The distance calculation is
 * abstracted so that a road-routing provider (OSRM, Mapbox, Google Maps) can
 * be easily plugged in as a drop-in replacement.
 */

export const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculate great-circle distance between two geographic coordinates using the Haversine formula.
 *
 * Numerical stability & edge cases:
 * - Latitude must be finite and within [-90, 90] degrees.
 * - Longitude must be finite and within [-180, 180] degrees.
 * - Identical coordinates return 0.0 immediately.
 * - Clamps Haversine intermediate 'a' to [0, 1] to avoid NaN from floating-point overflow.
 *
 * @param {{ latitude: number, longitude: number }} coord1
 * @param {{ latitude: number, longitude: number }} coord2
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(coord1, coord2) {
  if (
    !coord1 ||
    !coord2 ||
    typeof coord1.latitude !== 'number' ||
    typeof coord1.longitude !== 'number' ||
    typeof coord2.latitude !== 'number' ||
    typeof coord2.longitude !== 'number' ||
    !Number.isFinite(coord1.latitude) ||
    !Number.isFinite(coord1.longitude) ||
    !Number.isFinite(coord2.latitude) ||
    !Number.isFinite(coord2.longitude)
  ) {
    throw new Error('Invalid coordinate format for Haversine distance calculation.');
  }

  if (
    coord1.latitude < -90 ||
    coord1.latitude > 90 ||
    coord2.latitude < -90 ||
    coord2.latitude > 90 ||
    coord1.longitude < -180 ||
    coord1.longitude > 180 ||
    coord2.longitude < -180 ||
    coord2.longitude > 180
  ) {
    throw new Error('Coordinate out of valid bounds (latitude [-90, 90], longitude [-180, 180]).');
  }

  // Fast-path: Identical coordinates have exactly zero distance
  if (
    coord1.latitude === coord2.latitude &&
    coord1.longitude === coord2.longitude
  ) {
    return 0.0;
  }

  const lat1 = (coord1.latitude * Math.PI) / 180.0;
  const lon1 = (coord1.longitude * Math.PI) / 180.0;
  const lat2 = (coord2.latitude * Math.PI) / 180.0;
  const lon2 = (coord2.longitude * Math.PI) / 180.0;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const sinDLat2 = Math.sin(dLat / 2.0);
  const sinDLon2 = Math.sin(dLon / 2.0);

  const a =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2;

  // Numerically stable clamp to [0, 1] to avoid Math.sqrt of negative or NaN
  const clampedA = Math.max(0.0, Math.min(1.0, a));
  const c = 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1.0 - clampedA));

  return EARTH_RADIUS_KM * c;
}

/**
 * Compute route legs and cumulative distance for an ordered list of place objects.
 * @param {Array<Object>} orderedPlaces - Array of place records
 * @returns {{ legs: Array, totalDistanceKm: number, totalDistanceMeters: number, rawDistanceKm: number }}
 */
export function computeRouteLegs(orderedPlaces) {
  if (!Array.isArray(orderedPlaces) || orderedPlaces.length < 2) {
    return {
      legs: [],
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
      rawDistanceKm: 0,
    };
  }

  const legs = [];
  let totalDistanceKm = 0;

  for (let i = 0; i < orderedPlaces.length - 1; i++) {
    const from = orderedPlaces[i];
    const to = orderedPlaces[i + 1];

    const distKm = haversineDistance(
      { latitude: from.latitude, longitude: from.longitude },
      { latitude: to.latitude, longitude: to.longitude }
    );

    totalDistanceKm += distKm;

    legs.push({
      legIndex: i + 1,
      fromPlaceId: from.id,
      fromPlaceName: from.name,
      toPlaceId: to.id,
      toPlaceName: to.name,
      fromCoordinates: [from.latitude, from.longitude],
      toCoordinates: [to.latitude, to.longitude],
      distanceKm: Number(distKm.toFixed(3)),
      distanceMeters: Math.round(distKm * 1000),
    });
  }

  return {
    legs,
    totalDistanceKm: Number(totalDistanceKm.toFixed(3)),
    totalDistanceMeters: Math.round(totalDistanceKm * 1000),
    rawDistanceKm: totalDistanceKm,
  };
}

/**
 * Algorithm A: Baseline (Original User Selection Order)
 * Evaluates the total distance and legs for places in the input sequence.
 * Time complexity: O(N) where N is number of stops.
 *
 * @param {Array<Object>} places
 * @returns {Object} Route result
 */
export function solveBaseline(places) {
  const startTime = performance.now();

  const safePlaces = Array.isArray(places) ? places : [];
  const { legs, totalDistanceKm, totalDistanceMeters } = computeRouteLegs(safePlaces);

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  return {
    algorithm: 'baseline',
    name: 'Original Selection (Baseline)',
    orderedPlaceIds: safePlaces.map((p) => p.id),
    orderedPlaces: safePlaces,
    orderedCoordinates: safePlaces.map((p) => [p.latitude, p.longitude]),
    legs,
    totalDistanceKm,
    totalDistanceMeters,
    executionTimeMs,
    improvementPercent: 0,
    iterations: 0,
    stopCount: safePlaces.length,
  };
}

/**
 * Algorithm B: Nearest Neighbor
 * Starts at the selected starting place (or first place in list), then repeatedly
 * visits the closest unvisited place until all stops are visited.
 *
 * Determinism & Correctness:
 * - Equal-distance ties are broken deterministically by string comparison of place ID.
 * - Handles zero stops, one stop, two stops gracefully.
 * - Handles duplicate coordinates without skipping stops.
 * - Ensures every stop is visited exactly once.
 *
 * Time complexity: O(N^2) where N is number of stops.
 *
 * @param {Array<Object>} places - List of place records
 * @param {string|null} [startPlaceId=null] - Optional starting place ID
 * @param {number|null} [baselineDistanceKm=null] - Baseline distance for improvement calculation
 * @returns {Object} Route result
 */
export function solveNearestNeighbor(places, startPlaceId = null, baselineDistanceKm = null) {
  const startTime = performance.now();

  if (!Array.isArray(places)) {
    throw new Error('Places parameter must be an array.');
  }

  // Gracefully handle 0 stops
  if (places.length === 0) {
    const endTime = performance.now();
    return {
      algorithm: 'nearestNeighbor',
      name: 'Nearest Neighbor',
      orderedPlaceIds: [],
      orderedPlaces: [],
      orderedCoordinates: [],
      legs: [],
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
      executionTimeMs: Number((endTime - startTime).toFixed(3)),
      improvementPercent: 0,
      iterations: 0,
      stopCount: 0,
    };
  }

  // Gracefully handle 1 stop
  if (places.length === 1) {
    const endTime = performance.now();
    return {
      algorithm: 'nearestNeighbor',
      name: 'Nearest Neighbor',
      orderedPlaceIds: [places[0].id],
      orderedPlaces: [places[0]],
      orderedCoordinates: [[places[0].latitude, places[0].longitude]],
      legs: [],
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
      executionTimeMs: Number((endTime - startTime).toFixed(3)),
      improvementPercent: 0,
      iterations: 0,
      stopCount: 1,
    };
  }

  // Determine starting index
  let startIndex = 0;
  if (startPlaceId) {
    const idx = places.findIndex((p) => p.id === startPlaceId);
    if (idx !== -1) {
      startIndex = idx;
    }
  }

  const unvisited = [...places];
  const route = [unvisited.splice(startIndex, 1)[0]];

  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const dist = haversineDistance(
        { latitude: current.latitude, longitude: current.longitude },
        { latitude: candidate.latitude, longitude: candidate.longitude }
      );

      if (dist < shortestDist - 1e-9) {
        shortestDist = dist;
        nearestIndex = i;
      } else if (Math.abs(dist - shortestDist) <= 1e-9) {
        // Deterministic tie-breaking: compare place IDs lexicographically
        const currentBest = unvisited[nearestIndex];
        const candidateId = String(candidate.id ?? '');
        const currentBestId = String(currentBest.id ?? '');
        if (candidateId.localeCompare(currentBestId) < 0) {
          shortestDist = dist;
          nearestIndex = i;
        }
      }
    }

    route.push(unvisited.splice(nearestIndex, 1)[0]);
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));
  const { legs, totalDistanceKm, totalDistanceMeters } = computeRouteLegs(route);

  const baseDist = typeof baselineDistanceKm === 'number' ? baselineDistanceKm : totalDistanceKm;
  const improvementPercent =
    baseDist > 0
      ? Number((((baseDist - totalDistanceKm) / baseDist) * 100).toFixed(1))
      : 0;

  return {
    algorithm: 'nearestNeighbor',
    name: 'Nearest Neighbor',
    orderedPlaceIds: route.map((p) => p.id),
    orderedPlaces: route,
    orderedCoordinates: route.map((p) => [p.latitude, p.longitude]),
    legs,
    totalDistanceKm,
    totalDistanceMeters,
    executionTimeMs,
    improvementPercent,
    iterations: route.length - 1,
    stopCount: route.length,
  };
}

/**
 * Algorithm C: 2-opt Local Search Heuristic
 * Takes an initial route (typically from Nearest Neighbor) and iteratively
 * reverses intermediate segments whenever doing so reduces the total path distance.
 *
 * Guarantees & Properties:
 * - Preserves start location at index 0 when `fixStart` is true.
 * - Reverses subsegments to eliminate crossings in open path routing.
 * - Accept a change ONLY when it strictly improves the route (delta < -1e-7 km).
 * - Never loses or duplicates any stops (pure slice reversal).
 * - Final route is guaranteed never to exceed input route distance.
 * - Safety iteration limit (default: 500) prevents infinite loops.
 *
 * Time complexity: O(K * N^2) where K is number of improvement iterations and N is number of stops.
 *
 * @param {Array<Object>} initialRoute - Initial route to improve
 * @param {boolean} [fixStart=true] - Whether to preserve the initial departure stop at index 0
 * @param {number|null} [baselineDistanceKm=null] - Baseline distance for improvement percentage
 * @param {number} [maxIterations=500] - Safety iteration bound
 * @returns {Object} Route result
 */
export function solveTwoOpt(
  initialRoute,
  fixStart = true,
  baselineDistanceKm = null,
  maxIterations = 500
) {
  const startTime = performance.now();

  if (!Array.isArray(initialRoute)) {
    throw new Error('Initial route parameter must be an array.');
  }

  // Gracefully handle 0, 1, or 2 stops
  if (initialRoute.length <= 2) {
    const endTime = performance.now();
    const { legs, totalDistanceKm, totalDistanceMeters } = computeRouteLegs(initialRoute);
    const baseDist = typeof baselineDistanceKm === 'number' ? baselineDistanceKm : totalDistanceKm;
    const improvementPercent =
      baseDist > 0
        ? Number((((baseDist - totalDistanceKm) / baseDist) * 100).toFixed(1))
        : 0;

    return {
      algorithm: 'twoOpt',
      name: 'Nearest Neighbor + 2-opt',
      orderedPlaceIds: initialRoute.map((p) => p.id),
      orderedPlaces: initialRoute,
      orderedCoordinates: initialRoute.map((p) => [p.latitude, p.longitude]),
      legs,
      totalDistanceKm,
      totalDistanceMeters,
      executionTimeMs: Number((endTime - startTime).toFixed(3)),
      improvementPercent,
      iterations: 0,
      stopCount: initialRoute.length,
    };
  }

  let route = [...initialRoute];
  const initialLegs = computeRouteLegs(route);
  let bestRawDistance = initialLegs.rawDistanceKm;
  let iterations = 0;
  let improved = true;

  // If start is fixed, only reverse segments starting from index 1
  const startIndex = fixStart ? 1 : 0;
  const n = route.length;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = startIndex; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // Skip reversing the entire route if start is not fixed (distance is identical for symmetric open path)
        if (i === 0 && j === n - 1) continue;

        // O(1) delta calculation for open path 2-opt move:
        // Removing old boundary edges:
        //   - before i: edge (i - 1, i) if i > 0
        //   - after j:  edge (j, j + 1) if j < n - 1
        // Adding new boundary edges:
        //   - before i: edge (i - 1, j) if i > 0
        //   - after j:  edge (i, j + 1) if j < n - 1
        // (Internal segment [i .. j] reversal distance is invariant because Haversine is symmetric)
        let oldEdgesDist = 0.0;
        let newEdgesDist = 0.0;

        if (i > 0) {
          oldEdgesDist += haversineDistance(
            { latitude: route[i - 1].latitude, longitude: route[i - 1].longitude },
            { latitude: route[i].latitude, longitude: route[i].longitude }
          );
          newEdgesDist += haversineDistance(
            { latitude: route[i - 1].latitude, longitude: route[i - 1].longitude },
            { latitude: route[j].latitude, longitude: route[j].longitude }
          );
        }

        if (j < n - 1) {
          oldEdgesDist += haversineDistance(
            { latitude: route[j].latitude, longitude: route[j].longitude },
            { latitude: route[j + 1].latitude, longitude: route[j + 1].longitude }
          );
          newEdgesDist += haversineDistance(
            { latitude: route[i].latitude, longitude: route[i].longitude },
            { latitude: route[j + 1].latitude, longitude: route[j + 1].longitude }
          );
        }

        const delta = newEdgesDist - oldEdgesDist;

        // Strict improvement check with floating-point tolerance (improvement > 1e-7 km = 0.1 mm)
        if (delta < -1e-7) {
          // Perform 2-opt reversal
          route = [
            ...route.slice(0, i),
            ...route.slice(i, j + 1).reverse(),
            ...route.slice(j + 1),
          ];
          bestRawDistance += delta;
          improved = true;
          break; // First-improvement strategy: restart search from updated route
        }
      }
      if (improved) break;
    }
  }

  // Guarantee: Final route must never be worse than initial route
  let finalResult = computeRouteLegs(route);
  if (finalResult.rawDistanceKm > initialLegs.rawDistanceKm + 1e-7) {
    route = [...initialRoute];
    finalResult = initialLegs;
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  const baseDist = typeof baselineDistanceKm === 'number' ? baselineDistanceKm : finalResult.totalDistanceKm;
  const improvementPercent =
    baseDist > 0
      ? Number((((baseDist - finalResult.totalDistanceKm) / baseDist) * 100).toFixed(1))
      : 0;

  return {
    algorithm: 'twoOpt',
    name: 'Nearest Neighbor + 2-opt',
    orderedPlaceIds: route.map((p) => p.id),
    orderedPlaces: route,
    orderedCoordinates: route.map((p) => [p.latitude, p.longitude]),
    legs: finalResult.legs,
    totalDistanceKm: finalResult.totalDistanceKm,
    totalDistanceMeters: finalResult.totalDistanceMeters,
    executionTimeMs,
    improvementPercent,
    iterations,
    stopCount: route.length,
  };
}

/**
 * Optimize route and return comparison across Baseline, Nearest Neighbor, and 2-opt.
 * @param {Array<Object>} places - Validated place records in user selection order
 * @param {string|null} [startPlaceId=null] - Selected start place UUID
 * @returns {Object} Comprehensive route comparison and best recommendation
 */
export function optimizeRouteComparison(places, startPlaceId = null) {
  const safePlaces = Array.isArray(places) ? places : [];

  // 1. Baseline
  const baseline = solveBaseline(safePlaces);

  // 2. Nearest Neighbor
  const nearestNeighbor = solveNearestNeighbor(safePlaces, startPlaceId, baseline.totalDistanceKm);

  // 3. 2-opt starting from Nearest Neighbor solution
  const twoOpt = solveTwoOpt(
    nearestNeighbor.orderedPlaces,
    Boolean(startPlaceId),
    baseline.totalDistanceKm
  );

  // Determine best algorithm:
  // Sort by totalDistanceKm ascending; tie-break prefers twoOpt > nearestNeighbor > baseline
  const priority = { twoOpt: 0, nearestNeighbor: 1, baseline: 2 };
  const candidates = [twoOpt, nearestNeighbor, baseline];
  candidates.sort((a, b) => {
    const diff = a.totalDistanceKm - b.totalDistanceKm;
    if (Math.abs(diff) > 1e-4) {
      return diff;
    }
    return priority[a.algorithm] - priority[b.algorithm];
  });
  const bestRoute = candidates[0];

  const distanceSavedKm = Number(
    Math.max(0, baseline.totalDistanceKm - bestRoute.totalDistanceKm).toFixed(3)
  );

  return {
    disclaimer:
      'Distances are estimated great-circle (straight-line) distances calculated via the Haversine formula, not actual road network routing.',
    startPlaceId: startPlaceId || safePlaces[0]?.id || null,
    placeCount: safePlaces.length,
    results: {
      baseline,
      nearestNeighbor,
      twoOpt,
    },
    recommended: bestRoute.algorithm,
    bestRoute,
    summary: {
      baselineDistanceKm: baseline.totalDistanceKm,
      optimizedDistanceKm: bestRoute.totalDistanceKm,
      distanceSavedKm,
      improvementPercent: bestRoute.improvementPercent,
    },
  };
}
