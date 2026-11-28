# F-05 table slice verification

Date: 2026-11-28 (Asia/Bangkok). Branch base: 11d6bf5, after contract #104 merge.

| Run | Source | Result | Evidence |
| --- | --- | --- | --- |
| Original RED | 653959a7d35f375e87189e3af8d7541a9a7f5e2b | 23 failed / 157 passed / 0 skipped | [TXT](f05-tables-red.txt), JSON sibling |
| Corrected-fixture RED | ac0cdeab249509416c60227106d61d0da7b9d173 | 23 failed / 157 passed / 0 skipped | [TXT](f05-tables-corrected-red.txt), JSON sibling |
| GREEN / full API regression | a6aea0fb2a76f47d55495c6d039addc2b9edda8c | 180 passed / 0 failed / 0 skipped | [TXT](f05-tables-green.txt), JSON sibling |
| Existing Chromium regression | 5f0bc4ecb9b976731776a76850e481e2e150d3d0 | 6 passed / 0 failed / 0 skipped | [TXT](f05-tables-e2e.txt), JSON sibling |
| Production/workflow/evidence checks | 5f0bc4ecb9b976731776a76850e481e2e150d3d0 | 22 passed / 0 failed / 0 skipped | [TXT](f05-tables-checks.txt) |

Client production build passed. Regenerated historical Sprint 1 screenshots were restored, not committed.

The 26 table-slice cases cover GET table shapes/isolation, read/release access and error order, idempotent/concurrent Release, retained ticket history, seed/migration idempotency, restart and direct DB constraints/legacy upgrade. The corrected-fixture RED and GREEN use identical test files; original fixture corrections and the 178-pass/2-fail implementation probe are disclosed in [the plan](f05-table-plan.md). No assertion was removed, skipped or weakened.

**F-05 is incomplete.** No-show/Seat endpoints, their state/capacity/race/rollback cases and all new UI remain PLANNED / NOT EXECUTED. Migration 003 from F-04 is not on this branch; 004 was exercised independently on a local 001/002 test schema as authorized for parallel work. Do not merge/release this slice before combining with reviewed 003 and verifying the complete migration chain. The six browser cases are existing regression, not new F-05 UI evidence. No cloud/deployment/live-data operation.
