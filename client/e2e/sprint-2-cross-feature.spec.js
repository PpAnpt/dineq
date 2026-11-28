import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resetAndSeed, closeTestPool, getTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

test.beforeEach(async () => { await resetAndSeed(); });
test.afterAll(closeTestPool);

async function withSessions(browser, work) {
  const contexts = [];
  const signIn = async email => {
    const context = await browser.newContext();
    contexts.push(context);
    const page = await context.newPage();
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(process.env.SEED_DEMO_PASSWORD);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(url => url.pathname !== '/login');
    return page;
  };
  try { await work(signIn); }
  finally { await Promise.all(contexts.map(context => context.close())); }
}

const ticket = (page, number) => page.getByTestId('ticket').filter({
  has: page.getByRole('heading', { name: `Ticket #${number}`, exact: true }),
});
async function join(page, size, queueId = seedIds.queue) {
  await page.getByRole('link', { name: 'Queues', exact: true }).click();
  const queue = page.locator(`[data-queue-id="${queueId}"]`);
  await queue.getByLabel(/^Party size/).fill(String(size));
  await queue.getByTestId('join-queue').click();
  await expect(page.getByTestId('ticket-status').filter({ hasText: /^WAITING$/ })).toHaveText('WAITING');
}
async function call(page, number) {
  await page.getByTestId('call-next').click();
  await expect(page.getByTestId('host-notice')).toContainText(`Ticket #${number}: CALLED`);
  await expect(page.getByTestId('currently-called').getByRole('heading', { level: 3 })).toHaveText(`Ticket #${number}`);
}
async function complete(page, number) {
  await page.getByTestId('complete-ticket').click();
  await expect(page.getByTestId('host-notice')).toContainText(`Ticket #${number}: COMPLETED`);
}
async function capture(page, name) {
  const folder = new URL('../../docs/evidence/screenshots/s2-cross-feature/', import.meta.url);
  mkdirSync(folder, { recursive: true });
  await page.screenshot({ path: fileURLToPath(new URL(name, folder)), fullPage: true });
}
async function snapshot() {
  const pool = getTestPool();
  return {
    queues: (await pool.query('SELECT id, status, next_ticket_no FROM service_queues ORDER BY id')).rows,
    entries: (await pool.query('SELECT id, queue_id, ticket_no, status, called_at, completed_at FROM queue_entries ORDER BY id')).rows,
    events: (await pool.query('SELECT * FROM queue_events ORDER BY id')).rows,
  };
}

test('E2E-12 / AC-28 AC-33 AC-15 AC-16: cancel and rejoin preserve FIFO behind another owner and the CALLED guard', async ({ browser }) => {
  await withSessions(browser, async signIn => {
    const first = await signIn('customer01@dineq.test');
    const second = await signIn('customer02@dineq.test');
    await join(first, 3);
    await join(second, 4);
    await first.getByTestId('cancel-ticket').click();
    await first.getByTestId('cancel-confirm-yes').click();
    await expect(ticket(first, 1).getByTestId('ticket-status')).toHaveText('CANCELLED');
    await join(first, 2);
    await expect(ticket(first, 3).getByTestId('ticket-status')).toHaveText('WAITING');

    const host = await signIn('host1@dineq.test');
    await call(host, 2);
    const denied = await host.request.post(`/api/queues/${seedIds.queue}/call-next`, {
      headers: { Origin: new URL(host.url()).origin },
    });
    expect(denied.status()).toBe(409);
    expect((await denied.json()).error.code).toBe('UNRESOLVED_CALLED');
    await expect(host.getByTestId('waiting-list').getByRole('heading', { level: 3 })).toHaveText('Ticket #3');
    await complete(host, 2);
    await call(host, 3);
    await first.getByTestId('refresh-my-queue').click();
    await expect(ticket(first, 1).getByTestId('ticket-status')).toHaveText('CANCELLED');
    await expect(ticket(first, 3).getByTestId('ticket-status')).toHaveText('CALLED');
    await capture(first, 'cancel-rejoin-fifo.png');
  });
});

test('E2E-13 / AC-49 AC-15 AC-17: CLOSED queue rejects new Join without a number gap but drains both existing tickets', async ({ browser }) => {
  await withSessions(browser, async signIn => {
    const first = await signIn('customer01@dineq.test');
    const second = await signIn('customer02@dineq.test');
    const newcomer = await signIn('customer03@dineq.test');
    await join(first, 3);
    await join(second, 4);
    const host = await signIn('host1@dineq.test');
    await host.getByTestId('toggle-queue-status').click();
    await host.getByTestId('close-confirm-yes').click();
    await expect(host.getByTestId('host-queue-status')).toHaveText('CLOSED');
    const before = await snapshot();
    const rejected = await newcomer.request.post(`/api/queues/${seedIds.queue}/entries`, {
      headers: { Origin: new URL(newcomer.url()).origin }, data: { partySize: 1 },
    });
    expect(rejected.status()).toBe(409);
    expect((await rejected.json()).error.code).toBe('QUEUE_CLOSED');
    expect(await snapshot()).toEqual(before);
    await call(host, 1);
    await complete(host, 1);
    await call(host, 2);
    await complete(host, 2);
    await expect(host.getByTestId('host-queue-status')).toHaveText('CLOSED');
    await expect(host.getByTestId('waiting-list').getByTestId('ticket')).toHaveCount(0);
    const queue = (await snapshot()).queues.find(row => row.id === seedIds.queue);
    expect(queue.next_ticket_no).toBe(3);
    await second.getByTestId('refresh-my-queue').click();
    await expect(ticket(second, 2).getByTestId('ticket-status')).toHaveText('COMPLETED');
    await capture(host, 'closed-queue-drained.png');
  });
});

test('E2E-14 / AC-48 AC-50 AC-38: Host A cannot read or mutate queue B while its assigned Host can serve it', async ({ browser }) => {
  await withSessions(browser, async signIn => {
    const first = await signIn('customer01@dineq.test');
    const second = await signIn('customer02@dineq.test');
    await join(first, 2);
    await join(second, 2, seedIds.barQueue);
    const host = await signIn('host1@dineq.test');
    const before = await snapshot();
    const headers = { Origin: new URL(host.url()).origin };
    for (const path of ['entries', 'tables']) {
      const response = await host.request.get(`/api/queues/${seedIds.barQueue}/${path}`);
      expect(response.status()).toBe(403);
      const json = await response.json();
      expect(json).toEqual({ error: { code: 'FORBIDDEN', message: 'This operation is not permitted' } });
    }
    const called = await host.request.post(`/api/queues/${seedIds.barQueue}/call-next`, { headers });
    const closed = await host.request.patch(`/api/queues/${seedIds.barQueue}`, { headers, data: { status: 'CLOSED' } });
    for (const response of [called, closed]) {
      expect(response.status()).toBe(403);
      expect((await response.json()).error.code).toBe('FORBIDDEN');
    }
    expect(await snapshot()).toEqual(before);
    await host.goto(`/host/queues/${seedIds.barQueue}`);
    await expect(host.getByTestId('error-message').first()).toContainText('403');
    await capture(host, 'other-queue-host-forbidden.png');
    const assigned = await signIn('host3@dineq.test');
    await expect(assigned.getByTestId('host-queue-name')).toHaveText('Bar counter');
    await call(assigned, 1);
    expect((await snapshot()).entries.find(row => row.queue_id === seedIds.queue).status).toBe('WAITING');
  });
});

test('E2E-15 / AC-36 AC-40 AC-42 AC-43: No-show, rejoin, FIFO Seat at a fitting table, Release and owner read-back', async ({ browser }) => {
  await withSessions(browser, async signIn => {
    const first = await signIn('customer01@dineq.test');
    const second = await signIn('customer02@dineq.test');
    await join(first, 3);
    await join(second, 5);
    const host = await signIn('host1@dineq.test');
    await call(host, 1);
    await host.getByTestId('no-show-ticket').click();
    await host.getByTestId('no-show-confirm-yes').click();
    await expect(host.getByTestId('host-notice')).toContainText('Ticket #1: NO_SHOW');
    await first.getByTestId('refresh-my-queue').click();
    await expect(ticket(first, 1).getByTestId('ticket-status')).toHaveText('NO_SHOW');
    await join(first, 2);
    await call(host, 2);
    await expect(host.getByTestId('seat-table').locator(`option[value="${seedIds.table4}"]`)).toHaveCount(0);
    await host.getByTestId('seat-table').selectOption(seedIds.table10);
    await host.getByTestId('seat-ticket').click();
    await expect(host.getByTestId('host-notice')).toContainText('Ticket #2: COMPLETED');
    const table = host.locator(`[data-table-id="${seedIds.table10}"]`);
    await expect(table.getByTestId('table-status')).toHaveText('OCCUPIED');
    await table.getByTestId('release-table').click();
    await expect(table.getByTestId('table-status')).toHaveText('AVAILABLE');
    await second.getByTestId('refresh-my-queue').click();
    await expect(ticket(second, 2).getByTestId('ticket-status')).toHaveText('COMPLETED');
    await first.getByTestId('refresh-my-queue').click();
    await expect(ticket(first, 1).getByTestId('ticket-status')).toHaveText('NO_SHOW');
    await expect(ticket(first, 3).getByTestId('ticket-status')).toHaveText('WAITING');
    const stored = await getTestPool().query('SELECT table_id FROM queue_entries WHERE queue_id=$1 AND ticket_no=2', [seedIds.queue]);
    expect(stored.rows[0].table_id).toBe(seedIds.table10);
    await capture(second, 'no-show-seat-release-readback.png');
  });
});
