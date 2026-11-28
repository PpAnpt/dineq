# Release Checklist REL-1: sprint-2-staging to main (Deliverable 2 and Lab 7)

> **Status:** Draft v0.4 (2026-11-28) · nothing in this file has been executed. Every box is unchecked. Merging the release PR to `main` deploys to Cloud Run immediately; every Cloud Shell or `gcloud` step needs explicit permission from the owner first (course rule: GCP, IAM and billing actions are never run without authorization).

## 0. What the pipeline does (read from `.github/workflows/deploy.yml`)

1. Push to `main` runs `test` (the full CI workflow for the same commit). `deploy` needs `test`, so a failing test skips every cloud step.
2. `deploy` signs in with Workload Identity Federation, builds the image tagged with the full commit SHA, pushes it, then updates and executes the migration job `s21271a0d-migrate` with `node database/migrate.js` and waits. Cloud Run is deployed only if the migration succeeds.
3. The deploy updates only `COOKIE_SECURE` and `APP_ORIGIN`, then a smoke test checks `/api/health`, `/api/ready` and the UI root (12 attempts, 10 s apart).
4. There is no automatic rollback and no image-tag rollback input (Lab 5 `deployment.md`). Recovery is an operator-reviewed redeployment through a new merge to `main`.
5. **The pipeline migrates but never seeds.** New demo data (second queue, third Host, tables) does not exist on the deployed database unless the seed is run there by a person.

## 1. Decisions to make before the release PR is opened

| # | Decision | Options | Recommendation | Decided by / date |
| --- | --- | --- | --- | --- |
| D1 | How the live main queue gets `max_party_size = 10` | (a) a narrow `UPDATE` run by an operator; (b) re-run the whole seed; (c) a one-line data migration `006` for the known seed queue id, applied by the pipeline | (c) needs a contract revision (the Lab 7 contract says the seed is the only place that introduces 10) and a reviewed PR; (a) is allowed by the current contract but is a manual step that can be forgotten; (b) also resets every demo password hash and creates the new demo rows | **Decided 28 Nov: (c)**, by Anapat; the contract revision PR #112 is merged (change request v0.4, AC-26b, reviewer record 'Reviewed d1222be, no blocking finding' added after the merge) and the tests plus migration `006` are in PR #114 (RED 10 failed, GREEN 289 passed locally). The reviewer of this checklist suggested (a) (a narrow `UPDATE` by an operator); that suggestion is recorded and not adopted because (c) is reviewed code applied by the pipeline |
| D2 | Whether the new demo rows (Bar counter, `host3`, tables T1/T2) must exist on the deployed database | yes (seed run on production) or no (the demo uses only the main queue) | Decide from what the post-deploy demo must show. Without them F-06 shows one queue and F-05 has no tables to seat. If they are needed, prepare an idempotent, reviewed procedure that inserts only the missing rows (Bar counter, `host3`, T1/T2) and does **not** overwrite existing accounts or password hashes (the current seed does overwrite hashes), and rehearse it on a disposable database first **Decided 28 Nov: NO**, by Anapat. Nothing is added to the deployed database; no procedure is written. Consequence (recorded limitation): on the deployed service only the main queue exists and there are no tables, so Seat, Release and the two-queue view cannot be shown there; they rest on the local and CI evidence (API 289, E2E 11). The reviewer's rule stays for any future request: insert only missing rows, never overwrite accounts or hashes |
| D3 | How the operator runs SQL or the seed against the deployed database | not documented in the repository (earlier seeding on Cloud SQL `s21271a0d-pg` is not described); candidates are a one-off override of the migration job's command, or a database connection from Cloud Shell | Known so far (reviewer's finding): the migration job `s21271a0d-migrate` was used from Cloud Shell before, but no complete transcript of a seed command is in the repository, so the exact earlier method cannot be reproduced from the repo. This is a recorded limitation. Before the real run, write down a verifiable procedure (the exact job or connection method, the command, the expected output, who runs it) and have it reviewed; never put credentials in Git or chat | **Decided 28 Nov: not needed** (follows from D2 = NO); no SQL or seed is run on the deployed database. If this changes, a reviewed procedure is required first |
| D4 | Whether `lab6-staging` (Lab 6 records and the version ledger) is merged into `main` with this release | yes / no | Decide before the release PR so the PR body lists it correctly | **Decided 28 Nov: NO**, by Anapat. `lab6-staging` is not merged into `main` with this release (Lab 6 is already submitted); PR #67 goes to `lab6-staging` only and the PDF refers to it |
| D5 | Scope statement for F-05 at release time | whole F-05 / table slice only | **Resolved by the merge of PR #107 (c874e15): No-show, Seat, tables, Release and the UI are on `sprint-2-staging` with API 257 and E2E 10 recorded locally by the author and re-run by the reviewer.** Still NOT EXECUTED: the manual keyboard audit and any deployed check | Decided 28 Nov |
| D6 | Tag or release name for the candidate | for example `v2.0-sprint2-rc1` on the `main` merge commit | Create only after a reviewed merge and a passing deploy | **Decided 28 Nov: `v2.0-sprint2-rc1`**, by Anapat; created only after the merge, a passing smoke test and the post-deploy checks, on the `main` merge commit, with his explicit permission |

## 2. Pre-release gates (all must be true before the release PR is opened)

- [x] Every feature PR for the cut-off is merged into `sprint-2-staging` (F-05 #107, F-07a #109, F-04 #106, F-06 #108, F-09a #105; checked 28 Nov 15:45); no open review thread blocks one of them. Still open: the contract for migration 006 is merged (#112) but the migration and its tests are not written.
- [x] **CI on `sprint-2-staging` is green on its head commit** (checked 28 Nov 16:04: push run on `df5923c` succeeded after PR #113; it had failed on `890be0f` and `07952da` because of a timing race in E2E-11). Repeat this check on the final head before the release PR.
- [ ] Migration `006` (PR #114: tests, then the SQL) is reviewed and merged into `sprint-2-staging`, and the full suite is green after that merge.
- [ ] `sprint-2-staging` CI is green on its head commit (the workflow now runs for this branch, PR #102).
- [ ] Full API/DB suite recorded on that commit: `npm run test:record -- s2-integration` (clean tree, fresh database or schema; counts copied into the PR body, not estimated).
- [ ] Playwright run recorded on that commit: `npm run test:e2e:record -- s2-e2e`; the regenerated Sprint 1 screenshots are not committed.
- [ ] UI fixture tests and the node production checks pass after `npm run build:client` (the production check needs the built client).
- [ ] Migrations apply in order on an empty database and on a database that already holds data: `001_init`, `002_per_queue_party_limit`, `003_cancel_and_no_show_status`, `004_no_show_seating` (if F-05 table slice is in), `005_queue_names`. The upgrade fixtures in the tests cover legacy rows; record that they ran.
- [ ] `docs/known-limitations.md`, `docs/traceability.md` (revision labels renumbered and unique), SRS/SDS/features and the contracts' result sections match what was really run; no row says PASS without a recorded run and a commit SHA.
- [ ] No secrets, passwords or personal e-mails in the diff (secret scan on the release diff).
- [ ] `docs/ai-use-log.md` has a row for each task; contributions are consistent with the PR history.
- [ ] Lab 7 change request has the announcement poster, post date, screenshot and the reviewer PR number filled in (it blocks the Lab 7 PDF, not the deploy).

## 3. Pre-deploy baseline (read-only; owner runs it in Cloud Shell, or authorizes it)

Capture before the merge so a before and after pair exists (use the exact `--format` strings; never run `gcloud run services describe` without `--format`, it prints the environment configuration):

```bash
gcloud run services describe s21271a0d --project=cpe-se-course-2026 --region=asia-southeast1 --format="value(status.latestReadyRevisionName,status.latestCreatedRevisionName,status.url)"
gcloud run services describe s21271a0d --project=cpe-se-course-2026 --region=asia-southeast1 --format="json(status.traffic)"
gcloud run revisions describe s21271a0d-00007-pnb --project=cpe-se-course-2026 --region=asia-southeast1 --format="value(metadata.name,metadata.creationTimestamp,status.imageDigest)"
```

- [ ] Serving revision before the release is `s21271a0d-00007-pnb` (or the value read, recorded as read).
- [ ] Public read-only check of `GET /api/queues` is not possible without a session; record the Login page release label and `/api/ready` only.
- [ ] Note the existing partner test records on the deployed database (the fixtures the ledger calls #22 and #23, used for the HairRoot retest) so the post-deploy checks do not modify or delete them; confirm what exactly those fixtures are before the first write.

## 4. Release PR

- [ ] Branch `sprint-2-staging` to `main`, reviewer added, title says that merging deploys.
- [ ] Body lists: every included PR and issue; the five migrations in order and what each does; the migration job runs before the deploy; env changes (none expected); the seed or SQL step from D1/D2/D3; the rollback note (section 7); the recorded evidence labels and commit SHA of the candidate.
- [ ] The teammate reviews the PR; the author does not approve or merge it. **The merge is the deploy: it needs the owner's explicit go-ahead in that message.**

## 5. After the merge (record, do not fix silently)

- [ ] Deploy workflow run id and conclusion (both jobs), the full `main` commit SHA, the image tag in the run summary, the new revision name, the runnable digest, the smoke test result.
- [ ] Read-only Cloud Shell after the deploy: serving revision and traffic, revision digest, migration job image (the ledger lists these as PENDING items).
- [ ] If any step fails, stop and report the real output; do not retry blindly or patch live data.

## 6. Post-deploy checks (synthetic or demo accounts only; passwords from the private store, never in files)

| # | Check | Expected | Result |
| --- | --- | --- | --- |
| 1 | Login page shows the release label; `/api/ready` is ready | pass | PENDING |
| 2 | Sprint 1 journey: Customer joins, Host calls next, Host completes, Customer sees COMPLETED | unchanged behaviour | PENDING |
| 3 | `GET /api/queues` shows `maxPartySize` for each queue (main queue 10 only after D1 is done) | field present; value 10 on the main queue after D1 | PENDING |
| 4 | Join with party size 10 on the main queue; party size 11 rejected; party size 9 accepted | 201, 400 `INVALID_PARTY_SIZE` naming the limit, 201 | PENDING |
| 5 | Cancel a WAITING ticket, then join again | CANCELLED, new ticket number | PENDING |
| 6 | Host closes and reopens the queue; a Join while closed | 409 `QUEUE_CLOSED`, no number consumed; reopen works | PENDING |
| 7 | Customer history filter (status and date range) | only own tickets, invalid range 400 | PENDING |
| 8 | Persistence: the ticket still exists after the serving revision changes or the instance restarts | same ids and states | PENDING |
| 9 | Forbidden role and ownership cases through the API (Customer on a Host endpoint 403, another Customer's cancel 403) | 403 with no private data | PENDING |
| 10 | F-05 on the deployed service: the table list answers (empty, because D2 = NO); No-show works on a script-owned ticket. Seat and Release are not demonstrable there | as the contract says; limitation recorded | PENDING |

Each check records: time (Asia/Bangkok), account role (not the password), request and response status, and the version (commit and revision).

## 7. Rollback and recovery

- The migrations are additive for existing rows (new columns, wider CHECKs, a new table, a data-preserving backfill), so the previous application revision `00007-pnb` keeps working against the migrated schema; the new statuses and columns are simply unused by it. This is a reasoning from the migration text and the tests, not something that was exercised on the live database.
- There is no automatic rollback. To go back, an operator-reviewed change reverts the release on `main` (a new merge, never a force-push), which redeploys through the same pipeline.
- A database-level rollback of the migrations is not provided; data fixes on the live database are made only by the owner, with permission, and recorded.

## 8. Permission register (what needs an explicit yes)

| Action | Who may do it | Needs explicit permission in the same message |
| --- | --- | --- |
| Merge the release PR (deploys) | owner, after teammate review | yes |
| Any Cloud Shell or `gcloud` command, even read-only | owner runs, or authorizes | yes |
| SQL update or seed on the deployed database | owner | yes |
| Create a tag or release | owner | yes |
| Change IAM, billing or Cloud resources | not part of this release | never without a separate authorization |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial checklist drafted from the deploy workflow, Lab 5 deployment notes and the version ledger; all boxes unchecked, decisions D1 to D6 open |
| v0.2 | 2026-11-28 | Record decision D1 = (c) (contract PR #112) and the reviewer's feedback: option (a) suggested, the D2 procedure must not overwrite existing accounts, and D3 has no complete transcript of the earlier seed in the repository |
| v0.3 | 2026-11-28 | Update after the F-05, F-07a and migration 006 contract merges: D5 resolved, feature gate checked, new gate for green CI (E2E-11 race, PR #113) |
| v0.4 | 2026-11-28 | CI gate checked on `df5923c`; D1 now has code in PR #114 and a new gate for merging it |
| v0.5 | 2026-11-28 | Record Anapat's decisions D2 = NO (no demo rows on production, Seat/Release/two-queue view not demonstrable there), D3 not needed, D4 = NO, D6 = `v2.0-sprint2-rc1`; check 10 narrowed to what an empty table list allows. Old wording said D2-D4 and D6 were PENDING |
