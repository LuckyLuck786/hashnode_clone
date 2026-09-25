// Sample content for local development and the demo deployment.
// Every author below is fictional; the demo account is documented in the README.

const cover = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

export const DEMO_PASSWORD = 'demo12345';

export const authors = [
  {
    key: 'demo',
    name: 'Demo Writer',
    email: 'demo@example.com',
    bio: 'Shared demo account. Feel free to write, edit and delete posts here.',
  },
  {
    key: 'meera',
    name: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    bio: 'Backend engineer. Writes about Node.js, databases and the boring parts of production.',
  },
  {
    key: 'daniel',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@example.com',
    bio: 'Frontend developer working on design systems and React performance.',
  },
  {
    key: 'sofia',
    name: 'Sofia Lindqvist',
    email: 'sofia.lindqvist@example.com',
    bio: 'Platform engineer. CI pipelines, containers and making deploys uneventful.',
  },
];

// daysAgo spreads publish dates out so the feed has a believable history.
export const posts = [
  {
    author: 'meera',
    daysAgo: 1,
    title: 'Error handling in Express 5 without try/catch everywhere',
    tags: ['nodejs', 'express', 'javascript'],
    coverImage: cover('1555066931-4365d14bab8c'),
    content: `Express 5 finally forwards rejected promises from route handlers to your error middleware. That one change removes most of the \`try/catch\` noise that Express 4 apps collected over the years.

## What changed

In Express 4, an \`async\` handler that threw would leave the request hanging, because the router never saw the rejection. The common fix was a wrapper:

\`\`\`js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
\`\`\`

In Express 5 the router does this for you. You can write handlers the way you would write any other async function:

\`\`\`js
router.get('/posts/:slug', async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) throw httpError(404, 'Post not found');
  res.json({ post });
});
\`\`\`

## Give errors a status

Throwing plain \`Error\` objects means every failure becomes a 500. A tiny helper keeps the intent next to the throw:

\`\`\`js
export default function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
\`\`\`

## One place to format responses

The error middleware is the only code that decides what the client sees:

\`\`\`js
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  res.status(status).json({
    message: status === 500 ? 'Something went wrong' : err.message,
  });
}
\`\`\`

Hiding the message for 500s matters. Database errors can include collection names, query shapes and sometimes user input, none of which belongs in a response body.

## Checklist

- Delete your \`asyncHandler\` wrapper after upgrading.
- Throw errors with a status from handlers and services.
- Log the full error server side, return a short message client side.
- Map Mongoose \`ValidationError\` and \`CastError\` to 400 in the same middleware.
`,
  },
  {
    author: 'daniel',
    daysAgo: 2,
    title: 'Why your React list re-renders and how to find out',
    tags: ['react', 'performance', 'javascript'],
    coverImage: cover('1516116216624-53e697fedbea'),
    content: `Most React performance problems I get asked about are lists that re-render on every keystroke. The fix is rarely \`React.memo\` everywhere. It is usually one unstable prop.

## Measure first

Open the React DevTools Profiler, enable **Record why each component rendered**, and type into the input that feels slow. The flame graph will tell you which rows rendered and why. Look for "props changed" with a function or object prop.

## The usual suspect

\`\`\`jsx
function PostList({ posts, onSelect }) {
  return posts.map((post) => (
    <PostRow
      key={post._id}
      post={post}
      style={{ marginBottom: 8 }}
      onClick={() => onSelect(post._id)}
    />
  ));
}
\`\`\`

Both \`style\` and \`onClick\` are new on every render, so a memoized \`PostRow\` still re-renders. Move constant values out of the component and pass stable callbacks:

\`\`\`jsx
const rowStyle = { marginBottom: 8 };

function PostList({ posts, onSelect }) {
  return posts.map((post) => (
    <PostRow key={post._id} post={post} style={rowStyle} onSelect={onSelect} />
  ));
}

const PostRow = memo(function PostRow({ post, style, onSelect }) {
  return (
    <li style={style} onClick={() => onSelect(post._id)}>
      {post.title}
    </li>
  );
});
\`\`\`

## Keys are not optional

Using the array index as a key works until you insert at the top of the list. Then every row receives new props and React reuses the wrong DOM nodes, which is how inputs end up showing another row's value. Use an id from your data.

## When to stop

If a list has fewer than a few hundred rows and each row is cheap, re-rendering is fine. Reach for virtualization only when the profiler shows the commit taking longer than a frame (about 16ms).
`,
  },
  {
    author: 'sofia',
    daysAgo: 4,
    title: 'A GitHub Actions workflow that runs in under two minutes',
    tags: ['devops', 'github-actions', 'ci'],
    coverImage: cover('1498050108023-c5249f4df085'),
    content: `Slow CI changes how a team works. People stop waiting for checks, merge on red, and then spend the afternoon bisecting. Here is the workflow I start every Node project with.

\`\`\`yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
\`\`\`

## The three settings that matter

1. **\`cache: npm\`** restores the npm cache keyed on your lockfile. On a medium project this turns a 60 second install into 10 seconds.
2. **\`concurrency\`** cancels the previous run when you push again to the same branch. You only care about the latest commit.
3. **\`npm ci\`** instead of \`npm install\`. It fails if the lockfile and \`package.json\` disagree, which is exactly what you want in CI.

## Split only when it helps

It is tempting to split lint, test and build into separate jobs. Each job pays for its own checkout and install, so for small projects one job is faster. Split when one step is slow enough that running it in parallel saves more than the setup costs.

## Keep secrets out of pull requests from forks

Workflows triggered by \`pull_request\` from a fork do not receive repository secrets. Do not switch to \`pull_request_target\` to get around this unless you understand that it runs with write access against untrusted code.
`,
  },
  {
    author: 'meera',
    daysAgo: 6,
    title: 'MongoDB indexes I add to every new collection',
    tags: ['mongodb', 'databases', 'nodejs'],
    coverImage: cover('1558494949-ef010cbdcc31'),
    content: `An index is a promise about how you will query your data. Most collections in a typical web app are queried in two or three ways, so they need two or three indexes, not ten.

## Start from the queries

For a blog, the feed asks for published posts, newest first:

\`\`\`js
Post.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(10);
\`\`\`

The matching compound index puts the equality field first and the sort field second:

\`\`\`js
postSchema.index({ status: 1, publishedAt: -1 });
\`\`\`

The author dashboard lists everything one person wrote:

\`\`\`js
postSchema.index({ author: 1, updatedAt: -1 });
\`\`\`

## Check with explain

\`\`\`js
const plan = await Post.find({ status: 'published' })
  .sort({ publishedAt: -1 })
  .explain('executionStats');

console.log(plan.executionStats.totalDocsExamined);
\`\`\`

If \`totalDocsExamined\` is much larger than the number of documents returned, the index is not being used the way you think. A \`SORT\` stage in the winning plan means MongoDB is sorting in memory.

## Unique indexes are validation

A \`unique: true\` slug or email is the only reliable way to prevent duplicates. Checking with \`findOne\` before inserting has a race: two requests can both see "not found" and both insert.

## What not to index

- Fields with two or three possible values on their own, like a boolean.
- Fields you only query in one-off admin scripts.
- Everything, "just in case". Each index slows down writes and uses memory.
`,
  },
  {
    author: 'daniel',
    daysAgo: 8,
    title: 'CSS custom properties are enough for dark mode',
    tags: ['css', 'frontend', 'design-systems'],
    coverImage: cover('1515879218367-8466d910aaa4'),
    content: `You do not need a theming library to support dark mode. Custom properties and one attribute on the root element cover it.

## Define tokens once

\`\`\`css
:root {
  --color-bg: #f7f5f0;
  --color-text: #1f1d1a;
  --color-muted: #6b665d;
  --color-border: #ddd8cc;
}

:root[data-theme='dark'] {
  --color-bg: #171614;
  --color-text: #ebe7df;
  --color-muted: #a39e93;
  --color-border: #34312c;
}
\`\`\`

Components only ever use the tokens:

\`\`\`css
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
\`\`\`

## Respect the system setting

Read the saved choice first and fall back to the operating system preference:

\`\`\`js
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = saved ?? (prefersDark ? 'dark' : 'light');
\`\`\`

Run this in a small inline script in \`index.html\`, before your bundle loads. Otherwise the page renders light first and flashes dark a moment later.

## Name tokens by role, not by color

\`--color-muted\` survives a redesign. \`--grey-500\` does not, because in dark mode the "muted" grey is a different grey. Role based names also make it obvious when a component is using the wrong one.

## Test both themes

Take a screenshot of each page in both themes before shipping. Borders that look fine on a light background often disappear on a dark one.
`,
  },
  {
    author: 'sofia',
    daysAgo: 11,
    title: 'Smaller Node.js Docker images with multi-stage builds',
    tags: ['docker', 'devops', 'nodejs'],
    coverImage: cover('1504639725590-34d0984388bd'),
    content: `The default \`node\` image is over a gigabyte. Your production container does not need a compiler, the npm cache or your dev dependencies.

## Two stages

\`\`\`dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 5000
CMD ["node", "server.js"]
\`\`\`

The first stage installs production dependencies. The second copies only \`node_modules\` and your source. Build tools and caches stay behind in the first stage.

## Order layers by how often they change

Docker caches each layer until something above it changes. Copy the lockfile and install before copying source, so editing a route does not reinstall every package.

## Add a .dockerignore

\`\`\`
node_modules
.git
.env
coverage
\`\`\`

Without it, \`COPY . .\` sends your local \`node_modules\` and possibly your \`.env\` file into the image.

## Do not run as root

The official Node images include a \`node\` user. \`USER node\` costs one line and limits what a compromised process can do inside the container.

## Results

On a small Express API this took the image from 1.1 GB to 240 MB, and rebuilds after a code change from 40 seconds to 6.
`,
  },
  {
    author: 'meera',
    daysAgo: 14,
    title: 'Storing JWTs: what actually matters',
    tags: ['security', 'authentication', 'javascript'],
    coverImage: cover('1542831371-29b0f74f9713'),
    content: `The localStorage versus cookie debate gets a lot of attention. The decisions that matter more are how long tokens live and what happens when one leaks.

## Keep tokens short lived

A token that expires in seven days is valid for seven days after it is stolen. For a hobby project that is an acceptable trade for simplicity. For anything handling money or personal data, use short access tokens (minutes) and a refresh flow.

\`\`\`js
jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
\`\`\`

## localStorage

- Readable by any script on your origin, so an XSS bug exposes it.
- Sent only when your code sends it, so CSRF is not a concern.
- Simple to use from a single page app talking to an API on another domain.

## httpOnly cookies

- Not readable from JavaScript, so XSS cannot copy the token (it can still make requests as the user while the page is open).
- Sent automatically, so you need \`SameSite\` and possibly CSRF tokens.
- Needs more care when the API and frontend are on different domains.

## Whatever you choose

- Never put secrets or permissions you do not re-check on the server inside the payload. It is only base64 encoded.
- Verify the token and load the user on every request, so deleted users lose access immediately.
- Use a long random \`JWT_SECRET\` and keep it out of your repository.

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
\`\`\`

The biggest risk to your tokens is still an XSS hole, so rendering user content safely matters more than where the token lives.
`,
  },
  {
    author: 'daniel',
    daysAgo: 18,
    title: 'Rendering Markdown safely in React',
    tags: ['react', 'markdown', 'security'],
    coverImage: cover('1517694712202-14dd9538aa97'),
    content: `If your app lets users write Markdown, you are rendering untrusted input. \`dangerouslySetInnerHTML\` with the output of a Markdown to HTML converter is how stored XSS happens.

## Use a renderer that builds React elements

\`react-markdown\` parses Markdown into a syntax tree and turns it into React elements. It never touches \`innerHTML\`, and raw HTML in the source is ignored by default.

\`\`\`jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function MarkdownView({ source }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {source}
    </ReactMarkdown>
  );
}
\`\`\`

\`remark-gfm\` adds tables, task lists and strikethrough. \`rehype-highlight\` adds syntax highlighting classes to fenced code blocks.

## Links need attention too

A link like \`[click](javascript:alert(1))\` is valid Markdown. \`react-markdown\` strips unsafe protocols by default through its \`urlTransform\` option. Do not replace that function with one that returns every URL unchanged.

## Open external links safely

\`\`\`jsx
const components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};
\`\`\`

## The editor preview is the same component

Use one \`MarkdownView\` for the post page and the editor preview. Writers see exactly what readers will see, and there is only one place to review for safety.
`,
  },
  {
    author: 'sofia',
    daysAgo: 23,
    title: 'Environment variables across local, preview and production',
    tags: ['devops', 'vercel', 'configuration'],
    coverImage: cover('1461749280684-dccba630e2f6'),
    content: `Configuration bugs are the ones that only show up after a deploy. A few habits make them rare.

## Commit an example file

\`\`\`bash
# server/.env.example
MONGODB_URI=mongodb://127.0.0.1:27017/monospace
JWT_SECRET=replace-with-a-long-random-string
CLIENT_URL=http://localhost:5173
\`\`\`

The real \`.env\` stays in \`.gitignore\`. New contributors copy the example and fill it in, and the example doubles as documentation.

## Fail fast on missing values

\`\`\`js
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}
\`\`\`

A server that refuses to start is easier to debug than one that starts and signs tokens with \`undefined\`.

## Frontend variables are public

Anything prefixed with \`VITE_\` is inlined into your JavaScript bundle. Treat it as public. API keys that must stay secret belong on the server.

## Separate values per environment

On Vercel, set each variable for Production and Preview separately. Preview deployments should point at a separate database so testing a branch cannot delete real data.

## Keep the list short

Every variable is something that can be missing. If a value is the same everywhere, it is a constant, not configuration.
`,
  },
  {
    author: 'demo',
    daysAgo: 3,
    title: 'Notes from my first week with the MERN stack',
    tags: ['mongodb', 'react', 'beginners'],
    coverImage: '',
    content: `I spent this week building a small blogging app with MongoDB, Express, React and Node. A few things I wish I had known on day one.

## Keep the API and the UI separate

The React app only talks to the API through one Axios instance:

\`\`\`js
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});
\`\`\`

Every request gets the token, and no component has to remember to add it.

## Mongoose does a lot for you

Schema validation, default values and \`timestamps: true\` removed most of the checks I was writing by hand.

## Things I still want to learn

- Writing tests for the React side
- Image uploads instead of pasting URLs
- Comments and likes
`,
  },
  {
    author: 'demo',
    daysAgo: 0,
    status: 'draft',
    title: 'Draft: comparing Vite and Create React App',
    tags: ['react', 'tooling'],
    coverImage: '',
    content: `This is a draft, so it only shows up on the dashboard of the person who wrote it.

## Dev server start time

Vite starts in well under a second because it serves source files as native ES modules and only transforms what the browser asks for.
`,
  },
];
