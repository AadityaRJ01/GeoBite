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

export { API_BASE_URL };
