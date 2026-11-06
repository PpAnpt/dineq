import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import {
  customerEmail, dbState, entryRow, eventsFor, insertEntry, insertQueue, userIdByEmail,
} from './helpers/queueFixtures.js';

let pool;
let app;
const absentId = '00000000-0000-4000-8000-000000000000';
const TICKET_KEYS = ['calledAt', 'completedAt', 'createdAt', 'id', 'partySize', 'queueId', 'status', 'ticketNo'];

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const list = (cookie, queueId = seedIds.queue) => {
  const r = request(app).get(`/api/queues/${queueId}/entries`);
  return cookie ? r.set('Cookie', cookie) : r;
};
const callNext = (cookie, queueId = seedIds.queue) => {
  const r = request(app).post(`/api/queues/${queueId}/call-next`);
  return cookie ? r.set('Cookie', cookie) : r;
};
const complete = (cookie, entryId) => {
  const r = request(app).post(`/api/entries/${entryId}/complete`);
  return cookie ? r.set('Cookie', cookie) : r;
};

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
  expect(response.body.error.message.length).toBeGreaterThan(0);
  expect(response.body.error.message).not.toContain('@dineq.test');
}

describe('F-03 Host waiting list', () => {
  test('TEST-14 / AC-14: assigned Host lists WAITING/CALLED in FIFO order without private data', async () => {
    // Inserted out of order on purpose; COMPLETED must not be listed.
    await insertEntry(pool, { customer: 3, ticketNo: 3, partySize: 4 });
    await insertEntry(pool, { customer: 1, ticketNo: 1, partySize: 2, status: 'CALLED' });
    await insertEntry(pool, { customer: 2, ticketNo: 2, partySize: 6 });
    await insertEntry(pool, { customer: 4, ticketNo: 4, partySize: 1, status: 'COMPLETED' });
    const before = await dbState(pool);

    const response = await list(await login('host1@dineq.test'));
    expect(response.status).toBe(200);
    const items = response.body.data;
    expect(items.map(i => i.ticketNo)).toEqual([1, 2, 3]);
    expect(items.map(i => i.partySize)).toEqual([2, 6, 4]);
    expect(items.map(i => i.status)).toEqual(['CALLED', 'WAITING', 'WAITING']);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(TICKET_KEYS);
      expect(item.queueId).toBe(seedIds.queue);
    }
    // No customer email / customer id anywhere in the payload.
    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('@dineq.test');
    expect(raw).not.toContain(await userIdByEmail(pool, customerEmail(1)));
    expect(raw.toLowerCase()).not.toContain('customer');
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-14 / AC-14: assigned Host gets { "data": [] } for an empty queue', async () => {
    const response = await list(await login('host1@dineq.test'));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  test('TEST-14 / AC-14: unassigned Host gets 403 FORBIDDEN and no ticket data', async () => {
    await insertEntry(pool, { customer: 1, ticketNo: 1 });
    const response = await list(await login('host2@dineq.test'));
    expectError(response, 403, 'FORBIDDEN');
    expect(JSON.stringify(response.body)).not.toContain('ticketNo');
  });
});

describe('F-03 Call Next', () => {
  test('TEST-15 / AC-15: Call Next calls the lowest ticket (FIFO); the next one stays WAITING', async () => {
    const t2 = await insertEntry(pool, { customer: 2, ticketNo: 2, partySize: 3 });
    const t1 = await insertEntry(pool, { customer: 1, ticketNo: 1, partySize: 5 });

    const response = await callNext(await login('host1@dineq.test'));
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual(TICKET_KEYS);
    expect(response.body.data).toMatchObject({ id: t1.id, ticketNo: 1, partySize: 5, status: 'CALLED' });
    expect(response.body.data.calledAt).toEqual(expect.any(String));
    expect(response.body.data.completedAt).toBeNull();

    const row1 = await entryRow(pool, t1.id);
    expect(row1.status).toBe('CALLED');
    expect(row1.called_at).not.toBeNull();
    expect(row1.completed_at).toBeNull();
    const row2 = await entryRow(pool, t2.id);
    expect(row2.status).toBe('WAITING');
    expect(row2.called_at).toBeNull();

    const hostId = await userIdByEmail(pool, 'host1@dineq.test');
    const events1 = (await eventsFor(pool, t1.id)).filter(e => e.event_type === 'CALLED');
    expect(events1).toHaveLength(1);
    expect(events1[0]).toMatchObject({ actor_id: hostId, from_status: 'WAITING', to_status: 'CALLED' });
    expect((await eventsFor(pool, t2.id)).map(e => e.event_type)).toEqual(['JOINED']);
  });

  test('TEST-16 / AC-16: Call Next while a CALLED ticket is unresolved -> 409 UNRESOLVED_CALLED', async () => {
    await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });
    const waiting = await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const before = await dbState(pool);

    const response = await callNext(await login('host1@dineq.test'));
    expectError(response, 409, 'UNRESOLVED_CALLED');
    expect((await entryRow(pool, waiting.id)).status).toBe('WAITING');
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-16 / AC-16: CALLED with no WAITING still returns 409 UNRESOLVED_CALLED (not 404)', async () => {
    await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });
    const before = await dbState(pool);
    expectError(await callNext(await login('host1@dineq.test')), 409, 'UNRESOLVED_CALLED');
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-16b / AC-16: two simultaneous Call Next requests -> exactly one 200 and one 409', async () => {
    for (const n of [1, 2, 3]) await insertEntry(pool, { customer: n, ticketNo: n });
    const cookie = await login('host1@dineq.test');

    const responses = await Promise.all([callNext(cookie), callNext(cookie)]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
    const loser = responses.find(r => r.status === 409);
    expectError(loser, 409, 'UNRESOLVED_CALLED');

    const called = (await pool.query("SELECT ticket_no FROM queue_entries WHERE status = 'CALLED'")).rows;
    expect(called).toEqual([{ ticket_no: 1 }]);
    const calledEvents = (await pool.query("SELECT 1 FROM queue_events WHERE event_type = 'CALLED'")).rowCount;
    expect(calledEvents).toBe(1);
  });
});

describe('F-03 Complete', () => {
  test('TEST-17 / AC-17: Complete a CALLED ticket -> COMPLETED in DB and visible to the owner', async () => {
    const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });

    const response = await complete(await login('host1@dineq.test'), entry.id);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: entry.id, ticketNo: 1, status: 'COMPLETED' });
    expect(response.body.data.completedAt).toEqual(expect.any(String));

    const row = await entryRow(pool, entry.id);
    expect(row.status).toBe('COMPLETED');
    expect(row.completed_at).not.toBeNull();
    const hostId = await userIdByEmail(pool, 'host1@dineq.test');
    const events = (await eventsFor(pool, entry.id)).filter(e => e.event_type === 'COMPLETED');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ actor_id: hostId, from_status: 'CALLED', to_status: 'COMPLETED' });

    const customerCookie = await login(customerEmail(1));
    const read = await request(app).get(`/api/entries/${entry.id}`).set('Cookie', customerCookie);
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ id: entry.id, status: 'COMPLETED' });
    expect(read.body.data.completedAt).toEqual(expect.any(String));
    const mine = await request(app).get('/api/me/entries').set('Cookie', customerCookie);
    expect(mine.body.data.map(t => t.status)).toEqual(['COMPLETED']);
  });

  test.each(['WAITING', 'COMPLETED'])(
    'TEST-18 / AC-18: Complete a %s ticket -> 409 INVALID_TRANSITION, row and events unchanged',
    async (status) => {
      const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, status });
      const before = await dbState(pool);
      const eventsBefore = await eventsFor(pool, entry.id);

      const response = await complete(await login('host1@dineq.test'), entry.id);
      expectError(response, 409, 'INVALID_TRANSITION');
      expect(await dbState(pool)).toBe(before);
      expect(await eventsFor(pool, entry.id)).toEqual(eventsBefore);
    });
});

describe('F-03 authorization', () => {
  test('TEST-19 / AC-19: unassigned Host cannot list / call-next / complete; DB unchanged', async () => {
    await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });
    await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const called = (await pool.query("SELECT id FROM queue_entries WHERE status = 'CALLED'")).rows[0];
    const before = await dbState(pool);
    const cookie = await login('host2@dineq.test');

    for (const response of [await list(cookie), await callNext(cookie), await complete(cookie, called.id)]) {
      expectError(response, 403, 'FORBIDDEN');
      expect(JSON.stringify(response.body)).not.toContain('ticketNo');
    }
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-19 / AC-19: assigned Host cannot act on another existing queue it is not assigned to', async () => {
    const otherQueue = await insertQueue(pool);
    const waiting = await insertEntry(pool, { queueId: otherQueue, customer: 1, ticketNo: 1 });
    const calledOther = await insertEntry(pool, { queueId: otherQueue, customer: 2, ticketNo: 2, status: 'CALLED' });
    const before = await dbState(pool);
    const cookie = await login('host1@dineq.test');

    expectError(await list(cookie, otherQueue), 403, 'FORBIDDEN');
    expectError(await callNext(cookie, otherQueue), 403, 'FORBIDDEN');
    expectError(await complete(cookie, calledOther.id), 403, 'FORBIDDEN');
    expectError(await complete(cookie, waiting.id), 403, 'FORBIDDEN');
    expect(await dbState(pool)).toBe(before);
  });

  test('TEST-20 / AC-20: Customer cannot list / call-next / complete; no state changes', async () => {
    const called = await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });
    await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const before = await dbState(pool);
    const cookie = await login(customerEmail(1));

    for (const response of [await list(cookie), await callNext(cookie), await complete(cookie, called.id)]) {
      expectError(response, 403, 'FORBIDDEN');
      expect(JSON.stringify(response.body)).not.toContain('ticketNo');
    }
    expect(await dbState(pool)).toBe(before);
  });
});

describe('F-03 path, resource and empty-queue handling (AC-24)', () => {
  const endpoints = [
    ['list', (cookie, id) => list(cookie, id)],
    ['call-next', (cookie, id) => callNext(cookie, id)],
    ['complete', (cookie, id) => complete(cookie, id)],
  ];

  test.each([
    { label: 'no entries at all', setup: async () => {} },
    { label: 'only a COMPLETED entry', setup: async () => { await insertEntry(pool, { ticketNo: 1, status: 'COMPLETED' }); } },
  ])('TEST-24a / AC-24: Call Next on an assigned queue with neither WAITING nor CALLED ($label) -> 404 NO_WAITING_ENTRY',
    async ({ setup }) => {
      await setup();
      const before = await dbState(pool);
      expectError(await callNext(await login('host1@dineq.test')), 404, 'NO_WAITING_ENTRY');
      expect(await dbState(pool)).toBe(before);
    });

  test.each(['host1@dineq.test', 'host2@dineq.test'])(
    'TEST-24b / AC-24: %s with a valid but absent UUID gets 404 NOT_FOUND on all three endpoints (not 403)',
    async (email) => {
      expect((await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [absentId])).rowCount).toBe(0);
      expect((await pool.query('SELECT 1 FROM queue_entries WHERE id = $1', [absentId])).rowCount).toBe(0);
      await insertEntry(pool, { customer: 1, ticketNo: 1 });
      const before = await dbState(pool);
      const cookie = await login(email);
      for (const [, call] of endpoints) expectError(await call(cookie, absentId), 404, 'NOT_FOUND');
      expect(await dbState(pool)).toBe(before);
    });

  test.each(['host1@dineq.test', 'host2@dineq.test'])(
    'TEST-24c / AC-24: %s with not-a-uuid gets 400 VALIDATION_ERROR on all three endpoints',
    async (email) => {
      await insertEntry(pool, { customer: 1, ticketNo: 1 });
      const before = await dbState(pool);
      const cookie = await login(email);
      for (const [, call] of endpoints) expectError(await call(cookie, 'not-a-uuid'), 400, 'VALIDATION_ERROR');
      expect(await dbState(pool)).toBe(before);
    });

  test.each([absentId, 'not-a-uuid'])(
    'TEST-24d / AC-24: anonymous -> 401 UNAUTHENTICATED and Customer -> 403 FORBIDDEN before UUID/resource checks (%s)',
    async (id) => {
      await insertEntry(pool, { customer: 1, ticketNo: 1 });
      const before = await dbState(pool);
      const customerCookie = await login(customerEmail(2));
      for (const [, call] of endpoints) {
        expectError(await call(null, id), 401, 'UNAUTHENTICATED');
        expectError(await call(customerCookie, id), 403, 'FORBIDDEN');
      }
      expect(await dbState(pool)).toBe(before);
    });
});
