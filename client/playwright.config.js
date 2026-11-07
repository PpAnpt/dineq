import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import '../server/src/config.js'; // loads the root .env (no secrets are printed)
import { validateTestDatabaseUrl } from '../server/tests/helpers/index.js';

// Fail before any server starts unless TEST_DATABASE_URL is a separate *_test database.
validateTestDatabaseUrl();

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://localhost:5173';

// The API must run against the TEST database; the dev database is never touched.
// Ports are fixed (Vite proxies /api to :3000, strictPort) and servers are never
// reused, so a running dev stack makes this fail loudly instead of hitting dev data.
export default defineConfig({
  testDir: './e2e',
  outputDir: '../.local/e2e-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list']],
  use: {
    baseURL: origin,
    viewport: { width: 1280, height: 800 },
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'node server/src/server.js',
      cwd: root,
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        PORT: '3000',
        APP_ORIGIN: origin,
        COOKIE_SECURE: 'false',
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev:client',
      cwd: root,
      url: origin,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
