import mongoose from 'mongoose';

export const MAX_COMMENT_LENGTH = 2000;

// A reply points at a top-level comment, so a thread is always two levels deep. Deeper
// nesting turns into an unreadable column on a phone, so replies-to-replies are rejected
// and the reader is pointed at the comment they were replying to.
export const MAX_THREAD_DEPTH = 1;

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [
        MAX_COMMENT_LENGTH,
        `Comments can be at most ${MAX_COMMENT_LENGTH} characters`,
      ],
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    depth: { type: Number, enum: [0, MAX_THREAD_DEPTH], default: 0 },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parent: 1, createdAt: 1 });

export default mongoose.model('Comment', commentSchema);