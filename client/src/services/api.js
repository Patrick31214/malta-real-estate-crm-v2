import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gkr-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gkr-token');
      window.dispatchEvent(new Event('auth-logout'));
    }
    if (error.response?.status === 403) {
      const msg = error.response?.data?.error || '';
      if (msg.toLowerCase().includes('blocked')) {
        localStorage.removeItem('gkr-token');
        window.dispatchEvent(new CustomEvent('auth-blocked', { detail: { message: msg } }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
