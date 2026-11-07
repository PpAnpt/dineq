import { httpError } from '../errors.js';
import { toTicket } from './queues.js';

const forbidden = () => httpError(403, 'FORBIDDEN', 'This operation is not permitted');

// Host must be an active HOST assigned to the queue. The caller identity always
// comes from the Session (user.id); nothing here reads a client-supplied id.
async function assertAssigned(db, queueId, userId) {
  const { rowCount } = await db.query(
    `SELECT 1 FROM queue_operator_assignments a JOIN users u ON u.id = a.host_user_id
      WHERE a.queue_id = $1 AND a.host_user_id = $2 AND u.role = 'HOST' AND u.is_active`,
    [queueId, userId]);
  if (rowCount === 0) throw forbidden();
}

async function inTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export function createHostService({ pool }) {
  return {
    // SDS C.6.3 step 4: 404 for a missing queue first, then 403 for assignment.
    async listEntries(user, queueId) {
      const queue = await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [queueId]);
      if (queue.rowCount === 0) throw httpError(404, 'NOT_FOUND', 'Queue not found');
      await assertAssigned(pool, queueId, user.id);
      // Ticket fields only: no customer id / email in the Host's waiting list (C.6.1).
      const { rows } = await pool.query(
        `SELECT * FROM queue_entries
          WHERE queue_id = $1 AND status IN ('WAITING', 'CALLED')
          ORDER BY ticket_no ASC`, [queueId]);
      return rows.map(toTicket);
    },

    // Call Next Transaction (SDS C.3).
    async callNext(user, queueId) {
      // Cheap pre-check outside the lock so a rejected Host never holds the queue lock;
      // assignment is verified again under the lock below.
      const queue = await pool.query('SELECT 1 FROM service_queues WHERE id = $1', [queueId]);
      if (queue.rowCount === 0) throw httpError(404, 'NOT_FOUND', 'Queue not found');
      await assertAssigned(pool, queueId, user.id);

      try {
        return await inTransaction(pool, async (client) => {
          const locked = await client.query(
            'SELECT id FROM service_queues WHERE id = $1 FOR UPDATE', [queueId]);
          if (!locked.rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue not found');
          await assertAssigned(client, queueId, user.id);

          const called = await client.query(
            "SELECT 1 FROM queue_entries WHERE queue_id = $1 AND status = 'CALLED'", [queueId]);
          if (called.rowCount > 0) {
            throw httpError(409, 'UNRESOLVED_CALLED', 'A called ticket must be completed first');
          }

          const next = await client.query(
            `SELECT id FROM queue_entries WHERE queue_id = $1 AND status = 'WAITING'
              ORDER BY ticket_no ASC LIMIT 1 FOR UPDATE`, [queueId]);
          if (!next.rows[0]) throw httpError(404, 'NO_WAITING_ENTRY', 'No waiting ticket to call');

          const updated = await client.query(
            `UPDATE queue_entries SET status = 'CALLED', called_at = now()
              WHERE id = $1 RETURNING *`, [next.rows[0].id]);
          await client.query(
            `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
             VALUES ($1, $2, 'CALLED', 'WAITING', 'CALLED')`, [updated.rows[0].id, user.id]);
          return toTicket(updated.rows[0]);
        });
      } catch (error) {
        // The partial unique index (one CALLED per queue) is the last line of defence.
        if (error.code === '23505' && error.constraint === 'queue_entries_one_called') {
          throw httpError(409, 'UNRESOLVED_CALLED', 'A called ticket must be completed first');
        }
        throw error;
      }
    },

    // Complete Transaction (SDS C.3): 404 -> 403 -> 409 INVALID_TRANSITION.
    async complete(user, entryId) {
      return inTransaction(pool, async (client) => {
        const found = await client.query(
          'SELECT * FROM queue_entries WHERE id = $1 FOR UPDATE', [entryId]);
        if (!found.rows[0]) throw httpError(404, 'NOT_FOUND', 'Queue entry not found');
        const entry = found.rows[0];
        await assertAssigned(client, entry.queue_id, user.id);
        if (entry.status !== 'CALLED') {
          throw httpError(409, 'INVALID_TRANSITION', 'Only a CALLED ticket can be completed');
        }

        const updated = await client.query(
          `UPDATE queue_entries SET status = 'COMPLETED', completed_at = now()
            WHERE id = $1 RETURNING *`, [entry.id]);
        await client.query(
          `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status)
           VALUES ($1, $2, 'COMPLETED', 'CALLED', 'COMPLETED')`, [entry.id, user.id]);
        return toTicket(updated.rows[0]);
      });
    },
  };
}
