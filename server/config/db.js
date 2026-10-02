import mongoose from 'mongoose';

// Serverless functions can be invoked many times inside one warm instance.
// Caching the promise means every request after the first reuses the same connection.
let connection = null;

// readyState 0 is "disconnected". Reusing the cached promise after a disconnect hands back
// a connection that can never run an operation, so the cache is only trusted while the
// underlying socket is still open.
function cacheIsUsable() {
  return connection !== null && mongoose.connection.readyState !== 0;
}

export default function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env (see .env.example).');
  }

  if (!cacheIsUsable()) {
    connection = mongoose.connect(uri).catch((error) => {
      connection = null;
      throw error;
    });
  }

  return connection;
}