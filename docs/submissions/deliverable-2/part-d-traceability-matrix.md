# Part D: Traceability matrix (requirement to result)

> **Status:** v0.3 · updated 29 Nov 2026 (FR-03 and BR-09 rows corrected to the post-release state; v0.2 was 28 Nov 2026) after the release: integrated runs at `5e8c9a7` (`s2-integration` 289 passed / 0 failed / 0 skipped; `s2-e2e` 11 passed; CI green) and deployed `main` `f3e7c63`. A PASS here means a recorded local run at the commit named plus the green CI run; deployment checks are listed separately in Part E.5 and were only partly run. Rows marked PLANNED or NOT EXECUTED have no run.

## D.1 Requirement coverage

| Requirement | Meaning | Feature | Sprint | AC / verification | Test file | Result and version |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| FR-01 | Login, logout, current user, role from the server | F-01 | S1 | AC-01..04 | f01-auth.test.js | PASS at `a7a145e` (108 recorded) and in every later recorded suite; CI green on `df5923c` |
| FR-02 | View queues with OPEN or CLOSED | F-02, F-06 | S1, S2 | AC-07 (revised), AC-46 | f02-join.test.js, f06-queues.test.js | PASS: S1 at `a7a145e`; revised AC-07 `l7-green`; AC-46 `f06-green` (`f8cab1e`) |
| FR-03 | Customer joins with a party size | F-02 | S1, Lab 7 | AC-08, AC-12, AC-25..27, AC-26b | f02-join.test.js, l7-party-limit.test.js, l7-activation.test.js | PASS: `l7-green-lock` 143 (`6fa36bf`) and, integrated with migration `006`, `s2-integration` 289 / 0 / 0 (`b05cbd5` on `5e8c9a7`); AC-26b also in `l7-activation-green` 289 (`34f461a`). Deployed (revision `00008-g6r`): the owner saw the form limit 10 and size 10 accepted in the browser (no API status codes) |
| FR-04 | Customer views own tickets and history | F-02, F-07 | S1, S3 | AC-11, AC-23; AC-52..57; AC-58, 59 | f02-join.test.js, f07a-history.test.js | PASS: S1; F-07a `f07a-fix-green` 194 (`d45a2be`); AC-58/59 PLANNED |
| FR-05 | Assigned Host sees WAITING and CALLED | F-03 | S1 | AC-14, AC-24 | f03-host.test.js | PASS at `a7a145e` (108 recorded) and in every later recorded suite; CI green on `df5923c` |
| FR-06 | Host Call Next by FIFO | F-03 | S1 | AC-15, AC-16, AC-24 | f03-host.test.js, controlled-fifo.test.js | PASS at `a7a145e` (108 recorded) and in every later recorded suite; CI green on `df5923c` |
| FR-07 | Host Complete | F-03 | S1 | AC-17, AC-18, AC-24 | f03-host.test.js | PASS at `a7a145e` (108 recorded) and in every later recorded suite; CI green on `df5923c` |
| FR-08 | Customer cancels an eligible ticket | F-04 | S2 | AC-28..35 | f04-cancel.test.js | PASS: `f04-fix-green` 172 (`af2b247`), merged #106 |
| FR-09 | Host records no-show | F-05 | S2 | AC-36, 37, 38, 45 | f05-seating.test.js | PASS: `f05-final` 257 (`1a3d66d`), merged #107 |
| FR-10 | Host seats by capacity | F-05 | S2 | AC-39..45 | f05-seating.test.js, f05-tables.test.js | PASS: `f05-final` 257 (`1a3d66d`) |
| FR-11 | Several queues and Host assignment | F-06 | S2 | AC-46, 50, 51 | f06-queues.test.js | PASS: `f06-green` 171 (`f8cab1e`), merged #108 |
| FR-12 | Assigned Host opens or closes a queue | F-06 | S2 | AC-47..49 | f06-queues.test.js | PASS: `f06-green` 171 (`f8cab1e`) |
| FR-13 | Filter and history of permitted queues | F-07 | S3 | AC-52..59 | f07a-history.test.js | F-07a PASS (`d45a2be`); F-07b PLANNED |
| FR-14 | Host reporting summary | F-08 | S3 | AC-60..64 | none | PLANNED, not implemented |
| FR-15 | Validation, loading, success and error states | F-02, F-09 | S1, S3 | AC-12; AC-75 | f02-join.test.js; Playwright states | S1 partial PASS; AC-75 PLANNED |
| FR-16 | Audit events for ticket transitions | F-02..F-05 | S1, S2 | AC-08, 15, 17, 28, 29, 35, 36, 40, 45 | f02, f03, f04, f05 tests | PASS in the recorded suites |
| BR-01 | Ticket number unique per queue, also under concurrency | F-02, F-06 | S1, S2 | AC-10, AC-50 | f02-join.test.js, f06-queues.test.js | PASS: 30-join test unchanged in every run; AC-50 `f06-green` |
| BR-02 | One active ticket per customer per queue | F-02, F-04 | S1, S2 | AC-09, AC-33 | f02-join.test.js, f04-cancel.test.js | PASS |
| BR-03 | Only logged-in Customers join; only assigned Hosts operate | F-01..F-06 | S1, S2 | AC-05, 06, 13, 19, 20, 24, 30, 38, 48 | f01, f02, f03, f04, f05, f06 tests | PASS |
| BR-04 | FIFO by lowest ticket number | F-03, F-04 | S1, S2 | AC-15, AC-33 | f03-host.test.js, controlled-fifo.test.js, f04-cancel.test.js | PASS |
| BR-05 | No Call Next while a CALLED ticket is unresolved | F-03 | S1 | AC-16 | f03-host.test.js | PASS at `a7a145e` (108 recorded) and in every later recorded suite; CI green on `df5923c` |
| BR-06 | Allowed state transitions only | F-03, F-04, F-05 | S1, S2 | AC-17, 18, 32, 37 | f03, f04, f05 tests | PASS |
| BR-07 | No Join to a CLOSED queue; a rejected Join consumes no number | F-02, F-06 | S1, S2 | AC-12, AC-49 | f02-join.test.js, f06-queues.test.js | PASS |
| BR-08 | Private data only to the owner; Host only own queue | F-02, F-03, F-06, F-07 | S1..S3 | AC-11, 23, 48, 50, 55 | f02, f03, f06, f07a tests | PASS; AC-58, 63 PLANNED |
| BR-09 | Party size rule (fixed 1..8, then per queue) | F-02, Lab 7 | S1, Lab 7 | AC-12 (revised), AC-25..27, AC-26b | f02-join, l7-party-limit, l7-activation tests | Old rule PASS at `a7a145e`; revised rule PASS `l7-green-lock` and `s2-integration`; AC-26b merged (PR #114) and applied by the migration job on the deployed database |
| BR-10 | Cancel and no-show only from allowed states, history kept | F-04, F-05 | S2 | AC-28, 32, 36, 37 | f04, f05 tests | PASS |
| BR-11 | No table that is too small or in use | F-05 | S2 | AC-40, 42 | f05-seating.test.js | PASS |
| BR-12 | Transition and event in one transaction | F-02..F-05 | S1, S2 | AC-15, 17, 18, 29, 34, 45 | f03, f04, f05 tests | PASS (rollback cases with injected failure) |
| NFR-01 | Protected API returns 401 or 403 without private data | F-01..F-06 | S1, S2 | AC-05, 06, 11, 13, 19, 20, 22, 23, 24, 30, 38, 48 | all API test files | PASS |
| NFR-02 | Data readable after a restart | F-02, F-04, F-05, F-06 | S1, S2, Lab 5 | AC-21, 35, 45, 51 | tests with a new app and pool; Lab 5 restart evidence | PASS locally and Lab 5 cloud restart evidence; not repeated on the new release |
| NFR-03 | Concurrent Joins keep numbers unique | F-02, F-06 | S1, S2 | AC-10, AC-50 | f02-join.test.js, f06-queues.test.js | PASS |
| NFR-04 | p95 at most 1000 ms for the listing endpoints | F-09 | S3 | AC-73 | none | NOT EXECUTED: no measurement taken |
| NFR-05 | Argon2id, hashed session token, no real secrets in the repository | F-01 | S1 | AC-01..04 | f01-auth.test.js, infra.test.js, secret scans in reviews | PASS for Argon2id and session hashing (tests); secret scans were run by reviewers on individual PR diffs, and the release diff was scanned twice: the teammate's Gitleaks scan of the release diff (PR #120 body: no leaks, about 3.42 MB) and, on 29 Nov 2026, the assistant's pattern scan of `git diff origin/main` (cloud and GitHub token formats, private keys, password/secret/token assignments) plus exact-match searches for the local demo seed password and the local database password in all tracked files and in the PDF sources: 0 hits; the only e-mail addresses in the PDF sources are synthetic `@dineq.test` accounts. This is a scan of this diff and these files, not a guarantee about all Git history, and Gitleaks was not re-run by the assistant |
| NFR-06 | Clear 400/401/403/404/409/413 errors | F-01..F-04, F-09 | S1..S3 | AC-02, 05, 06, 09, 11, 12, 16, 18, 22, 23, 24, 70..72 | all API tests, f09-payload.test.js | PASS; 413 PASS locally (PR #105), not deployed |
| NFR-07 | Join, Call Next, Complete usable by keyboard | F-09 | S3 | AC-74 | partial checks in Playwright | NOT EXECUTED: no full manual audit |

## D.2 Acceptance criteria: implemented, ran, passed

One row per range of acceptance criteria. "Ran" and "passed" refer to the recorded evidence named; the integrated CI run on `df5923c` repeats the whole API suite and the browser journeys.

| AC | Feature | Implemented? | Ran? | Passed? | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- |
| AC-01..24 | F-01, F-02, F-03 | Yes | Yes | Yes | `release-full-run` at `a7a145e` (108); AC-07 and AC-12 revised by Lab 7 |
| AC-25..27 | Lab 7 | Yes | Yes | Yes | `l7-green-lock` 143 (`6fa36bf`), `l7-e2e-green` |
| AC-26b | Lab 7 activation | Yes (PR #114, merged) | Yes | Yes (local run `34f461a`, the integrated `s2-integration` run and CI on the merged branch); on the deployed database the owner saw the main queue limit 10 | `l7-activation-green` 289 (`34f461a`) |
| AC-28..35 | F-04 | Yes | Yes | Yes | `f04-fix-green` 172 (`af2b247`), `f04-e2e-green` |
| AC-36..45 | F-05 | Yes | Yes | Yes | `f05-final` 257 (`1a3d66d`), `f05-ui-green` 10 |
| AC-46..51 | F-06 | Yes | Yes | Yes | `f06-green` 171 (`f8cab1e`), `f06-e2e-green` |
| AC-52..57 | F-07a | Yes | Yes | Yes | `f07a-fix-green` 194 (`d45a2be`), `f07a-fix-e2e-green` |
| AC-58, 59 | F-07b | No | No | n/a | PLANNED |
| AC-60..64 | F-08 | No | No | n/a | PLANNED |
| AC-70..72 | F-09a | Yes | Yes | Yes | `f09-payload-green` 123 (`e75a598`) |
| AC-73..76 | F-09 | No | No | n/a | PLANNED (AC-76 needs the integrated record) |

## D.3 Uncovered requirements and coverage gaps

| Gap | Detail | Plan |
| :-- | :-- | :-- |
| FR-14 | Reporting summary is contract only | F-08 by 13 December |
| FR-13 (F-07b) | Host history and ticket events are contract only | by 13 December |
| NFR-04 | No measurement | AC-73 plan |
| NFR-07 | No full keyboard audit | AC-74 checklist |
| FR-15 | UX states audited only for selected screens | AC-75 checklist |
| Deployment | No Sprint 2 or Lab 7 behaviour is on the deployed service | release PR, deploy, post-deploy checks |
| Integrated record | `s2-integration` 289 / 0 / 0 and `s2-e2e` 11 passed, recorded (PR #117) | none; deployed checks are in Part E.5 |
| Sprint 1 manual walkthrough | not executed (disclosed in `known-limitations.md`) | repeat on the candidate if time allows |

## D.4 Rules for filling this file

- PASS only with a recorded run and a commit; a row that was not run keeps its status.
- When a contract changes, the old result stays with the old version and the new row starts as planned.
- Replace the snapshot commit and run id after the release candidate is built.
