import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import User from '../models/User.js';
import { startApp, stopApp, clearDatabase, registerUser } from './helpers.js';

let app;

before(async () => {
  app = await startApp();
});
after(stopApp);
beforeEach(clearDatabase);

describe('POST /api/auth/register', () => {
  it('creates a user, returns a token and never returns the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'Ada@Example.com', password: 'password123' })
      .expect(201);

    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'ada@example.com');
    assert.equal(res.body.user.password, undefined);
  });

  it('stores the password as a bcrypt hash', async () => {
    await registerUser(app, { email: 'hash@example.com', password: 'plaintext-secret' });
    const stored = await User.findOne({ email: 'hash@example.com' }).select('+password');

    assert.notEqual(stored.password, 'plaintext-secret');
    assert.match(stored.password, /^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    await registerUser(app, { email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Again', email: 'dup@example.com', password: 'password123' })
      .expect(409);
    assert.match(res.body.message, /already exists/);
  });

  it('rejects short passwords and invalid emails', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short', email: 'short@example.com', password: '123' })
      .expect(400);
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad', email: 'not-an-email', password: 'password123' })
      .expect(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await registerUser(app, { email: 'login@example.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200);
    assert.ok(res.body.token);
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    await registerUser(app, { email: 'login@example.com', password: 'password123' });
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'nope-nope' })
      .expect(401);
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' })
      .expect(401);
    assert.equal(wrong.body.message, unknown.body.message);
  });

  it('does not allow query operators in place of an email', async () => {
    await registerUser(app);
    await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: 'password123' })
      .expect(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser(app);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(res.body.user._id, user._id);
  });

  it('rejects requests without a token or with a bad token', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt').expect(401);
  });
});
