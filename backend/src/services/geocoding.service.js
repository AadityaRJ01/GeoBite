/**
 * GeoBite — Global Geocoding Service
 *
 * Resolves city names and geographical queries to normalized coordinates, bounding boxes,
 * and location metadata using OpenStreetMap Nominatim. Includes in-memory caching,
 * user-agent compliance, timeout safety, and rate-limit handling.
 */

const NOMINATIM_BASE_URL =
  process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

const DEFAULT_TIMEOUT_MS = 6000;
const USER_AGENT = 'GeoBite-Platform/1.0 (contact@geobite.app; https://geobite.app)';

// In-memory cache for resolved locations: query -> normalized location object
const geocodeCache = new Map();

/**
 * Normalizes query string for cache keying
 * @param {string} query
 * @returns {string}
 */
function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query.trim().toLowerCase();
}

/**
 * Searches for a location by query name using OSM Nominatim.
 *
 * @param {string} query - City, region, or address query string
 * @param {Object} [options]
 * @param {number} [options.timeoutMs] - Request timeout in ms
 * @param {boolean} [options.bypassCache] - Bypass in-memory cache
 * @returns {Promise<{
 *   query: string,
 *   displayName: string,
 *   cityName: string,
 *   country: string,
 *   lat: number,
 *   lng: number,
 *   boundingBox: { minLat: number, maxLat: number, minLng: number, maxLng: number }
 * }>}
 */
export async function searchLocation(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    const error = new Error('Query parameter "q" is required and cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuery = query.trim();
  const cacheKey = normalizeQuery(trimmedQuery);

  // Return cached result if available
  if (!options.bypassCache && geocodeCache.has(cacheKey)) {
    return { ...geocodeCache.get(cacheKey) };
  }

  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const url = new URL('/search', NOMINATIM_BASE_URL);
  url.searchParams.set('q', trimmedQuery);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');

  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const error = new Error(`Geocoding request timed out after ${timeoutMs}ms.`);
      error.statusCode = 504;
      throw error;
    }
    const error = new Error('Failed to reach geocoding provider. Please check network connectivity.');
    error.statusCode = 503;
    throw error;
  }

  if (response.status === 429) {
    const error = new Error('Nominatim geocoding rate limit reached. Please wait a moment before trying again.');
    error.statusCode = 429;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Geocoding provider responded with HTTP ${response.status}.`);
    error.statusCode = response.status >= 500 ? 502 : response.status;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    const error = new Error('Invalid JSON response received from geocoding provider.');
    error.statusCode = 502;
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    const error = new Error(`No geographic location found matching "${trimmedQuery}".`);
    error.statusCode = 404;
    throw error;
  }

  const item = data[0];
  const parsedLat = parseFloat(item.lat);
  const parsedLng = parseFloat(item.lon);

  if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    const error = new Error(`Invalid coordinates received from geocoding provider for "${trimmedQuery}".`);
    error.statusCode = 502;
    throw error;
  }

  // Parse bounding box: Nominatim returns [south, north, west, east]
  let boundingBox = null;
  if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
    const south = parseFloat(item.boundingbox[0]);
    const north = parseFloat(item.boundingbox[1]);
    const west = parseFloat(item.boundingbox[2]);
    const east = parseFloat(item.boundingbox[3]);
    if (!isNaN(south) && !isNaN(north) && !isNaN(west) && !isNaN(east)) {
      boundingBox = {
        minLat: south,
        maxLat: north,
        minLng: west,
        maxLng: east,
      };
    }
  }

  // Derive city name from address hierarchy
  const address = item.address || {};
  const cityName =
    address.city ||
    address.town ||
    address.municipality ||
    address.village ||
    address.county ||
    address.state ||
    item.name ||
    trimmedQuery;

  const country = address.country || '';

  const result = {
    query: trimmedQuery,
    displayName: item.display_name || trimmedQuery,
    cityName,
    country,
    lat: Number(parsedLat.toFixed(6)),
    lng: Number(parsedLng.toFixed(6)),
    boundingBox,
  };

  // Cache normalized result
  geocodeCache.set(cacheKey, result);

  // Also cache under normalized city name if different
  const cityKey = normalizeQuery(cityName);
  if (cityKey && !geocodeCache.has(cityKey)) {
    geocodeCache.set(cityKey, result);
  }

  return { ...result };
}

/**
 * Clears the geocode cache (useful for testing or cache refresh)
 */
export function clearGeocodeCache() {
  geocodeCache.clear();
}

