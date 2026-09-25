import api from './axios.js';
import { POSTS_PER_PAGE } from '../config.js';

export const fetchTags = () => api.get('/tags').then((res) => res.data.tags);

export const fetchTagPosts = (slug, params) =>
  api
    .get(`/tags/${slug}/posts`, { params: { limit: POSTS_PER_PAGE, ...params } })
    .then((res) => res.data);
