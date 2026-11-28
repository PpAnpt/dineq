import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';

let pool;
let app;
const huge = 'x'.repeat(101 * 1024);
const email = 'customer01@dineq.test';
const absent = '00000000-0000-4000-8000-000000000000';
beforeEach(async () => { pool = await resetAndSeed(); app = createTestApp({ pool }); });
afterAll(closeTestPool);
async function snapshot() {
  const data = {};
  for (const table of ['users', 'sessions', 'restaurants', 'service_queues',
    'queue_operator_assignments', 'queue_entries', 'queue_events']) {
    data[table] = (await pool.query(`SELECT to_jsonb(t) AS value FROM ${table} t ORDER BY to_jsonb(t)::text`)).rows;
  }
  return data;
}
function tooLarge(response) {
  expect(response.status).toBe(413);
  expect(response.body).toEqual({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
  expect(response.headers['set-cookie']).toBeUndefined();
}
describe('F-09a payload error contract', () => {
  test('TEST-70 / AC-70: public oversized login returns safe 413 without a cookie or DB mutation', async () => {
    const before = await snapshot();
    tooLarge(await request(app).post('/api/auth/login').send({ email, password: process.env.SEED_DEMO_PASSWORD, padding: huge }));
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-71 / AC-71: authorized oversized Join returns safe 413 and consumes no ticket', async () => {
    const cookie = await loginAs(email, { app });
    const before = await snapshot();
    tooLarge(await request(app).post(`/api/queues/${seedIds.queue}/entries`).set('Cookie', cookie)
      .send({ partySize: 4, padding: huge }));
    expect(await snapshot()).toEqual(before);
  });
  test.each([
    ['anonymous', null, seedIds.queue, 401, 'UNAUTHENTICATED'],
    ['Host', 'host1@dineq.test', 'not-a-uuid', 403, 'FORBIDDEN'],
    ['bad UUID', email, 'not-a-uuid', 400, 'VALIDATION_ERROR'],
    ['absent queue', email, absent, 404, 'NOT_FOUND'],
  ])('TEST-71 / AC-71: %s precedes oversized Join parsing', async (_label, account, queue, status, code) => {
    const cookie = account ? await loginAs(account, { app }) : null;
    const before = await snapshot();
    const call = request(app).post(`/api/queues/${queue}/entries`);
    if (cookie) call.set('Cookie', cookie);
    const response = await call.send({ partySize: 4, padding: huge });
    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(code);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-71 / AC-71: valid JSON below the limit still joins normally', async () => {
    const cookie = await loginAs(email, { app });
    const response = await request(app).post(`/api/queues/${seedIds.queue}/entries`).set('Cookie', cookie)
      .send({ partySize: 4, padding: 'x'.repeat(90 * 1024) });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ ticketNo: 1, partySize: 4, status: 'WAITING' });
  });
  test.each(['{', '{}', ''])('TEST-72 / AC-72: malformed/missing/empty login JSON %j retains 400', async body => {
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send(body);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-72 / AC-72: small invalid credentials remain 401', async () => {
    const before = await snapshot();
    const response = await request(app).post('/api/auth/login').send({ email, password: 'invalid-for-this-test' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(await snapshot()).toEqual(before);
  });
});
