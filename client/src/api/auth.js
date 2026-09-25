import api from './axios.js';

export const register = (details) => api.post('/auth/register', details).then((res) => res.data);
export const login = (credentials) => api.post('/auth/login', credentials).then((res) => res.data);
export const fetchCurrentUser = () => api.get('/auth/me').then((res) => res.data.user);
