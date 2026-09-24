import mongoose from 'mongoose';

// Serverless functions can be invoked many times inside one warm instance.
// Caching the promise means every request after the first reuses the same connection.
let connection = null;

export default function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env (see .env.example).');
  }

  if (!connection) {
    connection = mongoose.connect(uri).catch((error) => {
      connection = null;
      throw error;
    });
  }

  return connection;
}
