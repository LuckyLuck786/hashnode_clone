// Fills the database with sample authors, tags and posts.
//
//   npm run seed              refuses to run if the database already has users
//   npm run seed -- --reset   deletes all users, posts and tags first
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import slugify from '../utils/slugify.js';
import { authors, posts, DEMO_PASSWORD } from './seedData.js';

const DAY_MS = 24 * 60 * 60 * 1000;

async function seed({ reset }) {
  await connectDB();

  if (await User.estimatedDocumentCount()) {
    if (!reset) {
      throw new Error('Database is not empty. Run "npm run seed -- --reset" to replace its data.');
    }
    await Promise.all([User.deleteMany({}), Post.deleteMany({}), Tag.deleteMany({})]);
    console.log('Cleared existing users, posts and tags');
  }

  const userIdByKey = new Map();
  for (const { key, ...author } of authors) {
    // create() one at a time so the password hashing hook runs for each user.
    const user = await User.create({ ...author, password: DEMO_PASSWORD });
    userIdByKey.set(key, user._id);
  }

  for (const { author, daysAgo, tags, status = 'published', ...post } of posts) {
    const date = new Date(Date.now() - daysAgo * DAY_MS);
    await Post.create(
      [
        {
          ...post,
          slug: slugify(post.title),
          status,
          author: userIdByKey.get(author),
          tags: await Tag.findOrCreateByNames(tags),
          publishedAt: status === 'published' ? date : undefined,
          createdAt: date,
          updatedAt: date,
        },
      ],
      // Keep the back-dated timestamps instead of letting Mongoose set them to now.
      { timestamps: false },
    );
  }

  console.log(`Seeded ${authors.length} users and ${posts.length} posts.`);
  console.log(`Demo login: ${authors[0].email} / ${DEMO_PASSWORD}`);
}

try {
  await seed({ reset: process.argv.includes('--reset') });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
