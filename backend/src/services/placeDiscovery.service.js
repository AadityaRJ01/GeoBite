/**
 * GeoBite — Global Place Discovery Service
 *
 * Discovers authentic local restaurants, cafes, viewpoints, and attractions
 * within any city using the OpenStreetMap Overpass API.
 * Normalizes results into the GeoBite Place schema, performs deduplication,
 * and handles database synchronization with PostGIS geography point indexing.
 */

import prisma from '../lib/prisma.js';

const OVERPASS_API_URL =
  process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

// Fallback public Overpass mirrors in case primary is busy
const OVERPASS_MIRRORS = [
  OVERPASS_API_URL,
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
].filter(Boolean);

const USER_AGENT = 'GeoBite-Platform/1.0 (contact@geobite.app; https://geobite.app)';
const REQUEST_TIMEOUT_MS = 3500;

// Concurrency guard: maps normalized cityName -> active in-flight discovery Promise
const activeDiscoveries = new Map();

/**
 * Determines the category of an OSM element based on tags
 * @param {Object} tags
 * @returns {'restaurant' | 'cafe' | 'viewpoint' | 'attraction'}
 */
function categorizeOsmElement(tags = {}) {
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'food_court') {
    return 'restaurant';
  }
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (
    tags.tourism === 'attraction' ||
    tags.tourism === 'theme_park' ||
    tags.tourism === 'zoo' ||
    tags.tourism === 'museum' ||
    tags.tourism === 'gallery' ||
    tags.historic
  ) {
    return 'attraction';
  }
  return 'restaurant';
}

/**
 * Derives a human-readable address from OSM tags
 * @param {Object} tags
 * @param {string} cityName
 * @param {string} country
 * @returns {string}
 */
function formatOsmAddress(tags = {}, cityName = '', country = '') {
  const parts = [];

  const houseNumber = tags['addr:housenumber'];
  const street = tags['addr:street'] || tags['addr:place'];
  if (houseNumber && street) {
    parts.push(`${houseNumber} ${street}`);
  } else if (street) {
    parts.push(street);
  }

  const suburb = tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'];
  if (suburb) {
    parts.push(suburb);
  }

  const city = tags['addr:city'] || cityName;
  if (city) {
    parts.push(city);
  }

  const postcode = tags['addr:postcode'];
  if (postcode) {
    parts.push(postcode);
  }

  if (country && !parts.includes(country)) {
    parts.push(country);
  }

  return parts.length > 0 ? parts.join(', ') : `${cityName || 'City Center'}, ${country || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
}

/**
 * Derives an estimated visit duration based on place category
 * @param {string} category
 * @returns {number}
 */
function getEstimatedVisitMinutes(category) {
  switch (category) {
    case 'cafe':
      return 30;
    case 'restaurant':
      return 60;
    case 'viewpoint':
      return 45;
    case 'attraction':
      return 75;
    default:
      return 45;
  }
}

/**
 * Queries Overpass API for real geographic nodes in the given area
 *
 * @param {Object} coords
 * @param {number} coords.lat
 * @param {number} coords.lng
 * @param {number} [coords.radiusMeters=10000]
 * @returns {Promise<Array>}
 */
async function fetchOverpassElements({ lat, lng, radiusMeters = 10000 }) {
  // Query for named points of interest across the 4 key categories
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="restaurant"]["name"](around:${radiusMeters},${lat},${lng});
      node["amenity"="cafe"]["name"](around:${radiusMeters},${lat},${lng});
      node["tourism"="viewpoint"]["name"](around:${radiusMeters},${lat},${lng});
      node["tourism"="attraction"]["name"](around:${radiusMeters},${lat},${lng});
      node["historic"]["name"](around:${radiusMeters},${lat},${lng});
    );
    out center 75;
  `;

  let lastError = null;

  // Try mirrors with fallback
  for (const endpoint of OVERPASS_MIRRORS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 429) {
        lastError = new Error('Overpass API rate limit reached (HTTP 429).');
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`Overpass API responded with HTTP ${response.status}.`);
        continue;
      }

      const json = await response.json();
      if (Array.isArray(json.elements)) {
        return json.elements;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Overpass API providers failed to respond.');
}

/**
 * Fallback: Queries OpenStreetMap Nominatim for real POIs in the city bounding box
 * when Overpass instances are overloaded or timing out. Queries categories in parallel
 * for maximum performance.
 *
 * @param {Object} coords
 * @param {number} coords.lat
 * @param {number} coords.lng
 * @param {string} [coords.cityName]
 * @param {string} [coords.country]
 * @param {Object} [coords.boundingBox]
 * @returns {Promise<Array>}
 */
async function fetchNominatimElements({ lat, lng, cityName = '', country = '', boundingBox = null }) {
  const minLat = boundingBox && typeof boundingBox.minLat === 'number' ? boundingBox.minLat.toFixed(4) : (lat - 0.10).toFixed(4);
  const maxLat = boundingBox && typeof boundingBox.maxLat === 'number' ? boundingBox.maxLat.toFixed(4) : (lat + 0.10).toFixed(4);
  const minLon = boundingBox && typeof boundingBox.minLng === 'number' ? boundingBox.minLng.toFixed(4) : (lng - 0.12).toFixed(4);
  const maxLon = boundingBox && typeof boundingBox.maxLng === 'number' ? boundingBox.maxLng.toFixed(4) : (lng + 0.12).toFixed(4);

  const categories = ['restaurant', 'cafe', 'attraction', 'viewpoint', 'museum'];

  const categoryPromises = categories.map(async (cat) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cat)}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&format=json&limit=10&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return [];
      const items = await res.json();
      if (!Array.isArray(items)) return [];

      return items.map((item) => ({
        type: item.osm_type || 'node',
        id: item.osm_id,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        tags: {
          name: item.name || item.display_name.split(',')[0],
          amenity:
            item.type === 'restaurant' || item.type === 'cafe'
              ? item.type
              : cat === 'restaurant' || cat === 'cafe'
                ? cat
                : undefined,
          tourism:
            item.type === 'attraction' || item.type === 'viewpoint' || item.type === 'museum'
              ? item.type
              : cat === 'attraction' || cat === 'viewpoint' || cat === 'museum'
                ? 'attraction'
                : undefined,
          'addr:street': item.address?.road,
          'addr:city': item.address?.city || item.address?.town || cityName,
          'addr:suburb': item.address?.suburb || item.address?.neighbourhood,
          'addr:country': item.address?.country || country,
        },
      }));
    } catch {
      return [];
    }
  });

  const categoryResults = await Promise.all(categoryPromises);
  return categoryResults.flat();
}

/**
 * Normalizes raw OSM elements into GeoBite Place objects
 *
 * @param {Array} elements
 * @param {Object} cityContext
 * @returns {Array<Object>}
 */
export function normalizeOsmElements(elements = [], cityContext = {}) {
  const { cityName = '', country = '' } = cityContext;
  const places = [];
  const seenExternalIds = new Set();
  const seenNameAddresses = new Set();

  for (const el of elements) {
    const tags = el.tags || {};
    const name = (tags.name || tags['name:en'] || '').trim();

    // Skip unnamed or uninformative elements
    if (!name || name.length < 2) continue;

    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
    const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon;

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    const externalId = `osm:${el.type || 'node'}:${el.id}`;
    if (seenExternalIds.has(externalId)) continue;
    seenExternalIds.add(externalId);

    const category = categorizeOsmElement(tags);
    const address = formatOsmAddress(tags, cityName, country);

    const nameAddrKey = `${name.toLowerCase()}::${address.toLowerCase()}`;
    if (seenNameAddresses.has(nameAddrKey)) continue;
    seenNameAddresses.add(nameAddrKey);

    const description =
      tags.description ||
      tags['description:en'] ||
      tags.wikipedia ||
      tags.cuisine
        ? `Known for ${tags.cuisine || 'local specialties'}. Located in ${cityName}.`
        : `Authentic ${category} spot in ${cityName}.`;

    const priceLevel = tags.fee === 'no' ? 'budget' : 'moderate';

    places.push({
      name,
      description,
      category,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      address,
      averageRating: 0.0,
      priceLevel,
      estimatedVisitMinutes: getEstimatedVisitMinutes(category),
      isActive: true,
      cityName,
      externalId,
      source: 'osm',
      lastSyncedAt: new Date(),
    });
  }

  return places;
}

/**
 * Persists normalized places into PostgreSQL via idempotent upsert
 *
 * @param {Array<Object>} places
 * @returns {Promise<Array<Object>>}
 */
export async function persistPlaces(places = []) {
  if (!places || places.length === 0) return [];

  const savedPlaces = [];

  for (const place of places) {
    try {
      // First try finding by externalId
      const existing = await prisma.place.findFirst({
        where: {
          OR: [
            { externalId: place.externalId },
            { name: place.name, address: place.address },
          ],
        },
      });

      if (existing) {
        const updated = await prisma.place.update({
          where: { id: existing.id },
          data: {
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            cityName: place.cityName,
            category: place.category,
            address: place.address,
            description: place.description || existing.description,
            externalId: place.externalId,
            source: place.source,
            lastSyncedAt: new Date(),
            isActive: true,
          },
        });
        savedPlaces.push(updated);
      } else {
        const created = await prisma.place.create({
          data: {
            name: place.name,
            description: place.description,
            category: place.category,
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.address,
            averageRating: place.averageRating,
            priceLevel: place.priceLevel,
            estimatedVisitMinutes: place.estimatedVisitMinutes,
            isActive: true,
            cityName: place.cityName,
            externalId: place.externalId,
            source: place.source,
            lastSyncedAt: new Date(),
          },
        });
        savedPlaces.push(created);
      }
    } catch (err) {
      // Ignore individual record constraint conflicts and continue
      console.warn(`Could not save place "${place.name}":`, err.message);
    }
  }

  return savedPlaces;
}

/**
 * Discover real places for a city and synchronize with PostgreSQL.
 * If places already exist and refresh is not requested, existing places are returned.
 *
 * @param {Object} params
 * @param {string} params.cityName
 * @param {number} params.lat
 * @param {number} params.lng
 * @param {string} [params.country]
 * @param {Object} [params.boundingBox]
 * @param {boolean} [params.refresh=false]
 * @param {number} [params.radiusMeters=12000]
 * @returns {Promise<Array<Object>>}
 */
export async function discoverPlacesForCity({
  cityName,
  lat,
  lng,
  country = '',
  boundingBox = null,
  refresh = false,
  radiusMeters = 12000,
}) {
  if (!cityName) {
    throw new Error('City name is required for place discovery.');
  }

  const normalizedCityKey = cityName.trim().toLowerCase();

  // If an import for this city is already in flight, reuse it
  if (activeDiscoveries.has(normalizedCityKey)) {
    return activeDiscoveries.get(normalizedCityKey);
  }

  const discoveryTask = (async () => {
    console.log(`[PlaceDiscovery] Request for city "${cityName}" at (${lat}, ${lng}) [refresh=${refresh}]`);

    // 1. Check if places already exist in the database for this city
    if (!refresh) {
      const existingPlaces = await prisma.place.findMany({
        where: {
          cityName: { equals: cityName, mode: 'insensitive' },
          isActive: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        take: 60,
      });

      if (existingPlaces.length >= 8) {
        console.log(`[PlaceDiscovery] Found ${existingPlaces.length} cached places in database for "${cityName}".`);
        return existingPlaces;
      }
    }

    // 2. Fetch fresh real places from OpenStreetMap (Overpass primary, Nominatim fallback)
    let rawElements = [];
    let providerUsed = 'overpass';
    try {
      rawElements = await fetchOverpassElements({ lat, lng, radiusMeters });
      console.log(`[PlaceDiscovery] Overpass discovered ${rawElements.length} elements for "${cityName}".`);
    } catch (overpassErr) {
      providerUsed = 'nominatim-parallel';
      console.warn(`[PlaceDiscovery] Overpass failed for "${cityName}": ${overpassErr.message}. Falling back to Nominatim OSM search.`);
      try {
        rawElements = await fetchNominatimElements({ lat, lng, cityName, country, boundingBox });
        console.log(`[PlaceDiscovery] Nominatim discovered ${rawElements.length} elements for "${cityName}".`);
      } catch (nomErr) {
        console.error(`[PlaceDiscovery] Nominatim fallback also failed for "${cityName}":`, nomErr.message);
      }
    }

    if (!rawElements || rawElements.length === 0) {
      // Fallback: check if we have any existing places at all
      const existingPlaces = await prisma.place.findMany({
        where: {
          cityName: { equals: cityName, mode: 'insensitive' },
          isActive: true,
        },
      });
      if (existingPlaces.length > 0) {
        return existingPlaces;
      }
      throw new Error(`Unable to discover places from OpenStreetMap for ${cityName}. Providers are currently unavailable.`);
    }

    // 3. Normalize and deduplicate
    const normalizedPlaces = normalizeOsmElements(rawElements, { cityName, country });

    if (normalizedPlaces.length === 0) {
      // Check existing before returning empty
      const existingPlaces = await prisma.place.findMany({
        where: {
          cityName: { equals: cityName, mode: 'insensitive' },
          isActive: true,
        },
      });
      return existingPlaces;
    }

    // 4. Persist to database (triggers auto-populate PostGIS location)
    await persistPlaces(normalizedPlaces);

    // 5. Query back persisted places with clean ordering
    const freshPlaces = await prisma.place.findMany({
      where: {
        cityName: { equals: cityName, mode: 'insensitive' },
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      take: 60,
    });

    console.log(`[PlaceDiscovery] Successfully saved & returning ${freshPlaces.length} places for "${cityName}" (provider: ${providerUsed}).`);
    return freshPlaces;
  })();

  activeDiscoveries.set(normalizedCityKey, discoveryTask);

  try {
    return await discoveryTask;
  } finally {
    activeDiscoveries.delete(normalizedCityKey);
  }
}

