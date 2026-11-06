import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve from this module, so root and workspace npm scripts share one .env.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export function loadConfig(env = process.env) {
  if (!env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required');
  }
  const port = Number(env.PORT || 3000);
  const sessionTtlSeconds = Number(env.SESSION_TTL_SECONDS || 3600);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  if (!Number.isInteger(sessionTtlSeconds) || sessionTtlSeconds < 1) {
    throw new Error('SESSION_TTL_SECONDS must be a positive integer');
  }
  if (env.COOKIE_SECURE && !['true', 'false'].includes(env.COOKIE_SECURE)) {
    throw new Error('COOKIE_SECURE must be true or false');
  }
  return {
    databaseUrl: env.DATABASE_URL,
    testDatabaseUrl: env.TEST_DATABASE_URL,
    port,
    appOrigin: env.APP_ORIGIN || 'http://localhost:5173',
    sessionTtlSeconds,
    nodeEnv: env.NODE_ENV || 'development',
    cookieSecure: env.COOKIE_SECURE === 'true',
  };
}
