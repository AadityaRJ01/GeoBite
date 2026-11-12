/**
 * GeoBite — Authentication API Service
 *
 * Client-side HTTP client for communicating with GeoBite authentication endpoints.
 * Handles register, login, session validation (me), profile updates, and logout.
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const CLEAN_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
const API_BASE_URL = CLEAN_BASE_URL.endsWith('/api')
  ? CLEAN_BASE_URL
  : `${CLEAN_BASE_URL}/api`;

export class AuthApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AuthApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Executes JSON HTTP request against auth API
 * @param {string} endpoint
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
async function authRequest(endpoint, options = {}) {
  const { method = 'GET', body, token, signal } = options;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (netErr) {
    throw new AuthApiError(
      'Unable to connect to the GeoBite authentication server. Please check your network connection.',
      0,
      netErr.message
    );
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // If response was not valid JSON
  }

  if (!response.ok) {
    const errorMsg =
      json?.error?.message ||
      json?.message ||
      `Authentication request failed with HTTP ${response.status}`;
    throw new AuthApiError(errorMsg, response.status, json?.error);
  }

  return json;
}

/**
 * Register a new user account
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function registerApi({ name, email, password }) {
  const res = await authRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return res.data;
}

/**
 * Log in with existing credentials
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function loginApi({ email, password }) {
  const res = await authRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return res.data;
}

/**
 * Fetch current authenticated user profile
 * @param {string} token
 * @returns {Promise<Object>} user object
 */
export async function getMeApi(token) {
  const res = await authRequest('/auth/me', {
    method: 'GET',
    token,
  });
  return res.data.user;
}

/**
 * Update current authenticated user profile
 * @param {Object} updates
 * @param {string} updates.name
 * @param {string} token
 * @returns {Promise<Object>} updated user object
 */
export async function updateProfileApi(updates, token) {
  const res = await authRequest('/auth/profile', {
    method: 'PUT',
    body: updates,
    token,
  });
  return res.data.user;
}

/**
 * Acknowledge stateless logout
 * @returns {Promise<Object>}
 */
export async function logoutApi() {
  try {
    return await authRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Client-side logout proceeds even if network request fails
    return { success: true };
  }
}

