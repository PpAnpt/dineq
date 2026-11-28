# Deliverable 2 working papers (draft, 28 November 2026)

> **Status:** Draft v0.1 · CPE334 Theme 9 · DineQ · prepared from recorded evidence at `sprint-2-staging` head `df5923c` (CI push run 46128556773: success). These files feed the self-contained PDF; the PDF must embed the content, not only link it. Nothing here claims a deployment: the release candidate is **not** on `main` yet.

| File | PDF part | Content |
| :-- | :-- | :-- |
| [part-a-continuity.md](part-a-continuity.md) | A Sprint 1 continuity | accepted baseline, continuity demo plan, change and defect register for Lab 5 to Lab 7 |
| [part-b-sprint2-completion.md](part-b-sprint2-completion.md) | B Sprint 2 | per-feature completion table, review and integration chains |
| [part-c-sprint3-status.md](part-c-sprint3-status.md) | C Sprint 3 | status per feature (planned / implemented / tested / accepted) and remaining work to 13 December |
| [part-d-traceability-matrix.md](part-d-traceability-matrix.md) | D Requirements | one matrix from requirement to result, uncovered items, per-AC status |

## Honest summary at this snapshot

- Implemented and merged on `sprint-2-staging`: Lab 7 change (per-queue party size), F-04, F-05, F-06, F-07a, F-09a. Contracts for all Sprint 2 and Sprint 3 features are merged.
- Migration `006` (activation of the live main queue limit) is written and tested in PR #114 but **not merged** into `sprint-2-staging`.
- **Not done:** F-07b, F-08, the rest of F-09 (AC-73 to AC-76) are PLANNED only. No manual keyboard audit, no performance measurement, no cross-browser run.
- **Not deployed:** `main` still serves revision `s21271a0d-00007-pnb` (Sprint 1 plus the Lab 6 fix). The release PR, the deploy and the post-deploy checks are pending, and the metrics, the integrated-suite record and the PDFs must be finished after them.
- All "PASS" entries refer to local runs recorded as evidence files at the commits named, plus the CI result on the integrated head. They are not deployment results.
- Open decisions for the release are in `docs/labs/lab-07/release-checklist.md` (D2 to D4, D6).
