#!/usr/bin/env node
// Read-only post-deploy check for release REL-1 (docs/labs/lab-07/release-checklist.md, section 6).
//
// Usage (Node 20+, no dependencies):
//   node docs/labs/lab-07/post-deploy-check.mjs --base-url https://<service>
//   --save-baseline <file>     write ticket ids, states and numbers of the Customer account (no secrets)
//   --compare-baseline <file>  compare the current history with a saved baseline (check 8)
//
// Accounts come only from environment variables; nothing secret is printed or written:
//   DINEQ_CUSTOMER_EMAIL, DINEQ_CUSTOMER_PASSWORD  (required, must be a CUSTOMER account)
//   DINEQ_HOST_EMAIL, DINEQ_HOST_PASSWORD          (optional, must be a HOST account, a different user)
//
// What it does and does not do (safe for a shared deployed service):
//  - Every request except Login and Logout is a GET. Login creates a session and Logout ends it; these are the only
//    writes it makes (so it is not "zero database writes": a session row is created and deleted).
//  - It never joins, cancels, calls next, completes, seats, releases or opens/closes anything. Those checks are
//    SKIPPED and must be done by a person (or are covered by the recorded local E2E run).
//  - It verifies with GET /api/auth/me that the Customer slot is a CUSTOMER, the Host slot is a HOST and that they
//    are different users, before any other check. On a mismatch it stops.
//  - It accepts only a bare origin (https, or http for localhost), never follows a redirect, puts a timeout on every
//    request, and prints only its own allowlisted messages (never raw error text, URLs, passwords or cookies).

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const MAIN_QUEUE = '22222222-2222-4222-8222-222222222222';
const TIMEOUT_MS = 10000;

export function parseArgs(argv) {
  const opts = { baseUrl: '', saveBaseline: undefined, compareBaseline: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base-url') opts.baseUrl = argv[++i] ?? '';
    else if (arg === '--save-baseline') opts.saveBaseline = argv[++i];
    else if (arg === '--compare-baseline') opts.compareBaseline = argv[++i];
    else throw new Error('Unknown option (the write options were removed; this tool is read-only)');
  }
  return opts;
}

// Returns the origin, or null when the value is not a bare, safe origin.
export function safeOrigin(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) return null;
  if (url.username || url.password || url.search || url.hash) return null;
  if (url.pathname !== '/' || /[?#]/.test(value.replace(/^[a-z]+:\/\/[^/]*/i, '').slice(1))) return null;
  return url.origin;
}

class Session {
  constructor(origin, fetchImpl) { this.origin = origin; this.fetchImpl = fetchImpl; this.cookie = ''; }
  async call(method, path, body) {
    const headers = { Origin: this.origin };
    if (this.cookie) headers.Cookie = this.cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await this.fetchImpl(this.origin + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const pair = line.split(';')[0];
      if (pair.startsWith('dineq_session=')) this.cookie = pair;
    }
    let json = null;
    try { json = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, data: json?.data, code: json?.error?.code };
  }
  async login(email, password) {
    const r = await this.call('POST', '/api/auth/login', { email, password });
    return r.status === 200;
  }
  async me() {
    const r = await this.call('GET', '/api/auth/me');
    return r.status === 200 ? r.data : null;
  }
  async logout() {
    if (!this.cookie) return;
    try { await this.call('POST', '/api/auth/logout'); } catch { /* reported by the caller's summary */ }
  }
}

export async function run({
  baseUrl, env = process.env, fetchImpl = fetch, out = console.log, err = console.error,
  readFileImpl = (p) => readFileSync(p, 'utf8'), writeFileImpl = (p, c) => writeFileSync(p, c),
  saveBaseline, compareBaseline,
} = {}) {
  const results = [];
  const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }) + ' (Asia/Bangkok)';
  const record = (id, name, outcome, detail) => {
    results.push({ id, name, outcome, detail, time: stamp() });
    out(`${outcome.padEnd(7)} ${String(id).padEnd(3)} ${name} - ${detail}`);
  };
  const check = (id, name, ok, detail) => record(id, name, ok ? 'PASS' : 'FAIL', detail);
  const finish = () => {
    const count = (o) => results.filter((r) => r.outcome === o).length;
    out(`\nSummary: ${count('PASS')} PASS, ${count('FAIL')} FAIL, ${count('SKIPPED')} SKIPPED   (${stamp()})`);
    return { results, exitCode: count('FAIL') > 0 ? 1 : 0 };
  };

  const origin = safeOrigin(baseUrl ?? '');
  if (!origin) {
    err('Refused: --base-url must be a bare https origin (http only for localhost): no credentials, path, query or fragment.');
    return { results, exitCode: 2 };
  }
  out(`Target: ${origin}   mode: READ-ONLY (Login/Logout are the only writes)   ${stamp()}\n`);

  const customer = new Session(origin, fetchImpl);
  const host = new Session(origin, fetchImpl);
  const safe = async (label, fn) => {
    try { return await fn(); } catch (e) { record('!', label, 'FAIL', `request failed (${e?.name === 'TimeoutError' ? 'timeout' : 'network or parsing error'})`); return null; }
  };

  try {
    // 1. Public: readiness and the UI root.
    const anon = new Session(origin, fetchImpl);
    const ready = await safe('Readiness', () => anon.call('GET', '/api/ready'));
    const page = await safe('UI root', async () => {
      const res = await fetchImpl(origin + '/', { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
      return { status: res.status, ok: res.status === 200 && /id="root"/.test(await res.text()) };
    });
    check(1, 'UI root served and /api/ready is ready', ready?.status === 200 && ready?.data?.status === 'ready' && page?.ok === true,
      `/api/ready ${ready?.status ?? '-'}; GET / ${page?.status ?? '-'}; the release label text is rendered by the client and must be read on screen`);

    // Accounts: login, then verify the role and that the two slots are different users, before anything else.
    if (!env.DINEQ_CUSTOMER_EMAIL || !env.DINEQ_CUSTOMER_PASSWORD) {
      record('2-9', 'Everything that needs a Customer', 'SKIPPED', 'customer credentials not provided');
      return finish();
    }
    const loggedIn = await safe('Customer login', () => customer.login(env.DINEQ_CUSTOMER_EMAIL, env.DINEQ_CUSTOMER_PASSWORD));
    const who = loggedIn ? await safe('Customer identity', () => customer.me()) : null;
    if (!who || who.role !== 'CUSTOMER') {
      record('A', 'Customer account role', 'FAIL', who ? `the Customer slot holds a ${String(who.role).slice(0, 12)} account (role mismatch); stopped before any other check` : 'login failed or identity unreadable; stopped');
      return finish();
    }
    record('A', 'Customer account role', 'PASS', 'GET /api/auth/me reports CUSTOMER');

    let hostOk = false;
    if (env.DINEQ_HOST_EMAIL && env.DINEQ_HOST_PASSWORD) {
      const hostIn = await safe('Host login', () => host.login(env.DINEQ_HOST_EMAIL, env.DINEQ_HOST_PASSWORD));
      const hostWho = hostIn ? await safe('Host identity', () => host.me()) : null;
      if (!hostWho || hostWho.role !== 'HOST') {
        record('B', 'Host account role', 'FAIL', hostWho ? `the Host slot holds a ${String(hostWho.role).slice(0, 12)} account (role mismatch); Host checks skipped` : 'login failed or identity unreadable; Host checks skipped');
      } else if (hostWho.id === who.id) {
        record('B', 'Host account is a different user', 'FAIL', 'the Host and Customer slots are the same account (not distinct); Host checks skipped');
      } else {
        hostOk = true;
        record('B', 'Host account role', 'PASS', 'GET /api/auth/me reports HOST, different user from the Customer');
      }
    } else {
      record('B', 'Host checks', 'SKIPPED', 'host credentials not provided');
    }

    // Public read after the role checks: no session means 401.
    const unauth = await safe('Unauthenticated read', () => anon.call('GET', '/api/queues'));
    check('1b', 'GET /api/queues without a session is 401', unauth?.status === 401, `status ${unauth?.status ?? '-'}`);

    // 3. Queue list.
    const queues = await safe('Queue list', () => customer.call('GET', '/api/queues'));
    const list = Array.isArray(queues?.data) ? queues.data : [];
    check(3, 'GET /api/queues has maxPartySize on every queue', queues?.status === 200 && list.length > 0 && list.every((q) => Number.isInteger(q.maxPartySize)),
      `status ${queues?.status ?? '-'}; ` + list.map((q) => `${q.name ?? '?'}=${q.maxPartySize}/${q.status}`).join(', '));
    const main = list.find((q) => q.id === MAIN_QUEUE);
    if (main) check('3b', 'Main queue limit is 10 (migration 006)', main.maxPartySize === 10, `maxPartySize ${main.maxPartySize}`);
    const target = main ?? list[0];

    // 7 and 8. History: reads only. A failed read is a failure, never an empty history.
    const history = await safe('History', () => customer.call('GET', '/api/me/entries'));
    const historyOk = history?.status === 200 && Array.isArray(history.data);
    if (!historyOk) {
      record(7, 'History filter', 'FAIL', `history could not be read (status ${history?.status ?? '-'}); no baseline written or compared`);
    } else {
      const badRange = await safe('Reversed range', () => customer.call('GET', '/api/me/entries?from=2026-12-31T00:00:00Z&to=2026-01-01T00:00:00Z'));
      const badStatus = await safe('Bad status', () => customer.call('GET', '/api/me/entries?status=BOGUS'));
      const filtered = await safe('Filtered', () => customer.call('GET', '/api/me/entries?status=COMPLETED&from=2020-01-01T00:00:00Z'));
      check(7, 'History filter: valid filter 200, reversed range 400, bad status 400',
        filtered?.status === 200 && badRange?.status === 400 && badStatus?.status === 400 && (filtered.data ?? []).every((t) => t.status === 'COMPLETED'),
        `all ${history.status}, filtered ${filtered?.status ?? '-'} (${(filtered?.data ?? []).length} rows), reversed ${badRange?.status ?? '-'}, bad status ${badStatus?.status ?? '-'}`);
      if (saveBaseline) {
        writeFileImpl(saveBaseline, JSON.stringify({ savedAt: new Date().toISOString(),
          tickets: history.data.map((t) => ({ id: t.id, status: t.status, ticketNo: t.ticketNo })) }, null, 2));
        out(`        baseline saved: ${history.data.length} tickets`);
      }
      if (compareBaseline) {
        let base = null;
        try { base = JSON.parse(readFileImpl(compareBaseline)); } catch { /* reported below */ }
        if (!base || !Array.isArray(base.tickets)) {
          record(8, 'Persistence compare', 'FAIL', 'the baseline file could not be read');
        } else {
          const now = new Map(history.data.map((t) => [t.id, t.status]));
          const lost = base.tickets.filter((t) => !now.has(t.id));
          const changed = base.tickets.filter((t) => now.has(t.id) && now.get(t.id) !== t.status);
          check(8, 'Persistence: every baseline ticket still exists with the same state', lost.length === 0 && changed.length === 0,
            `${base.tickets.length} in baseline, ${lost.length} missing, ${changed.length} changed state`);
        }
      } else {
        record(8, 'Persistence across revision or restart', 'SKIPPED', 'needs --save-baseline before and --compare-baseline after the change');
      }
    }

    // 9. Forbidden role, read-only form: a Customer must not read the Host list (GET only).
    if (target) {
      const hostList = await safe('Customer on Host list', () => customer.call('GET', `/api/queues/${target.id}/entries`));
      const body = JSON.stringify(hostList ?? {});
      check(9, 'Customer reading the Host waiting list gets 403 with no private data', hostList?.status === 403 && !body.includes('@'),
        `status ${hostList?.status ?? '-'} ${hostList?.code ?? ''}`);
    }

    // 10. Host table list (read-only).
    if (hostOk && target) {
      const tables = await safe('Tables', () => host.call('GET', `/api/queues/${target.id}/tables`));
      check(10, 'Host table list answers (F-05 deployed)', tables?.status === 200 && Array.isArray(tables.data),
        `status ${tables?.status ?? '-'}; ${Array.isArray(tables?.data) ? tables.data.length + ' tables' : 'no list'}`);
    } else {
      record(10, 'Host table list', 'SKIPPED', 'no verified Host account');
    }

    record('2,4,5,6', 'Checks that write data', 'SKIPPED',
      'not run by this read-only tool: join, party size limit, cancel, Host Call Next and Complete, close and reopen are manual checks (or covered by the recorded local E2E run)');
  } finally {
    await customer.logout();
    await host.logout();
  }
  return finish();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  const { exitCode } = await run({ ...opts });
  process.exitCode = exitCode;
}
