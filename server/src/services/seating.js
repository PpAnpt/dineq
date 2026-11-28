import { httpError } from '../errors.js';

export function toTable(row) {
  return { id: row.id, queueId: row.queue_id, label: row.label, capacity: row.capacity,
    status: row.status, occupiedEntryId: row.occupied_entry_id,
    occupiedTicketNo: row.occupied_ticket_no ?? null };
}

async function assertAssigned(db, queueId, userId) {
  const assigned = await db.query(
    'SELECT 1 FROM queue_operator_assignments WHERE queue_id=$1 AND host_user_id=$2', [queueId, userId]);
  if (!assigned.rowCount) throw httpError(403, 'FORBIDDEN', 'Host is not assigned to this queue');
}

export function createSeatingService({ pool }) {
  return {
    async listTables(user, queueId) {
      const queue = await pool.query('SELECT id FROM service_queues WHERE id=$1', [queueId]);
      if (!queue.rowCount) throw httpError(404, 'NOT_FOUND', 'Queue not found');
      await assertAssigned(pool, queueId, user.id);
      const { rows } = await pool.query(`SELECT t.*, e.ticket_no AS occupied_ticket_no
        FROM dining_tables t LEFT JOIN queue_entries e ON e.id=t.occupied_entry_id AND e.queue_id=t.queue_id
        WHERE t.queue_id=$1 ORDER BY t.label, t.id`, [queueId]);
      return rows.map(toTable);
    },
    async releaseTable(user, tableId) {
      const found = await pool.query('SELECT queue_id FROM dining_tables WHERE id=$1', [tableId]);
      if (!found.rowCount) throw httpError(404, 'NOT_FOUND', 'Table not found');
      const queueId = found.rows[0].queue_id;
      await assertAssigned(pool, queueId, user.id);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const queue = await client.query('SELECT id FROM service_queues WHERE id=$1 FOR UPDATE', [queueId]);
        if (!queue.rowCount) throw httpError(404, 'NOT_FOUND', 'Queue not found');
        await assertAssigned(client, queueId, user.id);
        const locked = await client.query('SELECT * FROM dining_tables WHERE id=$1 AND queue_id=$2 FOR UPDATE', [tableId, queueId]);
        if (!locked.rowCount) throw httpError(404, 'NOT_FOUND', 'Table not found');
        let row = locked.rows[0];
        if (row.status === 'OCCUPIED') {
          row = (await client.query(`UPDATE dining_tables SET status='AVAILABLE', occupied_entry_id=NULL
            WHERE id=$1 RETURNING *`, [tableId])).rows[0];
        }
        await client.query('COMMIT');
        return toTable(row);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally { client.release(); }
    },
  };
}
