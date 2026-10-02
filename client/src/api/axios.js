import axios from 'axios';

export const TOKEN_KEY = 'monospace.token';

// In development VITE_API_URL is empty and Vite proxies /api to the Express server.
// In production it points at the deployed API origin, or stays empty when both are
// served from the same domain.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
});

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns any failure into one predictable shape so pages can render error.message directly.
export function readErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    if (error.response) return error.response.data?.message || fallback;
    if (error.code === 'ERR_CANCELED') return null;
    return 'Cannot reach the server. Check your connection and try again.';
  }
  return error?.message || fallback;
}

export default api;
