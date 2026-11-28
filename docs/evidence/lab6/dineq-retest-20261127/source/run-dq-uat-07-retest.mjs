import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Targeted DQ-UAT-07 retest only. Never resets data or performs cloud/database operations.
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.env.HAIRROOT_REPO || 'C:\\Users\\Titinan\\.codex\\worktrees\\lab5-deploy-workflow\\hairroot';
const require = createRequire(path.join(repo, 'e2e', 'package.json'));
const { chromium } = require('playwright');
const BASE = 'https://s21271a0d-4d7hbszvwq-as.a.run.app';
const COMMIT = '1ffb8b09b8df7f6b6954047ccdef4c2ccc113931';
const REVISION = 's21271a0d-00007-pnb';
const IMAGE = 'sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47';
const ACC = {
  C1: ['customer03@dineq.test', process.env.DQ_PASSWORD_C1],
  C2: ['customer04@dineq.test', process.env.DQ_PASSWORD_C2],
  H1: ['host1@dineq.test', process.env.DQ_PASSWORD_H1],
};
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const imageDir = path.join(here, 'screenshots', stamp);
const resultDir = path.join(here, 'results');
mkdirSync(imageDir, { recursive: true });
mkdirSync(resultDir, { recursive: true });
const results = [];
const evidence = { base: BASE, fullCommit: COMMIT, revision: REVISION, runtimeManifestDigest: IMAGE, queue: null, tickets: {}, steps: [] };
let browser, lastPage;
const check = (ok, message) => { if (!ok) throw new Error(message); };
function record(step, status, expected, actual, evidenceId = null) {
  const row = { step, status, expected, actual, evidenceId, at: new Date().toISOString() };
  results.push(row); evidence.steps.push(row); console.log(`${step}: ${status} — ${actual}`);
}
async function api(page, method, route, body) {
  return page.evaluate(async ({ method, route, body }) => {
    const r = await fetch('/api' + route, { method, credentials: 'same-origin', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
    return { status: r.status, body: r.status === 204 ? null : await r.json().catch(() => null) };
  }, { method, route, body });
}
function expect(r, status, code, label) {
  check(r.status === status, `${label}: expected HTTP ${status}, got ${r.status}`);
  if (code) check(r.body?.error?.code === code, `${label}: expected ${code}, got ${r.body?.error?.code}`);
}
async function context() { return browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'Asia/Bangkok' }); }
async function login(role) {
  const [email, password] = ACC[role];
  check(password, `Missing private DQ_PASSWORD_${role}; no login or mutation attempted.`);
  const ctx = await context(), page = await ctx.newPage(); lastPage = page;
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const wait = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/auth/login');
  await page.getByTestId('login-submit').click();
  const res = await wait;
  check(res.status() === 200, `${role} login failed with HTTP ${res.status()}; stopped before queue changes.`);
  await page.waitForURL(u => u.pathname !== '/login', { timeout: 20000 });
  const me = await api(page, 'GET', '/auth/me');
  const expectedRole = role === 'H1' ? 'HOST' : 'CUSTOMER';
  check(me.status === 200 && me.body?.data?.role === expectedRole, `${role} did not authenticate as ${expectedRole}.`);
  return { ctx, page };
}
async function screenshot(page, id) {
  lastPage = page;
  const p = new URL(page.url()).pathname;
  if (p === '/login') { const pw = page.getByLabel('Password', { exact: true }); if (await pw.count()) await pw.fill(''); }
  if (p.startsWith('/host/queues/')) await page.getByRole('heading', { name: 'Host queue' }).waitFor({ state: 'visible', timeout: 20000 });
  if (p === '/my-queue') await page.getByRole('heading', { name: 'My queue' }).waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Checking session...') && !document.body.innerText.includes('Loading...'), null, { timeout: 20000 });
  const text = `DineQ DQ-UAT-07 | ${id} | ${new Date().toISOString()} | ${page.url()}`;
  await page.evaluate(t => { const e = document.createElement('div'); e.id = '__uat_evidence'; e.textContent = t; e.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#111;color:#7CFC00;font:12px monospace;padding:5px;overflow-wrap:anywhere'; document.body.appendChild(e); }, text);
  await page.screenshot({ path: path.join(imageDir, `${id}.png`), fullPage: true });
  await page.evaluate(() => document.getElementById('__uat_evidence')?.remove());
}
const active = rows => rows.filter(x => ['WAITING', 'CALLED'].includes(x.status));
async function ownEntries(page) { const r = await api(page, 'GET', '/me/entries'); check(r.status === 200 && Array.isArray(r.body?.data), 'Could not verify customer-owned tickets.'); return r.body.data; }
async function hostEntries(page, qid) { const r = await api(page, 'GET', `/queues/${qid}/entries`); check(r.status === 200 && Array.isArray(r.body?.data), 'Could not verify Host queue.'); return r.body.data; }
async function join(s, qid, partySize, label) {
  const before = await ownEntries(s.page);
  const beforeIds = new Set(before.map(x => x.id));
  await s.page.goto(`${BASE}/queues`);
  await s.page.getByLabel('Party size (1–8)', { exact: true }).fill(String(partySize));
  const wait = s.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === `/api/queues/${qid}/entries`);
  await s.page.getByTestId('join-queue').click(); const res = await wait; const body = await res.json().catch(() => null);
  expect({ status: res.status(), body }, 201, null, `${label} Join`);
  const after = await ownEntries(s.page);
  const created = after.filter(x => !beforeIds.has(x.id));
  check(created.length === 1, `${label} Join returned 201 but owner list did not show exactly one new ticket; stop for manual reconciliation.`);
  const ticket = created[0];
  check(ticket?.id && ticket.status === 'WAITING' && Number(ticket.partySize) === partySize && Number.isInteger(Number(ticket.ticketNo)), `${label} owner read-back is missing the actual ticket ID/number or expected fields.`);
  evidence.tickets[label] = { id: ticket.id, ticketNo: Number(ticket.ticketNo), partySize: Number(ticket.partySize), status: ticket.status };
  await s.page.waitForURL('**/my-queue'); await screenshot(s.page, `${label}-waiting`);
  record(label === 'T07A' ? 1 : 1, 'PASS', `Join returns 201; ticket WAITING, partySize ${partySize}`, `ticketNo ${ticket.ticketNo}, UUID ${ticket.id}, WAITING`, `${label}-waiting`);
  return ticket;
}
async function inspectOnly() {
  check(ACC.C1[1] && ACC.H1[1], 'Read-only inspect needs private C1 and H1 credentials.');
  const c1 = await login('C1'), h1 = await login('H1');
  const qr = await api(h1.page, 'GET', '/queues');
  check(qr.status === 200 && Array.isArray(qr.body?.data), 'Queue list unavailable.');
  const q = qr.body.data.find(x => x.restaurant?.name === 'DineQ Demo Restaurant') || qr.body.data[0];
  check(q?.id, 'No queue ID found.');
  const [owned, rows] = await Promise.all([ownEntries(c1.page), hostEntries(h1.page, q.id)]);
  const out = {
    inspectedAt: new Date().toISOString(),
    queue: { id: q.id, status: q.status, active: active(rows).map(x => ({ id: x.id, ticketNo: x.ticketNo, partySize: x.partySize, status: x.status })) },
    c1Active: active(owned).map(x => ({ id: x.id, ticketNo: x.ticketNo, partySize: x.partySize, status: x.status })),
  };
  console.log(`READ_ONLY_INSPECT ${JSON.stringify(out)}`);
  await screenshot(h1.page, 'inspection-host-queue');
  await screenshot(c1.page, 'inspection-c1-tickets');
  await Promise.all([c1.ctx.close(), h1.ctx.close()]);
  return out;
}
async function hostCallNext(h, qid, expectedId, evidenceId) {
  const before = await hostEntries(h.page, qid);
  check(active(before).length >= 1, 'Active queue changed before Call Next; stopped without action.');
  const ordered = [...before].sort((a, b) => a.ticketNo - b.ticketNo);
  check(ordered[0].id === expectedId && ordered[0].status === 'WAITING' && !ordered.some(x => x.status === 'CALLED'), 'FIFO precondition changed; stopped before Call Next.');
  await h.page.goto(`${BASE}/host/queues/${qid}`);
  const wait = h.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === `/api/queues/${qid}/call-next`);
  await h.page.getByTestId('call-next').click(); const res = await wait; const body = await res.json().catch(() => null);
  expect({ status: res.status(), body }, 200, null, 'Call Next');
  check(body?.data?.id === expectedId && body.data.status === 'CALLED', 'Call Next selected an unexpected ticket; stopped without completing any ticket.');
  await screenshot(h.page, evidenceId);
  return body.data;
}
async function resumeFinalB() {
  check(process.env.DQ_ALLOW_MUTATIONS === 'USER_REQUESTED', 'Missing explicit authorization for the controlled UAT mutations.');
  for (const role of ['C1', 'C2', 'H1']) check(ACC[role][1], `Missing private ${role} password.`);
  const aid = process.env.DQ_T07A_ID, bid = process.env.DQ_T07B_ID;
  check(aid && bid, 'Missing the recorded T07A/T07B UUIDs.');
  const c1 = await login('C1'), c2 = await login('C2'), h1 = await login('H1');
  const qr = await api(h1.page, 'GET', '/queues');
  check(qr.status === 200 && Array.isArray(qr.body?.data), 'Queue list unavailable.');
  const q = qr.body.data.find(x => x.restaurant?.name === 'DineQ Demo Restaurant') || qr.body.data[0];
  check(q?.id && q.status === 'OPEN', 'Queue not OPEN; no Host action performed.');
  const [a, b, rows] = await Promise.all([api(c1.page, 'GET', `/entries/${aid}`), api(c2.page, 'GET', `/entries/${bid}`), hostEntries(h1.page, q.id)]);
  check(a.status === 200 && a.body?.data?.status === 'COMPLETED', 'T07A is not the expected completed ticket; no action performed.');
  check(b.status === 200 && b.body?.data?.status === 'WAITING' && Number(b.body.data.partySize) === 5, 'T07B is not the expected WAITING party-size-5 ticket; no action performed.');
  const act = active(rows);
  check(act.length === 1 && act[0].id === bid && act[0].status === 'WAITING', 'Queue has an unrelated or unexpected active ticket; no action performed.');
  evidence.queue = { id: q.id, name: q.restaurant?.name ?? q.name ?? null, status: q.status };
  evidence.tickets = {
    T07A: { id: aid, ticketNo: Number(a.body.data.ticketNo), partySize: Number(a.body.data.partySize), status: a.body.data.status },
    T07B: { id: bid, ticketNo: Number(b.body.data.ticketNo), partySize: Number(b.body.data.partySize), status: b.body.data.status },
  };
  const called = await hostCallNext(h1, q.id, bid, 'step8-B-called');
  record(8, 'PASS', 'Call Next returns B after A is completed', `B #${called.ticketNo} CALLED; verified UUID ${bid}`, 'step8-B-called');
  const done = await complete(h1, q.id, called, 'step8-B');
  check(done.status === 'COMPLETED' && done.id === bid, 'B completion did not match the expected ticket.');
  const c2After = (await api(c2.page, 'GET', `/entries/${bid}`)).body?.data;
  check(c2After?.id === bid && c2After.status === 'COMPLETED' && Number(c2After.partySize) === 5, 'C2 owner read-back did not match completed B.');
  const emptyBefore = await hostEntries(h1.page, q.id);
  check(active(emptyBefore).length === 0, 'Queue is not empty; empty Call Next skipped.');
  const empty = await api(h1.page, 'POST', `/queues/${q.id}/call-next`);
  expect(empty, 404, 'NO_WAITING_ENTRY', 'Empty Call Next');
  const emptyAfter = await hostEntries(h1.page, q.id);
  check(active(emptyAfter).length === 0 && JSON.stringify(emptyAfter) === JSON.stringify(emptyBefore), 'Empty Call Next changed queue data.');
  await h1.page.goto(`${BASE}/host/queues/${q.id}`); await screenshot(h1.page, 'step9-empty-queue');
  record(9, 'PASS', '404 NO_WAITING_ENTRY; active list remains empty and completed history unchanged', `${empty.status} ${empty.body?.error?.code}`, 'step9-empty-queue');
  await Promise.all([c1.ctx.close(), c2.ctx.close(), h1.ctx.close()]);
}
async function complete(h, qid, ticket, label) {
  const before = await hostEntries(h.page, qid);
  const called = before.filter(x => x.status === 'CALLED');
  check(called.length === 1 && called[0].id === ticket.id, `${label}: wrong ticket is CALLED; no Complete action performed.`);
  await h.page.goto(`${BASE}/host/queues/${qid}`);
  const wait = h.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname === `/api/entries/${ticket.id}/complete`);
  await h.page.getByTestId('currently-called').locator(`[data-ticket-id="${ticket.id}"]`).getByTestId('complete-ticket').click();
  const res = await wait; const body = await res.json().catch(() => null);
  expect({ status: res.status(), body }, 200, null, `${label} Complete`);
  check(body?.data?.id === ticket.id && body.data.status === 'COMPLETED', `${label}: unexpected completion response.`);
  await screenshot(h.page, `${label}-completed`);
  return body.data;
}
async function main() {
  check(process.env.DQ_ALLOW_MUTATIONS === 'USER_REQUESTED', 'Set DQ_ALLOW_MUTATIONS=USER_REQUESTED only for the authorized retest.');
  for (const role of Object.keys(ACC)) check(ACC[role][1], `Missing private password for ${role}; no data changed.`);
  check(process.env.DQ_TESTER_1 === 'Tithinan Sobking', 'Set the actual tester name in DQ_TESTER_1.');
  const health = await fetch(`${BASE}/api/health`), ready = await fetch(`${BASE}/api/ready`);
  check(health.status === 200 && ready.status === 200, `Smoke precheck failed: health ${health.status}, ready ${ready.status}.`);
  evidence.smokePrecheck = { at: new Date().toISOString(), health: health.status, ready: ready.status };
  const c1 = await login('C1'), c2 = await login('C2'), h1 = await login('H1');
  const qRes = await api(h1.page, 'GET', '/queues');
  check(qRes.status === 200 && Array.isArray(qRes.body?.data), 'Host queue list unavailable.');
  const q = qRes.body.data.find(x => x.restaurant?.name === 'DineQ Demo Restaurant') || qRes.body.data[0];
  check(q?.id && q.status === 'OPEN', `Agreed queue missing or not OPEN (observed ${q?.status ?? 'none'}); no tickets created.`);
  evidence.queue = { id: q.id, name: q.restaurant?.name ?? q.name ?? null, status: q.status };
  const [c1Before, c2Before, queueBefore] = await Promise.all([ownEntries(c1.page), ownEntries(c2.page), hostEntries(h1.page, q.id)]);
  const resumeId = process.env.DQ_RESUME_T07A_ID;
  let a;
  if (resumeId) {
    const c1Active = active(c1Before), c2Active = active(c2Before), queueActive = active(queueBefore);
    check(c1Active.length === 1 && c1Active[0].id === resumeId && c1Active[0].status === 'WAITING' && Number(c1Active[0].partySize) === 3, 'Resume ticket does not exactly match the interrupted T07A fixture; no Host action performed.');
    check(c2Active.length === 0 && queueActive.length === 1 && queueActive[0].id === resumeId && q.status === 'OPEN', 'Resume preconditions failed; no Host action performed.');
    a = c1Active[0];
    evidence.tickets.T07A = { id: a.id, ticketNo: Number(a.ticketNo), partySize: 3, status: 'WAITING' };
    evidence.preconditions = { checkedAt: new Date().toISOString(), queueOpen: true, activeQueueCount: 1, c1ActiveCount: 1, c2ActiveCount: 0, resumeOnlyExactT07A: a.id };
    record(1, 'PASS', 'C1 joined first with partySize 3 and received a real WAITING ticket', `T07A #${a.ticketNo}, UUID ${a.id}; verified by owner and Host read-back after interrupted join`, 'inspection-c1-tickets');
    record('PRECONDITIONS-RESUME', 'PASS', 'Queue OPEN; only the exact interrupted T07A is active; C2 has no active ticket', `Q ${q.id}; active set contains only T07A #${a.ticketNo}`);
  } else {
    check(active(c1Before).length === 0, `C1 has active ticket(s); no new ticket created.`);
    check(active(c2Before).length === 0, `C2 has active ticket(s); no new ticket created.`);
    check(active(queueBefore).length === 0, `Queue contains active unrelated ticket(s); no new tickets created.`);
    evidence.preconditions = { checkedAt: new Date().toISOString(), queueOpen: true, activeQueueCount: 0, c1ActiveCount: 0, c2ActiveCount: 0, productReportedT08_17Completed: true };
    record('PRECONDITIONS', 'PASS', 'Queue OPEN, active list empty, C1/C2 have no active tickets', `Q ${q.id}; zero active entries; verified immediately before Join`);
    a = await join(c1, q.id, 3, 'T07A');
  }
  const b = await join(c2, q.id, 5, 'T07B');
  check(Number(a.ticketNo) < Number(b.ticketNo), `Ticket order unexpected: #${a.ticketNo}, #${b.ticketNo}.`);
  let list = await hostEntries(h1.page, q.id);
  const sorted = [...list].sort((x, y) => x.ticketNo - y.ticketNo);
  check(sorted.length === 2 && sorted[0].id === a.id && sorted[1].id === b.id && sorted.every(x => x.status === 'WAITING'), 'Host list contains interference or wrong order.');
  await h1.page.goto(`${BASE}/host/queues/${q.id}`); await screenshot(h1.page, 'step2-fifo-waiting');
  record(2, 'PASS', 'A then B are WAITING in FIFO order; no CALLED; no customer email exposed', `Host API returned #${a.ticketNo} then #${b.ticketNo}; both WAITING`,'step2-fifo-waiting');

  const calledA = await hostCallNext(h1, q.id, a.id, 'step3-A-called-B-waiting');
  record(3, 'PASS', 'Call Next returns FIFO head A as CALLED; B stays WAITING', `A #${a.ticketNo} CALLED, B #${b.ticketNo} WAITING`, 'step3-A-called-B-waiting');
  const bBefore = (await api(c2.page, 'GET', `/entries/${b.id}`)).body?.data;
  const badB = await api(h1.page, 'POST', `/entries/${b.id}/complete`);
  expect(badB, 409, 'INVALID_TRANSITION', 'Complete WAITING B');
  const bAfter = (await api(c2.page, 'GET', `/entries/${b.id}`)).body?.data;
  check(JSON.stringify(bAfter) === JSON.stringify(bBefore), 'Rejected completion changed B.');
  record(4, 'PASS', '409 INVALID_TRANSITION; B unchanged', `${badB.status} ${badB.body?.error?.code}; B remains WAITING, same owner record`);

  const aBeforeUnresolved = (await api(c1.page, 'GET', `/entries/${a.id}`)).body?.data;
  const unresolved = await api(h1.page, 'POST', `/queues/${q.id}/call-next`);
  expect(unresolved, 409, 'UNRESOLVED_CALLED', 'Call Next while A unresolved');
  const [aAfterUnresolved, queueAfterUnresolved] = await Promise.all([(await api(c1.page, 'GET', `/entries/${a.id}`)).body?.data, hostEntries(h1.page, q.id)]);
  check(JSON.stringify(aAfterUnresolved) === JSON.stringify(aBeforeUnresolved) && queueAfterUnresolved.find(x => x.id === b.id)?.status === 'WAITING', 'Unresolved Call Next changed ticket state.');
  record(5, 'PASS', '409 UNRESOLVED_CALLED; only A CALLED and B WAITING remain', `${unresolved.status} ${unresolved.body?.error?.code}; owner/queue snapshots unchanged`);

  const doneA = await complete(h1, q.id, calledA, 'step6-A');
  evidence.tickets.T07A.status = 'COMPLETED';
  evidence.tickets.T07A.completedAt = doneA.completedAt;
  record(6, 'PASS', 'Complete A; C1 sees the same UUID as COMPLETED while B remains WAITING', `A #${a.ticketNo} COMPLETED; B #${b.ticketNo} WAITING`, 'step6-A-completed');
  const repeatA = await api(h1.page, 'POST', `/entries/${a.id}/complete`);
  expect(repeatA, 409, 'INVALID_TRANSITION', 'Complete A twice');
  const afterRepeatA = (await api(c1.page, 'GET', `/entries/${a.id}`)).body?.data;
  check(JSON.stringify(afterRepeatA) === JSON.stringify(doneA), 'Repeated completion changed A after first Complete.');
  record(7, 'PASS', '409 INVALID_TRANSITION; completed A unchanged', `${repeatA.status} ${repeatA.body?.error?.code}; A completedAt unchanged`);

  const calledB = await hostCallNext(h1, q.id, b.id, 'step8-B-called');
  const doneB = await complete(h1, q.id, calledB, 'step8-B');
  evidence.tickets.T07B.status = 'COMPLETED';
  evidence.tickets.T07B.completedAt = doneB.completedAt;
  const [c2B, finalQueue] = await Promise.all([(await api(c2.page, 'GET', `/entries/${b.id}`)).body?.data, hostEntries(h1.page, q.id)]);
  check(c2B?.id === b.id && c2B.status === 'COMPLETED' && Number(c2B.partySize) === 5, 'C2 does not observe its completed ticket.');
  check(active(finalQueue).length === 0, 'Queue not empty after the two test tickets completed; stopping before empty Call Next.');
  record(8, 'PASS', 'B completed and C2 sees same ticket; queue has no active entries', `B #${b.ticketNo} partySize 5 COMPLETED; active count 0`,'step8-B-completed');

  const beforeEmpty = await hostEntries(h1.page, q.id);
  check(active(beforeEmpty).length === 0, 'Queue changed before empty Call Next; step 9 skipped.');
  const empty = await api(h1.page, 'POST', `/queues/${q.id}/call-next`);
  expect(empty, 404, 'NO_WAITING_ENTRY', 'Empty Call Next');
  const afterEmpty = await hostEntries(h1.page, q.id);
  check(active(afterEmpty).length === 0 && JSON.stringify(afterEmpty) === JSON.stringify(beforeEmpty), 'Empty Call Next changed completed tickets/queue.');
  await h1.page.goto(`${BASE}/host/queues/${q.id}`); await screenshot(h1.page, 'step9-empty-queue');
  record(9, 'PASS', '404 NO_WAITING_ENTRY; active list remains empty; completed tickets unchanged', `${empty.status} ${empty.body?.error?.code}`,'step9-empty-queue');
  await Promise.all([c1.ctx.close(), c2.ctx.close(), h1.ctx.close()]);
}

const startedAt = new Date().toISOString();
const run = process.argv[2] || 'run';
let overall = 'PASS', errorText = null;
try {
  browser = await chromium.launch({ headless: true });
  if (run === 'inspect') await inspectOnly();
  else if (run === 'resume-step8') await resumeFinalB();
  else if (run === 'run') await main();
  else throw new Error('Mode must be run or inspect.');
} catch (e) {
  overall = results.some(x => [1,2].includes(x.step)) ? 'INTERRUPTED' : 'BLOCKED';
  errorText = String(e?.message ?? e);
  if (lastPage) { try { await screenshot(lastPage, `STOPPED-${stamp}`); } catch {} }
  console.error(`${overall}: ${errorText}`);
} finally {
  await browser?.close().catch(() => {});
  const report = { product: 'DineQ', case: 'DQ-UAT-07', tester: process.env.DQ_TESTER_1 || null, scriptAuthor: 'OpenAI Codex (GPT-6), at Tithinan Sobking’s request', runner: 'Playwright automation executed by OpenAI Codex on the user’s behalf', startedAt, endedAt: new Date().toISOString(), timezone: 'Asia/Bangkok', fullCommit: COMMIT, revision: REVISION, runtimeManifestDigest: IMAGE, runConclusion: overall, error: errorText, evidence, results, findings: overall === 'PASS' ? 'None observed within DQ-UAT-07.' : 'No unsupported conclusion; see interruption/blocker details.' };
  const jsonPath = path.join(resultDir, `${stamp}-DQ-UAT-07-report.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(jsonPath.replace(/\.json$/, '.md'), `# DineQ DQ-UAT-07 retest\n\n- Requested tester: ${report.tester ?? 'not recorded'}\n- Script author: ${report.scriptAuthor}\n- Playwright action executor: ${report.runner}\n- Started: ${report.startedAt}\n- Ended: ${report.endedAt}\n- Commit: ${COMMIT}\n- Revision: ${REVISION}\n- Runtime manifest digest (from deploy build log): ${IMAGE}\n- Result: ${overall}\n- Finding: ${report.findings}\n\n| Step | Result | Expected | Actual | Evidence |\n|---:|---|---|---|---|\n${results.map(x => `| ${x.step} | ${x.status} | ${x.expected} | ${x.actual} | ${x.evidenceId ?? 'JSON/API'} |`).join('\n')}\n\nDetailed sanitized observations: sibling JSON report. Screenshots: sibling timestamped folder. No credentials, cookies, tokens or login payloads are stored.\n`, 'utf8');
}
if (overall !== 'PASS') process.exitCode = 2;
