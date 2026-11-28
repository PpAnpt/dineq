import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { customerEmail, dbState, insertEntry } from './helpers/queueFixtures.js';

// F-07a Customer history filter: docs/sprints/sprint-3/F-07-history.md section 1 (AC-52..AC-56).
// GET /api/me/entries accepts optional status, from, to; without them nothing changes.

let pool;
let app;

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});
afterAll(closeTestPool);

const login = (email) => loginAs(email, { app });
const list = (cookie, query = '') => {
  const r = request(app).get(`/api/me/entries${query}`);
  return cookie ? r.set('Cookie', cookie) : r;
};
const ids = (response) => response.body.data.map(t => t.id);

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
}

// Tickets are placed at fixed, whole-millisecond times so the boundary tests are exact (a JS Date has
// millisecond precision, PostgreSQL has microseconds).
// A CANCELLED fixture is inserted as COMPLETED first (so it never counts as an active ticket) and then
// rewritten in one UPDATE to its final status and timestamps; its event history is irrelevant here.
async function ticket(customer, ticketNo, status, createdAt) {
  const entry = await insertEntry(pool, { customer, ticketNo, status: status === 'CANCELLED' ? 'COMPLETED' : status });
  // The timestamp rules (status_timestamps_check, timestamp_order_check) need called/completed after created.
  const calledAt = status === 'CALLED' || status === 'COMPLETED' ? '2026-12-31T00:00:00Z' : null;
  const completedAt = status === 'COMPLETED' ? '2026-12-31T00:00:01Z' : null;
  await pool.query(
    `UPDATE queue_entries SET status = $5, created_at = $2, called_at = $3, completed_at = $4 WHERE id = $1`,
    [entry.id, createdAt, calledAt, completedAt, status]);
  return entry.id;
}

describe('F-07a AC-52: status filter', () => {
  test('TEST-52 / AC-52: status=CANCELLED and status=COMPLETED return only that status of the caller; no parameter returns all', async () => {
    // Each ticket is in its own queue-free slot: one ticket per status for customer 1 (different ticket numbers).
    const waiting = await ticket(1, 1, 'WAITING', '2026-11-01T10:00:00.000Z');
    const cancelled = await ticket(1, 2, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const completed = await ticket(1, 3, 'COMPLETED', '2026-11-03T10:00:00.000Z');
    const cookie = await login(customerEmail(1));
    expect(ids(await list(cookie, '?status=CANCELLED'))).toEqual([cancelled]);
    expect(ids(await list(cookie, '?status=COMPLETED'))).toEqual([completed]);
    expect(ids(await list(cookie, '?status=WAITING'))).toEqual([waiting]);
    expect(ids(await list(cookie, '?status=NO_SHOW'))).toEqual([]);
    // Unfiltered behaviour is unchanged: every ticket, newest first.
    expect(ids(await list(cookie))).toEqual([completed, cancelled, waiting]);
    expect(ids(await list(cookie, '?foo=1'))).toEqual([completed, cancelled, waiting]);
  });
});

describe('F-07a AC-53: created_at range is from <= x < to', () => {
  test('TEST-53 / AC-53: from is inclusive, to is exclusive, and both can be combined', async () => {
    const t1 = await ticket(1, 1, 'WAITING', '2026-11-01T10:00:00.000Z');
    const t2 = await ticket(1, 2, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const t3 = await ticket(1, 3, 'COMPLETED', '2026-11-03T10:00:00.000Z');
    const cookie = await login(customerEmail(1));
    expect(ids(await list(cookie, '?from=2026-11-02T10:00:00.000Z'))).toEqual([t3, t2]);
    expect(ids(await list(cookie, '?to=2026-11-03T10:00:00.000Z'))).toEqual([t2, t1]);
    expect(ids(await list(cookie, '?from=2026-11-02T10:00:00.000Z&to=2026-11-03T10:00:00.000Z'))).toEqual([t2]);
    // The same instant written with an offset behaves the same (17:00+07:00 = 10:00Z).
    expect(ids(await list(cookie, `?from=${encodeURIComponent('2026-11-02T17:00:00+07:00')}&to=${encodeURIComponent('2026-11-03T17:00:00+07:00')}`)))
      .toEqual([t2]);
    // from equal to to is an empty half-open range, not an error.
    expect(ids(await list(cookie, '?from=2026-11-02T10:00:00.000Z&to=2026-11-02T10:00:00.000Z'))).toEqual([]);
  });
});

describe('F-07a AC-54: invalid filters', () => {
  test.each([
    ['unknown status', '?status=DONE'],
    ['empty status', '?status='],
    ['repeated status', '?status=WAITING&status=CALLED'],
    ['lower-case status', '?status=waiting'],
    ['from not a date', '?from=yesterday'],
    ['from without timezone', '?from=2026-11-28T10:00:00'],
    ['date only', '?from=2026-11-28'],
    ['to not a date', '?to=tomorrow'],
    ['impossible calendar date', '?from=2026-13-45T10:00:00Z'],
    ['repeated from', '?from=2026-11-01T00:00:00Z&from=2026-11-02T00:00:00Z'],
    ['from after to', '?from=2026-11-03T00:00:00Z&to=2026-11-02T00:00:00Z'],
  ])('TEST-54 / AC-54: %s is 400 VALIDATION_ERROR with no data and no DB change', async (_label, query) => {
    await ticket(1, 1, 'WAITING', '2026-11-01T10:00:00.000Z');
    const cookie = await login(customerEmail(1));
    const before = await dbState(pool);
    const response = await list(cookie, query);
    expectError(response, 400, 'VALIDATION_ERROR');
    expect(JSON.stringify(response.body)).not.toMatch(/ticketNo|partySize/);
    expect(await dbState(pool)).toBe(before);
  });
});

describe('F-07a AC-55: owner only', () => {
  test('TEST-55 / AC-55: a Customer never sees another Customer ticket under any filter; Host 403 before the filters; anonymous 401', async () => {
    const mine = await ticket(1, 1, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const theirs = await ticket(2, 2, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const cookie = await login(customerEmail(1));
    for (const query of ['', '?status=CANCELLED', '?from=2026-11-01T00:00:00Z', '?to=2026-12-01T00:00:00Z',
      '?status=CANCELLED&from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z']) {
      const response = await list(cookie, query);
      expect(response.status).toBe(200);
      expect(ids(response)).toEqual([mine]);
      expect(JSON.stringify(response.body)).not.toContain(theirs);
    }
    for (const email of ['host1@dineq.test', 'host2@dineq.test']) {
      const host = await login(email);
      expectError(await list(host, '?status=CANCELLED'), 403, 'FORBIDDEN');
      // The role check comes before filter validation.
      expectError(await list(host, '?status=NOPE'), 403, 'FORBIDDEN');
    }
    expectError(await list(null, '?status=CANCELLED'), 401, 'UNAUTHENTICATED');
    expectError(await list(null, '?status=NOPE'), 401, 'UNAUTHENTICATED');
  });
});

describe('F-07a AC-56: combination, order and empty result', () => {
  test('TEST-56 / AC-56: status and range combine with AND; order is created_at DESC, ticket_no DESC, id; empty is data []', async () => {
    const a = await ticket(1, 1, 'CANCELLED', '2026-11-01T10:00:00.000Z');
    const b = await ticket(1, 2, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const c = await ticket(1, 3, 'COMPLETED', '2026-11-02T10:00:00.000Z');
    const d = await ticket(1, 4, 'WAITING', '2026-11-02T10:00:00.000Z');
    const cookie = await login(customerEmail(1));
    // Same created_at: higher ticket number first; across times: newest first.
    expect(ids(await list(cookie))).toEqual([d, c, b, a]);
    expect(ids(await list(cookie, '?status=CANCELLED'))).toEqual([b, a]);
    expect(ids(await list(cookie, '?status=CANCELLED&from=2026-11-02T00:00:00Z'))).toEqual([b]);
    expect(ids(await list(cookie, '?status=COMPLETED&to=2026-11-02T00:00:00Z'))).toEqual([]);
    const empty = await list(cookie, '?status=NO_SHOW&from=2030-01-01T00:00:00Z');
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({ data: [] });
    // Ticket JSON keeps its exact shape.
    const first = (await list(cookie)).body.data[0];
    expect(Object.keys(first).sort()).toEqual(['calledAt', 'completedAt', 'createdAt', 'id', 'partySize', 'queueId', 'status', 'ticketNo']);
  });

  test('TEST-56 / AC-56: the filters work across queues of the same Customer', async () => {
    const first = await ticket(1, 1, 'CANCELLED', '2026-11-02T10:00:00.000Z');
    const second = await insertEntry(pool, { queueId: seedIds.queue, customer: 1, ticketNo: 2 });
    const cookie = await login(customerEmail(1));
    expect(ids(await list(cookie, '?status=CANCELLED'))).toEqual([first]);
    expect(ids(await list(cookie, '?status=WAITING'))).toEqual([second.id]);
  });
});
