import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development the API runs separately on port 5000 (npm run dev:server).
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
