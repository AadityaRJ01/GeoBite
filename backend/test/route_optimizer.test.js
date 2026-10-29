import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import {
  haversineDistance,
  computeRouteLegs,
  solveBaseline,
  solveNearestNeighbor,
  solveTwoOpt,
  optimizeRouteComparison,
} from '../src/algorithms/routeOptimizer.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    server.close(async () => {
      await prisma.$disconnect();
      resolve();
    });
  });
}

async function postJson(endpoint, body) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function getJson(endpoint) {
  const res = await fetch(`${baseUrl}${endpoint}`);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ ${name}: ${details}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log('   GeoBite Day 5: Route Optimization Test Suite');
  console.log('======================================================\n');

  // --- UNIT TESTS: Haversine & Optimization Algorithms ---
  console.log('--- 1. Testing Haversine Distance Calculation ---');
  // Known benchmark: Bengaluru MG Road (12.9716, 77.5946) to Cubbon Park (12.9763, 77.5929) ~ 0.55 km
  const distBengaluru = haversineDistance(
    { latitude: 12.9716, longitude: 77.5946 },
    { latitude: 12.9763, longitude: 77.5929 }
  );
  assert(
    'Haversine distance between MG Road and Cubbon Park is ~0.55 km',
    Math.abs(distBengaluru - 0.552) < 0.05,
    `Got ${distBengaluru.toFixed(3)} km`
  );

  // Distance to itself must be 0
  const distZero = haversineDistance(
    { latitude: 12.9716, longitude: 77.5946 },
    { latitude: 12.9716, longitude: 77.5946 }
  );
  assert('Distance between identical coordinates is 0', distZero === 0);

  // Symmetry: d(A, B) === d(B, A)
  const distAtoB = haversineDistance(
    { latitude: 12.9493, longitude: 77.5812 },
    { latitude: 13.0069, longitude: 77.5803 }
  );
  const distBtoA = haversineDistance(
    { latitude: 13.0069, longitude: 77.5803 },
    { latitude: 12.9493, longitude: 77.5812 }
  );
  assert('Haversine distance is symmetric', Math.abs(distAtoB - distBtoA) < 1e-9);

  console.log('\n--- 2. Testing Route with Exactly 2 Places ---');
  const twoPlaces = [
    { id: 'p1', name: 'Stop A', latitude: 12.9493, longitude: 77.5812 },
    { id: 'p2', name: 'Stop B', latitude: 12.9718, longitude: 77.5988 },
  ];
  const twoPlaceBaseline = solveBaseline(twoPlaces);
  assert('Two-place baseline has exactly 1 leg', twoPlaceBaseline.legs.length === 1);
  assert('Two-place distance is non-negative and positive', twoPlaceBaseline.totalDistanceKm > 0);

  const twoPlaceNN = solveNearestNeighbor(twoPlaces, 'p1');
  assert('Two-place NN visits p1 then p2', twoPlaceNN.orderedPlaceIds[0] === 'p1' && twoPlaceNN.orderedPlaceIds[1] === 'p2');

  const twoPlaceTwoOpt = solveTwoOpt(twoPlaceNN.orderedPlaces, true);
  assert('Two-place 2-opt preserves 2-place route distance', Math.abs(twoPlaceTwoOpt.totalDistanceKm - twoPlaceNN.totalDistanceKm) < 1e-4);

  console.log('\n--- 3. Testing Nearest Neighbor & 2-Opt Properties ---');
  const sampleCluster = [
    { id: 'c1', name: 'Cluster Start', latitude: 12.9716, longitude: 77.5946 },
    { id: 'c2', name: 'Far Away North', latitude: 13.3702, longitude: 77.6835 }, // Nandi Hills ~45km
    { id: 'c3', name: 'Close Neighbor 1', latitude: 12.9718, longitude: 77.5988 }, // Karavalli ~0.45km
    { id: 'c4', name: 'Close Neighbor 2', latitude: 12.9763, longitude: 77.5929 }, // Cubbon Park ~0.55km
    { id: 'c5', name: 'Far Away South', latitude: 12.7158, longitude: 77.2819 }, // Ramanagara ~50km
  ];

  const nnCluster = solveNearestNeighbor(sampleCluster, 'c1');
  assert('NN starts from chosen startPlaceId', nnCluster.orderedPlaceIds[0] === 'c1');
  assert(
    'NN visits nearby cluster first before far away points',
    ['c3', 'c4'].includes(nnCluster.orderedPlaceIds[1])
  );

  const twoOptCluster = solveTwoOpt(nnCluster.orderedPlaces, true);
  assert(
    '2-opt distance never exceeds Nearest Neighbor distance',
    twoOptCluster.totalDistanceKm <= nnCluster.totalDistanceKm + 1e-4,
    `2-opt: ${twoOptCluster.totalDistanceKm}, NN: ${nnCluster.totalDistanceKm}`
  );
  assert(
    '2-opt preserves fixed start place',
    twoOptCluster.orderedPlaceIds[0] === 'c1'
  );

  // --- INTEGRATION TESTS: Backend HTTP Endpoint ---
  try {
    await startServer();

    console.log('\n--- 4. Testing POST /api/routes/optimize with Valid Seed Places ---');
    // Fetch real places from DB
    const seedPlaces = await prisma.place.findMany({
      where: { isActive: true },
      take: 6,
    });
    assert('Found at least 4 active places in database', seedPlaces.length >= 4);

    const testPlaceIds = seedPlaces.map((p) => p.id);
    const chosenStartId = testPlaceIds[1];

    const optimizeRes = await postJson('/api/routes/optimize', {
      placeIds: testPlaceIds,
      startPlaceId: chosenStartId,
    });

    assert('POST /api/routes/optimize returns 200 OK', optimizeRes.status === 200);
    assert('Response success flag is true', optimizeRes.data.success === true);
    assert('Disclaimer states straight-line Haversine distance', optimizeRes.data.data.disclaimer.includes('Haversine'));
    assert('Returns results for baseline, nearestNeighbor, and twoOpt',
      optimizeRes.data.data.results.baseline &&
      optimizeRes.data.data.results.nearestNeighbor &&
      optimizeRes.data.data.results.twoOpt
    );
    assert('Preserves chosen startPlaceId at beginning of recommended route',
      optimizeRes.data.data.results.nearestNeighbor.orderedPlaceIds[0] === chosenStartId &&
      optimizeRes.data.data.results.twoOpt.orderedPlaceIds[0] === chosenStartId
    );
    assert('2-opt distance <= NN distance',
      optimizeRes.data.data.results.twoOpt.totalDistanceKm <=
      optimizeRes.data.data.results.nearestNeighbor.totalDistanceKm + 1e-4
    );
    assert('Each leg contains legIndex, from/to names and coordinates',
      optimizeRes.data.data.bestRoute.legs.every(
        (leg) => leg.legIndex && leg.fromPlaceName && leg.toPlaceName && leg.fromCoordinates && leg.toCoordinates
      )
    );
    assert('Execution time in ms is measured and non-negative',
      typeof optimizeRes.data.data.bestRoute.executionTimeMs === 'number' &&
      optimizeRes.data.data.bestRoute.executionTimeMs >= 0
    );

    console.log('\n--- 5. Testing Input Validation Error Cases (HTTP 400 & 404) ---');

    // Missing placeIds
    const missingPlaceIds = await postJson('/api/routes/optimize', {});
    assert('Missing placeIds returns 400', missingPlaceIds.status === 400);

    // Insufficient places (< 2)
    const tooFewPlaces = await postJson('/api/routes/optimize', {
      placeIds: [testPlaceIds[0]],
    });
    assert('Fewer than 2 places returns 400', tooFewPlaces.status === 400);

    // Empty array
    const emptyPlaces = await postJson('/api/routes/optimize', {
      placeIds: [],
    });
    assert('Empty placeIds array returns 400', emptyPlaces.status === 400);

    // Excessive places (> 10)
    const excessiveIds = Array.from({ length: 11 }, (_, i) => `mock-uuid-${i}`);
    const tooManyPlaces = await postJson('/api/routes/optimize', {
      placeIds: excessiveIds,
    });
    assert('More than 10 places returns 400', tooManyPlaces.status === 400);

    // Duplicate place IDs
    const duplicatePlaces = await postJson('/api/routes/optimize', {
      placeIds: [testPlaceIds[0], testPlaceIds[1], testPlaceIds[0]],
    });
    assert('Duplicate place IDs returns 400', duplicatePlaces.status === 400);

    // startPlaceId not in placeIds
    const foreignStartId = await postJson('/api/routes/optimize', {
      placeIds: [testPlaceIds[0], testPlaceIds[1]],
      startPlaceId: '00000000-0000-0000-0000-000000000000',
    });
    assert('Foreign startPlaceId returns 400', foreignStartId.status === 400);

    // Non-existent place IDs (404)
    const nonexistentPlace = await postJson('/api/routes/optimize', {
      placeIds: [testPlaceIds[0], '11111111-1111-1111-1111-111111111111'],
    });
    assert('Non-existent place IDs return 404', nonexistentPlace.status === 404);

    console.log('\n--- 6. Verifying Existing Day 1-4 Endpoints Remain Intact ---');
    const health = await getJson('/api/health');
    assert('GET /api/health returns 200 OK', health.status === 200);

    const placesAll = await getJson('/api/places');
    assert('GET /api/places returns 200 OK with 18 places', placesAll.status === 200 && placesAll.data.count === 18);

    const nearbyPlaces = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=5');
    assert('GET /api/places/nearby returns 200 OK with distance calculation',
      nearbyPlaces.status === 200 && nearbyPlaces.data.count > 0 && typeof nearbyPlaces.data.data[0].distanceMeters === 'number'
    );

  } finally {
    await stopServer();
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
