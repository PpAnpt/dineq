# Lab 7 Part D: Readiness Review, Retrospective and Disclosures

> **Status:** v0.4 (2026-11-29, snapshot 00:21 +07) · scope = the maintained Sprint 1 behaviour (F-01, F-02, F-03) including the Lab 7 change L7-CR-01 (per-queue party size limit), now released on `main` `f3e7c63` and deployed as Cloud Run revision `s21271a0d-00008-g6r` (release PR #120, deploy run 46151508392, tag `v2.0-sprint2-rc1`). Facts below come from the recorded evidence, merged PRs, the deploy log and the owner's browser checks named in each row; nothing is marked ready without a source. Items that were not run are marked NOT RUN.

## 1. Readiness checklist

Decision rule: READY means the item is verified for the version named in the row. NOT READY states what is missing, who owns it and the next milestone.

| # | Item | Verdict | Version and evidence | Reason / what is missing | Owner and milestone |
| --- | --- | --- | --- | --- | --- |
| 1 | Sprint 1 baseline before this release | READY (superseded) | `main` `1ffb8b0`, Cloud Run revision `s21271a0d-00007-pnb`; deploy run 46024849737; version ledger `docs/labs/lab-06/version-ledger.md`; read-only Cloud Shell on 28 Nov confirmed `00007-pnb` at 100 percent before the release | It is replaced by row 2 and kept as the pre-change baseline | Done |
| 2 | Lab 7 change released | **READY with limits** | Release PR #120 merged into `main` (`f3e7c63`); deploy run 46151508392: tests, migration job execution `s21271a0d-migrate-4m7km` (002 to 006), Cloud Run revision `s21271a0d-00008-g6r` at 100 percent, pipeline smoke test passed; Cloud Shell read after the deploy matches; tag `v2.0-sprint2-rc1` on `f3e7c63` | Not run on the deployed service: the Host journey (Call Next, Complete), close and reopen, the scripted API check (PR #116, not merged), persistence across a restart, forbidden roles through the API. The deployed database was not seeded, so Seat, Release and the second queue cannot be shown there | Both, plan to 13 Dec (known limitations) |
| 3 | Per-queue limit active on the live data | **READY (browser evidence only)** | Migration `006` ran in the release's migration job; screenshots of the deployed service (`docs/evidence/deployed-00008-g6r/`): the main queue form reads `Party size (1-10)`, size 10 accepted (Ticket #25) | The API value of `maxPartySize` and the 400 for size 11 were not captured on the deployed service (the form blocked 11 before any request); the API rule is covered by TEST-25 in the recorded runs | Anapat, optional read-only script run after PR #116 is re-reviewed |
| 4 | Open defects by severity | READY (with limits) | `docs/labs/lab-07/uat-defects.json`: DineQ-owned findings 1 of 1 resolved (CE-FIFO-01, RED `ea646a9`, GREEN `58c5b77`, release `1ffb8b0`); HairRoot's HR-F01 is not ours | Critical 0, major 0; five known limitations, none a known functional defect (section 3). This is the register at the snapshot, not proof that no other defect exists; no full manual audit was run | Both, update at the final snapshot |
| 5 | Test results | READY for the recorded runs | Baseline `1ffb8b0`: 112 passed / 0 failed / 0 skipped (a local run on 28 Nov before any change; it was not saved as an evidence file, the earlier recorded Sprint 1 run is `release-full-run` with 108 passed at `a7a145e`). Lab 7 branch `6fa36bf`: [l7-green-lock](../../evidence/l7-green-lock.txt) 143 / 0 / 0; [l7-red](../../evidence/l7-red.txt) 28 failed / 113 passed / 0 skipped before the change; Playwright [l7-e2e-green](../../evidence/l7-e2e-green.txt) 6 passed | The 143 count describes the Lab 7 branch only. The integrated Sprint 2 branch is recorded in [s2-integration](../../evidence/s2-integration.txt) (289 passed / 0 failed / 0 skipped, 13 files) and [s2-e2e](../../evidence/s2-e2e.txt) (11 passed) on `sprint-2-staging` head `5e8c9a7` (CI run 46133241147 green; PR #117). These are local runs on the integrated branch, not the deployed commit: if the release commit differs, the run must be repeated | Siwarak and Anapat, before the release PR is merged |
| 6 | Regression of protected behaviour | READY | Sprint 1 tests kept (FIFO, unique ticket numbers under 30 concurrent joins, ownership, role, Origin, CLOSED, invalid shapes); only the tests listed in `impact-analysis.md` section 4 changed, with reasons, before the code | One later addition: two under-lock tests were added after the implementation at the reviewer's request, with a mutation run showing they fail on a pre-lock check (`l7-lock-mutation.txt`); there is no RED run for them | Done |
| 7 | Configuration and secrets | READY | `.env.example` lists variables; seed password comes from `SEED_DEMO_PASSWORD`; reviewers ran secret scans on the documentation PRs (for example #98, #99) and no secret or real password is in the Lab 7 files | No change to environment variables in this change | Both |
| 8 | Documentation | READY with one gap | SRS BR-09 v0.2, F-02 contract v0.6, STS v0.9, System SDS v0.6, traceability v0.17, change request v0.4, impact analysis v0.6, release checklist v0.9 | Announcement evidence is attached (`docs/evidence/lab7/instructor-announcement.png`, announcer Suthep Madarasmi); its exact post date is not visible (the post shows "4 days ago"), so the date is stated as about 25 Nov 2026 | Anapat, read the exact timestamp from the post if it can be shown |
| 9 | Deploy and smoke | **READY with limits** | Pipeline smoke test passed for `f3e7c63` (run 46151508392); by hand in the browser (customer29): limit 10 shown, size 11 blocked by the form, size 10 accepted, Ticket #24 CANCELLED then Ticket #25 created and cancelled (screenshots in `docs/evidence/deployed-00008-g6r/`) | The Sprint 1 Host journey, the scripted check and the restart persistence check are NOT RUN on the deployed service (shared with other teams) | Anapat, before 13 Dec if permitted |

**Overall:** the Lab 7 change is **released and checked in part**: the pipeline, the migrations, the limit on the live data and the Customer join and cancel path were checked; the Host path, close and reopen, the scripted API check and the restart check were not run on the deployed service.

## 2. Technical debt

| Item | Effect | Planned handling | Owner |
| --- | --- | --- | --- |
| The per-queue limit is enforced by the API under the queue lock and by a 1..10 ceiling in the database, not by a trigger | Direct SQL could store a party size above one queue's own limit (still at most 10) | Disclosed in the impact analysis; add a trigger only if a reviewer requires it | Anapat |
| Migration `006` ties data to the demo seed queue id and also raises a deliberately set 8 | A deliberate 8 on the main queue cannot be told from the default | Accepted and written in the contract (AC-26b); revisit if queues become configurable | Anapat |
| No Host API or UI to change a queue's limit | The value is set by seed or SQL only | Out of scope for this change; Sprint 3 candidate | Both |
| Shared test database accumulates migrations from parallel branches | Two schema-inspection tests (INFRA-03/04) read the `public` schema and gave misleading results in isolated-schema runs until it was noticed | Use `current_schema()` (done in PR #107) and one schema or database per branch and per CI run | Siwarak (PR #107), Anapat |
| The client build must exist before the production node check | A fresh worktree fails one of 22 checks until `npm run build:client` runs; CI builds first | Document in the README test steps | Anapat |
| Playwright regenerates tracked Sprint 1 screenshots | Dirty tree after each run, risk of overwriting evidence | Do not commit them; consider moving generated images out of tracked evidence | Both |
| Migration `003` was corrected in place before it was merged (NULL `from_status` hole) | A database that had applied the first text would differ | Not merged or deployed before the fix; recorded in the F-04 contract v0.4 | Anapat |
| `lab6-staging` is not merged into `main` | The Lab 6 records and version ledger are not in the release | Decided on 28 Nov (D4): not merged; PR #67 goes to `lab6-staging` only | Anapat |

## 3. Known limitations (for this change)

1. The deployed service was only partly checked after the release (rows 2, 3 and 9): no Host journey, no close and reopen, no scripted API check, no restart check there.
2. The Lab 7 announcement screenshot shows the announcer but only a relative date ("4 days ago"); the exact post date and time are not recorded.
3. No manual keyboard or assistive-technology audit; no performance measurement; no cross-browser run (AC-73..76 are PLANNED).
4. The metrics in `metrics.md` were regenerated at the snapshot of 29 Nov 00:21 +07; M3 is the integrated run `s2-integration` (289 of 289), not a run on the deployed service.
5. The deployed database was not seeded: on the deployed service only the main queue exists and there are no tables, so Seat, Release and the second queue are shown by the local and CI evidence only.

## 4. Retrospective (draft, to be edited by the authors)

- **What helped:** Having the teammate review the contract and the tests before any implementation caught real problems early: the limit had to be read under the queue lock (the reviewer asked for the interleaving test), a backfill could have collided on unique names, and a NULL `from_status` could slip past a CHECK.
- **What hurt:** One shared test database and tests that assumed the `public` schema produced misleading results when several branches ran at once, and some numbers had to be re-verified in a clean schema.
- **What to change:** Give every branch and CI run its own schema or database, make schema-inspection tests use `current_schema()`, and fix migration numbers and merge order on the board before parallel work starts.

## 5. Contributions

| Person | Lab 7 work (sources) |
| --- | --- |
| Anapat | Change request and impact analysis (PR #98), contract revisions (SRS, F-02, STS, SDS, traceability), RED/GREEN tests and implementation (PR #103: migration 002, seed, Join under the queue lock, queue list, Join form), the under-lock tests and mutation check requested in review, metrics collector and this review |
| Siwarak (BBINGOAL) | Release PR #120 and its evidence mapping, F-05, safety review of the post-deploy script, contract review before any test or code (approved #98 after checking lock-time validation, the no-trigger decision and the test changes), review of #103 (asked for the under-lock regression and approved the result), raised the missing CI trigger for `sprint-2-staging` (fixed in #102) |

Reviews are visible in the PR histories; the exact review dates are in GitHub.

## 6. AI use

Claude Code (Claude Sonnet 5.5) was used under Anapat's direction to read the repository, draft the change request, impact analysis, contract revisions, tests, implementation and this document, and to run the test commands. Siwarak used Codex for his own work (reviews, F-05 and F-09a); the rows tagged Codex in `docs/ai-use-log.md` are his. Every Claude commit carries a co-author line and every task has a row in `docs/ai-use-log.md`. Anapat chose the change, reviewed each diff summary before commits, and decided what to merge; Siwarak reviewed the contract and tests before they were merged. The authors remain responsible for explaining the code.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft from recorded evidence at the 14:54 snapshot; PENDING items listed in sections 1 and 3 |
| v0.2 | 2026-11-28 | Refresh at the 16:04 snapshot: sprint-2-staging CI is green again (PR #113), migration 006 is written and awaiting review (PR #114), new technical-debt row for the seed-id coupling |
| v0.3 | 2026-11-28 | Row 5: add the integrated runs `s2-integration` (289 / 0 / 0) and `s2-e2e` (11 passed) from PR #117; the 143 count is kept and described as Lab 7 branch only |
| v0.4 | 2026-11-29 | Update after the release: rows 1, 2, 3, 8, 9 and the limitations now reflect the deploy (run 46151508392, revision `00008-g6r`, tag `v2.0-sprint2-rc1`), the owner's screenshots and the decision not to attach the announcement evidence; the debt row on `lab6-staging` records decision D4. Old wording said the change was not on `main` and not deployed |
| v0.5 | 2026-11-29 | Attach the announcement evidence; row 8 and limitation 2 updated. Old wording (v0.4): not attached by the owner's decision |
