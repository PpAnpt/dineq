import { createHash } from 'node:crypto';

export const queueId = '22222222-2222-4222-8222-222222222222';

// Executed inside the existing image with its existing DB binding. No accounts,
// credentials, sessions or password hashes are selected or included in output.
export async function runOperation(client, input) {
  if (!['snapshot', 'close', 'restore', 'verify'].includes(input.mode)) {
    throw new Error('Unsupported owner operation');
  }
  if (input.queueId !== queueId) throw new Error('Unexpected target queue');
  if (input.mode !== 'snapshot' && !/^[a-f0-9]{64}$/.test(input.expectedHash || '')) {
    throw new Error('A fresh baseline hash is required');
  }
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    const { rows: queues } = await client.query(
      'SELECT id, restaurant_id, status, next_ticket_no FROM service_queues WHERE id = $1 FOR UPDATE',
      [queueId]);
    const queue = queues[0];
    if (!queue) throw new Error('Target queue not found');
    const { rows: entries } = await client.query(
      `SELECT id, queue_id, customer_id, ticket_no, party_size, status,
              created_at, called_at, completed_at
       FROM queue_entries WHERE queue_id = $1 ORDER BY id`, [queueId]);
    const { rows: events } = await client.query(
      `SELECT e.id, e.entry_id, e.actor_id, e.event_type, e.from_status,
              e.to_status, e.occurred_at
       FROM queue_events e JOIN queue_entries q ON q.id = e.entry_id
       WHERE q.queue_id = $1 ORDER BY e.id`, [queueId]);
    const hash = createHash('sha256').update(JSON.stringify({
      queue: { id: queue.id, restaurant_id: queue.restaurant_id, next_ticket_no: queue.next_ticket_no },
      entries, events,
    })).digest('hex');
    const unchanged = !input.expectedHash || hash === input.expectedHash;
    if (input.mode === 'close') {
      if (queue.status !== 'OPEN' || !unchanged) throw new Error('OPEN baseline changed; refusing to close');
      await client.query("UPDATE service_queues SET status = 'CLOSED' WHERE id = $1 AND status = 'OPEN'", [queueId]);
      queue.status = 'CLOSED';
    } else if (input.mode === 'restore') {
      // Always restore the originally OPEN queue, even if a failed test changed
      // its entries; return unchanged:false so the mismatch cannot become PASS.
      if (!['OPEN', 'CLOSED'].includes(queue.status)) throw new Error('Unknown queue state');
      await client.query("UPDATE service_queues SET status = 'OPEN' WHERE id = $1 AND status = 'CLOSED'", [queueId]);
      queue.status = 'OPEN';
    } else if (input.mode === 'verify' && !unchanged) {
      throw new Error('Entries, events or queue counter differ from the baseline');
    }
    await client.query('COMMIT');
    return { at: new Date().toISOString(), mode: input.mode, queue, entries,
      eventCount: events.length, dataHash: hash, unchanged };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
