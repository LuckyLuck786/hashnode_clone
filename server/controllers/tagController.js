import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import httpError from '../utils/httpError.js';
import { listPublishedPosts } from '../utils/postQueries.js';

// GET /api/tags (post counts include published posts only)
export async function getTags(req, res) {
  const [tags, counts] = await Promise.all([
    Tag.find().select('name slug').lean(),
    Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', postCount: { $sum: 1 } } },
    ]),
  ]);

  const countByTagId = new Map(counts.map(({ _id, postCount }) => [String(_id), postCount]));
  const tagsWithCounts = tags
    .map((tag) => ({ ...tag, postCount: countByTagId.get(String(tag._id)) ?? 0 }))
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));

  res.json({ tags: tagsWithCounts });
}

// GET /api/tags/:slug/posts
export async function getTagPosts(req, res) {
  const tag = await Tag.findOne({ slug: req.params.slug }).select('name slug');
  if (!tag) throw httpError(404, 'Tag not found');

  res.json({ tag, ...(await listPublishedPosts({ tags: tag._id }, req.query)) });
}
