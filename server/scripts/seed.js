import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import seedData from './seedData.js';

// Wipes the database named in MONGODB_URI and refills it with the demo content in
// seedData.js. Run it with `npm run seed` from the repository root.
const force = process.argv.slice(2).includes('--force');

if (process.env.NODE_ENV === 'production' && !force) {
  console.error('Refusing to seed a production database. Re-run with --force if you mean it.');
  process.exit(1);
}

try {
  await connectDB();
  console.log(`Connected to "${mongoose.connection.name}". Clearing existing documents.`);
  await seedData();
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
