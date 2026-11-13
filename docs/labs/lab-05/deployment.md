# Lab 5: local deployment and CI preparation

Status: local implementation verified, 13 November 2026. Follow-up authorized preparation publishes a Lab 5 review PR and CI; no merge, GCP deployment, billing or IAM changes are authorized. Cloud deployment is NOT EXECUTED.

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

`.github/workflows/ci-docker.yml` runs for PRs into staging, main and legacy sprint-1-staging, manually, or as a reusable workflow. The job `test-and-docker` installs from the lockfile, provisions PostgreSQL, migrates both isolated DBs, seeds dev fixtures, runs API tests, builds the SPA, verifies production routes, runs Chromium E2E and builds the production Docker image without pushing it. An earlier failed command fails the job; no continue-on-error/path filters bypass the gate. Permissions are contents:read only. No cloud authorization exists in this workflow.

After authorization to publish, both integration and release paths need a GitHub ruleset requiring `test-and-docker`, a reviewed PR, current branch checks and no author self-approval. Run one intentional failing temporary PR to demonstrate merge blocking, then close/fix it without breaking the release. YAML alone does not enable branch protection. Hosted CI is being submitted through the review PR; its actual run must be inspected before claiming PASS. The required-check demonstration remains NOT EXECUTED. GitHub reports HTTP 403 for rulesets because this repository is private on its current plan; enable a supported plan or explicitly authorize making the repository public before enforcing this gate. Do not change visibility without the owner's approval.

## Actual local verification

Tested the uncommitted Lab 5 working tree based on accepted release eaa555d; these results do not replace Sprint 1 immutable run headers.

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
