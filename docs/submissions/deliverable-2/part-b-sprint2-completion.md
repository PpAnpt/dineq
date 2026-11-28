# Part B: Sprint 2 completion

## B.1 Contracts before tests and code

| Feature | Contract | Merged (PR, merge commit) | Review outcome before merge |
| :-- | :-- | :-- | :-- |
| F-04 Customer cancel (AC-28..35) | `docs/sprints/sprint-2/F-04-cancel.md` | #99, `615e70d` | one finding (make AC-33 executable with the UNRESOLVED_CALLED guard), fixed, approved |
| F-05 No-show and tables (AC-36..45) | `docs/sprints/sprint-2/F-05-no-show-seating.md` | #104, `7e51dcb` | findings on missing test impacts and check order, fixed |
| F-06 Queues and open/close (AC-46..51) | `docs/sprints/sprint-2/F-06-queues.md` | #100, `5bfc2b8` | three findings (backfill collisions, response shape, seed-queue ordering), fixed, approved |
| Lab 7 change (AC-25..27, 26b) | `docs/labs/lab-07/` and F-02 v0.4 to v0.6 | #98, `fa13210`; #112, `07952da` | #98: approved before merge. #112: the reviewer's wording point was fixed before the merge, but his record 'Reviewed d1222be, no blocking finding' was written **after** the merge; it is a recorded review, not an Approve before the merge |
| Sprint 3 contracts (AC-52..76) | `docs/sprints/sprint-3/` | #101, `e82d592` | one finding (do not label planned work as implemented), fixed, approved |

Each contract was merged before the branch that holds its tests. The history of each contract is in its Revision History.

## B.2 Completion table (what was implemented, run and passed)

All runs below are recorded evidence files (`docs/evidence/<label>.txt`, with the commit in the header). They are local API/DB and Playwright runs on a real PostgreSQL test database; CI repeated the integrated suite on `df5923c` (run 46128556773, success).

| Feature | AC | Implementation | RED (tests first) | GREEN (same tests) | Playwright | Review and merge |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Lab 7 per-queue party size | 25, 26, 27 (and revised 07, 12) | migration `002`, seed, Join under the queue lock, queue list, Join form | `l7-red`: 28 failed / 113 passed of 141 (`d0554ed`) | `l7-green` 141 passed (`680e8aa`); `l7-green-lock` 143 passed / 0 failed / 0 skipped (`6fa36bf`, adds two under-lock tests requested in review, with a mutation check) | `l7-e2e-green` 6 passed | #103, merge `70b3baa`, approved |
| Lab 7 activation of the live limit | 26b | migration `006` (only the seed queue, only while 8) | `l7-activation-red`: 10 failed (`573365d`) | `l7-activation-green`: 289 passed / 0 failed / 0 skipped (`34f461a`) | `l7-activation-e2e` 11 passed | PR #114 in review, **not merged** |
| F-04 Customer cancel | 28 to 35 | migration `003`, `POST /api/entries/:entryId/cancel`, Cancel button with confirmation | `f04-red`: 15 failed / 155 passed of 170 (`1f62e5d`) | `f04-green` 170 passed (`0805dca`); after the review fix `f04-fix-red` 2 failed then `f04-fix-green` 172 passed (`af2b247`) | `f04-e2e-green` 7 passed | #106, merge `e1d6729`, approved |
| F-06 Multiple queues and open/close | 46 to 51 | migration `005`, seed (Bar counter, host3), `PATCH /api/queues/:queueId`, Host control | `f06-red`: 23 failed / 148 passed of 171 (`5d66497`) | `f06-green` 171 passed (`f8cab1e`) | `f06-e2e-green` 7 passed | #108, merge `0044084`, approved |
| F-05 No-show and table seating | 36 to 45 | migration `004`, tables, release, no-show, seat, Host UI | table slice: `f05-tables-red` 23 failed; seating: `f05-red` 37 failed / 220 passed of 257 (`36b1508`) | `f05-green` / `f05-final` 257 passed / 0 failed / 0 skipped (`1d70493`, `1a3d66d`); review fixes `f05-review-red` 4 failed then `f05-review-green` 185 passed | `f05-ui-green` 10 passed | #107, merge `c874e15` |

Integrated state: CI push run 46128556773 on `df5923c` succeeded after the E2E-11 timing race was fixed (PR #113; two earlier push runs had failed). A recorded integration run (`s2-integration`, `s2-e2e`) is **PENDING** until PR #114 is merged.

## B.3 Two Issue to PR chains to show

| Chain | Issue | Branches and PRs | Reviews |
| :-- | :-- | :-- | :-- |
| Lab 7 | #94 L7-CONTRACT, #95 L7-TDD | docs `l7-change-request` PR #98 (approved) then `test/l7-per-queue-party-limit` PR #103 | contract approved before any test; PR #103 review asked for the under-lock regression, added and re-approved |
| F-04 | #79 | docs PR #99, then `feature/f-04-cancel` PR #106 | P2 on the contract (AC-33) and P2 on the migration CHECK, both fixed with RED first |

## B.4 Honest gaps
- Manual keyboard audit of the new dialogs (AC-74) and any deployed-environment check are not done.
- The deployed system does not yet contain any Sprint 2 behaviour.
