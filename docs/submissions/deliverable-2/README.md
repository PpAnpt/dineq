# Deliverable 2 working papers (draft, 28 November 2026)

> **Status:** Draft v0.1 · CPE334 Theme 9 · DineQ · updated on 28 Nov 2026 after the release: evidence at `sprint-2-staging` head `5e8c9a7`, deployed `main` commit `f3e7c63` (deploy run 46151508392). These files feed the self-contained PDF; the PDF must embed the content, not only link it. The release candidate **is** on `main` and deployed; the release tag `v2.0-sprint2-rc1` was created on 29 Nov 2026 on `f3e7c63`.

| File | PDF part | Content |
| :-- | :-- | :-- |
| [part-a-continuity.md](part-a-continuity.md) | A Sprint 1 continuity | accepted baseline, continuity demo plan, change and defect register for Lab 5 to Lab 7 |
| [part-b-sprint2-completion.md](part-b-sprint2-completion.md) | B Sprint 2 | per-feature completion table, review and integration chains |
| [part-c-sprint3-status.md](part-c-sprint3-status.md) | C Sprint 3 | status per feature (planned / implemented / tested / accepted) and remaining work to 13 December |
| [part-d-traceability-matrix.md](part-d-traceability-matrix.md) | D Requirements | one matrix from requirement to result, uncovered items, per-AC status |

## Honest summary at this snapshot

- Implemented and merged on `sprint-2-staging`: Lab 7 change (per-queue party size), F-04, F-05, F-06, F-07a, F-09a. Contracts for all Sprint 2 and Sprint 3 features are merged.
- Migration `006` (activation of the live main queue limit) is merged (PR #114), was applied by the migration job on the deployed database, and the owner saw the main queue limit 10 in the browser.
- **Not done:** F-07b, F-08, the rest of F-09 (AC-73 to AC-76) are PLANNED only. No manual keyboard audit, no performance measurement, no cross-browser run.
- **Deployed (28 Nov 2026):** release PR #120 merged; `main` `f3e7c63` is served by Cloud Run revision `s21271a0d-00008-g6r` (before: `00007-pnb`), 100 percent of traffic. Integrated records exist: `s2-integration` 289 / 0 / 0 and `s2-e2e` 11 passed. Post-deploy checks were only partly run (Part E.5); the seed was not run on the deployed database, so Seat, Release and the second queue cannot be demonstrated there.
- All "PASS" entries refer to local runs recorded as evidence files at the commits named, plus the CI result on the integrated head. They are not deployment results.
- Open decisions for the release are in `docs/labs/lab-07/release-checklist.md` (D2 to D4, D6).
