# B3 cross-feature verification plan

Refs #97 and #87. Source baseline: sprint-2-staging 52fc897; the application was released through #120 as f3e7c63. These are additional local regression journeys against an isolated TEST_DATABASE_URL, not production probes or a new implementation RED/GREEN claim.

Contracts already merged: F-04 AC-28/33; F-05 AC-36/40/42/43; F-06 AC-48/49/50; F-07a AC-57; Sprint 1 AC-01/08/15/17/21.

| Journey | Existing coverage | Addition |
| --- | --- | --- |
| Cancel, rejoin, FIFO | E2E-7 cancels and rejoins | E2E-12 interleaves two owners, preserves UNRESOLVED_CALLED, calls ticket 2 before rejoined ticket 3 |
| CLOSED queue drains old tickets | E2E-8 closes/reopens before a new Join | E2E-13 closes with two WAITING tickets, rejects a new Join without consuming a number, serves both by legacy Complete while CLOSED |
| Host A cannot operate queue B | API TEST-48/50 | E2E-14 real separate browser sessions plus cookie-authenticated API probes, unchanged SQL snapshots, and Host B successfully calls its own queue |
| No-show, Seat, Release | E2E-10/11 cover these separately | E2E-15 combines no-show/rejoin/FIFO, fitting Seat, Release, and owner refresh/history in one journey |
| Customer history filters | E2E-9 | Retain unchanged in full regression |
| Original Sprint 1 journey | E2E-1 | Retain unchanged in full regression |

No application code, existing test assertion, API contract or migration changes are planned. New tests must await server-confirmed Host notices before another session refreshes. Failures will be investigated and disclosed; no assertion may be relaxed merely to obtain green. If a product defect appears, report it and follow the existing contract/TDD rules before fixing it.

Record fresh labels s2-cross-feature-api and s2-cross-feature-e2e so the earlier s2-integration/s2-e2e remain immutable. Candidate evidence names its actual source SHA; separate evidence-only commits do not change application code. Build, full API suite and full Chromium suite must pass; local browser tests are not a manual keyboard audit or deployed acceptance.

## Revision History

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-11-28 | Plan additional B3 regression journeys before writing tests; existing feature implementation is unchanged |
