#!/usr/bin/env node
// Post-deploy check for release REL-1 (docs/labs/lab-07/release-checklist.md, section 6).
//
// Usage (Node 20+, no dependencies):
//   node docs/labs/lab-07/post-deploy-check.mjs --base-url <url>            dry run: read-only checks, lists what writes would do
//   node docs/labs/lab-07/post-deploy-check.mjs --base-url <url> --yes      also runs the checks that create tickets
//   --allow-close <queueId>   additionally close and reopen that queue (check 6); never closes anything else
//   --save-baseline <file>    write ticket ids and states of the customer account (no secrets) for check 8
//   --compare-baseline <file> compare the current history with a saved baseline (check 8)
//
// Accounts come only from environment variables; nothing secret is printed or written:
//   DINEQ_CUSTOMER_EMAIL, DINEQ_CUSTOMER_PASSWORD, DINEQ_OTHER_CUSTOMER_EMAIL, DINEQ_OTHER_CUSTOMER_PASSWORD,
//   DINEQ_HOST_EMAIL, DINEQ_HOST_PASSWORD
//
// Safety rules (the script enforces them): it never touches a ticket it did not create; it stops a write
// section if the customer already has an active ticket in the queue; the Host journey (call-next, complete)
// runs only when the Host's list contains no ticket except the script's own, otherwise it is SKIPPED;
// every ticket the script creates is cancelled or completed again. It must not be run against production
// without the owner's explicit permission (release checklist, section 8).

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const baseUrl = (option('--base-url') ?? '').replace(/\/+$/, '');
const write = flag('--yes');
const allowClose = option('--allow-close');
const saveBaseline = option('--save-baseline');
const compareBaseline = option('--compare-baseline');
if (!/^https?:\/\//.test(baseUrl)) {
  console.error('Usage: node post-deploy-check.mjs --base-url <http(s)://host> [--yes] [--allow-close <queueId>]');
  process.exit(2);
}
const origin = new URL(baseUrl).origin;
const env = (name) => process.env[name] ?? '';

// ---- tiny HTTP client with a cookie jar per account -------------------------------------------------
class Client {
  constructor(role) { this.role = role; this.cookie = ''; }
  async call(method, path, body) {
    const headers = { Origin: origin };
    if (this.cookie) headers.Cookie = this.cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(baseUrl + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const line of setCookie) {
      const pair = line.split(';')[0];
      if (pair.startsWith('dineq_session=')) this.cookie = pair;
    }
    let json = null;
    try { json = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, body: json, data: json?.data, code: json?.error?.code, message: json?.error?.message ?? '' };
  }
  async login(email, password) {
    if (!email || !password) return false;
    const r = await this.call('POST', '/api/auth/login', { email, password });
    return r.status === 200;
  }
}

// ---- result table ------------------------------------------------------------------------------------
const results = [];
const bangkok = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }) + ' (Asia/Bangkok)';
function record(id, name, outcome, detail) {
  results.push({ id, name, outcome, detail, time: bangkok() });
  console.log(`${outcome.padEnd(7)} ${String(id).padEnd(3)} ${name} - ${detail}`);
}
const pass = (id, name, detail) => record(id, name, 'PASS', detail);
const fail = (id, name, detail) => record(id, name, 'FAIL', detail);
const skip = (id, name, detail) => record(id, name, 'SKIPPED', detail);
const check = (id, name, ok, detail) => (ok ? pass : fail)(id, name, detail);

const customer = new Client('CUSTOMER');
const other = new Client('CUSTOMER2');
const host = new Client('HOST');
const created = []; // tickets this script created and has not closed yet

async function cleanup() {
  for (const id of [...created]) {
    const r = await customer.call('POST', `/api/entries/${id}/cancel`);
    if (r.status === 200) created.splice(created.indexOf(id), 1);
  }
}

async function main() {
  console.log(`Target: ${baseUrl}   mode: ${write ? 'WRITE (--yes)' : 'DRY RUN (read-only)'}   ${bangkok()}\n`);

  // 1. Login page and readiness (public).
  const ready = await customer.call('GET', '/api/ready');
  const page = await fetch(baseUrl + '/');
  const html = page.ok ? await page.text() : '';
  check(1, 'Login page served and /api/ready is ready', page.ok && ready.status === 200 && ready.data?.status === 'ready',
    `GET / ${page.status}; /api/ready ${ready.status}; release label text ${/release-label|Lab \d+ release/i.test(html) ? 'present in the HTML' : 'rendered by the client (check on screen)'}`);

  const haveCustomer = await customer.login(env('DINEQ_CUSTOMER_EMAIL'), env('DINEQ_CUSTOMER_PASSWORD'));
  if (!haveCustomer) {
    skip('2-9', 'Everything that needs a Customer', 'DINEQ_CUSTOMER_EMAIL / DINEQ_CUSTOMER_PASSWORD missing or login failed');
    return;
  }

  // 3. Queue list shows maxPartySize on every queue.
  const queues = await customer.call('GET', '/api/queues');
  const list = Array.isArray(queues.data) ? queues.data : [];
  const withLimit = list.length > 0 && list.every((q) => Number.isInteger(q.maxPartySize));
  check(3, 'GET /api/queues has maxPartySize on every queue', queues.status === 200 && withLimit,
    `status ${queues.status}; ` + list.map((q) => `${q.name ?? '?'}=${q.maxPartySize}/${q.status}`).join(', '));
  const main = list.find((q) => q.id === '22222222-2222-4222-8222-222222222222');
  if (main) check('3b', 'Main queue limit is 10 (migration 006)', main.maxPartySize === 10, `maxPartySize ${main.maxPartySize}`);
  const target = main ?? list.find((q) => q.status === 'OPEN');
  if (!target) { skip('4-7', 'Write checks', 'no OPEN queue found'); return; }

  // 7 (read part) and 8: history, always read-only.
  const history = await customer.call('GET', '/api/me/entries');
  const badRange = await customer.call('GET', '/api/me/entries?from=2026-12-31T00:00:00Z&to=2026-01-01T00:00:00Z');
  const badStatus = await customer.call('GET', '/api/me/entries?status=BOGUS');
  const filtered = await customer.call('GET', '/api/me/entries?status=COMPLETED&from=2020-01-01T00:00:00Z');
  check(7, 'History filter: valid filter 200, reversed range 400, bad status 400',
    history.status === 200 && filtered.status === 200 && badRange.status === 400 && badStatus.status === 400
      && (filtered.data ?? []).every((t) => t.status === 'COMPLETED'),
    `all ${history.status}, filtered ${filtered.status} (${(filtered.data ?? []).length} rows), reversed ${badRange.status}, bad status ${badStatus.status}`);

  if (saveBaseline && history.status === 200) {
    writeFileSync(saveBaseline, JSON.stringify({ savedAt: new Date().toISOString(),
      tickets: history.data.map((t) => ({ id: t.id, status: t.status, ticketNo: t.ticketNo })) }, null, 2));
    console.log(`        baseline saved: ${history.data.length} tickets -> ${saveBaseline}`);
  }
  if (compareBaseline) {
    const base = JSON.parse(readFileSync(compareBaseline, 'utf8'));
    const now = new Map((history.data ?? []).map((t) => [t.id, t.status]));
    const lost = base.tickets.filter((t) => !now.has(t.id));
    const changed = base.tickets.filter((t) => now.has(t.id) && now.get(t.id) !== t.status);
    check(8, 'Persistence: every baseline ticket still exists with the same state', lost.length === 0 && changed.length === 0,
      `${base.tickets.length} in baseline, ${lost.length} missing, ${changed.length} changed state`);
  } else {
    skip(8, 'Persistence across revision/restart', 'needs --save-baseline before and --compare-baseline after the deploy');
  }

  // 9. Forbidden cases (read-only: 403 must happen before anything changes).
  const hostQueuesAsCustomer = await customer.call('GET', `/api/queues/${target.id}/entries`);
  const callAsCustomer = await customer.call('POST', `/api/queues/${target.id}/call-next`);
  check(9, 'Customer on Host endpoints gets 403 with no private data',
    hostQueuesAsCustomer.status === 403 && callAsCustomer.status === 403 && !JSON.stringify(hostQueuesAsCustomer.body).includes('@'),
    `list ${hostQueuesAsCustomer.status} ${hostQueuesAsCustomer.code ?? ''}; call-next ${callAsCustomer.status} ${callAsCustomer.code ?? ''}`);

  const haveHost = await host.login(env('DINEQ_HOST_EMAIL'), env('DINEQ_HOST_PASSWORD'));
  if (haveHost) {
    const tables = await host.call('GET', `/api/queues/${target.id}/tables`);
    check(10, 'Host table list answers (F-05 deployed)', tables.status === 200 && Array.isArray(tables.data),
      `status ${tables.status}; ${Array.isArray(tables.data) ? tables.data.length + ' tables' : 'no list'}`);
  } else {
    skip(10, 'Host table list', 'host credentials missing or login failed');
  }

  if (!write) {
    skip('2,4,5,6,9b', 'Checks that create tickets', 'dry run: add --yes (needs the owner\'s permission for production)');
    return;
  }

  // ---- write section: refuse if the customer already has an active ticket in the queue -------------
  const active = (history.data ?? []).filter((t) => t.queueId === target.id && ['WAITING', 'CALLED'].includes(t.status));
  if (active.length > 0) {
    skip('2,4,5,6,9b', 'Checks that create tickets', `customer already has ${active.length} active ticket(s) in the queue; not touching them`);
    return;
  }
  const limit = target.maxPartySize;

  // 4. Party size limit: over limit rejected, limit accepted, then a smaller size after cancelling.
  const tooMany = await customer.call('POST', `/api/queues/${target.id}/entries`, { partySize: limit + 1 });
  check(4, `Join with ${limit + 1} is rejected (INVALID_PARTY_SIZE naming the limit)`,
    tooMany.status === 400 && tooMany.code === 'INVALID_PARTY_SIZE' && tooMany.message.includes(String(limit)),
    `status ${tooMany.status} ${tooMany.code ?? ''}`);
  const atLimit = await customer.call('POST', `/api/queues/${target.id}/entries`, { partySize: limit });
  if (atLimit.status === 201) created.push(atLimit.data.id);
  check('4b', `Join with ${limit} (the limit) is accepted`, atLimit.status === 201 && atLimit.data?.status === 'WAITING',
    `status ${atLimit.status} ticket ${atLimit.data?.ticketNo ?? '-'}`);
  if (atLimit.status !== 201) return;

  // 5. Cancel, then join again with 9 (or the limit if smaller): new ticket number.
  const cancelled = await customer.call('POST', `/api/entries/${atLimit.data.id}/cancel`);
  if (cancelled.status === 200) created.splice(created.indexOf(atLimit.data.id), 1);
  const size = Math.min(9, limit);
  const again = await customer.call('POST', `/api/queues/${target.id}/entries`, { partySize: size });
  if (again.status === 201) created.push(again.data.id);
  check(5, 'Cancel a WAITING ticket, then join again gets a new ticket number',
    cancelled.status === 200 && cancelled.data?.status === 'CANCELLED' && again.status === 201 && again.data.ticketNo > atLimit.data.ticketNo,
    `cancel ${cancelled.status} ${cancelled.data?.status ?? ''}; rejoin ${again.status} ticket ${again.data?.ticketNo ?? '-'} (was ${atLimit.data.ticketNo}), party ${size}`);
  if (again.status !== 201) { await cleanup(); return; }

  // 9b. Another customer cannot cancel this ticket.
  if (await other.login(env('DINEQ_OTHER_CUSTOMER_EMAIL'), env('DINEQ_OTHER_CUSTOMER_PASSWORD'))) {
    const steal = await other.call('POST', `/api/entries/${again.data.id}/cancel`);
    const still = await customer.call('GET', `/api/entries/${again.data.id}`);
    check('9b', "Another Customer's cancel is 403 and the ticket stays WAITING", steal.status === 403 && still.data?.status === 'WAITING',
      `status ${steal.status} ${steal.code ?? ''}; owner still sees ${still.data?.status ?? still.status}`);
  } else {
    skip('9b', "Another Customer's cancel", 'second customer credentials missing or login failed');
  }

  // 2. Sprint 1 journey, only when the script's ticket is the only one the Host sees.
  if (haveHost) {
    const waiting = await host.call('GET', `/api/queues/${target.id}/entries`);
    const rows = waiting.data ?? [];
    const onlyOurs = waiting.status === 200 && rows.length === 1 && rows[0].id === again.data.id;
    if (onlyOurs) {
      const called = await host.call('POST', `/api/queues/${target.id}/call-next`);
      const done = called.status === 200 ? await host.call('POST', `/api/entries/${again.data.id}/complete`) : called;
      if (done.status === 200) created.splice(created.indexOf(again.data.id), 1);
      const seen = await customer.call('GET', `/api/entries/${again.data.id}`);
      check(2, 'Sprint 1 journey: join, Host calls next, Host completes, Customer sees COMPLETED',
        called.status === 200 && done.status === 200 && seen.data?.status === 'COMPLETED',
        `call-next ${called.status}; complete ${done.status}; customer sees ${seen.data?.status ?? seen.status}`);
    } else {
      skip(2, 'Sprint 1 journey (Host call-next and complete)',
        `the Host's list has ${rows.length} ticket(s) besides/including ours; call-next would take the oldest one, so it was not run`);
    }
  } else {
    skip(2, 'Sprint 1 journey', 'host credentials missing or login failed');
  }

  // 6. Close and reopen, only for the queue named with --allow-close.
  if (allowClose && haveHost) {
    const before = (await customer.call('GET', '/api/queues')).data?.find((q) => q.id === allowClose);
    if (!before || before.status !== 'OPEN') {
      skip(6, 'Close and reopen', 'the allowed queue is missing or not OPEN');
    } else {
      await cleanup(); // the customer must not hold an active ticket while we test the closed join
      const closed = await host.call('PATCH', `/api/queues/${allowClose}`, { status: 'CLOSED' });
      const joinClosed = await customer.call('POST', `/api/queues/${allowClose}/entries`, { partySize: 1 });
      const reopened = await host.call('PATCH', `/api/queues/${allowClose}`, { status: 'OPEN' });
      check(6, 'Host closes and reopens; Join while closed is 409 QUEUE_CLOSED',
        closed.status === 200 && joinClosed.status === 409 && joinClosed.code === 'QUEUE_CLOSED' && reopened.status === 200,
        `close ${closed.status}; join while closed ${joinClosed.status} ${joinClosed.code ?? ''}; reopen ${reopened.status}`);
      if (reopened.status !== 200) console.error('WARNING: the queue may still be CLOSED; reopen it by hand.');
    }
  } else {
    skip(6, 'Close and reopen', 'not requested (--allow-close <queueId>) or no host login');
  }
}

try {
  await main();
} catch (error) {
  fail('!', 'Unexpected error', error.message);
} finally {
  try { await cleanup(); } catch { /* reported below */ }
  if (created.length) console.error(`WARNING: ${created.length} ticket(s) created by this run are still open: ${created.join(', ')}`);
  const count = (o) => results.filter((r) => r.outcome === o).length;
  console.log(`\nSummary: ${count('PASS')} PASS, ${count('FAIL')} FAIL, ${count('SKIPPED')} SKIPPED   (${bangkok()})`);
  process.exitCode = count('FAIL') > 0 || created.length > 0 ? 1 : 0;
}
