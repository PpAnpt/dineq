import { test, expect } from '@playwright/test';
import { resetAndSeed, closeTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

// F-04 browser journey (AC-28, AC-33): join, cancel with confirmation, see CANCELLED, join again.
// Runs against the real API and the PostgreSQL TEST database, from a freshly seeded state.
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

test('E2E-7 / F-04 AC-28 AC-33: cancel needs a confirmation, shows CANCELLED, and a new join gets a new ticket number', async ({ browser }) => {
  const { context, page } = await signIn(browser, 'customer01@dineq.test');
  await join(page, 3);
  await expect(page.getByTestId('ticket-status')).toHaveText('WAITING');
  await expect(page.getByText('Ticket #1')).toBeVisible();

  // Declining the confirmation (button and Escape) leaves the ticket WAITING.
  await page.getByTestId('cancel-ticket').click();
  await expect(page.getByTestId('cancel-confirm')).toBeVisible();
  await expect(page.getByTestId('cancel-confirm-no')).toBeFocused();
  await page.getByTestId('cancel-confirm-no').click();
  await expect(page.getByTestId('cancel-confirm')).toBeHidden();
  await expect(page.getByTestId('cancel-ticket')).toBeFocused();
  await page.getByTestId('cancel-ticket').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('cancel-confirm')).toBeHidden();
  await expect(page.getByTestId('ticket-status')).toHaveText('WAITING');

  // Confirming cancels the ticket; the state comes back from the server.
  await page.getByTestId('cancel-ticket').click();
  await page.getByTestId('cancel-confirm-yes').click();
  await expect(page.getByTestId('ticket-status')).toHaveText('CANCELLED');
  await expect(page.getByTestId('ticket-cancelled')).toBeVisible();
  await expect(page.getByTestId('cancel-ticket')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('ticket-status')).toHaveText('CANCELLED');

  // BR-02: the cancelled ticket no longer blocks a new join, which receives a new number.
  await join(page, 2);
  await expect(page.getByText('Ticket #2')).toBeVisible();
  await expect(page.getByTestId('ticket-status')).toHaveText(['WAITING', 'CANCELLED']);
  await context.close();
});
