import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { listPublishedPosts } from '../utils/postQueries.js';

const EDITABLE_PROFILE_FIELDS = ['name', 'bio', 'avatarUrl'];

// GET /api/users/:id
export async function getUserProfile(req, res) {
  const user = await User.findById(req.params.id).select('name bio avatarUrl createdAt');
  if (!user) throw httpError(404, 'User not found');

  res.json({ user, ...(await listPublishedPosts({ author: user._id }, req.query)) });
}

// PUT /api/users/me
export async function updateMyProfile(req, res) {
  const body = req.body ?? {};

  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string') throw httpError(400, `${field} must be text`);
    req.user[field] = body[field];
  }

  await req.user.save();
  res.json({ user: req.user });
}
