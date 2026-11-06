# DineQ — rules for AI agents (CLAUDE.md)

Reply to the user in **Thai**. Code, identifiers, commit messages and docs stay in English (Thai is fine inside existing Thai docs).

## Project
CPE334 group project, Theme 9 "Queue and Service Management" (restaurant walk-in queue, name DineQ). Pair of two students.
**Current target: Deliverable 1 = Sprint 1 only**, due **2026-11-08 23:59 (Asia/Bangkok)**. AI assists; the two students own correctness and must be able to explain everything.
Sprint 1 = F-01 Auth & roles, F-02 Customer joins queue, F-03 Host FIFO call-next + complete.
Out of scope now: cancel, no-show, tables, multiple queues, reports, Docker/CI/GCP (Lab 5). Do not build them.

## Source of truth (read before coding)
- `docs/srs.md`, `docs/features.md`, `docs/traceability.md`, `docs/system-sds.md`, `docs/sprints/plan.md`
- `docs/sprints/sprint-1/F-01-auth.md`, `F-02-join-queue.md`, `F-03-host-queue.md`, `test-spec.md`
- `docs/reference/*.md` — course rules (read-only)
Implement only what a contract says. If a contract is wrong or silent on something you need: **stop, propose the doc change, wait for my OK, commit the doc change first** (with a Revision History row), then implement. Never silently change specs or rewrite history.

## Stack and layout
Node 20+ (ESM), Express, `pg` (no ORM, plain SQL), PostgreSQL 15+, `argon2` (Argon2id), `cookie-parser`, Vitest + Supertest; client = React + Vite (+ Playwright for a few E2E journeys).
```
server/src/{app.js,server.js,config.js,db/,middleware/,routes/,services/}   server/tests/   server/scripts/
database/{migrations/*.sql,migrate.js,seed/}     client/     docs/     docs/evidence/
```
- `createApp({ pool })` factory (tests and restart test build their own instances).
- One route file + one service file per feature; `routes/index.js` registers them (keeps parallel PRs conflict-free).
- JSON: camelCase. DB: snake_case, UUID primary keys (`gen_random_uuid()`), `timestamptz`.
- Success `{ "data": ... }`, failure `{ "error": { "code": "...", "message": "..." } }`. Never leak private data in 401/403. 404 is `NOT_FOUND` for a missing Queue/Entry, or `NO_WAITING_ENTRY` when an authorized Call Next has no WAITING entry and no unresolved CALLED entry. Ownership/assignment violations on existing resources are 403 (per AC-11/19). Follow the endpoint-specific check order in `docs/system-sds.md` C.6.3; public Login does not require a session.
- Security: Argon2id hashes; session token = 32 random bytes, only its SHA-256 stored; HttpOnly cookie `dineq_session` (SameSite=Lax, Secure via `COOKIE_SECURE`); user id / role / ticket number are **never** taken from the client; Origin check on mutating requests.
- Business rules are enforced in the backend **and** the DB (constraints, transactions with `SELECT ... FOR UPDATE` on the queue row). Map PG unique violations (`23505`) to the documented 409 codes.
- Config only via env vars (`.env.example` lists them). No secrets or real passwords in git, docs or logs. Seed password comes from `SEED_DEMO_PASSWORD`.

## Git rules (course workflow — evidence depends on it)
- Never commit or push to `main`. Never force-push. Never rewrite pushed history. Don't change git identity/config.
- Branch from `sprint-1-staging`: `feature/f-0X-name`, `docs/...`, `chore/...`. Small conventional commits (`feat(F-02): ...`, `test(F-02): ...`, `docs: ...`). You may push your feature branch; I open the PR and my teammate reviews. **You never approve or merge PRs.**
- Spec/contract/test-design commits come **before** the implementation they describe.

## TDD and test integrity
1. Write the tests from `test-spec.md` first. Name them `TEST-xx / AC-yy: <behaviour>`.
2. Run them; they must fail **for the intended reason** (missing behaviour), not typos/imports. Commit tests, then record the run: `npm run test:record -- <label>` (clean tree only) → `docs/evidence/<label>.txt`, commit that separately.
3. Implement, run again, record the green run the same way.
4. **Never** weaken, delete, skip or loosen an assertion to get green. If a test looks wrong, stop and tell me why.
5. Never claim "tests pass" without running them. Quote real output (counts, failures). In `traceability.md`/`test-spec.md` only change PLANNED to PASS/FAIL/SKIPPED with a recorded run and commit SHA.
6. Tests hit a real PostgreSQL (`TEST_DATABASE_URL`), not mocks, for persistence/permission/concurrency.

## Working agreements
- Shell is Windows PowerShell: use npm scripts and cross-platform commands; no bash-only syntax in instructions.
- Keep changes bounded to the task/Issue. Show me the diff summary and real test output at the end of every task.
- Append a line to `docs/ai-use-log.md` after each task.
- If anything is ambiguous and affects a contract: ask (one concise question) instead of guessing.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.3 | 2026-11-06 | Align 404 guidance and public-login/check-order rules with the PR #1 contract fixes |
