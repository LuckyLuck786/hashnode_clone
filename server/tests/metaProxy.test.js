import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { clearDatabase, registerUser, startApp, stopApp } from './helpers.js';

const PAGE_HTML = `<!doctype html><html><head>
<title>Monospace — writing for developers</title>
<meta name="description" content="a generic description" />
</head><body><div id="root"></div></body></html>`;

let mongo;
let proxy;
let app;
let realFetch;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('meta-proxy');
  process.env.JWT_SECRET = 'meta-proxy-secret';

  const { default: connectDB } = await import('../config/db.js');
  await connectDB();
  ({ default: app } = await import('../app.js'));
  proxy = (await import('../../proxy.js')).default;

  // The proxy fetches the page it is about to decorate. Stubbed with the real static
  // HTML so each case can assert on exactly what would be served.
  realFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(PAGE_HTML, { status: 200, headers: { 'content-type': 'text/html' } });
});

after(async () => {
  globalThis.fetch = realFetch;
  await mongooseDisconnect(mongo);
});

beforeEach(clearDatabase);

async function mongooseDisconnect(server) {
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect().catch(() => {});
  await server.stop();
}

function getProxy(path, headers = {}) {
  return proxy(new Request(`https://monospace.example${path}`, {
    headers: { accept: 'text/html', ...headers },
  }));
}

async function createPublishedPost(token, overrides = {}) {
  const res = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Mongoose connections in a serverless function',
      content: 'Body text that becomes the excerpt.',
      status: 'published',
      ...overrides,
    })
    .expect(201);
  return res.body.post;
}

describe('Open Graph meta proxy', () => {
  test('injects per-post tags into a published post page', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token, {
      coverImage: 'https://example.com/cover.png',
    });

    const response = await getProxy(`/post/${post.slug}`);
    const html = await response.text();

    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(html, /<title>Mongoose connections in a serverless function — Monospace<\/title>/);
    assert.match(html, /property="og:type" content="article"/);
    assert.match(html, /property="og:title" content="Mongoose connections/);
    // The excerpt doubles as the share description, so no extra server work is needed.
    assert.match(html, /property="og:description" content="Body text that becomes the excerpt\."/);
    assert.match(html, /property="og:url" content="https:\/\/monospace\.example\/post\//);
    assert.match(html, /property="og:image" content="https:\/\/example\.com\/cover\.png"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    // The original generic description is replaced, not left to compete with the new one.
    assert.doesNotMatch(html, /content="a generic description"/);
  });

  test('falls back to a small summary card when a post has no cover image', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token, { coverImage: '' });

    const html = await (await getProxy(`/post/${post.slug}`)).text();

    assert.match(html, /name="twitter:card" content="summary"/);
    assert.doesNotMatch(html, /og:image/);
  });

  test('never leaks meta tags for a draft or an unknown slug', async () => {
    const { token } = await registerUser(app);
    const draft = await createPublishedPost(token, { status: 'draft', title: 'Secret draft' });

    for (const slug of [draft.slug, 'no-such-post']) {
      const response = await getProxy(`/post/${slug}`);
      const html = await response.text();

      // Nothing is injected, so the page keeps its generic tags and the draft title
      // never reaches a crawler.
      assert.doesNotMatch(html, /og:title/);
      assert.doesNotMatch(html, /Secret draft/);
    }
  });

  test('escapes markup so a title cannot inject into the head', async () => {
    const { token } = await registerUser(app);
    const post = await createPublishedPost(token, { title: 'Tags <script>alert(1)</script>' });

    const html = await (await getProxy(`/post/${post.slug}`)).text();

    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  });

  test('builds a tag page preview without touching the database', async () => {
    const html = await (await getProxy('/tag/mongodb')).text();

    assert.match(html, /<title>Posts tagged #mongodb — Monospace<\/title>/);
    assert.match(html, /property="og:type" content="website"/);
  });

  test('passes pages with nothing specific to say straight through', async () => {
    for (const path of ['/', '/tags', '/login', '/dashboard']) {
      // next() hands control back without a body, which is how a pass-through shows up
      // here. The assertion that matters is that nothing was injected.
      const html = await (await getProxy(path)).text();
      assert.doesNotMatch(html, /og:(title|description|url)/, `${path} should have no injected tags`);
    }
  });

  test('ignores its own internal fetch to avoid recursing', async () => {
    const html = await (
      await getProxy('/post/anything', { 'x-monospace-meta-fetch': '1' })
    ).text();

    assert.doesNotMatch(html, /og:title/);
  });

  test('ignores requests that are not asking for HTML', async () => {
    const response = await proxy(
      new Request('https://monospace.example/post/anything', {
        headers: { accept: 'application/json' },
      }),
    );
    // Passed through untouched, so JSON and asset fetches are never rewritten.
    assert.ok(response);
  });
});