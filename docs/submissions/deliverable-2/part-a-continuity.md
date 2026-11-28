# Part A: Sprint 1 continuity

## A.1 Accepted baseline

| Item | Value |
| :-- | :-- |
| Accepted Sprint 1 tag | `v1.0-sprint1` = `eaa555dfb062d3fc627a374cd55a910b6d609509` |
| Scope | F-01 login and roles, F-02 join queue, F-03 Host FIFO call and complete (AC-01 to AC-24) |
| Recorded Sprint 1 verification | API/DB 108 passed / 0 failed / 0 skipped at `a7a145e` (`release-full-run`), Chromium 4 passed (`release-e2e-run`) |
| Deployed release before this work | `main` `1ffb8b0`, Cloud Run revision `s21271a0d-00007-pnb` (Sprint 1 plus the Lab 6 controlled-exercise fix); version table: `docs/labs/lab-06/version-ledger.md` (on branch `lab6-staging`, PR #67) |
| Original independent acceptance | HairRoot Accepted the original release `17c8b90` / `00005-rdp` only (Tithinan Sobking, 27 November, relayed through the student; a partner-authored record is still wanted) |
| Acceptance of the later release | HairRoot Accepted `1ffb8b0` / `00007-pnb` (relayed through Siwarak, dated 27 November after the retest, received 28 November; exact time not supplied) |

## A.2 Do the Sprint 1 journeys still work on the candidate?

Evidence (all local, recorded):

- The Sprint 1 critical journey (login, join, Host call, complete, Customer sees COMPLETED) is `E2E-1 / DEMO-01`. It passed in every recorded Playwright run of this work: `l7-e2e-green` (6 passed), `f04-e2e-green` (7), `f06-e2e-green` (7), `f07a-fix-e2e-green` (8), `f05-ui-green` (10), and on the integrated head by CI (run 46128556773, `E2E` step green).
- The Sprint 1 API tests (AC-01 to AC-24) are part of every recorded full-suite run; the last recorded full runs are `f05-final` (257 passed / 0 failed / 0 skipped at `1a3d66d`) and the CI run on `df5923c`.
- Tests that had to change because a contract changed are listed with reasons (Lab 7: TEST-07, TEST-12, INFRA-04/05/07, E2E-2/DEMO-03; F-06: TEST-07, INFRA-05/06; F-05: INFRA-03, the reset helper; F-05 TEST-45 migration list). No assertion was deleted or skipped to obtain a green result.
- **Continuity on the deployed release** (28 Nov 2026, revision `s21271a0d-00008-g6r`): the owner logged in with a demo Customer account and joined and cancelled a ticket in the browser; the full Host journey (Call Next, Complete) was NOT run on the shared deployed service. The Sprint 1 journey is covered by E2E-1 to E2E-4 in the recorded `s2-e2e` run (11 passed) on the same code.

## A.3 Change and defect register (Lab 5 to Lab 7)

| ID | Source | Requirement / area | Decision | Status | Fixed in release | Retest result |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| REG-01 | Lab 5 evidence: oversized JSON body (>100 KB) returned 413 with code `INTERNAL_ERROR` (`docs/known-limitations.md`) | NFR-06 | Accepted as a defect; contract F-09a (413 `PAYLOAD_TOO_LARGE`) | Fixed and merged (PR #105); included in the deployed release | `f3e7c63` / `00008-g6r` (413 not run on the deployed service) | `f09-payload-red` 2 failed, `f09-payload-green` 123 passed (local) |
| REG-02 | Lab 6 controlled exercise CE-FIFO-01 (TA-defined: Call Next chose the newest ticket) | BR-04 FIFO | Fixed with RED then GREEN | Resolved | `1ffb8b0` / `00007-pnb` | HairRoot DQ-UAT-07 reported 9 of 9 PASS, later Accepted |
| REG-03 | Lab 6 independent UAT of DineQ (9 PASS / 2 BLOCKED / 0 FAIL on 25 November) | F-01 to F-03 | No product defect submitted; the two BLOCKED cases were setup dependencies (CLOSED queue prepared, restart observed) | Closed after follow-up observations | n/a | 04C observation PASS, 08B partner-reported PASS |
| REG-04 | Lab 6: HairRoot product finding HR-F01 | not DineQ | Reported by DineQ about another team's product; not counted as a DineQ defect | Out of scope | n/a | n/a |
| REG-05 | Lab 7 change request L7-CR-01 (per-queue party size limit, BR-09) | FR-03, BR-09 | Approved by the teammate before code (PR #98); the announcement (Suthep Madarasmi, screenshot in the Lab 7 evidence) says approval is not needed; the teammate reviewed the contract before any test or code | Implemented and merged (PR #103), activation on the live data by migration `006` (PR #114, merged) | `f3e7c63` / `00008-g6r` | `l7-red` 28 failed, `l7-green` 141 passed, `l7-green-lock` 143 passed (local) |
| REG-06 | Review finding during Sprint 2: migration `003` CHECK accepted a NULL `from_status` | BR-12 | Test first, then fixed before merge | Fixed (PR #106) | `f3e7c63` / `00008-g6r` | `f04-fix-red` 2 failed, `f04-fix-green` 172 passed |
| REG-07 | CI on `sprint-2-staging` failed twice (E2E-11 timing race in a F-05 test) | quality gate | Reproduced with a delayed request, fixed by waiting for the Host result (PR #113) | Fixed; CI green on `df5923c` | `f3e7c63` / `00008-g6r` | CI run 46128556773 success |

Notes: REG-02 to REG-04 are source-qualified Lab 6 records; the PDF must embed the excerpts. No finding is counted as resolved without a recorded run and a commit.
