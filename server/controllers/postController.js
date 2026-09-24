import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import httpError from '../utils/httpError.js';
import slugify from '../utils/slugify.js';
import { isHttpUrl } from '../utils/validators.js';
import {
  AUTHOR_PUBLIC_FIELDS,
  TAG_FIELDS,
  emptyPage,
  listPublishedPosts,
} from '../utils/postQueries.js';

const MAX_TAGS_PER_POST = 5;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createUniqueSlug(title, excludePostId) {
  const base = slugify(title) || 'post';
  let slug = base;
  let suffix = 2;

  for (;;) {
    const filter = excludePostId ? { slug, _id: { $ne: excludePostId } } : { slug };
    if (!(await Post.exists(filter))) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

// Validates the editable fields from the request body. On create every required field must be
// present; on update only the fields that were sent are checked and returned.
async function readPostInput(body = {}, { isNew }) {
  const input = {};

  for (const field of ['title', 'content']) {
    const value = body[field];
    if (value === undefined && !isNew) continue;
    if (typeof value !== 'string' || !value.trim()) {
      throw httpError(400, `${field[0].toUpperCase()}${field.slice(1)} is required`);
    }
    input[field] = value;
  }

  if (body.coverImage !== undefined) {
    const coverImage = typeof body.coverImage === 'string' ? body.coverImage.trim() : null;
    if (coverImage === null || (coverImage && !isHttpUrl(coverImage))) {
      throw httpError(400, 'Cover image must be a valid http(s) URL');
    }
    input.coverImage = coverImage;
  }

  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) {
      throw httpError(400, 'Status must be draft or published');
    }
    input.status = body.status;
  }

  if (body.tags !== undefined) {
    const { tags } = body;
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
      throw httpError(400, 'Tags must be a list of tag names');
    }
    if (tags.length > MAX_TAGS_PER_POST) {
      throw httpError(400, `A post can have at most ${MAX_TAGS_PER_POST} tags`);
    }
    // Tags are created last so a request that fails validation above never leaves new tags behind.
    input.tags = await Tag.findOrCreateByNames(tags);
  }

  return input;
}

async function findOwnedPost(postId, user) {
  const post = await Post.findById(postId);
  if (!post) throw httpError(404, 'Post not found');
  if (!post.isAuthoredBy(user)) throw httpError(403, 'You can only change posts you wrote');
  return post;
}

function withRelations(query) {
  return query.populate('author', AUTHOR_PUBLIC_FIELDS).populate('tags', TAG_FIELDS);
}

// GET /api/posts?search=&tag=&page=&limit=
export async function getPosts(req, res) {
  const filter = {};

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  if (typeof req.query.tag === 'string' && req.query.tag) {
    const tag = await Tag.findOne({ slug: req.query.tag });
    if (!tag) return res.json(emptyPage());
    filter.tags = tag._id;
  }

  res.json(await listPublishedPosts(filter, req.query));
}

// GET /api/posts/mine
export async function getMyPosts(req, res) {
  const posts = await Post.find({ author: req.user._id })
    .sort({ updatedAt: -1 })
    .select('-content')
    .populate('tags', TAG_FIELDS);
  res.json({ posts });
}

// GET /api/posts/:slug (drafts are visible to their author only)
export async function getPostBySlug(req, res) {
  const post = await Post.findOne({ slug: req.params.slug })
    .populate('author', `${AUTHOR_PUBLIC_FIELDS} bio`)
    .populate('tags', TAG_FIELDS);

  if (!post || (post.status !== 'published' && !post.isAuthoredBy(req.user))) {
    throw httpError(404, 'Post not found');
  }
  res.json({ post });
}

// GET /api/posts/:id/edit
export async function getPostForEdit(req, res) {
  const post = await findOwnedPost(req.params.id, req.user);
  await post.populate('tags', TAG_FIELDS);
  res.json({ post });
}

// POST /api/posts
export async function createPost(req, res) {
  const input = await readPostInput(req.body, { isNew: true });
  const slug = await createUniqueSlug(input.title);

  const post = await Post.create({ ...input, slug, author: req.user._id });
  res.status(201).json({ post: await withRelations(Post.findById(post._id)) });
}

// PUT /api/posts/:id
export async function updatePost(req, res) {
  const post = await findOwnedPost(req.params.id, req.user);
  const input = await readPostInput(req.body, { isNew: false });

  Object.assign(post, input);
  // Keep the URL stable once a post has been published; drafts follow their title.
  if (input.title && !post.publishedAt) {
    post.slug = await createUniqueSlug(input.title, post._id);
  }
  await post.save();

  res.json({ post: await withRelations(Post.findById(post._id)) });
}

// DELETE /api/posts/:id
export async function deletePost(req, res) {
  const post = await findOwnedPost(req.params.id, req.user);
  await post.deleteOne();
  res.json({ message: 'Post deleted', id: post._id });
}
