import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { trackMetric, initSession, endSession } from '../services/trackMetric';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gkr-token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    // Track logout before clearing the token so the API call still has auth
    trackMetric('logout');
    // Signal the backend with the token still present in the header
    api.post('/auth/logout').catch(() => {});
    endSession();
    localStorage.removeItem('gkr-token');
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const saved = localStorage.getItem('gkr-token');
      if (!saved) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setToken(saved);
        // Re-attach session header for the restored session
        initSession();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [logout]);

  // Listen for 401 auto-logout events dispatched by the API service
  useEffect(() => {
    const handler = () => {
      endSession();
      logout();
    };
    window.addEventListener('auth-logout', handler);
    return () => window.removeEventListener('auth-logout', handler);
  }, [logout]);

  // Listen for 403 account-blocked events dispatched by the API service
  useEffect(() => {
    const handler = () => {
      endSession();
      logout();
    };
    window.addEventListener('auth-blocked', handler);
    return () => window.removeEventListener('auth-blocked', handler);
  }, [logout]);

  const login = async (email, password) => {
    // Generate session before the request so the X-Session-ID header is sent
    // along with the login request — auth.js will store it in the login metric.
    initSession();
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gkr-token', data.token);
    setToken(data.token);
    setUser(data.user);
    // The backend auth.js already records the login metric server-side.
    // No client-side duplicate tracking needed here.
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('gkr-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
