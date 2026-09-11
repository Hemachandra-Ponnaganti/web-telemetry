// Centralized API and Socket configuration for both local dev and production on Render/Vercel

const getBackendHost = () => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (envUrl && envUrl.trim()) {
    // Strip trailing /api and trailing slashes if present
    return envUrl.trim().replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''; // Vite proxy forwards /api and /socket.io to localhost:5000
    }
  }

  // Fallback to production backend on Render
  return 'https://web-telemetry-backend.onrender.com';
};

export const BACKEND_URL = getBackendHost();
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
export const SOCKET_URL = BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
