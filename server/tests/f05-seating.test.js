import { readdirSync } from 'node:fs';
import { afterAll, beforeEach, expect, test } from 'vitest';
import request from 'supertest';
import { seedIds } from '../../database/seed/seedData.js';
import { createPool } from '../src/db/pool.js';
import { closeTestPool, createTestApp, loginAs, resetAndSeed } from './helpers/index.js';
import { insertEntry, userIdByEmail } from './helpers/queueFixtures.js';

let pool;
let app;
const host = 'host1@dineq.test';
const customer = n => `customer${String(n).padStart(2, '0')}@dineq.test`;
const missing = '00000000-0000-4000-8000-000000000000';
const keys = ['calledAt','completedAt','createdAt','id','partySize','queueId','status','ticketNo'];
beforeEach(async () => { pool = await resetAndSeed(); app = createTestApp({ pool }); });
afterAll(closeTestPool);
const login = email => loginAs(email, { app });
const row = async id => (await pool.query('SELECT * FROM queue_entries WHERE id=$1', [id])).rows[0];
const table = async id => (await pool.query('SELECT * FROM dining_tables WHERE id=$1', [id])).rows[0];
const call = async (cookie, operation, entryId, body) => {
  const req = request(app).post(`/api/entries/${entryId}/${operation}`);
  if (cookie) req.set('Cookie', cookie);
  if (body !== undefined) req.send(body);
  return req;
};
async function snapshot() {
  const data = {};
  for (const name of ['queue_entries','dining_tables','queue_events','service_queues']) {
    data[name] = (await pool.query(`SELECT to_jsonb(t) AS value FROM ${name} t ORDER BY to_jsonb(t)::text`)).rows;
  }
  return data;
}
function error(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String) } });
}
async function fixture(status='CALLED', options={}) {
  const initial = status === 'NO_SHOW' ? 'CALLED' : status === 'CANCELLED' ? 'WAITING' : status;
  const entry = await insertEntry(pool, { customer: 1, ticketNo: 1, ...options, status: initial });
  if (status === 'NO_SHOW' || status === 'CANCELLED') {
    await pool.query('UPDATE queue_entries SET status=$1 WHERE id=$2', [status,entry.id]);
    await pool.query(`INSERT INTO queue_events(entry_id,actor_id,event_type,from_status,to_status)
      VALUES ($1,$2,$3,$4,$3)`, [entry.id, status === 'NO_SHOW' ? await userIdByEmail(pool,host) : entry.customer_id,
      status,initial]);
  }
  return row(entry.id);
}
async function terminalEvents(id) {
  return (await pool.query("SELECT * FROM queue_events WHERE entry_id=$1 AND event_type IN ('NO_SHOW','COMPLETED')", [id])).rows;
}

test('TEST-36 / AC-36: No-show records one event, keeps original fields, owner reads and rejoins without FIFO skip', async () => {
  const a = await fixture('CALLED', { partySize: 4 });
  const b = await insertEntry(pool, { customer: 2, ticketNo: 2 });
  const cookie = await login(host);
  const before = await snapshot();
  const response = await call(cookie,'no-show',a.id,{ role:'CUSTOMER',customerId:missing,ticketNo:99 });
  expect(response.status).toBe(200);
  expect(Object.keys(response.body.data).sort()).toEqual(keys);
  expect(response.body.data).toMatchObject({ id:a.id, ticketNo:1, partySize:4, status:'NO_SHOW',
    calledAt:a.called_at.toISOString(), completedAt:null });
  expect((await snapshot()).service_queues).toEqual(before.service_queues);
  expect((await snapshot()).dining_tables).toEqual(before.dining_tables);
  expect((await row(a.id)).table_id).toBeNull();
  expect(await terminalEvents(a.id)).toEqual([expect.objectContaining({ event_type:'NO_SHOW',
    from_status:'CALLED',to_status:'NO_SHOW',actor_id:await userIdByEmail(pool,host) })]);
  const owner = await login(customer(1));
  expect((await request(app).get(`/api/entries/${a.id}`).set('Cookie',owner)).body.data.status).toBe('NO_SHOW');
  const rejoin = await request(app).post(`/api/queues/${seedIds.queue}/entries`).set('Cookie',owner).send({partySize:4});
  expect(rejoin.status).toBe(201); expect(rejoin.body.data.ticketNo).toBe(3);
  const next = await request(app).post(`/api/queues/${seedIds.queue}/call-next`).set('Cookie',cookie);
  expect(next.status).toBe(200); expect(next.body.data.id).toBe(b.id);
});
test('TEST-36 / AC-36: No-show still serves a CALLED ticket on a CLOSED queue', async () => {
  const entry = await fixture();
  await pool.query("UPDATE service_queues SET status='CLOSED' WHERE id=$1",[seedIds.queue]);
  expect((await call(await login(host),'no-show',entry.id)).status).toBe(200);
});
for (const operation of ['no-show','seat']) {
  test.each(['WAITING','COMPLETED','CANCELLED','NO_SHOW'])(`TEST-37 / AC-37: ${operation} on %s is 409 without mutation`, async status => {
    const entry = await fixture(status);
    const before = await snapshot();
    error(await call(await login(host),operation,entry.id,{tableId:seedIds.table10}),409,'INVALID_TRANSITION');
    expect(await snapshot()).toEqual(before);
  });
  test(`TEST-37 / AC-37: repeated ${operation} is 409 and keeps a single terminal event`, async () => {
    const entry=await fixture(); const cookie=await login(host);
    expect((await call(cookie,operation,entry.id,{tableId:seedIds.table4})).status).toBe(200);
    const before=await snapshot();
    error(await call(cookie,operation,entry.id,{tableId:seedIds.table10}),409,'INVALID_TRANSITION');
    expect(await snapshot()).toEqual(before); expect(await terminalEvents(entry.id)).toHaveLength(1);
  });
  test(`TEST-38 / AC-38: ${operation} Session, Role, UUID, resource and assignment precede body`, async () => {
    const entry=await fixture(); const cookie=await login(host); const before=await snapshot();
    error(await call(null,operation,'not-a-uuid'),401,'UNAUTHENTICATED');
    error(await call(await login(customer(1)),operation,'not-a-uuid'),403,'FORBIDDEN');
    error(await call(cookie,operation,'not-a-uuid'),400,'VALIDATION_ERROR');
    error(await call(cookie,operation,missing),404,'NOT_FOUND');
    error(await call(await login('host2@dineq.test'),operation,entry.id),403,'FORBIDDEN');
    const foreign=await request(app).post(`/api/entries/${entry.id}/${operation}`).set('Cookie',cookie)
      .set('Origin','https://foreign.example.test').send({tableId:seedIds.table4});
    error(foreign,403,'ORIGIN_NOT_ALLOWED'); expect(await snapshot()).toEqual(before);
    const other=await fixture('CALLED',{queueId:seedIds.barQueue,customer:3,ticketNo:1});
    const malformed=await request(app).post(`/api/entries/${other.id}/${operation}`).set('Cookie',cookie)
      .set('Content-Type','application/json').send('{');
    error(malformed,403,'FORBIDDEN');
    const absent=await request(app).post(`/api/entries/${missing}/${operation}`).set('Cookie',cookie)
      .set('Content-Type','application/json').send('{');
    error(absent,404,'NOT_FOUND');
  });
}
test.each([[1,'table4'],[4,'table4'],[10,'table10']])('TEST-40 / AC-40: Seat party %i at %s atomically completes ticket on CLOSED queue', async (size,key) => {
  const entry=await fixture('CALLED',{partySize:size}); const cookie=await login(host);
  await pool.query("UPDATE service_queues SET status='CLOSED' WHERE id=$1",[seedIds.queue]);
  const before=await snapshot();
  const response=await call(cookie,'seat',entry.id,{tableId:seedIds[key],partySize:1,role:'CUSTOMER',status:'WAITING'});
  expect(response.status).toBe(200);
  expect(Object.keys(response.body.data).sort()).toEqual(['entry','table']);
  expect(Object.keys(response.body.data.entry).sort()).toEqual(keys);
  expect(response.body.data.entry).toMatchObject({id:entry.id,ticketNo:1,partySize:size,status:'COMPLETED',calledAt:entry.called_at.toISOString()});
  expect(response.body.data.entry.completedAt).toEqual(expect.any(String));
  expect(response.body.data.table).toEqual({id:seedIds[key],queueId:seedIds.queue,label:key==='table4'?'T1':'T2',
    capacity:key==='table4'?4:10,status:'OCCUPIED',occupiedEntryId:entry.id,occupiedTicketNo:1});
  expect((await row(entry.id)).table_id).toBe(seedIds[key]);
  expect(await terminalEvents(entry.id)).toEqual([expect.objectContaining({event_type:'COMPLETED',actor_id:await userIdByEmail(pool,host)})]);
  expect((await snapshot()).service_queues).toEqual(before.service_queues);
  expect((await request(app).get(`/api/entries/${entry.id}`).set('Cookie',await login(customer(1)))).body.data.status).toBe('COMPLETED');
  expect((await request(app).get(`/api/queues/${seedIds.queue}/entries`).set('Cookie',cookie)).body.data).toEqual([]);
});
test.each([null,[], 'text',{}, {tableId:1},{tableId:null},{tableId:'not-a-uuid'}])('TEST-41 / AC-41: invalid Seat body %j is 400 with no mutation', async body => {
  const entry=await fixture(); const before=await snapshot();
  const response=await request(app).post(`/api/entries/${entry.id}/seat`).set('Cookie',await login(host))
    .set('Content-Type','application/json').send(JSON.stringify(body));
  error(response,400,'VALIDATION_ERROR'); expect(await snapshot()).toEqual(before);
});
test('TEST-41 / AC-41: missing/malformed/oversized Seat body retains validation/error contract', async () => {
  const entry=await fixture(); const cookie=await login(host); const before=await snapshot();
  error(await call(cookie,'seat',entry.id),400,'VALIDATION_ERROR');
  error(await request(app).post(`/api/entries/${entry.id}/seat`).set('Cookie',cookie).set('Content-Type','application/json').send('{'),400,'VALIDATION_ERROR');
  error(await call(cookie,'seat',entry.id,{tableId:seedIds.table4,padding:'x'.repeat(101*1024)}),413,'PAYLOAD_TOO_LARGE');
  expect(await snapshot()).toEqual(before);
});
test.each(['CALLED','WAITING'])('TEST-41 / AC-41: missing/foreign table precedes %s state even for Host assigned to both queues', async status => {
  const entry=await fixture(status); const cookie=await login(host);
  const other=(await pool.query("INSERT INTO dining_tables(queue_id,label,capacity) VALUES ($1,'B',10) RETURNING id",[seedIds.barQueue])).rows[0].id;
  await pool.query('INSERT INTO queue_operator_assignments(queue_id,host_user_id) VALUES ($1,$2)',[seedIds.barQueue,await userIdByEmail(pool,host)]);
  const before=await snapshot();
  error(await call(cookie,'seat',entry.id,{tableId:missing}),404,'NOT_FOUND');
  error(await call(cookie,'seat',entry.id,{tableId:other}),403,'FORBIDDEN');
  expect(await snapshot()).toEqual(before);
});
test('TEST-42 / AC-42: available undersized table rejects; occupied takes precedence over capacity', async () => {
  const entry=await fixture('CALLED',{partySize:5}); const cookie=await login(host); let before=await snapshot();
  error(await call(cookie,'seat',entry.id,{tableId:seedIds.table4}),409,'INSUFFICIENT_CAPACITY');
  expect(await snapshot()).toEqual(before);
  const occupant=await insertEntry(pool,{customer:2,ticketNo:2,status:'COMPLETED'});
  await pool.query('UPDATE queue_entries SET table_id=$1 WHERE id=$2',[seedIds.table4,occupant.id]);
  await pool.query("UPDATE dining_tables SET status='OCCUPIED',occupied_entry_id=$1 WHERE id=$2",[occupant.id,seedIds.table4]);
  before=await snapshot();
  error(await call(cookie,'seat',entry.id,{tableId:seedIds.table4}),409,'TABLE_OCCUPIED');
  expect(await snapshot()).toEqual(before);
});
test('TEST-43 / AC-43: release permits later seating without erasing the previous historical link', async () => {
  const first=await fixture(); const cookie=await login(host);
  expect((await call(cookie,'seat',first.id,{tableId:seedIds.table4})).status).toBe(200);
  expect((await request(app).post(`/api/tables/${seedIds.table4}/release`).set('Cookie',cookie)).status).toBe(200);
  const second=await fixture('CALLED',{customer:2,ticketNo:2});
  expect((await call(cookie,'seat',second.id,{tableId:seedIds.table4})).status).toBe(200);
  expect((await row(first.id)).table_id).toBe(seedIds.table4);
  expect((await row(second.id)).table_id).toBe(seedIds.table4);
  expect((await table(seedIds.table4)).occupied_entry_id).toBe(second.id);
});
test.each([['table4','table4'],['table4','table10']])('TEST-44 / AC-44: concurrent Seat at %s/%s has one terminal event and occupied table', async (a,b) => {
  const entry=await fixture(); const cookie=await login(host);
  const responses=await Promise.all([a,b].map(key=>call(cookie,'seat',entry.id,{tableId:seedIds[key]})));
  expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
  error(responses.find(r=>r.status===409),409,'INVALID_TRANSITION');
  expect(await terminalEvents(entry.id)).toHaveLength(1);
  expect((await pool.query("SELECT id FROM dining_tables WHERE status='OCCUPIED'")).rows)
    .toEqual([{id:responses.find(r=>r.status===200).body.data.table.id}]);
});
test.each(['no-show','complete'])('TEST-44 / AC-44: Seat racing %s produces one transition/event and no leaked table', async operation => {
  const entry=await fixture(); const cookie=await login(host);
  const [seated,other]=await Promise.all([call(cookie,'seat',entry.id,{tableId:seedIds.table4}),call(cookie,operation,entry.id)]);
  expect([seated.status,other.status].sort()).toEqual([200,409]);
  error(seated.status===409?seated:other,409,'INVALID_TRANSITION');
  expect(await terminalEvents(entry.id)).toHaveLength(1);
  expect((await table(seedIds.table4)).status).toBe(seated.status===200?'OCCUPIED':'AVAILABLE');
  expect((await row(entry.id)).table_id).toBe(seated.status===200?seedIds.table4:null);
});
test('TEST-44 / AC-44: Seat racing Release matches a serial history and keeps the historical entry link', async () => {
  const entry=await fixture(); const cookie=await login(host);
  const [seated,released]=await Promise.all([call(cookie,'seat',entry.id,{tableId:seedIds.table4}),
    request(app).post(`/api/tables/${seedIds.table4}/release`).set('Cookie',cookie)]);
  expect(seated.status).toBe(200); expect(released.status).toBe(200);
  expect((await row(entry.id)).table_id).toBe(seedIds.table4); expect(await terminalEvents(entry.id)).toHaveLength(1);
  const final=await table(seedIds.table4);
  expect(['AVAILABLE','OCCUPIED']).toContain(final.status);
  expect(final.occupied_entry_id).toBe(final.status==='AVAILABLE'?null:entry.id);
});
test.each(['no-show','seat'])('TEST-45 / AC-45: event failure rolls back all %s changes with a generic 500', async operation => {
  const entry=await fixture(); const cookie=await login(host); const before=await snapshot();
  await pool.query(`CREATE FUNCTION f05_fail_event() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'injected f05 failure'; END; $$ LANGUAGE plpgsql`);
  await pool.query(`CREATE TRIGGER f05_fail_event BEFORE INSERT ON queue_events FOR EACH ROW
    WHEN (NEW.event_type IN ('NO_SHOW','COMPLETED')) EXECUTE FUNCTION f05_fail_event()`);
  try {
    const response=await call(cookie,operation,entry.id,{tableId:seedIds.table4});
    error(response,500,'INTERNAL_ERROR'); expect(JSON.stringify(response.body)).not.toMatch(/injected|queue_events|trigger|f05/i);
    expect(await snapshot()).toEqual(before);
  } finally { await pool.query('DROP TRIGGER f05_fail_event ON queue_events'); await pool.query('DROP FUNCTION f05_fail_event()'); }
});
test('TEST-45 / AC-45: No-show and seated history survive new app/pool with full migration chain', async () => {
  const first=await fixture(); const cookie=await login(host);
  expect((await call(cookie,'no-show',first.id)).status).toBe(200);
  const second=await fixture('CALLED',{customer:2,ticketNo:2});
  expect((await call(cookie,'seat',second.id,{tableId:seedIds.table4})).status).toBe(200);
  const fresh=createPool(process.env.TEST_DATABASE_URL);
  try {
    const otherApp=createTestApp({pool:fresh});
    for(const [email,id,status] of [[customer(1),first.id,'NO_SHOW'],[customer(2),second.id,'COMPLETED']]) {
      const response=await request(otherApp).get(`/api/entries/${id}`).set('Cookie',await login(email));
      expect(response.status).toBe(200); expect(response.body.data.status).toBe(status);
    }
    expect((await fresh.query('SELECT table_id FROM queue_entries WHERE id=$1',[second.id])).rows[0].table_id).toBe(seedIds.table4);
    expect((await fresh.query('SELECT name FROM schema_migrations ORDER BY name')).rows.map(r=>r.name.slice(0,3)))
      // Lab 7 migration 006: the expected list follows the migration files instead of a literal (impact analysis v0.6).
      .toEqual(readdirSync(new URL('../../database/migrations', import.meta.url)).filter(name=>name.endsWith('.sql')).sort().map(name=>name.slice(0,3)));
  } finally { await fresh.end(); }
});
