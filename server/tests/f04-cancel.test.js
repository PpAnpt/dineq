import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../../database/migrate.js';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import {
  customerEmail, dbState, entryRow, eventsFor, insertEntry, userIdByEmail,
} from './helpers/queueFixtures.js';

// F-04 Customer cancel: docs/sprints/sprint-2/F-04-cancel.md (v0.2, AC-28..35).

let pool;
let app;
const absentId = '00000000-0000-4000-8000-000000000000';
const TICKET_KEYS = ['calledAt', 'completedAt', 'createdAt', 'id', 'partySize', 'queueId', 'status', 'ticketNo'];
const migrationsDir = new URL('../../database/migrations/', import.meta.url);

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const cancel = (cookie, entryId, { origin, body } = {}) => {
  const r = request(app).post(`/api/entries/${entryId}/cancel`);
  if (cookie) r.set('Cookie', cookie);
  if (origin) r.set('Origin', origin);
  return body === undefined ? r : r.send(body);
};
const callNext = (cookie) => request(app).post(`/api/queues/${seedIds.queue}/call-next`).set('Cookie', cookie);
const complete = (cookie, entryId) => request(app).post(`/api/entries/${entryId}/complete`).set('Cookie', cookie);

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
  expect(response.body.error.message).not.toContain('@dineq.test');
}
const count = async (sql, params = []) => Number((await pool.query(sql, params)).rows[0].count);

describe('F-04 AC-28: owner cancels a WAITING ticket', () => {
  test('TEST-28 / AC-28: the owner cancels, reads it back, and body fields cannot change authority or the ticket', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, partySize: 4 });
    const other = await userIdByEmail(pool, customerEmail(2));
    const cookie = await login(customerEmail(1));
    const response = await cancel(cookie, entry.id, { body: { status: 'CALLED', customerId: other, ticketNo: 99 } });
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual(TICKET_KEYS);
    expect(response.body.data).toMatchObject({
      id: entry.id, queueId: seedIds.queue, ticketNo: 1, partySize: 4,
      status: 'CANCELLED', calledAt: null, completedAt: null,
    });

    const byId = await request(app).get(`/api/entries/${entry.id}`).set('Cookie', cookie);
    expect(byId.status).toBe(200);
    expect(byId.body.data.status).toBe('CANCELLED');
    const mine = await request(app).get('/api/me/entries').set('Cookie', cookie);
    expect(mine.body.data.map(t => [t.id, t.status])).toEqual([[entry.id, 'CANCELLED']]);

    const row = await entryRow(pool, entry.id);
    expect(row).toMatchObject({ customer_id: await userIdByEmail(pool, customerEmail(1)), ticket_no: 1,
      status: 'CANCELLED', called_at: null, completed_at: null });
    const events = (await eventsFor(pool, entry.id)).filter(e => e.event_type === 'CANCELLED');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ from_status: 'WAITING', to_status: 'CANCELLED',
      actor_id: await userIdByEmail(pool, customerEmail(1)) });
  });
});

describe('F-04 AC-29: the transition and its event are atomic', () => {
  test('TEST-29 / AC-29: when the event insert fails nothing changes (no CANCELLED status, no event) and the error is generic', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const cookie = await login(customerEmail(1));
    // Test-only fault injection: a trigger that makes any CANCELLED event insert fail.
    await pool.query(`CREATE OR REPLACE FUNCTION f04_fail_cancel_event() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'injected failure f04'; END; $$ LANGUAGE plpgsql`);
    await pool.query(`CREATE TRIGGER f04_fail_cancel_event BEFORE INSERT ON queue_events
      FOR EACH ROW WHEN (NEW.event_type = 'CANCELLED') EXECUTE FUNCTION f04_fail_cancel_event()`);
    try {
      const before = await dbState(pool);
      const response = await cancel(cookie, entry.id);
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(response.body)).not.toMatch(/injected|trigger|queue_events|f04/i);
      expect(await dbState(pool)).toBe(before);
      expect((await entryRow(pool, entry.id)).status).toBe('WAITING');
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS f04_fail_cancel_event ON queue_events');
      await pool.query('DROP FUNCTION IF EXISTS f04_fail_cancel_event()');
    }
  });
});

describe('F-04 AC-30: access control', () => {
  test('TEST-30 / AC-30: anonymous 401, Host 403 (even with a bad UUID), another Customer 403, foreign Origin 403; the ticket stays WAITING', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const before = await dbState(pool);
    expectError(await cancel(null, entry.id), 401, 'UNAUTHENTICATED');
    for (const email of ['host1@dineq.test', 'host2@dineq.test']) {
      const host = await login(email);
      expectError(await cancel(host, entry.id), 403, 'FORBIDDEN');
      expectError(await cancel(host, 'not-a-uuid'), 403, 'FORBIDDEN');
    }
    const other = await cancel(await login(customerEmail(2)), entry.id);
    expectError(other, 403, 'FORBIDDEN');
    expect(JSON.stringify(other.body)).not.toContain(entry.id);
    expectError(await cancel(await login(customerEmail(1)), entry.id, { origin: 'https://foreign.example' }),
      403, 'ORIGIN_NOT_ALLOWED');
    expect(await dbState(pool)).toBe(before);
    expect((await entryRow(pool, entry.id)).status).toBe('WAITING');
  });
});

describe('F-04 AC-31: path validation precedence', () => {
  test('TEST-31 / AC-31: malformed UUID is 400, absent UUID is 404; anonymous 401 and Host 403 come first; nothing changes', async () => {
    await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const before = await dbState(pool);
    const customer = await login(customerEmail(1));
    expectError(await cancel(customer, 'not-a-uuid'), 400, 'VALIDATION_ERROR');
    expectError(await cancel(customer, absentId), 404, 'NOT_FOUND');
    expectError(await cancel(null, 'not-a-uuid'), 401, 'UNAUTHENTICATED');
    expectError(await cancel(null, absentId), 401, 'UNAUTHENTICATED');
    const host = await login('host1@dineq.test');
    expectError(await cancel(host, 'not-a-uuid'), 403, 'FORBIDDEN');
    expectError(await cancel(host, absentId), 403, 'FORBIDDEN');
    expect(await dbState(pool)).toBe(before);
  });
});

describe('F-04 AC-32: only WAITING tickets can be cancelled', () => {
  test.each(['CALLED', 'COMPLETED'])('TEST-32 / AC-32: cancelling a %s ticket is 409 INVALID_TRANSITION and changes nothing', async (status) => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, status });
    const before = await dbState(pool);
    expectError(await cancel(await login(customerEmail(1)), entry.id), 409, 'INVALID_TRANSITION');
    expect(await dbState(pool)).toBe(before);
    expect((await entryRow(pool, entry.id)).status).toBe(status);
  });

  test('TEST-32 / AC-32: cancelling twice is 409 INVALID_TRANSITION the second time, with one CANCELLED event', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const cookie = await login(customerEmail(1));
    expect((await cancel(cookie, entry.id)).status).toBe(200);
    const before = await dbState(pool);
    expectError(await cancel(cookie, entry.id), 409, 'INVALID_TRANSITION');
    expect(await dbState(pool)).toBe(before);
    expect(await count(`SELECT count(*) FROM queue_events WHERE entry_id = $1 AND event_type = 'CANCELLED'`, [entry.id]))
      .toBe(1);
  });
});

describe('F-04 AC-33: effect on the queue', () => {
  test('TEST-33 / AC-33: rejoin gets a new number, the Waiting List hides the cancelled ticket, Call Next skips it and the CALLED guard still holds', async () => {
    const t1 = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const t2 = await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const t3 = await insertEntry(pool, { customer: 3, ticketNo: 3 });
    const two = await login(customerEmail(2));
    expect((await cancel(two, t2.id)).status).toBe(200);

    // BR-02: the cancelled ticket no longer counts as active, so customer 2 can join again; the number is new.
    const rejoin = await request(app).post(`/api/queues/${seedIds.queue}/entries`).set('Cookie', two).send({ partySize: 2 });
    expect(rejoin.status).toBe(201);
    expect(rejoin.body.data.ticketNo).toBe(4);
    expect(rejoin.body.data.id).not.toBe(t2.id);
    expect((await entryRow(pool, t2.id)).ticket_no).toBe(2);

    const host = await login('host1@dineq.test');
    const waiting = await request(app).get(`/api/queues/${seedIds.queue}/entries`).set('Cookie', host);
    expect(waiting.body.data.map(t => [t.ticketNo, t.status])).toEqual([[1, 'WAITING'], [3, 'WAITING'], [4, 'WAITING']]);

    const first = await callNext(host);
    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({ id: t1.id, ticketNo: 1, status: 'CALLED' });
    // The preserved guard (BR-05 / TEST-16): a second Call Next before Complete is rejected.
    expectError(await callNext(host), 409, 'UNRESOLVED_CALLED');
    const done = await complete(host, t1.id);
    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe('COMPLETED');
    expect((await entryRow(pool, t1.id)).status).toBe('COMPLETED');
    const second = await callNext(host);
    expect(second.status).toBe(200);
    expect(second.body.data).toMatchObject({ id: t3.id, ticketNo: 3, status: 'CALLED' });
    expect((await entryRow(pool, t2.id)).status).toBe('CANCELLED');
  });
});

describe('F-04 AC-34: concurrency', () => {
  test('TEST-34 / AC-34: cancel racing Call Next on ticket 1 gives exactly one consistent outcome (10 rounds)', async () => {
    for (let round = 0; round < 10; round++) {
      const db = await resetAndSeed();
      app = createTestApp({ pool: db });
      const t1 = await insertEntry(db, { customer: 1, ticketNo: 1 });
      const t2 = await insertEntry(db, { customer: 2, ticketNo: 2 });
      const one = await login(customerEmail(1));
      const host = await login('host1@dineq.test');
      const [cancelled, called] = await Promise.all([cancel(one, t1.id), callNext(host)]);

      const first = (await entryRow(db, t1.id)).status;
      const second = (await entryRow(db, t2.id)).status;
      if (cancelled.status === 200) {
        // Cancel won: ticket 1 is CANCELLED and Call Next moved on to ticket 2.
        expect(first).toBe('CANCELLED');
        expect(called.status).toBe(200);
        expect(called.body.data.ticketNo).toBe(2);
        expect(second).toBe('CALLED');
      } else {
        // Call Next won: ticket 1 is CALLED and the cancel is a state conflict.
        expectError(cancelled, 409, 'INVALID_TRANSITION');
        expect(called.status).toBe(200);
        expect(called.body.data.ticketNo).toBe(1);
        expect(first).toBe('CALLED');
        expect(second).toBe('WAITING');
      }
      expect(await count(`SELECT count(*) FROM queue_entries WHERE status = 'CALLED'`)).toBe(1);
    }
  });

  test('TEST-34 / AC-34: ten parallel cancels of one ticket give one 200, nine 409 and a single CANCELLED event', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const cookie = await login(customerEmail(1));
    const responses = await Promise.all(Array.from({ length: 10 }, () => cancel(cookie, entry.id)));
    expect(responses.filter(r => r.status === 200)).toHaveLength(1);
    const conflicts = responses.filter(r => r.status === 409);
    expect(conflicts).toHaveLength(9);
    for (const r of conflicts) expect(r.body.error.code).toBe('INVALID_TRANSITION');
    expect(await count(`SELECT count(*) FROM queue_events WHERE entry_id = $1 AND event_type = 'CANCELLED'`, [entry.id]))
      .toBe(1);
  });
});

describe('F-04 AC-35: constraints, upgrade and persistence', () => {
  const insertRaw = (status, { called = false, completed = false } = {}) => pool.query(
    `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status, called_at, completed_at)
     SELECT $1, id, 1, 2, $2, CASE WHEN $3::boolean THEN now() END, CASE WHEN $4::boolean THEN now() END
       FROM users WHERE email = $5`,
    [seedIds.queue, status, called, completed, customerEmail(1)]);

  test('TEST-35 / AC-35: the DB accepts CANCELLED without called_at/completed_at and rejects it with either (23514)', async () => {
    await insertRaw('CANCELLED');
    await pool.query('DELETE FROM queue_entries');
    await expect(insertRaw('CANCELLED', { called: true })).rejects.toMatchObject({ code: '23514' });
    await expect(insertRaw('CANCELLED', { completed: true })).rejects.toMatchObject({ code: '23514' });
  });

  test('TEST-35 / AC-35: NO_SHOW (schema only) needs called_at and no completed_at', async () => {
    await insertRaw('NO_SHOW', { called: true });
    await pool.query('DELETE FROM queue_entries');
    await expect(insertRaw('NO_SHOW')).rejects.toMatchObject({ code: '23514' });
    await expect(insertRaw('NO_SHOW', { called: true, completed: true })).rejects.toMatchObject({ code: '23514' });
  });

  test('TEST-35 / AC-35: CANCELLED events must go WAITING to CANCELLED and NO_SHOW events CALLED to NO_SHOW (23514 otherwise)', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const actor = await userIdByEmail(pool, customerEmail(1));
    const event = (type, from, to) => pool.query(
      `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status) VALUES ($1, $2, $3, $4, $5)`,
      [entry.id, actor, type, from, to]);
    await expect(event('CANCELLED', 'CALLED', 'CANCELLED')).rejects.toMatchObject({ code: '23514' });
    await expect(event('CANCELLED', 'WAITING', 'COMPLETED')).rejects.toMatchObject({ code: '23514' });
    await expect(event('NO_SHOW', 'WAITING', 'NO_SHOW')).rejects.toMatchObject({ code: '23514' });
    await event('CANCELLED', 'WAITING', 'CANCELLED');
    await event('NO_SHOW', 'CALLED', 'NO_SHOW');
  });

  test('TEST-35 / AC-35: re-running migrations is a no-op', async () => {
    const before = await dbState(pool);
    expect(await migrate(pool)).toEqual([]);
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-35 / AC-35: applying migration 003 on a database that already holds tickets leaves them unchanged', async () => {
    const files = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort();
    const third = files.find(name => name.startsWith('003_'));
    // RED: migration 003 does not exist yet.
    expect(third, 'database/migrations/003_*.sql (CANCELLED and NO_SHOW statuses) must exist').toBeDefined();
    expect(existsSync(new URL(third, migrationsDir))).toBe(true);

    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS f04_upgrade CASCADE');
      await client.query('CREATE SCHEMA f04_upgrade');
      await client.query('SET search_path TO f04_upgrade');
      for (const name of files.filter(file => file < third)) {
        await client.query(readFileSync(new URL(name, migrationsDir), 'utf8'));
      }
      const restaurant = (await client.query(
        `INSERT INTO restaurants (name, status) VALUES ('Legacy', 'OPEN') RETURNING id`)).rows[0].id;
      const queue = (await client.query(
        `INSERT INTO service_queues (restaurant_id, status, next_ticket_no) VALUES ($1, 'OPEN', 4) RETURNING id`,
        [restaurant])).rows[0].id;
      const user = async (n) => (await client.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, 'x', 'CUSTOMER') RETURNING id`,
        [`legacy${n}@example.test`])).rows[0].id;
      const rows = [['WAITING', 1], ['CALLED', 2], ['COMPLETED', 3]];
      for (const [status, no] of rows) {
        const id = await user(no);
        const entry = (await client.query(
          `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status, called_at, completed_at)
           VALUES ($1, $2, $3, 4, $4,
                   CASE WHEN $4 IN ('CALLED', 'COMPLETED') THEN now() END,
                   CASE WHEN $4 = 'COMPLETED' THEN now() END) RETURNING id`, [queue, id, no, status])).rows[0].id;
        await client.query(
          `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
           VALUES ($1, $2, 'JOINED', NULL, 'WAITING')`, [entry, id]);
      }
      const snapshot = async () => JSON.stringify({
        entries: (await client.query('SELECT * FROM queue_entries ORDER BY ticket_no')).rows,
        events: (await client.query('SELECT * FROM queue_events ORDER BY entry_id, event_type')).rows,
        queue: (await client.query('SELECT next_ticket_no, status FROM service_queues')).rows,
      });
      const before = await snapshot();
      await client.query(readFileSync(new URL(third, migrationsDir), 'utf8'));
      expect(await snapshot()).toBe(before);
    } finally {
      await client.query('RESET search_path');
      await client.query('DROP SCHEMA IF EXISTS f04_upgrade CASCADE');
      client.release();
    }
  });

  test('TEST-35 / AC-35: a cancelled ticket and its event survive a new app instance with a new DB pool', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const cookie = await login(customerEmail(1));
    const cancelled = await cancel(cookie, entry.id);
    expect(cancelled.status).toBe(200);

    const freshPool = createPool(process.env.TEST_DATABASE_URL, { max: 5 });
    try {
      const freshApp = createApp({ pool: freshPool });
      const byId = await request(freshApp).get(`/api/entries/${entry.id}`).set('Cookie', cookie);
      expect(byId.status).toBe(200);
      expect(byId.body.data).toEqual(cancelled.body.data);
      const events = (await freshPool.query(
        'SELECT event_type, from_status, to_status FROM queue_events WHERE entry_id = $1 ORDER BY event_type', [entry.id])).rows;
      expect(events).toEqual([
        { event_type: 'CANCELLED', from_status: 'WAITING', to_status: 'CANCELLED' },
        { event_type: 'JOINED', from_status: null, to_status: 'WAITING' },
      ]);
    } finally {
      await freshPool.end();
    }
  });
});
