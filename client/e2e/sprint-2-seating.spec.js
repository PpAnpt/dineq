import { test, expect } from '@playwright/test';
import { resetAndSeed, closeTestPool } from '../../server/tests/helpers/index.js';
import { seedIds } from '../../database/seed/seedData.js';

test.beforeEach(async () => { await resetAndSeed(); });
test.afterAll(closeTestPool);
async function signIn(browser, email) {
  const context=await browser.newContext(); const page=await context.newPage();
  await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(process.env.SEED_DEMO_PASSWORD);
  await page.getByTestId('login-submit').click();
  await page.waitForURL(url=>url.pathname!=='/login');
  return {context,page};
}
async function join(page,size) {
  await page.getByRole('link',{name:'Queues',exact:true}).click();
  const card=page.locator(`[data-queue-id="${seedIds.queue}"]`);
  await card.getByLabel(/^Party size/).fill(String(size));
  await card.getByTestId('join-queue').click();
  await expect(page.getByTestId('ticket-status').last()).toHaveText('WAITING');
}
test('E2E-10 / F-05 AC-36 AC-37 AC-38: keyboard No-show confirmation, owner refresh and rejoin retain old history', async ({browser})=>{
  const c=await signIn(browser,'customer01@dineq.test');
  let h;
  try {
    await join(c.page,4);
    h=await signIn(browser,'host1@dineq.test');
    await h.page.getByTestId('call-next').click();
    const called=h.page.getByTestId('currently-called');
    await expect(called.getByTestId('ticket-status')).toHaveText('CALLED');
    await expect(h.page.getByTestId('no-show-ticket')).toBeVisible();
    await h.page.getByTestId('no-show-ticket').focus();
    await h.page.keyboard.press('Enter');
    await expect(h.page.getByTestId('no-show-confirm-no')).toBeFocused();
    await h.page.keyboard.press('Escape');
    await expect(h.page.getByTestId('no-show-ticket')).toBeFocused();
    await expect(called.getByTestId('ticket-status')).toHaveText('CALLED');
    await h.page.getByTestId('no-show-ticket').click();
    await h.page.getByTestId('no-show-confirm-yes').focus();
    await h.page.keyboard.press('Enter');
    await expect(h.page.getByTestId('host-notice')).toContainText('NO_SHOW');
    await c.page.getByTestId('refresh-my-queue').click();
    await expect(c.page.getByTestId('ticket-status')).toHaveText('NO_SHOW');
    await expect(c.page.getByTestId('ticket-no-show')).toBeVisible();
    await join(c.page,4);
    const tickets=c.page.getByTestId('ticket');
    await expect(tickets.filter({hasText:'Ticket #1'}).getByTestId('ticket-status')).toHaveText('NO_SHOW');
    await expect(tickets.filter({hasText:'Ticket #2'}).getByTestId('ticket-status')).toHaveText('WAITING');
  } finally { await c.context.close(); await h?.context.close(); }
});
test('E2E-11 / F-05 AC-40 AC-42 AC-43: fit-only table choice, Seat, Release and retained owner completion', async ({browser})=>{
  const c=await signIn(browser,'customer01@dineq.test');
  let second; let h;
  try {
    await join(c.page,4);
    second=await signIn(browser,'customer02@dineq.test'); await join(second.page,5);
    h=await signIn(browser,'host1@dineq.test');
    await h.page.getByTestId('call-next').click();
    await expect(h.page.getByTestId('seat-table')).toBeVisible();
    await h.page.getByTestId('seat-table').selectOption(seedIds.table4);
    await h.page.getByTestId('seat-ticket').focus(); await h.page.keyboard.press('Enter');
    await expect(h.page.getByTestId('host-notice')).toContainText('COMPLETED');
    const t1=h.page.locator(`[data-table-id="${seedIds.table4}"]`);
    await expect(t1.getByTestId('table-status')).toHaveText('OCCUPIED');
    await t1.getByTestId('release-table').focus(); await h.page.keyboard.press('Enter');
    await expect(t1.getByTestId('table-status')).toHaveText('AVAILABLE');
    await c.page.getByTestId('refresh-my-queue').click();
    await expect(c.page.getByTestId('ticket-status')).toHaveText('COMPLETED');
    await h.page.getByTestId('call-next').click();
    await expect(h.page.getByTestId('currently-called')).toContainText('Ticket #2');
    // T1 is available but too small for party 5, so it is not an eligible option.
    await expect(h.page.getByTestId('seat-table').locator(`option[value="${seedIds.table4}"]`)).toHaveCount(0);
    await h.page.getByTestId('seat-table').selectOption(seedIds.table10);
    await h.page.getByTestId('seat-ticket').click();
    await second.page.getByTestId('refresh-my-queue').click();
    await expect(second.page.getByTestId('ticket-status')).toHaveText('COMPLETED');
  } finally { await c.context.close(); await second?.context.close(); await h?.context.close(); }
});
