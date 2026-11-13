/**
 * GeoBite — Saved Routes & Trip History Integration Tests (Day 18)
 *
 * Verifies:
 * 1. Authentication requirement for all saved route endpoints (401 on unauthorized)
 * 2. Creating a saved route with valid payload & metrics
 * 3. Validation errors on invalid coordinates, < 2 stops, missing name/city
 * 4. User data isolation (User A cannot view, rename, or delete User B's route)
 * 5. Listing user's saved routes with pagination & city filter
 * 6. Renaming a saved route
 * 7. Preserving stop order and coordinates accurately for map restoration
 * 8. Deleting a saved route with confirmation
 * 9. Handling missing OSRM metrics gracefully (nullable estimatedTravelMinutes)
 */

import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

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

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // ignore non-json
  }

  return {
    status: response.status,
    body: data
  };
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

async function run() {
  console.log('\n--- Running GeoBite Day 18: Saved Routes & Trip History Tests ---');
  await startServer();

  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';

  const testUserA = {
    name: 'Alice Traveler',
    email: `alice_day18_${Date.now()}@example.com`,
    password: 'Password123!'
  };

  const testUserB = {
    name: 'Bob Explorer',
    email: `bob_day18_${Date.now()}@example.com`,
    password: 'Password123!'
  };

  const sampleStopsMumbai = [
    {
      id: 'm1',
      name: 'Gateway of India',
      latitude: 18.9220,
      longitude: 72.8347,
      category: 'Attraction',
      address: 'Apollo Bandar, Colaba, Mumbai',
      visitOrder: 1
    },
    {
      id: 'm2',
      name: 'Marine Drive Promenade',
      latitude: 18.9438,
      longitude: 72.8232,
      category: 'Viewpoint',
      address: 'Netaji Subhash Chandra Bose Road, Mumbai',
      visitOrder: 2
    },
    {
      id: 'm3',
      name: 'Chhatrapati Shivaji Maharaj Terminus',
      latitude: 18.9400,
      longitude: 72.8354,
      category: 'Heritage',
      address: 'Fort, Mumbai',
      visitOrder: 3
    }
  ];

  try {
    // Setup users
    const resA = await apiRequest('/api/auth/register', { method: 'POST', body: testUserA });
    assert.equal(resA.status, 201, 'User A should register');
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    const resB = await apiRequest('/api/auth/register', { method: 'POST', body: testUserB });
    assert.equal(resB.status, 201, 'User B should register');
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;

    // 1. Auth Protection
    await test('GET /api/saved-routes rejects unauthenticated request with 401', async () => {
      const res = await apiRequest('/api/saved-routes');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    await test('POST /api/saved-routes rejects unauthenticated request with 401', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        body: { name: 'Unauthorized Trip', cityName: 'Mumbai', stops: sampleStopsMumbai }
      });
      assert.equal(res.status, 401);
    });

    // 2. Validation & Creation
    await test('POST /api/saved-routes fails if name is missing or whitespace', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: { name: '   ', cityName: 'Mumbai', stops: sampleStopsMumbai, totalDistanceKm: 10 }
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    await test('POST /api/saved-routes fails if cityName is missing', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: { name: 'Trip', cityName: '', stops: sampleStopsMumbai, totalDistanceKm: 10 }
      });
      assert.equal(res.status, 400);
    });

    await test('POST /api/saved-routes fails if stops count is less than 2', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: { name: 'Single Stop', cityName: 'Mumbai', stops: [sampleStopsMumbai[0]], totalDistanceKm: 0 }
      });
      assert.equal(res.status, 400);
    });

    await test('POST /api/saved-routes fails if any stop has invalid coordinates', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: {
          name: 'Invalid Lat',
          cityName: 'Mumbai',
          totalDistanceKm: 5,
          stops: [sampleStopsMumbai[0], { name: 'Off World', latitude: 999.0, longitude: 72.8 }]
        }
      });
      assert.equal(res.status, 400);
    });

    let savedRoute1Id = '';
    await test('POST /api/saved-routes creates a route with valid metrics and stops', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: {
          name: 'South Mumbai Heritage Walk',
          cityName: 'Mumbai',
          algorithm: 'genetic',
          totalDistanceKm: 8.45,
          estimatedTravelMinutes: 42.0,
          stops: sampleStopsMumbai
        }
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'South Mumbai Heritage Walk');
      assert.equal(res.body.data.cityName, 'Mumbai');
      assert.equal(res.body.data.stopCount, 3);
      assert.equal(res.body.data.totalDistanceKm, 8.45);
      assert.equal(res.body.data.estimatedTravelMinutes, 42.0);
      assert.equal(res.body.data.stops.length, 3);
      assert.equal(res.body.data.stops[0].name, 'Gateway of India');
      assert.equal(res.body.data.stops[0].visitOrder, 1);
      savedRoute1Id = res.body.data.id;
    });

    await test('POST /api/saved-routes handles missing OSRM duration gracefully', async () => {
      const res = await apiRequest('/api/saved-routes', {
        method: 'POST',
        token: userAToken,
        body: {
          name: 'Delhi Quick Tour',
          cityName: 'Delhi',
          algorithm: 'nearest-neighbor',
          totalDistanceKm: 15.2,
          stops: [
            { name: 'India Gate', latitude: 28.6129, longitude: 77.2295 },
            { name: 'Red Fort', latitude: 28.6562, longitude: 77.2410 }
          ]
        }
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.estimatedTravelMinutes, null);
      assert.equal(res.body.data.stopCount, 2);
    });

    // 3. User Data Isolation
    await test('GET /api/saved-routes/:id allows User A to view their route', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        token: userAToken
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, savedRoute1Id);
    });

    await test('GET /api/saved-routes/:id prevents User B from viewing User A route (returns 404)', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        token: userBToken
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    await test('PUT /api/saved-routes/:id prevents User B from renaming User A route (returns 404)', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        method: 'PUT',
        token: userBToken,
        body: { name: 'Attempted Hijack' }
      });
      assert.equal(res.status, 404);
    });

    await test('DELETE /api/saved-routes/:id prevents User B from deleting User A route (returns 404)', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        method: 'DELETE',
        token: userBToken
      });
      assert.equal(res.status, 404);
    });

    // 4. Listing, Filtering & Updating
    await test('GET /api/saved-routes lists all routes for User A', async () => {
      const res = await apiRequest('/api/saved-routes', {
        token: userAToken
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.routes.length >= 2);
      assert.ok(res.body.data.routes.every(r => r.userId === userAId));
    });

    await test('GET /api/saved-routes filters by cityName correctly', async () => {
      const res = await apiRequest('/api/saved-routes?city=Delhi', {
        token: userAToken
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.routes.length >= 1);
      assert.ok(res.body.data.routes.every(r => r.cityName.toLowerCase() === 'delhi'));
    });

    await test('PUT /api/saved-routes/:id renames the route successfully', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        method: 'PUT',
        token: userAToken,
        body: { name: 'Updated South Mumbai Classic' }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.name, 'Updated South Mumbai Classic');
    });

    await test('DELETE /api/saved-routes/:id deletes the route successfully', async () => {
      const res = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        method: 'DELETE',
        token: userAToken
      });
      assert.equal(res.status, 200);

      // Verify it is now 404
      const check = await apiRequest(`/api/saved-routes/${savedRoute1Id}`, {
        token: userAToken
      });
      assert.equal(check.status, 404);
    });

  } finally {
    // Cleanup
    await prisma.savedRoute.deleteMany({
      where: { userId: { in: [userAId, userBId] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } }
    });
    await stopServer();
  }

  console.log(`\nDay 18 Saved Routes Tests Complete: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
