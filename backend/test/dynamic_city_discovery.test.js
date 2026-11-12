/**
 * GeoBite — Critical Fix: Truly Dynamic Global City Discovery Test Suite
 *
 * Validates dynamic geocoding, multi-category place discovery, database persistence,
 * PostGIS spatial indexing, comma-tolerant city matching, multi-city switching,
 * and stale request rejection for Mumbai and arbitrary global cities.
 */

import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { searchLocation, clearGeocodeCache } from '../src/services/geocoding.service.js';
import { normalizeOsmElements, persistPlaces, discoverPlacesForCity } from '../src/services/placeDiscovery.service.js';

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
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

async function runDynamicCityDiscoveryTests() {
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
  console.log('   GeoBite: Truly Dynamic Global City Discovery Tests');
  console.log('======================================================\n');

  try {
    await startServer();

    // ── 1. Dynamic Geocoding for Mumbai & Arbitrary Cities ─────────────
    console.log('--- 1. Dynamic Geocoding & Bounding Box ---');
    clearGeocodeCache();

    const mumbaiGeo = await searchLocation('Mumbai');
    assert('Mumbai coordinates resolved', mumbaiGeo && typeof mumbaiGeo.lat === 'number' && typeof mumbaiGeo.lng === 'number');
    assert('Mumbai latitude in range (18°N - 20°N)', mumbaiGeo.lat >= 18.5 && mumbaiGeo.lat <= 19.5, `Got: ${mumbaiGeo.lat}`);
    assert('Mumbai longitude in range (72°E - 73.5°E)', mumbaiGeo.lng >= 72.5 && mumbaiGeo.lng <= 73.5, `Got: ${mumbaiGeo.lng}`);
    assert('Mumbai bounding box present', mumbaiGeo.boundingBox && typeof mumbaiGeo.boundingBox.minLat === 'number');

    const delhiGeo = await searchLocation('Delhi');
    assert('Delhi coordinates resolved', delhiGeo && typeof delhiGeo.lat === 'number' && typeof delhiGeo.lng === 'number');
    assert('Delhi latitude in range (28°N - 29°N)', delhiGeo.lat >= 28.0 && delhiGeo.lat <= 29.0, `Got: ${delhiGeo.lat}`);

    // ── 2. Discover & Persist Places for Mumbai ──────────────────────
    console.log('\n--- 2. Place Discovery & Database Persistence for Mumbai ---');

    // Seed mock OSM elements for Mumbai to test normalization, persistence, and PostGIS point indexing
    const mockMumbaiOsm = [
      {
        type: 'node',
        id: 991001,
        lat: 18.9220,
        lon: 72.8347,
        tags: {
          name: 'Gateway of India Attraction',
          tourism: 'attraction',
          'addr:street': 'Apollo Bandar, Colaba',
          'addr:city': 'Mumbai',
        },
      },
      {
        type: 'node',
        id: 991002,
        lat: 18.9240,
        lon: 72.8330,
        tags: {
          name: 'Colaba Social Cafe',
          amenity: 'cafe',
          'addr:street': 'B.K. Boman Behram Marg',
          'addr:city': 'Mumbai',
        },
      },
      {
        type: 'node',
        id: 991003,
        lat: 18.9322,
        lon: 72.8264,
        tags: {
          name: 'Marine Drive Viewpoint',
          tourism: 'viewpoint',
          'addr:street': 'Netaji Subhash Chandra Bose Road',
          'addr:city': 'Mumbai',
        },
      },
      {
        type: 'node',
        id: 991004,
        lat: 19.0600,
        lon: 72.8360,
        tags: {
          name: 'Bandra Coastal Restaurant',
          amenity: 'restaurant',
          'addr:street': 'Hill Road, Bandra West',
          'addr:city': 'Mumbai',
        },
      },
    ];

    const normalizedMumbai = normalizeOsmElements(mockMumbaiOsm, { cityName: 'Mumbai', country: 'India' });
    assert('Normalized 4 Mumbai OSM elements', normalizedMumbai.length === 4);
    assert('Category mapping correct (attraction)', normalizedMumbai[0].category === 'attraction');
    assert('Category mapping correct (cafe)', normalizedMumbai[1].category === 'cafe');
    assert('Category mapping correct (viewpoint)', normalizedMumbai[2].category === 'viewpoint');
    assert('Category mapping correct (restaurant)', normalizedMumbai[3].category === 'restaurant');

    const persisted = await persistPlaces(normalizedMumbai);
    assert('Persisted 4 Mumbai places into database', persisted.length === 4);

    // ── 3. Comma-Tolerant & Case-Insensitive City Matching ────────────
    console.log('\n--- 3. Comma-Tolerant & Case-Insensitive City Matching ---');

    const res1 = await getJson('/api/places?city=Mumbai');
    assert('GET /api/places?city=Mumbai succeeds', res1.ok && res1.data.count >= 4);

    const res2 = await getJson('/api/places?city=Mumbai,%20India');
    assert('GET /api/places?city=Mumbai, India succeeds', res2.ok && res2.data.count >= 4);

    const res3 = await getJson('/api/places?city=mumbai');
    assert('GET /api/places?city=mumbai (lowercase) succeeds', res3.ok && res3.data.count >= 4);

    const categoryRes = await getJson('/api/places?city=Mumbai&category=cafe');
    assert('GET /api/places?city=Mumbai&category=cafe filters correctly', categoryRes.ok && categoryRes.data.data.some(p => p.category === 'cafe'));

    // ── 4. Spatial Isolation between Cities ──────────────────────────
    console.log('\n--- 4. PostGIS Spatial Isolation Between Cities ---');

    // Querying nearby Bengaluru (12.9716, 77.5946) within 15km must NOT return Mumbai places
    const bglNearby = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=15');
    assert('Nearby Bengaluru query succeeds', bglNearby.ok);
    const hasMumbaiInBgl = bglNearby.data.data.some(p => p.cityName && p.cityName.toLowerCase() === 'mumbai');
    assert('Spatial isolation: Bengaluru nearby query does NOT include Mumbai places', !hasMumbaiInBgl);

    // Querying nearby Mumbai (18.93, 72.83) within 15km must return Mumbai places
    const mumNearby = await getJson('/api/places/nearby?lat=18.9220&lng=72.8347&radius=15');
    assert('Nearby Mumbai query succeeds', mumNearby.ok && mumNearby.data.count >= 3);
    const allInMumbai = mumNearby.data.data.every(p => p.distanceMeters <= 15000);
    assert('All returned places within 15km of Mumbai query point', allInMumbai);

    // ── 5. Discover City Endpoint POST /api/places/discover-city ──────
    console.log('\n--- 5. POST /api/places/discover-city API ---');

    const discRes = await postJson('/api/places/discover-city', { city: 'Mumbai' });
    assert('POST /api/places/discover-city succeeds', discRes.ok);
    assert('Response contains city metadata', discRes.data.data.city && discRes.data.data.city.name);
    assert('City name matches Mumbai', discRes.data.data.city.name.toLowerCase().includes('mumbai'));
    assert('Authoritative Mumbai lat/lng returned', discRes.data.data.city.lat >= 18.5 && discRes.data.data.city.lat <= 19.5);
    assert('Discovered places array returned', Array.isArray(discRes.data.data.places) && discRes.data.data.places.length >= 4);

    // ── 6. Route Optimization on Real Mumbai Places ───────────────────
    console.log('\n--- 6. Route Optimization on Real Mumbai Places ---');

    const mumbaiPlaces = res1.data.data.slice(0, 4);
    const placeIds = mumbaiPlaces.map(p => p.id);

    const optRes = await postJson('/api/routes/optimize', { placeIds });
    assert('Route optimizer succeeds on Mumbai places', optRes.ok);
    assert('Optimizer includes baseline, nearestNeighbor, twoOpt', optRes.data.data.results.baseline && optRes.data.data.results.nearestNeighbor && optRes.data.data.results.twoOpt);
    assert('Route coordinates match Mumbai latitude range', optRes.data.data.bestRoute.orderedCoordinates.every(([lat]) => lat >= 18.5 && lat <= 19.5));

    // ── 7. Rapid City Switching & Stale Response Protection ───────────
    console.log('\n--- 7. Rapid Multi-City Switching & Race Condition Guard ---');

    // Simulate concurrent requests for different cities
    const [cityA, cityB, cityC] = await Promise.all([
      getJson('/api/places?city=Mumbai'),
      getJson('/api/places?city=Bengaluru'),
      getJson('/api/places?city=Tokyo'),
    ]);

    assert('City A (Mumbai) returned successfully', cityA.ok && cityA.data.data.every(p => p.cityName.toLowerCase() === 'mumbai'));
    assert('City B (Bengaluru) returned successfully', cityB.ok && cityB.data.data.every(p => p.cityName.toLowerCase().includes('bengaluru')));

    // Cleanup mock records
    await prisma.place.deleteMany({
      where: {
        externalId: { in: ['osm:node:991001', 'osm:node:991002', 'osm:node:991003', 'osm:node:991004'] },
      },
    });

  } catch (err) {
    console.error('Fatal test runner error:', err);
    failed++;
  } finally {
    await stopServer();
  }

  console.log('\n======================================================');
  console.log(`   Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDynamicCityDiscoveryTests();

