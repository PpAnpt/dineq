# F-05 final local verification

Tested implementation: `1a3d66dfa57e47df1999c215f24e26ef1577419f`, 28 November 2026 (Asia/Bangkok). This is the complete local API/UI candidate, not a deployed release.

| Run | Actual result | Evidence |
| --- | --- | --- |
| Integrated baseline with F-04/F-06 and migrations 001..005 | 220 passed / 0 failed / 0 skipped | [baseline](f05-integrated-baseline.txt) |
| New No-show/Seat API RED | 37 failed / 220 passed / 0 skipped | [RED](f05-red.txt) |
| API GREEN | 257 passed / 0 failed / 0 skipped | [GREEN](f05-green.txt) |
| Final API regression on complete UI commit | 257 passed / 0 failed / 0 skipped | [final](f05-final.txt), JSON sibling |
| Final UI RED before implementation | 2 failed / 8 passed / 0 skipped | [UI RED](f05-ui-red-final.txt) |
| UI GREEN on the same complete implementation commit | 10 passed / 0 failed / 0 skipped | [UI GREEN](f05-ui-green.txt), JSON sibling |
| Production/workflow/evidence checks | 22 passed / 0 failed / 0 skipped | [checks](f05-final-checks.txt) |
| Existing UI fixture regressions | 3 passed / 0 failed / 0 skipped | [fixtures](f05-final-ui-fixtures.txt) |

## AC mapping from the final Vitest JSON

The 68 F-05 cases span f05-tables.test.js and f05-seating.test.js. Compound cases test their documented subcases; these counts are test cases, not claims of exhaustive input coverage.

| AC | Named tests | Actual cases | Result |
| --- | --- | --- | --- |
| AC-36 | TEST-36 | 2 passed | PASS local |
| AC-37 | TEST-37 | 10 passed | PASS local |
| AC-38 | TEST-38 | 19 passed | PASS local |
| AC-39 | TEST-39 | 3 passed | PASS local |
| AC-40 | TEST-40 | 3 passed | PASS local |
| AC-41 | TEST-41 | 10 passed | PASS local |
| AC-42 | TEST-42 | 1 passed | PASS local |
| AC-43 | TEST-43 | 3 passed | PASS local |
| AC-44 | TEST-44 | 5 passed | PASS local |
| AC-45 | TEST-45 | 12 passed | PASS local |

E2E-10 checks keyboard No-show confirmation (Enter/Escape/focus), owner refresh and rejoin with old history retained. E2E-11 checks fitting table selection, Seat, Release, owner COMPLETED read-back and exclusion of an undersized available table for the next FIFO ticket. The eight existing Sprint 1/F-04/F-06 journeys still pass, including legacy table-less Complete.

## TDD and integration integrity

- Contract #104 merged before this branch. Staging merge d4e05a5 combines reviewed F-04/003 and F-06/005 with 004; all seed IDs, Host assignments, protected guards, logs and traceability rows were retained. The 220-pass baseline used a freshly created local test database and its complete migration chain.
- The 37 new API tests are unchanged from commit 36b1508 through final implementation. RED failures are missing endpoints (404 versus required success/error); GREEN includes real DB state, event actors, race outcomes and forced-event-failure rollback.
- Earlier table-slice fixture corrections and original/corrected RED remain in [the historical slice record](f05-table-verification.md). No assertions were weakened, removed or skipped.
- Initial UI RED timed out on missing controls and its cleanup error obscured the cause. Visibility assertions were added, and the rejoin helper was corrected to select the active WAITING ticket rather than the last historical ticket. All initial records are retained; f05-ui-red-final is the final pre-UI run, and those E2E tests are unchanged through GREEN.
- Build passed. Regenerated tracked Sprint 1 screenshots were restored rather than committed. Browser runs are automated local Chromium, not a manual keyboard/accessibility audit.

## Remaining release limitations

Peer review, merge into sprint-2-staging, final cross-feature E2E with F-07a, release to main, new deployed-version smoke/persistence and non-destructive production demo-data provisioning are separate gates. No merge/deploy/cloud/production data action was performed. Table configuration is seed/SQL only; no automatic allocation/release, shared cross-queue tables or table CRUD API. Cross-table capacity/state checks are API-enforced under Queue -> Entry -> Table locks; DB enforces the declared row/uniqueness/FK rules.
