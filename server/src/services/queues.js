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

export function isValidPartySize(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 8;
}

function toTicket(row) {
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

export function createQueueService({ pool }) {
  return {
    // C.6.1: no next_ticket_no, assignment rows or customer data.
    async listQueues(user) {
      const { rows } = await pool.query(
        `SELECT q.id, q.status, r.id AS restaurant_id, r.name AS restaurant_name,
                ($2 = 'HOST' AND EXISTS (
                  SELECT 1 FROM queue_operator_assignments a
                  WHERE a.queue_id = q.id AND a.host_user_id = $1)) AS is_assigned
           FROM service_queues q JOIN restaurants r ON r.id = q.restaurant_id
          ORDER BY r.name, q.id`, [user.id, user.role]);
      return rows.map(row => ({
        id: row.id,
        restaurant: { id: row.restaurant_id, name: row.restaurant_name },
        status: row.status,
        isAssigned: row.is_assigned,
      }));
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

    async assertQueueExists(queueId) {
      const exists = await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [queueId]);
      if (exists.rowCount === 0) throw httpError(404, 'NOT_FOUND', 'Queue not found');
    },

    // Join Transaction (SDS C.3). The caller identity comes from the Session only.
    async join(user, queueId, partySize) {
      await this.assertQueueExists(queueId);
      if (!isValidPartySize(partySize)) {
        throw httpError(400, 'INVALID_PARTY_SIZE', 'partySize must be an integer from 1 to 8');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const locked = await client.query(
          'SELECT id, status, next_ticket_no FROM service_queues WHERE id = $1 FOR UPDATE', [queueId]);
        if (!locked.rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue not found');
        const queue = locked.rows[0];
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
