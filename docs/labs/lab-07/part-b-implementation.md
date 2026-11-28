# Lab 7 Part B: Implementation, review, CI, deploy and post-deploy check

> The change: Sprint 1 rule BR-09 (a Join party size must be 1 to 8, fixed) becomes a per-queue maximum `max_party_size` (1 to 10, default 8; the main demo queue is 10). Contract and impact analysis: Part A (`change-request.md` v0.4, `impact-analysis.md` v0.6). All commit hashes and run numbers below are from the repository; the evidence files are in `docs/evidence/`.

## B.1 Order of work (contract first, review before code)

| Step | What | Where |
| :-- | :-- | :-- |
| 1 | Change request, impact analysis, contract revision (F-02 v0.4, STS v0.5, SDS v0.4) merged **before any test or code** | PR #98, approved by the teammate before merge (10:21 to 11:53 Asia/Bangkok, 28 Nov) |
| 2 | RED: new tests TEST-25..27 plus revised TEST-07/12 written and run on the unchanged code | commit `1df8e6a` (tests), `9353a9c` (record) |
| 3 | GREEN: migration 002, service, route and UI changes; the same tests unchanged | commit `9bdf59d`, `4d3f717` (record) |
| 4 | Review finding: add a regression for a limit changed while a Join waits on the queue lock; mutation check showing the tests fail on a pre-lock validation | commits `52f11ee`, `6fa36bf`, `a9e3617` |
| 5 | Contract revision for activating the live limit (migration 006, AC-26b), reviewed wording fixes, then RED and GREEN for it | PR #112 (contract), PR #114 (tests then migration) |
| 6 | Integration, release, deploy | `sprint-2-staging`, release PR #120, deploy run 46151508392 |

Issues: #70 to #75 (Lab 7 steps) and #94, #95 (collapsed tracking issues).

## B.2 RED: the new tests fail on the old code for the intended reason

Evidence `docs/evidence/l7-red.txt/.json`: **28 failed, 113 passed, 0 skipped of 141** on the pre-change code. The failures are the new behaviour that does not exist yet (the column `max_party_size` and the per-queue limit are missing; the old code still rejects 9 and 10), not import errors or typos. Examples from the record: `TEST-12` boundary partySize 9 and 10 accepted on the seeded main queue (the old code accepted only 1 to 8), `TEST-07` queue list shape (now with `maxPartySize`), and `TEST-25` per-queue limits 4, 8 and 10 with the rejected value naming the limit.
For migration 006 the record `l7-activation-red` shows **10 failed / 279 passed of 289** before the migration file existed.

## B.3 GREEN and regression

| Run | Command (working directory `server`) | Result | Commit |
| :-- | :-- | :-- | :-- |
| `l7-green` | `node node_modules/vitest/vitest.mjs run` | 141 passed / 0 failed / 0 skipped | `680e8aa` |
| `l7-green-lock` (with the under-lock tests) | same | **143 passed / 0 failed / 0 skipped** | `6fa36bf` |
| `l7-lock-mutation` | same, on a temporary mutation (validation before the lock) | the new tests fail, mutation reverted | `6fa36bf` |
| `l7-e2e-green` | `npx playwright test` (client) | 6 passed | `680e8aa` |
| `l7-activation-green` | same API command | 289 passed / 0 failed / 0 skipped | `34f461a` |
| `l7-activation-e2e` | Playwright | 11 passed | `34f461a` |
| `s2-integration` (integrated, fresh schema) | same API command | **289 passed / 0 failed / 0 skipped**, 13 files | `b05cbd5` on `5e8c9a7` |
| `s2-e2e` | Playwright | **11 passed** | `b05cbd5` on `5e8c9a7` |

The Sprint 1 tests that touch the rule (TEST-07 queue list, TEST-12 invalid party size) were revised in the contract first (PR #98) and still pass; every other Sprint 1 test is unchanged and passes in each run. No assertion was weakened, deleted or skipped.

### Code change (summary, not the source)
- `database/migrations/002_per_queue_party_limit.sql`: new column `service_queues.max_party_size` (default 8, CHECK 1 to 10) and the `queue_entries.party_size` ceiling widened to 10; existing tickets stay readable.
- `database/migrations/006_main_queue_party_limit.sql`: `UPDATE` of the fixed seed queue from 8 to 10 only while its limit is 8, so the deployed database gets the new value without running the seed.
- Join (`services/queues.js`): shape check (whole number of at least 1) first, then the queue row is locked (`SELECT ... FOR UPDATE`), then `partySize > max_party_size` returns 400 `INVALID_PARTY_SIZE` naming the limit; the check happens before the closed-queue check and before a ticket number is consumed.
- Queue list returns `maxPartySize`; the Join form label and `max` come from it; the seed sets the main queue to 10.

## B.4 Review, CI, staging, main, deploy

| Stage | Result |
| :-- | :-- |
| Review of PR #103 | the teammate requested changes (a regression for a limit changed while a Join waits); added with a mutation check; re-approved |
| Review of the migration 006 contract (PR #112) | the reviewer's wording point (a deliberate 8 is also raised) was fixed before merge; his record "Reviewed d1222be, no blocking finding" was added after the merge, not before |
| CI | green on every merge into `sprint-2-staging` after the E2E-11 race fix (PR #113); push run 46133838057 on the candidate; the CI inside deploy run 46151508392 |
| Staging | `sprint-2-staging` (integration branch) |
| Main and deploy | release PR #120 merged (`f3e7c63`); deploy run 46151508392: tests, image build with the full SHA tag, migration job execution `s21271a0d-migrate-4m7km` (002 to 006 applied), Cloud Run revision `s21271a0d-00008-g6r` at 100 percent, smoke test passed |

## B.5 Post-deploy check (28 Nov 2026, deployed URL)

Done by hand in the browser by the owner with a demo Customer account; status codes were not captured, so the evidence is the owner's report and the pipeline smoke test.

| Check | Result |
| :-- | :-- |
| New behaviour: the main queue shows a limit of 10 (proves migration 006 on real data) | PASS |
| New behaviour: party size 11 is rejected and the limit is named | PASS |
| New behaviour: party size 10 is accepted | PASS |
| Sprint 1 path that must stay: login works, a WAITING ticket can be cancelled | PASS (cancel is a Sprint 2 feature; login and join are Sprint 1) |
| Sprint 1 Host journey (Call Next, Complete) on the deployed service | NOT RUN (shared service); covered by E2E-1 in the recorded Playwright run on the same code |
| Scripted API check of the same rules | NOT RUN (script `post-deploy-check.mjs`, PR #116, not run against the deployed service) |

## B.6 Limits stated honestly
- The deployed database was not seeded; the change relies on migration 006, which ties data to the fixed seed queue id (recorded as technical debt in Part D).
- Rollback is a reviewed forward fix; there is no automatic rollback and no database down-migration.
- The recorded GREEN counts are local runs plus hosted CI, not deployed-environment test runs.
