import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db/pool.js';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';

let pool;
let app;
const unknownId = '00000000-0000-4000-8000-000000000000';
const customerEmail = (n) => `customer${String(n).padStart(2, '0')}@dineq.test`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const joinAs = (cookie, partySize, queueId = seedIds.queue) => request(app)
  .post(`/api/queues/${queueId}/entries`).set('Cookie', cookie).send({ partySize });

async function userId(email) {
  return (await pool.query('SELECT id FROM users WHERE email = $1', [email])).rows[0].id;
}

// Full before/after picture of everything a rejected request must not touch.
async function state() {
  const q = async (sql) => (await pool.query(sql)).rows;
  return JSON.stringify({
    queues: await q('SELECT id, status, next_ticket_no FROM service_queues ORDER BY id'),
    entries: await q('SELECT * FROM queue_entries ORDER BY id'),
    events: await q('SELECT * FROM queue_events ORDER BY id'),
  });
}
const nextTicketNo = async () => (await pool.query(
  'SELECT next_ticket_no FROM service_queues WHERE id = $1', [seedIds.queue])).rows[0].next_ticket_no;
const count = async (table) => Number((await pool.query(`SELECT count(*) FROM ${table}`)).rows[0].count);

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
  expect(response.body.error.message.length).toBeGreaterThan(0);
  expect(response.body.error.message).not.toContain('@dineq.test');
}

describe('F-02 queue list', () => {
  const item = (isAssigned, status = 'OPEN') => ({
    id: seedIds.queue,
    restaurant: { id: seedIds.restaurant, name: 'DineQ Demo Restaurant' },
    status,
    isAssigned,
  });

  test.each([
    { email: customerEmail(1), isAssigned: false, who: 'Customer' },
    { email: 'host1@dineq.test', isAssigned: true, who: 'Assigned Host' },
    { email: 'host2@dineq.test', isAssigned: false, who: 'Unassigned Host' },
  ])('TEST-07 / AC-07: $who gets the C.6.1 shape with isAssigned=$isAssigned', async ({ email, isAssigned }) => {
    const cookie = await login(email);
    const response = await request(app).get('/api/queues').set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [item(isAssigned)] });
    expect(typeof response.body.data[0].isAssigned).toBe('boolean');
  });

  test('TEST-07 / AC-07: a CLOSED queue is listed with status CLOSED', async () => {
    await pool.query("UPDATE service_queues SET status = 'CLOSED' WHERE id = $1", [seedIds.queue]);
    const response = await request(app).get('/api/queues').set('Cookie', await login(customerEmail(1)));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [item(false, 'CLOSED')] });
  });

  test('TEST-07 / AC-07: a fixture with no queues returns { "data": [] }', async () => {
    await pool.query('DELETE FROM queue_operator_assignments');
    await pool.query('DELETE FROM service_queues');
    for (const email of [customerEmail(1), 'host1@dineq.test']) {
      const response = await request(app).get('/api/queues').set('Cookie', await login(email));
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    }
  });

  test('TEST-07 / AC-07: queue list requires a Session', async () => {
    expectError(await request(app).get('/api/queues'), 401, 'UNAUTHENTICATED');
  });
});

describe('F-02 join queue', () => {
  test('TEST-08 / AC-08: Customer joins an OPEN queue with partySize=4 and can read the ticket back', async () => {
    const cookie = await login(customerEmail(1));
    const customerId = await userId(customerEmail(1));
    const other = await userId(customerEmail(2));
    const response = await request(app).post(`/api/queues/${seedIds.queue}/entries`).set('Cookie', cookie)
      // Identity and numbering come from the server; these client claims must be ignored.
      .send({ partySize: 4, customerId: other, ticketNo: 99, status: 'CALLED' });
    expect(response.status).toBe(201);
    const ticket = {
      id: expect.stringMatching(UUID), queueId: seedIds.queue, ticketNo: 1, partySize: 4,
      status: 'WAITING', createdAt: expect.any(String), calledAt: null, completedAt: null,
    };
    expect(response.body).toEqual({ data: ticket });

    const entries = (await pool.query('SELECT * FROM queue_entries')).rows;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: response.body.data.id, queue_id: seedIds.queue,
      customer_id: customerId, ticket_no: 1, party_size: 4, status: 'WAITING', called_at: null, completed_at: null });
    const events = (await pool.query('SELECT * FROM queue_events')).rows;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ entry_id: entries[0].id, actor_id: customerId,
      event_type: 'JOINED', from_status: null, to_status: 'WAITING' });
    expect(await nextTicketNo()).toBe(2);

    const byId = await request(app).get(`/api/entries/${response.body.data.id}`).set('Cookie', cookie);
    expect(byId.status).toBe(200);
    expect(byId.body).toEqual({ data: ticket });
    const mine = await request(app).get('/api/me/entries').set('Cookie', cookie);
    expect(mine.status).toBe(200);
    expect(mine.body).toEqual({ data: [ticket] });
  });

  test('TEST-08 / AC-08: a Customer without tickets gets { "data": [] } from /api/me/entries', async () => {
    const response = await request(app).get('/api/me/entries').set('Cookie', await login(customerEmail(1)));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  test.each(['WAITING', 'CALLED'])('TEST-09 / AC-09: joining again while %s is rejected with 409 DUPLICATE_ACTIVE', async (status) => {
    const cookie = await login(customerEmail(1));
    expect((await joinAs(cookie, 2)).status).toBe(201);
    if (status === 'CALLED') {
      await pool.query("UPDATE queue_entries SET status = 'CALLED', called_at = now()");
    }
    const before = await state();
    const second = await joinAs(cookie, 3);
    expectError(second, 409, 'DUPLICATE_ACTIVE');
    expect(await state()).toBe(before);
    const active = await pool.query(`SELECT count(*)::int AS n FROM queue_entries
      WHERE customer_id = $1 AND status IN ('WAITING', 'CALLED')`, [await userId(customerEmail(1))]);
    expect(active.rows[0].n).toBe(1);
    expect(await count('queue_events')).toBe(1);
    expect(await nextTicketNo()).toBe(2);
  });

  test('TEST-09 / AC-09: ten simultaneous joins by the same Customer yield one 201 and nine 409 DUPLICATE_ACTIVE', async () => {
    const cookie = await login(customerEmail(1));
    const responses = await Promise.all(Array.from({ length: 10 }, () => joinAs(cookie, 2)));
    expect(responses.filter(r => r.status === 201)).toHaveLength(1);
    for (const r of responses.filter(r => r.status !== 201)) expectError(r, 409, 'DUPLICATE_ACTIVE');
    expect(await count('queue_entries')).toBe(1);
    expect(await count('queue_events')).toBe(1);
    expect(await nextTicketNo()).toBe(2);
  });

  test('TEST-10 / AC-10: 30 customers join at once with distinct ticket numbers 1..30', async () => {
    const cookies = await Promise.all(Array.from({ length: 30 }, (_, i) => login(customerEmail(i + 1))));
    const responses = await Promise.all(cookies.map(cookie => joinAs(cookie, 2)));
    expect(responses.map(r => r.status)).toEqual(Array(30).fill(201));
    const numbers = responses.map(r => r.body.data.ticketNo).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    const rows = (await pool.query('SELECT ticket_no FROM queue_entries ORDER BY ticket_no')).rows;
    expect(rows.map(r => r.ticket_no)).toEqual(numbers);
    expect(await count('queue_events')).toBe(30);
    expect(await nextTicketNo()).toBe(31);
  });

  test('TEST-11 / AC-11: Customer A cannot read Customer B ticket (403, no B data in response)', async () => {
    const a = await login(customerEmail(1));
    const b = await login(customerEmail(2));
    const created = await joinAs(b, 5);
    const entryId = created.body.data.id;
    const response = await request(app).get(`/api/entries/${entryId}`).set('Cookie', a);
    expectError(response, 403, 'FORBIDDEN');
    expect(response.body.data).toBeUndefined();
    const text = JSON.stringify(response.body);
    expect(text).not.toContain(entryId);
    expect(text).not.toContain(customerEmail(2));
    expect(text).not.toContain(await userId(customerEmail(2)));
    expect(text).not.toContain('partySize');
    // A's own list never contains B's ticket.
    const mine = await request(app).get('/api/me/entries').set('Cookie', a);
    expect(mine.body).toEqual({ data: [] });
  });

  test('TEST-11 / AC-11: Assigned Host may read the ticket, Unassigned Host gets 403', async () => {
    const created = await joinAs(await login(customerEmail(1)), 3);
    const entryId = created.body.data.id;
    const assigned = await request(app).get(`/api/entries/${entryId}`).set('Cookie', await login('host1@dineq.test'));
    expect(assigned.status).toBe(200);
    expect(assigned.body).toEqual({ data: created.body.data });
    const unassigned = await request(app).get(`/api/entries/${entryId}`).set('Cookie', await login('host2@dineq.test'));
    expectError(unassigned, 403, 'FORBIDDEN');
    expect(JSON.stringify(unassigned.body)).not.toContain(entryId);
  });

  test('TEST-12 / AC-12: joining a CLOSED queue is 409 QUEUE_CLOSED with no insert and no ticket number used', async () => {
    await pool.query("UPDATE service_queues SET status = 'CLOSED' WHERE id = $1", [seedIds.queue]);
    const before = await state();
    expectError(await joinAs(await login(customerEmail(1)), 4), 409, 'QUEUE_CLOSED');
    expect(await state()).toBe(before);
    expect(await count('queue_entries')).toBe(0);
    expect(await nextTicketNo()).toBe(1);
  });

  test.each([
    ['0', { partySize: 0 }], ['9', { partySize: 9 }], ['1.5', { partySize: 1.5 }],
    ['"abc"', { partySize: 'abc' }], ['null', { partySize: null }], ['missing', {}],
  ])('TEST-12 / AC-12: partySize %s is 400 INVALID_PARTY_SIZE and changes nothing', async (_label, body) => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    const response = await request(app).post(`/api/queues/${seedIds.queue}/entries`)
      .set('Cookie', cookie).send(body);
    expectError(response, 400, 'INVALID_PARTY_SIZE');
    expect(await state()).toBe(before);
    expect(await count('queue_entries')).toBe(0);
    expect(await count('queue_events')).toBe(0);
    expect(await nextTicketNo()).toBe(1);
  });

  test.each([1, 8])('TEST-12 / AC-12: boundary partySize %i is accepted', async (partySize) => {
    const response = await joinAs(await login(customerEmail(1)), partySize);
    expect(response.status).toBe(201);
    expect(response.body.data.partySize).toBe(partySize);
  });

  test('TEST-13 / AC-13: Host cannot join (403 FORBIDDEN), no ticket and no counter change', async () => {
    const host = await login('host1@dineq.test');
    const before = await state();
    expectError(await joinAs(host, 4), 403, 'FORBIDDEN');
    // Role is checked before the UUID/resource lookup (SDS C.6.3).
    expectError(await joinAs(host, 4, 'not-a-uuid'), 403, 'FORBIDDEN');
    expectError(await joinAs(host, 4, unknownId), 403, 'FORBIDDEN');
    expect(await state()).toBe(before);
    expect(await count('queue_entries')).toBe(0);
    expect(await nextTicketNo()).toBe(1);
  });

  test('TEST-13 / AC-13: Host has no Customer ticket list (/api/me/entries is Customer-only)', async () => {
    expectError(await request(app).get('/api/me/entries').set('Cookie', await login('host1@dineq.test')),
      403, 'FORBIDDEN');
  });
});

describe('F-02 restart persistence', () => {
  test('TEST-21 / AC-21: ticket and JOINED event survive a new app instance with a new DB pool', async () => {
    const cookie = await login(customerEmail(1));
    const created = await joinAs(cookie, 6);
    expect(created.status).toBe(201);
    const ticket = created.body.data;

    const freshPool = createPool(process.env.TEST_DATABASE_URL, { max: 5 });
    try {
      const freshApp = createApp({ pool: freshPool });
      // The Session lives in PostgreSQL, so the old Cookie still works after "restart".
      const byId = await request(freshApp).get(`/api/entries/${ticket.id}`).set('Cookie', cookie);
      expect(byId.status).toBe(200);
      expect(byId.body).toEqual({ data: ticket });
      expect(byId.body.data).toMatchObject({ ticketNo: 1, partySize: 6, status: 'WAITING' });
      const mine = await request(freshApp).get('/api/me/entries').set('Cookie', cookie);
      expect(mine.body).toEqual({ data: [ticket] });
      const events = (await freshPool.query(
        'SELECT event_type, from_status, to_status FROM queue_events WHERE entry_id = $1', [ticket.id])).rows;
      expect(events).toEqual([{ event_type: 'JOINED', from_status: null, to_status: 'WAITING' }]);
    } finally {
      await freshPool.end();
    }
  });
});

describe('F-02 path validation and authentication precedence', () => {
  const endpoints = (id) => [
    ['GET entry', (r) => r.get(`/api/entries/${id}`)],
    ['POST join', (r) => r.post(`/api/queues/${id}/entries`).send({ partySize: 4 })],
  ];

  test.each(endpoints('not-a-uuid'))('TEST-23 / AC-23: %s with malformed UUID is 400 VALIDATION_ERROR', async (_name, call) => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await call(request(app)).set('Cookie', cookie), 400, 'VALIDATION_ERROR');
    expect(await state()).toBe(before);
  });

  test.each(endpoints(unknownId))('TEST-23 / AC-23: %s with an absent UUID is 404 NOT_FOUND', async (_name, call) => {
    expect((await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [unknownId])).rowCount).toBe(0);
    expect((await pool.query('SELECT 1 FROM queue_entries WHERE id = $1', [unknownId])).rowCount).toBe(0);
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await call(request(app)).set('Cookie', cookie), 404, 'NOT_FOUND');
    expect(await state()).toBe(before);
    expect(await nextTicketNo()).toBe(1);
  });

  test.each([
    ...endpoints('not-a-uuid').map(([name, call]) => [`${name} (malformed)`, call]),
    ...endpoints(unknownId).map(([name, call]) => [`${name} (absent)`, call]),
  ])('TEST-23 / AC-23: %s without a Session is 401 UNAUTHENTICATED before UUID checks', async (_name, call) => {
    const before = await state();
    const response = await call(request(app));
    expectError(response, 401, 'UNAUTHENTICATED');
    expect(response.body.error.message).not.toMatch(/uuid|not found/i);
    expect(await state()).toBe(before);
  });

  // Review of PR #13: the body is parsed only after Session/Role/UUID/Resource (SDS C.6.3 steps 3-5).
  const rawJoin = (cookie, queueId, raw) => {
    const call = request(app).post(`/api/queues/${queueId}/entries`)
      .set('Content-Type', 'application/json');
    return (cookie ? call.set('Cookie', cookie) : call).send(raw);
  };

  test('TEST-23 / AC-23: malformed JSON to an absent queue is 404 NOT_FOUND (resource before body parsing)', async () => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await rawJoin(cookie, unknownId, '{'), 404, 'NOT_FOUND');
    expect(await state()).toBe(before);
  });

  test('TEST-23 / AC-23: malformed JSON to a malformed UUID is 400 VALIDATION_ERROR', async () => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await rawJoin(cookie, 'not-a-uuid', '{'), 400, 'VALIDATION_ERROR');
    expect(await state()).toBe(before);
  });

  test('TEST-23 / AC-23: malformed JSON to an existing queue is 400 VALIDATION_ERROR and changes nothing', async () => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await rawJoin(cookie, seedIds.queue, '{'), 400, 'VALIDATION_ERROR');
    expect(await state()).toBe(before);
    expect(await nextTicketNo()).toBe(1);
  });

  test('TEST-23 / AC-23: Session and Role are still checked before malformed JSON (401 anonymous, 403 Host)', async () => {
    expectError(await rawJoin(null, seedIds.queue, '{'), 401, 'UNAUTHENTICATED');
    expectError(await rawJoin(await login('host1@dineq.test'), seedIds.queue, '{'), 403, 'FORBIDDEN');
  });

  test('TEST-23 / AC-23: resource lookup precedes body validation (absent queue + bad partySize is 404; malformed id is 400)', async () => {
    const cookie = await login(customerEmail(1));
    const before = await state();
    expectError(await joinAs(cookie, 0, unknownId), 404, 'NOT_FOUND');
    expectError(await joinAs(cookie, 0, 'not-a-uuid'), 400, 'VALIDATION_ERROR');
    expect(await state()).toBe(before);
  });
});
