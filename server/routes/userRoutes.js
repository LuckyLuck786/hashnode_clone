import { Router } from 'express';
import { getUserProfile, updateMyProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.put('/me', protect, updateMyProfile);
router.get('/:id', getUserProfile);

export default router;
