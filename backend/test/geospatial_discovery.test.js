/**
 * GeoBite — Day 7: Geospatial Discovery Test Suite
 * 
 * Comprehensive tests for PostGIS nearby search endpoint:
 *  - Input validation (lat, lng, radius, category, minRating, maxPrice, page, limit, sortBy, sortOrder)
 *  - Spatial filtering (radius, boundary conditions, empty results)
 *  - Multi-criteria filtering (category, minRating, maxPrice tiers)
 *  - Deterministic sorting (distance asc/desc, rating asc/desc)
 *  - Pagination and metadata accuracy
 *  - SQL parameterization and injection safety
 */

import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';

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

async function runGeospatialDiscoveryTests() {
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
  console.log('   GeoBite Day 7: Geospatial Discovery Test Suite');
  console.log('======================================================\n');

  await startServer();

  try {
    // ── 1. Input Validation: Latitude & Longitude ──────────────────────────
    console.log('--- 1. Testing Latitude and Longitude Validation (HTTP 400) ---');

    const missingLat = await getJson('/api/places/nearby?lng=77.5946');
    assert('Missing lat returns 400', missingLat.status === 400);

    const missingLng = await getJson('/api/places/nearby?lat=12.9716');
    assert('Missing lng returns 400', missingLng.status === 400);

    const invalidLatRange = await getJson('/api/places/nearby?lat=95&lng=77.5946');
    assert('Lat > 90 returns 400', invalidLatRange.status === 400);

    const invalidLatRangeLow = await getJson('/api/places/nearby?lat=-91&lng=77.5946');
    assert('Lat < -90 returns 400', invalidLatRangeLow.status === 400);

    const nonNumericLat = await getJson('/api/places/nearby?lat=not-a-number&lng=77.5946');
    assert('Non-numeric lat returns 400', nonNumericLat.status === 400);

    const invalidLngRange = await getJson('/api/places/nearby?lat=12.9716&lng=185');
    assert('Lng > 180 returns 400', invalidLngRange.status === 400);

    const invalidLngRangeLow = await getJson('/api/places/nearby?lat=12.9716&lng=-185');
    assert('Lng < -180 returns 400', invalidLngRangeLow.status === 400);

    const nonNumericLng = await getJson('/api/places/nearby?lat=12.9716&lng=invalid_coord');
    assert('Non-numeric lng returns 400', nonNumericLng.status === 400);

    // ── 2. Input Validation: Radius, Category, Rating, Price ───────────────
    console.log('\n--- 2. Testing Radius, Category, Rating, and Price Validation ---');

    const zeroRadius = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=0');
    assert('Radius = 0 returns 400', zeroRadius.status === 400);

    const negativeRadius = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=-5');
    assert('Negative radius returns 400', negativeRadius.status === 400);

    const excessiveRadius = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=150');
    assert('Radius > 100 km returns 400', excessiveRadius.status === 400);

    const invalidCategory = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&category=grocery');
    assert('Invalid category returns 400', invalidCategory.status === 400);

    const invalidMinRatingHigh = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&minRating=5.5');
    assert('minRating > 5 returns 400', invalidMinRatingHigh.status === 400);

    const invalidMinRatingLow = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&minRating=-1');
    assert('minRating < 0 returns 400', invalidMinRatingLow.status === 400);

    const invalidMaxPrice = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&maxPrice=luxurious');
    assert('Invalid maxPrice returns 400', invalidMaxPrice.status === 400);

    // ── 3. Input Validation: Pagination and Sorting ─────────────────────────
    console.log('\n--- 3. Testing Pagination and Sorting Validation ---');

    const zeroPage = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&page=0');
    assert('page = 0 returns 400', zeroPage.status === 400);

    const negativePage = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&page=-2');
    assert('Negative page returns 400', negativePage.status === 400);

    const zeroLimit = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&limit=0');
    assert('limit = 0 returns 400', zeroLimit.status === 400);

    const excessiveLimit = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&limit=51');
    assert('limit > 50 returns 400', excessiveLimit.status === 400);

    const invalidSortBy = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&sortBy=popularity');
    assert('Invalid sortBy returns 400', invalidSortBy.status === 400);

    const invalidSortOrder = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&sortOrder=diagonal');
    assert('Invalid sortOrder returns 400', invalidSortOrder.status === 400);

    // ── 4. Valid Spatial Search & Response Structure ────────────────────────
    console.log('\n--- 4. Testing Valid Spatial Nearby Search & Response Structure ---');

    // Central Bengaluru coordinates (MG Road / Cubbon Park vicinity)
    const validSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=5');
    assert('Valid nearby search returns 200 OK', validSearch.status === 200);
    assert('Response includes success: true', validSearch.data.success === true);
    assert('Response includes count property', typeof validSearch.data.count === 'number' && validSearch.data.count > 0);
    assert('Response includes data array', Array.isArray(validSearch.data.data) && validSearch.data.data.length > 0);
    assert('Response includes structured pagination',
      validSearch.data.pagination &&
      validSearch.data.pagination.page === 1 &&
      validSearch.data.pagination.limit === 10 &&
      typeof validSearch.data.pagination.total === 'number' &&
      typeof validSearch.data.pagination.totalPages === 'number'
    );
    assert('Response includes search metadata',
      validSearch.data.search &&
      validSearch.data.search.latitude === 12.9716 &&
      validSearch.data.search.longitude === 77.5946 &&
      validSearch.data.search.radiusKm === 5
    );

    const firstPlace = validSearch.data.data[0];
    assert('Results include distanceMeters and distanceKm',
      typeof firstPlace.distanceMeters === 'number' &&
      typeof firstPlace.distanceKm === 'number' &&
      firstPlace.distanceMeters >= 0 &&
      firstPlace.distanceKm >= 0
    );
    assert('PostGIS distance conversion consistency (km ≈ meters / 1000)',
      Math.abs(firstPlace.distanceKm - Number((firstPlace.distanceMeters / 1000).toFixed(2))) < 0.02
    );

    // ── 5. Empty / Out-of-Range Spatial Search ──────────────────────────────
    console.log('\n--- 5. Testing Zero Results in Remote Coordinates ---');

    // Middle of Indian Ocean (0, 77)
    const emptySearch = await getJson('/api/places/nearby?lat=0.0&lng=77.0&radius=1');
    assert('Empty search returns 200 OK', emptySearch.status === 200);
    assert('Empty search returns 0 count and empty data array',
      emptySearch.data.count === 0 &&
      emptySearch.data.data.length === 0 &&
      emptySearch.data.pagination.total === 0 &&
      emptySearch.data.pagination.totalPages === 0
    );

    // ── 6. Category Filtering ───────────────────────────────────────────────
    console.log('\n--- 6. Testing Category Filtering ---');

    const cafeSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&category=cafe');
    assert('Category filter returns 200 OK', cafeSearch.status === 200);
    assert('All returned places match requested category (cafe)',
      cafeSearch.data.data.every((p) => p.category === 'cafe')
    );

    const restaurantSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&category=restaurant');
    assert('Restaurant filter returns only restaurants',
      restaurantSearch.data.data.every((p) => p.category === 'restaurant')
    );

    // ── 7. Rating Filtering ─────────────────────────────────────────────────
    console.log('\n--- 7. Testing Minimum Rating Filtering ---');

    const ratingSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&minRating=4.4');
    assert('minRating filter returns 200 OK', ratingSearch.status === 200);
    assert('All returned places meet minRating requirement (>= 4.4)',
      ratingSearch.data.data.length > 0 &&
      ratingSearch.data.data.every((p) => p.averageRating >= 4.4)
    );

    // ── 8. Price Level Filtering ────────────────────────────────────────────
    console.log('\n--- 8. Testing Price Level Filtering ---');

    const budgetSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&maxPrice=budget');
    assert('maxPrice=budget returns 200 OK', budgetSearch.status === 200);
    assert('All places returned for maxPrice=budget have priceLevel=budget',
      budgetSearch.data.data.length > 0 &&
      budgetSearch.data.data.every((p) => p.priceLevel === 'budget')
    );

    const moderateSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&maxPrice=moderate');
    assert('maxPrice=moderate includes budget and moderate places',
      moderateSearch.data.data.length > 0 &&
      moderateSearch.data.data.every((p) => ['budget', 'moderate'].includes(p.priceLevel))
    );

    // ── 9. Sorting (Distance and Rating) ─────────────────────────────────────
    console.log('\n--- 9. Testing Deterministic Sorting ---');

    // Distance ASC (default)
    const distAsc = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&sortBy=distance&sortOrder=asc');
    let isDistAsc = true;
    for (let i = 1; i < distAsc.data.data.length; i++) {
      if (distAsc.data.data[i].distanceMeters < distAsc.data.data[i - 1].distanceMeters) {
        isDistAsc = false;
        break;
      }
    }
    assert('sortBy=distance&sortOrder=asc produces non-decreasing distances', isDistAsc);

    // Distance DESC
    const distDesc = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&sortBy=distance&sortOrder=desc');
    let isDistDesc = true;
    for (let i = 1; i < distDesc.data.data.length; i++) {
      if (distDesc.data.data[i].distanceMeters > distDesc.data.data[i - 1].distanceMeters) {
        isDistDesc = false;
        break;
      }
    }
    assert('sortBy=distance&sortOrder=desc produces non-increasing distances', isDistDesc);

    // Rating DESC
    const ratingDesc = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&sortBy=rating&sortOrder=desc');
    let isRatingDesc = true;
    for (let i = 1; i < ratingDesc.data.data.length; i++) {
      if (ratingDesc.data.data[i].averageRating > ratingDesc.data.data[i - 1].averageRating) {
        isRatingDesc = false;
        break;
      }
    }
    assert('sortBy=rating&sortOrder=desc produces non-increasing ratings', isRatingDesc);

    // ── 10. Pagination & Limits ─────────────────────────────────────────────
    console.log('\n--- 10. Testing Pagination and Limits ---');

    const page1 = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&page=1&limit=5');
    const page2 = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=10&page=2&limit=5');

    assert('Page 1 limit=5 returns at most 5 items', page1.data.data.length <= 5);
    assert('Page 2 limit=5 returns at most 5 items', page2.data.data.length <= 5);
    assert('Page 1 and Page 2 contain distinct places',
      page1.data.data.every((p1) => !page2.data.data.some((p2) => p2.id === p1.id))
    );
    assert('Pagination metadata accurately reflects page count',
      page1.data.pagination.page === 1 &&
      page2.data.pagination.page === 2 &&
      page1.data.pagination.total === page2.data.pagination.total
    );

    // Out-of-bounds page
    const outOfBounds = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=5&page=999&limit=10');
    assert('Out-of-bounds page returns 200 with empty array and valid metadata',
      outOfBounds.status === 200 &&
      outOfBounds.data.data.length === 0 &&
      outOfBounds.data.pagination.page === 999 &&
      outOfBounds.data.pagination.total > 0
    );

    // ── 11. SQL Injection & Parameterization Resilience ────────────────────
    console.log('\n--- 11. Testing SQL Injection & Parameterization Resilience ---');

    const injectionCategory = await getJson(
      `/api/places/nearby?lat=12.9716&lng=77.5946&category=${encodeURIComponent("' OR '1'='1")}`
    );
    assert('SQL injection in category fails validation with 400', injectionCategory.status === 400);

    const injectionSort = await getJson(
      `/api/places/nearby?lat=12.9716&lng=77.5946&sortBy=${encodeURIComponent("; DROP TABLE places; --")}`
    );
    assert('SQL injection in sortBy fails validation with 400', injectionSort.status === 400);

    const placesStillExist = await getJson('/api/places?city=Bengaluru');
    assert('Database integrity intact: Bengaluru places count is 18', placesStillExist.data.count === 18);

    // ── 12. Testing Bounding Box Viewport Search (GET /api/places/bounds) ──
    console.log('\n--- 12. Testing Bounding Box Viewport Search (GET /api/places/bounds) ---');

    const missingBounds = await getJson('/api/places/bounds');
    assert('Missing bounds params returns 400', missingBounds.status === 400);

    const invalidRange = await getJson('/api/places/bounds?minLat=13&maxLat=12&minLng=77&maxLng=78');
    assert('minLat > maxLat returns 400', invalidRange.status === 400);

    const validBounds = await getJson('/api/places/bounds?minLat=12.90&minLng=77.50&maxLat=13.05&maxLng=77.70');
    assert('Valid bounding box returns 200 OK', validBounds.status === 200);
    assert('Bounding box returns places within the box', validBounds.data.count > 0 && Array.isArray(validBounds.data.data));

    const cafeBounds = await getJson('/api/places/bounds?minLat=12.90&minLng=77.50&maxLat=13.05&maxLng=77.70&category=cafe');
    assert('Bounding box respects category filter', cafeBounds.status === 200 && cafeBounds.data.data.every((p) => p.category === 'cafe'));

    // ── 13. Testing Keyword & Full-Text Search Integration (Day 10) ──
    console.log('\n--- 13. Testing Keyword & Full-Text Search Integration ---');

    // Exact name match
    const exactName = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=Karavalli');
    assert('Exact name search "Karavalli" returns 200 with matching place',
      exactName.status === 200 &&
      exactName.data.data.some((p) => p.name === 'Karavalli') &&
      exactName.data.search.query === 'Karavalli'
    );

    // Partial name match
    const partialName = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=Blue%20Tokai');
    assert('Partial name search "Blue Tokai" returns matching place',
      partialName.status === 200 &&
      partialName.data.data.some((p) => p.name.includes('Blue Tokai'))
    );

    // Description keyword match
    const descSearch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=botanical');
    assert('Description keyword "botanical" returns matching place',
      descSearch.status === 200 &&
      descSearch.data.data.length > 0 &&
      descSearch.data.data.some((p) => p.name.toLowerCase().includes('lalbagh') || p.description.toLowerCase().includes('botanical'))
    );

    // Category keyword match via search
    const catQuery = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=cafe');
    assert('Category keyword search "cafe" returns cafe places',
      catQuery.status === 200 &&
      catQuery.data.data.length > 0 &&
      catQuery.data.data.some((p) => p.category === 'cafe')
    );

    // Case-insensitivity match
    const upperCase = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=TRUFFLES');
    assert('Uppercase query "TRUFFLES" matches Truffles',
      upperCase.status === 200 &&
      upperCase.data.data.some((p) => p.name.toLowerCase().includes('truffles'))
    );

    // Combined keyword + minRating filter
    const combinedRating = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=coffee&minRating=4.4');
    assert('Combined query "coffee" + minRating=4.4 returns only places with rating >= 4.4',
      combinedRating.status === 200 &&
      combinedRating.data.data.every((p) => p.averageRating >= 4.4)
    );

    // Combined keyword + category filter
    const combinedCat = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=Lalbagh&category=attraction');
    assert('Combined query "Lalbagh" + category=attraction returns only attractions',
      combinedCat.status === 200 &&
      combinedCat.data.data.length > 0 &&
      combinedCat.data.data.every((p) => p.category === 'attraction')
    );

    // Non-existent search query returns 0 items safely
    const noMatch = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=xyznonexistent123');
    assert('Non-matching query returns 200 with 0 count and empty array',
      noMatch.status === 200 &&
      noMatch.data.count === 0 &&
      noMatch.data.data.length === 0
    );

    // SQL Injection query safety
    const injectionQuery = await getJson(
      `/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=${encodeURIComponent("'; DROP TABLE places; --")}`
    );
    assert('SQL injection in query param is safely handled without error',
      injectionQuery.status === 200 &&
      injectionQuery.data.count === 0
    );

    // Query exceeding maximum length (>100 characters)
    const longQuery = 'a'.repeat(101);
    const excessiveQuery = await getJson(
      `/api/places/nearby?lat=12.9716&lng=77.5946&query=${longQuery}`
    );
    assert('Query parameter > 100 characters returns 400 Bad Request',
      excessiveQuery.status === 400 &&
      excessiveQuery.data.error.message.includes('100 characters')
    );

    // Empty query param gracefully handled
    const emptyQuery = await getJson('/api/places/nearby?lat=12.9716&lng=77.5946&radius=100&query=');
    assert('Empty query parameter returns 200 OK without errors',
      emptyQuery.status === 200 &&
      emptyQuery.data.data.length > 0
    );

    // Viewport bounds search with query param
    const boundsWithQuery = await getJson(
      '/api/places/bounds?minLat=12.90&minLng=77.50&maxLat=13.05&maxLng=77.70&query=Karavalli'
    );
    assert('Bounds search with keyword "Karavalli" returns matched place',
      boundsWithQuery.status === 200 &&
      boundsWithQuery.data.data.some((p) => p.name === 'Karavalli')
    );

    // Viewport bounds search with query > 100 characters returns 400
    const boundsLongQuery = await getJson(
      `/api/places/bounds?minLat=12.90&minLng=77.50&maxLat=13.05&maxLng=77.70&query=${longQuery}`
    );
    assert('Bounds search with query > 100 characters returns 400 Bad Request',
      boundsLongQuery.status === 400
    );

  } finally {
    await stopServer();
  }

  console.log('\n======================================================');
  console.log(`GEOSPATIAL & KEYWORD SEARCH TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeospatialDiscoveryTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

