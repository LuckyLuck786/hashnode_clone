import api from './axios.js';
import { POSTS_PER_PAGE } from '../config.js';

export const fetchUserProfile = (id, params) =>
  api.get(`/users/${id}`, { params: { limit: POSTS_PER_PAGE, ...params } }).then((res) => res.data);

export const updateMyProfile = (profile) =>
  api.put('/users/me', profile).then((res) => res.data.user);
