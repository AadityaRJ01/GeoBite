/**
 * GeoBite — OSRM Road Routing Service
 *
 * Integrates the Open Source Routing Machine (OSRM) Route service to fetch
 * actual road-network geometry, driving distance (km), and estimated duration (minutes).
 *
 * Coordinate Ordering:
 * - Input: Array of stop objects with { latitude, longitude }
 * - OSRM Request Format: "longitude,latitude;longitude,latitude;..."
 * - GeoJSON Geometry Output: coordinates array of [longitude, latitude] pairs
 * - Leaflet expects [latitude, longitude] pairs (handled explicitly in frontend)
 */

export class RoadRoutingError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'RoadRoutingError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Lightweight, in-memory LRU cache to prevent repeated requests for identical stop sequences.
 */
class BoundedRouteCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export const routeCache = new BoundedRouteCache(100);

/**
 * Validate coordinates for an array of stops.
 * @param {Array<Object>} stops
 */
export function validateStopsCoordinates(stops) {
  if (!Array.isArray(stops)) {
    throw new RoadRoutingError("Field 'stops' must be an array.", 400);
  }

  if (stops.length > 25) {
    throw new RoadRoutingError(
      `A maximum of 25 stops can be routed per request (received ${stops.length}).`,
      400
    );
  }

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (!stop || typeof stop !== 'object') {
      throw new RoadRoutingError(`Stop at index ${i} must be a valid object.`, 400);
    }

    const lat = typeof stop.latitude === 'number' ? stop.latitude : parseFloat(stop.latitude);
    const lng = typeof stop.longitude === 'number' ? stop.longitude : parseFloat(stop.longitude);

    if (isNaN(lat) || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new RoadRoutingError(
        `Stop at index ${i} has invalid latitude (must be a number between -90 and 90).`,
        400
      );
    }

    if (isNaN(lng) || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new RoadRoutingError(
        `Stop at index ${i} has invalid longitude (must be a number between -180 and 180).`,
        400
      );
    }
  }
}

/**
 * Format stop coordinates into OSRM coordinate string: "lng1,lat1;lng2,lat2;..."
 * Note: OSRM strictly requires longitude first, then latitude.
 *
 * @param {Array<Object>} stops
 * @returns {string}
 */
export function formatOSRMCoordinateString(stops) {
  return stops
    .map((s) => {
      const lng = Number(s.longitude).toFixed(6);
      const lat = Number(s.latitude).toFixed(6);
      return `${lng},${lat}`;
    })
    .join(';');
}

/**
 * Fetch real road routing from OSRM Route API.
 *
 * @param {Array<Object>} stops - Ordered stops to route through
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=6000] - Request timeout in milliseconds
 * @param {string} [options.baseUrl] - Optional custom OSRM base URL
 * @returns {Promise<{ distanceKm: number, durationMinutes: number, geometry: Object, provider: string, profile: string }>}
 */
export async function getRoadRoute(stops, options = {}) {
  validateStopsCoordinates(stops);

  // 1. Edge Case: Fewer than 2 stops
  if (stops.length < 2) {
    const coords = stops.length === 1 ? [[Number(stops[0].longitude), Number(stops[0].latitude)]] : [];
    return {
      distanceKm: 0.0,
      durationMinutes: 0.0,
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      provider: 'OSRM',
      profile: 'driving',
      waypointCount: stops.length,
    };
  }

  // 2. Edge Case: All coordinates are identical
  const firstLat = Number(stops[0].latitude);
  const firstLng = Number(stops[0].longitude);
  const allIdentical = stops.every(
    (s) => Math.abs(Number(s.latitude) - firstLat) < 1e-7 && Math.abs(Number(s.longitude) - firstLng) < 1e-7
  );

  if (allIdentical) {
    return {
      distanceKm: 0.0,
      durationMinutes: 0.0,
      geometry: {
        type: 'LineString',
        coordinates: [[firstLng, firstLat], [firstLng, firstLat]],
      },
      provider: 'OSRM',
      profile: 'driving',
      waypointCount: stops.length,
    };
  }

  // 3. Coordinate serialization & Cache Lookup
  const coordString = formatOSRMCoordinateString(stops);
  const cacheKey = `driving:${coordString}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return JSON.parse(JSON.stringify(cached));
  }

  // 4. Build OSRM request URL
  const baseUrl = (options.baseUrl || process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/+$/, '');
  const url = `${baseUrl}/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;

  const timeoutMs = options.timeoutMs || 6000;

  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new RoadRoutingError('OSRM road routing request timed out. Please try again.', 504, err);
    }
    throw new RoadRoutingError(
      'Unable to reach OSRM road routing service. Road network routing is temporarily unavailable.',
      503,
      err
    );
  }

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse error on non-OK response
    }
    throw new RoadRoutingError(
      errorBody?.message || `OSRM service returned HTTP status ${response.status}`,
      response.status === 404 ? 404 : 502,
      errorBody
    );
  }

  let body;
  try {
    body = await response.json();
  } catch (parseErr) {
    throw new RoadRoutingError('Malformed JSON received from OSRM service.', 502, parseErr);
  }

  if (body.code === 'NoRoute') {
    throw new RoadRoutingError('No drivable road route found between the specified stops.', 422, body);
  }

  if (body.code !== 'Ok' || !Array.isArray(body.routes) || body.routes.length === 0) {
    throw new RoadRoutingError(
      body.message || `OSRM routing failed with status: ${body.code}`,
      422,
      body
    );
  }

  const primaryRoute = body.routes[0];

  // Validate geometry
  if (
    !primaryRoute.geometry ||
    primaryRoute.geometry.type !== 'LineString' ||
    !Array.isArray(primaryRoute.geometry.coordinates) ||
    primaryRoute.geometry.coordinates.length === 0
  ) {
    throw new RoadRoutingError('OSRM returned invalid route geometry.', 502, primaryRoute);
  }

  // Convert distance from meters to km and duration from seconds to minutes
  const distanceKm = Number((primaryRoute.distance / 1000.0).toFixed(2));
  const durationMinutes = Number((primaryRoute.duration / 60.0).toFixed(1));

  const result = {
    distanceKm,
    durationMinutes,
    geometry: {
      type: 'LineString',
      coordinates: primaryRoute.geometry.coordinates, // [ [lng, lat], ... ]
    },
    provider: 'OSRM',
    profile: 'driving',
    waypointCount: Array.isArray(body.waypoints) ? body.waypoints.length : stops.length,
  };

  // Cache normalized result
  routeCache.set(cacheKey, result);

  return result;
}

