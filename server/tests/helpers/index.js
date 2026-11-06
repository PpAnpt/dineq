import argon2 from 'argon2';
import request from 'supertest';
import '../../src/config.js';
import { createPool } from '../../src/db/pool.js';
import { createApp } from '../../src/app.js';
import { migrate } from '../../../database/migrate.js';
import { seed } from '../../../database/seed/seedData.js';

let testPool;
let passwordHashPromise;

export function validateTestDatabaseUrl(testUrl = process.env.TEST_DATABASE_URL,
  devUrl = process.env.DATABASE_URL) {
  if (!testUrl) throw new Error('TEST_DATABASE_URL is required; tests never fall back to DATABASE_URL');
  const testName = decodeURIComponent(new URL(testUrl).pathname.slice(1));
  const devName = devUrl ? decodeURIComponent(new URL(devUrl).pathname.slice(1)) : null;
  if (!testName.endsWith('_test') || testName === devName) {
    throw new Error('TEST_DATABASE_URL must target a separate database with a name ending in _test');
  }
  return testName;
}

export function getTestPool() {
  validateTestDatabaseUrl();
  testPool ??= createPool(process.env.TEST_DATABASE_URL, { max: 40 });
  return testPool;
}

export async function resetAndSeed(pool = getTestPool()) {
  const expected = validateTestDatabaseUrl();
  const { rows } = await pool.query('SELECT current_database() AS name');
  if (rows[0].name !== expected) throw new Error('Refusing to reset a pool outside TEST_DATABASE_URL');
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password === 'REPLACE_WITH_A_LOCAL_DEMO_PASSWORD') {
    throw new Error('SEED_DEMO_PASSWORD is required for test seed data');
  }
  passwordHashPromise ??= argon2.hash(password, { type: argon2.argon2id });
  const passwordHash = await passwordHashPromise;
  await migrate(pool);
  const client = await pool.connect();
  try {
    await client.query(`TRUNCATE queue_events, queue_entries, queue_operator_assignments,
      service_queues, restaurants, sessions, users RESTART IDENTITY`);
    await seed(client, passwordHash);
  } finally {
    client.release();
  }
  return pool;
}

export function createTestApp({ pool = getTestPool() } = {}) {
  return createApp({ pool });
}

// Calls the real endpoint introduced by F-01; never fabricates a session or role.
export async function loginAs(email, { app = createTestApp(),
  password = process.env.SEED_DEMO_PASSWORD } = {}) {
  if (!password) throw new Error('SEED_DEMO_PASSWORD is required by loginAs');
  const response = await request(app).post('/api/auth/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(`loginAs expected 200, received ${response.status}; F-01 must be implemented first`);
  }
  const cookie = response.headers['set-cookie']?.find(value => value.startsWith('dineq_session='));
  if (!cookie) throw new Error('Login response did not set dineq_session');
  return cookie.split(';', 1)[0];
}

export async function closeTestPool() {
  if (testPool) await testPool.end();
  testPool = undefined;
}
