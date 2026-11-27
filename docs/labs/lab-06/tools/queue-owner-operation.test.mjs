import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';
import { queueId, runOperation } from './queue-owner-operation.mjs';

dotenv.config({ quiet: true });

test('owner preparation preserves records and recovers OPEN after an unexpected write', async () => {
  assert.ok(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL is required; never fall back to DATABASE_URL');
  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  const schema = `l6_owner_${randomUUID().replaceAll('-', '')}`;
  await client.connect();
  try {
    // All writes are confined to a new schema in the explicitly configured TEST
    // database; no shared fixture reset, seeded account or existing row is touched.
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query(await readFile(new URL('../../../../database/migrations/001_init.sql', import.meta.url), 'utf8'));
    const restaurant = (await client.query("INSERT INTO restaurants(name,status) VALUES('Owner helper test','OPEN') RETURNING id")).rows[0].id;
    await client.query("INSERT INTO service_queues(id,restaurant_id,status) VALUES($1,$2,'OPEN')", [queueId, restaurant]);
    const customer = (await client.query("INSERT INTO users(email,password_hash,role) VALUES('local-owner-test@example.test','unused','CUSTOMER') RETURNING id")).rows[0].id;
    const entry = (await client.query("INSERT INTO queue_entries(queue_id,customer_id,ticket_no,party_size,status) VALUES($1,$2,1,2,'WAITING') RETURNING id", [queueId, customer])).rows[0].id;
    await client.query("INSERT INTO queue_events(entry_id,actor_id,event_type,to_status) VALUES($1,$2,'JOINED','WAITING')", [entry, customer]);
    await client.query('UPDATE service_queues SET next_ticket_no=2 WHERE id=$1', [queueId]);
    const baseline = await runOperation(client, { mode: 'snapshot', queueId });
    assert.equal(baseline.entries.length, 1);
    assert.equal(baseline.eventCount, 1);
    await assert.rejects(runOperation(client, { mode: 'close', queueId, expectedHash: '0'.repeat(64) }), /baseline changed/);
    const closed = await runOperation(client, { mode: 'close', queueId, expectedHash: baseline.dataHash });
    assert.equal(closed.queue.status, 'CLOSED');
    assert.equal(closed.dataHash, baseline.dataHash);
    await client.query('UPDATE queue_entries SET party_size=3 WHERE id=$1', [entry]);
    await assert.rejects(runOperation(client, { mode: 'verify', queueId, expectedHash: baseline.dataHash }), /differ/);
    const restored = await runOperation(client, { mode: 'restore', queueId, expectedHash: baseline.dataHash });
    assert.equal(restored.queue.status, 'OPEN');
    assert.equal(restored.unchanged, false, 'recovery must not label changed data as a pass');
    assert.equal(restored.entries[0].party_size, 3, 'recovery must not rewrite a changed ticket');
    assert.equal(restored.queue.next_ticket_no, 2);
    assert.equal(restored.eventCount, 1);
    const fresh = await runOperation(client, { mode: 'snapshot', queueId });
    await runOperation(client, { mode: 'close', queueId, expectedHash: fresh.dataHash });
    const normalRestore = await runOperation(client, { mode: 'restore', queueId, expectedHash: fresh.dataHash });
    assert.equal(normalRestore.queue.status, 'OPEN');
    assert.equal(normalRestore.unchanged, true);
    assert.deepEqual(normalRestore.entries, fresh.entries);
    await assert.rejects(runOperation(client, { mode: 'close', queueId: randomUUID(), expectedHash: baseline.dataHash }), /Unexpected target/);
    await assert.rejects(runOperation(client, { mode: 'delete', queueId }), /Unsupported/);
  } finally {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
});
