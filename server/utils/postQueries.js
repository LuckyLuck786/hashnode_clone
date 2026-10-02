import Post from '../models/Post.js';
import { getFollowerCounts } from './userQueries.js';

export const AUTHOR_PUBLIC_FIELDS = 'name avatarUrl';
export const TAG_FIELDS = 'name slug';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function emptyPage() {
  return { posts: [], page: 1, totalPages: 0, total: 0 };
}

// Case-insensitive, literal match against post titles. The user's input is escaped
// before it reaches $regex, so punctuation in a search never becomes a pattern.
export function buildSearchFilter(search) {
  const term = typeof search === 'string' ? search.trim() : '';
  if (!term) return {};
  return { title: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } };
}

// One place that lists posts for public pages (feed, tag pages, profiles).
// It always forces status "published", so callers cannot leak drafts by accident.
// `likes`/`bookmarks` are excluded: list cards show the denormalised counters, and
// loading two id arrays per card would dominate the payload.
export async function listPublishedPosts(filter, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = { ...filter, status: 'published' };

  const [posts, total] = await Promise.all([
    Post.find(where)
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content -likes -bookmarks')
      .populate('author', AUTHOR_PUBLIC_FIELDS)
      .populate('tags', TAG_FIELDS),
    Post.countDocuments(where),
  ]);

  const followerCounts = await getFollowerCounts(posts.map((post) => post.author?._id));
  // toJSON first turns each populated author into a plain object; assigning onto the
  // mongoose document itself would be ignored when the response is serialised.
  const plainPosts = posts.map((post) => {
    const plain = post.toJSON();
    if (plain.author) {
      plain.author.followerCount = followerCounts.get(String(plain.author._id)) ?? 0;
    }
    return plain;
  });

  return { posts: plainPosts, page, totalPages: Math.ceil(total / limit), total };
}
