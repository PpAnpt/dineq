import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resetAndSeed, closeTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

// Sprint 1 browser journeys (DEMO-01..05) against the real API + PostgreSQL TEST database.
// Each test starts from a freshly reset and seeded database.
const shots = fileURLToPath(new URL('../../docs/evidence/screenshots/', import.meta.url));
mkdirSync(shots, { recursive: true });
const password = process.env.SEED_DEMO_PASSWORD;
const hostPath = `/host/queues/${seedIds.queue}`;

test.beforeEach(async () => { await resetAndSeed(); });
test.afterAll(async () => { await closeTestPool(); });

async function shot(page, demo, step) {
  await page.screenshot({ path: `${shots}${demo}-step-${step}.png`, fullPage: true });
}

async function newUser(browser, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname !== '/login');
  return { context, page };
}

async function join(page, partySize) {
  await page.getByRole('link', { name: 'Queues', exact: true }).click();
  await page.getByLabel('Party size (1–8)').fill(String(partySize));
  await page.getByTestId('join-queue').click();
}

test('E2E-1 / DEMO-01: join, Host Call Next + Complete, customer sees persisted COMPLETED', async ({ browser }) => {
  const customer = await newUser(browser, 'customer01@dineq.test');
  const c = customer.page;

  await join(c, 4);
  await c.waitForURL('**/my-queue');
  await expect(c.getByTestId('ticket-status')).toHaveText('WAITING');
  await expect(c.getByTestId('ticket-party-size')).toHaveText('4');
  await expect(c.getByTestId('ticket')).toContainText('Ticket #1'); // first ticket number of a freshly reset queue
  await shot(c, 'DEMO-01', 1);

  const host = await newUser(browser, 'host1@dineq.test'); // Host signs in once the customer is waiting
  const h = host.page;
  await expect(h).toHaveURL(new RegExp(`${hostPath}$`));
  await expect(h.getByTestId('waiting-list').getByTestId('ticket')).toHaveCount(1);
  await h.getByTestId('call-next').click();
  await expect(h.getByTestId('currently-called').getByTestId('ticket-status')).toHaveText('CALLED');
  await shot(h, 'DEMO-01', 2);

  await h.getByTestId('complete-ticket').click();
  await expect(h.getByTestId('host-notice')).toContainText('COMPLETED');
  await shot(h, 'DEMO-01', 3);

  await c.reload(); // full page reload: state must come from the database
  await expect(c.getByTestId('ticket-status')).toHaveText('COMPLETED');
  await shot(c, 'DEMO-01', 4);

  await customer.context.close();
  await host.context.close();
});

test('E2E-2 / DEMO-02 + DEMO-03: duplicate active join and invalid party size are rejected', async ({ browser }) => {
  const { context, page } = await newUser(browser, 'customer02@dineq.test');

  await join(page, 2);
  await page.waitForURL('**/my-queue');
  await expect(page.getByTestId('ticket-status')).toHaveText('WAITING');

  // DEMO-02: second join while a WAITING entry exists -> server 409 DUPLICATE_ACTIVE.
  await join(page, 2);
  await expect(page.getByTestId('error-message')).toContainText('DUPLICATE_ACTIVE');
  await expect(page.getByTestId('error-message')).toContainText('409');
  await shot(page, 'DEMO-02', 1);

  // DEMO-03: the browser's own range check blocks 9 ...
  const size = page.getByLabel('Party size (1–8)');
  await size.fill('9');
  expect(await size.evaluate(el => el.checkValidity())).toBe(false);
  // ... so disable only that client-side constraint to prove the SERVER rejects it.
  await page.locator('form').evaluate(form => { form.noValidate = true; });
  await page.getByTestId('join-queue').click();
  await expect(page.getByTestId('error-message')).toContainText('INVALID_PARTY_SIZE');
  await expect(page.getByTestId('error-message')).toContainText('400');
  await shot(page, 'DEMO-03', 1);

  await context.close();
});

test('E2E-3 / DEMO-04: a Customer cannot use the Host page or call-next API', async ({ browser }) => {
  const { context, page } = await newUser(browser, 'customer01@dineq.test');

  await page.goto(hostPath);
  await expect(page.getByTestId('error-message')).toContainText('FORBIDDEN');
  await expect(page.getByTestId('call-next')).toHaveCount(0);
  await shot(page, 'DEMO-04', 1);

  // Direct API call with the Customer's real session cookie (not via the UI).
  const response = await page.request.post(`/api/queues/${seedIds.queue}/call-next`,
    { headers: { Origin: 'http://localhost:5173' } });
  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe('FORBIDDEN');

  await context.close();
});

test('E2E-4 / DEMO-05: after logout the old session cookie is rejected', async ({ browser }) => {
  const { context, page } = await newUser(browser, 'customer01@dineq.test');

  expect((await page.request.get('/api/auth/me')).status()).toBe(200);
  const oldCookie = (await context.cookies()).find(cookie => cookie.name === 'dineq_session');
  expect(oldCookie).toBeTruthy();
  await shot(page, 'DEMO-05', 1);

  await page.getByTestId('logout').click();
  await page.waitForURL('**/login');
  await shot(page, 'DEMO-05', 2);

  // Replay the pre-logout token from a clean client: the server must have revoked it.
  const replay = await browser.newContext();
  const stale = await replay.request.get('http://localhost:5173/api/auth/me',
    { headers: { Cookie: `dineq_session=${oldCookie.value}` } });
  expect(stale.status()).toBe(401);
  await replay.close();
  expect((await page.request.get('/api/auth/me')).status()).toBe(401);

  await context.close();
});
