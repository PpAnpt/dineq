import { describe, expect, test } from 'vitest';

// Offline safety tests for docs/labs/lab-07/post-deploy-check.mjs (review findings of PR #116).
// No network and no database: a fake fetch models the server. The tool must be read-only against a shared
// deployed service: its only non-GET requests are Login (a session) and Logout (cleaning that session up).
const toolUrl = new URL('../../docs/labs/lab-07/post-deploy-check.mjs', import.meta.url);
const BASE = 'https://app.example.test';
const MAIN = '22222222-2222-4222-8222-222222222222';
const PASSWORD = 'PW-SENTINEL-1234';
const HOST_PASSWORD = 'HOSTPW-SENTINEL-5678';
const COOKIE_VALUE = 'COOKIE-SENTINEL-9999';

const baseEnv = {
  DINEQ_CUSTOMER_EMAIL: 'cust@example.test', DINEQ_CUSTOMER_PASSWORD: PASSWORD,
  DINEQ_HOST_EMAIL: 'host@example.test', DINEQ_HOST_PASSWORD: HOST_PASSWORD,
};

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

// A small fake of the deployed API. `override(call)` may return a Response to replace the default answer.
function fakeServer({ override, roles = { 'cust@example.test': 'CUSTOMER', 'host@example.test': 'HOST' }, ids = { 'cust@example.test': 'u-1', 'host@example.test': 'u-2' } } = {}) {
  const calls = [];
  const sessions = new Map();
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const call = { method: init.method ?? 'GET', path: u.pathname + u.search, headers: init.headers ?? {}, body: init.body, redirect: init.redirect, signal: init.signal, host: u.host };
    calls.push(call);
    if (override) { const r = override(call); if (r) return r; }
    if (call.method === 'POST' && u.pathname === '/api/auth/login') {
      const email = JSON.parse(call.body).email;
      const token = `${COOKIE_VALUE}-${email}`;
      sessions.set(token, email);
      return json(200, { data: { email } }, { 'set-cookie': `dineq_session=${token}; Path=/; HttpOnly` });
    }
    const email = sessions.get((call.headers.Cookie ?? '').replace('dineq_session=', ''));
    if (call.method === 'POST' && u.pathname === '/api/auth/logout') return json(200, { data: { ok: true } });
    if (u.pathname === '/api/ready') return json(200, { data: { status: 'ready', db: 'connected' } });
    if (u.pathname === '/') return new Response('<html><div id="root"></div></html>', { status: 200 });
    if (u.pathname === '/api/auth/me') return email ? json(200, { data: { id: ids[email], role: roles[email] } }) : json(401, { error: { code: 'UNAUTHENTICATED', message: 'x' } });
    if (!email) return json(401, { error: { code: 'UNAUTHENTICATED', message: 'x' } });
    if (u.pathname === '/api/queues') return json(200, { data: [{ id: MAIN, name: 'Main queue', status: 'OPEN', maxPartySize: 10 }] });
    if (u.pathname === '/api/me/entries') {
      const status = u.searchParams.get('status'); const from = u.searchParams.get('from'); const to = u.searchParams.get('to');
      if (status === 'BOGUS' || (from && to && from > to)) return json(400, { error: { code: 'VALIDATION_ERROR', message: 'bad' } });
      return json(200, { data: [{ id: 't1', queueId: MAIN, ticketNo: 3, status: 'COMPLETED' }] });
    }
    if (u.pathname === `/api/queues/${MAIN}/entries`) return roles[email] === 'HOST' ? json(200, { data: [] }) : json(403, { error: { code: 'FORBIDDEN', message: 'x' } });
    if (u.pathname === `/api/queues/${MAIN}/tables`) return roles[email] === 'HOST' ? json(200, { data: [] }) : json(403, { error: { code: 'FORBIDDEN', message: 'x' } });
    return json(404, { error: { code: 'NOT_FOUND', message: 'x' } });
  };
  return { fetchImpl, calls };
}

async function runTool({ baseUrl = BASE, env = baseEnv, server = fakeServer(), files = {} } = {}) {
  const { run } = await import(toolUrl.href);
  expect(typeof run, 'post-deploy-check.mjs must export run()').toBe('function');
  const lines = [];
  const written = {};
  const result = await run({
    baseUrl, env, fetchImpl: server.fetchImpl,
    out: (...a) => lines.push(a.join(' ')), err: (...a) => lines.push(a.join(' ')),
    readFileImpl: (p) => { if (!(p in files)) throw new Error('no such file'); return files[p]; },
    writeFileImpl: (p, c) => { written[p] = c; },
    saveBaseline: files.__save, compareBaseline: files.__compare,
  });
  return { result, output: lines.join('\n'), calls: server.calls, written };
}

const nonGet = (calls) => calls.filter(c => c.method !== 'GET').map(c => `${c.method} ${c.path}`);
const outcome = (result, id) => result.results.find(r => String(r.id) === String(id))?.outcome;

describe('Lab 7 post-deploy-check tool: read-only safety (PR #116 review)', () => {
  test('TEST-PDC-01: a URL with embedded credentials is rejected before any request and is never printed', async () => {
    const server = fakeServer();
    const { result, output, calls } = await runTool({ baseUrl: 'https://fake-user:FAKE_URL_SECRET@app.example.test', server });
    expect(result.exitCode).not.toBe(0);
    expect(calls).toHaveLength(0);
    expect(output).not.toContain('FAKE_URL_SECRET');
    expect(output).not.toContain('fake-user');
  });

  test.each([
    ['a path', 'https://app.example.test/some/path'],
    ['a query string', 'https://app.example.test/?token=QUERY_SECRET'],
    ['a fragment', 'https://app.example.test/#FRAGMENT_SECRET'],
    ['plain http on a public host', 'http://app.example.test'],
  ])('TEST-PDC-02: a base URL with %s is rejected before any request', async (_label, baseUrl) => {
    const server = fakeServer();
    const { result, output, calls } = await runTool({ baseUrl, server });
    expect(result.exitCode).not.toBe(0);
    expect(calls).toHaveLength(0);
    expect(output).not.toContain('QUERY_SECRET');
    expect(output).not.toContain('FRAGMENT_SECRET');
  });

  test('TEST-PDC-03: a full run sends no mutating request except Login and Logout (no Join, Cancel, Call Next, Complete, PATCH)', async () => {
    const { result, calls } = await runTool();
    expect(result.exitCode).toBe(0);
    expect(nonGet(calls).sort()).toEqual(['POST /api/auth/login', 'POST /api/auth/login', 'POST /api/auth/logout', 'POST /api/auth/logout']);
    expect(calls.some(c => /call-next|\/cancel|\/complete|\/seat|\/no-show|\/release/.test(c.path))).toBe(false);
  });

  test('TEST-PDC-04: a happy run passes the read-only checks and says which checks were not run', async () => {
    const { result } = await runTool();
    for (const id of ['1', '3', '3b', '7', '9', '10']) expect(outcome(result, id), `check ${id}`).toBe('PASS');
    expect(result.results.some(r => r.outcome === 'FAIL')).toBe(false);
    expect(result.results.some(r => r.outcome === 'SKIPPED' && /write|not run|manual/i.test(r.detail))).toBe(true);
  });

  test('TEST-PDC-05: a Customer slot that holds a Host account aborts after the role check and sends nothing else', async () => {
    const server = fakeServer({ roles: { 'cust@example.test': 'HOST', 'host@example.test': 'HOST' } });
    const { result, calls } = await runTool({ server });
    expect(result.exitCode).not.toBe(0);
    expect(result.results.some(r => r.outcome === 'FAIL' && /role/i.test(r.detail + r.name))).toBe(true);
    expect(calls.some(c => c.path === '/api/queues' || /entries|tables|call-next/.test(c.path))).toBe(false);
    expect(nonGet(calls).every(x => /auth\/(login|logout)$/.test(x))).toBe(true);
  });

  test('TEST-PDC-06: the Host slot must be a Host and a different account from the Customer', async () => {
    const same = fakeServer({ ids: { 'cust@example.test': 'u-1', 'host@example.test': 'u-1' } });
    const a = await runTool({ server: same });
    expect(a.result.results.some(r => r.outcome === 'FAIL' && /distinct|same account/i.test(r.detail))).toBe(true);
    expect(a.calls.some(c => c.path.includes('/tables'))).toBe(false);
    const wrong = fakeServer({ roles: { 'cust@example.test': 'CUSTOMER', 'host@example.test': 'CUSTOMER' } });
    const b = await runTool({ server: wrong });
    expect(b.result.results.some(r => r.outcome === 'FAIL' && /role/i.test(r.detail + r.name))).toBe(true);
    expect(b.calls.some(c => c.path.includes('/tables'))).toBe(false);
  });

  test('TEST-PDC-07: redirects are not followed and the credentials are not sent to another host', async () => {
    const server = fakeServer({ override: (c) => (c.path === '/api/auth/login' ? new Response(null, { status: 302, headers: { location: 'https://evil.example.test/steal' } }) : undefined) });
    const { result, calls } = await runTool({ server });
    expect(calls.every(c => c.redirect === 'manual')).toBe(true);
    expect(calls.some(c => c.host !== 'app.example.test')).toBe(false);
    expect(result.exitCode).not.toBe(0);
  });

  test('TEST-PDC-08: every request has a timeout signal', async () => {
    const { calls } = await runTool();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(c => c.signal)).toBe(true);
  });

  test('TEST-PDC-09: an unreadable history is a failure, not an empty history, and no baseline is written', async () => {
    const server = fakeServer({ override: (c) => (c.path.startsWith('/api/me/entries') ? json(500, { error: { code: 'INTERNAL_ERROR', message: 'x' } }) : undefined) });
    const { result, written } = await runTool({ server, files: { __save: 'baseline.json' } });
    expect(outcome(result, '7')).toBe('FAIL');
    expect(written['baseline.json']).toBeUndefined();
    expect(result.exitCode).not.toBe(0);
  });

  test('TEST-PDC-10: an error that carries a secret is printed without it', async () => {
    const server = fakeServer({ override: (c) => { if (c.path === '/api/queues') throw new Error('connect failed to https://u:ERR_SECRET@app.example.test token=ERR_TOKEN'); } });
    const { output } = await runTool({ server });
    expect(output).not.toContain('ERR_SECRET');
    expect(output).not.toContain('ERR_TOKEN');
  });

  test('TEST-PDC-11: passwords and session cookies never appear in the output', async () => {
    const { output } = await runTool();
    for (const secret of [PASSWORD, HOST_PASSWORD, COOKIE_VALUE]) expect(output).not.toContain(secret);
  });

  test('TEST-PDC-12: baseline compare passes when identical and fails when a ticket is missing or changed', async () => {
    const same = JSON.stringify({ tickets: [{ id: 't1', status: 'COMPLETED', ticketNo: 3 }] });
    const ok = await runTool({ files: { 'b.json': same, __compare: 'b.json' } });
    expect(outcome(ok.result, '8')).toBe('PASS');
    const lost = JSON.stringify({ tickets: [{ id: 't1', status: 'COMPLETED', ticketNo: 3 }, { id: 'gone', status: 'WAITING', ticketNo: 2 }] });
    const bad = await runTool({ files: { 'b.json': lost, __compare: 'b.json' } });
    expect(outcome(bad.result, '8')).toBe('FAIL');
    const changed = JSON.stringify({ tickets: [{ id: 't1', status: 'WAITING', ticketNo: 3 }] });
    expect(outcome((await runTool({ files: { 'b.json': changed, __compare: 'b.json' } })).result, '8')).toBe('FAIL');
  });

  test('TEST-PDC-13: the tool refuses the removed write options instead of silently ignoring them', async () => {
    const { run } = await import(toolUrl.href);
    expect(typeof run).toBe('function');
    const { parseArgs } = await import(toolUrl.href);
    expect(() => parseArgs(['--base-url', BASE, '--yes'])).toThrow();
    expect(() => parseArgs(['--base-url', BASE, '--allow-close', MAIN])).toThrow();
  });
});
