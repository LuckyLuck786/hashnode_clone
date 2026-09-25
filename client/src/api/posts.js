import api from './axios.js';
import { POSTS_PER_PAGE } from '../config.js';

// params: { page, search, tag }
export const fetchPosts = (params) =>
  api.get('/posts', { params: { limit: POSTS_PER_PAGE, ...params } }).then((res) => res.data);

export const fetchPost = (slug) => api.get(`/posts/${slug}`).then((res) => res.data.post);
export const fetchPostForEdit = (id) => api.get(`/posts/${id}/edit`).then((res) => res.data.post);
export const fetchMyPosts = () => api.get('/posts/mine').then((res) => res.data.posts);

export const createPost = (post) => api.post('/posts', post).then((res) => res.data.post);
export const updatePost = (id, post) => api.put(`/posts/${id}`, post).then((res) => res.data.post);
export const deletePost = (id) => api.delete(`/posts/${id}`).then((res) => res.data);
