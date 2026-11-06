import { seedIds } from '../../../database/seed/seedData.js';

// SQL-only fixtures: they never call the F-02 join endpoint, so Host tests do not
// depend on F-02 code. Rows follow the same shape the Join transaction would write.

export const customerEmail = (n) => `customer${String(n).padStart(2, '0')}@dineq.test`;

export async function userIdByEmail(pool, email) {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!rows[0]) throw new Error(`No seeded user ${email}`);
  return rows[0].id;
}

// Inserts one entry with its JOINED (and, if needed, CALLED / COMPLETED) events and
// keeps service_queues.next_ticket_no consistent. Returns the new entry row.
export async function insertEntry(pool, {
  queueId = seedIds.queue,
  customer = 1,
  ticketNo,
  partySize = 2,
  status = 'WAITING',
  hostEmail = 'host1@dineq.test',
} = {}) {
  const customerId = await userIdByEmail(pool, customerEmail(customer));
  const hostId = await userIdByEmail(pool, hostEmail);
  const called = status === 'CALLED' || status === 'COMPLETED';
  const completed = status === 'COMPLETED';
  const { rows } = await pool.query(
    `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status, called_at, completed_at)
     VALUES ($1, $2, $3, $4, $5,
             CASE WHEN $6::boolean THEN now() END,
             CASE WHEN $7::boolean THEN now() END)
     RETURNING *`,
    [queueId, customerId, ticketNo, partySize, status, called, completed]);
  const entry = rows[0];
  const events = [['JOINED', null, 'WAITING', customerId]];
  if (called) events.push(['CALLED', 'WAITING', 'CALLED', hostId]);
  if (completed) events.push(['COMPLETED', 'CALLED', 'COMPLETED', hostId]);
  for (const [type, from, to, actor] of events) {
    await pool.query(
      `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
       VALUES ($1, $2, $3, $4, $5)`, [entry.id, actor, type, from, to]);
  }
  await pool.query(
    'UPDATE service_queues SET next_ticket_no = GREATEST(next_ticket_no, $2 + 1) WHERE id = $1',
    [queueId, ticketNo]);
  return entry;
}

// A second OPEN queue (same restaurant) that no Host is assigned to.
export async function insertQueue(pool, { assignedHostEmail = null } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO service_queues (restaurant_id, status) VALUES ($1, 'OPEN') RETURNING id`,
    [seedIds.restaurant]);
  if (assignedHostEmail) {
    await pool.query(
      'INSERT INTO queue_operator_assignments (queue_id, host_user_id) VALUES ($1, $2)',
      [rows[0].id, await userIdByEmail(pool, assignedHostEmail)]);
  }
  return rows[0].id;
}

// Full picture of everything a rejected request must not touch (rows, events, counters).
export async function dbState(pool) {
  const q = async (sql) => (await pool.query(sql)).rows;
  return JSON.stringify({
    queues: await q('SELECT id, status, next_ticket_no FROM service_queues ORDER BY id'),
    entries: await q('SELECT * FROM queue_entries ORDER BY id'),
    events: await q('SELECT * FROM queue_events ORDER BY id'),
  });
}

export async function entryRow(pool, id) {
  return (await pool.query('SELECT * FROM queue_entries WHERE id = $1', [id])).rows[0];
}

export async function eventsFor(pool, entryId) {
  return (await pool.query(
    'SELECT * FROM queue_events WHERE entry_id = $1 ORDER BY occurred_at, event_type', [entryId])).rows;
}
