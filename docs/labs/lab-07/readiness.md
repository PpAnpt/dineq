# Lab 7 Part D: Readiness Review, Retrospective and Disclosures

> **Status:** Draft v0.1 (2026-11-28, snapshot 14:54 +07) · scope = the maintained Sprint 1 behaviour (F-01, F-02, F-03) including the Lab 7 change L7-CR-01 (per-queue party size limit). Facts below come from the recorded evidence and merged PRs named in each row; nothing is marked ready without a source. Items marked PENDING are not yet done.

## 1. Readiness checklist

Decision rule: READY means the item is verified for the version named in the row. NOT READY states what is missing, who owns it and the next milestone.

| # | Item | Verdict | Version and evidence | Reason / what is missing | Owner and milestone |
| --- | --- | --- | --- | --- | --- |
| 1 | Deployed Sprint 1 baseline | READY | `main` `1ffb8b0`, Cloud Run revision `s21271a0d-00007-pnb`; deploy run 46024849737; version ledger `docs/labs/lab-06/version-ledger.md` | Serving revision and registry digest were taken from the deploy log; a direct Cloud Run read is listed as PENDING in the ledger | Anapat, final record before submission |
| 2 | Lab 7 change released | **NOT READY** | The Lab 7 change is merged on `sprint-2-staging` (PR #103, merge `70b3baa`); not on `main`; not deployed. Not all Sprint 2 work is merged yet: F-05 (#107) and F-07a (#109) were still in review at the snapshot | The running service still has the old fixed behaviour. Release PR to `main` and post-deploy checks are not done | Siwarak opens the release PR, 29 Nov 15:00; Anapat runs the post-deploy checks that evening |
| 3 | Per-queue limit active on the live data | **NOT READY** | Contract and impact analysis (PR #98); migration `002` | The migration adds the column with default 8; the main queue becomes 10 only after a narrow SQL update on the deployed database (not a full re-seed, because the seed also resets demo password hashes), then a `GET /api/queues` check | Anapat, in the release checklist; needs explicit permission for the Cloud Shell step |
| 4 | Open defects by severity | READY (with limits) | `docs/labs/lab-07/uat-defects.json`: DineQ-owned findings 1 of 1 resolved (CE-FIFO-01, RED `ea646a9`, GREEN `58c5b77`, release `1ffb8b0`); HairRoot's HR-F01 is not ours | Critical 0, major 0; five known limitations, none a known functional defect (section 3). This is the register at the snapshot, not proof that no other defect exists; no full manual audit was run | Both, update at the final snapshot |
| 5 | Test results | READY for the recorded runs | Baseline `1ffb8b0`: 112 passed / 0 failed / 0 skipped (a local run on 28 Nov before any change; it was not saved as an evidence file, the earlier recorded Sprint 1 run is `release-full-run` with 108 passed at `a7a145e`). Lab 7 branch `6fa36bf`: [l7-green-lock](../../evidence/l7-green-lock.txt) 143 / 0 / 0; [l7-red](../../evidence/l7-red.txt) 28 failed / 113 passed / 0 skipped before the change; Playwright [l7-e2e-green](../../evidence/l7-e2e-green.txt) 6 passed | The 143 count describes the Lab 7 branch, not the final integrated release candidate. A local combined run (231 passed, Playwright 9 passed) was not recorded as evidence; the release candidate needs its own record (`s2-integration`) | Siwarak and Anapat, before the release PR is merged |
| 6 | Regression of protected behaviour | READY | Sprint 1 tests kept (FIFO, unique ticket numbers under 30 concurrent joins, ownership, role, Origin, CLOSED, invalid shapes); only the tests listed in `impact-analysis.md` section 4 changed, with reasons, before the code | One later addition: two under-lock tests were added after the implementation at the reviewer's request, with a mutation run showing they fail on a pre-lock check (`l7-lock-mutation.txt`); there is no RED run for them | Done |
| 7 | Configuration and secrets | READY | `.env.example` lists variables; seed password comes from `SEED_DEMO_PASSWORD`; reviewers ran secret scans on the documentation PRs (for example #98, #99) and no secret or real password is in the Lab 7 files | No change to environment variables in this change | Both |
| 8 | Documentation | READY with one gap | SRS BR-09 v0.2, F-02 contract v0.4, STS v0.6, System SDS v0.4, traceability rows with Revision History; change request and impact analysis in this folder | The change request still has PENDING fields: announcement poster, post date and screenshot (the original handout still says approval is needed; the later announcement overrides it) and the reviewer PR number (#98). Not submittable until filled | Anapat, with the real announcement |
| 9 | Deploy and smoke | **NOT READY** for the Lab 7 change | Pipeline and smoke worked for `1ffb8b0` (deploy run 46024849737, smoke at 15:29:01 UTC) | No deployment of the changed code yet; post-deploy checks (new behaviour with party size 10 on the main queue, Sprint 1 path unchanged, persistence) are PENDING | Anapat after the deploy |

**Overall:** the deployed Sprint 1 baseline is READY; the Lab 7 change is **NOT READY** to be reported as released until rows 2, 3 and 9 are done and row 8 is filled.

## 2. Technical debt

| Item | Effect | Planned handling | Owner |
| --- | --- | --- | --- |
| The per-queue limit is enforced by the API under the queue lock and by a 1..10 ceiling in the database, not by a trigger | Direct SQL could store a party size above one queue's own limit (still at most 10) | Disclosed in the impact analysis; add a trigger only if a reviewer requires it | Anapat |
| No Host API or UI to change a queue's limit | The value is set by seed or SQL only | Out of scope for this change; Sprint 3 candidate | Both |
| Shared test database accumulates migrations from parallel branches | Two schema-inspection tests (INFRA-03/04) read the `public` schema and gave misleading results in isolated-schema runs until it was noticed | Use `current_schema()` (done in PR #107) and one schema or database per branch and per CI run | Siwarak (PR #107), Anapat |
| The client build must exist before the production node check | A fresh worktree fails one of 22 checks until `npm run build:client` runs; CI builds first | Document in the README test steps | Anapat |
| Playwright regenerates tracked Sprint 1 screenshots | Dirty tree after each run, risk of overwriting evidence | Do not commit them; consider moving generated images out of tracked evidence | Both |
| Migration `003` was corrected in place before it was merged (NULL `from_status` hole) | A database that had applied the first text would differ | Not merged or deployed before the fix; recorded in the F-04 contract v0.4 | Anapat |
| `lab6-staging` is not merged into `main` | The Lab 6 records and version ledger are not in the release | Decide before the release PR | Anapat |

## 3. Known limitations (for this change)

1. The Lab 7 change is not deployed; the live main queue still limits parties to 8 until the limit is changed there.
2. Announcement evidence for Lab 7 (poster, date, screenshot) is not yet attached.
3. No manual keyboard or assistive-technology audit; no performance measurement; no cross-browser run (AC-73..76 are PLANNED).
4. The metrics in `metrics.md` were taken at one snapshot and must be regenerated at the end; M3 reports the Lab 7 branch run.
5. Integration checks of the Sprint 2 branches were run locally and are summarised in PR comments, not recorded as repository evidence yet.

## 4. Retrospective (draft, to be edited by the authors)

- **What helped:** Having the teammate review the contract and the tests before any implementation caught real problems early: the limit had to be read under the queue lock (the reviewer asked for the interleaving test), a backfill could have collided on unique names, and a NULL `from_status` could slip past a CHECK.
- **What hurt:** One shared test database and tests that assumed the `public` schema produced misleading results when several branches ran at once, and some numbers had to be re-verified in a clean schema.
- **What to change:** Give every branch and CI run its own schema or database, make schema-inspection tests use `current_schema()`, and fix migration numbers and merge order on the board before parallel work starts.

## 5. Contributions

| Person | Lab 7 work (sources) |
| --- | --- |
| Anapat | Change request and impact analysis (PR #98), contract revisions (SRS, F-02, STS, SDS, traceability), RED/GREEN tests and implementation (PR #103: migration 002, seed, Join under the queue lock, queue list, Join form), the under-lock tests and mutation check requested in review, metrics collector and this review |
| Siwarak (BBINGOAL) | Contract review before any test or code (approved #98 after checking lock-time validation, the no-trigger decision and the test changes), review of #103 (asked for the under-lock regression and approved the result), raised the missing CI trigger for `sprint-2-staging` (fixed in #102) |

Reviews are visible in the PR histories; the exact review dates are in GitHub.

## 6. AI use

Claude Code (Claude Sonnet 5.5) was used under Anapat's direction to read the repository, draft the change request, impact analysis, contract revisions, tests, implementation and this document, and to run the test commands. Siwarak used Codex for his own work (reviews, F-05 and F-09a); the rows tagged Codex in `docs/ai-use-log.md` are his. Every Claude commit carries a co-author line and every task has a row in `docs/ai-use-log.md`. Anapat chose the change, reviewed each diff summary before commits, and decided what to merge; Siwarak reviewed the contract and tests before they were merged. The authors remain responsible for explaining the code.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft from recorded evidence at the 14:54 snapshot; PENDING items listed in sections 1 and 3 |
