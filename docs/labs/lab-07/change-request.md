# Lab 7 Change Request: Per-Queue Maximum Party Size

> **Status:** Draft v0.1 (2026-11-28) · CPE334 Theme 9 · DineQ · Change to an implemented Sprint 1 behaviour

## 1. Summary

| Item | Value |
| :---- | :---- |
| Change ID | L7-CR-01 |
| Requirement changed | BR-09 (FR-03 Join queue) |
| Feature / contract changed | F-02 Customer Walk-in Ticket Joining (Sprint 1) |
| Reason | The restaurant adds 10-seat tables. A fixed global limit of 8 cannot represent different queues (a small counter queue and a large-table queue), so the limit must belong to the queue. |
| Type | Behaviour change of an accepted rule plus a backward-compatible API field and one schema column. Not a cosmetic edit. |

## 2. Baseline and pre-change version

| Item | Value |
| :---- | :---- |
| Accepted Sprint 1 baseline | tag `v1.0-sprint1`, commit `eaa555dfb062d3fc627a374cd55a910b6d609509` |
| Pre-change implementation (full SHA) | `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931` (HEAD of `main` and `sprint-2-staging` when this request was written) |
| Deployed pre-change revision | Cloud Run `s21271a0d-00007-pnb` |
| Test baseline | 112 API/DB tests passed, 0 failed, 0 skipped on `1ffb8b0` (local PostgreSQL, 2026-11-28) |

## 3. Old rule and new rule

**Old rule (Sprint 1, BR-09 / AC-12).** `partySize` must be an integer from 1 to 8 for every queue. Enforced in the API (`isValidPartySize` in `server/src/services/queues.js`), in the database (`CHECK (party_size BETWEEN 1 AND 8)` on `queue_entries`) and in the UI (`min=1 max=8`, label "Party size (1-8)").

**New rule.** Every queue has its own maximum party size `max_party_size`, an integer from 1 to 10, default 8.

1. Join accepts an integer `partySize` from 1 to `max_party_size` of the **target queue**. The limit is read from the queue row that Join already locks with `SELECT ... FOR UPDATE`, so a limit change cannot slip between validation and insert.
2. A `partySize` that is not an integer from 1 up (0, negative, 1.5, text, null, missing) or is greater than the target queue's limit is rejected with `400 INVALID_PARTY_SIZE`. For the "greater than the limit" case the message names the limit, for example `partySize must be an integer from 1 to 4 for this queue`.
3. A rejected Join inserts nothing and consumes no ticket number (BR-07 behaviour unchanged).
4. A Join to a CLOSED queue is still `409 QUEUE_CLOSED`. The existing order is kept: an invalid `partySize` is reported before the closed state.
5. The restaurant's main demo queue is set to 10 by the seed (new 10-seat tables). A queue without an explicit value keeps 8.
6. `GET /api/queues` adds `maxPartySize` to every item. Existing fields are unchanged (additive, backward-compatible).
7. The Join form takes its `max` attribute and label from `maxPartySize` of the queue.
8. The database keeps an absolute ceiling: `queue_entries.party_size` 1..10 and `service_queues.max_party_size` 1..10.

## 4. Scope

In scope: SRS BR-09; F-02 contract and its AC-07/AC-12; new AC-25..AC-27; System SDS (tables, Join transaction, API, error catalog, check order); migration `002`; seed; `join` and `listQueues` services; Join form; tests for the above.

Out of scope: a Host UI/API to change the limit (the value is set by seed or SQL in this change), per-restaurant defaults, changing FIFO, changing Call Next/Complete, table assignment (F-05), any change to authentication.

## 5. Acceptance criteria (summary)

The full rows are in the revised F-02 contract and the Sprint 1 test specification.

| AC | Statement |
| :---- | :---- |
| AC-07 (revised) | Queue list items also contain `maxPartySize` (integer 1..10) |
| AC-12 (revised) | Invalid shape, or a value above the target queue's limit, is `400 INVALID_PARTY_SIZE`; CLOSED is `409 QUEUE_CLOSED`; nothing inserted, no number consumed |
| AC-25 | Per-queue boundaries are enforced (limits 4, 8, 10) and the error names the limit |
| AC-26 | The seeded main queue accepts up to 10; a queue without an explicit value defaults to 8; tickets that exist before the migration stay readable unchanged |
| AC-27 | The database rejects an out-of-range `max_party_size` (0, 11) and a `party_size` above 10; invalid party size is still reported before a closed queue |

## 6. Boundary and invalid cases

| Target queue limit | Accepted | Rejected (400 INVALID_PARTY_SIZE) |
| :---- | :---- | :---- |
| 4 | 1, 4 | 5 |
| 8 (default) | 1, 8 | 9 |
| 10 (main queue) | 9, 10 | 11 |
| any | n/a | 0, -1, 1.5, `"ten"`, `null`, missing |

## 7. Access expectations (unchanged)

| Actor | Join | Read `maxPartySize` |
| :---- | :---- | :---- |
| Customer | Allowed, subject to the rules above | Yes (queue list) |
| Host (assigned or not) | `403 FORBIDDEN` (unchanged, AC-13) | Yes (queue list) |
| No session | `401 UNAUTHENTICATED` (unchanged) | `401` |

The limit is a public property of a queue and contains no personal data.

## 8. Approval

| Item | Value |
| :---- | :---- |
| Instructor / TA approval | Not required. The Lab 7 spec-sheet announcement states that students need not obtain Instructor or TA approval for the Sprint 1 change request, provided the change is a reasonably complex feature and not a trivial one. |
| Announcement | Announcer: PENDING (to be filled from the original post) · Date posted: PENDING · Screenshot: PENDING (attach as evidence) |
| Contract reviewer (teammate) | Siwarak (BBINGOAL) · Review PR number: PENDING |
| Review must happen | Before any test or code change. The contract PR is merged before the RED branch is created. |

## 9. Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial change request, committed before any test or implementation change |
