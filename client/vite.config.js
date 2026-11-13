import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: Number(process.env.VITE_DEV_PORT || 5173),
    strictPort: true,
    // Browser cookies and Origin stay on the frontend origin, including E2E ports.
    proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://localhost:3000', changeOrigin: false } },
  },
});
