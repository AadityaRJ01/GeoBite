/**
 * GeoBite — Place Sharing & Google Maps Utilities
 *
 * Helpers to:
 * 1. Build standardized, safely encoded Google Maps navigation URLs.
 * 2. Share a place via the native Web Share API (mobile/modern browsers)
 *    with automatic fallback to copying the Google Maps link to clipboard.
 */

/**
 * Constructs an authoritative Google Maps search / navigation URL.
 * Format: https://www.google.com/maps/search/?api=1&query=Name+Address or query=lat,lng
 *
 * @param {Object} place
 * @param {string} place.name
 * @param {number} place.latitude
 * @param {number} place.longitude
 * @param {string} [place.address]
 * @returns {string} Fully encoded Google Maps URL
 */
export function getGoogleMapsUrl(place) {
  if (!place) return 'https://www.google.com/maps';

  const lat = typeof place.latitude === 'number' ? place.latitude : parseFloat(place.lat);
  const lng = typeof place.longitude === 'number' ? place.longitude : parseFloat(place.lng);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  if (hasCoords) {
    // If coordinates are present, include both name and coordinates for maximum precision & pin label
    if (place.name) {
      const query = encodeURIComponent(`${place.name}, ${lat},${lng}`);
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  // Fallback to name and address if coordinates are missing
  const textQuery = [place.name, place.address].filter(Boolean).join(', ');
  if (textQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery)}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Opens the place directly in Google Maps in a new tab.
 * @param {Object} place
 */
export function openInGoogleMaps(place) {
  const url = getGoogleMapsUrl(place);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Shares a place using navigator.share when available,
 * or copies the Google Maps URL to clipboard as a resilient fallback.
 *
 * @param {Object} place
 * @returns {Promise<{ shared: boolean, copied: boolean, url: string }>}
 */
export async function sharePlace(place) {
  if (!place) {
    throw new Error('No place details provided to share.');
  }

  const url = getGoogleMapsUrl(place);
  const locationText = place.address ? ` (${place.address})` : '';
  const title = place.name || 'Discover on GeoBite';
  const text = `Check out ${place.name || 'this spot'}${locationText} on Google Maps via GeoBite:`;

  // 1. Try Web Share API if supported
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { shared: true, copied: false, url };
    } catch (err) {
      // User cancelled share dialog -> return without error
      if (err.name === 'AbortError') {
        return { shared: false, copied: false, url };
      }
      // If Web Share failed for other reasons, fall through to clipboard copy
      console.warn('Web Share failed, falling back to clipboard copy:', err);
    }
  }

  // 2. Clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return { shared: false, copied: true, url };
    } catch (clipErr) {
      console.warn('Clipboard writeText failed, trying execCommand fallback:', clipErr);
    }
  }

  // 3. Fallback textarea copy for older environments or restricted permissions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return { shared: false, copied: true, url };
    }
  } catch (e) {
    console.warn('execCommand copy failed:', e);
  }

  // If all copying methods failed, prompt the user
  window.prompt('Copy link to share:', url);
  return { shared: false, copied: true, url };
}
