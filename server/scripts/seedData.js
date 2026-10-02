import User from '../models/User.js';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';
import slugify from '../utils/slugify.js';

// Demo password for every seeded account. Fine for a throwaway demo database, and the
// script refuses to run against production unless it is asked to explicitly.
const DEMO_PASSWORD = 'password123';

const authors = [
  {
    key: 'priya',
    name: 'Priya Raman',
    email: 'priya@example.com',
    bio: 'Backend engineer. Mostly Node and Mongo, occasionally Go when nobody is watching.',
  },
  {
    key: 'dev',
    name: 'Dev Acharya',
    email: 'dev@example.com',
    bio: 'Frontend developer. Interested in rendering, accessibility and typography on the web.',
  },
  {
    key: 'sam',
    name: 'Samuel Okoro',
    email: 'sam@example.com',
    bio: 'Platform engineer. I write about the boring parts of shipping software.',
  },
];

const posts = [
  {
    author: 'priya',
    status: 'published',
    tags: ['node', 'express', 'api-design'],
    title: 'Structuring an Express API you can still read in six months',
    content: `Most Express projects start as one file and end as one file with three thousand
lines in it. The fix is not a framework, it is a boundary: routes decide *where* a request
goes, controllers decide *what* happens, models decide *how* data is shaped.

## One responsibility per layer

A route file should be scannable in ten seconds. No logic, no queries, just the map.

\`\`\`js
import { Router } from 'express';
import { getPosts, createPost } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/').get(getPosts).post(protect, createPost);

export default router;
\`\`\`

## Let one helper own the dangerous query

The rule "drafts never appear in public listings" is easy to state and easy to forget. So
do not restate it in every controller. Write it once, in a place every public listing has
to go through:

\`\`\`js
export async function listPublishedPosts(filter, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = { ...filter, status: 'published' };

  const [posts, total] = await Promise.all([
    Post.find(where).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(where),
  ]);

  return { posts, page, totalPages: Math.ceil(total / limit), total };
}
\`\`\`

Now the feed, the tag pages and the author profiles all inherit the guarantee. A future
endpoint gets it for free, and there is exactly one line to review when the rule changes.

## Errors in one place

Every controller throwing plain errors and one middleware translating them beats fifty
hand-written \`res.status(400)\` calls. Mongoose validation failures, duplicate keys and
cast errors all have predictable shapes:

\`\`\`js
if (err.code === 11000) {
  status = 409;
  const field = Object.keys(err.keyValue || {})[0] || 'value';
  message = \`That \${field} is already in use\`;
}
\`\`\`

The payoff is that the client only ever has to read \`error.response.data.message\`.`,
  },
  {
    author: 'priya',
    status: 'published',
    tags: ['mongodb', 'mongoose', 'performance'],
    title: 'Counting documents in Mongo without loading them',
    content: `A tags page needs two things: every tag, and how many published posts use it.
The naive version fetches the posts and counts in JavaScript. It works with twenty posts
and falls over at twenty thousand.

## Push the count into the database

An aggregation does the grouping where the data already lives:

\`\`\`js
const counts = await Post.aggregate([
  { $match: { status: 'published' } },
  { $unwind: '$tags' },
  { $group: { _id: '$tags', postCount: { $sum: 1 } } },
]);
\`\`\`

\`$unwind\` turns one post with three tags into three rows, \`$group\` collapses them back
per tag. The documents never cross the wire.

## Then join in memory, not in Mongo

You still want tag names. Two small queries plus a \`Map\` beats a \`$lookup\` here, because
the tag collection is tiny and you avoid a second collection scan:

\`\`\`js
const countByTagId = new Map(counts.map(({ _id, postCount }) => [String(_id), postCount]));

const withCounts = tags.map((tag) => ({
  ...tag,
  postCount: countByTagId.get(String(tag._id)) ?? 0,
}));
\`\`\`

Note \`String(tag._id)\`. ObjectIds are objects, so \`Map\` compares them by reference and
every lookup silently misses. This is the bug you will write at least once.

## Index what you filter on

The aggregation above starts with \`$match\` on \`status\`, and the feed sorts by
\`publishedAt\`. One compound index covers both:

\`\`\`js
postSchema.index({ status: 1, publishedAt: -1 });
\`\`\``,
  },
  {
    author: 'dev',
    status: 'published',
    tags: ['react', 'hooks', 'javascript'],
    title: 'The fetch-in-useEffect bug nobody warns you about',
    content: `Every React tutorial shows this, and every one of them is subtly wrong:

\`\`\`jsx
useEffect(() => {
  fetch(\`/api/posts/\${slug}\`)
    .then((res) => res.json())
    .then(setPost);
}, [slug]);
\`\`\`

Navigate quickly between two posts and you can end up showing the first one's data on the
second one's page. The requests resolve in whatever order the network feels like.

## Cancel on cleanup

\`AbortController\` fixes both the race and the "setState on an unmounted component"
warning:

\`\`\`jsx
useEffect(() => {
  const controller = new AbortController();

  api
    .get(\`/posts/\${slug}\`, { signal: controller.signal })
    .then(({ data }) => setPost(data.post))
    .catch((error) => {
      if (controller.signal.aborted) return;
      setError(readErrorMessage(error));
    });

  return () => controller.abort();
}, [slug]);
\`\`\`

The cleanup function runs before the effect re-runs, so the in-flight request for the old
slug is dead before the new one starts.

## Do it once, not per page

The same eight lines in nine components is nine chances to forget the cleanup. Wrap it:

\`\`\`jsx
const { data, loading, error } = useRequest(
  (signal) => api.get('/posts', { params: { search, page }, signal }).then((r) => r.data),
  [search, page],
);
\`\`\`

Pages go back to describing what they render instead of how they fetch.`,
  },
  {
    author: 'dev',
    status: 'published',
    tags: ['markdown', 'react', 'security'],
    title: 'Rendering user Markdown without opening an XSS hole',
    content: `A blogging platform stores whatever its authors type and shows it to everyone
else. That is the exact shape of a stored XSS bug, so the rendering step deserves more
than five minutes of thought.

## dangerouslySetInnerHTML is the trap

The fast path looks like this, and it hands every author a script tag:

\`\`\`jsx
<div dangerouslySetInnerHTML={{ __html: marked(post.content) }} />
\`\`\`

\`marked\` passes raw HTML through by design. One author writing
\`<img src=x onerror="fetch('/api/auth/me').then(...)">\` now runs code in every reader's
session.

## Build a tree, not a string

\`react-markdown\` parses to an AST and renders React elements. Raw HTML in the source is
treated as text unless you explicitly add \`rehype-raw\`, so the dangerous default is the
safe one:

\`\`\`jsx
<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCodeHighlight]}>
  {post.content}
</Markdown>
\`\`\`

## Links still need attention

Markdown links are legitimate, but a link opening in a new tab can reach back through
\`window.opener\` unless you say otherwise:

\`\`\`jsx
components={{
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer nofollow" />
  ),
}}
\`\`\`

## Highlighting without the payload

\`rehype-highlight\` is convenient and imports every language highlight.js ships with,
which cost about 280 kB in my build. Registering the languages you actually want and
calling lowlight directly gets most of that back:

\`\`\`js
const lowlight = createLowlight({ javascript, python, bash, json, sql });
\`\`\``,
  },
  {
    author: 'sam',
    status: 'published',
    tags: ['jwt', 'security', 'node'],
    title: 'Server-side ownership checks are the whole point',
    content: `Hiding the delete button from people who should not see it is a courtesy.
It is not authorization. The API is the boundary, and anyone can call it with curl.

## The check belongs in the controller

Load the record, compare the owner, then act. Not before, not in the route, not in the
component:

\`\`\`js
async function findOwnedPost(postId, user) {
  const post = await Post.findById(postId);
  if (!post) throw httpError(404, 'Post not found');
  if (!post.isAuthoredBy(user)) throw httpError(403, 'You can only change posts you wrote');
  return post;
}
\`\`\`

Both update and delete call this. There is no path to a write that skips it.

## Compare ObjectIds properly

This is where the check usually breaks. \`===\` on two ObjectIds is false even when they
point at the same document:

\`\`\`js
postSchema.methods.isAuthoredBy = function (user) {
  const authorId = this.author?._id ?? this.author;
  return Boolean(user) && authorId.equals(user._id);
};
\`\`\`

The \`?._id ?? this.author\` handles both the populated and unpopulated document, so the
method works wherever you call it.

## Say the same thing for every failed login

\`No account with that email\` tells an attacker which addresses are registered. One
message for both cases:

\`\`\`js
const user = await User.findOne({ email }).select('+password');
if (!user || !(await user.matchPassword(password))) {
  throw httpError(401, 'Invalid email or password');
}
\`\`\`

## Test the attack, not the happy path

The useful test is the one that tries to break in:

\`\`\`js
await request(app)
  .delete(\`/api/posts/\${victimPost._id}\`)
  .set('Authorization', \`Bearer \${attackerToken}\`)
  .expect(403);
\`\`\``,
  },
  {
    author: 'sam',
    status: 'published',
    tags: ['mongodb', 'serverless', 'deployment'],
    title: 'Mongoose connections in a serverless function',
    content: `Deploying an Express app to a serverless platform works right up until the
database connections run out. The cause is that each invocation calls \`mongoose.connect\`
again, and a warm container keeps every one of them.

## Cache the promise, not the result

Caching a boolean leaves a window where two concurrent invocations both start connecting.
Caching the promise means the second caller awaits the first one's work:

\`\`\`js
let connection = null;

export default function connectDB(uri = process.env.MONGODB_URI) {
  if (!connection) {
    connection = mongoose.connect(uri).catch((error) => {
      connection = null; // let the next request retry instead of caching a failure
      throw error;
    });
  }
  return connection;
}
\`\`\`

Resetting the cache inside \`catch\` matters. Without it, one failed cold start poisons
every later request into that container.

## Connect before the routes, not at import time

Top level \`await connectDB()\` runs during module evaluation, which counts against the
cold start budget even for requests that never touch the database:

\`\`\`js
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});
\`\`\`

A health check that does not need Mongo can sit above this line and answer instantly.

## Cap the pool

A serverless function does not need a pool of ten per container. \`maxPoolSize\` of a few
connections per instance keeps you inside an Atlas free tier limit while you demo.`,
  },
  {
    author: 'priya',
    status: 'draft',
    tags: ['testing', 'node'],
    title: 'Notes on testing an API without mocking the database',
    content: `Draft. The argument so far: \`mongodb-memory-server\` gives you a real Mongo
process per test run, so your tests exercise real indexes, real validation and real
aggregation behaviour instead of a hand-written fake.

\`\`\`js
export async function startApp() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret';
  const { default: app } = await import('../app.js');
  await connectDB();
  return app;
}
\`\`\`

Still to write: how long the first download takes in CI, and whether clearing collections
between tests beats dropping the database.`,
  },
];

// Replaces every user, post and tag with the demo content above. The caller is
// responsible for opening the connection first.
export default async function seedData({ log = console.log } = {}) {
  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Tag.deleteMany({})]);

  const usersByKey = new Map();
  for (const { key, ...details } of authors) {
    // Created one at a time so the pre-save hook hashes each password.
    const user = await User.create({ ...details, password: DEMO_PASSWORD });
    usersByKey.set(key, user);
  }

  let published = 0;
  let drafts = 0;

  for (const entry of posts) {
    const tagIds = await Tag.findOrCreateByNames(entry.tags);
    await Post.create({
      title: entry.title,
      slug: slugify(entry.title),
      content: entry.content,
      status: entry.status,
      tags: tagIds,
      author: usersByKey.get(entry.author)._id,
    });
    if (entry.status === 'published') published += 1;
    else drafts += 1;
  }

  const tagCount = await Tag.countDocuments();
  log(
    `Seeded ${usersByKey.size} users, ${published} published posts, ${drafts} draft, ${tagCount} tags`,
  );
  log(`Demo accounts (password "${DEMO_PASSWORD}"): ${authors.map((a) => a.email).join(', ')}`);

  return { users: usersByKey.size, published, drafts, tags: tagCount };
}
