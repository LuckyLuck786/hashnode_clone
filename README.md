# Monospace

A blogging platform for developers, built on the MERN stack (MongoDB, Express, React, Node.js). Writers sign up, draft posts in Markdown with a live preview, tag them and publish. Readers browse a feed, search by title, filter by tag and read posts with syntax highlighted code.

Monospace is a Hashnode-inspired internship project. It is not affiliated with Hashnode.

## Features

- Email and password accounts with JWT authentication and bcrypt password hashing
- Markdown editor with a live preview (side by side on desktop, tabs on phones)
- Drafts that only their author can see, and a dashboard to manage every post
- Tags with post counts, tag pages and up to five tags per post
- Title search and "Load more" pagination on the feed, tag pages and profiles
- Public author profiles and editable profile settings
- Light and dark themes that follow the system setting by default
- Skeleton loading states, empty states and error states on every data driven page
- Responsive layout that works from 320px phones to desktop

## Tech stack

| Layer    | Tools                                                                   |
| -------- | ----------------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Axios, react-markdown, remark-gfm, rehype-highlight |
| Backend  | Node.js, Express 5, Mongoose, JSON Web Tokens, bcryptjs, Helmet         |
| Database | MongoDB (MongoDB Atlas in production)                                   |
| Testing  | node:test, Supertest, mongodb-memory-server                             |
| Hosting  | Vercel (static frontend plus one serverless function for the API)      |

## Project structure

```
.
├── api/index.js          Vercel serverless entry, exports the Express app
├── client/               React app (Vite)
│   └── src/
│       ├── api/          Axios instance and one module per resource
│       ├── components/   layout, post, editor and shared ui components
│       ├── context/      AuthContext (current user, login, logout)
│       ├── hooks/        useAuth, usePaginatedPosts, useResource, useTheme
│       ├── pages/        one component per route
│       └── styles/       design tokens, themes and component styles
├── server/               Express API
│   ├── config/           MongoDB connection (cached for serverless)
│   ├── controllers/      request handlers
│   ├── middleware/       auth guards and error handling
│   ├── models/           User, Post and Tag schemas
│   ├── routes/           route definitions
│   ├── scripts/          database seed script and sample content
│   ├── tests/            API tests
│   └── utils/            slugs, excerpts, pagination and validation helpers
└── vercel.json           build settings and rewrites
```

## Getting started

Requirements: Node.js 20 or newer and a MongoDB database (local, or a free MongoDB Atlas cluster).

```bash
git clone https://github.com/LuckyLuck786/hashnode_clone.git
cd hashnode_clone
npm install                         # installs the client and server workspaces
cp server/.env.example server/.env  # then fill in MONGODB_URI and JWT_SECRET
npm run seed                        # optional: sample authors, posts and a demo account
npm run dev                         # API on :5000, React app on :5173
```

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the API.

### Environment variables

`server/.env`

| Name             | Required | Description                                                          |
| ---------------- | -------- | -------------------------------------------------------------------- |
| `MONGODB_URI`    | yes      | MongoDB connection string                                            |
| `JWT_SECRET`     | yes      | Long random string used to sign tokens                               |
| `JWT_EXPIRES_IN` | no       | Token lifetime, default `7d`                                         |
| `PORT`           | no       | API port for local development, default `5000`                       |
| `CLIENT_URL`     | no       | Comma separated origins allowed by CORS. Empty allows any origin     |

`client/.env` (optional)

| Name           | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `VITE_API_URL` | API base URL. Defaults to `/api`, which works locally and on Vercel         |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Scripts

| Command                   | What it does                                            |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev`             | Runs the API and the React app together                 |
| `npm run build`           | Builds the React app into `client/dist`                 |
| `npm test`                | Runs the API tests against an in-memory MongoDB         |
| `npm run seed`            | Adds sample data to an empty database                   |
| `npm run seed -- --reset` | Deletes all users, posts and tags, then adds sample data |

### Demo account

After seeding you can log in as `demo@example.com` with the password `demo12345`. Every seeded author uses the same password.

## API

All endpoints are under `/api`. Protected endpoints need an `Authorization: Bearer <token>` header. Errors always return `{ "message": "..." }` with a matching status code.

| Method | Endpoint                 | Auth     | Description                                                   |
| ------ | ------------------------ | -------- | ------------------------------------------------------------- |
| POST   | `/auth/register`         | no       | Create an account. Returns `{ token, user }`                  |
| POST   | `/auth/login`            | no       | Log in. Returns `{ token, user }`                             |
| GET    | `/auth/me`               | yes      | Current user                                                  |
| GET    | `/posts`                 | no       | Published posts. Query: `page`, `limit`, `search`, `tag`       |
| GET    | `/posts/mine`            | yes      | All of the current user's posts, drafts included              |
| GET    | `/posts/:slug`           | optional | One post. Drafts are returned only to their author            |
| GET    | `/posts/:id/edit`        | yes      | A post with its raw content, for its author                   |
| POST   | `/posts`                 | yes      | Create a post: `title`, `content`, `coverImage`, `tags`, `status` |
| PUT    | `/posts/:id`             | yes      | Update your own post                                          |
| DELETE | `/posts/:id`             | yes      | Delete your own post                                          |
| GET    | `/tags`                  | no       | Every tag with its number of published posts                  |
| GET    | `/tags/:slug/posts`      | no       | Published posts for one tag. Query: `page`, `limit`           |
| GET    | `/users/:id`             | no       | Public profile and published posts                            |
| PUT    | `/users/me`              | yes      | Update `name`, `bio` and `avatarUrl`                          |
| GET    | `/health`                | no       | Health check                                                  |

List endpoints return `{ posts, page, totalPages, total }`.

## Deploying to Vercel

1. Create a free cluster on MongoDB Atlas, add a database user, and allow access from anywhere (`0.0.0.0/0`) under Network Access, since Vercel functions do not have fixed IP addresses.
2. Import the GitHub repository in Vercel. The settings in `vercel.json` are picked up automatically.
3. Add `MONGODB_URI` and `JWT_SECRET` under Project Settings, Environment Variables.
4. Deploy. The React app is served as static files and every `/api/*` request goes to the Express app in `api/index.js`.
5. Seed the production database once from your machine: `MONGODB_URI="<atlas uri>" npm run seed`.

## Testing

```bash
npm test
```

The API tests start a throwaway MongoDB in memory, so they need no database setup. They cover registration and login, protected routes, post CRUD, ownership checks, draft visibility, search, tag filtering, pagination, tag counts and profile updates.
