/**
 * GeoBite — Auth & Saved Routes API Service
 *
 * Provides typed methods for user authentication and managing personal saved trips.
 * Automatically injects the stored JWT token into requests.
 */

import { API_BASE_URL, ApiError } from './placesApi.js';

const TOKEN_KEY = 'geobite_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token, remember = true) {
  try {
    if (token) {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // ignore local storage restrictions
  }
}

export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err) {
    throw new ApiError(
      `Unable to reach GeoBite API at ${url}. Please verify your connection.`,
      0,
      err
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    // response not JSON
  }

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}: Request failed`;
    throw new ApiError(message, response.status, payload?.error?.details || payload);
  }

  return payload;
}

// ----------------- Auth API -----------------

export async function loginUser(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  return res.data;
}

export async function registerUser(name, email, password) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await request('/auth/me', {
    method: 'GET'
  });
  return res.data;
}

export async function updateUserProfile(data) {
  const res = await request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function logoutUser() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Silent fail if network fails during logout
  } finally {
    removeStoredToken();
  }
}

// ----------------- Saved Routes API -----------------

export async function saveRoute(routeData) {
  const res = await request('/saved-routes', {
    method: 'POST',
    body: JSON.stringify(routeData)
  });
  return res.data;
}

export async function fetchSavedRoutes(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.city) searchParams.set('city', params.city);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);

  const query = searchParams.toString();
  const endpoint = `/saved-routes${query ? `?${query}` : ''}`;
  const res = await request(endpoint, { method: 'GET' });
  return res.data;
}

export async function fetchSavedRouteById(id) {
  const res = await request(`/saved-routes/${id}`, {
    method: 'GET'
  });
  return res.data;
}

export async function updateSavedRoute(id, data) {
  const res = await request(`/saved-routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function deleteSavedRoute(id) {
  const res = await request(`/saved-routes/${id}`, {
    method: 'DELETE'
  });
  return res;
}
