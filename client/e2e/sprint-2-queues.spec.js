import { test, expect } from '@playwright/test';
import { resetAndSeed, closeTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

// F-06 browser journey (AC-47, AC-49): the assigned Host closes the queue, a Customer sees it closed
// and cannot join, the Host reopens it and the Customer can join. Real API and PostgreSQL TEST database.
const password = process.env.SEED_DEMO_PASSWORD;
const hostPath = `/host/queues/${seedIds.queue}`;

test.beforeEach(async () => { await resetAndSeed(); });
test.afterAll(async () => { await closeTestPool(); });

async function signIn(browser, email) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url => url.pathname !== '/login');
  return { context, page };
}

test('E2E-8 / F-06 AC-46 AC-47 AC-49: Host closes the queue, Customer cannot join, Host reopens, Customer joins', async ({ browser }) => {
  const host = await signIn(browser, 'host1@dineq.test');
  const customer = await signIn(browser, 'customer01@dineq.test');

  // AC-46: the Customer sees both queues with names and the Join control of the main queue.
  await customer.page.goto('/queues');
  await expect(customer.page.getByTestId('queue')).toHaveCount(2);
  const main = customer.page.locator(`[data-queue-id="${seedIds.queue}"]`);
  await expect(main).toContainText('Main queue');
  await expect(customer.page.locator('[data-queue-id="33333333-3333-4333-8333-333333333333"]')).toContainText('Bar counter');
  await expect(main.getByTestId('queue-status')).toHaveText('OPEN');

  // Host closes the queue after confirming (AC-47).
  await host.page.goto(hostPath);
  await expect(host.page.getByTestId('host-queue-name')).toHaveText('Main queue');
  await expect(host.page.getByTestId('host-queue-status')).toHaveText('OPEN');
  await host.page.getByTestId('toggle-queue-status').click();
  await expect(host.page.getByTestId('close-confirm')).toBeVisible();
  await host.page.getByTestId('close-confirm-no').click();
  await expect(host.page.getByTestId('host-queue-status')).toHaveText('OPEN');
  await host.page.getByTestId('toggle-queue-status').click();
  await host.page.getByTestId('close-confirm-yes').click();
  await expect(host.page.getByTestId('host-queue-status')).toHaveText('CLOSED');

  // AC-49: the Customer sees the queue closed and cannot join it.
  await customer.page.reload();
  await expect(main.getByTestId('queue-status')).toHaveText('CLOSED');
  await expect(main.getByTestId('join-queue')).toBeDisabled();
  await expect(main).toContainText('closed');

  // Reopening is immediate (no confirmation) and the Customer can then join.
  await host.page.getByTestId('toggle-queue-status').click();
  await expect(host.page.getByTestId('host-queue-status')).toHaveText('OPEN');
  await customer.page.reload();
  await expect(main.getByTestId('queue-status')).toHaveText('OPEN');
  await main.getByLabel(/^Party size \(1–\d+\)$/).fill('3');
  await main.getByTestId('join-queue').click();
  await customer.page.waitForURL('**/my-queue');
  await expect(customer.page.getByTestId('ticket-status')).toHaveText('WAITING');
  await expect(customer.page.getByTestId('ticket-queue-name')).toHaveText('Main queue');

  await host.context.close();
  await customer.context.close();
});
