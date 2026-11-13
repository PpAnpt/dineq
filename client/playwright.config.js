import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import '../server/src/config.js'; // loads the root .env (no secrets are printed)
import { validateTestDatabaseUrl } from '../server/tests/helpers/index.js';

// Fail before any server starts unless TEST_DATABASE_URL is a separate *_test database.
validateTestDatabaseUrl();

const root = fileURLToPath(new URL('../', import.meta.url));
function port(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }
  return value;
}
const apiPort = port('E2E_API_PORT', 3100);
const webPort = port('E2E_WEB_PORT', 5273);
if (apiPort === webPort) throw new Error('E2E_API_PORT and E2E_WEB_PORT must differ');
const apiOrigin = `http://localhost:${apiPort}`;
const origin = `http://localhost:${webPort}`;

// The API must run against the TEST database; the dev database is never touched.
// E2E uses separate, configurable ports. Never reuse an existing server: it may
// target a development database. Vite proxy and allowed Origin follow these ports.
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
      url: `${apiOrigin}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        PORT: String(apiPort),
        APP_ORIGIN: origin,
        COOKIE_SECURE: 'false',
        NODE_ENV: 'test',
      },
    },
    {
      command: 'npm run dev:client',
      cwd: root,
      url: origin,
      env: { VITE_DEV_PORT: String(webPort), API_PROXY_TARGET: apiOrigin },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
