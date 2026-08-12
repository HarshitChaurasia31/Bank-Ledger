import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, accountsApi, ApiError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  /**
   * Bootstrap authentication session on application load.
   * Calls protected GET /api/accounts using HTTP-only cookie.
   */
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await accountsApi.getAccounts();
      if (res && Array.isArray(res.accounts)) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /**
   * Authenticate user via email and password
   */
  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
      }
      return { success: true, user: res.user };
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRateLimitCooldown(60); // 60s cooldown indicator
      }
      throw err;
    }
  };

  /**
   * Register a new user account
   */
  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
      }
      return { success: true, user: res.user };
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRateLimitCooldown(60);
      }
      throw err;
    }
  };

  /**
   * Terminate active session and clear in-memory state
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Continue client-side teardown even if network fails
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    rateLimitCooldown,
    login,
    register,
    logout,
    checkSession,
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
