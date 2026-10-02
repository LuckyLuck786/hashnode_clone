import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Component tests run in jsdom; `globals` lets describe/it/expect be used without
    // importing them in every file.
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary'],
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/main.jsx', 'src/test/**'],
      },
    },
    server: {
      port: 5173,
      // Proxying /api in development means the client needs no base URL and no CORS
      // negotiation. Override the target when the API runs on another port, for example
      // on macOS where AirPlay Receiver already holds port 5000.
      proxy: {
        '/api': process.env.VITE_API_PROXY || env.VITE_API_PROXY || 'http://localhost:5000',
      },
    },
  };
});
