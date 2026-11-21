# Lab 5: local deployment and CI preparation

Status: local implementation verified, 13 November 2026; review follow-up 17 November 2026. Follow-up authorized preparation publishes a Lab 5 review PR and CI; no merge, GCP deployment, billing or IAM changes are authorized. Cloud deployment is NOT EXECUTED.

## Baseline and branch

Sprint 1 release: `v1.0-sprint1`, accepted commit `eaa555dfb062d3fc627a374cd55a910b6d609509`. No local or remote `staging` existed at inspection. A local `staging` was created at that accepted release; `chore/lab5-local-infrastructure` branches from it. The old `sprint-1-staging` history is preserved. The follow-up publishes staging at this release and the Lab 5 feature branch for teammate review.

The supplied ZIP was extracted into ignored `.local/lab5-starter/toktickit-lab5-starter`. Its README, Docker/Compose/CI templates and guides were inspected. The Lab handout defines required outcomes; the guide and kit provide examples. Their cloud setup commands were not executed.

## Stack and changes from TokTickIT

| Area | DineQ implementation |
| --- | --- |
| Dependency installation | Root npm workspaces: `server`, `database`, `client`; single root package-lock.json; `npm ci` at root |
| API | Node 24, ESM JavaScript, Express 5; no TypeScript compile step |
| Client | React + Vite; `npm run build:client` writes client/dist |
| Database | PostgreSQL 15+ (Compose/CI use 16), pg, ordered SQL migrations; no Prisma |
| Tests | Vitest + Supertest against a real separate `_test` database; Playwright E2E |
| Container | One image for API + built SPA, non-root node user, production dependencies only |
| Local services | PostgreSQL named volume, one-shot migration, app; explicit opt-in seed tool |
| Production UI | Express serves built files and the five known SPA paths; `/api` continues to enforce authentication and return JSON |

The root Dockerfile adapts the unified starter approach. Separate nginx/client/server images and Prisma entrypoints are unnecessary. Runtime migrations are not hidden in server startup: Compose runs a one-shot migration before app startup, and a future Cloud Run job can execute `node database/migrate.js` from this same image. Seeding is an explicit operation, not part of every redeploy. Sessions, tickets and events already live in PostgreSQL.

## Configuration

Only placeholders belong in `.env.example`. Set actual values in ignored files. The image never copies .env, Git history, local reports or node_modules. Compose publishes only the app on loopback; PostgreSQL has no host port.

| Variable | Purpose / source | Secret? |
| --- | --- | --- |
| DATABASE_URL | Native API, migration and seed connection; developer or future Secret Manager. Compose constructs its own URL using db:5432 | Yes |
| TEST_DATABASE_URL | Disposable separate DB with name ending `_test`; never point to dev/live data | Yes outside disposable CI |
| PORT | API listening port; default 3000; later injected by Cloud Run | No |
| APP_ORIGIN | Exact browser origin allowed for mutations; native Vite http://localhost:5173; cloud uses exact HTTPS service URL | No |
| SESSION_TTL_SECONDS | Positive session lifetime; default 3600 | No |
| NODE_ENV | development/test/production; production enables built SPA serving | No |
| COOKIE_SECURE | Native HTTPS/cloud true; local HTTP false. Compose fixes false for its local HTTP mode | No |
| SEED_DEMO_PASSWORD | Local private demo password; needed for seed and test fixtures, not normal runtime | Yes |
| POSTGRES_PASSWORD | Compose-only database password. Choose URL-safe letters/numbers because Compose embeds it in DATABASE_URL | Yes |
| E2E_API_PORT / E2E_WEB_PORT | Separate harness API/web ports, defaults 3100/5273; must differ | No |
| VITE_DEV_PORT / API_PROXY_TARGET | Native Vite port/proxy override, defaults 5173/http://localhost:3000; harness supplies its own values | No |
| COMPOSE_PORT | Loopback host port, default 8080; use 18080 if occupied | No |
| COMPOSE_APP_ORIGIN | Exact matching browser origin including chosen host port | No |

Compose fixes the internal database user/name to dineq/dineq_dev and internal API PORT to 3000. These are local topology constants, not cloud configuration. CI uses explicitly disposable credentials with databases dineq_ci and dineq_test; it needs no repository secrets or GCP credentials.

## Local PowerShell commands

Prerequisites: Docker Desktop running in Linux-container mode, Docker Compose v2+, Git. Native checks additionally need Node 24 and a reachable PostgreSQL instance. Run from repository root.

```powershell
New-Item -ItemType Directory -Force .local/lab5 | Out-Null
Copy-Item .env.example .local/lab5/compose.env
notepad .local/lab5/compose.env
# Set POSTGRES_PASSWORD and SEED_DEMO_PASSWORD to private local values.
# If using COMPOSE_PORT=18080, also set COMPOSE_APP_ORIGIN=http://localhost:18080.
docker compose --env-file .local/lab5/compose.env config --quiet
docker compose --env-file .local/lab5/compose.env up --build -d --wait
docker compose --env-file .local/lab5/compose.env run --rm seed
# Open the origin configured above, e.g. http://localhost:8080/login.
Invoke-RestMethod http://localhost:8080/api/health
docker compose --env-file .local/lab5/compose.env logs app migrate
docker compose --env-file .local/lab5/compose.env restart app
# Stop containers while retaining database data:
docker compose --env-file .local/lab5/compose.env down
```

Do not use `down -v` when verifying persistence: it deletes the database volume. Database initialization credentials only take effect when the named volume is empty. Keep the same password for an existing volume. Do not print resolved `docker compose config` or .env values in evidence; `config --quiet` validates without displaying secrets.

Native checks (create dineq_dev and dineq_test first; see root README for PowerShell database setup):

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env with local DB URLs and demo password; preserve an existing .env.
npm run db:migrate
npm run db:migrate -- --test
npm run db:seed
npm test
npm run build:client
node --test server/checks/production.test.js
npx playwright install chromium
# E2E starts its own API :3100 and web :5273; dev servers can stay running.
npm run test:e2e
```

The API tests reset only TEST_DATABASE_URL. The E2E harness starts its own API/Vite processes, uses the test database and refuses occupied ports. `npm run test:review --workspace=client` is a separate fixture suite requiring a running Vite client and installed Google Chrome; it is not the CI browser suite. Do not run destructive tests against production.

Standalone image: `docker build -t dineq-lab5:local .`. The image needs DATABASE_URL, APP_ORIGIN and related runtime variables; publishing a port without providing a database is insufficient. To migrate using the image, override its command with `node database/migrate.js` and inject DATABASE_URL. No real values are baked into layers.

## CI and quality gate

`.github/workflows/ci-docker.yml` runs for PRs into staging, main and legacy sprint-1-staging, pushes to staging/main, manually, or as a reusable workflow. The job `test-and-docker` installs from the lockfile, provisions PostgreSQL, migrates both isolated DBs, seeds dev fixtures, runs API tests, builds the SPA, verifies production routes, runs Chromium E2E and builds the production Docker image without pushing it. An earlier failed command fails the job; no continue-on-error/path filters bypass the gate. Permissions are contents:read only. No cloud authorization exists in this workflow.

After authorization to publish, both integration and release paths need a GitHub ruleset requiring `test-and-docker`, a reviewed PR, current branch checks and no author self-approval. Run one intentional failing temporary PR to demonstrate merge blocking, then close/fix it without breaking the release. YAML alone does not enable branch protection. Hosted CI passed at c566a22 (run 43366563813). The repository is now public, but the connected account has no admin access. No ruleset is active; the owner must apply it. The required-check demonstration remains NOT EXECUTED.

## Actual local verification

The local results below were originally run before the Lab 5 commits, based on accepted release eaa555d. The subsequent hosted run at committed head c566a22 passed the same CI checks. These records do not replace Sprint 1 immutable run headers.

| Check | Observed result |
| --- | --- |
| Vite production build | PASS; 19 modules; 299 ms |
| Production SPA/deep-link/asset/API-boundary tests | 2 passed, 0 failed, 0 skipped |
| Initial native API run using old local DB endpoint | 100 failed, 8 skipped; ECONNREFUSED localhost:55432; infrastructure unavailable |
| Dedicated PostgreSQL 16 container on localhost:55433 | Ready; both dev/test migrations applied 001_init.sql; seed created 30 Customers and 2 Hosts |
| API rerun against isolated container DB | 4 files passed; 108 tests passed; 25.15 s |
| Initial local E2E attempt | Harness refused occupied API port 3000 (Docker container invoicedoc-client) before any test ran |
| E2E rerun with isolated ports | 4 passed (10.2s), exit 0; API 3100, Vite 5273, dedicated test DB |
| Docker build | PASS; npm ci, Vite build, production prune; no host dependencies needed |
| Clean clone + local patch Docker build | PASS from local staging clone with only source/patch, no .env/node_modules/dist; build cache reused from first full build |
| Compose validation / startup / seed | PASS; db healthy, migration exit 0, app healthy, seed completed |
| Container privilege / HTTP | uid=1000(node); /login=200; /api/health={data:{status:ok}} |
| Domain persistence after API restart | Customer joined partySize 4, Host called/completed ticket 1; after app restart same session and identical COMPLETED ticket retrieved |

The first clean-clone attempt accidentally selected the old local main (initial skeleton), so Docker correctly reported missing source. Repeated using local staging at the accepted release plus the Lab 5 patch; build succeeded. Compose initially could not bind occupied port 8080; verification used 18080 with matching APP_ORIGIN. No unrelated process was stopped. Local raw verification output is ignored under `.local/lab5/verification.txt`; generated local passwords are excluded from this document.

## Pending after GCP project setup

No GCP resource has been created or changed here. Record confirmed values later rather than substituting guesses:

| Setting | Pending value |
| --- | --- |
| GCP_PROJECT_ID / project number | Not supplied |
| GCP_REGION | Confirm; starter example asia-southeast1 |
| Artifact Registry / Cloud Run / migration job / Cloud SQL | Confirm team names (proposed dineq / dineq / dineq-migrate / dineq-pg) |
| Public URL / APP_ORIGIN | Not created |
| WIF_PROVIDER / WIF_SERVICE_ACCOUNT | Not created |

Next work: agree resource names and cost settings; provision persistent Cloud SQL and Secret Manager; configure Workload Identity Federation and least-privilege runtime/deployer accounts; adapt deploy.yml/release scripts to DineQ's SQL migration command and actual auth/queue endpoints; review the concrete cloud setup before executing it. Deploy accepted main through CI, use the full commit SHA as the image tag, record image digest and Cloud Run revision, and verify the domain journey and persistence after a redeploy. The current app does not expose a version endpoint; initially identify the running commit through its revision image tag/digest in the deployment record. Plan future rollback with compatible SQL schema changes.

Cloud deployment workflow, public URL, cloud persistence/redeploy proof, intentional failing PR, required checks, Issues/board labeling and teammate review are pending. Do not present local success as completion of all Lab 5 R-01..R-12.

## References

- Supplied 01_SE_Lab_5_updated.pdf: required R-01..R-12 and files.
- Supplied 02_lab5-starter-kit.zip: toktickit-lab5-starter templates/guides.
- Supplied Student Guide V1.1: cloud setup/release walkthrough (not executed).
- https://docs.docker.com/compose/how-tos/startup-order/ (health and completed-job dependencies).
- https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers
- https://expressjs.com/en/starter/static-files/

### E2E port override (PowerShell)

```powershell
$env:E2E_API_PORT = "3200"
$env:E2E_WEB_PORT = "5373"
npm run test:e2e
# Optional: remove overrides to return to 3100 / 5273.
Remove-Item Env:E2E_API_PORT, Env:E2E_WEB_PORT
```

No manual API or Vite startup is needed for E2E. The harness starts/stops both; TEST_DATABASE_URL and SEED_DEMO_PASSWORD still must point to disposable test fixtures. It never reuses a running dev server. Assertions were preserved: only hard-coded Origin and cookie-replay URLs in E2E-3/4 now use Playwright baseURL. Rerun output is local at `.local/lab5/e2e-ports.txt`.

## Hosted CI and repository-settings handoff

Latest hosted PR run before this review follow-up passed all steps: https://github.com/PpAnpt/dineq/actions/runs/43366563813 (`test-and-docker`, 1m21s), head c566a22. This includes API, production checks, E2E and Docker build.

The student explicitly authorized Public visibility and required checks on 13 November 2026. The connected account BBINGOAL has push but not admin permission; GitHub rejected the visibility change (HTTP 404). The owner subsequently made the repository public. On 17 November the connected account still has admin=false and no ruleset is active. Owner PpAnpt must perform the following while authenticated as the owner/admin, after checking the published history contains no secrets:

```powershell
gh api --method POST repos/PpAnpt/dineq/rulesets --input docs/labs/lab-05/ruleset.json
```

The prepared ruleset targets main and staging, requires one approval (including approval after the last push), resolves review threads, dismisses stale approvals, requires the up-to-date test-and-docker check from GitHub Actions, blocks deletion/force pushes and has no bypass actors. Create it once; if a rule already exists, inspect/update it rather than creating duplicates. Do not merge the Lab 5 PR until the teammate approves and its latest CI run is green. A separate intentional failing PR remains needed to demonstrate the merge block.

## PR #20 review decisions (17 November 2026)

- Keep docs/labs/lab-05, the path explicitly required by the Lab 5 handout and the original user request. Remove the unused lab-5/.gitkeep placeholder so there is one Lab 5 directory; retain lab-6/lab-7.
- Retain the explicit Sprint 1 SPA route allowlist. Unknown paths intentionally return JSON 404 in production; known navigation routes are covered by production checks. A generalized fallback is a future routing decision, not required for the current screens.
- Construct express.static once per app instance, not on every request.
- CI now checks pushes to staging/main as well as PRs, so merge commits have their own checks. This is not a deployment workflow.
- CLAUDE.md v0.4 reflects authorized Lab 5 scope and the current integration branch.
- Visibility is already public by owner action. Course reference materials and machine paths/student names in historical evidence are present by the existing team publication decision; these are not credentials. The scanner cannot establish permission to redistribute course materials. Do not rewrite historical evidence or delete reference documents without a separate team decision.

### History credential audit

Gitleaks v8.30.1 (official gitleaks/gitleaks release) was run with `git . --log-opts=--all --redact` against all locally available Git refs, not only the current tree: 59 scanned non-merge commits, approximately 1.21 MB, no leaks found. The redacted JSON report is kept locally under .local/lab5/review-audit/history.json. This is pattern-based detection, not a guarantee that all possible credentials or personal information are absent. No secret values are printed or copied into committed evidence. Historical course documents and local paths remain a separate publication/privacy decision; Public visibility was explicitly authorized and applied by the owner.

## Health and readiness endpoints

- `GET /api/health`: process is up; no database access.
- `GET /api/ready` (added for Cloud Run/CI smoke checks): public and read-only. `200 { data: { status: "ready", db: "connected" } }` when `SELECT 1` succeeds; `503 { error: { code: "NOT_READY", message: "Database is not reachable" } }` otherwise, without exposing the driver error. Covered by INFRA-09..11 in `server/tests/infra.test.js` (infrastructure checks, not Sprint 1 AC).

## Deploy workflow (`.github/workflows/deploy.yml`)

The file starts from the portal-generated `deploy.yml` (WIF keyless sign-in, environment `demo`, file name and `main` branch unchanged) and adds only DineQ-specific parts:

| Addition | Why |
| --- | --- |
| `APP_PORT` defaults to `3000`, `MIGRATE_COMMAND` defaults to `node database/migrate.js` | Matches the Dockerfile (`PORT=3000`) and the plain-SQL migrator; no extra GitHub variables are required |
| Production env vars and smoke test | `COOKIE_SECURE=true` and `APP_ORIGIN=<service URL>` passed to `gcloud run deploy --update-env-vars`; step "Smoke test" polls `/api/health` and `/api/ready` for up to 2 minutes and fails the run if either is not 200. Only those keys change. The URL is read from the existing service status.url before deploy; the smoke step fails if the service URL changes |
| Summary step lists commit SHA, image, revision and URL | Evidence for "running revision matches the commit" |

Order per push to `main`: run the full CI for the same commit (reusable `ci-docker.yml` as job `test`), then build and push the image tagged with the full commit SHA, run the migrate job with `--wait`, deploy the service with production env vars in the same command, then smoke test. `deploy` has `needs: test`, so a failed or skipped `test` job skips every Google Cloud step; a manual run on any other branch is skipped by the `main` guard. A failed migration stops before the service update. The smoke test checks `/api/health`, `/api/ready` and that `/` serves the built UI (`id="root"`), all read-only.

The CI gate is guarded without contacting GCP by `server/checks/deploy-workflow.test.js` (run in CI with the production checks): it fails if the `test` job, `needs: test`, the `main` guard or the UI smoke check disappear, or if any `gcloud`/auth step appears outside the gated `deploy` job. Red run: commit `88a3d83`; green: recorded in PR #24.

Deliberate deviation: the image is deployed by full-SHA tag, not by digest, and there is no automated rollback. The running revision and image appear in the run summary; to roll back, redeploy a previous commit's image tag (SQL migrations must stay backward compatible). To be recorded from the first real run.

Not done by the workflow: seeding demo accounts (needs `SEED_DEMO_PASSWORD`, a secret) and any secret value. The workflow contains no password or key; the four `demo` environment variables are identifiers only. Deployment is limited to branch `main` by an environment branch rule, and `main` requires a reviewed PR (ruleset `protect-main`).

Status (21 November 2026): the first real workflow run failed after service deployment, before smoke testing (see findings below). PR #26 changes production env configuration and has green CI; the changed workflow has not yet completed a real cloud run. Successful smoke, seeded-account journeys and cloud persistence/redeploy evidence remain NOT EXECUTED.

### Update 21 November 2026: ruleset

Ruleset `protect-main` was applied by the owner and is active (review plus `test-and-docker`); this supersedes the earlier statements above that no ruleset is active. The intentional failing PR that proves the merge block (C-02) has not been run yet.

### First deploy run (21 November 2026): findings

Run 44884767549 (push of release PR #25, commit d48edb1): job `test` (reusable CI) succeeded; in job `deploy` the Google Cloud sign-in, image build/push, **migrate job with `--wait`** and `gcloud run deploy` all succeeded. The next step failed: `gcloud run services update` was denied for the deployer service account (`run.revisions.list` denied), so the smoke test never ran and that run is not a successful deployment. Fix: pass `COOKIE_SECURE`/`APP_ORIGIN` to `gcloud run deploy` itself (that call is permitted) and compute the URL deterministically. No IAM change was made. The first successful run, public URL and persistence proof are still to be recorded.

### Release #34 execution - 21 November 2026

Release merge `3eb3b0207ac3e54169cee00b2744c20d457ef68c`, run https://github.com/PpAnpt/dineq/actions/runs/44890711350: reusable CI, WIF, image push, migration and deployment all passed. Smoke failed before making HTTP checks because status.url was `https://s21271a0d-4d7hbszvwq-as.a.run.app` while derived APP_ORIGIN was `https://s21271a0d-670075229477.asia-southeast1.run.app`. Summary was skipped. This is NOT a fully successful deployment run and Issue #30 remains open.

Fix: read the existing service's actual status.url before gcloud run deploy, pass it as APP_ORIGIN, and retain the post-deploy equality/health/readiness/UI checks. The same describe command already succeeded in the failed smoke step. No IAM change, service recreation or services update call is needed. A regression check first failed 1/6 locally for the missing pre-deploy URL lookup; after the workflow fix all checks must pass. The next reviewed release must verify actual cloud execution. Demo seeding and authenticated/persistence checks remain separate under #31.
