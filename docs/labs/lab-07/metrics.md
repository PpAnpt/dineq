# Lab 7 Metrics

Repository: `PpAnpt/dineq`
Observation window: 2026-11-22 00:00:00 +07 (2026-11-21T17:00:00.000Z) to 2026-11-28 14:54:53 +07 (2026-11-28T07:54:53.834Z), start inclusive, end exclusive.
Snapshot taken: 2026-11-28 14:54:53 +07 (2026-11-28T07:54:53.834Z). Counts after this time are not included.

## M1 Issues completed
Definition: issues closed with reason `COMPLETED` whose `closedAt` is in the window. Closed as not planned/duplicate are listed separately and not counted.
Value: **19** completed; 15 excluded.

| # | Closed (Bangkok) | Title |
| :-- | :-- | :-- |
| #31 | 2026-11-22 16:26:57 +07 | L5-5 — Cloud evidence: public URL, demo accounts, persistence across redeploy |
| #32 | 2026-11-22 10:18:51 +07 | L5-6 — Intentional failing PR proving the merge block (C-02) |
| #33 | 2026-11-24 10:49:29 +07 | L5-7 — Lab 5 report PDF (Answer Part 0-4) |
| #40 | 2026-11-22 12:46:17 +07 | L5-8 — Visible release change through the full pipeline (C-06, redeploy leg of C-05) |
| #45 | 2026-11-28 09:26:25 +07 | L6-1 - Partner coordination, baseline and Lab 6 integration workflow |
| #46 | 2026-11-25 07:14:24 +07 | L6-2 - Draft DineQ Sprint 1 UAT cases |
| #47 | 2026-11-27 23:55:55 +07 | L6-3 - Prepare safe DineQ handoff and test data |
| #48 | 2026-11-28 09:26:29 +07 | L6-4 - Independently execute HairRoot UAT cases |
| #49 | 2026-11-27 23:55:58 +07 | L6-5 - Triage all findings received about DineQ |
| #50 | 2026-11-28 09:26:33 +07 | L6-6 - Resolve accepted defects with RED/GREEN and reviewed release |
| #51 | 2026-11-28 09:26:37 +07 | L6-7 - Independent retest and Sprint 1 acceptance |
| #52 | 2026-11-28 09:26:41 +07 | L6-8 - Compile the self-contained Lab 6 PDF and submission evidence |
| #63 | 2026-11-28 09:26:46 +07 | L6-6 / CE-FIFO-01 - TA-controlled newest-first defect and FIFO correction |
| #69 | 2026-11-28 11:54:33 +07 | SETUP-0 - Create sprint-2-staging and update CLAUDE.md to v0.5 (prompt P0) |
| #79 | 2026-11-28 14:38:59 +07 | F-04 - Implement F-04 Customer cancel (TDD, real DB, UI) |
| #80 | 2026-11-28 14:39:02 +07 | F-06 - Implement F-06 multiple queues and open/close (TDD, real DB, UI) |
| #92 | 2026-11-28 13:21:44 +07 | CONTRACTS - Sprint 2 (F-04/F-05/F-06) and Sprint 3 (F-07/F-08/F-09) contracts in one PR |
| #94 | 2026-11-28 11:54:46 +07 | L7-CONTRACT - Lab 7 change request, impact analysis and contract revision |
| #95 | 2026-11-28 13:11:44 +07 | L7-TDD - Lab 7 RED then GREEN (migration 002, API, UI, regression) |

Excluded:

- #70 (NOT_PLANNED) L7-1 - Lab 7 change request: per-queue party-size limit replaces fixed 1-8 (BR-09 / AC-12)
- #71 (NOT_PLANNED) L7-2 - Lab 7 impact analysis and contract revision (reviewed before any code)
- #72 (NOT_PLANNED) L7-3 - Lab 7 RED: per-queue party-size tests fail on pre-change code
- #73 (NOT_PLANNED) L7-4 - Lab 7 GREEN: migration 002, API, UI and regression
- #74 (NOT_PLANNED) L7-5 - Lab 7 metrics: five dated metrics with embedded sources and a <=100-word interpretation
- #75 (NOT_PLANNED) L7-6 - Lab 7 readiness checklist, technical debt, retrospective, contributions and PDF
- #76 (NOT_PLANNED) F-04-C - Contract: F-04 Customer cancel (FR-08, BR-10/12) AC-26+
- #77 (NOT_PLANNED) F-05-C - Contract: F-05 Host no-show and table assignment (FR-09/10, BR-10/11) AC-34+
- #78 (NOT_PLANNED) F-06-C - Contract: F-06 multiple queues, Host assignment, open/close (FR-11/12) AC-46+
- #82 (NOT_PLANNED) S3-C - Contracts: Sprint 3 F-07 history, F-08 reporting, F-09 hardening (AC-52+/60+/70+)
- #83 (NOT_PLANNED) F-09a - F-09a: JSON body > limit returns 413 PAYLOAD_TOO_LARGE (real defect from known-limitations)
- #84 (NOT_PLANNED) F-07a - F-07a: Customer history filter GET /api/me/entries?status&from&to (owner only)
- #85 (NOT_PLANNED) PART-D - Part D: SRS, features, System SDS and one complete traceability matrix (current product)
- #86 (NOT_PLANNED) E2E-1 - Playwright journeys for the new features (cancel, closed queue, no-show/seat, history filter) and cross-feature regression
- #88 (NOT_PLANNED) EVID-1 - Evidence for Deliverable 2: demos, API evidence, two test excerpts, two Issue/PR chains, Sprint 1 continuity

## M2 Pull requests merged
Definition: pull requests with `mergedAt` in the window (any base branch).
Value: **29** merged (5 into staging, 2 into main, 11 into lab6-staging, 11 into sprint-2-staging).

| PR | Merged (Bangkok) | Base | Title |
| :-- | :-- | :-- | :-- |
| #39 | 2026-11-22 11:31:19 +07 | staging | chore(lab5): add Playwright script for live C-04/C-05 evidence |
| #41 | 2026-11-22 11:34:14 +07 | staging | feat(lab5): show a Lab 5 release label on the login page |
| #42 | 2026-11-22 11:42:37 +07 | main | release(lab5): visible release label and live-evidence tooling |
| #43 | 2026-11-22 15:39:24 +07 | staging | docs(lab5): refresh deployed release and reproducibility evidence |
| #44 | 2026-11-22 16:19:54 +07 | staging | docs(lab5): record cloud restart evidence and update pending list |
| #53 | 2026-11-24 10:37:30 +07 | lab6-staging | chore(L6-1): prepare Lab 6 baseline and integration CI |
| #54 | 2026-11-25 07:13:24 +07 | lab6-staging | docs(L6-2): draft executable DineQ UAT cases for HairRoot |
| #55 | 2026-11-25 13:41:46 +07 | lab6-staging | docs(L6-3): prepare DineQ UAT handoff and update coordination |
| #56 | 2026-11-26 10:18:45 +07 | lab6-staging | docs(L6-3): record Product Team queue preparation before UAT |
| #57 | 2026-11-26 17:35:07 +07 | lab6-staging | docs(L6-4): add blank HairRoot execution record |
| #58 | 2026-11-26 20:42:09 +07 | lab6-staging | docs(L6-4): record HairRoot UAT results and Unicode booking finding |
| #59 | 2026-11-27 08:22:52 +07 | lab6-staging | docs(L6-4): track partner triage and complete evidence captions |
| #60 | 2026-11-27 10:34:41 +07 | lab6-staging | docs(L6-5): reconcile CLOSED and restart follow-up evidence |
| #61 | 2026-11-27 10:43:53 +07 | lab6-staging | docs(L6-7): prepare acceptance records and contribution evidence |
| #62 | 2026-11-27 20:56:43 +07 | lab6-staging | docs(L6-7): record HairRoot retest and received DineQ acceptance |
| #64 | 2026-11-27 21:16:42 +07 | staging | test(L6-6): complete TA-controlled FIFO RED/GREEN exercise |
| #65 | 2026-11-27 22:25:52 +07 | main | release(L6-6): staging -> main (TA-controlled FIFO exercise regression and record) |
| #66 | 2026-11-28 09:27:37 +07 | lab6-staging | docs(L6-6): record deployed release and received FIFO retest |
| #91 | 2026-11-28 11:54:25 +07 | sprint-2-staging | docs: set Deliverable 2 and Lab 7 as the current target (CLAUDE.md v0.5) |
| #98 | 2026-11-28 11:53:44 +07 | sprint-2-staging | docs(lab7): per-queue party size limit - change request, impact analysis, contract revision |
| #99 | 2026-11-28 12:22:43 +07 | sprint-2-staging | docs(F-04): Customer cancel contract (AC-28..35) |
| #100 | 2026-11-28 12:37:44 +07 | sprint-2-staging | docs(F-06): multiple queues, Host assignment and open/close contract (AC-46..51) |
| #101 | 2026-11-28 12:24:57 +07 | sprint-2-staging | docs(S3): Sprint 3 contracts F-07/F-08/F-09 and Sprint 2-3 alignment (AC-52..76) |
| #102 | 2026-11-28 12:20:45 +07 | sprint-2-staging | ci: run CI & Docker Build for sprint-2-staging |
| #103 | 2026-11-28 13:11:39 +07 | sprint-2-staging | feat(L7): per-queue party size limit (RED then GREEN) |
| #104 | 2026-11-28 13:19:01 +07 | sprint-2-staging | docs(F-05): no-show, table seating and release contract (AC-36..45) |
| #105 | 2026-11-28 13:21:30 +07 | sprint-2-staging | fix(F-09a): return PAYLOAD_TOO_LARGE with recorded RED and GREEN |
| #106 | 2026-11-28 14:35:44 +07 | sprint-2-staging | feat(F-04): Customer cancel ticket (RED then GREEN, AC-28..35) |
| #108 | 2026-11-28 14:38:54 +07 | sprint-2-staging | feat(F-06): multiple queues, names and open/close by the assigned Host (RED then GREEN, AC-46..51) |

## M3 Automated test results (one suite, one commit)
Source: `docs/evidence/l7-green-lock.txt/.json`. Command: `node "node_modules/vitest/vitest.mjs" run --reporter=default --reporter=json --outputFile="../docs/evidence/l7-green-lock.json"` (working directory `server`). Commit: `6fa36bf7eac7e3457bb0497763a64c3168b6bb93`. Run date: 2026-11-28T05:30:18.464Z.
Value: **143 passed, 0 failed, 0 skipped/pending of 143** (6 test files). Pass rate 143/143.
This is the recorded run at that commit, not necessarily the current head; re-run and replace the evidence label before the final PDF.

## M4 UAT defect status (DineQ-owned findings)
Definition of resolved: a finding is RESOLVED only when the fix is merged to main with a RED then GREEN record and the deployed or retested behaviour is confirmed; otherwise OPEN.
Value: **1 of 1** DineQ-owned findings resolved; 1 listed finding(s) belong to another team and are not counted.

| ID | Title | Owner | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| CE-FIFO-01 | TA-controlled newest-first defect (controlled exercise) | DineQ | RESOLVED | RED ea646a9, GREEN 58c5b77, release 1ffb8b0 (PR #65), issue #63 |
| HR-F01 | HairRoot finding R01 (belongs to HairRoot) | HairRoot | RESOLVED | HairRoot ac0a57b to cbaf1ba (see version ledger) |

## M5 CI runs by conclusion
Definition: workflow runs created in the window, grouped by conclusion (`in_progress`/`queued` shown by status). Skipped or cancelled runs are not successes.

**CI & Docker Build:** 92 runs (87 success, 4 failure, 1 cancelled); success 87/92 completed.

| Run ID | Created (Bangkok) | Event | Branch | Commit | Result |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 44982056515 | 2026-11-22 10:45:22 +07 | pull_request | feature/lab5-live-evidence-script | a4cc133 | success |
| 44982926636 | 2026-11-22 10:57:45 +07 | pull_request | feature/lab5-live-evidence-script | 653e9d3 | success |
| 44983304271 | 2026-11-22 11:02:58 +07 | pull_request | feature/lab5-visible-release-label | 9a212e2 | failure |
| 44983478878 | 2026-11-22 11:05:16 +07 | pull_request | feature/lab5-visible-release-label | 1dd9c5a | success |
| 44983825419 | 2026-11-22 11:09:57 +07 | pull_request | feature/lab5-live-evidence-script | 1e22664 | failure |
| 44983963009 | 2026-11-22 11:11:43 +07 | pull_request | feature/lab5-live-evidence-script | 1033d5c | success |
| 44984638206 | 2026-11-22 11:20:47 +07 | pull_request | feature/lab5-live-evidence-script | 2b6fa89 | failure |
| 44984760549 | 2026-11-22 11:22:25 +07 | pull_request | feature/lab5-live-evidence-script | 301bd28 | failure |
| 44984894257 | 2026-11-22 11:24:14 +07 | pull_request | feature/lab5-live-evidence-script | 6f11462 | success |
| 44985422496 | 2026-11-22 11:31:21 +07 | push | staging | c436a1a | success |
| 44985498260 | 2026-11-22 11:32:23 +07 | pull_request | feature/lab5-visible-release-label | 7d705b2 | success |
| 44985637965 | 2026-11-22 11:34:17 +07 | push | staging | 48ffd62 | success |
| 44985662549 | 2026-11-22 11:34:37 +07 | pull_request | staging | 48ffd62 | success |
| 44986245100 | 2026-11-22 11:42:40 +07 | push | main | 17c8b90 | success |
| 44990604030 | 2026-11-22 12:43:07 +07 | pull_request | docs/lab5-final-evidence | 4eae479 | success |
| 45003607205 | 2026-11-22 15:36:28 +07 | pull_request | docs/lab5-final-evidence | f01fe63 | success |
| 45003827397 | 2026-11-22 15:39:26 +07 | push | staging | f0f8803 | success |
| 45006392498 | 2026-11-22 16:12:21 +07 | pull_request | docs/lab5-cloud-restart-evidence | 4f8fea0 | success |
| 45007011767 | 2026-11-22 16:19:57 +07 | push | staging | 6f1d31f | success |
| 45305402402 | 2026-11-24 08:29:25 +07 | pull_request | docs/lab6-1-baseline | 2e077ce | success |
| 45320809318 | 2026-11-24 10:37:33 +07 | push | lab6-staging | b4c3522 | success |
| 45325580275 | 2026-11-24 11:19:26 +07 | pull_request | docs/lab6-2-uat-cases | 1a9d043 | success |
| 45516385383 | 2026-11-25 07:13:26 +07 | push | lab6-staging | 1a144dd | success |
| 45517258647 | 2026-11-25 07:20:03 +07 | pull_request | docs/lab6-3-handoff | 6656921 | success |
| 45562517574 | 2026-11-25 13:41:49 +07 | push | lab6-staging | e8038f8 | success |
| 45568181976 | 2026-11-25 14:26:42 +07 | pull_request | docs/lab6-3-preparation-record | f7c428a | success |
| 45569017724 | 2026-11-25 14:33:05 +07 | pull_request | docs/lab6-4-hairroot-execution-template | 5787d10 | success |
| 45748098191 | 2026-11-26 10:18:47 +07 | push | lab6-staging | 84b4818 | success |
| 45748234735 | 2026-11-26 10:20:06 +07 | pull_request | docs/lab6-4-hairroot-execution-template | b1f8d03 | success |
| 45749249462 | 2026-11-26 10:29:35 +07 | pull_request | docs/lab6-4-hairroot-execution-template | 8bb9bd5 | success |
| 45802700270 | 2026-11-26 17:35:10 +07 | push | lab6-staging | a361c94 | success |
| 45812554994 | 2026-11-26 18:39:29 +07 | pull_request | docs/lab6-4-hairroot-execution | 26070fc | success |
| 45831716502 | 2026-11-26 20:42:12 +07 | push | lab6-staging | 0e9d940 | success |
| 45834071081 | 2026-11-26 20:56:48 +07 | pull_request | docs/lab6-4-uat-followup | f4f8ba6 | success |
| 45922239733 | 2026-11-27 08:22:55 +07 | push | lab6-staging | da7fe9f | success |
| 45925024439 | 2026-11-27 08:52:15 +07 | pull_request | codex/lab6-5-results-followup | f7b3d31 | success |
| 45925301426 | 2026-11-27 08:55:16 +07 | pull_request | codex/lab6-7-acceptance-prep | 267f8e9 | success |
| 45926962881 | 2026-11-27 09:12:30 +07 | pull_request | codex/lab6-7-acceptance-prep | 6e2a15f | success |
| 45934982860 | 2026-11-27 10:34:44 +07 | push | lab6-staging | 603beb1 | success |
| 45935507956 | 2026-11-27 10:40:10 +07 | pull_request | codex/lab6-7-acceptance-prep | 2802524 | success |
| 45935860107 | 2026-11-27 10:43:56 +07 | push | lab6-staging | a8c08d4 | success |
| 45982354006 | 2026-11-27 17:28:10 +07 | pull_request | codex/lab6-hairroot-retest-r02 | d9d658c | success |
| 46002808751 | 2026-11-27 19:56:19 +07 | pull_request | codex/lab6-controlled-fifo | 026adba | success |
| 46009981181 | 2026-11-27 20:46:21 +07 | pull_request | codex/lab6-hairroot-retest-r02 | 346e07a | success |
| 46011478149 | 2026-11-27 20:56:46 +07 | push | lab6-staging | 743e6cb | success |
| 46014471331 | 2026-11-27 21:16:45 +07 | push | staging | fb98f4c | success |
| 46016258726 | 2026-11-27 21:28:34 +07 | pull_request | staging | fb98f4c | success |
| 46024849531 | 2026-11-27 22:25:54 +07 | push | main | 1ffb8b0 | success |
| 46031274631 | 2026-11-27 23:10:10 +07 | pull_request | codex/lab6-release-evidence | 2debbce | success |
| 46034045029 | 2026-11-27 23:29:28 +07 | pull_request | codex/lab6-release-evidence | ecb8753 | success |
| 46036718018 | 2026-11-27 23:48:39 +07 | pull_request | codex/lab6-release-evidence | 7021327 | success |
| 46096334505 | 2026-11-28 09:05:26 +07 | pull_request | codex/lab6-release-evidence | d1ccb81 | success |
| 46096795637 | 2026-11-28 09:11:02 +07 | pull_request | codex/lab6-release-evidence | 5343dee | success |
| 46097722557 | 2026-11-28 09:22:10 +07 | pull_request | docs/lab6-version-ledger | 17db62a | success |
| 46097769577 | 2026-11-28 09:22:43 +07 | pull_request | codex/lab6-release-evidence | 6940f1f | success |
| 46098174580 | 2026-11-28 09:27:40 +07 | push | lab6-staging | d67b303 | success |
| 46109559979 | 2026-11-28 11:52:52 +07 | pull_request | chore/ci-sprint-2-staging | 8dcb50e | success |
| 46111557047 | 2026-11-28 12:19:09 +07 | pull_request | chore/ci-sprint-2-staging | 06a4d2c | success |
| 46111685380 | 2026-11-28 12:20:47 +07 | push | sprint-2-staging | 579ceef | success |
| 46111710184 | 2026-11-28 12:21:07 +07 | pull_request | docs/s2-contract-f04 | 5e28c8c | success |
| 46111838244 | 2026-11-28 12:22:45 +07 | push | sprint-2-staging | 615e70d | success |
| 46111885940 | 2026-11-28 12:23:23 +07 | pull_request | docs/s3-contracts | 203e05b | success |
| 46112006435 | 2026-11-28 12:25:00 +07 | push | sprint-2-staging | e82d592 | success |
| 46112285142 | 2026-11-28 12:28:47 +07 | pull_request | test/l7-per-queue-party-limit | 88728d1 | success |
| 46112437787 | 2026-11-28 12:30:48 +07 | pull_request | test/l7-per-queue-party-limit | 193dc8f | success |
| 46112819876 | 2026-11-28 12:35:46 +07 | pull_request | docs/s2-contract-f06 | 5cedc72 | success |
| 46112970485 | 2026-11-28 12:37:47 +07 | push | sprint-2-staging | 5bfc2b8 | success |
| 46113502894 | 2026-11-28 12:45:06 +07 | pull_request | docs/s2-contract-f05 | 98a16c6 | success |
| 46113950419 | 2026-11-28 12:51:05 +07 | pull_request | fix/f-09-payload-413 | cbfedfa | success |
| 46114812975 | 2026-11-28 13:03:03 +07 | pull_request | docs/lab6-version-ledger | 54e69b5 | success |
| 46115334035 | 2026-11-28 13:09:55 +07 | pull_request | test/l7-per-queue-party-limit | 659648c | success |
| 46115471675 | 2026-11-28 13:11:42 +07 | push | sprint-2-staging | 70b3baa | success |
| 46115675684 | 2026-11-28 13:14:23 +07 | pull_request | docs/s2-contract-f05 | 75811a3 | success |
| 46116029414 | 2026-11-28 13:19:03 +07 | push | sprint-2-staging | 7e51dcb | success |
| 46116051553 | 2026-11-28 13:19:20 +07 | pull_request | fix/f-09-payload-413 | 9a5df08 | success |
| 46116230021 | 2026-11-28 13:21:33 +07 | push | sprint-2-staging | 11d6bf5 | success |
| 46116788837 | 2026-11-28 13:28:53 +07 | pull_request | feature/f-04-cancel | 2fa8173 | success |
| 46117446875 | 2026-11-28 13:37:12 +07 | pull_request | feature/f-05-noshow-tables | 65ebcc7 | success |
| 46118325622 | 2026-11-28 13:48:40 +07 | pull_request | feature/f-06-queues | 81a7832 | success |
| 46119732686 | 2026-11-28 14:07:25 +07 | pull_request | feature/f-04-cancel | 0cc7f40 | success |
| 46120084136 | 2026-11-28 14:11:59 +07 | pull_request | feature/f-07a-history-filter | c4563fb | success |
| 46121162865 | 2026-11-28 14:25:41 +07 | pull_request | feature/f-04-cancel | a202be7 | success |
| 46121183868 | 2026-11-28 14:25:57 +07 | pull_request | feature/f-07a-history-filter | 8a127ae | cancelled |
| 46121202578 | 2026-11-28 14:26:12 +07 | pull_request | feature/f-06-queues | c2deb46 | success |
| 46121205611 | 2026-11-28 14:26:14 +07 | pull_request | feature/f-07a-history-filter | 796a4ef | success |
| 46121244951 | 2026-11-28 14:26:47 +07 | pull_request | feature/f-05-noshow-tables | 0c5f077 | success |
| 46121706523 | 2026-11-28 14:32:52 +07 | pull_request | feature/f-07a-history-filter | 8bf6d02 | success |
| 46121773221 | 2026-11-28 14:33:44 +07 | pull_request | docs/lab6-version-ledger | c6b4c79 | success |
| 46121932619 | 2026-11-28 14:35:47 +07 | push | sprint-2-staging | e1d6729 | success |
| 46122016469 | 2026-11-28 14:36:51 +07 | pull_request | feature/f-06-queues | ed2b138 | success |
| 46122172908 | 2026-11-28 14:38:57 +07 | push | sprint-2-staging | 0044084 | success |
| 46122315560 | 2026-11-28 14:40:52 +07 | pull_request | feature/f-07a-history-filter | dd6b4b3 | success |

**Deploy to Google Cloud:** 2 runs (2 success); success 2/2 completed.

| Run ID | Created (Bangkok) | Event | Branch | Commit | Result |
| :-- | :-- | :-- | :-- | :-- | :-- |
| 44986245220 | 2026-11-22 11:42:40 +07 | push | main | 17c8b90 | success |
| 46024849737 | 2026-11-27 22:25:54 +07 | push | main | 1ffb8b0 | success |

## Commands used (read-only)

- `gh issue list --repo PpAnpt/dineq --state closed --limit 1000 --json number,title,closedAt,stateReason`
- `gh pr list --repo PpAnpt/dineq --state merged --limit 1000 --json number,title,mergedAt,baseRefName,headRefName`
- `gh run list --repo PpAnpt/dineq --workflow "CI & Docker Build" --limit 500 --json databaseId,conclusion,status,createdAt,headSha,headBranch,event`
- `gh run list --repo PpAnpt/dineq --workflow "Deploy to Google Cloud" --limit 500 --json databaseId,conclusion,status,createdAt,headSha,headBranch,event`
- `node docs/labs/lab-07/collect-metrics.mjs --from 2026-11-22T00:00:00+07:00 --to <now> --suite docs/evidence/l7-green-lock --defects docs/labs/lab-07/uat-defects.json`

## Interpretation (max 100 words)

CI succeeded in 87 of 92 runs (94.6%). Four failures were new Lab 5 browser tests on feature branches, fixed before merge; one run was superseded. Risk: the Sprint 2 and Lab 7 code is merged on sprint-2-staging but not deployed, and the live main queue still allows only 8 until its limit is changed, so the 143-test count describes a branch, not the running service. Action: Siwarak opens the release PR by 29 Nov 15:00; Anapat runs the post-deploy checks that evening and replaces M3 with the full-suite record of the deployed commit.

(Draft written at the 28 Nov 14:54 snapshot. Regenerate the numbers with the command above at the final snapshot and update this text if a value changes; the limit is 100 words.)
