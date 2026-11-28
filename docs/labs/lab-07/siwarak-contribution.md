# Siwarak contribution source — Lab 7

Student: Siwarak Chatvichai (67070501086, BBINGOAL). This draft supplies only his portion of the Lab 7 report; it does not replace Anapat's change request, implementation, metrics or readiness sources. Codex assisted under Siwarak's direction.

## Review contribution

- Reviewed the bounded BR-09 change in #98: API validates the queue limit under the same queue lock used for ticket allocation, before CLOSED; DB keeps the absolute 1–10 ceiling without a cross-table trigger. Called out seed-only production activation and absent staging CI triggers. Contract approval did not claim runtime verification.
- Reviewed #103 and requested deterministic under-lock tests for limit lowering/raising. Supplemental mutation evidence demonstrates why an unlocked pre-read is wrong; these later tests are not mislabelled as original RED.
- Reviewed #112's migration 006 contract: a numeric =8 guard cannot distinguish default 8 from deliberately configured 8. The revised contract explicitly updates both and preserves every non-8 value. Final no-blocking record was posted after merge, not a pre-merge approval.
- Independently reviewed #114 SQL and TEST-45's filesystem-derived migration list. Ran 47 focused local tests; removing the value guard caused 3 failures, removing the queue-id filter caused 7. SQL was restored. Full feature implementation remains Anapat's contribution.
- Reviewed metrics/readiness/traceability documentation against recorded evidence, distinguishing historical snapshots, actual source SHAs and current deployment. No approval of an unexecuted measurement is claimed.

## Regression and release support

- F-05 and F-09a implementation/tests were Siwarak's Sprint 2/Sprint 3 contribution, supporting regression continuity alongside Lab 7.
- Opened release PR #120, requested PpAnpt review and maintained the deployment authorization boundary. PpAnpt merged it; pipeline 46151508392 deployed main f3e7c637457dd4f1f78e9bfabda513359fbcb538 as s21271a0d-00008-g6r with successful migration/smoke.
- Added local E2E-12..15 covering cancel/rejoin/FIFO, closed-queue draining, cross-queue Host denial and a combined No-show/Seat/Release journey. See [B3/feature contribution and captioned captures](../../submissions/deliverable-2/siwarak-evidence-and-contribution.md). Existing 11 journeys, including Sprint 1 and history filters, remain unchanged.

## What this does not establish

No instructor-announcement screenshot is invented. The main-queue activation still needs its authenticated production API observation in the final evidence. The local seeded second queue/tables are not production demo rows. Full post-deploy journeys, deployed persistence, final UX/keyboard audit, performance measurement, final PDFs and an authorized release tag require their own actual records.

## Reflection draft for the student to review

The important review distinction was between a guard that selects a numeric value and proof that the value was never deliberately configured. Writing that behavior into the contract before migration tests prevented a misleading preservation claim. The cross-feature regressions also make state transitions and permission boundaries visible across real browser sessions. The team should retain exact source commits and failed environment/test-helper attempts so that a green result is explainable rather than presented as a complete audit.
