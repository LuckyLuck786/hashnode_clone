# Monospace

A developer-first blogging and publishing platform built on the pure MERN stack —
MongoDB, Express, React and Node. Write in Markdown, get syntax-highlighted code,
tag your posts, and browse a public feed of what other developers are publishing.

![stack](https://img.shields.io/badge/built%20with-MERN-8c3a1f) ![tests](https://img.shields.io/badge/tests-83%20passing-2f6f4a)

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start) — no MongoDB install needed
- [Running against a real MongoDB](#running-against-a-real-mongodb)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Running the tests](#running-the-tests)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Security notes](#security-notes)
- [Deployment](#deployment)

---

## What it does

**Accounts.** Register with a name, email and password. Passwords are hashed with
bcryptjs and never stored or returned in plain text. A signed-in reader stays signed in
across page refreshes, because the JWT is persisted in `localStorage` and validated
against the API on load.

**Writing.** A live Markdown editor with a side-by-side preview. Fenced code blocks are
highlighted with `highlight.js` as you type. Posts can be saved as drafts or published
immediately, with a title, cover image URL and up to five tags.

**Reading.** A public feed of published posts, newest first, with search, tag filtering
and pagination. Posts render as clean long-form articles with a reading-time estimate.

**Tags.** Attach existing tags or invent them while writing. A dedicated `/tags` page
lists every topic with how many published posts use it.

**Profiles.** A public profile per author with their bio, follower count and published
posts. Readers can follow authors to build a personal feed.

**Community.** Like and save posts, and join the discussion with threaded comments
(one level of replies, so threads stay readable on a phone).

**Reading comfort.** A light/dark theme toggle that follows your account across devices,
plus a crash-proof error boundary and shareable link previews with real titles, authors
and cover images.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Database | MongoDB via Mongoose |
| API | Express 5, structured as routes → controllers → models |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` hashing |
| Client | React 19 + Vite, React Router 7 |
| Markdown | `react-markdown` + `remark-gfm` |
| Highlighting | `lowlight` (a slim `highlight.js` build) |
| HTTP | Axios, with a request interceptor that attaches the token |
| State | React Context API (`AuthContext`, `ThemeContext`) plus local component state |
| Tests | `node:test` + Supertest + in-memory MongoDB, and Vitest + Testing Library |

No TypeScript, no server-side rendering — the client is a SPA and the API only ever
returns JSON.

---

## Quick start

You only need **Node.js 20 or newer**. The first command starts a throwaway in-memory
MongoDB and seeds it with demo content, so there is nothing to install or configure.

```bash
git clone <your-repo-url>
cd monospace
npm install
```

**Terminal 1 — the API:**

```bash
npm run dev:memory
```

This boots an in-memory database, seeds 3 users / 6 published posts / 1 draft /
15 tags, and serves the API on <http://localhost:5000>.

**Terminal 2 — the client:**

```bash
npm run dev:client
```

Open <http://localhost:5173>.

Sign in with any seeded account — the password is `password123`:

| Email | Name |
| --- | --- |
| `priya@example.com` | Priya Raman |
| `dev@example.com` | Dev Patel |
| `sam@example.com` | Sam Okoye |

> **Note on ports:** macOS reserves port `5000` for AirPlay Receiver, so if the API
> cannot bind, run it on another port and point the client at it:
> `PORT=5001 npm run dev:memory`, then set `VITE_API_PROXY=http://localhost:5001` in
> `client/.env.local`.

---

## Running against a real MongoDB

For normal development and for deployment, use a persistent database.

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) locally,
   or create a free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster and copy
   its connection string.

2. Create the API environment file:

   ```bash
   cp server/.env.example server/.env
   ```

3. Fill in `server/.env`:

   ```ini
   MONGODB_URI=mongodb://127.0.0.1:27017/monospace   # or your Atlas SRV string
   JWT_SECRET=<paste a long random string>
   JWT_EXPIRES_IN=7d
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

   Generate a real secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Seed the demo content (optional but recommended for a first look):

   ```bash
   npm run seed          # refuses to run against NODE_ENV=production unless --force
   ```

5. Start both apps:

   ```bash
   npm run dev           # API on :5000 and client on :5173
   ```

---

## Environment variables

### `server/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | — | MongoDB connection string |
| `JWT_SECRET` | yes | — | Signing key for tokens. The server refuses to start without it |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `PORT` | no | `5000` | API port |
| `CLIENT_URL` | no | allow all | Comma-separated list of allowed CORS origins |

### `client/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | same origin | Absolute API base URL. Leave empty when the client and API share a domain |
| `VITE_API_PROXY` | no | `http://localhost:5000` | Dev-only target for Vite's `/api` proxy |

Neither file is committed. `.env.example` files document every value.

---

## Available scripts

Run from the repository root (npm workspaces):

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the client together |
| `npm run dev:memory` | API + throwaway in-memory MongoDB, pre-seeded |
| `npm run dev:server` | API only, against `MONGODB_URI` |
| `npm run dev:client` | Vite dev server only |
| `npm run build` | Production build of the client into `client/dist` |
| `npm test` | Runs both test suites (API + client components) |
| `npm run test:server` | API tests only |
| `npm run test:client` | Client component tests only |
| `npm run test:coverage` | Client coverage report |
| `npm run seed` | Wipes and refills the database from `server/scripts/seedData.js` |

---

## Running the tests

```bash
npm test
```

Two suites run:

- **68 API tests** (`server/tests/`) drive the real Express app against an in-memory
  MongoDB, so routing, middleware, controllers and the database are all exercised. No
  database setup or network access is required.
- **15 client tests** (`client/src/test/`) render components in jsdom with Testing
  Library, covering the error boundary, route protection and the theme toggle.

Together they cover the four baseline pass conditions:

- passwords are bcrypt-hashed and never returned;
- a second user cannot edit or delete someone else's post by calling the API directly;
- drafts never appear in the public feed, tag pages, profiles or personalised feeds;
- ownership is enforced server-side, not just hidden in the UI.

Plus the community features, auth rate limiting, and the Open Graph meta proxy.

---

## Project structure

```
.
├── api/index.js              # Vercel serverless entry point
├── proxy.js                  # Routing Middleware: per-post Open Graph tags
├── client/
│   ├── src/
│   │   ├── api/axios.js      # pre-configured Axios instance + error helper
│   │   ├── components/
│   │   │   ├── layout/       # Navbar, Footer, ProtectedRoute
│   │   │   ├── post/         # PostCard, PostList, TagPill
│   │   │   ├── editor/       # MarkdownEditor, MarkdownPreview, highlighter
│   │   │   └── …             # ReactionBar, CommentThread, FollowButton, …
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── hooks/            # useAuth, useRequest, useDocumentTitle
│   │   ├── pages/            # one file per route
│   │   ├── styles/           # design tokens + component styles
│   │   ├── App.jsx           # all routes
│   │   └── main.jsx
│   └── vite.config.js
├── server/
│   ├── config/db.js          # cached MongoDB connection
│   ├── models/               # User, Post, Tag, Comment
│   ├── controllers/          # auth, post, tag, user, comment
│   ├── routes/               # thin routers, one per resource
│   ├── middleware/           # auth (JWT), error handling
│   ├── utils/                # tokens, slugs, validation, queries
│   ├── tests/                # Supertest + in-memory MongoDB
│   ├── scripts/              # seed + in-memory dev server
│   └── server.js
└── vercel.json               # SPA rewrites + serverless /api entry
```

---

## API reference

All protected routes need `Authorization: Bearer <token>`. Ownership is always checked
in the controller, never assumed from the client.

### Auth — `/api/auth`

| Method | Route | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/register` | public | `{ name, email, password }` | Create an account, returns a token |
| POST | `/login` | public | `{ email, password }` | Returns a token and the user |
| GET | `/me` | protected | — | The signed-in user |

### Posts — `/api/posts`

| Method | Route | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/` | public | `?search=&tag=&page=&limit=` | Published feed |
| GET | `/:slug` | public | — | One published post (drafts visible to their author) |
| POST | `/` | protected | `{ title, content, tags, coverImage, status }` | Create a post |
| PUT | `/:id` | protected (owner) | same as above | Update a post |
| DELETE | `/:id` | protected (owner) | — | Delete a post, its comments and its bookmarks |
| GET | `/mine` | protected | — | Every post you wrote, drafts included |
| GET | `/bookmarks` | protected | — | Posts you saved |
| GET | `/following` | protected | — | Published posts by authors you follow |
| GET | `/:id/edit` | protected (owner) | — | A post loaded for editing |
| POST | `/:id/like` | protected | — | Toggle a like |
| POST | `/:id/bookmark` | protected | — | Toggle a bookmark |
| GET | `/:id/comments` | public | — | The comment thread |
| POST | `/:id/comments` | protected | `{ body, parent? }` | Add a comment or a reply |

### Comments — `/api/comments`

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| DELETE | `/:id` | protected (author or post author) | Delete a comment and its replies |

### Tags — `/api/tags`

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | public | All tags with published post counts |
| GET | `/:slug/posts` | public | Published posts under a tag |

### Users — `/api/users`

| Method | Route | Access | Body | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/:id` | public | — | Public profile and published posts |
| PUT | `/me` | protected | `{ name, bio, avatarUrl, theme }` | Update your own profile |
| POST | `/:id/follow` | protected | — | Toggle following an author |
| GET | `/:id/followers` | public | — | Who follows them |
| GET | `/:id/following` | public | — | Who they follow |

### Routes in the client

| Path | Page | Access |
| --- | --- | --- |
| `/` | Public feed (search, tabs) | public |
| `/post/:slug` | Full post, reactions, discussion | public |
| `/tag/:slug` | Posts under one tag | public |
| `/tags` | All tags with counts | public |
| `/profile/:id` | Author profile | public |
| `/login`, `/register` | Auth forms | public |
| `/dashboard` | Your drafts and published posts | protected |
| `/editor/new`, `/editor/:id` | Write / edit | protected |
| `/bookmarks` | Saved posts | protected |
| `/settings` | Edit your profile | protected |

---

## Data model

**User** — `name`, `email` (unique), `password` (bcrypt hash, `select: false`),
`bio`, `avatarUrl`, `following[]`, `theme`, timestamps.

**Post** — `title`, `slug` (unique), `content` (raw Markdown), `excerpt`,
`coverImage`, `status` (`draft` | `published`), `author` → User, `tags[]` → Tag,
`likes[]`, `bookmarks[]`, `readingTime`, `publishedAt`, timestamps.

**Tag** — `name` (unique, lowercase), `slug` (unique), timestamps.

**Comment** — `body`, `post` → Post, `author` → User, `parent` → Comment,
`depth` (0 or 1), timestamps.

Relationships: one User writes many Posts; Posts and Tags are many-to-many through
`Post.tags`. `Post.slug` gives clean URLs such as `/post/building-a-rest-api-with-express`.

`excerpt` and `readingTime` are derived from `content` in a Mongoose `pre('validate')`
hook, so every code path that saves a post keeps them consistent. Like, bookmark and
comment counts are denormalised onto the post so list queries never have to load the id
arrays.

---

## Security notes

- **Passwords** are hashed with bcryptjs at cost 10 in a `pre('save')` hook, the field is
  `select: false`, and a `toJSON` transform deletes it as a second line of defence.
- **Tokens** are verified in `protect` middleware. Login returns the same message for an
  unknown email and a wrong password, so accounts cannot be probed.
- **Ownership** is enforced server-side in `findOwnedPost`, so editing or deleting
  someone else's post returns `403` even when the URL is crafted by hand.
- **Drafts** are filtered at the query layer by a single `listPublishedPosts` helper that
  always forces `status: 'published'`, so a new public listing cannot leak one by accident.
- **Markdown is rendered without `rehype-raw`**, so post content cannot inject raw HTML.
  Links open with `rel="noopener noreferrer nofollow"`.
- **Input is validated** for types, lengths, URL schemes and tag counts before anything
  reaches the database.
- **`helmet()`** sets security headers and CORS is restricted to `CLIENT_URL`.
- **Login and registration are rate limited** to 10 and 5 attempts per IP per window, so
  passwords cannot be brute-forced. Login and registration never reveal whether an email
  exists.
- **The error boundary** keeps a render crash from leaving a visitor on a blank page, and
  clears a stale token when the failure looks session-related. Stack traces are only
  rendered in development builds.

---

## Deployment

The repository is set up to deploy as a single Vercel project (see `vercel.json`): the
React app is built as static assets and `/api/*` is rewritten to `api/index.js`, a
serverless entry point that reuses the same Express app.

1. Create a free MongoDB Atlas cluster and add the credentials user.
2. Push the repository to GitHub and import it into Vercel.
3. Add these environment variables:

   | Variable | Where | Value |
   | --- | --- | --- |
   | `MONGODB_URI` | project | your Atlas connection string |
   | `JWT_SECRET` | project | a long random string |
   | `CLIENT_URL` | project | your Vercel URL |
   | `JWT_EXPIRES_IN` | project | `7d` |

4. Deploy, then seed the demo content once from a local checkout with
   `MONGODB_URI=<atlas uri> npm run seed -- --force`.

To split the halves instead, deploy `server/` to Render or Railway and set
`VITE_API_URL` on the frontend to that API's origin.