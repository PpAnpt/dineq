import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';

let pool;
let app;
const customerEmail = 'customer01@dineq.test';
const hostEmail = 'host1@dineq.test';
const unknownId = '00000000-0000-4000-8000-000000000000';
const config = loadConfig();

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

function sessionCookie(response) {
  const cookie = response.headers['set-cookie']?.find(value => value.startsWith('dineq_session='));
  if (!cookie) throw new Error('Expected a dineq_session cookie from the real login endpoint');
  return cookie;
}

function tokenHash(cookie) {
  const token = cookie.split(';', 1)[0].slice('dineq_session='.length);
  return createHash('sha256').update(token).digest('hex');
}

async function snapshot() {
  const data = {};
  for (const table of ['users', 'sessions', 'restaurants', 'service_queues',
    'queue_operator_assignments', 'queue_entries', 'queue_events']) {
    const { rows } = await pool.query(`SELECT COALESCE(jsonb_agg(value ORDER BY value::text), '[]'::jsonb) AS data
      FROM (SELECT to_jsonb(t) AS value FROM ${table} t) records`);
    data[table] = rows[0].data;
  }
  // Assertions compare a boolean rather than dumping hashes or tokens on failure.
  return JSON.stringify(data);
}

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
  expect(response.body.error.message.length).toBeGreaterThan(0);
  expect(response.body.error.message).not.toContain('@dineq.test');
  expect(response.body.error.message).not.toContain('$argon2id$');
}

describe('F-01 Authentication and role protection', () => {
  test.each([
    { email: customerEmail, role: 'CUSTOMER', claimedRole: 'HOST' },
    { email: hostEmail, role: 'HOST', claimedRole: 'CUSTOMER' },
  ])('TEST-01 / AC-01: $role logs in without a Cookie; identity, Argon2id and hashed session come from the server', async ({ email, role, claimedRole }) => {
    const user = (await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
    const before = Date.now();
    const response = await request(app).post('/api/auth/login')
      .set('X-User-Id', unknownId).set('X-User-Role', claimedRole)
      .query({ userId: unknownId, role: claimedRole })
      .send({ email, password: process.env.SEED_DEMO_PASSWORD, userId: unknownId, role: claimedRole });
    const after = Date.now();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: user.id, email, role } });
    expect(user.password_hash.startsWith('$argon2id$')).toBe(true);
    const cookie = sessionCookie(response);
    expect(cookie).toMatch(/; HttpOnly/i);
    expect(cookie).toMatch(/; SameSite=Lax/i);
    expect(/; Secure(?:;|$)/i.test(cookie)).toBe(config.cookieSecure);
    expect(cookie).toContain(`Max-Age=${config.sessionTtlSeconds}`);
    const rawToken = cookie.split(';', 1)[0].slice('dineq_session='.length);
    expect(/^[0-9a-f]{64}$/.test(rawToken)).toBe(true);
    const sessions = (await pool.query('SELECT * FROM sessions')).rows;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toBe(user.id);
    expect(sessions[0].token_hash === tokenHash(cookie)).toBe(true);
    expect(sessions[0].token_hash === rawToken).toBe(false);
    expect(sessions[0].revoked_at).toBeNull();
    const expires = new Date(sessions[0].expires_at).getTime();
    expect(expires).toBeGreaterThanOrEqual(before + config.sessionTtlSeconds * 1000 - 1000);
    expect(expires).toBeLessThanOrEqual(after + config.sessionTtlSeconds * 1000 + 1000);
  });

  test('TEST-01 / AC-01: Secure cookie and session TTL follow the supplied server configuration', async () => {
    const secureApp = createApp({ pool, config: { ...config, cookieSecure: true, sessionTtlSeconds: 120 } });
    const response = await request(secureApp).post('/api/auth/login')
      .send({ email: customerEmail, password: process.env.SEED_DEMO_PASSWORD });
    expect(response.status).toBe(200);
    const cookie = sessionCookie(response);
    expect(cookie).toMatch(/; Secure(?:;|$)/i);
    expect(cookie).toContain('Max-Age=120');
    const session = (await pool.query('SELECT expires_at FROM sessions')).rows[0];
    expect(Math.abs(new Date(session.expires_at).getTime() - Date.now() - 120000)).toBeLessThan(2000);
  });

  test('TEST-02 / AC-02: wrong password and unknown email return the same 401 without a session or DB changes', async () => {
    const before = await snapshot();
    const wrong = await request(app).post('/api/auth/login')
      .send({ email: customerEmail, password: 'intentionally-wrong-test-input' });
    const unknown = await request(app).post('/api/auth/login')
      .send({ email: 'unknown@dineq.test', password: process.env.SEED_DEMO_PASSWORD });
    for (const response of [wrong, unknown]) {
      expectError(response, 401, 'INVALID_CREDENTIALS');
      expect(response.headers['set-cookie']).toBeUndefined();
    }
    expect(wrong.body).toEqual(unknown.body);
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-02 / AC-02: an inactive account cannot log in or create a session', async () => {
    await pool.query('UPDATE users SET is_active = false WHERE email = $1', [customerEmail]);
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login')
      .send({ email: customerEmail, password: process.env.SEED_DEMO_PASSWORD });
    expectError(response, 401, 'INVALID_CREDENTIALS');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await snapshot() === before).toBe(true);
  });

  test.each([
    { input: null, label: 'null body' },
    { input: {}, label: 'missing credentials' },
    { input: { email: customerEmail }, label: 'missing password' },
    { input: { email: 123, password: 'test-input' }, label: 'non-string email' },
    { input: { email: customerEmail, password: [] }, label: 'non-string password' },
  ])('TEST-02 / AC-02: $label is rejected with the SDS validation code and no DB changes', async ({ input }) => {
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send(JSON.stringify(input));
    expectError(response, 400, 'VALIDATION_ERROR');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-02 / AC-02: malformed JSON at public Login is a validation error with no DB changes', async () => {
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{');
    expectError(response, 400, 'VALIDATION_ERROR');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-03 / AC-03: /auth/me returns the session user and ignores forged identity/role fields', async () => {
    const cookie = await loginAs(customerEmail, { app });
    const user = (await pool.query('SELECT id, email, role FROM users WHERE email = $1', [customerEmail])).rows[0];
    const before = await snapshot();
    const response = await request(app).get('/api/auth/me').set('Cookie', cookie)
      .set('X-User-Id', unknownId).set('X-User-Role', 'HOST').query({ userId: unknownId, role: 'HOST' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: user });
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-03 / AC-03: a session expired directly in PostgreSQL is rejected without changing DB state', async () => {
    const cookie = await loginAs(customerEmail, { app });
    await pool.query("UPDATE sessions SET expires_at = now() - interval '1 second' WHERE token_hash = $1", [tokenHash(cookie)]);
    const before = await snapshot();
    expectError(await request(app).get('/api/auth/me').set('Cookie', cookie), 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-03 / AC-03: an existing session stops working when its user becomes inactive', async () => {
    const cookie = await loginAs(customerEmail, { app });
    await pool.query('UPDATE users SET is_active = false WHERE email = $1', [customerEmail]);
    const before = await snapshot();
    expectError(await request(app).get('/api/auth/me').set('Cookie', cookie), 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-03 / AC-03: an unknown session token is rejected without creating or mutating a session', async () => {
    const before = await snapshot();
    expectError(await request(app).get('/api/auth/me').set('Cookie', `dineq_session=${'0'.repeat(64)}`), 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-04 / AC-04: Logout revokes the stored session, clears the Cookie and rejects reuse of the old Cookie', async () => {
    const cookie = await loginAs(customerEmail, { app });
    const response = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    const cleared = sessionCookie(response);
    expect(cleared).toMatch(/^dineq_session=;/);
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect(cleared).toMatch(/; HttpOnly/i);
    expect(cleared).toMatch(/; SameSite=Lax/i);
    const session = (await pool.query('SELECT revoked_at FROM sessions WHERE token_hash = $1', [tokenHash(cookie)])).rows[0];
    expect(session.revoked_at).not.toBeNull();
    const before = await snapshot();
    expectError(await request(app).get('/api/auth/me').set('Cookie', cookie), 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test.each([
    { method: 'get', path: '/api/auth/me' },
    { method: 'post', path: '/api/auth/logout' },
    { method: 'get', path: '/api/queues' },
    { method: 'get', path: '/api/me/entries' },
    { method: 'post', path: `/api/queues/${seedIds.queue}/entries` },
    { method: 'get', path: '/api/entries/not-a-uuid' },
    { method: 'get', path: '/api/queues/not-a-uuid/entries' },
    { method: 'post', path: '/api/queues/not-a-uuid/call-next' },
    { method: 'post', path: '/api/entries/not-a-uuid/complete' },
    { method: 'get', path: '/api/unknown-protected-route' },
    { method: 'get', path: '/api/auth/login' },
  ])('TEST-05 / AC-05: anonymous $method $path is rejected before routing/UUID checks with no private data or DB changes', async ({ method, path }) => {
    const before = await snapshot();
    const response = await request(app)[method](path);
    expectError(response, 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-05 / AC-05: an anonymous malformed JSON request is rejected by Session before Body parsing', async () => {
    const before = await snapshot();
    const response = await request(app).post('/api/queues/not-a-uuid/entries')
      .set('Content-Type', 'application/json').send('{');
    expectError(response, 401, 'UNAUTHENTICATED');
    expect(await snapshot() === before).toBe(true);
  });

  test.each([
    { method: 'get', path: `/api/queues/${seedIds.queue}/entries` },
    { method: 'post', path: `/api/queues/${seedIds.queue}/call-next` },
    { method: 'post', path: `/api/entries/${unknownId}/complete` },
    { method: 'get', path: '/api/queues/not-a-uuid/entries' },
    { method: 'post', path: '/api/queues/not-a-uuid/call-next' },
    { method: 'post', path: '/api/entries/not-a-uuid/complete' },
  ])('TEST-06 / AC-06: Customer $method $path is forbidden despite forged Host identity, with DB unchanged', async ({ method, path }) => {
    const cookie = await loginAs(customerEmail, { app });
    const before = await snapshot();
    const attempt = request(app)[method](path).set('Cookie', cookie)
      .set('X-User-Role', 'HOST').set('X-User-Id', unknownId).query({ role: 'HOST', userId: unknownId });
    const response = method === 'post'
      ? await attempt.set('Content-Type', 'application/json').send('{') : await attempt;
    expectError(response, 403, 'FORBIDDEN');
    expect(await snapshot() === before).toBe(true);
  });

  test.each(['post', 'put', 'patch', 'delete'])('TEST-22 / AC-22: foreign Origin on %s is rejected before Session and JSON parsing with no DB changes', async method => {
    const before = await snapshot();
    const response = await request(app)[method]('/api/auth/logout')
      .set('Origin', 'https://foreign.example').set('Content-Type', 'application/json').send('{');
    expectError(response, 403, 'ORIGIN_NOT_ALLOWED');
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-22 / AC-22: foreign Origin on Login cannot create a session even with valid credentials', async () => {
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login').set('Origin', 'https://foreign.example')
      .send({ email: customerEmail, password: process.env.SEED_DEMO_PASSWORD });
    expectError(response, 403, 'ORIGIN_NOT_ALLOWED');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await snapshot() === before).toBe(true);
  });

  test('TEST-22 / AC-22: matching Origin permits Login, and foreign Origin does not block a read-only request', async () => {
    const response = await request(app).post('/api/auth/login').set('Origin', config.appOrigin)
      .send({ email: customerEmail, password: process.env.SEED_DEMO_PASSWORD });
    expect(response.status).toBe(200);
    const cookie = sessionCookie(response).split(';', 1)[0];
    const before = await snapshot();
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).set('Origin', 'https://foreign.example');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(customerEmail);
    expect(await snapshot() === before).toBe(true);
  });
});
