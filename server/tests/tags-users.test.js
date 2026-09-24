import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { startApp, stopApp, clearDatabase, registerUser } from './helpers.js';

let app;
let alice;

const auth = (session) => ({ Authorization: `Bearer ${session.token}` });

function createPost(overrides) {
  return request(app)
    .post('/api/posts')
    .set(auth(alice))
    .send({ title: 'A post', content: 'Body', status: 'published', ...overrides })
    .expect(201);
}

before(async () => {
  app = await startApp();
});
after(stopApp);
beforeEach(async () => {
  await clearDatabase();
  alice = await registerUser(app, { name: 'Alice' });
});

describe('tags', () => {
  it('lists every tag with its published post count, busiest first', async () => {
    await createPost({ tags: ['react', 'css'] });
    await createPost({ tags: ['react'] });
    await createPost({ tags: ['career'], status: 'draft' });

    const res = await request(app).get('/api/tags').expect(200);
    const counts = Object.fromEntries(res.body.tags.map((tag) => [tag.name, tag.postCount]));

    assert.deepEqual(counts, { react: 2, css: 1, career: 0 });
    assert.equal(res.body.tags[0].name, 'react');
  });

  it('reuses existing tags instead of creating duplicates', async () => {
    await createPost({ tags: ['React'] });
    await createPost({ tags: ['#react ', 'REACT'] });

    const res = await request(app).get('/api/tags').expect(200);
    assert.equal(res.body.tags.length, 1);
  });

  it('lists published posts for a tag and 404s for unknown tags', async () => {
    await createPost({ title: 'Public', tags: ['mongodb'] });
    await createPost({ title: 'Hidden', tags: ['mongodb'], status: 'draft' });

    const res = await request(app).get('/api/tags/mongodb/posts').expect(200);
    assert.equal(res.body.tag.name, 'mongodb');
    assert.deepEqual(res.body.posts.map((post) => post.title), ['Public']);

    await request(app).get('/api/tags/nothing-here/posts').expect(404);
  });
});

describe('users', () => {
  it('shows a public profile with published posts only and no private fields', async () => {
    await createPost({ title: 'Visible' });
    await createPost({ title: 'Draft', status: 'draft' });

    const res = await request(app).get(`/api/users/${alice.user._id}`).expect(200);
    assert.equal(res.body.user.name, 'Alice');
    assert.equal(res.body.user.email, undefined);
    assert.equal(res.body.user.password, undefined);
    assert.deepEqual(res.body.posts.map((post) => post.title), ['Visible']);
  });

  it('returns 404 for unknown or malformed user ids', async () => {
    await request(app).get('/api/users/507f1f77bcf86cd799439011').expect(404);
    await request(app).get('/api/users/nope').expect(404);
  });

  it('lets a user update their own profile', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(auth(alice))
      .send({ name: 'Alice Doe', bio: 'Writes about databases.', avatarUrl: 'https://example.com/a.png' })
      .expect(200);

    assert.equal(res.body.user.name, 'Alice Doe');
    assert.equal(res.body.user.bio, 'Writes about databases.');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.user.email, password: 'password123' });
    assert.equal(login.status, 200, 'password must survive a profile update');
  });

  it('validates profile fields and requires a token', async () => {
    await request(app).put('/api/users/me').send({ name: 'x' }).expect(401);
    await request(app).put('/api/users/me').set(auth(alice)).send({ bio: 'x'.repeat(201) }).expect(400);
    await request(app).put('/api/users/me').set(auth(alice)).send({ avatarUrl: 'ftp://x' }).expect(400);
    await request(app).put('/api/users/me').set(auth(alice)).send({ name: '   ' }).expect(400);
  });
});
