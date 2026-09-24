import mongoose from 'mongoose';
import { createExcerpt, estimateReadingTime } from '../utils/markdown.js';
import { optionalHttpUrl } from '../utils/validators.js';

export const POST_STATUSES = ['draft', 'published'];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title can be at most 150 characters'],
    },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: [true, 'Content is required'] }, // raw Markdown
    excerpt: { type: String, maxlength: 250 },
    coverImage: {
      type: String,
      trim: true,
      default: '',
      validate: optionalHttpUrl('Cover image'),
    },
    status: {
      type: String,
      enum: { values: POST_STATUSES, message: 'Status must be draft or published' },
      default: 'draft',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    readingTime: { type: Number, default: 1 }, // minutes
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ author: 1, updatedAt: -1 });
postSchema.index({ tags: 1 });

// Derived fields are computed here so every code path that saves a post keeps them in sync.
postSchema.pre('validate', function deriveFields() {
  if (this.isModified('content')) {
    this.excerpt = createExcerpt(this.content);
    this.readingTime = estimateReadingTime(this.content);
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

postSchema.methods.isAuthoredBy = function isAuthoredBy(user) {
  const authorId = this.author?._id ?? this.author;
  return Boolean(user) && authorId.equals(user._id);
};

export default mongoose.model('Post', postSchema);
