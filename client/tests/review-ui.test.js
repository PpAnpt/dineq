import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// UI regression tests with explicit API response fixtures. They never use/reset
// a database and do not claim to verify backend authorization or transitions.
const origin = 'http://localhost:5173';
const queueId = '22222222-2222-4222-8222-222222222222';
const ticket = {
  id: '33333333-3333-4333-8333-333333333333', queueId, ticketNo: 1, partySize: 4,
  status: 'WAITING', createdAt: '2026-11-07T10:00:00.000Z', calledAt: null, completedAt: null,
};
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

for (const code of ['UNRESOLVED_CALLED', 'INVALID_TRANSITION']) {
  test(`Host refreshes stale list after 409 ${code}, preserving the server error`, async t => {
    const context = await browser.newContext();
    t.after(() => context.close());
    const page = await context.newPage();
    let changed = false;
    let reads = 0;
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/me') return route.fulfill({ json: { data: {
        id: '44444444-4444-4444-8444-444444444444', email: 'host1@dineq.test', role: 'HOST',
      } } });
      if (path === `/api/queues/${queueId}/entries`) {
        reads++;
        const current = code === 'UNRESOLVED_CALLED'
          ? { ...ticket, status: changed ? 'CALLED' : 'WAITING' }
          : { ...ticket, status: 'CALLED' };
        return route.fulfill({ json: { data: changed && code === 'INVALID_TRANSITION' ? [] : [current] } });
      }
      changed = true; // Another Host has already changed the server-side state.
      return route.fulfill({ status: 409, json: { error: { code, message: 'Another Host changed this ticket.' } } });
    });
    await page.goto(`${origin}/host/queues/${queueId}`);
    await page.getByTestId('ticket-status').waitFor();
    const readsBeforeAction = reads;
    await page.getByTestId(code === 'UNRESOLVED_CALLED' ? 'call-next' : 'complete-ticket').click();
    await page.getByTestId('error-message').filter({ hasText: code }).waitFor();
    if (code === 'UNRESOLVED_CALLED') {
      await page.getByTestId('currently-called').getByTestId('ticket-status')
        .filter({ hasText: 'CALLED' }).waitFor({ timeout: 2500 });
    } else {
      await page.getByTestId('empty-state').waitFor({ timeout: 2500 });
      assert.equal(await page.getByTestId('complete-ticket').count(), 0);
    }
    assert.ok(reads > readsBeforeAction, 'A conflict must trigger a new list GET');
    assert.match(await page.getByTestId('error-message').innerText(), /409.*Another Host changed this ticket/s);
  });
}

test('Customer sees why CLOSED queue cannot be joined', async t => {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  await page.route('**/api/**', async route => {
    const me = route.request().url().endsWith('/auth/me');
    return route.fulfill({ json: { data: me
      ? { id: '55555555-5555-4555-8555-555555555555', email: 'customer01@dineq.test', role: 'CUSTOMER' }
      : [{ id: queueId, restaurant: { id: '66666666-6666-4666-8666-666666666666', name: 'Demo' },
        status: 'CLOSED', isAssigned: false }] } });
  });
  await page.goto(`${origin}/queues`);
  await page.getByText('This queue is closed. New tickets are unavailable.').waitFor({ timeout: 2500 });
  assert.equal(await page.getByTestId('join-queue').isDisabled(), true);
});
