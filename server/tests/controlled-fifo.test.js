import { afterAll, beforeEach, expect, test } from 'vitest';
import request from 'supertest';
import { seedIds } from '../../database/seed/seedData.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { customerEmail, entryRow, eventsFor, userIdByEmail } from './helpers/queueFixtures.js';

let pool;
let app;

beforeEach(async () => {
  pool = await resetAndSeed();
  app = createTestApp({ pool });
});

afterAll(closeTestPool);

test('TEST-15-CE / AC-15: sequential joins call the oldest ticket and leave every later ticket WAITING', async () => {
  // CE-FIFO-01 uses real Join transactions, unlike the original SQL-fixture TEST-15.
  // The first party is largest: neither newest-first nor party-size priority is FIFO.
  const tickets = [];
  for (const [index, partySize] of [8, 1, 4].entries()) {
    const cookie = await loginAs(customerEmail(index + 1), { app });
    const joined = await request(app)
      .post(`/api/queues/${seedIds.queue}/entries`)
      .set('Cookie', cookie)
      .send({ partySize });
    expect(joined.status).toBe(201);
    expect(joined.body.data).toMatchObject({ ticketNo: index + 1, partySize, status: 'WAITING' });
    tickets.push(joined.body.data);
  }

  // Join assigns ticket numbers in arrival order under the queue lock (SDS C.3).
  // Millisecond timestamps may tie; ticket number is the contractual FIFO key.
  const arrivalRows = (await pool.query(
    'SELECT id FROM queue_entries WHERE queue_id = $1 ORDER BY created_at ASC, ticket_no ASC',
    [seedIds.queue])).rows;
  expect(arrivalRows.map(row => row.id)).toEqual(tickets.map(ticket => ticket.id));

  const hostCookie = await loginAs('host1@dineq.test', { app });
  const before = await request(app).get(`/api/queues/${seedIds.queue}/entries`).set('Cookie', hostCookie);
  expect(before.status).toBe(200);
  expect(before.body.data.map(ticket => [ticket.id, ticket.status]))
    .toEqual(tickets.map(ticket => [ticket.id, 'WAITING']));

  const response = await request(app)
    .post(`/api/queues/${seedIds.queue}/call-next`)
    .set('Cookie', hostCookie);
  expect(response.status).toBe(200);
  expect.soft(response.body.data).toMatchObject({
    id: tickets[0].id, ticketNo: tickets[0].ticketNo, partySize: 8, status: 'CALLED',
  });

  const hostId = await userIdByEmail(pool, 'host1@dineq.test');
  for (const [index, ticket] of tickets.entries()) {
    const row = await entryRow(pool, ticket.id);
    expect.soft(row.status).toBe(index === 0 ? 'CALLED' : 'WAITING');
    expect.soft(row.completed_at).toBeNull();
    if (index === 0) expect.soft(row.called_at).toBeInstanceOf(Date);
    else expect.soft(row.called_at).toBeNull();

    const events = await eventsFor(pool, ticket.id);
    expect.soft(events.filter(event => event.event_type === 'JOINED')).toHaveLength(1);
    expect.soft(events.filter(event => event.event_type === 'CALLED').map(event => ({
      actorId: event.actor_id, from: event.from_status, to: event.to_status,
    }))).toEqual(index === 0 ? [{ actorId: hostId, from: 'WAITING', to: 'CALLED' }] : []);
  }
  const active = await request(app).get(`/api/queues/${seedIds.queue}/entries`).set('Cookie', hostCookie);
  expect(active.status).toBe(200);
  expect.soft(active.body.data.map(ticket => [ticket.id, ticket.status]))
    .toEqual(tickets.map((ticket, index) => [ticket.id, index === 0 ? 'CALLED' : 'WAITING']));
});
