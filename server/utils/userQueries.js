import User from '../models/User.js';

// Fields safe to show on a public author card in a feed.
export const AUTHOR_CARD_FIELDS = 'name avatarUrl';

// Fields safe to show on a full public profile page.
export const PROFILE_FIELDS = 'name bio avatarUrl createdAt';

// The shape the client keeps as "the signed-in user". Written out field by field rather
// than sent straight from the document, so a new private field can never leak by accident.
export function toSessionUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    createdAt: user.createdAt,
    followingCount: user.following?.length ?? 0,
  };
}

// Counts how many users have each id in their `following` array, which is that user's
// follower count. One aggregation covers a whole page of authors instead of a count
// query per profile. Callers pass raw ids and get a Map keyed by the same ids; ids with
// no followers are simply absent, so look up with `?? 0`.
export async function getFollowerCounts(userIds) {
  const ids = userIds.filter(Boolean);
  if (!ids.length) return new Map();

  const rows = await User.aggregate([
    { $unwind: '$following' },
    { $group: { _id: '$following', followerCount: { $sum: 1 } } },
    { $match: { _id: { $in: ids } } },
  ]);

  return new Map(rows.map(({ _id, followerCount }) => [String(_id), followerCount]));
}