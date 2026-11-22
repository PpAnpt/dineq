// Lab 5 live-evidence capture for the DEPLOYED service (C-04, C-05). Not part of the test suite:
// the file name does not match Playwright's *.spec.js pattern, so `npm run test:e2e` never runs it.
//
// It writes REAL data to whatever LIVE_URL points at (customer01 / customer02 / host1 only; it never
// deletes or resets anything). Do not point it at a database you care about.
//
// Usage (PowerShell, from the repository root; the password stays in your shell, never in a file or chat):
//   $env:DEMO_PASSWORD = Read-Host -MaskInput 'Demo password'
//   $env:LIVE_URL = 'https://s21271a0d-4d7hbszvwq-as.a.run.app'    # optional, this is the default
//   node client/e2e/live-evidence.mjs c04      # sign in, join, duplicate 409, Host Call Next + Complete, 403 on Host page
//   ...restart / redeploy the service...
//   node client/e2e/live-evidence.mjs c05      # same tickets still there after the restart/redeploy
//
// Output goes to .local/live-evidence/ (git-ignored). Screenshots never include the login form; each one is
// stamped with the live page URL and a timestamp so "URL visible" holds. No trace/video is recorded.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
const password = process.env.DEMO_PASSWORD;
const base = (process.env.LIVE_URL || 'https://s21271a0d-4d7hbszvwq-as.a.run.app').replace(/\/+$/, '');
if (!['c04', 'c05'].includes(mode)) fail('Usage: node client/e2e/live-evidence.mjs c04|c05');
if (!password) fail('Set DEMO_PASSWORD in your shell first (never put it in a file).');
if (!base.startsWith('https://')) fail('LIVE_URL must be the https URL of the deployed service.');

const outDir = fileURLToPath(new URL('../../.local/live-evidence/', import.meta.url));
mkdirSync(outDir, { recursive: true });
const statePath = `${outDir}state.json`;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const results = [];

function fail(message) { console.error(message); process.exit(2); }
function note(step, detail) { results.push({ step, detail }); console.log(`${step}: ${detail}`); }

async function shot(page, name) {
  const label = `${page.url()}  |  ${new Date().toISOString()}`;
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
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 20_000 });
  return { context, page };
}

async function ticketText(page) {
  return (await page.getByTestId('ticket').first().innerText()).replace(/\s+/g, ' ').trim();
}

let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  fail(`Chromium could not start: ${error.message}\nRun once: npx playwright install chromium`);
}

try {
  if (mode === 'c04') {
    const state = {};

    // 1. Customer signs in and joins the queue (main business action).
    const c1 = await login(browser, 'customer01@dineq.test');
    await c1.page.getByRole('link', { name: 'Queues', exact: true }).click();
    await c1.page.getByLabel('Party size (1–8)').fill('4');
    await c1.page.getByTestId('join-queue').click();
    await c1.page.waitForURL('**/my-queue');
    const status = await c1.page.getByTestId('ticket-status').innerText();
    state.customer01Joined = await ticketText(c1.page);
    note('C-04 join', `customer01 ${state.customer01Joined}; status=${status}`);
    await shot(c1.page, '01-customer01-joined');

    // 2. Rule rejection: a second join while a WAITING ticket exists.
    await c1.page.getByRole('link', { name: 'Queues', exact: true }).click();
    await c1.page.getByLabel('Party size (1–8)').fill('4');
    await c1.page.getByTestId('join-queue').click();
    const duplicate = await c1.page.getByTestId('error-message').innerText();
    note('C-04 rejection', `duplicate join -> ${duplicate.replace(/\s+/g, ' ')}`);
    await shot(c1.page, '02-duplicate-join-rejected');

    // 3. Access restriction: a Customer cannot use the Host page.
    const hostPath = new URL(await (async () => {
      const host = await login(browser, 'host1@dineq.test');
      const url = host.page.url();
      await host.context.close();
      return url;
    })()).pathname;
    await c1.page.goto(`${base}${hostPath}`);
    const forbidden = await c1.page.getByTestId('error-message').innerText();
    note('C-04 access restriction', `customer on Host page -> ${forbidden.replace(/\s+/g, ' ')}`);
    await shot(c1.page, '03-customer-forbidden-on-host-page');

    // 4. Host (assigned) calls next and completes; customer sees COMPLETED after a full reload.
    const host = await login(browser, 'host1@dineq.test');
    const h = host.page;
    await h.getByTestId('call-next').click();
    await h.getByTestId('currently-called').getByTestId('ticket-status').waitFor();
    note('C-04 host call-next', `called: ${await h.getByTestId('currently-called').innerText().then(t => t.replace(/\s+/g, ' '))}`);
    await shot(h, '04-host-called');
    await h.getByTestId('complete-ticket').click();
    await h.getByTestId('host-notice').waitFor();
    note('C-04 host complete', (await h.getByTestId('host-notice').innerText()).replace(/\s+/g, ' '));
    await shot(h, '05-host-completed');
    await c1.page.goto(`${base}/my-queue`);
    await c1.page.reload();
    state.customer01After = await ticketText(c1.page);
    note('C-04 customer view', `customer01 after reload: ${state.customer01After}; status=${await c1.page.getByTestId('ticket-status').innerText()}`);
    await shot(c1.page, '06-customer01-completed');
    await host.context.close();
    await c1.context.close();

    // 5. Leave a WAITING ticket as the "before" data for C-05 (customer02; FIFO order is unaffected).
    const c2 = await login(browser, 'customer02@dineq.test');
    await c2.page.getByRole('link', { name: 'Queues', exact: true }).click();
    await c2.page.getByLabel('Party size (1–8)').fill('2');
    await c2.page.getByTestId('join-queue').click();
    await c2.page.waitForURL('**/my-queue');
    state.customer02Before = await ticketText(c2.page);
    state.customer02Status = await c2.page.getByTestId('ticket-status').innerText();
    state.capturedAt = new Date().toISOString();
    note('C-05 before', `customer02 ${state.customer02Before}; status=${state.customer02Status}`);
    await shot(c2.page, '07-c05-before-customer02-waiting');
    await c2.context.close();

    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } else {
    const before = JSON.parse(readFileSync(statePath, 'utf8'));
    const c2 = await login(browser, 'customer02@dineq.test');
    await c2.page.goto(`${base}/my-queue`);
    const after = await ticketText(c2.page);
    const status = await c2.page.getByTestId('ticket-status').innerText();
    note('C-05 after', `customer02 ${after}; status=${status}`);
    await shot(c2.page, '08-c05-after-customer02');
    const sameTicket = after === before.customer02Before;
    note('C-05 compare', `before="${before.customer02Before}" (captured ${before.capturedAt}) after="${after}" -> ${sameTicket ? 'SAME ticket' : 'DIFFERENT'}`);
    const c1 = await login(browser, 'customer01@dineq.test');
    await c1.page.goto(`${base}/my-queue`);
    const afterC1 = await ticketText(c1.page);
    note('C-05 completed ticket', `customer01 ${afterC1}; status=${await c1.page.getByTestId('ticket-status').innerText()}`);
    await shot(c1.page, '09-c05-after-customer01-completed');
    await c1.context.close();
    await c2.context.close();
    if (!sameTicket) process.exitCode = 1;
  }
  writeFileSync(`${outDir}${stamp}-${mode}-results.json`, JSON.stringify({ base, mode, results }, null, 2));
  console.log(`Done. Results: ${outDir}${stamp}-${mode}-results.json`);
} catch (error) {
  console.error(`FAILED (${mode}): ${error.message.split('\n')[0]}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
