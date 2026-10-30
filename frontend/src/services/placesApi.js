/**
 * GeoBite — Places API Service
 * 
 * Reusable HTTP client for communicating with the GeoBite Express backend.
 * Encapsulates base URL configuration, network resilience, response parsing,
 * and standard error formatting.
 */

// Configure base URL with resilient normalization
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// Strip trailing slash
const CLEAN_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
// Ensure '/api' suffix is present exactly once
const API_BASE_URL = CLEAN_BASE_URL.endsWith('/api')
  ? CLEAN_BASE_URL
  : `${CLEAN_BASE_URL}/api`;

/**
 * Custom application error class for GeoBite API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Standard HTTP helper with timeout and error parsing
 */
async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      `Unable to reach GeoBite API at ${url}. Please verify that the backend server is running on port 5000.`,
      0,
      networkError
    );
  }

  let parsedBody;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      parsedBody = await response.json();
    } catch (parseError) {
      throw new ApiError(
        'Malformed JSON response received from GeoBite backend.',
        response.status,
        parseError
      );
    }
  } else {
    const rawText = await response.text();
    if (!response.ok) {
      throw new ApiError(
        rawText || `HTTP request failed with status ${response.status}`,
        response.status
      );
    }
    parsedBody = rawText;
  }

  if (!response.ok) {
    const errorMessage =
      parsedBody?.error?.message ||
      parsedBody?.message ||
      `Request failed with status ${response.status} (${response.statusText})`;
    throw new ApiError(errorMessage, response.status, parsedBody);
  }

  return parsedBody;
}

/**
 * Fetch all active places, with optional category filtering
 * @param {Object} [params] - Query parameters
 * @param {string} [params.category] - Filter by category ('restaurant' | 'cafe' | 'viewpoint' | 'attraction')
 * @returns {Promise<{ places: Array, count: number }>}
 */
export async function fetchPlaces(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }

  const queryString = query.toString();
  const endpoint = queryString ? `/places?${queryString}` : '/places';

  const response = await fetchJson(endpoint);

  // Response shape: { success: true, count: number, data: [...] }
  const rawPlaces = Array.isArray(response.data) ? response.data : [];
  
  // Transform and validate records
  const validatedPlaces = rawPlaces.map((place) => ({
    ...place,
    // Ensure numeric coordinates
    latitude: typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude),
    longitude: typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude),
    hasValidCoordinates:
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude) &&
      place.latitude >= -90 &&
      place.latitude <= 90 &&
      place.longitude >= -180 &&
      place.longitude <= 180,
  }));

  return {
    places: validatedPlaces,
    count: response.count ?? validatedPlaces.length,
    success: response.success ?? true,
  };
}

/**
 * Fetch places nearby a geographic point using PostGIS spatial search.
 * @param {Object} params - Query parameters
 * @param {number|string} params.lat - Latitude (-90 to 90)
 * @param {number|string} params.lng - Longitude (-180 to 180)
 * @param {number|string} [params.radius=5] - Radius in km (0.1 to 100)
 * @param {string} [params.category] - Optional category filter
 * @param {number|string} [params.minRating] - Optional minimum rating (0 to 5)
 * @param {string} [params.maxPrice] - Optional maximum price tier ('budget' | 'moderate' | 'premium')
 * @param {number|string} [params.page=1] - Pagination page number
 * @param {number|string} [params.limit=10] - Result limit (1 to 50)
 * @param {string} [params.sortBy='distance'] - Sort key ('distance' | 'rating')
 * @param {string} [params.sortOrder] - Sort direction ('asc' | 'desc')
 * @returns {Promise<{ places: Array, count: number, success: boolean, pagination: Object, search: Object }>}
 */
export async function fetchNearbyPlaces(params = {}) {
  const {
    lat,
    lng,
    radius,
    category,
    minRating,
    maxPrice,
    page,
    limit,
    sortBy,
    sortOrder,
  } = params;

  if (lat === undefined || lat === null || isNaN(Number(lat))) {
    throw new ApiError('A valid latitude (lat) is required for nearby search.', 400);
  }
  if (lng === undefined || lng === null || isNaN(Number(lng))) {
    throw new ApiError('A valid longitude (lng) is required for nearby search.', 400);
  }

  const query = new URLSearchParams();
  query.set('lat', String(lat));
  query.set('lng', String(lng));

  if (radius !== undefined && radius !== null) {
    query.set('radius', String(radius));
  }
  if (category && category !== 'all') {
    query.set('category', category);
  }
  if (minRating !== undefined && minRating !== null && String(minRating).trim() !== '') {
    query.set('minRating', String(minRating));
  }
  if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== '') {
    query.set('maxPrice', String(maxPrice));
  }
  if (page !== undefined && page !== null && String(page).trim() !== '') {
    query.set('page', String(page));
  }
  if (limit !== undefined && limit !== null && String(limit).trim() !== '') {
    query.set('limit', String(limit));
  }
  if (sortBy) {
    query.set('sortBy', sortBy);
  }
  if (sortOrder) {
    query.set('sortOrder', sortOrder);
  }

  const response = await fetchJson(`/places/nearby?${query.toString()}`);

  const rawPlaces = Array.isArray(response.data) ? response.data : [];

  const validatedPlaces = rawPlaces.map((place) => {
    const latNum = typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude);
    const lngNum = typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude);
    const hasValidCoordinates =
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180;

    const distMeters =
      typeof place.distanceMeters === 'number'
        ? Math.round(place.distanceMeters)
        : Math.round(Number(place.distanceMeters || 0));

    const distKm =
      typeof place.distanceKm === 'number'
        ? place.distanceKm
        : Number((distMeters / 1000).toFixed(2));

    return {
      ...place,
      latitude: latNum,
      longitude: lngNum,
      hasValidCoordinates,
      distanceMeters: distMeters,
      distanceKm: distKm,
    };
  });

  return {
    places: validatedPlaces,
    count: response.count ?? validatedPlaces.length,
    success: response.success ?? true,
    pagination: response.pagination || null,
    search: response.search || null,
  };
}

/**
 * Fetch places within a rectangular bounding box (visible map viewport).
 * @param {Object} bounds - Bounding box coordinates
 * @param {number|string} bounds.minLat - South latitude (-90 to 90)
 * @param {number|string} bounds.minLng - West longitude (-180 to 180)
 * @param {number|string} bounds.maxLat - North latitude (-90 to 90)
 * @param {number|string} bounds.maxLng - East longitude (-180 to 180)
 * @param {string} [bounds.category] - Optional category filter
 * @param {number|string} [bounds.minRating] - Optional minimum rating
 * @param {string} [bounds.maxPrice] - Optional max price tier
 * @param {number|string} [bounds.limit=50] - Result limit
 * @returns {Promise<{ places: Array, count: number, success: boolean, bounds: Object }>}
 */
export async function fetchPlacesInBounds(bounds = {}) {
  const { minLat, minLng, maxLat, maxLng, category, minRating, maxPrice, limit } = bounds;

  if (minLat === undefined || minLng === undefined || maxLat === undefined || maxLng === undefined) {
    throw new ApiError('minLat, minLng, maxLat, and maxLng are required for bounds search.', 400);
  }

  const query = new URLSearchParams();
  query.set('minLat', String(minLat));
  query.set('minLng', String(minLng));
  query.set('maxLat', String(maxLat));
  query.set('maxLng', String(maxLng));

  if (category && category !== 'all') {
    query.set('category', category);
  }
  if (minRating !== undefined && minRating !== null && String(minRating).trim() !== '') {
    query.set('minRating', String(minRating));
  }
  if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== '') {
    query.set('maxPrice', String(maxPrice));
  }
  if (limit !== undefined && limit !== null && String(limit).trim() !== '') {
    query.set('limit', String(limit));
  }

  const response = await fetchJson(`/places/bounds?${query.toString()}`);
  const rawPlaces = Array.isArray(response.data) ? response.data : [];

  const validatedPlaces = rawPlaces.map((place) => {
    const latNum = typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude);
    const lngNum = typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude);
    const hasValidCoordinates =
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180;

    return {
      ...place,
      latitude: latNum,
      longitude: lngNum,
      hasValidCoordinates,
    };
  });

  return {
    places: validatedPlaces,
    count: response.count ?? validatedPlaces.length,
    success: response.success ?? true,
    bounds: response.bounds,
  };
}

/**
 * Fetch a single place by UUID
 * @param {string} id - Place UUID
 * @returns {Promise<Object>}
 */
export async function fetchPlaceById(id) {
  if (!id) throw new ApiError('Place ID is required', 400);
  const response = await fetchJson(`/places/${encodeURIComponent(id)}`);
  return response.data || response;
}

/**
 * Check backend health status
 * @returns {Promise<Object>}
 */
export async function fetchHealth() {
  return await fetchJson('/health');
}

/**
 * Optimize a multi-stop route using Baseline, Nearest Neighbor, and 2-opt algorithms.
 * @param {Object} params
 * @param {string[]} params.placeIds - Array of 2–10 place UUIDs
 * @param {string} [params.startPlaceId] - Optional UUID of the starting place (must be in placeIds)
 * @returns {Promise<Object>} Full optimization comparison result
 */
export async function optimizeRoute({ placeIds, startPlaceId } = {}) {
  if (!Array.isArray(placeIds) || placeIds.length < 2) {
    throw new ApiError('At least 2 place IDs are required for route optimization.', 400);
  }
  if (placeIds.length > 10) {
    throw new ApiError('A maximum of 10 places can be optimized per itinerary.', 400);
  }

  const body = { placeIds };
  if (startPlaceId) body.startPlaceId = startPlaceId;

  const response = await fetchJson('/routes/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.data || response;
}

export { API_BASE_URL };

