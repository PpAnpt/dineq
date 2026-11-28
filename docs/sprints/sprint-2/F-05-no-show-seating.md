# F-05 Host No-show and Table Assignment

> Draft v0.1, 28 November 2026. All AC and verification are **PLANNED / NOT EXECUTED**. Contract proposal for teammate review before tests or implementation. Refs: #92 (contracts), #81 (implementation). AC-36..45 are reserved for F-05; F-04 uses 28..35 and F-06 starts at 46.

## 1. Requirements and bounded decisions

FR-09 permits the assigned Host to mark a called Customer absent. FR-10 requires capacity-aware table assignment. FR-07/16, BR-03/04/05/08/10/11/12 and NFR-01/02/06/07 protect state, FIFO, roles, atomic history, persistence and usable controls.

| Decision | Proposed behavior and reason |
| --- | --- |
| No-show | Only CALLED -> NO_SHOW, by a Host assigned to the entry's queue. Keep calledAt; completedAt and table_id remain null. The terminal ticket remains visible to its owner and frees both active-ticket and unresolved-CALLED rules. |
| Seating | Add a distinct Seat operation for the currently CALLED ticket. Supply an available table of the same queue with capacity >= partySize. Atomically set the entry COMPLETED, retain table_id, occupy the table and write the existing COMPLETED event. No new SEATED state/event. |
| Existing Complete | Keep POST /api/entries/:entryId/complete and its table-less completion unchanged. It remains a legitimate Sprint 1 journey; seating is the new explicit table-assignment path. Do not silently require tableId on the old endpoint. |
| FIFO | No direct seating of WAITING. Call Next still selects the oldest WAITING entry and permits only one CALLED per queue. A small table never authorizes skipping the head. |
| Table scope | Tables belong to a queue. A Host assigned to both A and B still cannot seat A's ticket at B's table. This bounded choice avoids cross-queue shared-table locking. |
| Release | Assigned Host explicitly releases a table, OCCUPIED -> AVAILABLE; releasing an already AVAILABLE table returns the unchanged table (idempotent). This changes no ticket state/event. The completed entry keeps its historical table_id. |
| Closed queue | Existing called/waiting tickets may still be served: No-show, Seat and Release remain available to the assigned Host while CLOSED. New Join remains forbidden. |
| Boundaries | Table capacity is an integer 1..10; equal capacity is sufficient. Join still obeys the target queue's Lab 7 limit, independently of the available tables. |
| Excluded | Table creation/edit/deletion API, table merging, reservations, timers, automatic no-show/release, automatic table choice and cross-queue pooling. Configuration is seed/SQL only. |

Planning base: sprint-2-staging 2181b97414430df315ef99e0f1369b55774e50c4. F-04 contract reviewed at PR #99 / 591ecc7, Lab 7 contract merged through #98. This document does not claim their implementations or migrations exist yet.

## 2. API and response shapes

All successes use `{ data: ... }`; errors use `{ error: { code, message } }`. All endpoints require Session and HOST before parameter/resource checks. Assignment and current state are rechecked under the queue lock. Never use a client-supplied user ID, role, party size or ticket number as authority.

`Ticket` retains the exact SDS C.6.1 shape: id, queueId, ticketNo, partySize, status, createdAt, calledAt, completedAt. The status enum gains NO_SHOW through migration 003; the existing serialized keys do not change. Historical table_id is persisted in the DB, without silently adding a field to every old Ticket response.

`Table` is `{ id, queueId, label, capacity, status, occupiedEntryId, occupiedTicketNo }`. Both occupied fields are null for AVAILABLE; otherwise they identify the current COMPLETED ticket. Never return customer email, customer ID, password/session data or event actor identity.

| Method and path | Request | Success |
| --- | --- | --- |
| POST /api/entries/:entryId/no-show | No body required; parsed extra fields have no effect | 200 `{ data: Ticket }`, status NO_SHOW |
| GET /api/queues/:queueId/tables | No body/query required | 200 `{ data: Table[] }`, ordered label ASC then id ASC; empty queue table list is `[]` |
| POST /api/entries/:entryId/seat | JSON object `{ "tableId": "<UUID>" }`; other fields ignored | 200 `{ data: { entry: Ticket, table: Table } }`, entry COMPLETED and table OCCUPIED |
| POST /api/tables/:tableId/release | No body required; parsed extra fields have no effect | 200 `{ data: Table }`, AVAILABLE, occupied fields null |

The Host table read loads the occupied ticket number through a server-side join, not a client-supplied value. No-table Complete still returns the existing `{ data: Ticket }`. A table release does not erase the completed entry's table_id.

### Check order and errors

Origin guard first for mutating requests: only reject a present foreign Origin with 403 ORIGIN_NOT_ALLOWED. Then Session (401 UNAUTHENTICATED), endpoint Role (403 FORBIDDEN), path UUID shape (400 VALIDATION_ERROR), primary resource exists (404 NOT_FOUND), queue assignment (403 FORBIDDEN), and operation-specific body/target validation.

For Seat, after entry existence/assignment, parse JSON and require an object with a UUID tableId (400 VALIDATION_ERROR). A well-shaped absent table is 404 NOT_FOUND; a table from another queue is 403 FORBIDDEN without exposing its details. Then use the locked transaction's entry status, table occupancy and capacity checks, in that order. A malformed JSON body is 400; oversized JSON follows F-09a once implemented, without moving parsing ahead of auth/role/resource guards.

| HTTP/code | Condition |
| --- | --- |
| 400 VALIDATION_ERROR | Bad path/tableId UUID; missing/null/non-object Seat body; malformed JSON |
| 401 UNAUTHENTICATED | Missing, expired, revoked or inactive Session |
| 403 FORBIDDEN | Customer, unassigned Host, or a table belonging to a different queue |
| 403 ORIGIN_NOT_ALLOWED | Present foreign Origin on a write |
| 404 NOT_FOUND | Primary entry/queue/table missing; missing Seat target table after entry permission/body checks |
| 409 INVALID_TRANSITION | No-show or Seat entry is not CALLED, including repeated operations |
| 409 TABLE_OCCUPIED | Valid CALLED entry but target table OCCUPIED |
| 409 INSUFFICIENT_CAPACITY | Valid CALLED entry and available table, capacity < partySize |

TABLE_OCCUPIED and INSUFFICIENT_CAPACITY are new **planned** error codes for this contract, to be added to the System SDS catalog. All rejected operations leave entries, tables, events and queue counter unchanged. Infrastructure failures use the existing generic 5xx handler, never DB internals.

## 3. Transactions and competing requests

All write paths use one pg client/transaction. Resolve IDs and cheap permissions outside the transaction, then recheck authoritative assignment/resources inside it. Lock order is **Queue -> Entry -> Table** where those resources are needed. Do not introduce Table -> Queue or Entry -> Queue paths.

### No-show

1. BEGIN; lock the entry's service_queues row FOR UPDATE; recheck Host assignment.
2. Lock/reload the entry FOR UPDATE. It must still belong to that queue and be CALLED.
3. Set status NO_SHOW, retain called_at, keep completed_at/table_id null.
4. Insert one NO_SHOW event (CALLED -> NO_SHOW), actor from Session.
5. COMMIT; any failure rolls back both transition and event. No table or ticket counter changes.

### Seat

1. BEGIN; lock the entry's queue; recheck assignment.
2. Lock/reload the entry, then lock/reload the target table. Recheck same-queue relation and resource existence; then require entry CALLED, table AVAILABLE and sufficient capacity.
3. Set entry status COMPLETED, completed_at to the DB timestamp and table_id to the target. Keep id, ticketNo, partySize, createdAt and calledAt unchanged.
4. Set table status OCCUPIED and occupied_entry_id to that entry. Insert one COMPLETED event (CALLED -> COMPLETED), actor from Session.
5. COMMIT; if event/table/entry writing fails, roll back all three effects. No queue number consumed.

### Release

BEGIN; lock the table's queue, recheck assignment, lock/reload table. If OCCUPIED, set AVAILABLE and clear occupied_entry_id; if AVAILABLE, return it unchanged. COMMIT. Do not clear queue_entries.table_id, reopen the ticket or write a duplicate COMPLETED event. No-show/release require no new event types beyond 003 because release is table administration, not a ticket state transition.

Queue locking serializes competing Seat/No-show and Seat/Release requests. Two concurrent Seat requests for the same CALLED entry (same or different tables) give exactly one 200; the loser sees COMPLETED and returns 409 INVALID_TRANSITION. No-show versus Seat likewise gives exactly one terminal transition/event. A release racing a seat may be a no-op before occupation or free the table afterward; both serial histories must retain the entry's historical link.

Do not create an invalid fixture with two CALLED entries in one queue: the preserved partial unique index forbids it. The existing Complete endpoint only locks the entry; it never subsequently requests the queue/table lock, so it cannot invert the new lock order. Seat versus legacy Complete must produce only one COMPLETED event and either an occupied assigned table (Seat won) or no occupancy (Complete won).

## 4. Planned data and migration 004

`database/migrations/004_no_show_seating.sql` is **to be implemented after review**, not added by this PR. It runs transactionally through the existing schema_migrations runner. Required implemented predecessors: 002 (Lab 7 range/limit) and 003 (F-04 CANCELLED/NO_SHOW status, timestamp and event checks). Do not edit/reapply 003's state/event checks in 004.

| Table/constraint | Planned definition or effect |
| --- | --- |
| dining_tables | id UUID PK with generated default; queue_id UUID NOT NULL FK service_queues; label text NOT NULL; capacity integer NOT NULL; status text NOT NULL DEFAULT AVAILABLE; occupied_entry_id UUID nullable |
| Labels/capacity/state | label trimmed length 1..60; UNIQUE(queue_id,label); capacity BETWEEN 1 AND 10; status IN (AVAILABLE,OCCUPIED) |
| Occupancy row check | AVAILABLE iff occupied_entry_id IS NULL; OCCUPIED iff occupied_entry_id IS NOT NULL |
| One current table per entry | UNIQUE(occupied_entry_id), allowing multiple nulls |
| Historical link | Add queue_entries.table_id UUID nullable, initially null for every legacy entry; require table_id IS NULL OR status = COMPLETED |
| Queue-consistent foreign keys | UNIQUE(id,queue_id) on entries and tables; FK dining_tables(occupied_entry_id,queue_id) -> queue_entries(id,queue_id), and FK queue_entries(table_id,queue_id) -> dining_tables(id,queue_id), using nullable/default MATCH SIMPLE and restrictive deletion. Create tables/unique keys first, then add the circular nullable FKs. This rejects cross-queue raw links without triggers. |
| Existing partial indexes | Unchanged: active Customer WAITING/CALLED, one CALLED per queue, UNIQUE(queue_id,ticket_no) |
| History/events | No new ticket state/event in 004. Legacy tickets/events remain byte-for-byte equivalent in their existing columns. table_id retains the Seat link after Release. |

DB constraints enforce ranges, row shape, uniqueness and queue-consistent references. The API enforces role, legal operation/state, capacity compared with partySize and coordinated table/entry updates under the queue lock. No cross-table capacity/state trigger is claimed. Direct privileged SQL is outside the API guarantee, as with the Lab 7 enforcement decision.

Seed two deterministic-ID tables on seedIds.queue: `T1` capacity 4 and `T2` capacity 10, initially AVAILABLE. Insert only if those seed IDs are absent; rerunning seed must never release an occupied table or overwrite historical links/counters. Keep existing users/Host assignments and queue limit semantics. F-06's extra queue is not required by this seed; multi-queue negative tests create separate fixtures. Configuration/migration must not reset live tickets.

### Implementation module plan

| File | Planned responsibility |
| --- | --- |
| server/src/services/seating.js | createSeatingService with listTables, noShow, seat and releaseTable; shared Table serialization; queue-first transactions and assignment recheck; reuse the existing Ticket serializer |
| server/src/routes/seating.js | createSeatingRoutes; UUID/resource/assignment resolution before Seat JSON parsing; delegate business behavior to the service |
| server/src/routes/index.js | Register all four endpoints as protected Host-only paths; retain existing public login/health and endpoint precedence |
| database/migrations/004_no_show_seating.sql | Add the planned tables, nullable historical link and constraints without changing 003 |
| database/seed/seedData.js | Insert absent deterministic T1/T2 only; never clear occupancy on conflict |
| server/tests/f05-seating.test.js and tests/helpers | Real DB/API tests TEST-36..45, legal active-ticket fixtures and temporary fault injection |
| client/src/pages.jsx and components.jsx | Host table/status/action controls and Customer NO_SHOW presentation, confirmation and keyboard/error states |
| client/e2e/sprint-2.spec.js | New bounded journeys after reviewed API/UI implementation; preserved Sprint 1 journey stays in its original suite |

Authentication/session/Origin middleware, F-04 cancellation logic, existing Call Next/Complete implementation, dependency manifests and container/configuration are unchanged unless a separately reviewed contract revision identifies a need.

## 5. Screens and access matrix

On `/host/queues/:queueId`, load active entries and that queue's tables. For the CALLED entry, show No-show with a keyboard-accessible confirmation and a table selector/Seat button. Show each label/capacity/status; disable occupied or undersized choices as UX only. The backend must still reject a forged request. Show Release on occupied tables; it does not complete another ticket. Retain existing Call Next and table-less Complete, clearly labelled as separate actions.

During initial loading or a mutation, show progress and prevent duplicate submissions. Empty tables: explain no tables are configured while keeping legacy Complete usable. Show success, structured server error/code and Refresh; on a race/409 refresh both entry/table state. Modal confirmation supports Enter/Escape, visible focus and return focus. Inputs have labels; controls are real buttons; add stable data-testid for E2E.

On Customer `/my-queue`, show NO_SHOW as terminal, preserve the original ticket record and allow navigation to rejoin. There is no Customer No-show/Seat/Release control. A hidden control does not replace permission tests. No new page/production SPA fallback route is needed.

| Operation | Assigned Host | Other Host | Customer | Anonymous |
| --- | --- | --- | --- | --- |
| Queue tables / No-show / Seat / Release | Own queue only | 403 | 403 before UUID/body | 401 before UUID/body |
| Read ticket after No-show/Seat | Existing assigned-Host access | 403 | Owner only, existing API | 401 |

## 6. Acceptance criteria and STS

Each subcase gets a real named test beginning `TEST-xx / AC-xx:`. All rows are PLANNED. A table of cases is test design, not executed evidence.

| AC/Test | Preconditions and actual inputs to use | Required expected observations | Level |
| --- | --- | --- | --- |
| AC-36 / TEST-36 | Assigned H1 marks current CALLED A No-show; owner reads A, then rejoins; H1 calls next with another WAITING B | 200 NO_SHOW, calledAt retained/completedAt null, same UUID/number/size; exactly one NO_SHOW event with session actor; owner GET shows NO_SHOW; A owner may rejoin with new number; next call selects oldest WAITING B; no table/counter side effect from No-show | API + DB |
| AC-37 / TEST-37 | No-show and Seat requested on WAITING, COMPLETED, CANCELLED, NO_SHOW entries; repeat No-show/Seat after success | 409 INVALID_TRANSITION; all entry/event/table/counter snapshots unchanged, including table_id; never seat WAITING or bypass FIFO | API + DB boundary |
| AC-38 / TEST-38 | Each new endpoint: anonymous; Customer; H2 unassigned; H1 assigned to A targeting B resources; foreign Origin on writes; malformed/missing primary UUID; missing Seat body combined with no Session/Customer | 401 then role 403 before UUID/body; authorized malformed ID 400, well-shaped absent resource 404 before assignment; foreign Origin 403; unauthorized responses contain no protected fields. DB unchanged in every rejection | API + authorization |
| AC-39 / TEST-39 | H1 reads queue A seeded T1/T2, B has distinct tables; queue with no tables; occupied table linked to a completed entry | 200 ordered Table array with exact documented keys, accurate capacity/state/entry UUID/number and no personal fields; only selected queue's tables; no tables -> data [] | API + DB |
| AC-40 / TEST-40 | Valid CALLED parties 1, 4, 10 (fresh fixtures per run); same-queue available table equal/larger capacity; Seat then owner GET, tables GET and Host active list | 200 entry COMPLETED and table OCCUPIED; same original ticket fields, non-null completedAt/table_id; correct occupied entry/number; one COMPLETED event; entry removed from active list; no renumber or counter use. Test on CLOSED queue too: existing ticket still served | API + DB |
| AC-41 / TEST-41 | Assigned Host Seat with missing/null/array/string body, missing/non-string/malformed tableId, well-shaped absent table, another queue's table (even if Host assigned to both), extra forged role/user/status/partySize | 400 VALIDATION_ERROR for malformed body/UUID; absent target 404; cross-queue target 403; forged extra fields cannot alter authority/ticket. No DB effects. Preserve entry existence/assignment before parsing body | API + boundary/access |
| AC-42 / TEST-42 | CALLED party 5 with available capacity 4; occupied sufficient table; compare with party 4/table 4 and party 10/table 10 controls; insufficient and occupied simultaneously | 409 INSUFFICIENT_CAPACITY for available undersized; 409 TABLE_OCCUPIED for occupied before capacity; rejected entry remains CALLED, existing occupant/link/events/counter unchanged; equal capacity controls succeed. No FIFO skip | API + DB rule |
| AC-43 / TEST-43 | Release occupied table after Seat; repeat Release; verify old ticket and event; serve No-show/Seat/Release on a CLOSED queue | Release 200 AVAILABLE, occupied fields null; repeat same 200 without further change; completed ticket/table_id/event retained. Queue CLOSED/counter unchanged. Another valid CALLED entry can later use the released table | API + DB |
| AC-44 / TEST-44 | Concurrent Seat same CALLED entry to same/different tables; No-show vs Seat; Seat vs legacy Complete; Seat vs Release; use only legal one-CALLED fixtures | Exactly one terminal entry transition and event. Competing Seat/No-show losers get 409; at most one table occupied by the entry, no leaked capacity. Legacy Complete winner leaves no table occupied. Seat/Release state matches one serial ordering with history retained. No duplicate event or deadlock; reject two-CALLED fixture setup rather than weakening the index | API + DB concurrency |
| AC-45 / TEST-45 | Upgrade existing tickets/events through 004 and repeat runner/seed; force event INSERT failure for No-show and Seat; restart app/pool against same DB; direct DB invalid capacity 0/11, empty/61-char label, duplicate queue label, invalid occupancy, duplicate occupied entry, cross-queue FK, non-COMPLETED table_id | Legacy data unchanged, table_id null until Seat; migration runner idempotent; seed never releases occupied data. Forced event failure returns generic 5xx and rolls back every entry/table/event change. Real post-restart reads retain NO_SHOW, COMPLETED/table links and occupied/released state. CHECK violations 23514, uniqueness 23505, FK 23503 as appropriate | DB migration/constraints + atomicity + restart |

Selected UI journeys to implement after API GREEN: Join -> Call -> No-show -> owner Refresh/rejoin; and Join -> Call -> undersized rejection -> Seat at sufficient table -> Release -> retained owner COMPLETED. Include a preserved Sprint 1 no-table Complete journey and direct backend forbidden-role/ownership evidence. No result is pre-filled.

## 7. Dependencies and Definition of Done

- Teammate reviews this contract/SDS/STS before implementation; record reviewed head and merge. Do not implement against an unmerged draft.
- 003 owns NO_SHOW/CANCELLED checks; 004 only adds tables/history linkage. Coordinate with F-04 owner; do not edit their migration. Implemented 002/003 must be available before F-05 tests rely on their schema. Contract design can proceed first.
- RED tests assert new behavior against pre-change code; fixture/setup failures do not count. Plan schema-specific fixture tests against a controlled migrated test DB, and API RED cases that fail on missing endpoints/behavior, not an undefined column/import. Keep isolated TEST_DATABASE_URL and no live reset.
- Commit tests, then clean-tree RED recording separately; implement 004/services/routes/UI; the same tests GREEN; record API/DB, relevant production checks and E2E with full SHA/command/counts. No skips/assertion weakening.
- Register per-endpoint auth/role guards and error catalog additions. Reuse existing password/Session/Origin logic. No new env variable, dependency, Docker port or cloud resource is required.
- Update traceability only with real recorded verification. Baseline TEST-10, TEST-15/16/17, cancellation, closed-queue and ownership behavior remain regression targets.
- Issue -> feature branch -> peer review/CI -> sprint-2-staging -> reviewed main/pipeline -> new-version smoke/persistence evidence. This docs PR performs none of the release actions.
- Keep all F-05 scope visible, including UI. API-only delivery is an incomplete UI outcome, not silent Sprint 2 completion or an automatically approved scope revision; coordinate any necessary revision with the course rules.
- Append AI-use/contribution records and known limitations: seed/SQL table administration, queue-scoped tables, no automatic allocation/release, API enforcement of cross-table capacity/state, and source-qualified unexecuted checks.

## Revision History

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-11-28 | Proposed complete F-05 contract and TEST-36..45 before tests, migrations or implementation; reserved 004 and retained Sprint 1 Complete |
