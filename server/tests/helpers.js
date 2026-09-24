import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;

// Starts an in-memory MongoDB and returns the Express app wired to it.
export async function startApp() {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'test-secret';
  const { default: connectDB } = await import('../config/db.js');
  const { default: app } = await import('../app.js');
  await connectDB();
  return app;
}

export async function stopApp() {
  await mongoose.disconnect();
  await mongo.stop();
}

export async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

let userCounter = 0;

// Registers a fresh user and returns { token, user }.
export async function registerUser(app, overrides = {}) {
  userCounter += 1;
  const body = {
    name: `Test User ${userCounter}`,
    email: `user${userCounter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body).expect(201);
  return res.body;
}
