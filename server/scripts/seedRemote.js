/**
 * Populates a live API with demo content through its public endpoints.
 *
 * Deliberately non-destructive: it never deletes anything, so posts written by hand in
 * production survive. Re-running it skips anything that already exists.
 *
 *   node scripts/seedRemote.js https://monospace-blog.vercel.app
 */
import slugify from '../utils/slugify.js';
const BASE = (process.argv[2] ?? process.env.SEED_API_URL ?? '').replace(/\/$/, '');
const PASSWORD = 'password123';

if (!BASE) {
  console.error('Usage: node scripts/seedRemote.js <api-base-url>');
  process.exit(1);
}

async function call(path, options = {}) {
  const response = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status} ${body.message ?? ''}`);
  }
  return body;
}

const authors = [
  {
    email: 'priya@example.com',
    name: 'Priya Raman',
    bio: 'Backend engineer. Mostly Node and Mongo, occasionally Go when nobody is watching.',
    posts: [
      {
        title: 'Mongoose connections in a serverless function',
        tags: ['mongodb', 'serverless', 'node'],
        coverImage: '',
        content: `Serverless functions are short-lived, which is exactly the wrong shape for a naive database connection. Every cold start opens a new socket, and enough of them exhaust the connection limit.

## Cache the promise

The fix is to cache the connection *promise*, not the connection:

\`\`\`js
let connection = null;

export default function connectDB(uri) {
  if (!connection) {
    connection = mongoose.connect(uri).catch((error) => {
      connection = null; // let the next caller retry
      throw error;
    });
  }
  return connection;
}
\`\`\`

Two details matter. Clearing the cache on failure means a transient outage does not
permanently poison the instance, and returning the promise means concurrent cold starts
share one connect instead of racing.

## Why the index

Mongoose defaults to \`autoIndex\` in development and off in production. Leaving it off
means the first real query pays for collection scans until you build them explicitly:

\`\`\`js
postSchema.index({ status: 1, publishedAt: -1 });
\`\`\`

The compound order matters: equality predicates come first, then the sort.`,
      },
      {
        title: 'The fetch-in-useEffect bug nobody warns you about',
        tags: ['react', 'javascript'],
        coverImage: '',
        content: `A request fired from \`useEffect\` without a cleanup function is a race condition waiting to happen.

\`\`\`js
useEffect(() => {
  api.get('/posts').then(setPosts);
}, []); // unmounted before this resolves -> setState on an unmounted component
\`\`\`

An \`AbortController\` makes the intent explicit:

\`\`\`js
useEffect(() => {
  const controller = new AbortController();
  api.get('/posts', { signal: controller.signal }).then(setPosts);
  return () => controller.abort();
}, []);
\`\`\`

The subtle part is that \`abort()\` rejects the promise, so the \`catch\` still runs. Guard
the catch against \`ERR_CANCELED\` or your error state flickers on every navigation.`,
      },
    ],
  },
  {
    email: 'dev@example.com',
    name: 'Dev Patel',
    bio: 'Full-stack developer who believes most CSS problems are really spacing problems.',
    posts: [
      {
        title: 'Rendering user Markdown without opening an XSS hole',
        tags: ['security', 'react', 'markdown'],
        coverImage: '',
        content: `Rendering Markdown means rendering whatever a stranger typed, so the safe default matters.

The dangerous move is enabling raw HTML. \`rehype-raw\` parses raw HTML into the tree, at
which point a post containing \`<img onerror=alert(1)>\` is no longer text.

\`\`\`jsx
<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeCodeHighlight]}>
  {content}
</Markdown>
\`\`\`

With \`rehype-raw\` absent, raw HTML in the source is escaped rather than parsed. Everything
Markdown can express — links, images, tables, code — still works.

Links get one more treatment: \`rel="noopener noreferrer"\` stops an opened tab from
reaching back through \`window.opener\`.`,
      },
      {
        title: 'Reading time is a UX feature, not a vanity metric',
        tags: ['javascript'],
        coverImage: '',
        content: `An estimate of reading time lets a reader decide whether to commit before they start. That is the whole point.

The calculation can be crude:

\`\`\`js
const WORDS_PER_MINUTE = 200;

function estimateReadingTime(markdown) {
  const words = markdown.trim().split(/\\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
\`\`\`

Note \`Math.max(1, ...)\`: a 20-word post is not "0 min read", which reads as a bug.
Rounding to whole minutes is plenty; showing "4.7 minutes" implies precision nobody has.`,
      },
    ],
  },
  {
    email: 'sam@example.com',
    name: 'Sam Okoye',
    bio: 'Frontend developer. Currently thinking about design systems and why buttons are hard.',
    posts: [
      {
        title: 'Design tokens are a contract, not a palette',
        tags: ['css', 'design-systems'],
        coverImage: '',
        content: `A token like \`--ink-muted\` tells a developer what the colour *is for*. \`#85817a\` tells them only what it currently looks like, and invites them to copy it somewhere it does not belong.

\`\`\`css
:root {
  --ink: #1b1a17;
  --ink-soft: #55524b;
  --ink-muted: #85817a;
}
\`\`\`

The payoff shows up when the palette changes. A dark theme is then a single block of
overrides rather than an audit of every component:

\`\`\`css
[data-theme='dark'] {
  --ink: #ece9e2;
  --ink-muted: #837f77;
}
\`\`\`

Nothing else changes, because no component ever referenced a hex value directly.`,
      },
      {
        title: 'Stop optimising the thing that was already fast',
        tags: ['career', 'javascript'],
        coverImage: '',
        content: `Profiling first, every time. The instinct to micro-optimise the most *familiar* code is backwards: familiarity is not evidence of a bottleneck.

A friendlier measure for a list query is the one people forget to run — how many documents
come back per request. A feed that ships full post bodies to render three lines of preview
is usually the real problem, and no amount of micro-optimising the render function fixes it.

\`\`\`js
Post.find(where).sort({ publishedAt: -1 }).limit(10).select('-content');
\`\`\`

That one \`select\` is often worth more than every optimisation in the file around it.`,
      },
    ],
  },
];

const discussion = [
  {
    from: 'dev@example.com',
    slug: 'mongoose-connections-in-a-serverless-function',
    body: 'Clearing the cache on failure is the part people leave out. Worth calling out in the post.',
    reply: {
      from: 'sam@example.com',
      body: 'Agreed — the retry path is the whole trick. Cleared it up by adding a comment.',
    },
  },
  {
    from: 'sam@example.com',
    slug: 'rendering-user-markdown-without-opening-an-xss-hole',
    body: 'The opener on why rehype-raw is dangerous is exactly right. Pinned this one.',
  },
  {
    from: 'priya@example.com',
    slug: 'design-tokens-are-a-contract-not-a-palette',
    body: 'The dark theme as a single block of overrides is the argument I usually fail to make.',
  },
];

async function signIn(email) {
  const existing = await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD }),
  }).catch(() => null);

  if (existing?.token) return existing.token;

  const created = await call('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'New Author', email, password: PASSWORD }),
  });
  return created.token;
}

async function main() {
  console.log(`Seeding ${BASE} (nothing is deleted)\n`);

  const tokens = {};
  for (const author of authors) {
    tokens[author.email] = await signIn(author.email);
  }
  console.log(`  authors ready: ${authors.length}`);

  let created = 0;
  let skipped = 0;

  for (const author of authors) {
    for (const post of author.posts) {
      const exists = await call(`/posts/${slugify(post.title)}`).catch(() => null);
      if (exists?.post) {
        skipped += 1;
        continue;
      }

      await call('/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens[author.email]}` },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          coverImage: post.coverImage,
          tags: post.tags,
          status: 'published',
        }),
      });
      created += 1;
      console.log(`  + ${post.title}`);
    }
  }

  // Bios are applied last so they only ever edit existing accounts.
  for (const author of authors) {
    await call('/users/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens[author.email]}` },
      body: JSON.stringify({ name: author.name, bio: author.bio }),
    });
  }

  let comments = 0;
  for (const item of discussion) {
    const post = await call(`/posts/${item.slug}`).catch(() => null);
    if (!post?.post) continue;

    const already = await call(`/posts/${post.post._id}/comments`);
    if (already.replyCount > 0) continue;

    const parent = await call(`/posts/${post.post._id}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens[item.from]}` },
      body: JSON.stringify({ body: item.body }),
    });
    comments += 1;

    if (item.reply) {
      await call(`/posts/${post.post._id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens[item.reply.from]}` },
        body: JSON.stringify({ body: item.reply.body, parent: parent.comment._id }),
      });
      comments += 1;
    }
  }

  console.log(`\n  posts created: ${created}, already present: ${skipped}`);
  console.log(`  comments created: ${comments}`);
  console.log(`\nDone. Sign in with any of: ${authors.map((a) => a.email).join(', ')} (password: ${PASSWORD})`);
}

await main();