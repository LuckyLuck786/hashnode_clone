import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the saved token to every request so components never have to.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns an Axios error into a sentence that can be shown to the user.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error.response) return 'Could not reach the server. Check your connection.';
  return fallback;
}

export default api;
