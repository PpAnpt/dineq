import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import { loadConfig } from '../src/config.js';
import { migrate } from '../../database/migrate.js';
import { seed, seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, resetAndSeed, validateTestDatabaseUrl } from './helpers/index.js';

let pool;
let app;
let customer;

beforeAll(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
  customer = (await pool.query("SELECT id FROM users WHERE email = 'customer01@dineq.test'")).rows[0].id;
});
afterAll(closeTestPool);

describe('P2 infrastructure (not feature AC results)', () => {
  test('INFRA-01: health endpoint returns the public success envelope', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });

  test('INFRA-02: missing config fails fast and test reset rejects unsafe database URLs', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL is required');
    expect(() => validateTestDatabaseUrl('', '')).toThrow('TEST_DATABASE_URL is required');
    expect(() => validateTestDatabaseUrl('postgresql://localhost/dineq_dev')).toThrow('ending in _test');
    expect(() => validateTestDatabaseUrl('postgresql://localhost/dineq_test',
      'postgresql://127.0.0.1/dineq_test')).toThrow('separate database');
  });

  test('INFRA-03: migration creates all tables, UUID IDs, timestamptz fields and foreign keys', async () => {
    const tables = (await pool.query(`SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`)).rows.map(row => row.table_name);
    expect(tables).toEqual(expect.arrayContaining(['schema_migrations', 'users', 'sessions',
      'restaurants', 'service_queues', 'queue_operator_assignments', 'queue_entries', 'queue_events']));
    const columns = (await pool.query(`SELECT table_name, column_name, data_type, column_default
      FROM information_schema.columns WHERE table_schema = 'public'`)).rows;
    const ids = columns.filter(row => row.column_name === 'id');
    expect(ids).toHaveLength(6);
    for (const row of ids) {
      expect(row.data_type).toBe('uuid');
      expect(row.column_default).toContain('gen_random_uuid()');
    }
    const timestamps = columns.filter(row => /_(at)$/.test(row.column_name));
    expect(timestamps.length).toBeGreaterThanOrEqual(9);
    expect(timestamps.every(row => row.data_type === 'timestamp with time zone')).toBe(true);
    const foreignKeys = (await pool.query(`SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name AND kcu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`)).rows;
    for (const [table_name, column_name] of [
      ['sessions', 'user_id'], ['service_queues', 'restaurant_id'],
      ['queue_operator_assignments', 'queue_id'], ['queue_operator_assignments', 'host_user_id'],
      ['queue_entries', 'queue_id'], ['queue_entries', 'customer_id'],
      ['queue_events', 'entry_id'], ['queue_events', 'actor_id'],
    ]) expect(foreignKeys).toContainEqual({ table_name, column_name });
  });

  test('INFRA-04: PostgreSQL exposes both partial unique indexes and required CHECK constraints', async () => {
    const indexes = (await pool.query(`SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'queue_entries'`)).rows;
    const active = indexes.find(row => row.indexname === 'queue_entries_one_active_customer');
    const called = indexes.find(row => row.indexname === 'queue_entries_one_called');
    expect(active.indexdef).toMatch(/UNIQUE.*\(queue_id, customer_id\).*WHERE/);
    expect(active.indexdef).toContain('WAITING');
    expect(active.indexdef).toContain('CALLED');
    expect(called.indexdef).toMatch(/UNIQUE.*\(queue_id\).*WHERE.*CALLED/);
    expect(indexes.some(row => /UNIQUE.*\(queue_id, ticket_no\)/.test(row.indexdef))).toBe(true);
    const checks = (await pool.query(`SELECT tc.table_name, cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.constraint_schema
      WHERE tc.table_schema = 'public' AND tc.constraint_type = 'CHECK'`)).rows;
    const entryChecks = checks.filter(row => row.table_name === 'queue_entries').map(row => row.check_clause).join(' ');
    expect(entryChecks).toMatch(/party_size >= 1/);
    expect(entryChecks).toMatch(/party_size <= 8/);
    for (const status of ['WAITING', 'CALLED', 'COMPLETED']) expect(entryChecks).toContain(status);
    expect(entryChecks).toContain('called_at');
    expect(entryChecks).toContain('completed_at');
    expect(checks.some(row => row.table_name === 'service_queues'
      && row.check_clause.includes('next_ticket_no >= 1'))).toBe(true);
    const queueChecks = checks.filter(row => row.table_name === 'service_queues').map(row => row.check_clause).join(' ');
    for (const status of ['OPEN', 'CLOSED']) expect(queueChecks).toContain(status);
    const roleChecks = checks.filter(row => row.table_name === 'users').map(row => row.check_clause).join(' ');
    for (const role of ['CUSTOMER', 'HOST']) expect(roleChecks).toContain(role);
  });

  test('INFRA-05: rerunning migrations and seed preserves identities, rows and ticket counter', async () => {
    const before = (await pool.query('SELECT id, email FROM users ORDER BY email')).rows;
    const hash = (await pool.query('SELECT password_hash FROM users LIMIT 1')).rows[0].password_hash;
    expect(await migrate(pool)).toEqual([]);
    const client = await pool.connect();
    try {
      await client.query('UPDATE service_queues SET next_ticket_no = 7 WHERE id = $1', [seedIds.queue]);
      await seed(client, hash);
      expect((await client.query('SELECT id, email FROM users ORDER BY email')).rows).toEqual(before);
      expect((await client.query('SELECT next_ticket_no FROM service_queues WHERE id = $1', [seedIds.queue])).rows[0].next_ticket_no).toBe(7);
      expect((await client.query('SELECT count(*)::int AS n FROM restaurants')).rows[0].n).toBe(1);
      expect((await client.query('SELECT count(*)::int AS n FROM service_queues')).rows[0].n).toBe(1);
      expect((await client.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n).toBe(1);
    } finally {
      await client.query('UPDATE service_queues SET next_ticket_no = 1 WHERE id = $1', [seedIds.queue]);
      client.release();
    }
  });

  test('INFRA-06: seed contains 30 hashed customers and correctly scoped Hosts', async () => {
    const accounts = (await pool.query('SELECT email, role, password_hash FROM users ORDER BY email')).rows;
    expect(accounts.filter(row => row.role === 'CUSTOMER').map(row => row.email)).toEqual(
      Array.from({ length: 30 }, (_, i) => `customer${String(i + 1).padStart(2, '0')}@dineq.test`));
    expect(accounts.filter(row => row.role === 'HOST').map(row => row.email)).toEqual(['host1@dineq.test', 'host2@dineq.test']);
    expect(accounts.every(row => row.password_hash.startsWith('$argon2id$'))).toBe(true);
    expect(await argon2.verify(accounts[0].password_hash, process.env.SEED_DEMO_PASSWORD)).toBe(true);
    expect((await pool.query(`SELECT u.email FROM queue_operator_assignments a
      JOIN users u ON u.id = a.host_user_id WHERE a.queue_id = $1`, [seedIds.queue])).rows)
      .toEqual([{ email: 'host1@dineq.test' }]);
  });

  test('INFRA-07: DB rejects invalid party sizes, statuses, counters and foreign keys', async () => {
    for (const size of [0, 9]) {
      await expect(pool.query(`INSERT INTO queue_entries
        (queue_id, customer_id, ticket_no, party_size, status) VALUES ($1, $2, 1, $3, 'WAITING')`,
      [seedIds.queue, customer, size])).rejects.toMatchObject({ code: '23514' });
    }
    await expect(pool.query(`INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
      VALUES ($1, $2, 1, 4, 'UNKNOWN')`, [seedIds.queue, customer])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query('UPDATE service_queues SET next_ticket_no = 0 WHERE id = $1', [seedIds.queue]))
      .rejects.toMatchObject({ code: '23514' });
    await expect(pool.query(`INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
      VALUES ('00000000-0000-4000-8000-000000000000', $1, 1, 4, 'WAITING')`, [customer]))
      .rejects.toMatchObject({ code: '23503' });
  });

  test('INFRA-08: unique indexes and timestamp/event constraints reject inconsistent rows', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const others = (await client.query("SELECT id FROM users WHERE role = 'CUSTOMER' AND id <> $1 ORDER BY email LIMIT 2", [customer])).rows;
      const entry = (await client.query(`INSERT INTO queue_entries
        (queue_id, customer_id, ticket_no, party_size, status) VALUES ($1, $2, 1, 4, 'WAITING') RETURNING id`,
      [seedIds.queue, customer])).rows[0].id;
      const rejects = async (sql, values, code) => {
        await client.query('SAVEPOINT invalid_row');
        await expect(client.query(sql, values)).rejects.toMatchObject({ code });
        await client.query('ROLLBACK TO SAVEPOINT invalid_row');
      };
      await rejects(`INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
        VALUES ($1, $2, 2, 4, 'WAITING')`, [seedIds.queue, customer], '23505');
      await rejects(`INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
        VALUES ($1, $2, 1, 4, 'WAITING')`, [seedIds.queue, others[0].id], '23505');
      await rejects("UPDATE queue_entries SET status = 'CALLED' WHERE id = $1", [entry], '23514');
      await client.query("UPDATE queue_entries SET status = 'CALLED', called_at = now() WHERE id = $1", [entry]);
      await rejects(`INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status, called_at)
        VALUES ($1, $2, 2, 4, 'CALLED', now())`, [seedIds.queue, others[0].id], '23505');
      await rejects(`INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
        VALUES ($1, $2, 'CALLED', NULL, 'CALLED')`, [entry, customer], '23514');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
