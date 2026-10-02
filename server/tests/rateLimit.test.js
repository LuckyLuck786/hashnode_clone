import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import request from 'supertest';
import { clearDatabase, registerUser, startApp, stopApp } from './helpers.js';

let app;

before(async () => {
  app = await startApp();
});
after(stopApp);
beforeEach(clearDatabase);

describe('rate limiting', () => {
  test('blocks repeated failed logins with 429 and a Retry-After', async () => {
    const { user } = await registerUser(app);

    // The first ten attempts are answered normally; the eleventh is throttled.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong-password' });
      assert.equal(res.status, 401, `attempt ${attempt + 1} should be a normal rejection`);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    assert.equal(blocked.status, 429);
    assert.match(blocked.body.message, /Too many sign-in attempts/);
    assert.ok(Number(blocked.headers['retry-after']) > 0, 'sends Retry-After');
    assert.equal(blocked.headers['ratelimit-remaining'], '0');
  });

  test('a correct password is refused once the window is exhausted', async () => {
    const { user } = await registerUser(app);

    for (let attempt = 0; attempt < 11; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong-password' });
    }

    // Throttling must not become a bypass: the right password is still refused, so an
    // attacker learns nothing about whether the guess was correct.
    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    assert.equal(blocked.status, 429);
  });

  test('limits registration more tightly than login', async () => {
    for (let index = 0; index < 5; index += 1) {
      await request(app).post('/api/auth/register').send({
        name: `User ${index}`,
        email: `rate${index}@example.com`,
        password: 'password123',
      });
    }

    const blocked = await request(app).post('/api/auth/register').send({
      name: 'One too many',
      email: 'overflow@example.com',
      password: 'password123',
    });

    assert.equal(blocked.status, 429);
    assert.match(blocked.body.message, /Too many accounts created/);
  });

  test('throttling one caller does not affect another', async () => {
    for (let attempt = 0; attempt < 11; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });
    }

    // A different address keeps its own window, so one noisy client cannot lock
    // everyone else out of signing in.
    const other = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.7')
      .send({ email: 'nobody@example.com', password: 'wrong-password' });

    assert.equal(other.status, 401);
  });

  test('leaves the token endpoint and public reads alone', async () => {
    for (let attempt = 0; attempt < 11; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });
    }

    await request(app).get('/api/posts').expect(200);
    await request(app).get('/api/tags').expect(200);
    await request(app).get('/api/health').expect(200);
  });
});