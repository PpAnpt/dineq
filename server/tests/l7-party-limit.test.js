import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { migrate } from '../../database/migrate.js';
import { seed, seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { insertEntry, insertQueue } from './helpers/queueFixtures.js';

// Lab 7 change request L7-CR-01 (docs/labs/lab-07/): per-queue maximum party size.
// Contract: F-02 v0.4 AC-07/AC-12 (revised) and AC-25..AC-27; STS v0.5.

let pool;
let app;
const customerEmail = (n) => `customer${String(n).padStart(2, '0')}@dineq.test`;
const migrationsDir = new URL('../../database/migrations/', import.meta.url);

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const join = (cookie, queueId, partySize) => request(app)
  .post(`/api/queues/${queueId}/entries`).set('Cookie', cookie).send({ partySize });
const queueRow = async (id) => (await pool.query(
  'SELECT status, next_ticket_no FROM service_queues WHERE id = $1', [id])).rows[0];
const entryCount = async (queueId) => Number((await pool.query(
  'SELECT count(*) FROM queue_entries WHERE queue_id = $1', [queueId])).rows[0].count);
const eventCount = async () => Number((await pool.query('SELECT count(*) FROM queue_events')).rows[0].count);

function expectInvalidParty(response, limit) {
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('INVALID_PARTY_SIZE');
  // The message names the limit of the target queue, e.g. "... from 1 to 4 ...".
  expect(response.body.error.message).toMatch(new RegExp(`from 1 to ${limit}\\b`));
  expect(response.body.error.message).not.toContain('@dineq.test');
}

describe('Lab 7 TEST-25 / AC-25: per-queue boundaries', () => {
  test.each([
    { limit: 4, accepted: [1, 4], rejected: 5 },
    { limit: 8, accepted: [1, 8], rejected: 9 },
    { limit: 10, accepted: [9, 10], rejected: 11 },
  ])('TEST-25 / AC-25: a queue with limit $limit accepts $accepted and rejects $rejected naming the limit',
    async ({ limit, accepted, rejected }) => {
      const queueId = await insertQueue(pool, { maxPartySize: limit });
      let customer = 1;
      for (const size of accepted) {
        const response = await join(await login(customerEmail(customer++)), queueId, size);
        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({ queueId, partySize: size, status: 'WAITING' });
      }
      const before = { queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() };
      expectInvalidParty(await join(await login(customerEmail(customer)), queueId, rejected), limit);
      expect({ queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() })
        .toEqual(before);

      // A rejected request consumed no ticket number: the next valid Join gets the next number.
      const next = await join(await login(customerEmail(customer)), queueId, accepted[0]);
      expect(next.status).toBe(201);
      expect(next.body.data.ticketNo).toBe(accepted.length + 1);
    });

  test('TEST-25 / AC-25: a queue without an explicit limit uses the default 8', async () => {
    const queueId = await insertQueue(pool);
    expect((await join(await login(customerEmail(1)), queueId, 8)).status).toBe(201);
    expectInvalidParty(await join(await login(customerEmail(2)), queueId, 9), 8);
    expect(await entryCount(queueId)).toBe(1);
  });

  test.each([
    ['0', 0], ['-1', -1], ['1.5', 1.5], ['"ten"', 'ten'], ['null', null], ['missing', undefined],
  ])('TEST-25 / AC-25: invalid partySize %s on a limit-4 queue is 400 INVALID_PARTY_SIZE and changes nothing',
    async (_label, partySize) => {
      const queueId = await insertQueue(pool, { maxPartySize: 4 });
      const before = { queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() };
      const response = await request(app).post(`/api/queues/${queueId}/entries`)
        .set('Cookie', await login(customerEmail(1)))
        .send(partySize === undefined ? {} : { partySize });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PARTY_SIZE');
      expect({ queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() })
        .toEqual(before);
    });

  test('TEST-25 / AC-25: changing the limit takes effect on the next Join', async () => {
    const queueId = await insertQueue(pool, { maxPartySize: 4 });
    expectInvalidParty(await join(await login(customerEmail(1)), queueId, 5), 4);
    await pool.query('UPDATE service_queues SET max_party_size = 6 WHERE id = $1', [queueId]);
    expect((await join(await login(customerEmail(1)), queueId, 5)).status).toBe(201);
    await pool.query('UPDATE service_queues SET max_party_size = 4 WHERE id = $1', [queueId]);
    expectInvalidParty(await join(await login(customerEmail(2)), queueId, 5), 4);
  });

  test('TEST-25 / AC-25: an out-of-range size on a CLOSED limit-4 queue is 400 first; a valid size is 409 QUEUE_CLOSED', async () => {
    const queueId = await insertQueue(pool, { maxPartySize: 4 });
    await pool.query("UPDATE service_queues SET status = 'CLOSED' WHERE id = $1", [queueId]);
    const before = { queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() };
    expectInvalidParty(await join(await login(customerEmail(1)), queueId, 5), 4);
    const closed = await join(await login(customerEmail(1)), queueId, 4);
    expect(closed.status).toBe(409);
    expect(closed.body.error.code).toBe('QUEUE_CLOSED');
    expect({ queue: await queueRow(queueId), entries: await entryCount(queueId), events: await eventCount() })
      .toEqual(before);
  });
});

describe('Lab 7 TEST-26 / AC-26: seed value, default and legacy data', () => {
  test('TEST-26 / AC-26: GET /api/queues returns maxPartySize: seeded main queue 10, unspecified queue 8, explicit queue 4', async () => {
    const defaultQueue = await insertQueue(pool);
    const smallQueue = await insertQueue(pool, { maxPartySize: 4 });
    const response = await request(app).get('/api/queues').set('Cookie', await login(customerEmail(1)));
    expect(response.status).toBe(200);
    const byId = Object.fromEntries(response.body.data.map(item => [item.id, item]));
    expect(byId[seedIds.queue].maxPartySize).toBe(10);
    expect(byId[defaultQueue].maxPartySize).toBe(8);
    expect(byId[smallQueue].maxPartySize).toBe(4);
  });

  test('TEST-26 / AC-26: re-running migrations and the seed keeps the main queue at 10 and changes no ticket or event', async () => {
    const legacy = await insertEntry(pool, { customer: 1, ticketNo: 1, partySize: 8 });
    const snapshot = async () => JSON.stringify({
      entries: (await pool.query('SELECT * FROM queue_entries ORDER BY id')).rows,
      events: (await pool.query('SELECT * FROM queue_events ORDER BY id')).rows,
    });
    const before = await snapshot();
    expect(await migrate(pool)).toEqual([]);
    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    const client = await pool.connect();
    try { await seed(client, hash); } finally { client.release(); }
    expect(await snapshot()).toBe(before);
    expect((await pool.query('SELECT max_party_size FROM service_queues WHERE id = $1', [seedIds.queue]))
      .rows[0].max_party_size).toBe(10);
    // The pre-existing ticket is still readable through the API, unchanged.
    const read = await request(app).get(`/api/entries/${legacy.id}`).set('Cookie', await login(customerEmail(1)));
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ id: legacy.id, ticketNo: 1, partySize: 8, status: 'WAITING' });
  });

  test('TEST-26 / AC-26: applying migration 002 on a database that already holds tickets leaves tickets and events unchanged', async () => {
    const files = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort();
    const first = files.find(name => name.startsWith('001_'));
    const second = files.find(name => name.startsWith('002_'));
    expect(first).toBeDefined();
    // RED: migration 002 does not exist yet.
    expect(second, 'database/migrations/002_*.sql (per-queue party size limit) must exist').toBeDefined();
    expect(existsSync(new URL(second, migrationsDir))).toBe(true);

    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS l7_upgrade CASCADE');
      await client.query('CREATE SCHEMA l7_upgrade');
      await client.query('SET search_path TO l7_upgrade');
      await client.query(readFileSync(new URL(first, migrationsDir), 'utf8'));
      const user = (await client.query(
        `INSERT INTO users (email, password_hash, role) VALUES ('legacy@example.test', 'x', 'CUSTOMER') RETURNING id`)).rows[0].id;
      const restaurant = (await client.query(
        `INSERT INTO restaurants (name, status) VALUES ('Legacy', 'OPEN') RETURNING id`)).rows[0].id;
      const queue = (await client.query(
        `INSERT INTO service_queues (restaurant_id, status, next_ticket_no) VALUES ($1, 'OPEN', 4) RETURNING id`,
        [restaurant])).rows[0].id;
      const entry = (await client.query(
        `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
         VALUES ($1, $2, 3, 8, 'WAITING') RETURNING id`, [queue, user])).rows[0].id;
      await client.query(
        `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
         VALUES ($1, $2, 'JOINED', NULL, 'WAITING')`, [entry, user]);
      const snapshot = async () => JSON.stringify({
        entries: (await client.query('SELECT * FROM queue_entries ORDER BY id')).rows,
        events: (await client.query('SELECT * FROM queue_events ORDER BY id')).rows,
      });
      const before = await snapshot();

      await client.query(readFileSync(new URL(second, migrationsDir), 'utf8'));

      expect(await snapshot()).toBe(before);
      const migrated = (await client.query(
        'SELECT max_party_size, next_ticket_no FROM service_queues WHERE id = $1', [queue])).rows[0];
      expect(migrated).toEqual({ max_party_size: 8, next_ticket_no: 4 });
    } finally {
      await client.query('RESET search_path');
      await client.query('DROP SCHEMA IF EXISTS l7_upgrade CASCADE');
      client.release();
    }
  });
});

describe('Lab 7 TEST-27 / AC-27: database constraints', () => {
  test.each([0, 11, -1])('TEST-27 / AC-27: service_queues.max_party_size = %i is rejected by the DB (23514)', async (value) => {
    const queueId = await insertQueue(pool);
    await expect(pool.query('UPDATE service_queues SET max_party_size = $2 WHERE id = $1', [queueId, value]))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query(
      `INSERT INTO service_queues (restaurant_id, status, max_party_size) VALUES ($1, 'OPEN', $2)`,
      [seedIds.restaurant, value])).rejects.toMatchObject({ code: '23514' });
  });

  test.each([1, 10])('TEST-27 / AC-27: service_queues.max_party_size = %i is accepted by the DB', async (value) => {
    const queueId = await insertQueue(pool);
    await pool.query('UPDATE service_queues SET max_party_size = $2 WHERE id = $1', [queueId, value]);
    expect((await pool.query('SELECT max_party_size FROM service_queues WHERE id = $1', [queueId]))
      .rows[0].max_party_size).toBe(value);
  });

  test.each([9, 10])('TEST-27 / AC-27: queue_entries.party_size = %i is accepted by the DB', async (size) => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, partySize: size });
    expect(entry.party_size).toBe(size);
  });

  test.each([0, 11])('TEST-27 / AC-27: queue_entries.party_size = %i is rejected by the DB (23514)', async (size) => {
    await expect(insertEntry(pool, { customer: 1, ticketNo: 1, partySize: size }))
      .rejects.toMatchObject({ code: '23514' });
  });
});
