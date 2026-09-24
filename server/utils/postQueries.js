import Post from '../models/Post.js';

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

// One place that lists posts for public pages (feed, tag pages, profiles).
// It always forces status "published", so callers cannot leak drafts by accident.
export async function listPublishedPosts(filter, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = { ...filter, status: 'published' };

  const [posts, total] = await Promise.all([
    Post.find(where)
      .sort({ publishedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content')
      .populate('author', AUTHOR_PUBLIC_FIELDS)
      .populate('tags', TAG_FIELDS),
    Post.countDocuments(where),
  ]);

  return { posts, page, totalPages: Math.ceil(total / limit), total };
}
