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

  // Numerical stability: Antipodal points (opposite poles or exact 180 deg)
  const distAntipodal = haversineDistance(
    { latitude: 90.0, longitude: 0.0 },
    { latitude: -90.0, longitude: 0.0 }
  );
  assert(
    'Antipodal coordinates distance is numerically stable (~20015 km)',
    Math.abs(distAntipodal - Math.PI * 6371.0) < 0.1
  );

  // Invalid coordinate rejection tests
  let invalidFormatThrown = false;
  try {
    haversineDistance({ latitude: '12.9716', longitude: 77.5946 }, { latitude: 12.97, longitude: 77.59 });
  } catch {
    invalidFormatThrown = true;
  }
  assert('Rejects non-number latitude string', invalidFormatThrown);

  let nanCoordThrown = false;
  try {
    haversineDistance({ latitude: NaN, longitude: 77.5946 }, { latitude: 12.97, longitude: 77.59 });
  } catch {
    nanCoordThrown = true;
  }
  assert('Rejects NaN coordinates', nanCoordThrown);

  let latOutOfBounds = false;
  try {
    haversineDistance({ latitude: 95.0, longitude: 77.59 }, { latitude: 12.97, longitude: 77.59 });
  } catch {
    latOutOfBounds = true;
  }
  assert('Rejects latitude > 90', latOutOfBounds);

  let lonOutOfBounds = false;
  try {
    haversineDistance({ latitude: 12.97, longitude: -185.0 }, { latitude: 12.97, longitude: 77.59 });
  } catch {
    lonOutOfBounds = true;
  }
  assert('Rejects longitude < -180', lonOutOfBounds);

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

  console.log('\n--- 3b. Testing Edge Cases: Zero, One Stop & Duplicate Coordinates ---');
  // Zero stops
  const emptyBaseline = solveBaseline([]);
  assert('Empty baseline returns 0 legs and 0 distance', emptyBaseline.legs.length === 0 && emptyBaseline.totalDistanceKm === 0);

  const emptyNN = solveNearestNeighbor([]);
  assert('Empty NN returns 0 stops, 0 legs and 0 distance', emptyNN.orderedPlaces.length === 0 && emptyNN.totalDistanceKm === 0);

  const emptyTwoOpt = solveTwoOpt([]);
  assert('Empty 2-opt returns 0 stops, 0 legs and 0 distance', emptyTwoOpt.orderedPlaces.length === 0 && emptyTwoOpt.totalDistanceKm === 0);

  // Single stop
  const singlePlace = [{ id: 'solo', name: 'Solo Place', latitude: 12.9716, longitude: 77.5946 }];
  const soloBaseline = solveBaseline(singlePlace);
  assert('Single-stop baseline returns 0 legs and distance 0', soloBaseline.legs.length === 0 && soloBaseline.totalDistanceKm === 0);

  const soloNN = solveNearestNeighbor(singlePlace);
  assert('Single-stop NN visits that stop with distance 0', soloNN.orderedPlaceIds[0] === 'solo' && soloNN.totalDistanceKm === 0);

  const soloTwoOpt = solveTwoOpt(singlePlace);
  assert('Single-stop 2-opt returns that stop with distance 0', soloTwoOpt.orderedPlaceIds[0] === 'solo' && soloTwoOpt.totalDistanceKm === 0);

  // Duplicate coordinates (two places with identical lat/lng)
  const dupPlaces = [
    { id: 'dup-1', name: 'Place Alpha', latitude: 12.9716, longitude: 77.5946 },
    { id: 'dup-2', name: 'Place Beta (Same Coord)', latitude: 12.9716, longitude: 77.5946 },
    { id: 'dup-3', name: 'Place Gamma', latitude: 12.9800, longitude: 77.6000 },
  ];
  const dupNN = solveNearestNeighbor(dupPlaces, 'dup-1');
  assert('NN handles duplicate coordinates without skipping stops',
    dupNN.orderedPlaceIds.length === 3 &&
    dupNN.orderedPlaceIds.includes('dup-1') &&
    dupNN.orderedPlaceIds.includes('dup-2') &&
    dupNN.orderedPlaceIds.includes('dup-3')
  );

  const dupTwoOpt = solveTwoOpt(dupNN.orderedPlaces, true);
  assert('2-opt preserves all places with duplicate coordinates',
    dupTwoOpt.orderedPlaceIds.length === 3 &&
    dupTwoOpt.totalDistanceKm <= dupNN.totalDistanceKm + 1e-4
  );

  console.log('\n--- 3c. Testing Deterministic Tie-Breaking ---');
  const tieStart = { id: 'start', name: 'Start', latitude: 12.0, longitude: 77.0 };
  const tieA = { id: 'place-a', name: 'Tie A', latitude: 12.0, longitude: 77.0 }; // distance = 0
  const tieB = { id: 'place-b', name: 'Tie B', latitude: 12.0, longitude: 77.0 }; // distance = 0

  const tieOrder1 = solveNearestNeighbor([tieStart, tieB, tieA], 'start');
  const tieOrder2 = solveNearestNeighbor([tieStart, tieA, tieB], 'start');

  assert(
    'NN breaks distance ties deterministically by place ID regardless of input order',
    tieOrder1.orderedPlaceIds[1] === 'place-a' &&
    tieOrder2.orderedPlaceIds[1] === 'place-a' &&
    tieOrder1.orderedPlaceIds.join(',') === tieOrder2.orderedPlaceIds.join(',')
  );

  console.log('\n--- 3d. Testing 2-opt Invariants & Segment Reversal (Uncrossing Crossings) ---');
  // Bowtie crossing: A(0,0) -> C(1,1) -> B(0,1) -> D(1,0)
  // Distance: (0,0)->(1,1) diagonal + (1,1)->(0,1) edge + (0,1)->(1,0) diagonal
  // Uncrossed: A(0,0) -> B(0,1) -> C(1,1) -> D(1,0) has much shorter perimeter distance!
  const bowtieRoute = [
    { id: 'bt-A', name: 'A (Bottom-Left)', latitude: 12.0, longitude: 77.0 },
    { id: 'bt-C', name: 'C (Top-Right)',   latitude: 12.1, longitude: 77.1 },
    { id: 'bt-B', name: 'B (Bottom-Right)', latitude: 12.0, longitude: 77.1 },
    { id: 'bt-D', name: 'D (Top-Left)',    latitude: 12.1, longitude: 77.0 },
  ];
  const bowtieLegs = computeRouteLegs(bowtieRoute);
  const uncrossedTwoOpt = solveTwoOpt(bowtieRoute, true);

  assert('2-opt uncrosses crossing segments and reduces route distance',
    uncrossedTwoOpt.totalDistanceKm < bowtieLegs.totalDistanceKm - 1.0,
    `Original: ${bowtieLegs.totalDistanceKm} km, Uncrossed: ${uncrossedTwoOpt.totalDistanceKm} km`
  );
  assert('2-opt preserves all original place IDs (no loss, no duplication)',
    uncrossedTwoOpt.orderedPlaceIds.length === 4 &&
    bowtieRoute.every((p) => uncrossedTwoOpt.orderedPlaceIds.includes(p.id))
  );

  console.log('\n--- 3e. Scalability & Performance Benchmarks (30 & 50 Stops) ---');
  // Generate 50 synthetic stops across Bengaluru area
  const synthetic50 = Array.from({ length: 50 }, (_, i) => ({
    id: `syn-${String(i).padStart(2, '0')}`,
    name: `Bengaluru Spot ${i + 1}`,
    latitude: 12.9000 + (i % 10) * 0.015 + Math.sin(i * 1.5) * 0.005,
    longitude: 77.5000 + Math.floor(i / 10) * 0.02 + Math.cos(i * 1.5) * 0.005,
  }));

  // Benchmark with 30 stops
  const synthetic30 = synthetic50.slice(0, 30);
  const bench30Base = solveBaseline(synthetic30);
  const bench30NN = solveNearestNeighbor(synthetic30, 'syn-00');
  const bench30TwoOpt = solveTwoOpt(bench30NN.orderedPlaces, true);

  assert('30-stop route: NN visits all 30 stops exactly once',
    bench30NN.orderedPlaceIds.length === 30 &&
    new Set(bench30NN.orderedPlaceIds).size === 30
  );
  assert('30-stop route: 2-opt distance <= NN distance',
    bench30TwoOpt.totalDistanceKm <= bench30NN.totalDistanceKm + 1e-4
  );
  assert('30-stop 2-opt terminates within 100ms',
    bench30TwoOpt.executionTimeMs < 100,
    `Took ${bench30TwoOpt.executionTimeMs} ms`
  );

  // Benchmark with 50 stops
  const bench50Base = solveBaseline(synthetic50);
  const bench50NN = solveNearestNeighbor(synthetic50, 'syn-00');
  const bench50TwoOpt = solveTwoOpt(bench50NN.orderedPlaces, true);

  assert('50-stop route: NN visits all 50 stops exactly once',
    bench50NN.orderedPlaceIds.length === 50 &&
    new Set(bench50NN.orderedPlaceIds).size === 50
  );
  assert('50-stop route: 2-opt distance <= NN distance',
    bench50TwoOpt.totalDistanceKm <= bench50NN.totalDistanceKm + 1e-4
  );
  assert('50-stop route preserves all 50 stops in output',
    bench50TwoOpt.orderedPlaceIds.length === 50 &&
    new Set(bench50TwoOpt.orderedPlaceIds).size === 50
  );
  assert('50-stop route optimization comparison runs in < 200ms',
    bench50Base.executionTimeMs + bench50NN.executionTimeMs + bench50TwoOpt.executionTimeMs < 200,
    `Baseline: ${bench50Base.executionTimeMs}ms, NN: ${bench50NN.executionTimeMs}ms, 2-opt: ${bench50TwoOpt.executionTimeMs}ms`
  );

  console.log(`    [50 Stops Benchmark] Baseline: ${bench50Base.totalDistanceKm}km (${bench50Base.executionTimeMs}ms) | NN: ${bench50NN.totalDistanceKm}km (${bench50NN.executionTimeMs}ms) | 2-opt: ${bench50TwoOpt.totalDistanceKm}km (${bench50TwoOpt.executionTimeMs}ms, ${bench50TwoOpt.iterations} iter)`);

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
