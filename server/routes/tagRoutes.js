import { Router } from 'express';
import { getTags, getTagPosts } from '../controllers/tagController.js';

const router = Router();

router.get('/', getTags);
router.get('/:slug/posts', getTagPosts);

export default router;
