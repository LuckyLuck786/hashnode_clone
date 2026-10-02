import User, { THEMES } from '../models/User.js';
import httpError from '../utils/httpError.js';
import { listPublishedPosts } from '../utils/postQueries.js';
import {
  AUTHOR_CARD_FIELDS,
  PROFILE_FIELDS,
  getFollowerCounts,
  toSessionUser,
} from '../utils/userQueries.js';

const EDITABLE_PROFILE_FIELDS = ['name', 'bio', 'avatarUrl'];

// GET /api/users/:id
export async function getUserProfile(req, res) {
  const user = await User.findById(req.params.id).select(`${PROFILE_FIELDS} following`);
  if (!user) throw httpError(404, 'User not found');

  const followerCounts = await getFollowerCounts([user._id]);

  res.json({
    user: {
      ...user.toJSON(),
      followerCount: followerCounts.get(String(user._id)) ?? 0,
      followingCount: user.following.length,
    },
    // Lets the profile page show the right Follow button without a second request.
    isFollowing: Boolean(req.user?.following?.some((id) => id.equals(user._id))),
    ...(await listPublishedPosts({ author: user._id }, req.query)),
  });
}

// PUT /api/users/me
export async function updateMyProfile(req, res) {
  const body = req.body ?? {};

  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string') throw httpError(400, `${field} must be text`);
    req.user[field] = body[field];
  }

  if (body.theme !== undefined) {
    if (!THEMES.includes(body.theme)) throw httpError(400, 'Theme must be light or dark');
    req.user.theme = body.theme;
  }

  await req.user.save();
  res.json({ user: toSessionUser(req.user) });
}

// POST /api/users/:id/follow — toggles the relationship and returns the resulting state.
export async function toggleFollow(req, res) {
  if (req.params.id === req.user._id.toString()) {
    throw httpError(400, 'You cannot follow yourself');
  }

  const target = await User.findById(req.params.id).select('_id');
  if (!target) throw httpError(404, 'User not found');

  const following = !req.user.following.some((id) => id.equals(target._id));
  if (following) req.user.following.addToSet(target._id);
  else req.user.following.pull(target._id);
  await req.user.save();

  // Recount from the target's side so the profile header shows the number the other
  // user would see, not the follower-following pair's size.
  const followerCounts = await getFollowerCounts([target._id]);

  res.json({
    following,
    followerCount: followerCounts.get(String(target._id)) ?? 0,
  });
}

// GET /api/users/:id/followers — the people who follow this user.
export async function getFollowers(req, res) {
  const user = await User.findById(req.params.id).select('_id');
  if (!user) throw httpError(404, 'User not found');

  const users = await User.find({ following: user._id }).select(AUTHOR_CARD_FIELDS).lean();

  res.json({ users, total: users.length, relation: 'followers' });
}

// GET /api/users/:id/following — the people this user follows.
export async function getFollowing(req, res) {
  const user = await User.findById(req.params.id).select('_id following');
  if (!user) throw httpError(404, 'User not found');

  const users = await User.find({ _id: { $in: user.following } })
    .select(AUTHOR_CARD_FIELDS)
    .lean();

  res.json({ users, total: users.length, relation: 'following' });
}