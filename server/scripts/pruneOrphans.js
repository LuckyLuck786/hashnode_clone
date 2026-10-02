/**
 * Maintenance: removes tags that no post uses any more, and optionally deletes
 * throwaway accounts left behind by testing.
 *
 * Deleting a post leaves its tags behind, and a tag with no posts renders an empty
 * page in the tag browser, so it is worth sweeping up periodically.
 *
 *   MONGODB_URI=<atlas uri> node scripts/pruneOrphans.js
 *   MONGODB_URI=<atlas uri> node scripts/pruneOrphans.js --users "test@x.com,foo@x.com"
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Tag from '../models/Tag.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

const args = process.argv.slice(2);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Pass it inline: MONGODB_URI=<uri> node scripts/pruneOrphans.js');
  process.exit(1);
}

const userIndex = args.indexOf('--users');
const emails = (userIndex === -1 ? '' : args[userIndex + 1] ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

try {
  await connectDB();
  console.log(`Connected to "${mongoose.connection.name}".`);

  // A tag is orphaned when no post document references its id.
  const usedTagIds = new Set(
    (await Post.distinct('tags')).map((id) => String(id)),
  );
  const allTags = await Tag.find().select('_id name');
  const dead = allTags.filter((tag) => !usedTagIds.has(String(tag._id)));

  if (dead.length) {
    await Tag.deleteMany({ _id: { $in: dead.map((tag) => tag._id) } });
    console.log(`Removed ${dead.length} unused tag(s): ${dead.map((t) => t.name).join(', ')}`);
  } else {
    console.log('No unused tags found.');
  }

  if (emails.length) {
    const removed = await User.deleteMany({ email: { $in: emails } });
    console.log(`Removed ${removed.deletedCount} account(s): ${emails.join(', ')}`);
  } else {
    console.log('No --users given, so no accounts were removed.');
  }
} catch (error) {
  console.error('Prune failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}