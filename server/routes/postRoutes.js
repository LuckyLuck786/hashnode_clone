import { Router } from 'express';
import {
  getPosts,
  getMyPosts,
  getPostBySlug,
  getPostForEdit,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/').get(getPosts).post(protect, createPost);
// Registered before "/:slug" so "mine" is not treated as a slug.
router.get('/mine', protect, getMyPosts);
router.get('/:id/edit', protect, getPostForEdit);
router.route('/:id').put(protect, updatePost).delete(protect, deletePost);
router.get('/:slug', optionalAuth, getPostBySlug);

export default router;
