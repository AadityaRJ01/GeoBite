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

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculate great-circle distance between two geographic coordinates using the Haversine formula.
 * @param {{ latitude: number, longitude: number }} coord1
 * @param {{ latitude: number, longitude: number }} coord2
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(coord1, coord2) {
  if (
    typeof coord1?.latitude !== 'number' ||
    typeof coord1?.longitude !== 'number' ||
    typeof coord2?.latitude !== 'number' ||
    typeof coord2?.longitude !== 'number'
  ) {
    throw new Error('Invalid coordinate format for Haversine distance calculation.');
  }

  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lon1 = (coord1.longitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const lon2 = (coord2.longitude * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Compute route legs and cumulative distance for an ordered list of place objects.
 * @param {Array<Object>} orderedPlaces - Array of place records
 * @returns {{ legs: Array, totalDistanceKm: number, totalDistanceMeters: number }}
 */
export function computeRouteLegs(orderedPlaces) {
  if (!Array.isArray(orderedPlaces) || orderedPlaces.length < 2) {
    return {
      legs: [],
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
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
  };
}

/**
 * Algorithm A: Baseline (Original User Selection Order)
 * Evaluates the total distance and legs for places in the input sequence.
 * Time complexity: O(N)
 */
export function solveBaseline(places) {
  const startTime = performance.now();

  const { legs, totalDistanceKm, totalDistanceMeters } = computeRouteLegs(places);

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  return {
    algorithm: 'baseline',
    name: 'Original Selection (Baseline)',
    orderedPlaceIds: places.map((p) => p.id),
    orderedPlaces: places,
    orderedCoordinates: places.map((p) => [p.latitude, p.longitude]),
    legs,
    totalDistanceKm,
    totalDistanceMeters,
    executionTimeMs,
    improvementPercent: 0,
    iterations: 0,
  };
}

/**
 * Algorithm B: Nearest Neighbor
 * Starts at the selected starting place (or first place in list), then repeatedly
 * visits the closest unvisited place until all stops are visited.
 * Time complexity: O(N^2)
 */
export function solveNearestNeighbor(places, startPlaceId = null, baselineDistanceKm = null) {
  const startTime = performance.now();

  if (!Array.isArray(places) || places.length === 0) {
    throw new Error('Places list cannot be empty.');
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
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
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
  };
}

/**
 * Algorithm C: 2-opt Local Search Heuristic
 * Takes an initial route (typically from Nearest Neighbor) and iteratively
 * reverses intermediate segments whenever doing so reduces the total path distance.
 * Terminates when no improving 2-opt move is found or maxIterations is reached.
 * Time complexity: O(K * N^2) where K is number of improvement iterations.
 *
 * @param {Array<Object>} initialRoute - Initial route to improve
 * @param {boolean} [fixStart=true] - Whether to preserve the initial departure stop at index 0
 * @param {number} [baselineDistanceKm=null] - Baseline distance for improvement percentage
 * @param {number} [maxIterations=500] - Safety iteration bound
 */
export function solveTwoOpt(
  initialRoute,
  fixStart = true,
  baselineDistanceKm = null,
  maxIterations = 500
) {
  const startTime = performance.now();

  if (!Array.isArray(initialRoute) || initialRoute.length < 2) {
    throw new Error('Initial route must have at least 2 places.');
  }

  let route = [...initialRoute];
  let { totalDistanceKm: bestDistance } = computeRouteLegs(route);
  let iterations = 0;
  let improved = true;

  // If start is fixed, only reverse segments starting from index 1
  const startIndex = fixStart ? 1 : 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = startIndex; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        // Reverse subsegment from i to j
        const candidate = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];

        const { totalDistanceKm: candidateDistance } = computeRouteLegs(candidate);

        // Require improvement > 0.0001 km (10 cm) to prevent floating point jitter
        if (candidateDistance < bestDistance - 0.0001) {
          route = candidate;
          bestDistance = candidateDistance;
          improved = true;
          break; // First-improvement or restart from new route
        }
      }
      if (improved) break;
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));
  const { legs, totalDistanceKm, totalDistanceMeters } = computeRouteLegs(route);

  // Guarantee: 2-opt can NEVER have a total distance higher than the initial route
  const baseDist = typeof baselineDistanceKm === 'number' ? baselineDistanceKm : totalDistanceKm;
  const improvementPercent =
    baseDist > 0
      ? Number((((baseDist - totalDistanceKm) / baseDist) * 100).toFixed(1))
      : 0;

  return {
    algorithm: 'twoOpt',
    name: 'Nearest Neighbor + 2-opt',
    orderedPlaceIds: route.map((p) => p.id),
    orderedPlaces: route,
    orderedCoordinates: route.map((p) => [p.latitude, p.longitude]),
    legs,
    totalDistanceKm,
    totalDistanceMeters,
    executionTimeMs,
    improvementPercent,
    iterations,
  };
}

/**
 * Optimize route and return comparison across Baseline, Nearest Neighbor, and 2-opt.
 * @param {Array<Object>} places - Validated place records in user selection order
 * @param {string|null} [startPlaceId=null] - Selected start place UUID
 * @returns {Object} Comprehensive route comparison and best recommendation
 */
export function optimizeRouteComparison(places, startPlaceId = null) {
  // 1. Baseline
  const baseline = solveBaseline(places);

  // 2. Nearest Neighbor
  const nearestNeighbor = solveNearestNeighbor(places, startPlaceId, baseline.totalDistanceKm);

  // 3. 2-opt starting from Nearest Neighbor solution
  const twoOpt = solveTwoOpt(
    nearestNeighbor.orderedPlaces,
    Boolean(startPlaceId),
    baseline.totalDistanceKm
  );

  // Determine best algorithm
  const candidates = [baseline, nearestNeighbor, twoOpt];
  candidates.sort((a, b) => a.totalDistanceKm - b.totalDistanceKm);
  const bestRoute = candidates[0];

  const distanceSavedKm = Number(
    Math.max(0, baseline.totalDistanceKm - bestRoute.totalDistanceKm).toFixed(3)
  );

  return {
    disclaimer:
      'Distances are estimated great-circle (straight-line) distances calculated via the Haversine formula, not actual road network routing.',
    startPlaceId: startPlaceId || places[0]?.id || null,
    placeCount: places.length,
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
