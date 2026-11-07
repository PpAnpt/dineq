# Known limitations — Sprint 1 release candidate

Updated 2026-11-07 (Asia/Bangkok). This is a verified staging candidate; acceptance
on `main` and the release tag are pending human review/merge. Evidence is indexed
in [release-verification.md](evidence/release-verification.md).

## Recorded automated results

At `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`: API/DB 108 passed, 0 failed,
0 skipped; Chromium E2E 4 passed, 0 failed, 0 skipped; UI fixture regressions
3 passed, 0 failed, 0 skipped; client production build passed. AC-01..24 are PASS
for their recorded API cases. This does not certify all possible inputs or later
sprints. The README reproduction initially failed only at its already-used
recording label; the corrected timestamp-label command passed in the fresh clone.

## Observed defect outside the current error catalog

An oversized JSON body (>100 KB) is rejected with HTTP 413 but error code
`INTERNAL_ERROR` and message `request entity too large`. Confirmed using a
synthetic login payload in [release-build-ui-checks.txt](evidence/release-build-ui-checks.txt).
No login/session is created. The response does not match the meaning of an
internal server error, and 413 is not specified in the Sprint 1 error catalog.
This remains unresolved; choosing a documented size limit/error code requires
the normal contract revision before changing behavior. The required small-body
400/401/403/404/409 cases pass their recorded tests.

## Verification not executed

- Manual two-profile DEMO-01 walkthrough: NOT EXECUTED. Desktop browser control
  was unavailable during P6. Headless E2E and real HTTP/SQL process-restart checks
  passed; they are not manual checks.
- Complete manual keyboard/assistive-technology audit and exhaustive
  loading/empty/error-state checklist: NOT EXECUTED. Labels, focus, Enter
  submissions, selected fixture states and selected real errors were checked;
  this is partial coverage. NFR-07's full audit is allocated to Sprint 3.
- Cross-browser, production HTTPS deployment, GCP durability and performance p95
  targets: NOT EXECUTED. Chromium/local PostgreSQL 18/Node 24 on Windows were used.
- Destructive database-loss recovery and restarting the PostgreSQL service were
  not tested. The persistence check stops/restarts the API process against the
  same running DB; TEST-21 also creates a new app/pool.

## Current local behavior and scope

- Minimal plain-CSS UI with explicit Refresh; no live push/polling. Host conflicts
  trigger a re-fetch while retaining the error. A CLOSED queue cannot be joined.
- One restaurant, one queue/counter, fixed local API port 3000 and Vite 5173.
  E2E uses those same ports and requires stopping the dev stack first. E2E resets
  only the separate `_test` database; its contents are disposable.
- Dev startup requires a running PostgreSQL server and both API/client processes.
  A frontend-only startup can display 502; README documents the health checks.
- Seeded synthetic accounts share the locally configured demo password. No
  self-registration, password recovery or account administration is implemented.
- Cancel, no-show, tables, multiple queues, reporting and remaining history/filter
  work are out of Sprint 1 scope. Docker/CI/GCP are due in Lab 5, not implemented
  or claimed complete here. No production hosting is configured by this task.

## Remaining release/submission work

P8 peer review, integration into staging, the reviewed staging-to-main release,
release tag, final PDF Parts A–F, student identity/contribution confirmation,
captions/navigation/page numbers and P9 evidence assembly remain pending. The
theme/assumption confirmations listed in SRS are not claimed to be approved by
the TA. Follow [release-handoff.md](release-handoff.md); no merge/tag was performed
by the release-prep task.
