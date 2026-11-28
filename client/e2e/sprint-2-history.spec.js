import { test, expect } from '@playwright/test';
import { resetAndSeed, closeTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

// F-07a browser journey (AC-57): the Customer filters their own tickets on My queue by status and
// date range, clears the filter, and sees a clear empty state and a readable validation error.
// Real API and PostgreSQL TEST database, starting from a freshly seeded state.
const password = process.env.SEED_DEMO_PASSWORD;

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

async function join(page, partySize) {
  await page.getByRole('link', { name: 'Queues', exact: true }).click();
  // Scoped to the main queue's card so the helper also works when /queues lists several queues (F-06).
  const card = page.locator(`[data-queue-id="${seedIds.queue}"]`);
  await card.getByLabel(/^Party size \(1–\d+\)$/).fill(String(partySize));
  await card.getByTestId('join-queue').click();
}

test('E2E-9 / F-07a AC-57: filter My queue by status and date range, clear it, empty state and error', async ({ browser }) => {
  const { context, page } = await signIn(browser, 'customer02@dineq.test');
  await join(page, 3);
  await page.getByTestId('cancel-ticket').click();
  await page.getByTestId('cancel-confirm-yes').click();
  await expect(page.getByTestId('ticket-status')).toHaveText('CANCELLED');
  await join(page, 2);
  await expect(page.getByTestId('ticket')).toHaveCount(2);

  // Status filter: only the cancelled ticket remains.
  await page.getByLabel('Status').selectOption('CANCELLED');
  await page.getByTestId('apply-filter').click();
  await expect(page.getByTestId('ticket')).toHaveCount(1);
  await expect(page.getByTestId('ticket-status')).toHaveText('CANCELLED');

  // Keyboard: the filter is applied with Enter on the focused button.
  await page.getByLabel('Status').selectOption('WAITING');
  await page.getByTestId('apply-filter').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ticket')).toHaveCount(1);
  await expect(page.getByTestId('ticket-status')).toHaveText('WAITING');

  // A range in the far future matches nothing: a clear empty state, not an error.
  await page.getByLabel('Status').selectOption('');
  await page.getByLabel('From').fill('2099-01-01T00:00');
  await page.getByTestId('apply-filter').click();
  await expect(page.getByTestId('empty-state')).toContainText('No tickets match');

  // An impossible range is rejected by the server and the message is shown.
  await page.getByLabel('To').fill('2098-01-01T00:00');
  await page.getByTestId('apply-filter').click();
  await expect(page.getByTestId('error-message')).toContainText('VALIDATION_ERROR');

  // Clearing the filter shows both tickets again.
  await page.getByTestId('clear-filter').click();
  await expect(page.getByTestId('ticket')).toHaveCount(2);
  await context.close();
});
