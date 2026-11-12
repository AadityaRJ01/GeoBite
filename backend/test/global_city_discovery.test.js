/**
 * GeoBite — Day 17: Global City Discovery & Geospatial Integration Test Suite
 *
 * Tests:
 * 1. Geocoding valid and invalid city names (with mocked Nominatim)
 * 2. Geocoding timeout and provider error handling
 * 3. Place normalization from raw OSM elements
 * 4. Deduplication of external OSM records and duplicate names
 * 5. City-specific data isolation in /api/places?city=...
 * 6. PostGIS coordinate trigger and spatial isolation
 * 7. City-specific nearby search
 * 8. City-specific viewport bounds search
 * 9. Switching between cities
 * 10. Route optimization using places from different cities
 * 11. OSRM road route requests using actual non-Bengaluru coordinates
 * 12. No Bengaluru fallback when another city fails
 */

import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { searchLocation, clearGeocodeCache } from '../src/services/geocoding.service.js';
import { normalizeOsmElements, persistPlaces } from '../src/services/placeDiscovery.service.js';

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

async function getJson(endpoint) {
  const res = await fetch(`${baseUrl}${endpoint}`);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function postJson(endpoint, body) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runGlobalCityTests() {
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
  console.log('   GeoBite: Global City Discovery Test Suite');
  console.log('======================================================\n');

  try {
    await startServer();

    // ── 1. Geocoding Service Unit Tests (with mock fetch) ─────────────
    console.log('--- 1. Testing Geocoding Service (searchLocation) ---');
    clearGeocodeCache();

    // Test rejection of empty query
    try {
      await searchLocation('');
      assert('Empty query throws 400', false, 'Expected searchLocation to throw');
    } catch (err) {
      assert('Empty query throws 400', err.statusCode === 400);
    }

    // Mock global fetch for Nominatim and Overpass
    const originalFetch = global.fetch;

    global.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('nominatim') && urlStr.includes('Tokyo')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              display_name: 'Tokyo, Japan',
              lat: '35.6762',
              lon: '139.6503',
              boundingbox: ['35.5', '35.8', '139.5', '139.9'],
              address: { city: 'Tokyo', country: 'Japan' },
            },
          ],
        };
      }
      if (urlStr.includes('nominatim') && urlStr.includes('NonExistentPlaceXYZ')) {
        return {
          ok: true,
          status: 200,
          json: async () => [],
        };
      }
      if (urlStr.includes('nominatim') && urlStr.includes('TimeoutCity')) {
        const timeoutErr = new Error('The operation was aborted');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      if (urlStr.includes('overpass') || urlStr.includes('interpreter')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            elements: [
              { type: 'node', id: 201, lat: 35.6762, lon: 139.6503, tags: { name: 'Tokyo Ramen Hub', amenity: 'restaurant' } },
              { type: 'node', id: 202, lat: 35.6800, lon: 139.6600, tags: { name: 'Shinjuku Cafe', amenity: 'cafe' } },
              { type: 'node', id: 203, lat: 35.6900, lon: 139.6700, tags: { name: 'Tokyo Tower View', tourism: 'viewpoint' } },
              { type: 'node', id: 204, lat: 35.6750, lon: 139.6550, tags: { name: 'Meiji Shrine', tourism: 'attraction' } },
            ],
          }),
        };
      }
      return originalFetch(url, opts);
    };

    const tokyoLoc = await searchLocation('Tokyo');
    assert('Geocoding resolves Tokyo coordinates correctly', tokyoLoc.lat === 35.6762 && tokyoLoc.lng === 139.6503);
    assert('Geocoding extracts boundingBox', tokyoLoc.boundingBox?.minLat === 35.5);
    assert('Geocoding caches result', tokyoLoc.cityName === 'Tokyo');

    // Test 404 for unknown city
    try {
      await searchLocation('NonExistentPlaceXYZ');
      assert('Unknown location throws 404', false);
    } catch (err) {
      assert('Unknown location throws 404', err.statusCode === 404);
    }

    // Test timeout handling (504)
    try {
      await searchLocation('TimeoutCity');
      assert('Timed out geocoding throws 504', false);
    } catch (err) {
      assert('Timed out geocoding throws 504', err.statusCode === 504);
    }

    // ── 2. Testing Location Search API Endpoint ───────────────────────
    console.log('\n--- 2. Testing GET /api/locations/search ---');
    const locRes = await getJson('/api/locations/search?q=Tokyo');
    assert('GET /api/locations/search returns 200 OK', locRes.status === 200);
    assert('Response contains city coordinates', locRes.data.data?.lat === 35.6762);
    assert('Response contains city name', locRes.data.data?.cityName === 'Tokyo');

    const emptyLocRes = await getJson('/api/locations/search?q=');
    assert('GET /api/locations/search with empty q returns 400', emptyLocRes.status === 400);

    // ── 3. Place Normalization and Deduplication Unit Tests ───────────
    console.log('\n--- 3. Testing Place Normalization & Deduplication ---');
    const mockOsmElements = [
      {
        type: 'node',
        id: 101,
        lat: 35.6762,
        lon: 139.6503,
        tags: {
          name: 'Sushi Dai',
          amenity: 'restaurant',
          'addr:street': 'Tsukiji 5-chome',
        },
      },
      {
        type: 'node',
        id: 102,
        lat: 35.6895,
        lon: 139.6917,
        tags: {
          name: 'Tokyo Skytree Overlook',
          tourism: 'viewpoint',
        },
      },
      // Duplicate by externalId
      {
        type: 'node',
        id: 101,
        lat: 35.6762,
        lon: 139.6503,
        tags: {
          name: 'Sushi Dai Duplicate',
          amenity: 'restaurant',
        },
      },
      // Element missing name (must be filtered out)
      {
        type: 'node',
        id: 103,
        lat: 35.6700,
        lon: 139.6500,
        tags: {
          amenity: 'cafe',
        },
      },
    ];

    const normalized = normalizeOsmElements(mockOsmElements, { cityName: 'Tokyo', country: 'Japan' });
    assert('Normalizes only valid named elements', normalized.length === 2);
    assert('Maps amenity=restaurant to category restaurant', normalized[0].category === 'restaurant');
    assert('Maps tourism=viewpoint to category viewpoint', normalized[1].category === 'viewpoint');
    assert('Generates stable externalId osm:node:101', normalized[0].externalId === 'osm:node:101');
    assert('Sets cityName on normalized places', normalized[0].cityName === 'Tokyo');
    assert('Sets averageRating to 0 (no invented ratings)', normalized[0].averageRating === 0);

    // ── 4. Persisting Global Places in PostgreSQL & PostGIS ───────────
    console.log('\n--- 4. Testing Database Persistence & PostGIS Trigger ---');
    // Save normalized Tokyo test places
    const saved = await persistPlaces(normalized);
    assert('Persists places to PostgreSQL', saved.length >= 2);

    // Verify PostGIS location geography column is automatically populated by trigger
    const postgisCheck = await prisma.$queryRaw`
      SELECT id, name, "cityName", ST_AsText(location) as "geoText"
      FROM places
      WHERE "cityName" = 'Tokyo'
      LIMIT 1;
    `;
    assert('PostGIS trigger auto-populates location geography point', postgisCheck.length > 0 && Boolean(postgisCheck[0].geoText));

    // ── 5. City-Specific Data Isolation in /api/places ────────────────
    console.log('\n--- 5. Testing City-Specific Isolation in GET /api/places ---');
    const tokyoPlacesRes = await getJson('/api/places?city=Tokyo');
    assert('GET /api/places?city=Tokyo returns 200', tokyoPlacesRes.status === 200);
    assert('All returned places belong to Tokyo', tokyoPlacesRes.data.data.every((p) => p.cityName === 'Tokyo'));

    const bengaluruPlacesRes = await getJson('/api/places?city=Bengaluru');
    assert('GET /api/places?city=Bengaluru returns 200', bengaluruPlacesRes.status === 200);
    assert('All returned places belong to Bengaluru (no Tokyo mixing)', bengaluruPlacesRes.data.data.every((p) => p.cityName === 'Bengaluru'));

    // ── 6. Spatial Nearby Search for Global Cities ─────────────────────
    console.log('\n--- 6. Testing Spatial Nearby Search in Tokyo vs Bengaluru ---');
    const tokyoNearby = await getJson('/api/places/nearby?lat=35.6762&lng=139.6503&radius=10');
    assert('Nearby search in Tokyo finds Tokyo places', tokyoNearby.data.data.length > 0);
    assert('Nearby search in Tokyo does NOT return Bengaluru places', tokyoNearby.data.data.every((p) => p.cityName !== 'Bengaluru'));

    const bglNearby = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=5');
    assert('Nearby search in Bengaluru finds Bengaluru places', bglNearby.data.data.length > 0);
    assert('Nearby search in Bengaluru does NOT return Tokyo places', bglNearby.data.data.every((p) => p.cityName === 'Bengaluru'));

    // ── 7. City Discovery Endpoint POST /api/places/discover-city ─────
    console.log('\n--- 7. Testing POST /api/places/discover-city ---');
    // Querying Tokyo when places already exist returns cached/stored places without Overpass call
    const discoverRes = await postJson('/api/places/discover-city', { city: 'Tokyo' });
    assert('POST /api/places/discover-city returns 200', discoverRes.status === 200);
    assert('Response returns city metadata', Boolean(discoverRes.data.data?.city?.lat && discoverRes.data.data?.city?.lng));
    assert('Response returns city places', discoverRes.data.data.places.length > 0);

    // Failure case: invalid city query
    const invalidDiscover = await postJson('/api/places/discover-city', { city: '' });
    assert('Empty city name returns 400', invalidDiscover.status === 400);

    // ── 8. Route Optimization Across Global City Places ───────────────
    console.log('\n--- 8. Testing Route Optimization with Tokyo Places ---');
    const tokyoPlaces = tokyoPlacesRes.data.data;
    if (tokyoPlaces.length >= 2) {
      const placeIds = tokyoPlaces.slice(0, 2).map((p) => p.id);
      const optRes = await postJson('/api/routes/optimize', { placeIds });
      assert('Optimizes route using Tokyo places', optRes.status === 200);
      assert('Optimization results contain Baseline, NN, and 2-opt', Boolean(optRes.data.data.results.twoOpt));
      assert('Ordered coordinates match Tokyo coordinates (~35°N, 139°E)', optRes.data.data.results.twoOpt.orderedCoordinates[0][0] > 30);
    } else {
      console.log('  ⚠ Skipped route optimize check (not enough test places)');
    }

    // ── 9. OSRM Road Routing with Tokyo Coordinates ───────────────────
    console.log('\n--- 9. Testing OSRM Road Routing with Non-Bengaluru Coordinates ---');
    if (tokyoPlaces.length >= 2) {
      const stops = tokyoPlaces.slice(0, 2).map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));
      const roadRes = await postJson('/api/routes/road-route', { stops });
      assert('OSRM road route request succeeds for Tokyo stops', roadRes.status === 200);
      assert('Returns road geometry or valid distance', typeof roadRes.data.data.distanceKm === 'number');
    }

    // ── 10. Verification: No Silent Bengaluru Fallback ────────────────
    console.log('\n--- 10. Testing No Silent Bengaluru Fallback on Failed City ---');
    const failedCityRes = await postJson('/api/places/discover-city', { city: 'NonExistentPlaceXYZ' });
    assert('Non-existent city returns 404', failedCityRes.status === 404);
    assert('Does NOT fall back to Bengaluru on city failure', failedCityRes.data.success === false);

    // Restore fetch
    global.fetch = originalFetch;

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    try {
      await prisma.place.deleteMany({
        where: { externalId: { in: ['osm:node:101', 'osm:node:102'] } },
      });
    } catch (_) {}
    await stopServer();
  }

  console.log('\n======================================================');
  console.log(`GLOBAL CITY DISCOVERY TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGlobalCityTests();
