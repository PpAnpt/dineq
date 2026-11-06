# DineQ

Restaurant walk-in queue management (CPE334 Theme 9)

Sprint 1 infrastructure: Express API, PostgreSQL migrations/seed and Vitest + Supertest.
P1 contracts were merged in [PR #1](https://github.com/PpAnpt/dineq/pull/1)
at `2d87368346ff18b5aabf06e5346c1142740c63a2` before the P2 implementation.

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
Only the health endpoint is implemented in P2. Authentication, queue operations
and frontend screens belong to the later feature PRs.

## Database scripts and demo accounts

Root npm workspaces include `server/` and `database/`. Each declares its own
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
`loginAs` calls the real login API and returns the session Cookie after F-01 is
implemented; P2 does not implement or bypass authentication. Test files run
serially because they share a resettable test database; a test can still issue
30 concurrent requests through the test pool (maximum 40 connections).

## Record test evidence

Commit source/config changes first, then run:

```powershell
npm run test:record -- p2-infra-green
```

This creates `docs/evidence/<label>.txt` (command, tested commit SHA, ISO time,
Node version, full stdout/stderr, exit code) and `<label>.json` (Vitest report).
The recorder rejects changes outside `docs/evidence`, invalid labels and existing
labels, and returns the actual test exit code. Use a fresh label for another run.
Commit evidence separately from the code it tests. `INFRA-*` smoke tests are not
evidence that F-01/F-02/F-03 acceptance criteria have passed; those remain PLANNED.

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
