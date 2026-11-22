// Pure helpers for client/e2e/live-evidence.mjs. No browser, network or file access here, so every rule can
// be tested offline (client/tests/live-evidence-lib.test.js). A wrong outcome throws; the caller exits non-zero.

export class EvidenceError extends Error {}
// The live queue is not in a state where the script may write safely. Nothing has been changed when this is thrown.
export class PrerequisiteError extends EvidenceError {}

const ACTIVE = ['WAITING', 'CALLED'];
const BASELINE_VERSION = 1;
const normalizeBase = value => String(value ?? '').replace(/\/+$/, '');

/** The customer's single active (WAITING/CALLED) entry from GET /api/me/entries, or null. */
export function activeEntry(entries) {
  return (entries ?? []).find(item => ACTIVE.includes(item.status)) ?? null;
}

/**
 * Host Call Next takes the FIFO head of the WHOLE assigned queue. Only proceed when that head is the
 * customer's own WAITING ticket and no CALLED ticket exists (it would block Call Next or be completed by mistake).
 * Never drain or reset other people's tickets to satisfy this.
 */
export function assertHostPrerequisites(hostEntries, customerEntryId) {
  const entries = [...(hostEntries ?? [])].sort((a, b) => a.ticketNo - b.ticketNo);
  const mine = entries.find(item => item.id === customerEntryId);
  if (!mine) throw new PrerequisiteError('The customer ticket is not in the Host queue list; stopping before any Host action.');
  if (mine.status !== 'WAITING') throw new PrerequisiteError(`The customer ticket is ${mine.status}, expected WAITING; stopping before any Host action.`);
  const called = entries.filter(item => item.status === 'CALLED');
  if (called.length > 0) {
    throw new PrerequisiteError(`Another ticket is already CALLED (ticket #${called[0].ticketNo}); the script will not touch it. Resolve it first.`);
  }
  const head = entries.find(item => item.status === 'WAITING');
  if (head.id !== customerEntryId) {
    throw new PrerequisiteError(`The FIFO head is ticket #${head.ticketNo}, not the customer's ticket #${mine.ticketNo}; Call Next would serve someone else. Stopping before any Host action.`);
  }
}

/** Check an HTTP outcome: exact status and, when given, the exact error code. */
export function assertResponse(label, { status, body }, expectedStatus, expectedCode) {
  if (status !== expectedStatus) {
    throw new EvidenceError(`${label}: expected HTTP ${expectedStatus}, got ${status}${body?.error?.code ? ` (${body.error.code})` : ''}`);
  }
  if (expectedCode !== undefined && body?.error?.code !== expectedCode) {
    throw new EvidenceError(`${label}: expected error code ${expectedCode}, got ${body?.error?.code ?? 'none'}`);
  }
}

/** Call Next must return the intended entry id, now CALLED. */
export function assertCallNextTarget(body, customerEntryId) {
  const data = body?.data;
  if (!data || data.id !== customerEntryId) {
    throw new EvidenceError(`Call Next returned ${data?.id ?? 'nothing'} instead of the customer's entry ${customerEntryId}`);
  }
  if (data.status !== 'CALLED') throw new EvidenceError(`Call Next returned status ${data.status}, expected CALLED`);
}

/** Complete must return the same entry id, now COMPLETED. */
export function assertCompleted(body, customerEntryId) {
  const data = body?.data;
  if (!data || data.id !== customerEntryId) {
    throw new EvidenceError(`Complete returned ${data?.id ?? 'nothing'} instead of the customer's entry ${customerEntryId}`);
  }
  if (data.status !== 'COMPLETED') throw new EvidenceError(`Complete returned status ${data.status}, expected COMPLETED`);
}

/** Find an entry by id in GET /api/me/entries and check its status. */
export function assertEntryState(entries, id, expectedStatus) {
  const found = (entries ?? []).find(item => item.id === id);
  if (!found) throw new EvidenceError(`Entry ${id} not found; expected status ${expectedStatus}`);
  if (found.status !== expectedStatus) throw new EvidenceError(`Entry ${id} is ${found.status}, expected ${expectedStatus}`);
}

/** The C-05 "before" record: environment, queue and the stable ids with the state each must still have. */
export function buildBaseline({ base, queueId, capturedAt, customer01, customer02 }) {
  const record = (email, item, expectedStatus) => ({
    email, id: item.id, queueId: item.queueId, ticketNo: item.ticketNo, expectedStatus,
  });
  return {
    version: BASELINE_VERSION,
    base: normalizeBase(base),
    queueId,
    capturedAt,
    entries: {
      customer01: record('customer01@dineq.test', customer01, 'COMPLETED'),
      customer02: record('customer02@dineq.test', customer02, 'WAITING'),
    },
  };
}

/** Reject a baseline from another environment, an unknown version or one missing ids/states. */
export function validateBaseline(baseline, { base }) {
  if (!baseline || baseline.version !== BASELINE_VERSION) throw new EvidenceError('Baseline is missing or has an unsupported version');
  if (normalizeBase(baseline.base) !== normalizeBase(base)) {
    throw new EvidenceError(`Baseline was captured for ${baseline.base}, not ${normalizeBase(base)}; capture a new c04 baseline for this environment`);
  }
  if (!baseline.queueId || !baseline.capturedAt) throw new EvidenceError('Baseline has no queue id or capture time');
  for (const name of ['customer01', 'customer02']) {
    const item = baseline.entries?.[name];
    if (!item?.id || !item.queueId || !item.expectedStatus) throw new EvidenceError(`Baseline entry ${name} is incomplete`);
  }
}

/** Compare the current /api/me/entries of each customer with the baseline: same id, same queue, expected status. */
export function compareC05(baseline, current) {
  for (const name of ['customer01', 'customer02']) {
    const expected = baseline.entries[name];
    const found = (current[name] ?? []).find(item => item.id === expected.id);
    if (!found) throw new EvidenceError(`${name}: entry ${expected.id} (ticket #${expected.ticketNo}) no longer exists`);
    if (found.queueId !== expected.queueId) throw new EvidenceError(`${name}: entry ${expected.id} is now in queue ${found.queueId}, expected ${expected.queueId}`);
    if (found.status !== expected.expectedStatus) {
      throw new EvidenceError(`${name}: entry ${expected.id} is ${found.status}, expected ${expected.expectedStatus}`);
    }
  }
}

/** Newest c04 baseline by file name (names start with an ISO timestamp), or null. */
export function pickBaselineFile(names) {
  const matches = (names ?? []).filter(name => name.endsWith('-c04-baseline.json')).sort();
  return matches.length ? matches[matches.length - 1] : null;
}

/** Only a fully passing run gets a *-results.json; anything else is *-FAILED.json. */
export function resultFileName(stamp, mode, ok) {
  return `${stamp}-${mode}-${ok ? 'results' : 'FAILED'}.json`;
}

// STUB (red phase for the PR #39 re-review): implemented in the next commit.
export async function assertCustomerBlockedOnHostPage() { return undefined; }
