// Vercel serverless entry point. Every /api/* request is rewritten here (see vercel.json)
// and handled by the same Express app that runs locally.
import app from '../server/app.js';

export default app;
