# F-05 first implementation slice

Contract #104 merged as 7e51dcb before this branch (base 11d6bf5).
The operator supplied DineQ-BBINGOAL-PROMPTS.md and authorized table/migration,
GET tables and Release work while Anapat implements migration 003.

This slice covers TEST-39 (tables), TEST-43 (release), the applicable read/release
parts of TEST-38 and database/upgrade/seed/restart parts of TEST-45. It does not
complete AC-36..45, No-show, Seat, their races/rollback, or UI. Those remain
PLANNED and wait for F-04/003. Only existing COMPLETED fixtures are used here.

004 adds no new ticket state and is exercised on an isolated local test database
with 001/002 for this parallel branch. Integration/release must include the
reviewed 003 and verify the complete 001 -> 002 -> 003 -> 004 chain before merge;
do not manufacture a placeholder 003 or alter the teammate's state checks.

Existing test/setup changes declared by contract v0.2:
- INFRA-03 UUID id-column count 6 -> 7, new table and FK inventory.
- INFRA-05 retains original identities/counters and adds repeat-seed table checks;
  migration count still follows the actual files, without inventing absent 003.
- resetAndSeed includes dining_tables in the same explicit TRUNCATE when present;
  the pre-004 schema still resets. No CASCADE or non-test database reset.

RED must fail on missing endpoint/schema assertions, without importing missing
implementation modules or attempting fixture inserts into an absent table.
All partial verification remains NOT EXECUTED until real recorded results.

## Fixture corrections found by the first implementation probe

The first unrecorded probe after implementation returned 178 passed / 2 failed:
1. Existing TEST-07's empty-queue fixture deletes service_queues while the newly
   seeded tables still reference it (23503). Clear dining_tables first when it
   exists; preserve both role responses and the exact `{ data: [] }` assertion.
2. TEST-45's foreign-queue occupancy input reused an already occupied entry, so
   PostgreSQL correctly raised 23505 before the intended FK violation. Use a
   separate unoccupied COMPLETED entry for that input; retain both the separate
   duplicate-occupancy 23505 assertion and the cross-queue 23503 assertion.

These are fixture fixes, not relaxed expectations. Record corrected RED on a
fresh test DB with implementation temporarily shelved, then restore unchanged
implementation and record GREEN. Preserve the original RED record as history.
