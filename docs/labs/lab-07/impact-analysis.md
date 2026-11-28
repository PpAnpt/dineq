# Lab 7 Impact Analysis: Per-Queue Maximum Party Size

> **Status:** Draft v0.1 (2026-11-28) · Companion of `change-request.md` (L7-CR-01) · Findings come from reading the code and tests at commit `1ffb8b0`.

## 1. Impact table

| Dimension | Finding |
| :---- | :---- |
| Requirement | BR-09 (partySize rule) under FR-03. Related: BR-07 (rejected Join consumes no number), BR-01/NFR-03 (unique ticket numbers), BR-12 (transaction). |
| Feature | F-02 Customer Walk-in Ticket Joining (Sprint 1). F-03 reads `partySize` only for display and is not changed. |
| SRS / SDS sections | `docs/srs.md` BR-09. `docs/system-sds.md`: C.2 table rows `service_queues` and `queue_entries`; C.3 Join Transaction; C.4 unchanged; C.5 `/queues` row; C.6 API row for `POST /api/queues/:queueId/entries`; C.6.1 queue JSON; C.6.2 error row `INVALID_PARTY_SIZE`; C.6.3 step 5 wording. |
| Feature contract | `docs/sprints/sprint-1/F-02-join-queue.md`: AC-07 (queue JSON gains `maxPartySize`), AC-12 (revised), new AC-25..AC-27. |
| STS tests | TEST-07, TEST-12 (revised); TEST-25..27 (new). Protected: TEST-08, 09, 10, 11, 13, 21, 23, 24 and F-03 tests (see section 3). |
| Code modules | `server/src/services/queues.js`: `isValidPartySize` (hard-coded 8) is split into a shape check plus a per-queue range check inside `join` (after `SELECT ... FOR UPDATE`, which must also select `max_party_size`); `listQueues` adds `maxPartySize`. `server/src/routes/queues.js`: no logic change (it passes the body value on). |
| UI / API validation | API: `join` as above. UI: `client/src/pages.jsx` `JoinForm` has `max="8"` and the label "Party size (1-8)"; both come from `queue.maxPartySize`. The UI check is only a convenience; the API stays authoritative. `client/src/components.jsx` shows the ticket party size and is unchanged. |
| Roles / ownership | No change. Join is Customer only (403 for Host, 401 without session); the limit is not personal data and is visible to all authenticated roles. |
| Persistence | New column `service_queues.max_party_size integer NOT NULL DEFAULT 8` with `CHECK (max_party_size BETWEEN 1 AND 10)`. `queue_entries.party_size` CHECK widens from 1..8 to 1..10. No new table, no change to events. |
| Historical data | Every existing `queue_entries` row has `party_size <= 8` (the old CHECK guaranteed it), so widening the CHECK cannot invalidate a row. The existing queue row receives the default 8 and keeps behaving as before until the seed raises it. Existing tickets, events and numbers are untouched. |
| Migration | `database/migrations/002_per_queue_party_limit.sql` (the runner applies files in name order and records each name in `schema_migrations`). Steps: `ALTER TABLE service_queues ADD COLUMN max_party_size ...` (default fills existing rows); drop `queue_entries_party_size_check` (the automatic name of the inline CHECK in `001_init.sql`; RED/GREEN work must confirm the name with `pg_constraint`) and add `queue_entries_party_size_check` back as `BETWEEN 1 AND 10`. All inside one transaction. |
| DB-level guard | See section 2. |
| Seed | `database/seed/seedData.js` currently inserts the main queue with `ON CONFLICT (id) DO NOTHING`. It will set `max_party_size = 10` for the main queue and update it on conflict so that re-running the seed on an already-seeded database also reaches 10. The seed is the only place the value 10 is introduced. |
| Deployment | The migration runs through the existing `s21271a0d-migrate` Cloud Run job before the new revision serves. The deployed demo queue stays at 8 until the seed is run on that database; this is an explicit post-deploy step in the release checklist, not a silent assumption. Rollback: the column is additive, so the previous revision keeps working against the migrated schema as long as no party size above 8 has been stored. |
| Not applicable | Authentication, sessions, Origin check (no change). Host Waiting List, Call Next, Complete, FIFO (no change). Tables and capacity (F-05, a different change). Cancel, no-show, multiple-queue management (Sprint 2). Reasons: none of these read or enforce `partySize` limits. |

## 2. Where the rule is enforced after the change, and the DB-guard decision

| Layer | Enforcement |
| :---- | :---- |
| API (authoritative) | After the queue row is locked: `1 <= partySize <= queue.max_party_size`, else `400 INVALID_PARTY_SIZE` naming the limit. Shape check (`integer`, `>= 1`) stays before the lock. |
| Database | `queue_entries.party_size` 1..10 and `service_queues.max_party_size` 1..10. |
| UI | `max` and label read from `maxPartySize`. |

**Decision: no trigger comparing `party_size` with the queue's limit.** A row-level CHECK cannot read another table. A `BEFORE INSERT` trigger could, but it adds a second implementation of the same rule, hides logic from reviewers, and the only insert path (`join`) already holds the queue lock. The guarantee we claim is therefore: the API enforces the per-queue limit under the queue lock, and the database guarantees the absolute range 1..10 for both columns. A direct SQL insert could exceed a queue's own limit (but not 10); this is recorded as a known limitation, not hidden. If the reviewer prefers the trigger, it is an additive change to `002` and to AC-27 and does not change the other items.

**Check order for Join (unchanged order, new range source).** Authentication, role, queue UUID shape, queue exists (404), body shape (400), then inside the transaction: lock queue, per-queue range (400), CLOSED (409), customer account, duplicate active (409), insert. The range check stays before the CLOSED check so that the Sprint 1 behaviour "invalid party size is reported before a closed queue" is preserved.

## 3. Must remain unchanged (and which test protects it)

| Behaviour | Protecting test |
| :---- | :---- |
| Valid Join with 4 returns 201 WAITING, JOINED event written | TEST-08 (`f02-join.test.js`) |
| One active ticket per customer per queue; 409 DUPLICATE_ACTIVE | TEST-09 |
| 30 concurrent Joins give unique, contiguous ticket numbers | TEST-10 (AC-10) |
| Customer cannot read another customer's ticket (403) | TEST-11 |
| Closed queue is 409 QUEUE_CLOSED and consumes no number | TEST-12 closed case |
| Host cannot Join (403) | TEST-13 |
| Ticket and event persist across an app restart | TEST-21 |
| 404/400/401 precedence for malformed or unknown ids | TEST-23, TEST-24 |
| FIFO Call Next, Complete, Waiting List order | `f03-host.test.js`, `controlled-fifo.test.js` |
| Unique ticket and active-ticket indexes, status/timestamp CHECKs | `infra.test.js` INFRA-05/08 |

## 4. Tests that must change because the contract changes (not weakened)

These tests assert the old rule literally. They are changed in the RED step, each with a reason, and recorded in the revision history. No assertion is deleted to obtain green.

| Test | Old assertion | New assertion | Reason |
| :---- | :---- | :---- | :---- |
| TEST-12 invalid sizes in `f02-join.test.js` | 9 is invalid on the seed queue | 9 is valid on the seed queue (limit 10) and invalid on a limit-8 queue; 11 is invalid on the seed queue; 0, 1.5, text, null, missing still invalid | AC-12 revised |
| TEST-12 boundary `[1, 8]` | accepted | `[1, 10]` accepted on the seed queue | AC-12 revised |
| TEST-07 queue JSON shape | exact keys without `maxPartySize` | adds `maxPartySize` | AC-07 revised |
| INFRA-04 schema test (`party_size <= 8`) | CHECK text contains `<= 8` | CHECK text contains `<= 10`, and `service_queues` CHECK for `max_party_size` | Column range widened |
| INFRA-07 `[0, 9]` rejected | 9 rejected by the DB | `[0, 11]` rejected by the DB | Column range widened |
| INFRA-05 `schema_migrations` count | exactly 1 migration recorded | number of `.sql` files in `database/migrations` | Migration `002` is added; the literal 1 would only restate the old file count (found while writing the RED tests) |
| E2E-2 / DEMO-03 (`client/e2e/sprint-1.spec.js`) | label `Party size (1-8)`, out-of-range example 9 | label `Party size (1-10)` and `max=10` for the seeded main queue, out-of-range example 11 (server still rejects it) | UI label and limit come from `maxPartySize`; found when searching the repo for the hard-coded label |
| `join()` helper in the E2E spec and `client/e2e/live-evidence.mjs` | label `Party size (1-8)` | label matched for any per-queue limit | Label text now depends on the queue |

Fixtures that insert entries with `party_size` up to 8 (`controlled-fifo.test.js`, `f03-host.test.js`, `queueFixtures.js`) stay valid with no change.

## 5. Risks and how they are covered

| Risk | Covered by |
| :---- | :---- |
| Limit read outside the lock produces a stale decision | The range check runs after `FOR UPDATE`; AC-25 includes a test that changes the limit between two Joins |
| UI and API disagree | API is authoritative; UI reads the same field; Playwright check of the form `max` |
| Existing data invalidated by the migration | AC-26 test: tickets created before applying `002` are unchanged after it |
| Seed on the deployed database not run, so the demo queue stays 8 | Release checklist item and post-deploy check of `maxPartySize` in `GET /api/queues` |
| Concurrency regression | TEST-10 stays in the regression suite |

## 6. Estimated size

About 6 source files, 1 migration, 2 UI lines, 5 revised tests and about 8 new tests. Bounded to a single behaviour, with data, API, UI and persistence all touched, which is why it is more than a text or constant edit.

## 7. Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial impact analysis, committed before any test or implementation change |
| v0.2 | 2026-11-28 | Add INFRA-05 to the tests that change with the contract (migration count follows the number of migration files); found while preparing the RED tests, recorded before the test commit |
| v0.3 | 2026-11-28 | Add the E2E label/limit changes (DEMO-03 uses 11 against `max=10`) found while searching for the hard-coded 8 in the client; recorded before the E2E test commit |
