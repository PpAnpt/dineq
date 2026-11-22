import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EvidenceError, PrerequisiteError, activeEntry, assertHostPrerequisites, assertResponse, assertCallNextTarget,
  assertCompleted, assertEntryState, buildBaseline, validateBaseline, compareC05, pickBaselineFile, resultFileName,
} from '../e2e/live-evidence-lib.mjs';

// Offline checks for the live-evidence helpers (no browser, no network, no live write).
const Q = 'q-1';
const entry = (id, ticketNo, status, queueId = Q) => ({ id, queueId, ticketNo, status, partySize: 4 });
const BASE = 'https://svc.example.run.app';

test('activeEntry returns the single WAITING/CALLED entry and ignores COMPLETED', () => {
  assert.equal(activeEntry([entry('a', 1, 'COMPLETED'), entry('b', 2, 'WAITING')]).id, 'b');
  assert.equal(activeEntry([entry('a', 1, 'COMPLETED')]), null);
});

test('assertHostPrerequisites passes only when the customer ticket is the FIFO head and nothing is CALLED', () => {
  assert.doesNotThrow(() => assertHostPrerequisites([entry('c1', 3, 'WAITING'), entry('c2', 4, 'WAITING')], 'c1'));
});

test('assertHostPrerequisites stops when another customer has an older WAITING ticket', () => {
  assert.throws(() => assertHostPrerequisites([entry('other', 1, 'WAITING'), entry('c1', 3, 'WAITING')], 'c1'), PrerequisiteError);
});

test('assertHostPrerequisites stops when an unrelated CALLED ticket exists', () => {
  assert.throws(() => assertHostPrerequisites([entry('other', 1, 'CALLED'), entry('c1', 3, 'WAITING')], 'c1'), PrerequisiteError);
});

test('assertHostPrerequisites stops when the customer ticket is missing or not WAITING', () => {
  assert.throws(() => assertHostPrerequisites([entry('x', 1, 'WAITING')], 'c1'), PrerequisiteError);
  assert.throws(() => assertHostPrerequisites([entry('c1', 1, 'CALLED')], 'c1'), PrerequisiteError);
});

test('assertResponse accepts the exact status and error code and rejects anything else', () => {
  const dup = { status: 409, body: { error: { code: 'DUPLICATE_ACTIVE' } } };
  assert.doesNotThrow(() => assertResponse('dup', dup, 409, 'DUPLICATE_ACTIVE'));
  assert.throws(() => assertResponse('dup', { status: 500, body: { error: { code: 'INTERNAL' } } }, 409, 'DUPLICATE_ACTIVE'), EvidenceError);
  assert.throws(() => assertResponse('dup', { status: 403, body: { error: { code: 'ORIGIN_NOT_ALLOWED' } } }, 409, 'DUPLICATE_ACTIVE'), EvidenceError);
  assert.throws(() => assertResponse('dup', { status: 409, body: { error: { code: 'OTHER' } } }, 409, 'DUPLICATE_ACTIVE'), EvidenceError);
  assert.throws(() => assertResponse('ok', { status: 200, body: {} }, 201), EvidenceError);
});

test('assertCallNextTarget requires the intended entry id in CALLED state', () => {
  assert.doesNotThrow(() => assertCallNextTarget({ data: entry('c1', 3, 'CALLED') }, 'c1'));
  assert.throws(() => assertCallNextTarget({ data: entry('other', 1, 'CALLED') }, 'c1'), EvidenceError);
  assert.throws(() => assertCallNextTarget({ data: entry('c1', 3, 'WAITING') }, 'c1'), EvidenceError);
});

test('assertCompleted requires the same entry id and COMPLETED', () => {
  assert.doesNotThrow(() => assertCompleted({ data: entry('c1', 3, 'COMPLETED') }, 'c1'));
  assert.throws(() => assertCompleted({ data: entry('c1', 3, 'CALLED') }, 'c1'), EvidenceError);
  assert.throws(() => assertCompleted({ data: entry('zzz', 3, 'COMPLETED') }, 'c1'), EvidenceError);
});

test('assertEntryState finds the entry by id and checks its status', () => {
  const list = [entry('c1', 3, 'COMPLETED'), entry('c2', 4, 'WAITING')];
  assert.doesNotThrow(() => assertEntryState(list, 'c2', 'WAITING'));
  assert.throws(() => assertEntryState(list, 'c2', 'COMPLETED'), EvidenceError);
  assert.throws(() => assertEntryState(list, 'missing', 'WAITING'), EvidenceError);
});

const baseline = () => buildBaseline({
  base: BASE, queueId: Q, capturedAt: '2026-11-22T03:58:06.955Z',
  customer01: entry('c1', 1, 'COMPLETED'), customer02: entry('c2', 2, 'WAITING'),
});

test('buildBaseline stores the base URL, queue id and both entry ids with expected states', () => {
  const b = baseline();
  assert.equal(b.base, BASE);
  assert.equal(b.queueId, Q);
  assert.deepEqual(b.entries.customer01, { email: 'customer01@dineq.test', id: 'c1', queueId: Q, ticketNo: 1, expectedStatus: 'COMPLETED' });
  assert.deepEqual(b.entries.customer02, { email: 'customer02@dineq.test', id: 'c2', queueId: Q, ticketNo: 2, expectedStatus: 'WAITING' });
});

test('validateBaseline rejects another environment, a stale or incomplete baseline', () => {
  assert.doesNotThrow(() => validateBaseline(baseline(), { base: BASE }));
  assert.throws(() => validateBaseline(baseline(), { base: 'https://other.example.run.app' }), EvidenceError);
  assert.throws(() => validateBaseline({ ...baseline(), version: 0 }, { base: BASE }), EvidenceError);
  const noId = baseline();
  delete noId.entries.customer02.id;
  assert.throws(() => validateBaseline(noId, { base: BASE }), EvidenceError);
  assert.throws(() => validateBaseline({}, { base: BASE }), EvidenceError);
});

test('compareC05 passes only when both records keep id, queue and expected status', () => {
  const ok = { customer01: [entry('c1', 1, 'COMPLETED')], customer02: [entry('c2', 2, 'WAITING')] };
  assert.doesNotThrow(() => compareC05(baseline(), ok));
  assert.throws(() => compareC05(baseline(), { ...ok, customer01: [] }), EvidenceError);
  assert.throws(() => compareC05(baseline(), { ...ok, customer01: [entry('c1', 1, 'CALLED')] }), EvidenceError);
  // Same visible text (ticket #2, WAITING) but a different record must not pass.
  assert.throws(() => compareC05(baseline(), { ...ok, customer02: [entry('different-id', 2, 'WAITING')] }), EvidenceError);
  assert.throws(() => compareC05(baseline(), { ...ok, customer02: [entry('c2', 2, 'WAITING', 'other-queue')] }), EvidenceError);
});

test('pickBaselineFile chooses the newest c04 baseline and reports none explicitly', () => {
  const files = ['2026-11-22T03-57-57-443Z-c04-baseline.json', '2026-11-22T05-00-00-000Z-c04-baseline.json',
    '2026-11-22T06-00-00-000Z-c04-results.json'];
  assert.equal(pickBaselineFile(files), '2026-11-22T05-00-00-000Z-c04-baseline.json');
  assert.equal(pickBaselineFile(['x-c04-results.json']), null);
});

test('resultFileName never gives a failed run a success-named results file', () => {
  assert.equal(resultFileName('S', 'c04', true), 'S-c04-results.json');
  assert.equal(resultFileName('S', 'c04', false), 'S-c04-FAILED.json');
});
