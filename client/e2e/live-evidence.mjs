// Lab 5 live-evidence capture for the DEPLOYED service (C-04, C-05). Not part of the test suite:
// the file name does not match Playwright's *.spec.js pattern, so `npm run test:e2e` never runs it.
//
// What it is: an operator-run, AUTOMATED browser capture. Screenshots are annotated with the page URL and a
// timestamp by the script (they are not manual walkthroughs and not captures of the browser address bar).
// Every claimed outcome is asserted (HTTP status, error code, entry UUIDs, states); a wrong outcome exits
// non-zero and only writes a *-FAILED.json, never a *-results.json.
//
// Write scope: customer01 / customer02 / host1 only. The script never deletes or resets anything. Host actions
// are limited to customer01's own ticket: before any Host mutation it reads the Host queue and STOPS (exit 3)
// if another ticket is the FIFO head or is already CALLED. Run it on a quiet queue; do not drain other tickets.
//
// Usage (PowerShell, from the repository root; the password stays in your shell, never in a file or chat):
//   $env:DEMO_PASSWORD = Read-Host -MaskInput 'Demo password'
//   $env:LIVE_URL = 'https://s21271a0d-4d7hbszvwq-as.a.run.app'   # optional; must equal the service APP_ORIGIN
//   node client/e2e/live-evidence.mjs c04            # C-04 + writes a C-05 baseline (<stamp>-c04-baseline.json)
//   ...restart / redeploy the service...
//   node client/e2e/live-evidence.mjs c05 [baseline-file]   # default: newest c04 baseline in the output folder
//   node client/e2e/live-evidence.mjs snapshot       # READ-ONLY: record a baseline from the current state (customer01's
//                                                      newest COMPLETED ticket, customer02's WAITING ticket) when c04
//                                                      already ran earlier; the file says source=snapshot and its time
//
// Output goes to .local/live-evidence/ (git-ignored). Keep every run's files: a c05 run states which baseline it used.
// Exit codes: 0 ok, 1 wrong outcome or error, 2 bad usage, 3 prerequisite not met (nothing was changed).
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  EvidenceError, PrerequisiteError, activeEntry, assertHostPrerequisites, assertResponse, assertCallNextTarget,
  assertCompleted, assertEntryState, buildBaseline, validateBaseline, compareC05, pickBaselineFile, resultFileName,
} from './live-evidence-lib.mjs';

const mode = process.argv[2];
const password = process.env.DEMO_PASSWORD;
const base = (process.env.LIVE_URL || 'https://s21271a0d-4d7hbszvwq-as.a.run.app').replace(/\/+$/, '');
if (!['c04', 'c05', 'snapshot'].includes(mode)) usage('Usage: node client/e2e/live-evidence.mjs c04 | snapshot | c05 [baseline-file]');
if (!password) usage('Set DEMO_PASSWORD in your shell first (never put it in a file).');
if (!base.startsWith('https://')) usage('LIVE_URL must be the https URL of the deployed service.');

const outDir = fileURLToPath(new URL('../../.local/live-evidence/', import.meta.url));
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const results = [];
let lastPage = null;

function usage(message) { console.error(message); process.exit(2); }
function note(step, detail) { results.push({ step, detail }); console.log(`${step}: ${detail}`); }
const squash = text => String(text).replace(/\s+/g, ' ').trim();

async function shot(page, name) {
  const label = `${page.url()}  |  ${new Date().toISOString()}  |  automated capture`;
  await page.evaluate(text => {
    const bar = document.createElement('div');
    bar.id = '__evidence_bar';
    bar.textContent = text;
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#111;color:#0f0;font:14px monospace;padding:4px 8px';
    document.body.appendChild(bar);
  }, label);
  const path = `${outDir}${stamp}-${mode}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  await page.evaluate(() => document.getElementById('__evidence_bar')?.remove());
  console.log(`  screenshot: ${path}`);
}

async function login(browser, email) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  lastPage = page;
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 20_000 });
  return { context, page };
}

// Authenticated API call with the page's session cookie. POSTs carry the service origin like the UI does.
async function api(page, method, path, { origin = true } = {}) {
  const response = await page.request.fetch(`${base}${path}`, {
    method, headers: method === 'GET' || !origin ? {} : { Origin: base },
  });
  return { status: response.status(), body: await response.json().catch(() => null) };
}

// Click something that triggers one matching request and return that response (status + JSON body).
async function clickAndCapture(page, matcher, click) {
  const [response] = await Promise.all([
    page.waitForResponse(res => matcher(res.request().method(), new URL(res.url()).pathname), { timeout: 20_000 }),
    click(),
  ]);
  return { status: response.status(), body: await response.json().catch(() => null) };
}

async function uiJoin(page, queueId, size) {
  await page.goto(`${base}/queues`);
  await page.getByLabel('Party size (1–8)').fill(String(size));
  return clickAndCapture(page, (method, path) => method === 'POST' && path === `/api/queues/${queueId}/entries`,
    () => page.getByTestId('join-queue').click());
}

// The customer's active ticket, or a fresh join through the UI. Returns { entry, joined }.
async function ensureWaitingTicket(page, queueId, size, who) {
  const entries = (await api(page, 'GET', '/api/me/entries')).body?.data ?? [];
  const existing = activeEntry(entries);
  if (existing) {
    if (existing.status !== 'WAITING') {
      throw new PrerequisiteError(`${who} has a ${existing.status} ticket #${existing.ticketNo}; expected none or WAITING. Resolve it first.`);
    }
    note(`${who} ticket`, `using existing WAITING ticket #${existing.ticketNo} (${existing.id}); the join itself happened in an earlier run`);
    return { entry: existing, joined: false };
  }
  const joined = await uiJoin(page, queueId, size);
  assertResponse(`${who} join`, joined, 201);
  if (joined.body?.data?.status !== 'WAITING' || joined.body.data.partySize !== size) {
    throw new EvidenceError(`${who} join returned ${JSON.stringify(joined.body?.data)}, expected WAITING party size ${size}`);
  }
  await page.waitForURL('**/my-queue', { timeout: 15_000 });
  note(`${who} ticket`, `joined: ticket #${joined.body.data.ticketNo} (${joined.body.data.id}) WAITING, party size ${size}`);
  return { entry: joined.body.data, joined: true };
}

async function ticketStatusInUi(page) {
  await page.goto(`${base}/my-queue`);
  return (await page.getByTestId('ticket-status').first().innerText()).trim();
}

async function runC04(browser) {
  const host = await login(browser, 'host1@dineq.test');
  const queues = (await api(host.page, 'GET', '/api/queues')).body?.data ?? [];
  const queue = queues.find(item => item.isAssigned);
  if (!queue) throw new PrerequisiteError('host1 has no assigned queue on this service.');
  const queueId = queue.id;
  note('queue', `host1 assigned queue ${queueId} (${queue.restaurant.name}, ${queue.status})`);

  // 1. Customer: join (or existing WAITING ticket).
  const c1 = await login(browser, 'customer01@dineq.test');
  const { entry } = await ensureWaitingTicket(c1.page, queueId, 4, 'customer01');
  await c1.page.goto(`${base}/my-queue`);
  await shot(c1.page, '01-customer01-ticket-waiting');

  // 2. Rule rejection: second join must be exactly 409 DUPLICATE_ACTIVE (and shown in the UI).
  const duplicate = await uiJoin(c1.page, queueId, 4);
  assertResponse('duplicate join', duplicate, 409, 'DUPLICATE_ACTIVE');
  const duplicateText = squash(await c1.page.getByTestId('error-message').innerText());
  if (!duplicateText.includes('DUPLICATE_ACTIVE')) throw new EvidenceError(`UI did not show DUPLICATE_ACTIVE: ${duplicateText}`);
  note('rule rejection', `second join -> HTTP 409 DUPLICATE_ACTIVE; UI shows: ${duplicateText}`);
  await shot(c1.page, '02-duplicate-join-rejected');

  // 3. Access restriction, proven at the backend (HTTP 403) and not only by the UI hiding a button.
  const hostPath = `/host/queues/${queueId}`;
  const listAsCustomer = await api(c1.page, 'GET', `/api/queues/${queueId}/entries`);
  assertResponse('customer reads Host list', listAsCustomer, 403, 'FORBIDDEN');
  const callAsCustomer = await api(c1.page, 'POST', `/api/queues/${queueId}/call-next`);
  assertResponse('customer calls next', callAsCustomer, 403, 'FORBIDDEN');
  const [hostPageResponse] = await Promise.all([
    c1.page.waitForResponse(res => res.request().method() === 'GET' && new URL(res.url()).pathname === `/api/queues/${queueId}/entries`),
    c1.page.goto(`${base}${hostPath}`),
  ]);
  assertResponse('customer opens Host page (API call made by the page)', { status: hostPageResponse.status(), body: await hostPageResponse.json().catch(() => null) }, 403, 'FORBIDDEN');
  const forbiddenText = squash(await c1.page.getByTestId('error-message').innerText());
  note('access restriction', `customer -> Host list HTTP 403 FORBIDDEN, call-next HTTP 403 FORBIDDEN; Host page shows: ${forbiddenText}`);
  await shot(c1.page, '03-customer-forbidden-on-host-page');

  // 4. Host: verify the target is safe BEFORE mutating, then Call Next and Complete only customer01's entry.
  const hostEntries = (await api(host.page, 'GET', `/api/queues/${queueId}/entries`)).body?.data ?? [];
  assertHostPrerequisites(hostEntries, entry.id);
  await host.page.goto(`${base}${hostPath}`);
  const called = await clickAndCapture(host.page, (method, path) => method === 'POST' && path === `/api/queues/${queueId}/call-next`,
    () => host.page.getByTestId('call-next').click());
  assertResponse('Call Next', called, 200);
  assertCallNextTarget(called.body, entry.id);
  note('host call-next', `HTTP 200, called entry ${entry.id} (ticket #${called.body.data.ticketNo}) -> CALLED`);
  await host.page.getByTestId('currently-called').getByTestId('ticket-status').waitFor();
  await shot(host.page, '04-host-called');
  const completed = await clickAndCapture(host.page, (method, path) => method === 'POST' && path === `/api/entries/${entry.id}/complete`,
    () => host.page.getByTestId('complete-ticket').click());
  assertResponse('Complete', completed, 200);
  assertCompleted(completed.body, entry.id);
  note('host complete', `HTTP 200, entry ${entry.id} -> COMPLETED`);
  await shot(host.page, '05-host-completed');

  // 5. The same customer entry is COMPLETED when read back from the database (API and UI after a reload).
  const afterEntries = (await api(c1.page, 'GET', '/api/me/entries')).body?.data ?? [];
  assertEntryState(afterEntries, entry.id, 'COMPLETED');
  const uiStatus = await ticketStatusInUi(c1.page);
  if (uiStatus !== 'COMPLETED') throw new EvidenceError(`customer01 UI shows ${uiStatus}, expected COMPLETED`);
  note('customer view', `entry ${entry.id} is COMPLETED via API and in the UI after reload`);
  await shot(c1.page, '06-customer01-completed');
  const customer01Final = afterEntries.find(item => item.id === entry.id);

  // 6. "Before" data for C-05: customer02 keeps a WAITING ticket (queued behind, so FIFO above was unaffected).
  const c2 = await login(browser, 'customer02@dineq.test');
  const second = await ensureWaitingTicket(c2.page, queueId, 2, 'customer02');
  const c2Entries = (await api(c2.page, 'GET', '/api/me/entries')).body?.data ?? [];
  assertEntryState(c2Entries, second.entry.id, 'WAITING');
  await c2.page.goto(`${base}/my-queue`);
  await shot(c2.page, '07-c05-before-customer02-waiting');

  const baseline = buildBaseline({
    base, queueId, capturedAt: new Date().toISOString(), customer01: customer01Final, customer02: second.entry,
  });
  const baselineName = `${stamp}-c04-baseline.json`;
  writeFileSync(`${outDir}${baselineName}`, JSON.stringify(baseline, null, 2));
  note('C-05 baseline', `saved ${baselineName}: customer01 ${customer01Final.id} COMPLETED, customer02 ${second.entry.id} WAITING`);
  await Promise.all([host, c1, c2].map(item => item.context.close()));
}

async function runC05(browser) {
  const requested = process.argv[3];
  const file = requested ?? pickBaselineFile(readdirSync(outDir));
  if (!file) usage('No c04 baseline found in .local/live-evidence/. Run c04 first (or pass a baseline file name).');
  const hasDirectory = requested !== undefined && (requested.includes('/') || requested.includes('\\'));
  const baselinePath = hasDirectory ? requested : `${outDir}${file}`;
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  validateBaseline(baseline, { base });
  note('baseline', `using ${file} (captured ${baseline.capturedAt}) for ${baseline.base}; queue ${baseline.queueId}`);

  const current = {};
  const contexts = [];
  for (const [index, name] of ['customer01', 'customer02'].entries()) {
    const session = await login(browser, baseline.entries[name].email);
    contexts.push(session.context);
    await session.page.goto(`${base}/my-queue`);
    current[name] = (await api(session.page, 'GET', '/api/me/entries')).body?.data ?? [];
    await shot(session.page, `0${8 + index}-c05-after-${name}`);
  }
  compareC05(baseline, current);
  note('C-05 compare', `customer01 ${baseline.entries.customer01.id} still COMPLETED; customer02 ${baseline.entries.customer02.id} still WAITING (same ids, same queue)`);
  await Promise.all(contexts.map(context => context.close()));
}

// Read-only: capture the C-05 "before" record from the CURRENT state (no write to the service).
async function runSnapshot(browser) {
  const c1 = await login(browser, 'customer01@dineq.test');
  const mine1 = (await api(c1.page, 'GET', '/api/me/entries')).body?.data ?? [];
  const completed = mine1.filter(item => item.status === 'COMPLETED').sort((a, b) => b.ticketNo - a.ticketNo)[0];
  if (!completed) throw new EvidenceError('customer01 has no COMPLETED ticket to record; run c04 first.');
  await c1.page.goto(`${base}/my-queue`);
  await shot(c1.page, '10-snapshot-customer01-completed');
  const c2 = await login(browser, 'customer02@dineq.test');
  const mine2 = (await api(c2.page, 'GET', '/api/me/entries')).body?.data ?? [];
  const waiting = activeEntry(mine2);
  if (!waiting || waiting.status !== 'WAITING') throw new EvidenceError('customer02 has no WAITING ticket to record.');
  if (waiting.queueId !== completed.queueId) throw new EvidenceError('The two tickets belong to different queues; refusing to record a baseline.');
  await c2.page.goto(`${base}/my-queue`);
  await shot(c2.page, '11-snapshot-customer02-waiting');
  const baseline = {
    ...buildBaseline({ base, queueId: completed.queueId, capturedAt: new Date().toISOString(), customer01: completed, customer02: waiting }),
    source: 'snapshot',
  };
  const baselineName = `${stamp}-c04-baseline.json`;
  writeFileSync(`${outDir}${baselineName}`, JSON.stringify(baseline, null, 2));
  note('C-05 baseline', `saved ${baselineName} (source=snapshot at ${baseline.capturedAt}): customer01 ${completed.id} COMPLETED, customer02 ${waiting.id} WAITING`);
  await Promise.all([c1, c2].map(item => item.context.close()));
}

let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  usage(`Chromium could not start: ${error.message}\nRun once: npx playwright install chromium`);
}

let ok = false;
let failure = null;
try {
  await ({ c04: runC04, c05: runC05, snapshot: runSnapshot })[mode](browser);
  ok = true;
} catch (error) {
  failure = error;
  console.error(`${error instanceof PrerequisiteError ? 'PREREQUISITE NOT MET (nothing was changed)' : 'FAILED'} (${mode}): ${squash(error.message).slice(0, 400)}`);
  try {
    // Diagnostic screenshot of where it stopped (never of the login form).
    if (lastPage && !new URL(lastPage.url()).pathname.startsWith('/login')) await shot(lastPage, 'FAILURE-state');
  } catch { /* best effort only */ }
} finally {
  const name = resultFileName(stamp, mode, ok);
  writeFileSync(`${outDir}${name}`, JSON.stringify({ base, mode, ok, error: failure ? squash(failure.message) : null, results }, null, 2));
  console.log(`${ok ? 'Done' : 'Not successful'}. Results: ${outDir}${name}`);
  await browser.close();
}
process.exitCode = ok ? 0 : failure instanceof PrerequisiteError ? 3 : 1;
