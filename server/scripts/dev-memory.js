// Starts the API against a throwaway in-memory MongoDB and seeds it with demo content.
// Use it to review the project without installing MongoDB or creating an Atlas cluster.
// Nothing is persisted: every restart begins from the seed data again.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('monospace');
process.env.JWT_SECRET ??= 'local-development-secret-not-for-production';

console.log('Started an in-memory MongoDB (data is discarded on exit)');

const { default: connectDB } = await import('../config/db.js');
const { default: app } = await import('../app.js');

await connectDB();
const { default: seedData } = await import('./seedData.js');
await seedData();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await mongo.stop();
    process.exit(0);
  });
}
