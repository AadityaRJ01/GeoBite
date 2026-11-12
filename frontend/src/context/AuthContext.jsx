/**
 * GeoBite — Authentication Context & State Management
 *
 * Provides application-wide authentication state, session persistence,
 * and user operations (login, register, updateProfile, logout).
 *
 * SECURITY ARCHITECTURE & TRADE-OFFS:
 * -----------------------------------
 * This client persists the JSON Web Token in browser `sessionStorage`.
 * Trade-offs:
 * 1. Scope: `sessionStorage` isolates the session to the current browser tab and
 *    clears automatically when the tab is closed, mitigating persistent credential lingering.
 * 2. XSS Vulnerability: Any browser-accessible storage (`sessionStorage` or `localStorage`)
 *    can be read by JavaScript in the event of an arbitrary script execution (XSS).
 * 3. Mitigation: All sensitive geospatial and profile mutation APIs are enforced strictly on the
 *    backend via cryptographic signature and expiry checks on every request.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  registerApi,
  loginApi,
  getMeApi,
  updateProfileApi,
  logoutApi,
} from '../services/authApi';

const TOKEN_STORAGE_KEY = 'geobite_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Helper to persist or clear token from storage
   */
  const persistToken = (newToken) => {
    try {
      if (newToken) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Unable to access sessionStorage:', e);
    }
    setToken(newToken);
  };

  /**
   * Initialize session on mount: if token exists, fetch current user profile
   */
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getMeApi(storedToken);
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
          setAuthError(null);
        }
      } catch (err) {
        console.warn('Session restoration failed (token expired or invalid):', err.message);
        if (isMounted) {
          persistToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Register a new account
   */
  const register = useCallback(async ({ name, email, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await registerApi({ name, email, password });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Log in with email and password
   */
  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await loginApi({ email, password });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update authenticated profile (e.g. name)
   */
  const updateProfile = useCallback(
    async (updates) => {
      if (!token) throw new Error('Not authenticated');
      setIsLoading(true);
      setAuthError(null);
      try {
        const updatedUser = await updateProfileApi(updates, token);
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  /**
   * Log out of current session
   */
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      persistToken(null);
      setUser(null);
      setAuthError(null);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    setAuthError,
    register,
    login,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
