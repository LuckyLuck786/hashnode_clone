import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to server/.env (see .env.example).');
  process.exit(1);
}

try {
  await connectDB();
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
} catch (error) {
  console.error('Failed to connect to MongoDB:', error.message);
  process.exit(1);
}
