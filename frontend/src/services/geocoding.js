/**
 * GeoBite — Client Geocoding & Coordinate Resolution Adapter
 *
 * Uses the backend location search API (/api/locations/search) powered by
 * OpenStreetMap Nominatim. Does NOT rely on hardcoded city coordinates.
 */

import { searchLocation } from './placesApi';

/**
 * Tries to parse direct coordinate pair e.g. "12.9716, 77.5946" or "12.9716 77.5946"
 * @param {string} query
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseCoordinates(query) {
  if (!query || typeof query !== 'string') return null;
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  return null;
}

/**
 * Geocodes city query using the backend Nominatim geocoding service.
 * Returns authoritative coordinates, bounding box, and location metadata.
 *
 * @param {string} query
 * @returns {Promise<{
 *   name: string,
 *   lat: number,
 *   lng: number,
 *   cityName: string,
 *   country: string,
 *   boundingBox: Object|null
 * }>}
 */
export async function geocodeCity(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('City or location query cannot be empty.');
  }

  const trimmed = query.trim();

  // 1. Direct coordinate format (e.g. "35.6762, 139.6503")
  const coords = parseCoordinates(trimmed);
  if (coords) {
    return {
      name: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      cityName: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      country: '',
      lat: coords.lat,
      lng: coords.lng,
      boundingBox: null,
    };
  }

  // 2. Delegate to backend geocoding API (/api/locations/search?q=...)
  const result = await searchLocation(trimmed);

  return {
    name: result.cityName || result.displayName?.split(',')[0] || trimmed,
    cityName: result.cityName || trimmed,
    displayName: result.displayName || trimmed,
    country: result.country || '',
    lat: result.lat,
    lng: result.lng,
    boundingBox: result.boundingBox || null,
  };
}
