import Comment, { MAX_THREAD_DEPTH } from '../models/Comment.js';
import Post from '../models/Post.js';
import httpError from '../utils/httpError.js';
import { AUTHOR_CARD_FIELDS } from '../utils/userQueries.js';

// A draft's discussion is private, so comments can only be read on a published post.
// The author still sees their own draft in the editor, which never loads this endpoint.
async function findPublishedPost(postId) {
  const post = await Post.findOne({ _id: postId, status: 'published' }).select('_id author');
  if (!post) throw httpError(404, 'Post not found');
  return post;
}

function toPublicComment(comment) {
  return {
    _id: comment._id,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    depth: comment.depth,
    author: comment.author,
    replyCount: comment.replyCount ?? comment.replies?.length ?? 0,
    replies: comment.replies ?? [],
  };
}

// Flattens the thread into { topLevel: [...], replyCount: n }.
// Replies are attached to their parent rather than returned as a flat list, so the client
// renders nesting without rebuilding the tree itself.
function buildThread(comments) {
  const byParent = new Map();
  const roots = [];

  for (const comment of comments) {
    const key = comment.parent ? String(comment.parent) : null;
    if (!key) {
      roots.push({ ...comment, replies: [], replyCount: 0 });
      continue;
    }
    const siblings = byParent.get(key);
    if (siblings) siblings.push({ ...comment, replies: [], replyCount: 0 });
    else byParent.set(key, [{ ...comment, replies: [], replyCount: 0 }]);
  }

  for (const [parentId, replies] of byParent) {
    const parent = roots.find((root) => String(root._id) === parentId);
    if (!parent) continue; // Orphaned reply whose parent was deleted; dropped.
    parent.replies = replies;
    parent.replyCount = replies.length;
  }

  return { topLevel: roots, replyCount: comments.length };
}

// GET /api/posts/:id/comments
export async function getComments(req, res) {
  await findPublishedPost(req.params.id);

  const comments = await Comment.find({ post: req.params.id })
    .sort({ createdAt: 1, _id: 1 })
    .populate('author', AUTHOR_CARD_FIELDS)
    .lean();

  res.json(buildThread(comments));
}

// POST /api/posts/:id/comments
export async function addComment(req, res) {
  const post = await findPublishedPost(req.params.id);
  const body = req.body?.body;

  if (typeof body !== 'string' || !body.trim()) {
    throw httpError(400, 'Comment cannot be empty');
  }

  let parent = null;
  if (req.body.parent) {
    parent = await Comment.findOne({ _id: req.body.parent, post: post._id });
    if (!parent) throw httpError(404, 'The comment you are replying to no longer exists');
    if (parent.depth >= MAX_THREAD_DEPTH) {
      throw httpError(400, 'Replies stop at one level — reply to the top-level comment instead');
    }
  }

  const comment = await Comment.create({
    body,
    post: post._id,
    author: req.user._id,
    parent: parent?._id ?? null,
    depth: parent ? parent.depth + 1 : 0,
  });

  await comment.populate('author', AUTHOR_CARD_FIELDS);
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

  res.status(201).json({ comment: toPublicComment(comment) });
}

// DELETE /api/comments/:id — the comment author or the post author may remove a comment.
export async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw httpError(404, 'Comment not found');

  const post = await Post.findById(comment.post).select('_id author');
  const canDelete =
    comment.author.equals(req.user._id) || (post && post.author.equals(req.user._id));
  if (!canDelete) throw httpError(403, 'You can only delete your own comments');

  // Removing a top-level comment removes its replies too, so no thread is left half-deleted.
  const result = await Comment.deleteMany({
    $or: [{ _id: comment._id }, ...(comment.depth === 0 ? [{ parent: comment._id }] : [])],
  });

  if (post) {
    await Post.updateOne(
      { _id: post._id },
      { $inc: { commentCount: -result.deletedCount } },
    );
  }

  res.json({ message: 'Comment deleted', id: comment._id, deleted: result.deletedCount });
}