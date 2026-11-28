import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../../database/migrate.js';
import { seed, seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { customerEmail, dbState, insertEntry } from './helpers/queueFixtures.js';

// F-06 multiple queues and open/close: docs/sprints/sprint-2/F-06-queues.md (v0.4, AC-46..51).

let pool;
let app;
const BAR = '33333333-3333-4333-8333-333333333333';
const absentId = '00000000-0000-4000-8000-000000000000';
const restaurant = { id: seedIds.restaurant, name: 'DineQ Demo Restaurant' };
const migrationsDir = new URL('../../database/migrations/', import.meta.url);

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const patch = (cookie, queueId, body, { origin } = {}) => {
  const r = request(app).patch(`/api/queues/${queueId}`);
  if (cookie) r.set('Cookie', cookie);
  if (origin) r.set('Origin', origin);
  return body === undefined ? r : r.send(body);
};
const join = (cookie, queueId, partySize = 2) => request(app)
  .post(`/api/queues/${queueId}/entries`).set('Cookie', cookie).send({ partySize });
const queueRow = async (id) => (await pool.query(
  'SELECT name, status, next_ticket_no, max_party_size FROM service_queues WHERE id = $1', [id])).rows[0];
const count = async (sql, params = []) => Number((await pool.query(sql, params)).rows[0].count);

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
  expect(response.body.error.message).not.toContain('@dineq.test');
}
const mainItem = (isAssigned, status = 'OPEN') => ({
  id: seedIds.queue, name: 'Main queue', restaurant, status, maxPartySize: 10, isAssigned,
});
const barItem = (isAssigned, status = 'OPEN') => ({
  id: BAR, name: 'Bar counter', restaurant, status, maxPartySize: 8, isAssigned,
});

describe('F-06 AC-46: queue list with names and per-queue assignment', () => {
  test.each([
    ['Customer', customerEmail(1), false, false],
    ['host1 (Main queue)', 'host1@dineq.test', true, false],
    ['host3 (Bar counter)', 'host3@dineq.test', false, true],
    ['host2 (unassigned)', 'host2@dineq.test', false, false],
  ])('TEST-46 / AC-46: %s lists both queues ordered by restaurant, queue name, id with exact keys', async (_who, email, mainAssigned, barAssigned) => {
    const response = await request(app).get('/api/queues').set('Cookie', await login(email));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [barItem(barAssigned), mainItem(mainAssigned)] });
    for (const item of response.body.data) {
      expect(Object.keys(item).sort()).toEqual(['id', 'isAssigned', 'maxPartySize', 'name', 'restaurant', 'status']);
      expect(Number.isInteger(item.maxPartySize) && item.maxPartySize >= 1 && item.maxPartySize <= 10).toBe(true);
    }
  });
});

describe('F-06 AC-47: assigned Host opens and closes a queue', () => {
  test('TEST-47 / AC-47: close, repeat close (idempotent), reopen; extra body fields have no effect; the other queue is untouched', async () => {
    const host = await login('host1@dineq.test');
    const before = await queueRow(seedIds.queue);
    const barBefore = await queueRow(BAR);

    const closed = await patch(host, seedIds.queue, { status: 'CLOSED', maxPartySize: 1, nextTicketNo: 99, name: 'Hacked', id: absentId });
    expect(closed.status).toBe(200);
    expect(closed.body).toEqual({ data: mainItem(true, 'CLOSED') });
    expect(await queueRow(seedIds.queue)).toEqual({ ...before, status: 'CLOSED' });

    const list = await request(app).get('/api/queues').set('Cookie', host);
    expect(list.body.data.find(q => q.id === seedIds.queue).status).toBe('CLOSED');

    const again = await patch(host, seedIds.queue, { status: 'CLOSED' });
    expect(again.status).toBe(200);
    expect(again.body).toEqual({ data: mainItem(true, 'CLOSED') });
    expect(await queueRow(seedIds.queue)).toEqual({ ...before, status: 'CLOSED' });

    const reopened = await patch(host, seedIds.queue, { status: 'OPEN' });
    expect(reopened.status).toBe(200);
    expect(reopened.body).toEqual({ data: mainItem(true, 'OPEN') });
    expect(await queueRow(seedIds.queue)).toEqual(before);
    expect(await queueRow(BAR)).toEqual(barBefore);
  });
});

describe('F-06 AC-48: access control and validation order', () => {
  test('TEST-48 / AC-48: Customer 403, unassigned or other-queue Host 403, anonymous 401, foreign Origin 403; nothing changes', async () => {
    const before = await dbState(pool);
    expectError(await patch(await login(customerEmail(1)), seedIds.queue, { status: 'CLOSED' }), 403, 'FORBIDDEN');
    // Role is checked before the UUID shape (SDS C.6.3).
    expectError(await patch(await login(customerEmail(1)), 'not-a-uuid', { status: 'CLOSED' }), 403, 'FORBIDDEN');
    expectError(await patch(await login('host2@dineq.test'), seedIds.queue, { status: 'CLOSED' }), 403, 'FORBIDDEN');
    expectError(await patch(await login('host1@dineq.test'), BAR, { status: 'CLOSED' }), 403, 'FORBIDDEN');
    expectError(await patch(null, seedIds.queue, { status: 'CLOSED' }), 401, 'UNAUTHENTICATED');
    expectError(await patch(null, 'not-a-uuid', { status: 'CLOSED' }), 401, 'UNAUTHENTICATED');
    expectError(await patch(await login('host1@dineq.test'), seedIds.queue, { status: 'CLOSED' },
      { origin: 'https://foreign.example' }), 403, 'ORIGIN_NOT_ALLOWED');
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-48 / AC-48: malformed UUID 400, absent queue 404 before the assignment check, bad bodies 400, bad body of an unassigned Host is still 403', async () => {
    const host = await login('host1@dineq.test');
    const before = await dbState(pool);
    expectError(await patch(host, 'not-a-uuid', { status: 'CLOSED' }), 400, 'VALIDATION_ERROR');
    expectError(await patch(host, absentId, { status: 'CLOSED' }), 404, 'NOT_FOUND');
    expectError(await patch(await login('host2@dineq.test'), absentId, { status: 'CLOSED' }), 404, 'NOT_FOUND');
    for (const body of [{}, { status: 'PAUSED' }, { status: 1 }, { status: null }, { status: 'closed' }, [], 'CLOSED']) {
      expectError(await patch(host, seedIds.queue, body), 400, 'VALIDATION_ERROR');
    }
    const malformed = await request(app).patch(`/api/queues/${seedIds.queue}`).set('Cookie', host)
      .set('Content-Type', 'application/json').send('{');
    expectError(malformed, 400, 'VALIDATION_ERROR');
    expectError(await patch(host, seedIds.queue, undefined), 400, 'VALIDATION_ERROR');
    expectError(await patch(await login('host2@dineq.test'), seedIds.queue, { status: 'PAUSED' }), 403, 'FORBIDDEN');
    expect(await dbState(pool)).toBe(before);
  });
});

describe('F-06 AC-49: a CLOSED queue refuses new tickets but serves existing ones', () => {
  test('TEST-49 / AC-49: Join is 409 without using a number; Waiting List, Call Next and Complete still work; reopening continues the numbering', async () => {
    const t1 = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const t2 = await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const host = await login('host1@dineq.test');
    expect((await patch(host, seedIds.queue, { status: 'CLOSED' })).status).toBe(200);

    const before = await dbState(pool);
    expectError(await join(await login(customerEmail(3)), seedIds.queue), 409, 'QUEUE_CLOSED');
    expect(await dbState(pool)).toBe(before);
    expect((await queueRow(seedIds.queue)).next_ticket_no).toBe(3);

    const waiting = await request(app).get(`/api/queues/${seedIds.queue}/entries`).set('Cookie', host);
    expect(waiting.body.data.map(t => t.ticketNo)).toEqual([1, 2]);
    const first = await request(app).post(`/api/queues/${seedIds.queue}/call-next`).set('Cookie', host);
    expect(first.body.data).toMatchObject({ id: t1.id, ticketNo: 1, status: 'CALLED' });
    expect((await request(app).post(`/api/entries/${t1.id}/complete`).set('Cookie', host)).status).toBe(200);
    const second = await request(app).post(`/api/queues/${seedIds.queue}/call-next`).set('Cookie', host);
    expect(second.body.data).toMatchObject({ id: t2.id, ticketNo: 2, status: 'CALLED' });

    expect((await patch(host, seedIds.queue, { status: 'OPEN' })).status).toBe(200);
    const joined = await join(await login(customerEmail(3)), seedIds.queue);
    expect(joined.status).toBe(201);
    expect(joined.body.data.ticketNo).toBe(3);
  });
});

describe('F-06 AC-50: separate queues and concurrency', () => {
  test('TEST-50 / AC-50: one Customer holds a ticket in each queue with separate numbering', async () => {
    const cookie = await login(customerEmail(1));
    const a = await join(cookie, seedIds.queue);
    const b = await join(cookie, BAR);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect([a.body.data.ticketNo, b.body.data.ticketNo]).toEqual([1, 1]);
    expect([a.body.data.queueId, b.body.data.queueId]).toEqual([seedIds.queue, BAR]);
    expectError(await join(cookie, BAR), 409, 'DUPLICATE_ACTIVE');
  });

  test('TEST-50 / AC-50: a Host of one queue cannot list, call, complete or read tickets of the other queue', async () => {
    const barTicket = await insertEntry(pool, { queueId: BAR, customer: 1, ticketNo: 1, hostEmail: 'host3@dineq.test' });
    const before = await dbState(pool);
    const host = await login('host1@dineq.test');
    for (const response of [
      await request(app).get(`/api/queues/${BAR}/entries`).set('Cookie', host),
      await request(app).post(`/api/queues/${BAR}/call-next`).set('Cookie', host),
      await request(app).post(`/api/entries/${barTicket.id}/complete`).set('Cookie', host),
      await request(app).get(`/api/entries/${barTicket.id}`).set('Cookie', host),
    ]) {
      expectError(response, 403, 'FORBIDDEN');
      expect(JSON.stringify(response.body)).not.toContain(barTicket.id);
    }
    expect(await dbState(pool)).toBe(before);
    const own = await request(app).get(`/api/queues/${BAR}/entries`).set('Cookie', await login('host3@dineq.test'));
    expect(own.status).toBe(200);
    expect(own.body.data.map(t => t.id)).toEqual([barTicket.id]);
  });

  test('TEST-50 / AC-50: 20 Joins racing a close are each 201 (before the close) or 409 QUEUE_CLOSED (after); numbers stay contiguous and no ticket appears after the close', async () => {
    const cookies = [];
    for (let n = 1; n <= 20; n++) cookies.push(await login(customerEmail(n)));
    const host = await login('host1@dineq.test');
    const joins = cookies.map(cookie => join(cookie, seedIds.queue));
    const closing = patch(host, seedIds.queue, { status: 'CLOSED' });
    const [closed, ...results] = await Promise.all([closing, ...joins]);
    expect(closed.status).toBe(200);

    const created = results.filter(r => r.status === 201);
    for (const r of results.filter(r => r.status !== 201)) expectError(r, 409, 'QUEUE_CLOSED');
    const numbers = created.map(r => r.body.data.ticketNo).sort((x, y) => x - y);
    expect(numbers).toEqual(Array.from({ length: created.length }, (_, i) => i + 1));
    expect(await count('SELECT count(*) FROM queue_entries WHERE queue_id = $1', [seedIds.queue])).toBe(created.length);
    expect((await queueRow(seedIds.queue)).next_ticket_no).toBe(created.length + 1);
    expect((await queueRow(seedIds.queue)).status).toBe('CLOSED');

    // After the close has returned, no Join can create a ticket.
    expectError(await join(await login(customerEmail(21)), seedIds.queue), 409, 'QUEUE_CLOSED');
    expect(await count('SELECT count(*) FROM queue_entries WHERE queue_id = $1', [seedIds.queue])).toBe(created.length);
  });

  test('TEST-50 / AC-50: 15 Customers joining both queues at once get unique contiguous numbers per queue', async () => {
    const cookies = [];
    for (let n = 1; n <= 15; n++) cookies.push(await login(customerEmail(n)));
    const responses = await Promise.all(cookies.flatMap(cookie => [join(cookie, seedIds.queue), join(cookie, BAR)]));
    expect(responses.every(r => r.status === 201)).toBe(true);
    for (const queueId of [seedIds.queue, BAR]) {
      const numbers = responses.filter(r => r.body.data.queueId === queueId).map(r => r.body.data.ticketNo).sort((x, y) => x - y);
      expect(numbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
      expect((await queueRow(queueId)).next_ticket_no).toBe(16);
    }
  });
});

describe('F-06 AC-51: names, migration, seed and persistence', () => {
  test('TEST-51 / AC-51: the seed has Main queue and Bar counter with the documented assignments and re-seeding keeps names and data', async () => {
    const names = (await pool.query('SELECT id, name FROM service_queues ORDER BY name')).rows;
    expect(names).toEqual([{ id: BAR, name: 'Bar counter' }, { id: seedIds.queue, name: 'Main queue' }]);
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const snapshot = async () => JSON.stringify({
      queues: (await pool.query('SELECT * FROM service_queues ORDER BY id')).rows,
      entries: (await pool.query('SELECT * FROM queue_entries ORDER BY id')).rows,
      assignments: (await pool.query('SELECT * FROM queue_operator_assignments ORDER BY queue_id, host_user_id')).rows,
    });
    const before = await snapshot();
    expect(await migrate(pool)).toEqual([]);
    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    for (let round = 0; round < 2; round++) {
      const client = await pool.connect();
      try { await seed(client, hash); } finally { client.release(); }
    }
    expect(await snapshot()).toBe(before);
    expect((await pool.query('SELECT status FROM queue_entries WHERE id = $1', [entry.id])).rows[0].status).toBe('WAITING');
    const hosts = (await pool.query(`SELECT u.email, a.queue_id FROM queue_operator_assignments a
      JOIN users u ON u.id = a.host_user_id ORDER BY u.email`)).rows;
    expect(hosts).toEqual([{ email: 'host1@dineq.test', queue_id: seedIds.queue }, { email: 'host3@dineq.test', queue_id: BAR }]);
  });

  test('TEST-51 / AC-51: the DB rejects a duplicate queue name in one restaurant (23505), empty and 61-character names (23514)', async () => {
    const insert = (restaurantId, name) => pool.query(
      `INSERT INTO service_queues (restaurant_id, status, name) VALUES ($1, 'OPEN', $2)`, [restaurantId, name]);
    await expect(insert(seedIds.restaurant, 'Main queue')).rejects.toMatchObject({ code: '23505' });
    await expect(insert(seedIds.restaurant, '')).rejects.toMatchObject({ code: '23514' });
    await expect(insert(seedIds.restaurant, '   ')).rejects.toMatchObject({ code: '23514' });
    await expect(insert(seedIds.restaurant, 'x'.repeat(61))).rejects.toMatchObject({ code: '23514' });
    await insert(seedIds.restaurant, 'x'.repeat(60));
    // The same name is fine in another restaurant.
    const other = (await pool.query(`INSERT INTO restaurants (name, status) VALUES ('Other', 'OPEN') RETURNING id`)).rows[0].id;
    await insert(other, 'Main queue');
    // An insert without a name still works and gets a unique generated name.
    const first = (await pool.query(`INSERT INTO service_queues (restaurant_id, status) VALUES ($1, 'OPEN') RETURNING name`, [seedIds.restaurant])).rows[0].name;
    const second = (await pool.query(`INSERT INTO service_queues (restaurant_id, status) VALUES ($1, 'OPEN') RETURNING name`, [seedIds.restaurant])).rows[0].name;
    expect(first).not.toBe(second);
  });

  test('TEST-51 / AC-51: a closed queue stays closed for a new app instance with a new DB pool', async () => {
    const host = await login('host1@dineq.test');
    expect((await patch(host, seedIds.queue, { status: 'CLOSED' })).status).toBe(200);
    const freshPool = createPool(process.env.TEST_DATABASE_URL, { max: 5 });
    try {
      const freshApp = createApp({ pool: freshPool });
      const list = await request(freshApp).get('/api/queues').set('Cookie', host);
      expect(list.body.data.find(q => q.id === seedIds.queue)).toEqual(mainItem(true, 'CLOSED'));
    } finally {
      await freshPool.end();
    }
  });

  test('TEST-51 / AC-51: migration 005 names legacy queues deterministically and the seed then runs twice without a name clash', async () => {
    const files = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort();
    const fifth = files.find(name => name.startsWith('005_'));
    // RED: migration 005 does not exist yet.
    expect(fifth, 'database/migrations/005_*.sql (queue names) must exist').toBeDefined();
    expect(existsSync(new URL(fifth, migrationsDir))).toBe(true);

    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS f06_upgrade CASCADE');
      await client.query('CREATE SCHEMA f06_upgrade');
      await client.query('SET search_path TO f06_upgrade');
      for (const name of files.filter(file => file < fifth)) {
        await client.query(readFileSync(new URL(name, migrationsDir), 'utf8'));
      }
      const legacyAlone = 'aaaaaaaa-0000-4000-8000-00000000000a';
      const lowLegacy = '00000000-0000-4000-8000-000000000001';
      const otherA = 'bbbbbbbb-0000-4000-8000-00000000000b'; // two legacy queues in one other restaurant
      const otherB = 'bbbbbbbb-0000-4000-8000-00000000000c';
      const restaurantOther = '99999999-9999-4999-8999-999999999999';
      const restaurantSolo = '88888888-8888-4888-8888-888888888888';
      await client.query(`INSERT INTO restaurants (id, name, status) VALUES
        ($1, 'DineQ Demo Restaurant', 'OPEN'), ($2, 'Legacy', 'OPEN'), ($3, 'Solo', 'OPEN')`,
      [seedIds.restaurant, restaurantOther, restaurantSolo]);
      // (b) the seeded restaurant already holds the seed queue 2222... and a lower-sorting legacy queue.
      await client.query(`INSERT INTO service_queues (id, restaurant_id, status, next_ticket_no) VALUES
        ($1, $3, 'OPEN', 5), ($2, $3, 'OPEN', 2), ($4, $6, 'OPEN', 3), ($5, $7, 'CLOSED', 1)`,
      [seedIds.queue, lowLegacy, seedIds.restaurant, otherB, legacyAlone, restaurantOther, restaurantSolo]);
      await client.query(`INSERT INTO service_queues (id, restaurant_id, status) VALUES ($1, $2, 'OPEN')`, [otherA, restaurantOther]);
      const user = (await client.query(
        `INSERT INTO users (email, password_hash, role) VALUES ('legacy-customer@example.test', 'x', 'CUSTOMER') RETURNING id`)).rows[0].id;
      const host = (await client.query(
        `INSERT INTO users (email, password_hash, role) VALUES ('legacy-host@example.test', 'x', 'HOST') RETURNING id`)).rows[0].id;
      const entry = (await client.query(
        `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status) VALUES ($1, $2, 4, 3, 'WAITING') RETURNING id`,
        [seedIds.queue, user])).rows[0].id;
      await client.query(`INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status) VALUES ($1, $2, 'JOINED', NULL, 'WAITING')`, [entry, user]);
      await client.query('INSERT INTO queue_operator_assignments (queue_id, host_user_id) VALUES ($1, $2)', [lowLegacy, host]);

      const snapshot = async () => JSON.stringify({
        entries: (await client.query('SELECT * FROM queue_entries ORDER BY id')).rows,
        events: (await client.query('SELECT * FROM queue_events ORDER BY id')).rows,
        assignments: (await client.query('SELECT * FROM queue_operator_assignments ORDER BY queue_id')).rows,
        counters: (await client.query('SELECT id, status, next_ticket_no FROM service_queues ORDER BY id')).rows,
      });
      const before = await snapshot();
      await client.query(readFileSync(new URL(fifth, migrationsDir), 'utf8'));
      expect(await snapshot()).toBe(before);

      const names = async () => Object.fromEntries((await client.query('SELECT id, name FROM service_queues')).rows.map(r => [r.id, r.name]));
      const afterMigration = await names();
      // (a) one restaurant with two legacy queues: lowest id first. (b) the seed queue is reserved for Main queue.
      expect(afterMigration[otherA]).toBe('Main queue');
      expect(afterMigration[otherB]).toBe('Queue 2');
      expect(afterMigration[seedIds.queue]).toBe('Main queue');
      expect(afterMigration[lowLegacy]).toBe('Queue 2');
      expect(afterMigration[legacyAlone]).toBe('Main queue');

      for (let round = 0; round < 2; round++) await seed(client, hash);
      const afterSeed = await names();
      expect(afterSeed[seedIds.queue]).toBe('Main queue');
      expect(afterSeed[lowLegacy]).toBe('Queue 2');
      expect(afterSeed[BAR]).toBe('Bar counter');
      const assignments = (await client.query(`SELECT u.email, q.name FROM queue_operator_assignments a
        JOIN users u ON u.id = a.host_user_id JOIN service_queues q ON q.id = a.queue_id ORDER BY u.email`)).rows;
      expect(assignments).toEqual([
        { email: 'host1@dineq.test', name: 'Main queue' },
        { email: 'host3@dineq.test', name: 'Bar counter' },
        { email: 'legacy-host@example.test', name: 'Queue 2' },
      ]);
      expect((await client.query('SELECT next_ticket_no FROM service_queues WHERE id = $1', [seedIds.queue])).rows[0].next_ticket_no).toBe(5);
      expect((await client.query('SELECT status FROM queue_entries WHERE id = $1', [entry])).rows[0].status).toBe('WAITING');
    } finally {
      await client.query('RESET search_path');
      await client.query('DROP SCHEMA IF EXISTS f06_upgrade CASCADE');
      client.release();
    }
  });
});
