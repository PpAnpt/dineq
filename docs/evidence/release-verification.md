# Sprint 1 release-candidate verification — P8

Date: 2026-11-07 (Asia/Bangkok). **Ready for peer review; accepted main release
and tag pending.** This task did not approve/merge PRs or create a tag.

## Tested versions and actual results

The clean-source candidate is
`a7a145ec6b870abaed2b3ae13a88e0ffa832818d`. Subsequent P8 commits add only
documentation and evidence. Application, migrations, dependency lock and test
source match integrated staging baseline
`3d2ba1b78714f51127cdf07b7e44951c06ed8d7a`.

| Check / exact command | Actual result | Evidence |
| --- | --- | --- |
| `npm run test:record -- release-full-run` | 108 passed / 0 failed / 0 skipped; 4 API/DB test files | [text](release-full-run.txt), [JSON](release-full-run.json) |
| `npm run test:e2e:record -- release-e2e-run` | 4 passed / 0 failed / 0 skipped; Chromium, one worker, retries 0 | [text](release-e2e-run.txt), [JSON](release-e2e-run.json) |
| `npm run test:review --workspace=client` | 3 passed / 0 failed / 0 skipped; UI response fixtures | [build/UI output](release-build-ui-checks.txt) |
| `npm run build:client` | PASS, 19 modules transformed | [build/UI output](release-build-ui-checks.txt) |
| External fresh-clone README setup | npm ci, both migrations, seed, API tests and build PASS; one recording-label command failed then fixed | [original transcript](release-fresh-clone.txt), [corrected label run](release-fresh-clone-fixed-label.txt), [JSON](release-fresh-clone-fixed-label.json) |
| New API process, same DB, HTTP retrieval + SQL event comparison | PASS; same COMPLETED ticket and all three event rows | [restart transcript](release-restart-persistence.txt) |
| Current-tree secret scan | PASS; no configured secrets/private keys/recognized token values; `.env` not tracked | [scan report](release-secrets-check.txt) |
| Manual two-profile walkthrough / complete keyboard audit | NOT EXECUTED | [known limitations](../known-limitations.md) |
| Accepted release on main / release tag / final PDF | NOT EXECUTED | [release handoff](../release-handoff.md), P9 pending |

Counts are separate suites, not 115 real-DB cases: the three UI regressions use
explicit response fixtures. The full API report contains **100 feature cases**
mapping to AC-01..24 plus **8 infrastructure cases**. No acceptance criteria or
test assertions were changed in P8. No failed/skipped automated cases are hidden.

## Fresh clone and README correction

Cloned `sprint-1-staging` from GitHub into
`C:\Users\siwal\AppData\Local\Temp\dineq-p8-repro-5bf3659d65`, outside the project.
The original cloned commit was `3d2ba1b78714f51127cdf07b7e44951c06ed8d7a`.
The clone had its own newly installed node_modules and `.env` copied from
`.env.example`; no existing `.env`, node_modules, migration state or DB contents
were copied from the working project. The existing PostgreSQL 18 installation
was a prerequisite, with two new empty databases created for this run:
`dineq_p8_468b401c_dev` and `dineq_p8_468b401c_test`. A new demo password was generated
and kept only in the ignored clone `.env`. The DB account/host/port were supplied
as local configuration, as README requires; credentials were never printed.

The `createdb` CLI used `--no-password` with its password in the child process
environment instead of the interactive `-W` prompt. This is the noninteractive
credential-entry adaptation; the database creation operations are the same.
All npm setup/migrate/seed/test/build commands were executed as documented.

The original README example `npm run test:record -- p2-infra-green` failed with
`Evidence label already exists; choose a new label` (exit 1). That is a documentation
reproduction failure, not a failing acceptance test. The README now constructs a
new timestamp label. After fetching the release-prep branch, the clone executed
that exact PowerShell label construction and recorded 108 passed / 0 failed /
0 skipped at `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`. The copied report retains
the original command/output path `local-20261107-200036` in its header; it has not
been relabeled as another run. `.env.example` and scripts required no changes.

## Actual process restart and persisted data

The restart check ran the freshly cloned source at `3d2ba1b...`, after its fresh
dev migration/seed. For precise process control the script launched
`node server/src/server.js` (the documented `npm start` entry point) and the Vite
CLI used by `npm run dev:client`. It checked API health, proxy health and Login
HTML, then performed real HTTP operations with server-issued session Cookies.
It did not print passwords, tokens or Cookie headers.

| Step | Actual result |
| --- | --- |
| Customer login, Host login | HTTP 200, roles CUSTOMER/HOST from server |
| Customer join partySize 4 | HTTP 201, ticketNo 1, WAITING |
| Host Call Next | HTTP 200, same ticket CALLED |
| Host Complete | HTTP 200, same ticket COMPLETED |
| Stop/restart API | PID 11084 stopped; new API PID 39880 started against the same DB |
| Customer retrieves after restart | HTTP 200, identical ticket UUID `13759b1d-7627-4ec4-a9a7-5c013317a960`, number, partySize, status and timestamps |
| SQL events before/after restart | Identical JOINED → CALLED → COMPLETED rows, including event UUIDs/timestamps |

There was no DB reset between processes. The existing session remained valid,
also demonstrating that session state is stored in PostgreSQL. Full real output
is retained in [release-restart-persistence.txt](release-restart-persistence.txt).
[release-restart-source.mjs](release-restart-source.mjs) is the executed temporary
script snapshot; it expects the task's ignored manifest with the fresh-clone path
and DB names, not embedded credentials. It is evidence of this run rather than
a generic DB-reset tool. P8 does not claim a PostgreSQL service restart or DB-loss
recovery test.

## AC and screenshot evidence

[release-ac-results.md](release-ac-results.md) lists every actual recorded
test file/name/result. The STS execution table groups those 100 feature cases
into 24 AC rows and records the full tested SHA. Traceability distinguishes local
PASS results from unexecuted later-sprint/manual/GCP work.

The release E2E run regenerated the nine screenshots at the suite's normal
`docs/evidence/screenshots` location. They were copied to
`docs/evidence/release-screenshots/`, then the historical screenshot directory
was restored so the older `e2e-green` evidence set is preserved. This release
snapshot belongs to `release-e2e-run` at the candidate SHA above.

| Release screenshot | Scenario / linked AC |
| --- | --- |
| `release-screenshots/DEMO-01-step-1.png` | Customer WAITING, partySize 4, ticket number; AC-08 |
| `release-screenshots/DEMO-01-step-2.png` | Assigned Host CALLED; AC-14/15 |
| `release-screenshots/DEMO-01-step-3.png` | Host completion result; AC-17 |
| `release-screenshots/DEMO-01-step-4.png` | Customer reload retrieves COMPLETED; AC-17 |
| `release-screenshots/DEMO-02-step-1.png` | DUPLICATE_ACTIVE 409; AC-09 |
| `release-screenshots/DEMO-03-step-1.png` | INVALID_PARTY_SIZE 400 from backend after deliberate browser-only validation bypass; AC-12 |
| `release-screenshots/DEMO-04-step-1.png` | Customer Host-page denial, with direct API 403 assertion in run; AC-06/20 |
| `release-screenshots/DEMO-05-step-1.png` | Signed-in Customer before logout; AC-03/04 |
| `release-screenshots/DEMO-05-step-2.png` | Login after logout, old-Cookie API 401 assertion in run; AC-04 |

These are automated Chromium screenshots. P9 must add final release reference,
role, starting conditions, steps and actual/expected captions to the PDF.

## Disclosure and release handoff

The oversized-body probe observed HTTP 413 with code `INTERNAL_ERROR`; this is
an unresolved catalog/implementation limitation, not one of the passing AC cases.
The scan checked both the working project's and fresh clone's actual local
demo/DB password values, literal `password=` occurrences, recognizable token
formats and private-key blocks. It is a current-tree heuristic scan, not an
audit of all history or a guarantee against unknown secret formats.

Dev services were restored after the fixed-port checks. No existing dev records
were deleted; the reproduction used newly created DBs. The temporary clone and
local credentials are not committed. The accepted main commit/tag and human
review fields must be filled from the eventual real merge, not inferred here.
Use [release-handoff.md](../release-handoff.md) for the exact release PR/tag commands.
