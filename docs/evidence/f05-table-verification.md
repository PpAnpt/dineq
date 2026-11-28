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

## PR #107 review follow-up

The four new service cases exercise account state/role changed after a trusted user context was loaded; an ordinary inactive-cookie HTTP request was already protected by Session middleware (401), and its new regression passes. Service assignment checks now match host.js: JOIN users, active HOST, generic Forbidden text, including the transaction recheck.

- [Review RED](f05-review-red.txt), source 4c0872c: **4 failed / 181 passed / 0 skipped**.
- [Review GREEN](f05-review-green.txt), source ed3b57299fc6da3d27235b9e0ba136b011ce7a4f: **185 passed / 0 failed / 0 skipped**.
- [Private-schema GREEN](f05-review-searchpath.txt), same source: **185 passed / 0 failed / 0 skipped**, fresh isolated local database, search_path=f05_review and no public application tables.
- [Browser regression](f05-review-e2e.txt): **6 passed / 0 failed / 0 skipped**.

The new active-Host assertions are unchanged between review RED/GREEN. P3 separately changes schema references in helpers, infrastructure inventory and upgrade-fixture source selection to follow current_schema/search_path; no assertion is loosened or removed. This is 31 F-05 slice cases, not full AC-36..45 completion. No-show/Seat/UI and integration with reviewed 003/005 remain pending.

## Superseded local slice status

The earlier pending No-show/Seat/UI work is implemented in the [full F-05 record](f05-verification.md). Earlier slice counts and limitations above remain historical, not the latest candidate status.
