/**
 * GeoBite — Auth Context & Hook
 *
 * Provides reactive authentication state across the application:
 * - user: object { id, name, email, createdAt } or null
 * - token: current JWT or null
 * - isAuthenticated: boolean
 * - loading: boolean while verifying existing token
 * - login, register, logout, updateProfile actions
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  loginUser as apiLogin,
  registerUser as apiRegister,
  fetchCurrentUser,
  updateUserProfile as apiUpdateProfile,
  logoutUser as apiLogout
} from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  // Re-verify token on mount / reload
  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      const stored = getStoredToken();
      if (!stored) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await fetchCurrentUser();
        if (mounted) {
          setUser(userData);
          setToken(stored);
        }
      } catch (err) {
        // Token invalid or expired
        removeStoredToken();
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const data = await apiLogin(email, password);
    setStoredToken(data.token, remember);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiRegister(name, email, password);
    setStoredToken(data.token, true);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      removeStoredToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const updated = await apiUpdateProfile(fields);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    isLoading: loading,
    login,
    register,
    logout,
    updateProfile
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
