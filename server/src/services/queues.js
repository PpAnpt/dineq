import { httpError } from '../errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Path-parameter shape check (SDS C.6.3 step 4); runs before any query so
// PostgreSQL never sees a malformed uuid.
export function requireUuid(value, name) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw httpError(400, 'VALIDATION_ERROR', `${name} must be a valid UUID`);
  }
  return value;
}

// Shape check only (SDS C.6.3 step 5); the upper bound is the target queue's own
// max_party_size, checked inside the Join transaction under the queue lock (Lab 7, L7-CR-01).
export function isValidPartySize(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function partySizeError(limit) {
  return httpError(400, 'INVALID_PARTY_SIZE',
    `partySize must be an integer from 1 to ${limit} for this queue`);
}

export function toTicket(row) {
  return {
    id: row.id,
    queueId: row.queue_id,
    ticketNo: row.ticket_no,
    partySize: row.party_size,
    status: row.status,
    createdAt: row.created_at,
    calledAt: row.called_at,
    completedAt: row.completed_at,
  };
}

// Queue JSON of the list and of the open/close response (F-06; maxPartySize from Lab 7).
export function toQueueItem(row) {
  return {
    id: row.id,
    name: row.name,
    restaurant: { id: row.restaurant_id, name: row.restaurant_name },
    status: row.status,
    maxPartySize: row.max_party_size,
    isAssigned: row.is_assigned,
  };
}

export function createQueueService({ pool }) {
  return {
    // C.6.1: no next_ticket_no, assignment rows or customer data.
    async listQueues(user) {
      const { rows } = await pool.query(
        `SELECT q.id, q.name, q.status, q.max_party_size, r.id AS restaurant_id, r.name AS restaurant_name,
                ($2 = 'HOST' AND EXISTS (
                  SELECT 1 FROM queue_operator_assignments a
                  WHERE a.queue_id = q.id AND a.host_user_id = $1)) AS is_assigned
           FROM service_queues q JOIN restaurants r ON r.id = q.restaurant_id
          ORDER BY r.name, q.name, q.id`, [user.id, user.role]);
      return rows.map(toQueueItem);
    },

    async listMyEntries(user) {
      const { rows } = await pool.query(
        'SELECT * FROM queue_entries WHERE customer_id = $1 ORDER BY created_at DESC, ticket_no DESC',
        [user.id]);
      return rows.map(toTicket);
    },

    // Owner or Host assigned to the entry's queue; 404 before 403 (C.6.3 step 4).
    async getEntry(user, entryId) {
      const { rows } = await pool.query('SELECT * FROM queue_entries WHERE id = $1', [entryId]);
      if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue entry not found');
      const entry = rows[0];
      let allowed = false;
      if (user.role === 'CUSTOMER') {
        allowed = entry.customer_id === user.id;
      } else if (user.role === 'HOST') {
        const assignment = await pool.query(
          'SELECT 1 FROM queue_operator_assignments WHERE queue_id = $1 AND host_user_id = $2',
          [entry.queue_id, user.id]);
        allowed = assignment.rowCount > 0;
      }
      if (!allowed) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
      return toTicket(entry);
    },

    // Cancel Transaction (F-04 contract section 2). Order: 404 -> 403 (owner) outside the
    // transaction, then queue row FOR UPDATE -> entry row FOR UPDATE (same order as Call Next),
    // state recheck (409) and the CANCELLED event in the same transaction (BR-12).
    // The owner and the event actor come from the Session only.
    async cancel(user, entryId) {
      const found = await pool.query('SELECT queue_id, customer_id FROM queue_entries WHERE id = $1', [entryId]);
      if (!found.rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue entry not found');
      if (found.rows[0].customer_id !== user.id) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM service_queues WHERE id = $1 FOR UPDATE', [found.rows[0].queue_id]);
        const locked = await client.query('SELECT * FROM queue_entries WHERE id = $1 FOR UPDATE', [entryId]);
        const entry = locked.rows[0];
        if (!entry || entry.customer_id !== user.id) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
        if (entry.status !== 'WAITING') {
          throw httpError(409, 'INVALID_TRANSITION', 'Only a WAITING ticket can be cancelled');
        }
        const updated = await client.query(
          `UPDATE queue_entries SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [entryId]);
        await client.query(
          `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
           VALUES ($1, $2, 'CANCELLED', 'WAITING', 'CANCELLED')`, [entryId, user.id]);
        await client.query('COMMIT');
        return toTicket(updated.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async assertQueueExists(queueId) {
      const exists = await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [queueId]);
      if (exists.rowCount === 0) throw httpError(404, 'NOT_FOUND', 'Queue not found');
    },

    // Join Transaction (SDS C.3). The caller identity comes from the Session only.
    async join(user, queueId, partySize) {
      await this.assertQueueExists(queueId);
      if (!isValidPartySize(partySize)) {
        throw httpError(400, 'INVALID_PARTY_SIZE', 'partySize must be a whole number of at least 1');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const locked = await client.query(
          'SELECT id, status, next_ticket_no, max_party_size FROM service_queues WHERE id = $1 FOR UPDATE',
          [queueId]);
        if (!locked.rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue not found');
        const queue = locked.rows[0];
        // Per-queue limit from the locked row, before the CLOSED check (Sprint 1 order is kept).
        if (partySize > queue.max_party_size) throw partySizeError(queue.max_party_size);
        if (queue.status !== 'OPEN') throw httpError(409, 'QUEUE_CLOSED', 'This queue is closed');

        const account = await client.query('SELECT role, is_active FROM users WHERE id = $1', [user.id]);
        if (account.rows[0]?.role !== 'CUSTOMER' || !account.rows[0].is_active) {
          throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
        }

        // BR-02: one active (WAITING/CALLED) ticket per customer per queue.
        const active = await client.query(
          `SELECT 1 FROM queue_entries
            WHERE queue_id = $1 AND customer_id = $2 AND status IN ('WAITING', 'CALLED')`,
          [queueId, user.id]);
        if (active.rowCount > 0) {
          throw httpError(409, 'DUPLICATE_ACTIVE', 'You already have an active ticket in this queue');
        }

        const ticketNo = queue.next_ticket_no;
        const inserted = await client.query(
          `INSERT INTO queue_entries (queue_id, customer_id, ticket_no, party_size, status)
           VALUES ($1, $2, $3, $4, 'WAITING') RETURNING *`,
          [queueId, user.id, ticketNo, partySize]);
        await client.query('UPDATE service_queues SET next_ticket_no = next_ticket_no + 1 WHERE id = $1',
          [queueId]);
        await client.query(
          `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
           VALUES ($1, $2, 'JOINED', NULL, 'WAITING')`, [inserted.rows[0].id, user.id]);
        await client.query('COMMIT');
        return toTicket(inserted.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        // The partial unique index is the last line of defence against a race.
        if (error.code === '23505' && error.constraint === 'queue_entries_one_active_customer') {
          throw httpError(409, 'DUPLICATE_ACTIVE', 'You already have an active ticket in this queue');
        }
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
