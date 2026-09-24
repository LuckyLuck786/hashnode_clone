import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

export const MAX_TAG_LENGTH = 30;

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [MAX_TAG_LENGTH, `Tags can be at most ${MAX_TAG_LENGTH} characters`],
    },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

// "  #JavaScript " -> "javascript"
export function normalizeTagName(name) {
  return String(name).trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase();
}

// Returns the ids for the given tag names, creating any tag that does not exist yet.
// Names that produce the same slug ("node.js" and "node js") resolve to one tag.
tagSchema.statics.findOrCreateByNames = async function findOrCreateByNames(names) {
  const bySlug = new Map();
  for (const rawName of names) {
    const name = normalizeTagName(rawName);
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }

  const tags = await Promise.all(
    [...bySlug].map(([slug, name]) =>
      this.findOneAndUpdate(
        { slug },
        { $setOnInsert: { name, slug } },
        { upsert: true, returnDocument: 'after', runValidators: true },
      ),
    ),
  );

  return tags.map((tag) => tag._id);
};

export default mongoose.model('Tag', tagSchema);
