# DineQ

Restaurant walk-in queue management (CPE334 Theme 9)

Sprint 1: Express/PostgreSQL API, session authentication, queue joining,
React + Vite client, and Vitest + Supertest.
P1 contracts were merged in [PR #1](https://github.com/PpAnpt/dineq/pull/1)
at `2d87368346ff18b5aabf06e5346c1142740c63a2` before the P2 implementation.
P3 builds on the merged P2 infrastructure in [PR #2](https://github.com/PpAnpt/dineq/pull/2)
at `8f4dc4e23bd06adecdca65beb40067d3137e5120`.

## Prerequisites

- Windows PowerShell, Git and npm.
- Node.js 20.19+ on the 20.x line, or 22.12+; verified with Node 24.14.0 / npm 11.9.0.
- PostgreSQL 15+ with a running local server; verified with PostgreSQL 18.
- PostgreSQL command-line tools (`createdb`, `psql`, optionally `pg_ctl`) on PATH,
  or use their full path as in the examples below. Adjust `18` to your installed version.

## Setup from the repository root

```powershell
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Create two empty databases on your PostgreSQL server. For a standard installation
listening on port 5432, use an account permitted to create databases (`postgres`
below is an example account). `-W` prompts for its password without putting it in Git:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h localhost -p 5432 -U postgres -W dineq_dev
& "$pgBin\createdb.exe" -h localhost -p 5432 -U postgres -W dineq_test
```

Edit `.env` locally. Replace the username/password placeholders in **both** URLs
with the account that owns these databases; URL-encode reserved characters in
credentials. Match the actual host/port. Set `SEED_DEMO_PASSWORD` to a local demo
password; no real credential belongs in this README, test output or commits.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Development database (`dineq_dev`); startup fails if missing |
| `TEST_DATABASE_URL` | Separate test database (`dineq_test`); never falls back to dev |
| `PORT` | API port, default `3000` |
| `APP_ORIGIN` | Frontend origin for F-01, default `http://localhost:5173` |
| `SESSION_TTL_SECONDS` | Positive session lifetime for F-01, default `3600` |
| `NODE_ENV` | Runtime environment, e.g. `development` |
| `COOKIE_SECURE` | `true` for HTTPS or `false` for local HTTP |
| `SEED_DEMO_PASSWORD` | Required by seed/tests; stored only as Argon2id in the DB |

Then migrate **both** databases, seed dev and test:

```powershell
npm run db:migrate
npm run db:migrate -- --test
npm run db:seed
npm test
```

Tests reset and seed the test database automatically. The reset helper verifies
that the URL names a separate database ending in `_test` and that the supplied
pool actually connects to it before truncating application tables.
Do not use a shared database containing valuable data as `TEST_DATABASE_URL`.

## Run the API

```powershell
npm run dev
```

Or run without nodemon using `npm start`. In another PowerShell window:

```powershell
Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json -Depth 3
```

Expected response: `{ "data": { "status": "ok" } }`. Press Ctrl+C to stop the API.
Use the frontend below to log in and join a queue. F-03
([PR #14](https://github.com/PpAnpt/dineq/pull/14)) is now merged into staging
at `64cfaf1` and integrated into the Sprint 1 baseline, so Host operations run from
this checkout without a separate backend worktree.

## Run the Sprint 1 client (P6)

Run `npm ci` at the root after pulling this branch; `client/` is an npm workspace.
The client follows the [React](https://react.dev/learn/creating-a-react-app) and
[Vite](https://vite.dev/guide/) setup and uses plain CSS with no UI library.
Set these values in the root `.env` (keep your existing database URLs/password):

```dotenv
PORT=3000
APP_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
```

From the repository root, in PowerShell window 1:

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

From the same root, in PowerShell window 2:

```powershell
npm run dev:client
```

Open **http://localhost:5173/login**. Use `localhost` consistently, including in
`APP_ORIGIN`; `127.0.0.1` is a different origin. Vite uses port 5173 with
`strictPort` and proxies `/api` to `http://localhost:3000`, preserving the browser
Origin and same-origin HttpOnly Cookie. API port 3000 is the proxy target; change
`client/vite.config.js` too if you choose a different API port. No password, user
identity or role is saved in browser storage. Login sends credentials, then
`/auth/me` supplies the role; Host navigation uses the assigned queue's `id` from
`/queues`, never its restaurant ID. Full-page links support direct URLs/reload
and browser Back/Forward via Vite's SPA fallback.

Build the client with:

```powershell
npm run build:client
```

This writes ignored `client/dist/`; serving a production build is outside this
local Sprint 1 setup.

If the page shows `Unable to check session` with `502`, the UI has loaded but
the API request is failing through the proxy. Keep the API process running as
well as Vite, and start PostgreSQL before starting the API. For this workspace's
isolated instance, use the `pg_ctl` command in the local database section below.
Check both addresses from PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health | ConvertTo-Json -Compress
Invoke-RestMethod http://localhost:5173/api/health | ConvertTo-Json -Compress
```

Both should return `{"data":{"status":"ok"}}`. An anonymous request to
`/api/auth/me` should return 401; the client handles that by showing Login.
After restoring API/DB connectivity, click Retry or reload the page. A 502 is
not a normal signed-out state.

Run the three UI review regressions with Vite running and Google Chrome
installed (headless, API response fixtures, no database writes):

```powershell
npm run test:review --workspace=client
```

They check refreshed Host state after both 409 conflicts and the CLOSED queue
explanation. They are separate from the real-DB API suite (`npm test`) and the
Playwright E2E journeys below.

### E2E journeys (Playwright, Chromium)

One-time install of the browser (Windows PowerShell, repo root):

```powershell
npm install
npx playwright install chromium
```

Run (starts the API on the **test** database and the Vite client itself, resets and
seeds `TEST_DATABASE_URL` before every test, writes screenshots to
`docs/evidence/screenshots/DEMO-0X-step-N.png`):

```powershell
npm run test:e2e
```

E2E starts a separate API on 3100 and Vite on 5273. Override them with
`$env:E2E_API_PORT="3200"` and `$env:E2E_WEB_PORT="5373"` before running
`npm run test:e2e`. The proxy and allowed Origin follow these values. The suite
refuses to reuse existing servers, so it can never hit the
dev database. Record a run on a clean tree with
`npm run test:e2e:record -- <label>` (writes `docs/evidence/<label>.txt/.json`).

DEMO-01:

1. Use two separate browser profiles (or a normal window and an InPrivate window)
   so the Customer and Host have separate session Cookies.
2. Log in as `customer01@dineq.test` with your local `SEED_DEMO_PASSWORD`.
   On `/queues`, choose party size 4 and Join. `/my-queue` shows a WAITING ticket.
3. Log in as `host1@dineq.test` in the other profile. Login opens its assigned
   `/host/queues/:queueId`. Call Next shows CALLED; Complete shows COMPLETED.
4. Click Refresh on the Customer's `/my-queue`; that same ticket now says COMPLETED.
5. Logout revokes the session. `host2@dineq.test` has no assigned queue and sees
   that empty state.

All accounts use the local seed password. Re-seeding preserves entries; if the
dev queue already has a CALLED ticket, complete it before running the demo.
Do not reset a development database to run tests; tests use `TEST_DATABASE_URL`.

P6 verification is recorded in `docs/evidence/p6-browser-check.txt` and
`docs/evidence/p6-screenshots/`. Desktop browser control was unavailable, so this
was an automated headless Chromium walkthrough against the seeded dev DB,
**not a manual walkthrough**. Since F-03 was still open, its backend ran from an
isolated worktree at `0867b8ca9924c211d467358815c366b773fa06de`; the UI branch
itself starts from staging `facb223759e69c7d79929d138561e51d50866770`.
That original verification preceded the merge of PR #14. The current baseline
now includes it; review follow-up results are recorded separately. UI-only empty,
CLOSED and error response fixtures are identified separately in the transcript;
the DEMO-01 journey, authentication and conflict checks used real API/DB data.

## F-01 authentication and role protection

| Method / endpoint | Behavior |
| --- | --- |
| `POST /api/auth/login` | Public; send `{ email, password }`; returns `{ data: { id, email, role } }` and the `dineq_session` Cookie |
| `GET /api/auth/me` | Returns the current session user's identity and server-stored role |
| `POST /api/auth/logout` | Revokes the current session in PostgreSQL, clears the Cookie and returns 204 |

Passwords are verified with Argon2id. Login generates a new 32-byte random token;
only its SHA-256 hash is stored in `sessions`, with server-enforced expiry from
`SESSION_TTL_SECONDS`. The Cookie is HttpOnly, SameSite=Lax and Secure when
`COOKIE_SECURE=true`. Missing, unknown, expired, revoked or inactive-user sessions
are rejected with `401 UNAUTHENTICATED`. Invalid credentials return the same
`401 INVALID_CREDENTIALS` for an unknown email, wrong password or inactive account.

For `/api`, Origin checks run before Session checks; protected endpoints check
Session and endpoint Role before parsing JSON. Only Login and Health are public.
Mutating requests with an Origin Header different from `APP_ORIGIN` return
`403 ORIGIN_NOT_ALLOWED`; an absent Header is allowed. Identity and Role never
come from client-supplied body, query or identity headers.

The Host-only list, call-next and complete routes enforce the HOST Role.
Customers receive `403 FORBIDDEN` even with malformed JSON or an invalid path
UUID. F-03 now supplies assignment checks, FIFO Call Next and Complete.

## Database scripts and demo accounts

Root npm workspaces include `server/`, `database/` and `client/`. Each declares its own
dependencies, with one root `package-lock.json`; run `npm ci` once at the root.
ESM imports and `.env`/migration paths resolve relative to their modules, so the
scripts also work from the corresponding workspace on Windows.

Migrations apply sorted `.sql` files inside a transaction, serialize concurrent
runners with a PostgreSQL advisory lock and record filenames in `schema_migrations`.
Rerunning an applied migration does nothing. Add a new migration for future schema
changes instead of editing already-applied SQL.

Seed provides `customer01@dineq.test` through `customer30@dineq.test`,
`host1@dineq.test` assigned to the demo queue, and unassigned `host2@dineq.test`.
All use the password you chose in `SEED_DEMO_PASSWORD`. Re-seeding refreshes their
password hashes and preserves existing IDs, queue status, tickets and counters.
It adds one synthetic restaurant and one OPEN queue on an empty database.

Test helpers in `server/tests/helpers/index.js` expose `resetAndSeed()`,
`createTestApp()`, `getTestPool()`, `closeTestPool()` and `loginAs(email)`.
`loginAs` calls the real F-01 login API and returns the session Cookie; it does not
bypass authentication. Test files run
serially because they share a resettable test database; a test can still issue
30 concurrent requests through the test pool (maximum 40 connections).

## Record test evidence

Commit source/config changes first, then run:

```powershell
$recordLabel = 'local-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
npm run test:record -- $recordLabel
```

This creates `docs/evidence/<label>.txt` (command, tested commit SHA, ISO time,
Node version, full stdout/stderr, exit code) and `<label>.json` (Vitest report).
The recorder rejects changes outside `docs/evidence`, invalid labels and existing
labels, and returns the actual test exit code. Use a fresh label for another run.
Commit evidence separately from the code it tests. Labels already committed in
`docs/evidence` (for example `p2-infra-green`) cannot be reused, even in a fresh
clone. The timestamp above creates a new label; wait a second or choose another
label if you run it twice within the same second. `INFRA-*` smoke tests verify
infrastructure only; feature AC results are mapped to the actual feature tests
and recorded source commit in `docs/sprints/sprint-1/test-spec.md`.

## Local database instance in this workspace

This working copy has an isolated PostgreSQL 18 instance under ignored
`.local/postgres`, listening on `127.0.0.1:55432`, with both databases already
created. Its randomly generated database and demo credentials are in the ignored
`.env`; the example file uses the standard port 5432 for other installations.
The local data directory and `.env` are machine-specific and are not included in a clone.

To restart this instance after reboot, from this repository root:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$pgData = Join-Path (Get-Location) '.local\postgres'
$pgLog = Join-Path (Get-Location) '.local\postgres.log'
& "$pgBin\pg_ctl.exe" -D $pgData -l $pgLog -o '-p 55432 -h 127.0.0.1' -w start
```

To stop it after stopping the API:

```powershell
& "$pgBin\pg_ctl.exe" -D $pgData -m fast -w stop
```

## Revision History

| Version | Date | Change |
| --- | --- | --- |
| v0.2 | 2026-11-06 | Add Windows P2 setup, database/seed/test commands and evidence workflow after merged P1 |
| v0.3 | 2026-11-06 | Document F-01 authentication, session lifecycle, middleware order and temporary Host handlers after merged P2 |
| v0.4 | 2026-11-07 | Add P6 client setup, proxy/Cookie behavior, browser demo steps and explicit unmerged F-03 verification dependency |
| v0.5 | 2026-11-07 | Integrate merged F-03, document 502/API/DB startup diagnosis and UI review regression command |
| v0.6 | 2026-11-07 | P8 fresh-clone check: fix the existing-label recording example and clarify baseline/evidence wording |
