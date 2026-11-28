import { httpError } from '../errors.js';
import { toTicket } from './queues.js';

export function toTable(row) {
  return { id: row.id, queueId: row.queue_id, label: row.label, capacity: row.capacity,
    status: row.status, occupiedEntryId: row.occupied_entry_id,
    occupiedTicketNo: row.occupied_ticket_no ?? null };
}

async function assertAssigned(db, queueId, userId) {
  const assigned = await db.query(
    `SELECT 1 FROM queue_operator_assignments a JOIN users u ON u.id=a.host_user_id
      WHERE a.queue_id=$1 AND a.host_user_id=$2 AND u.role='HOST' AND u.is_active`, [queueId, userId]);
  if (!assigned.rowCount) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
}

async function entryAccess(pool, user, entryId) {
  const found = await pool.query('SELECT queue_id FROM queue_entries WHERE id=$1', [entryId]);
  if (!found.rowCount) throw httpError(404, 'NOT_FOUND', 'Queue entry not found');
  await assertAssigned(pool, found.rows[0].queue_id, user.id);
  return found.rows[0].queue_id;
}

async function transitionEntry(pool, user, entryId, tableId) {
  const queueId = await entryAccess(pool, user, entryId);
  const seating = tableId !== undefined;
  // Target existence/queue precede state checks, even when the ticket is not CALLED.
  if (seating) {
    const target = await pool.query('SELECT queue_id FROM dining_tables WHERE id=$1', [tableId]);
    if (!target.rowCount) throw httpError(404, 'NOT_FOUND', 'Table not found');
    if (target.rows[0].queue_id !== queueId) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const queue = await client.query('SELECT id FROM service_queues WHERE id=$1 FOR UPDATE', [queueId]);
    if (!queue.rowCount) throw httpError(404, 'NOT_FOUND', 'Queue not found');
    await assertAssigned(client, queueId, user.id);
    const locked = await client.query('SELECT * FROM queue_entries WHERE id=$1 FOR UPDATE', [entryId]);
    if (!locked.rowCount) throw httpError(404, 'NOT_FOUND', 'Queue entry not found');
    const entry = locked.rows[0];
    if (entry.queue_id !== queueId) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
    let target;
    if (seating) {
      target = (await client.query('SELECT * FROM dining_tables WHERE id=$1 FOR UPDATE', [tableId])).rows[0];
      if (!target) throw httpError(404, 'NOT_FOUND', 'Table not found');
      if (target.queue_id !== queueId) throw httpError(403, 'FORBIDDEN', 'This operation is not permitted');
    }
    if (entry.status !== 'CALLED') throw httpError(409, 'INVALID_TRANSITION', 'Only a CALLED ticket can be served');
    if (seating && target.status !== 'AVAILABLE') throw httpError(409, 'TABLE_OCCUPIED', 'Table is already occupied');
    if (seating && target.capacity < entry.party_size) throw httpError(409, 'INSUFFICIENT_CAPACITY', 'Table has insufficient capacity');
    const status = seating ? 'COMPLETED' : 'NO_SHOW';
    const updated = (await client.query(`UPDATE queue_entries SET status=$2,
      completed_at=CASE WHEN $2='COMPLETED' THEN now() ELSE NULL END, table_id=$3
      WHERE id=$1 RETURNING *`, [entryId, status, seating ? tableId : null])).rows[0];
    if (seating) {
      target = (await client.query(`UPDATE dining_tables SET status='OCCUPIED',occupied_entry_id=$1
        WHERE id=$2 RETURNING *`, [entryId, tableId])).rows[0];
    }
    await client.query(`INSERT INTO queue_events(entry_id,actor_id,event_type,from_status,to_status)
      VALUES ($1,$2,$3,'CALLED',$3)`, [entryId, user.id, status]);
    await client.query('COMMIT');
    return seating ? { entry: toTicket(updated), table: toTable({ ...target, occupied_ticket_no: updated.ticket_no }) } : toTicket(updated);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

export function createSeatingService({ pool }) {
  return {
    assertEntryAccess(user, entryId) { return entryAccess(pool, user, entryId); },
    noShow(user, entryId) { return transitionEntry(pool, user, entryId); },
    seat(user, entryId, tableId) { return transitionEntry(pool, user, entryId, tableId); },
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
