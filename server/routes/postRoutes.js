import { Router } from 'express';
import {
  getPosts,
  getFollowingFeed,
  getBookmarkedPosts,
  getMyPosts,
  getPostBySlug,
  getPostForEdit,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
} from '../controllers/postController.js';
import { getComments, addComment } from '../controllers/commentController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All the literal sub-paths are registered before "/:slug" so that a slug can never
// shadow "mine", "bookmarks" or "following".
router.get('/following', protect, getFollowingFeed);
router.get('/bookmarks', protect, getBookmarkedPosts);
router.get('/mine', protect, getMyPosts);
router.get('/:id/edit', protect, getPostForEdit);

router
  .route('/:id/comments')
  .get(getComments)
  .post(protect, addComment);

router.post('/:id/like', protect, toggleLike);
router.post('/:id/bookmark', protect, toggleBookmark);

router.route('/').get(getPosts).post(protect, createPost);
router.route('/:id').put(protect, updatePost).delete(protect, deletePost);
router.get('/:slug', optionalAuth, getPostBySlug);

export default router;