import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startApp, stopApp, clearDatabase, registerUser } from './helpers.js';

let app;
let alice;
let bob;

const auth = (session) => ({ Authorization: `Bearer ${session.token}` });

function createPost(session, overrides = {}) {
  return request(app)
    .post('/api/posts')
    .set(auth(session))
    .send({
      title: 'Building a REST API with Express',
      content: '# Intro\n\nSome **markdown** text.\n\n```js\nconsole.log("hi");\n```',
      tags: ['JavaScript', 'node.js'],
      status: 'published',
      ...overrides,
    });
}

before(async () => {
  app = await startApp();
});
after(stopApp);
beforeEach(async () => {
  await clearDatabase();
  alice = await registerUser(app);
  bob = await registerUser(app);
});

describe('creating posts', () => {
  it('requires authentication', async () => {
    await request(app).post('/api/posts').send({ title: 'x', content: 'y' }).expect(401);
  });

  it('creates a post with slug, excerpt, reading time, author and tags', async () => {
    const res = await createPost(alice).expect(201);
    const { post } = res.body;

    assert.equal(post.slug, 'building-a-rest-api-with-express');
    assert.equal(post.author._id, alice.user._id);
    assert.deepEqual(post.tags.map((tag) => tag.name).sort(), ['javascript', 'node.js']);
    assert.equal(post.excerpt, 'Intro Some markdown text.');
    assert.equal(post.readingTime, 1);
    assert.ok(post.createdAt && post.updatedAt && post.publishedAt);
  });

  it('gives duplicate titles unique slugs', async () => {
    await createPost(alice).expect(201);
    const res = await createPost(bob).expect(201);
    assert.equal(res.body.post.slug, 'building-a-rest-api-with-express-2');
  });

  it('validates the input', async () => {
    await createPost(alice, { title: '' }).expect(400);
    await createPost(alice, { content: '   ' }).expect(400);
    await createPost(alice, { status: 'archived' }).expect(400);
    await createPost(alice, { coverImage: 'javascript:alert(1)' }).expect(400);
    await createPost(alice, { tags: ['a', 'b', 'c', 'd', 'e', 'f'] }).expect(400);
  });
});

describe('public feed', () => {
  it('lists only published posts, newest first, without drafts', async () => {
    await createPost(alice, { title: 'First published' });
    await createPost(alice, { title: 'Secret draft', status: 'draft' });
    await createPost(bob, { title: 'Second published' });

    const res = await request(app).get('/api/posts').expect(200);
    assert.deepEqual(
      res.body.posts.map((post) => post.title),
      ['Second published', 'First published'],
    );
    assert.equal(res.body.posts[0].content, undefined);
  });

  it('searches titles case-insensitively and treats input as plain text', async () => {
    await createPost(alice, { title: 'Understanding MongoDB indexes' });
    await createPost(alice, { title: 'React hooks in depth' });

    const res = await request(app).get('/api/posts?search=mongodb').expect(200);
    assert.deepEqual(res.body.posts.map((post) => post.title), ['Understanding MongoDB indexes']);

    const regexLike = await request(app).get('/api/posts?search=.*').expect(200);
    assert.equal(regexLike.body.posts.length, 0);
  });

  it('filters by tag slug and returns nothing for unknown tags', async () => {
    await createPost(alice, { title: 'Node post', tags: ['node.js'] });
    await createPost(alice, { title: 'CSS post', tags: ['css'] });

    const res = await request(app).get('/api/posts?tag=node-js').expect(200);
    assert.deepEqual(res.body.posts.map((post) => post.title), ['Node post']);

    const unknown = await request(app).get('/api/posts?tag=cobol').expect(200);
    assert.equal(unknown.body.posts.length, 0);
  });

  it('paginates results', async () => {
    for (let i = 1; i <= 3; i += 1) await createPost(alice, { title: `Post ${i}` });

    const res = await request(app).get('/api/posts?limit=2&page=2').expect(200);
    assert.equal(res.body.total, 3);
    assert.equal(res.body.totalPages, 2);
    assert.deepEqual(res.body.posts.map((post) => post.title), ['Post 1']);
  });
});

describe('reading a single post', () => {
  it('returns a published post by slug to anyone', async () => {
    const { body } = await createPost(alice);
    const res = await request(app).get(`/api/posts/${body.post.slug}`).expect(200);
    assert.match(res.body.post.content, /```js/);
  });

  it('hides drafts from everyone except their author', async () => {
    const { body } = await createPost(alice, { status: 'draft' });
    const url = `/api/posts/${body.post.slug}`;

    await request(app).get(url).expect(404);
    await request(app).get(url).set(auth(bob)).expect(404);
    await request(app).get(url).set(auth(alice)).expect(200);
  });
});

describe('dashboard and editing', () => {
  it('lists drafts and published posts for the owner only', async () => {
    await createPost(alice, { title: 'Draft', status: 'draft' });
    await createPost(alice, { title: 'Live' });
    await createPost(bob, { title: 'Not mine' });

    const res = await request(app).get('/api/posts/mine').set(auth(alice)).expect(200);
    assert.deepEqual(res.body.posts.map((post) => post.title).sort(), ['Draft', 'Live']);
  });

  it('loads a post for editing only for its author', async () => {
    const { body } = await createPost(alice, { status: 'draft' });
    await request(app).get(`/api/posts/${body.post._id}/edit`).set(auth(alice)).expect(200);
    await request(app).get(`/api/posts/${body.post._id}/edit`).set(auth(bob)).expect(403);
  });

  it('lets the author update a post and publish a draft', async () => {
    const { body } = await createPost(alice, { title: 'Working title', status: 'draft' });

    const res = await request(app)
      .put(`/api/posts/${body.post._id}`)
      .set(auth(alice))
      .send({ title: 'Final title', status: 'published', tags: ['career'] })
      .expect(200);

    assert.equal(res.body.post.title, 'Final title');
    assert.equal(res.body.post.slug, 'final-title');
    assert.equal(res.body.post.status, 'published');
    assert.ok(res.body.post.publishedAt);
    assert.deepEqual(res.body.post.tags.map((tag) => tag.name), ['career']);
  });

  it('keeps the slug of a published post when its title changes', async () => {
    const { body } = await createPost(alice);
    const res = await request(app)
      .put(`/api/posts/${body.post._id}`)
      .set(auth(alice))
      .send({ title: 'A new headline' })
      .expect(200);
    assert.equal(res.body.post.slug, body.post.slug);
  });

  it('blocks other users from updating or deleting a post, even via the API', async () => {
    const { body } = await createPost(alice);
    const url = `/api/posts/${body.post._id}`;

    await request(app).put(url).set(auth(bob)).send({ title: 'Hacked' }).expect(403);
    await request(app).delete(url).set(auth(bob)).expect(403);
    await request(app).put(url).send({ title: 'Anonymous' }).expect(401);

    const res = await request(app).get(`/api/posts/${body.post.slug}`).expect(200);
    assert.equal(res.body.post.title, 'Building a REST API with Express');
  });

  it('lets the author delete a post', async () => {
    const { body } = await createPost(alice);
    await request(app).delete(`/api/posts/${body.post._id}`).set(auth(alice)).expect(200);
    await request(app).get(`/api/posts/${body.post.slug}`).expect(404);
  });

  it('returns 404 for malformed or unknown ids', async () => {
    await request(app).put('/api/posts/not-an-id').set(auth(alice)).send({}).expect(404);
    await request(app)
      .delete('/api/posts/507f1f77bcf86cd799439011')
      .set(auth(alice))
      .expect(404);
  });
});
