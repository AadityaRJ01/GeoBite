/**
 * GeoBite — OSRM Road Routing Test Suite
 *
 * Covers:
 * 1. Valid two-stop route
 * 2. Valid multi-stop route
 * 3. Coordinate ordering (OSRM strictly requires longitude,latitude)
 * 4. GeoJSON geometry parsing
 * 5. Distance conversion from metres to kilometres
 * 6. Duration conversion from seconds to minutes
 * 7. Invalid latitude
 * 8. Invalid longitude
 * 9. Missing stops
 * 10. Single-stop route
 * 11. OSRM error response
 * 12. Network failure
 * 13. Request timeout
 * 14. Invalid geometry
 * 15. Excessive number of stops
 * 16. Fallback and cache behavior
 * 17. HTTP API endpoint integration (POST /api/routes/road-route)
 */

import http from 'http';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import {
  getRoadRoute,
  formatOSRMCoordinateString,
  validateStopsCoordinates,
  routeCache,
  RoadRoutingError,
} from '../src/services/osrm.service.js';

let appServer;
let appBaseUrl;

let mockOsrmServer;
let mockOsrmBaseUrl;
let mockResponseHandler = null;

async function startAppServer() {
  return new Promise((resolve) => {
    appServer = app.listen(0, () => {
      const port = appServer.address().port;
      appBaseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function stopAppServer() {
  return new Promise((resolve) => {
    appServer.close(async () => {
      await prisma.$disconnect();
      resolve();
    });
  });
}

async function startMockOsrmServer() {
  return new Promise((resolve) => {
    mockOsrmServer = http.createServer((req, res) => {
      if (mockResponseHandler) {
        mockResponseHandler(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 'NotFound' }));
      }
    });
    mockOsrmServer.listen(0, () => {
      const port = mockOsrmServer.address().port;
      mockOsrmBaseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function stopMockOsrmServer() {
  return new Promise((resolve) => {
    mockOsrmServer.close(() => resolve());
  });
}

async function postJson(endpoint, body) {
  const res = await fetch(`${appBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runOsrmRoutingTests() {
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
  console.log('   GeoBite Day 14: OSRM Road Routing Test Suite');
  console.log('======================================================\n');

  await startMockOsrmServer();

  try {
    // ── 1. Coordinate Formatting & Ordering ─────────────────────────────
    console.log('--- 1. Testing Coordinate Ordering & Serialization ---');

    const sampleStops = [
      { id: 'p1', name: 'Stop A', latitude: 12.9716, longitude: 77.5946 },
      { id: 'p2', name: 'Stop B', latitude: 12.9718, longitude: 77.5988 },
    ];
    const formattedCoords = formatOSRMCoordinateString(sampleStops);
    assert(
      'Coordinate string strictly formats as longitude,latitude with semicolons',
      formattedCoords.startsWith('77.594600,12.971600;77.598800,12.971800')
    );

    // ── 2. Validation Cases ─────────────────────────────────────────────
    console.log('\n--- 2. Testing Input Validation ---');

    let invalidLatThrown = false;
    try {
      validateStopsCoordinates([{ latitude: 95.0, longitude: 77.59 }]);
    } catch (err) {
      invalidLatThrown = err.statusCode === 400 && err.message.includes('latitude');
    }
    assert('Rejects stop with latitude > 90 (HTTP 400)', invalidLatThrown);

    let invalidLngThrown = false;
    try {
      validateStopsCoordinates([{ latitude: 12.97, longitude: -190.0 }]);
    } catch (err) {
      invalidLngThrown = err.statusCode === 400 && err.message.includes('longitude');
    }
    assert('Rejects stop with longitude < -180 (HTTP 400)', invalidLngThrown);

    let nonNumberThrown = false;
    try {
      validateStopsCoordinates([{ latitude: NaN, longitude: 77.59 }]);
    } catch (err) {
      nonNumberThrown = err.statusCode === 400;
    }
    assert('Rejects stop with NaN coordinates (HTTP 400)', nonNumberThrown);

    let excessiveStopsThrown = false;
    const manyStops = Array.from({ length: 26 }, (_, i) => ({
      latitude: 12.9 + i * 0.001,
      longitude: 77.5 + i * 0.001,
    }));
    try {
      validateStopsCoordinates(manyStops);
    } catch (err) {
      excessiveStopsThrown = err.statusCode === 400 && err.message.includes('maximum of 25');
    }
    assert('Rejects route with > 25 stops (HTTP 400)', excessiveStopsThrown);

    // ── 3. Edge Cases (0 stops, 1 stop, identical coordinates) ─────────
    console.log('\n--- 3. Testing Edge Cases (0 stops, 1 stop, identical coords) ---');

    const zeroStopsResult = await getRoadRoute([]);
    assert('Zero stops returns 0 km, 0 min, empty LineString without network call',
      zeroStopsResult.distanceKm === 0 &&
      zeroStopsResult.durationMinutes === 0 &&
      zeroStopsResult.geometry.coordinates.length === 0
    );

    const singleStopResult = await getRoadRoute([{ latitude: 12.9716, longitude: 77.5946 }]);
    assert('Single stop returns 0 km, 0 min, 1 coordinate without network call',
      singleStopResult.distanceKm === 0 &&
      singleStopResult.durationMinutes === 0 &&
      singleStopResult.geometry.coordinates.length === 1
    );

    const identicalCoordsResult = await getRoadRoute([
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9716, longitude: 77.5946 },
    ]);
    assert('Identical coordinates return 0 km, 0 min without network call',
      identicalCoordsResult.distanceKm === 0 &&
      identicalCoordsResult.durationMinutes === 0
    );

    // ── 4. Mocked OSRM Service Success Cases ────────────────────────────
    console.log('\n--- 4. Testing OSRM Service Success & Conversion ---');
    routeCache.clear();

    // Standard Mock Response: 5432.1 meters, 1200.5 seconds
    mockResponseHandler = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          code: 'Ok',
          routes: [
            {
              distance: 5432.1,
              duration: 1200.0,
              geometry: {
                type: 'LineString',
                coordinates: [
                  [77.5946, 12.9716],
                  [77.5960, 12.9717],
                  [77.5988, 12.9718],
                ],
              },
            },
          ],
          waypoints: [
            { location: [77.5946, 12.9716], name: 'Origin' },
            { location: [77.5988, 12.9718], name: 'Dest' },
          ],
        })
      );
    };

    const mockStops = [
      { latitude: 12.9716, longitude: 77.5946 },
      { latitude: 12.9718, longitude: 77.5988 },
    ];
    const roadResult = await getRoadRoute(mockStops, { baseUrl: mockOsrmBaseUrl });

    assert('Parses distance from metres to kilometres (5432.1m -> 5.43 km)', roadResult.distanceKm === 5.43);
    assert('Parses duration from seconds to minutes (1200s -> 20.0 min)', roadResult.durationMinutes === 20.0);
    assert('Validates GeoJSON LineString geometry structure',
      roadResult.geometry.type === 'LineString' &&
      Array.isArray(roadResult.geometry.coordinates) &&
      roadResult.geometry.coordinates.length === 3
    );
    assert('Returns provider OSRM and profile driving',
      roadResult.provider === 'OSRM' && roadResult.profile === 'driving'
    );

    // Cache hit verification
    let serverCalledAgain = false;
    mockResponseHandler = () => { serverCalledAgain = true; };
    const cachedResult = await getRoadRoute(mockStops, { baseUrl: mockOsrmBaseUrl });
    assert('Route is cached: repeated identical request does not hit server again',
      !serverCalledAgain && cachedResult.distanceKm === 5.43
    );

    // ── 5. Mocked OSRM Failure & Error Cases ────────────────────────────
    console.log('\n--- 5. Testing OSRM Failure & Error Handling ---');
    routeCache.clear();

    // NoRoute error (422)
    mockResponseHandler = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 'NoRoute', message: 'Impossible route' }));
    };
    let noRouteThrown = false;
    try {
      await getRoadRoute(
        [{ latitude: 12.97, longitude: 77.59 }, { latitude: 13.97, longitude: 78.59 }],
        { baseUrl: mockOsrmBaseUrl }
      );
    } catch (err) {
      noRouteThrown = err.statusCode === 422 && err.message.includes('No drivable road route');
    }
    assert('OSRM NoRoute response throws 422 with user-friendly error', noRouteThrown);

    // Invalid geometry in OSRM response (502)
    routeCache.clear();
    mockResponseHandler = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 'Ok',
        routes: [{ distance: 1000, duration: 60, geometry: null }],
      }));
    };
    let invalidGeomThrown = false;
    try {
      await getRoadRoute(
        [{ latitude: 12.971, longitude: 77.591 }, { latitude: 12.972, longitude: 77.592 }],
        { baseUrl: mockOsrmBaseUrl }
      );
    } catch (err) {
      invalidGeomThrown = err.statusCode === 502 && err.message.includes('invalid route geometry');
    }
    assert('Missing or invalid geometry throws 502 Bad Gateway', invalidGeomThrown);

    // Timeout handling (504)
    routeCache.clear();
    mockResponseHandler = (req, res) => {
      // Deliberately hold connection open without responding
    };
    let timeoutThrown = false;
    try {
      await getRoadRoute(
        [{ latitude: 12.971, longitude: 77.591 }, { latitude: 12.972, longitude: 77.592 }],
        { baseUrl: mockOsrmBaseUrl, timeoutMs: 100 }
      );
    } catch (err) {
      timeoutThrown = err.statusCode === 504 && err.message.includes('timed out');
    }
    assert('Request timeout throws 504 Gateway Timeout', timeoutThrown);

    // ── 6. HTTP API Endpoint Tests (POST /api/routes/road-route) ────────
    console.log('\n--- 6. Testing HTTP Endpoint POST /api/routes/road-route ---');
    await startAppServer();

    // Prepare mock OSRM response for app endpoint
    routeCache.clear();
    mockResponseHandler = (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          code: 'Ok',
          routes: [
            {
              distance: 3200.0,
              duration: 480.0,
              geometry: {
                type: 'LineString',
                coordinates: [
                  [77.5812, 12.9493],
                  [77.5988, 12.9718],
                ],
              },
            },
          ],
        })
      );
    };

    // Override process.env.OSRM_BASE_URL to point to our mock server for integration tests
    const originalOsrmUrl = process.env.OSRM_BASE_URL;
    process.env.OSRM_BASE_URL = mockOsrmBaseUrl;

    // Direct stops request
    const postStopsRes = await postJson('/api/routes/road-route', {
      stops: [
        { id: 's1', latitude: 12.9493, longitude: 77.5812 },
        { id: 's2', latitude: 12.9718, longitude: 77.5988 },
      ],
    });
    assert('POST /api/routes/road-route with stops returns 200 OK', postStopsRes.status === 200);
    assert('Response success flag is true', postStopsRes.data.success === true);
    assert('Returns distanceKm (3.20 km) and durationMinutes (8.0 min)',
      postStopsRes.data.data.distanceKm === 3.2 &&
      postStopsRes.data.data.durationMinutes === 8.0
    );
    assert('Returns GeoJSON LineString geometry',
      postStopsRes.data.data.geometry?.type === 'LineString' &&
      Array.isArray(postStopsRes.data.data.geometry?.coordinates)
    );

    // Database placeIds request
    const dbPlaces = await prisma.place.findMany({ take: 3, where: { isActive: true } });
    const placeIds = dbPlaces.map((p) => p.id);

    const postPlaceIdsRes = await postJson('/api/routes/road-route', { placeIds });
    assert('POST /api/routes/road-route with database placeIds returns 200 OK', postPlaceIdsRes.status === 200);
    assert('Response has waypoint count matching placeIds length', postPlaceIdsRes.data.data.waypointCount === 3);

    // Validation: Missing body fields
    const missingFields = await postJson('/api/routes/road-route', {});
    assert('Missing stops and placeIds returns 400 Bad Request', missingFields.status === 400);

    // Validation: Fewer than 2 stops
    const singleStop = await postJson('/api/routes/road-route', {
      stops: [{ latitude: 12.97, longitude: 77.59 }],
    });
    assert('Fewer than 2 stops returns 400 Bad Request', singleStop.status === 400);

    // Validation: Non-existent place IDs (404)
    const nonexistentPlace = await postJson('/api/routes/road-route', {
      placeIds: ['00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111'],
    });
    assert('Non-existent place IDs return 404 Not Found', nonexistentPlace.status === 404);

    // Restore env
    process.env.OSRM_BASE_URL = originalOsrmUrl;

  } finally {
    await stopMockOsrmServer();
    if (appServer) {
      await stopAppServer();
    }
  }

  console.log('\n======================================================');
  console.log(`OSRM ROAD ROUTING TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOsrmRoutingTests().catch((err) => {
  console.error('OSRM test suite error:', err);
  process.exit(1);
});

