# Part E: Release candidate on main (deployed 28 November 2026)

> Facts below come from recorded evidence files, the GitHub Actions log of the deploy run, and read-only Cloud Shell output sent by the teammate as screenshots. Anything not run is marked NOT RUN. The release tag `v2.0-sprint2-rc1` was created on 29 Nov 2026 (annotated tag object `5f932dd4f219228feac902cab88b9a6e23a480ec`, pointing at `f3e7c637457dd4f1f78e9bfabda513359fbcb538`).

## E.1 Identity of the candidate

| Item | Value | Source |
| :-- | :-- | :-- |
| Repository | https://github.com/PpAnpt/dineq (public) | GitHub |
| Release PR | #120, `sprint-2-staging` to `main`; opened by Siwarak (draft body and evidence mapping), given a comment review, approved by Anapat, and merged after Anapat's explicit instruction at about 20:49 Asia/Bangkok, 28 Nov 2026 (branch protection required the approval) | PR history |
| Candidate on the integration branch | `52fc89732a890a017e7b3292e91986390f2b8bfa` (`sprint-2-staging`); push CI run 46133838057 succeeded | Actions |
| Commit on `main` that was deployed | `f3e7c637457dd4f1f78e9bfabda513359fbcb538` (merge commit of #120) | Actions |
| Deploy workflow run | 46151508392, both jobs (`test`, `deploy`) succeeded | Actions log |
| Image | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/s21271a0d/s21271a0d:f3e7c637457dd4f1f78e9bfabda513359fbcb538` (tag is the full commit SHA) | workflow log, Cloud Shell |
| Digest printed by `docker push` | `sha256:358811130e3478a049c0819c35d7c227f4390b5b30721440fcf941399708b97e` | workflow log |
| Digest reported for the revision | `sha256:f1ceac3484fc2776ebd69202654d35be2c0da3db35265033dc817794a9c290b5` (differs from the push digest; the cause was not investigated; both are recorded as read) | Cloud Shell screenshot |
| Migration job execution | `s21271a0d-migrate-4m7km` completed successfully; the job image tag equals the full commit SHA above | workflow log, Cloud Shell |
| Serving revision | `s21271a0d-00008-g6r`, created 2026-11-28T13:52:46Z (20:52 Asia/Bangkok), 100 percent of traffic; before the release: `s21271a0d-00007-pnb` | Cloud Shell |
| Public URL | https://s21271a0d-4d7hbszvwq-as.a.run.app | deploy configuration |
| Smoke test in the pipeline | `/api/health`, `/api/ready` (`db: connected`) and the UI root passed | workflow log |
| Tag | `v2.0-sprint2-rc1` (annotated), created by the owner's instruction on 29 Nov 2026 after the deploy and the partial post-deploy checks; points at the `main` merge commit above | `git ls-remote --tags origin` |

`main` had no commit that was missing from `sprint-2-staging` when the release PR was checked (0 behind, 202 ahead), so the merge introduced nothing that the integration branch had not tested.

## E.2 Verification on that commit

| What | Result | Evidence |
| :-- | :-- | :-- |
| Build, migrations on an empty database, API/DB suite and Playwright in CI on the candidate | success (run 46133838057) and on the merge commit (CI inside run 46151508392) | Actions |
| API/DB integration suite, real PostgreSQL, fresh `public` schema | **289 passed / 0 failed / 0 skipped**, 13 test files, run on `b05cbd5` (= candidate plus evidence files only) | `docs/evidence/s2-integration.txt/.json` |
| Playwright acceptance journeys, Chromium | **11 passed / 0 failed / 0 skipped** | `docs/evidence/s2-e2e.txt/.json` |
| Production-image checks (built client, smoke test script, SPA deep links) | passed inside the CI `test` job | CI log |

These are the authors' local runs plus hosted CI; the teammate re-checked the recorded files and the code equivalence between the run commits and the candidate, and did not run an additional full suite.

The acceptance journeys are: E2E-1 to E2E-4 (Sprint 1: join, Call Next and Complete, duplicate and invalid party size, Customer cannot use the Host page, logout invalidates the session), E2E-5 and E2E-6 (release label and the 403 evidence helper), E2E-7 (cancel and rejoin, F-04), E2E-8 (Host closes and reopens, Customer blocked while closed, F-06), E2E-9 (history filter, F-07a), E2E-10 and E2E-11 (No-show, owner refresh and rejoin with retained history; fit-only table choice, Seat, Release, owner sees COMPLETED, F-05).

## E.3 Cross-feature checks

Covered by recorded runs: a cancelled or no-show ticket keeps its history and a new join gets a new ticket number (E2E-7, E2E-10); a closed queue blocks Join while an existing ticket stays usable (E2E-8); seating, release and completion share the queue-then-entry-then-table lock order, covered by the F-05 concurrency tests in the 289-case run; history filters show only the caller's own tickets (F-07a tests).
Not covered: a single long journey that crosses every feature in one browser session (planned, owner: Siwarak), cross-browser runs, and a performance measurement (AC-73).

## E.4 Failures, skips and defects disclosed

- Final recorded runs: 0 failed, 0 skipped.
- During the sprint the CI on `sprint-2-staging` failed twice because of a timing race in the E2E-11 test (the test refreshed a page before the Host action finished). It was reproduced with a delayed request, fixed in the test by waiting for the visible result (PR #113) and was green afterwards. No assertion was weakened.
- Review findings fixed before merge (examples): migration `003` CHECK allowed a NULL `from_status` (PR #106, RED then GREEN); the F-07a range comparison lost nanosecond precision (PR #109, RED then GREEN); the F-05 UI and tests were corrected after review (PR #107).
- Known limitation, not a defect of the release: the deployed database was **not seeded** by the pipeline, so on the deployed service only the main queue exists and there are no tables. Seat, Release and the two-queue view are therefore covered by the local and CI evidence only, and cannot be demonstrated on the deployed service (decision D2, 28 Nov).
- No full manual keyboard audit, no performance measurement and no cross-browser run were done.

## E.5 Post-deploy checks (28 Nov 2026)

Done by the owner by hand in the browser with the synthetic demo account `customer29@dineq.test` (four screenshots in `docs/evidence/deployed-00008-g6r/`, no status codes captured, no address bar or clock visible); the scripted version (`docs/labs/lab-07/post-deploy-check.mjs`, PR #116) has not been run against the deployed service.

| # | Check | Result |
| :-- | :-- | :-- |
| 1 | Login page and readiness | PASS: `/api/ready` and UI root by the pipeline smoke test; login by the owner |
| 3 | `maxPartySize` shown for the main queue (10 after migration 006) | PASS: the form label reads `Party size (1-10)` (screenshots S2, S3) |
| 4 | Party size 11 rejected; 10 accepted | PASS with a limit: the browser blocks 11 with "Value must be less than or equal to 10." (S2; the form `max` attribute, so no request reaches the API and the 400 `INVALID_PARTY_SIZE` is not shown); 10 was accepted and created Ticket #25 (S4); 9 not tried |
| 5 | Cancel a WAITING ticket, then join again gets a new number | PASS: Ticket #24 was cancelled in the first manual check and the later join got Ticket #25, which was then cancelled (S4, S5); the order and times of the joins are not shown in the images |
| 2, 6, 7, 8, 9, 10 | Host journey, close and reopen, history filter, persistence across restart, forbidden roles through the API, table list | NOT RUN on the deployed service (shared service; the Host journey and close/reopen could affect other teams' tickets) |

## E.6 Setup summary

- **Configuration (environment variables only, no secrets in Git):** `DATABASE_URL`, `PORT`, `APP_ORIGIN` (must equal the public origin; mutating requests with another `Origin` get 403), `SESSION_TTL_SECONDS`, `NODE_ENV`, `COOKIE_SECURE`, `SEED_DEMO_PASSWORD` (seed only). Test and local-only: `TEST_DATABASE_URL` (name must end in `_test`), `POSTGRES_PASSWORD`, `COMPOSE_PORT`, `COMPOSE_APP_ORIGIN`, `E2E_API_PORT`, `E2E_WEB_PORT`, `VITE_DEV_PORT`, `API_PROXY_TARGET`. Production values live in Cloud Run and Secret Manager.
- **Docker:** one image built from the repository `Dockerfile` (Node 24, built React client served by Express in production); `docker-compose.yml` runs the app and PostgreSQL locally (steps in `docs/labs/lab-05/deployment.md`).
- **Migrations:** `node database/migrate.js` applies unrecorded files in name order, each file in a transaction, tracked in a migrations table. Files: `001_init`, `002_per_queue_party_limit`, `003_cancel_and_no_show_status`, `004_no_show_seating`, `005_queue_names`, `006_main_queue_party_limit`.
- **Seed:** `npm run db:seed` (demo accounts, queues, tables) is **not** part of the pipeline and was **not** run on the deployed database for this release; it resets demo password hashes, so it must not be re-run on the shared service.
- **Deploy:** push to `main` runs the full CI workflow; if it passes, `deploy` signs in with Workload Identity Federation, builds and pushes the image tagged with the full commit SHA, updates and runs the migration job and waits, deploys Cloud Run only after the migration succeeds, then smoke-tests. There is no automatic rollback; recovery is a reviewed forward fix through the same pipeline.

## E.7 Readiness and plan to 13 December

Readiness review: `docs/labs/lab-07/readiness.md` (checklist, technical debt, limitations). Remaining work with owners and dates is in Part C: F-07b (Anapat, 6 to 8 Dec), F-08 reporting (Siwarak, 6 to 10 Dec), AC-73 performance measurement (Anapat, 10 Dec), AC-74 keyboard audit (Anapat, 11 Dec), AC-75 UX audit (Siwarak, 11 Dec), final regression and closing (12 to 13 Dec). Dates for Anapat's items are proposals until confirmed.
