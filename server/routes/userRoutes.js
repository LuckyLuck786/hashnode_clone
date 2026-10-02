import { Router } from 'express';
import {
  getUserProfile,
  updateMyProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.put('/me', protect, updateMyProfile);
router.post('/:id/follow', protect, toggleFollow);
// Registered before "/:id" so these literal sub-paths are not read as an id.
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id', optionalAuth, getUserProfile);

export default router;