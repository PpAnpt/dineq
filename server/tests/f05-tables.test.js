import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import request from 'supertest';
import { seed, seedIds } from '../../database/seed/seedData.js';
import { migrate } from '../../database/migrate.js';
import { createPool } from '../src/db/pool.js';
import { createSeatingService } from '../src/services/seating.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { insertEntry, insertQueue } from './helpers/queueFixtures.js';

let pool;
let app;
const T1 = '55555555-5555-4555-8555-555555555551';
const T2 = '55555555-5555-4555-8555-555555555552';
const absent = '00000000-0000-4000-8000-000000000000';
const host = 'host1@dineq.test';
beforeEach(async () => { pool = await resetAndSeed(); app = createTestApp({ pool }); });
afterAll(closeTestPool);
const list = queue => `/api/queues/${queue}/tables`;
const release = table => `/api/tables/${table}/release`;
const table = async id => (await pool.query('SELECT * FROM dining_tables WHERE id = $1', [id])).rows[0];
async function requireSchema() {
  // An explicit missing-feature assertion, never a fixture INSERT/import error in RED.
  expect((await pool.query("SELECT to_regclass('dining_tables') AS name")).rows[0].name,
    'migration 004 must create dining_tables').toBe('dining_tables');
}
async function snapshot() {
  const state = {};
  for (const name of ['service_queues', 'queue_entries', 'queue_events', 'dining_tables']) {
    const exists = (await pool.query('SELECT to_regclass($1) AS name', [name])).rows[0].name;
    state[name] = exists ? (await pool.query(`SELECT to_jsonb(t) AS value FROM ${name} t ORDER BY to_jsonb(t)::text`)).rows : null;
  }
  return state;
}
async function occupy() {
  await requireSchema();
  const entry = await insertEntry(pool, { ticketNo: 1, status: 'COMPLETED', partySize: 4 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE queue_entries SET table_id = $1 WHERE id = $2', [T1, entry.id]);
    await client.query("UPDATE dining_tables SET status = 'OCCUPIED', occupied_entry_id = $1 WHERE id = $2", [entry.id, T1]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
  return entry;
}
describe('F-05 table slice (No-show/Seat pending F-04 migration 003)', () => {
  test.each([
    ['inactive Host', 'listTables'], ['inactive Host', 'releaseTable'],
    ['role changed to Customer', 'listTables'], ['role changed to Customer', 'releaseTable'],
  ])('TEST-38 / AC-38: service rejects %s at %s despite a retained assignment', async (change, operation) => {
    if (operation === 'releaseTable') await occupy();
    const user = (await pool.query('SELECT id FROM users WHERE email=$1', [host])).rows[0];
    if (change === 'inactive Host') await pool.query('UPDATE users SET is_active=false WHERE id=$1', [user.id]);
    else await pool.query("UPDATE users SET role='CUSTOMER' WHERE id=$1", [user.id]);
    const before = await snapshot();
    // Real DB service check: simulates account changes after the authenticated context was loaded.
    // An ordinary HTTP request is already rejected by Session middleware; do not claim otherwise.
    await expect(createSeatingService({ pool })[operation](user, operation === 'listTables' ? seedIds.queue : T1))
      .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN', message: 'This operation is not permitted' });
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-38 / AC-38: inactive Host old cookie gets 401 before table UUID checks', async () => {
    const cookie = await loginAs(host, { app });
    await pool.query('UPDATE users SET is_active=false WHERE email=$1', [host]);
    const before = await snapshot();
    for (const response of [await request(app).get(list('not-a-uuid')).set('Cookie', cookie),
      await request(app).post(release('not-a-uuid')).set('Cookie', cookie)]) {
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    }
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-39 / AC-39: assigned Host gets exact seeded Table shapes ordered by label then id', async () => {
    const response = await request(app).get(list(seedIds.queue)).set('Cookie', await loginAs(host, { app }));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [
      { id: T1, queueId: seedIds.queue, label: 'T1', capacity: 4, status: 'AVAILABLE', occupiedEntryId: null, occupiedTicketNo: null },
      { id: T2, queueId: seedIds.queue, label: 'T2', capacity: 10, status: 'AVAILABLE', occupiedEntryId: null, occupiedTicketNo: null },
    ] });
  });
  test('TEST-39 / AC-39: assigned empty queue returns [] without leaking another queue tables', async () => {
    const queue = await insertQueue(pool, { assignedHostEmail: host });
    const response = await request(app).get(list(queue)).set('Cookie', await loginAs(host, { app }));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });
  test('TEST-39 / AC-39: occupied table exposes only current entry UUID/number, no personal fields', async () => {
    const entry = await occupy();
    const response = await request(app).get(list(seedIds.queue)).set('Cookie', await loginAs(host, { app }));
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toEqual({ id: T1, queueId: seedIds.queue, label: 'T1', capacity: 4,
      status: 'OCCUPIED', occupiedEntryId: entry.id, occupiedTicketNo: 1 });
    expect(JSON.stringify(response.body)).not.toContain(entry.customer_id);
    expect(JSON.stringify(response.body)).not.toContain('@dineq.test');
  });
  for (const [method, pathFor, goodId] of [['get', list, seedIds.queue], ['post', release, T1]]) {
    test.each([
      ['anonymous', null, 'not-a-uuid', 401, 'UNAUTHENTICATED'],
      ['Customer', 'customer01@dineq.test', 'not-a-uuid', 403, 'FORBIDDEN'],
      ['malformed UUID', host, 'not-a-uuid', 400, 'VALIDATION_ERROR'],
      ['missing resource', host, absent, 404, 'NOT_FOUND'],
      ['unassigned Host', 'host2@dineq.test', goodId, 403, 'FORBIDDEN'],
    ])(`TEST-38 / AC-38: ${method} tables %s check order and no DB change`, async (_label, account, id, status, code) => {
      const cookie = account ? await loginAs(account, { app }) : null;
      const before = await snapshot();
      const call = request(app)[method](pathFor(id));
      if (cookie) call.set('Cookie', cookie);
      const response = await call;
      expect(response.status).toBe(status);
      expect(response.body.error.code).toBe(code);
      expect(response.body.data).toBeUndefined();
      expect(await snapshot()).toEqual(before);
    });
  }
  test('TEST-38 / AC-38: foreign Origin release is 403 before Session or UUID checks', async () => {
    const before = await snapshot();
    const response = await request(app).post(release('not-a-uuid')).set('Origin', 'https://foreign.example.test');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-38 / AC-38: Host assigned to A cannot list/release a table in B', async () => {
    await requireSchema();
    const queue = await insertQueue(pool);
    const other = (await pool.query("INSERT INTO dining_tables(queue_id,label,capacity) VALUES ($1,'Other',4) RETURNING id", [queue])).rows[0].id;
    const cookie = await loginAs(host, { app });
    const before = await snapshot();
    for (const response of [await request(app).get(list(queue)).set('Cookie', cookie),
      await request(app).post(release(other)).set('Cookie', cookie)]) {
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.data).toBeUndefined();
    }
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-43 / AC-43: release on CLOSED queue is idempotent and retains completed entry/event/history', async () => {
    const entry = await occupy();
    await pool.query("UPDATE service_queues SET status = 'CLOSED' WHERE id = $1", [seedIds.queue]);
    const before = await snapshot();
    const cookie = await loginAs(host, { app });
    const response = await request(app).post(release(T1)).set('Cookie', cookie).send({ role: 'HOST', userId: absent });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: T1, queueId: seedIds.queue, label: 'T1', capacity: 4,
      status: 'AVAILABLE', occupiedEntryId: null, occupiedTicketNo: null });
    expect((await pool.query('SELECT table_id,status FROM queue_entries WHERE id=$1', [entry.id])).rows[0])
      .toEqual({ table_id: T1, status: 'COMPLETED' });
    const after = await snapshot();
    for (const name of ['queue_entries', 'queue_events', 'service_queues']) expect(after[name]).toEqual(before[name]);
    const again = await request(app).post(release(T1)).set('Cookie', cookie);
    expect(again.status).toBe(200);
    expect(again.body).toEqual(response.body);
    expect(await snapshot()).toEqual(after);
  });
  test('TEST-43 / AC-43: concurrent Releases both succeed without changing ticket history', async () => {
    await occupy();
    const cookie = await loginAs(host, { app });
    const responses = await Promise.all([1, 2].map(() => request(app).post(release(T1)).set('Cookie', cookie)));
    for (const response of responses) { expect(response.status).toBe(200); expect(response.body.data.status).toBe('AVAILABLE'); }
    expect((await pool.query('SELECT count(*)::int AS n FROM queue_events')).rows[0].n).toBe(3);
    expect((await table(T1)).occupied_entry_id).toBeNull();
  });
  test('TEST-45 / AC-45: repeat migrations/seed retain occupied tables, counter and historical entry', async () => {
    await occupy();
    const before = await snapshot();
    expect(await migrate(pool)).toEqual([]);
    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    const client = await pool.connect();
    try { await seed(client, hash); await seed(client, hash); } finally { client.release(); }
    expect(await snapshot()).toEqual(before);
  });
  test('TEST-45 / AC-45: new app/pool retains occupied and then released history', async () => {
    const entry = await occupy();
    const cookie = await loginAs(host, { app });
    for (const state of ['OCCUPIED', 'AVAILABLE']) {
      const otherPool = createPool(process.env.TEST_DATABASE_URL);
      try {
        const otherApp = createTestApp({ pool: otherPool });
        const response = await request(otherApp).get(list(seedIds.queue)).set('Cookie', cookie);
        expect(response.status).toBe(200);
        expect(response.body.data[0].status).toBe(state);
        expect((await otherPool.query('SELECT table_id FROM queue_entries WHERE id=$1', [entry.id])).rows[0].table_id).toBe(T1);
      } finally { await otherPool.end(); }
      if (state === 'OCCUPIED') expect((await request(app).post(release(T1)).set('Cookie', cookie)).status).toBe(200);
    }
  });
  test.each([0, 11])('TEST-45 / AC-45: DB rejects capacity %i (23514)', async capacity => {
    await requireSchema();
    await expect(pool.query('UPDATE dining_tables SET capacity=$1 WHERE id=$2', [capacity, T1])).rejects.toMatchObject({ code: '23514' });
  });
  test.each(['', '   ', 'x'.repeat(61)])('TEST-45 / AC-45: DB rejects invalid table label %j', async label => {
    await requireSchema();
    await expect(pool.query('UPDATE dining_tables SET label=$1 WHERE id=$2', [label, T1])).rejects.toMatchObject({ code: '23514' });
  });
  test('TEST-45 / AC-45: DB rejects duplicate label, invalid occupancy/state and cross-queue references', async () => {
    const entry = await occupy();
    await expect(pool.query("UPDATE dining_tables SET label='T1' WHERE id=$1", [T2])).rejects.toMatchObject({ code: '23505' });
    await expect(pool.query("UPDATE dining_tables SET status='AVAILABLE' WHERE id=$1", [T1])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("UPDATE dining_tables SET status='OCCUPIED' WHERE id=$1", [T2])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("UPDATE dining_tables SET status='PAUSED' WHERE id=$1", [T1])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query("UPDATE dining_tables SET status='OCCUPIED',occupied_entry_id=$1 WHERE id=$2", [entry.id,T2])).rejects.toMatchObject({ code: '23505' });
    const waiting = await insertEntry(pool, { customer: 2, ticketNo: 2 });
    await expect(pool.query('UPDATE queue_entries SET table_id=$1 WHERE id=$2', [T2,waiting.id])).rejects.toMatchObject({ code: '23514' });
    const queue = await insertQueue(pool);
    const other = (await pool.query("INSERT INTO dining_tables(queue_id,label,capacity) VALUES ($1,'Other',1) RETURNING id", [queue])).rows[0].id;
    await expect(pool.query('UPDATE queue_entries SET table_id=$1 WHERE id=$2', [other,entry.id])).rejects.toMatchObject({ code: '23503' });
    // Isolate FK failure from the separately asserted occupied-entry UNIQUE violation.
    const unoccupied = await insertEntry(pool, { customer: 3, ticketNo: 3, status: 'COMPLETED' });
    await expect(pool.query("UPDATE dining_tables SET status='OCCUPIED',occupied_entry_id=$1 WHERE id=$2", [unoccupied.id,other])).rejects.toMatchObject({ code: '23503' });
    await expect(pool.query('UPDATE dining_tables SET queue_id=$1 WHERE id=$2', [absent,T2])).rejects.toMatchObject({ code: '23503' });
  });
  test('TEST-45 / AC-45: migration 004 upgrades legacy rows without changing their existing fields', async () => {
    const dir = new URL('../../database/migrations/', import.meta.url);
    const fourth = readdirSync(dir).find(name => name.startsWith('004_') && name.endsWith('.sql'));
    expect(fourth, 'migration 004 is part of this contract').toBeDefined();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const sourceSchema = (await client.query('SELECT current_schema() AS name')).rows[0].name;
      const source = '"' + sourceSchema.replaceAll('"', '""') + '"';
      await client.query('CREATE SCHEMA f05_upgrade');
      await client.query('SET LOCAL search_path TO f05_upgrade');
      for (const prefix of ['001_', '002_']) {
        const file = readdirSync(dir).find(name => name.startsWith(prefix) && name.endsWith('.sql'));
        await client.query(readFileSync(new URL(file, dir), 'utf8'));
      }
      // Real existing ticket/event copied into the legacy schema before adding the relationship.
      await client.query(`INSERT INTO users SELECT * FROM ${source}.users`);
      await client.query(`INSERT INTO restaurants SELECT * FROM ${source}.restaurants`);
      await client.query(`INSERT INTO service_queues(id,restaurant_id,status,next_ticket_no,max_party_size)
        SELECT id,restaurant_id,status,next_ticket_no,max_party_size FROM ${source}.service_queues`);
      await client.query(`INSERT INTO queue_entries(queue_id,customer_id,ticket_no,party_size,status)
        SELECT $1,id,1,4,'WAITING' FROM users WHERE email='customer01@dineq.test'`, [seedIds.queue]);
      await client.query("INSERT INTO queue_events(entry_id,actor_id,event_type,to_status) SELECT id,customer_id,'JOINED','WAITING' FROM queue_entries");
      const before = (await client.query('SELECT to_jsonb(e) AS value FROM queue_entries e')).rows;
      const events = (await client.query('SELECT * FROM queue_events')).rows;
      await client.query(readFileSync(new URL(fourth, dir), 'utf8'));
      expect((await client.query("SELECT to_jsonb(e)-'table_id' AS value FROM queue_entries e")).rows).toEqual(before);
      expect((await client.query('SELECT table_id FROM queue_entries')).rows).toEqual([{ table_id: null }]);
      expect((await client.query('SELECT * FROM queue_events')).rows).toEqual(events);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
});
