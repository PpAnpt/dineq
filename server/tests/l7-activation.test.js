import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { seed, seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, resetAndSeed } from './helpers/index.js';

// AC-26b / TEST-26b (contract: Lab 7 change request v0.4, F-02 contract v0.6): data migration 006 raises the
// fixed seed queue from 8 to 10 on an existing database. Normative sentence: it updates the fixed seed queue
// whenever its current max_party_size is 8, including an explicitly configured 8; it preserves every non-8
// value and all other queues, and is a no-op when the seed queue is absent.

let pool;
const migrationsDir = new URL('../../database/migrations/', import.meta.url);
const files = readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort();
const activation = files.find(name => name.startsWith('006_'));
const before006 = files.filter(name => name < '006_');
const otherEight = 'aaaaaaaa-0000-4000-8000-0000000000a8';
const otherFour = 'aaaaaaaa-0000-4000-8000-0000000000a4';

beforeEach(async () => { pool = await resetAndSeed(); });
afterAll(closeTestPool);

// Builds a legacy-shaped database in a throw-away schema: every earlier migration, then one restaurant with
// the seed queue at `mainLimit` (or no seed queue), two other queues, and a ticket with its JOINED event.
async function withLegacyDatabase(mainLimit, work) {
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS l7_activate CASCADE');
    await client.query('CREATE SCHEMA l7_activate');
    await client.query('SET search_path TO l7_activate');
    for (const name of before006) await client.query(readFileSync(new URL(name, migrationsDir), 'utf8'));
    await client.query(`INSERT INTO restaurants (id, name, status) VALUES ($1, 'DineQ Demo Restaurant', 'OPEN')`, [seedIds.restaurant]);
    const customer = (await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ('activation@example.test', 'x', 'CUSTOMER') RETURNING id`)).rows[0].id;
    await client.query(
      `INSERT INTO service_queues (id, restaurant_id, status, next_ticket_no, max_party_size, name) VALUES
       ($1, $3, 'OPEN', 1, 8, 'Other eight'), ($2, $3, 'CLOSED', 2, 4, 'Other four')`,
      [otherEight, otherFour, seedIds.restaurant]);
    if (mainLimit !== null) {
      await client.query(
        `INSERT INTO service_queues (id, restaurant_id, status, next_ticket_no, max_party_size, name)
         VALUES ($1, $2, 'OPEN', 5, $3, 'Main queue')`, [seedIds.queue, seedIds.restaurant, mainLimit]);
      const entry = (await client.query(
        `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
         VALUES ($1, $2, 4, 3, 'WAITING') RETURNING id`, [seedIds.queue, customer])).rows[0].id;
      await client.query(
        `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
         VALUES ($1, $2, 'JOINED', NULL, 'WAITING')`, [entry, customer]);
    }
    const limits = async () => Object.fromEntries((await client.query(
      'SELECT id, max_party_size FROM service_queues')).rows.map(row => [row.id, row.max_party_size]));
    const untouched = async () => JSON.stringify({
      entries: (await client.query('SELECT * FROM queue_entries ORDER BY id')).rows,
      events: (await client.query('SELECT * FROM queue_events ORDER BY id')).rows,
      queues: (await client.query(
        'SELECT id, restaurant_id, status, next_ticket_no, name FROM service_queues ORDER BY id')).rows,
    });
    await work({ client, limits, untouched });
  } finally {
    await client.query('RESET search_path');
    await client.query('DROP SCHEMA IF EXISTS l7_activate CASCADE');
    client.release();
  }
}

const apply = (client) => client.query(readFileSync(new URL(activation, migrationsDir), 'utf8'));

describe('Lab 7 TEST-26b / AC-26b: migration 006 activates the main queue limit on existing data', () => {
  test('TEST-26b / AC-26b: the migration file database/migrations/006_*.sql exists', () => {
    expect(activation, 'database/migrations/006_*.sql (activation of the main queue limit) must exist').toBeDefined();
    expect(existsSync(new URL(activation, migrationsDir))).toBe(true);
  });

  test.each([
    ['the default 8', 8],
    ['an 8 that someone set on purpose (the migration cannot tell the two apart)', 8],
  ])('TEST-26b / AC-26b: a main queue at %s becomes 10; other queues, tickets, events and counters stay', async (_label, mainLimit) => {
    expect(activation, '006 must exist').toBeDefined();
    await withLegacyDatabase(mainLimit, async ({ client, limits, untouched }) => {
      const before = await untouched();
      await apply(client);
      expect(await limits()).toEqual({ [seedIds.queue]: 10, [otherEight]: 8, [otherFour]: 4 });
      expect(await untouched()).toBe(before);
    });
  });

  test.each([4, 6, 9, 10])('TEST-26b / AC-26b: a main queue at %i is not changed (only 8 is raised)', async (mainLimit) => {
    expect(activation, '006 must exist').toBeDefined();
    await withLegacyDatabase(mainLimit, async ({ client, limits, untouched }) => {
      const before = await untouched();
      await apply(client);
      expect(await limits()).toEqual({ [seedIds.queue]: mainLimit, [otherEight]: 8, [otherFour]: 4 });
      expect(await untouched()).toBe(before);
    });
  });

  test('TEST-26b / AC-26b: running 006 a second time changes nothing', async () => {
    expect(activation, '006 must exist').toBeDefined();
    await withLegacyDatabase(8, async ({ client, limits, untouched }) => {
      await apply(client);
      const afterFirst = { limits: await limits(), data: await untouched() };
      await apply(client);
      expect({ limits: await limits(), data: await untouched() }).toEqual(afterFirst);
    });
  });

  test('TEST-26b / AC-26b: without the seed queue it is a no-op and does not fail', async () => {
    expect(activation, '006 must exist').toBeDefined();
    await withLegacyDatabase(null, async ({ client, limits, untouched }) => {
      const before = await untouched();
      await apply(client);
      expect(await limits()).toEqual({ [otherEight]: 8, [otherFour]: 4 });
      expect(await untouched()).toBe(before);
    });
  });

  test('TEST-26b / AC-26b: on a new database the whole migration chain, then the seed, ends with the main queue at 10', async () => {
    expect(activation, '006 must exist').toBeDefined();
    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    const client = await pool.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS l7_activate CASCADE');
      await client.query('CREATE SCHEMA l7_activate');
      await client.query('SET search_path TO l7_activate');
      for (const name of files) await client.query(readFileSync(new URL(name, migrationsDir), 'utf8'));
      // On a new database the migration runs before any row exists, so it must match nothing.
      expect((await client.query('SELECT count(*)::int AS n FROM service_queues')).rows[0].n).toBe(0);
      await seed(client, hash);
      expect((await client.query('SELECT max_party_size FROM service_queues WHERE id = $1', [seedIds.queue]))
        .rows[0].max_party_size).toBe(10);
    } finally {
      await client.query('RESET search_path');
      await client.query('DROP SCHEMA IF EXISTS l7_activate CASCADE');
      client.release();
    }
  });
});
