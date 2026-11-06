# DineQ — Sprint 1 prompt pack (Claude in Antigravity)

ใช้ทีละข้อตามลำดับ **เปิดแชตใหม่ต่อ 1 prompt** (ทุก prompt สั่งให้อ่าน `CLAUDE.md` เองอยู่แล้ว) แล้วคัดลอกเฉพาะข้อความในกล่อง ```` ``` ````
ก่อนเริ่มทุกครั้ง: `git status` ต้องสะอาด และอยู่บน branch ที่ prompt ระบุ

ปรับตาม PR #1 review (v0.3): P3–P6 ใช้ Queue JSON และลำดับตรวจใน SDS C.6.1/C.6.3; P4 ต้องรวม TEST-23 และ P5 ต้องรวม TEST-24a..d โดยคง AC/TEST เดิมทั้งหมด

## วิธีทำงานต่อ 1 prompt

1. วาง prompt → ดู diff และ **ผลรัน test จริง** ก่อนยอมรับ (อย่าเชื่อแค่ข้อความสรุปของ AI)
2. Agent push branch ให้ → คุณเปิด PR เข้า `sprint-1-staging` → **เพื่อนอีกคน** review (comment เฉพาะเจาะจง) → merge
3. `git checkout sprint-1-staging; git pull` แล้วค่อยไป prompt ถัดไป

PR ใคร = อีกคนเป็น reviewer (ผู้เขียนห้าม approve เอง) ใช้ prompt PR-R ช่วยเพื่อนหาจุดตรวจได้ แต่ comment ต้องเขียนเองด้วยคำของตัวเอง

## แผนเวลา (ส่ง อา. 8 พ.ย. 23:59 — เป้าส่งจริง 20:00)

| วัน | งาน |
| :---- | :---- |
| ศ. 6 พ.ย. | P0 → P1 (PR spec) → P2 (PR scaffold) + สร้าง Issues + เชิญเพื่อน |
| ส. 7 พ.ย. | P3 F-01 → หลัง merge แล้ว **แยกกัน**: คนที่ 1 ทำ P4 (F-02), คนที่ 2 ทำ P5 (F-03) พร้อมกันได้ (F-03 ใช้ SQL helper สร้างคิวใน test ไม่ต้องรอ F-02) |
| อา. 8 พ.ย. เช้า | P6 UI → P7 E2E (ถ้าช้า ตัดเหลือ DEMO-01 เส้นเดียว) |
| อา. 8 พ.ย. บ่าย | P8 release prep → merge release PR → tag → P9 evidence → เติม Part F → export PDF |

ถ้าถึง อา. 10:00 ยังไม่ได้เริ่ม UI ให้ทำ UI เรียบที่สุด (login, join, my-queue, host) และข้าม E2E ที่เหลือ — backend + test คือคะแนนหลัก

---

## P0 — ตรวจสภาพแวดล้อมและช่องโหว่ของ spec (อ่านอย่างเดียว)

Branch: `sprint-1-staging`

````text
Read CLAUDE.md, then docs/srs.md, docs/system-sds.md, docs/sprints/sprint-1/*.md and docs/reference/*.md. Do NOT create or modify any file in this task.

1. Environment (Windows PowerShell): run node --version, npm --version, git --version, git branch --show-current, git status, git log --oneline -10, docker --version, psql --version. Check whether a PostgreSQL 15+ server is reachable; if you cannot tell, ask me for connection details.
2. Confirm I am on sprint-1-staging and that every doc listed in CLAUDE.md exists and is committed. If not, tell me exactly what is missing.
3. Report: (a) contradictions or gaps between srs / system-sds / contracts / test-spec, (b) details you would need to implement but are not defined (error codes, response shapes, id types, how a Host learns its queue id, etc.), (c) top risks for the 2026-11-08 23:59 deadline.
4. Recommend the simplest local PostgreSQL setup for me (Docker container vs installed Postgres) with copy-paste PowerShell commands, including creating two databases: dineq_dev and dineq_test.

Answer in Thai. Environment as a short table; gaps as bullet lists.
````

---

## P1 — แก้ spec ก่อนเขียนโค้ด (เอกสารล้วน)

Branch: `docs/spec-revision-1` จาก `sprint-1-staging` → PR เข้า staging (ให้เพื่อน review ด้วย เพราะเป็นหลักฐาน DoD-02)

````text
Read CLAUDE.md, then the docs it lists. Create branch docs/spec-revision-1 from sprint-1-staging. Docs only — no code.

Goal: close the spec gaps BEFORE implementation so the history shows spec first. First show me the full diff and WAIT for my OK; then commit.

Proposed changes (adjust if P0-style findings show better wording, but keep scope small):
1. docs/traceability.md: add/fix rows — NFR-02 -> new AC-21/TEST-21; FR-16 -> AC-08, AC-15, AC-17 (events); FR-15 (Sprint 1 part) -> AC-12 + UI states; NFR-06 -> AC-02/05/06/09/11/12/16/18; BR-03 also covers AC-13. Keep all statuses PLANNED.
2. New AC-21/TEST-21 (add to F-02 contract + test-spec.md): after creating a fresh app instance with a new DB pool, a previously created ticket and its JOINED event are still retrievable (restart persistence). New AC-22/TEST-22 (add to F-01 contract + test-spec.md): a mutating request with a foreign Origin header -> 403 ORIGIN_NOT_ALLOWED and no DB change.
3. docs/system-sds.md: add an error-code catalog under C.6 — 400 VALIDATION_ERROR, INVALID_PARTY_SIZE; 401 UNAUTHENTICATED, INVALID_CREDENTIALS; 403 FORBIDDEN, ORIGIN_NOT_ALLOWED; 404 NOT_FOUND, NO_WAITING_ENTRY; 409 DUPLICATE_ACTIVE, QUEUE_CLOSED, UNRESOLVED_CALLED, INVALID_TRANSITION. Add: primary keys are UUID (gen_random_uuid()), timestamps are timestamptz; seed accounts customer01..customer30@dineq.test, host1@dineq.test (assigned), host2@dineq.test (unassigned) with the password taken from SEED_DEMO_PASSWORD (never committed); GET /api/queues includes isAssigned (boolean, true only for the Host assigned to that queue) so the Host UI can find its queue; ticket JSON fields: id, queueId, ticketNo, partySize, status, createdAt, calledAt, completedAt.
4. Append a Revision History row (v0.2, today's date, one-line reason) to every file you touch.

Commit message: "docs: spec revision 1 - close traceability gaps, add AC-21/22 and error catalog". Print the SHA.
Also write docs/sprints/sprint-1/issues-draft.md: ready-to-paste GitHub Issue titles + bodies for F-01, F-02, F-03 (link the contract file, list AC IDs and linked FR/BR/NFR, DoD checklist, assignee placeholder). Commit it separately ("docs: add Sprint 1 issue drafts").
Append to docs/ai-use-log.md. Push the branch and give me PR title/body.
````

หลัง merge: เปิด GitHub Issues 3 อันจาก `issues-draft.md` + Project board (Todo / In progress / Review / Done) และต้อง **เติม AC-21/22 ใน Google Doc Part E/F ด้วย** ให้ตรงกับ repo

---

## P2 — Scaffold: server + DB + test harness

Branch: `feature/scaffold-db` จาก `sprint-1-staging` (หลัง P1 merge)

````text
Read CLAUDE.md, docs/system-sds.md (C.1–C.3, C.7) and docs/sprints/sprint-1/test-spec.md. Run: git checkout sprint-1-staging; git pull; git checkout -b feature/scaffold-db.

Build INFRASTRUCTURE ONLY — no business logic yet.
1. server/: package.json (type: module; deps express, pg, argon2, cookie-parser, dotenv; dev deps vitest, supertest, nodemon), src/config.js (fail fast if DATABASE_URL is missing), src/db/pool.js, src/app.js exporting createApp({ pool }), src/server.js, src/middleware/errorHandler.js (response shape { error: { code, message } }), routes/index.js, GET /api/health.
2. database/migrations/001_init.sql implementing system-sds C.2 exactly: all tables, FKs, UNIQUE(queue_id, ticket_no), partial unique (queue_id, customer_id) WHERE status IN ('WAITING','CALLED'), partial unique (queue_id) WHERE status = 'CALLED', CHECK party_size BETWEEN 1 AND 8, CHECK on status values and next_ticket_no >= 1. database/migrate.js: applies *.sql in order, records them in schema_migrations, idempotent.
3. database/seed/: seedData.js (idempotent seed(client, passwordHash)) + seed.js CLI. Seed 1 restaurant, 1 OPEN queue, 30 customers, host1 (assigned), host2 (unassigned) as defined in system-sds. Demo password only from SEED_DEMO_PASSWORD (fail if unset). database/ scripts must be able to import their dependencies on Windows — pick the simplest approach (e.g. database/package.json) and tell me.
4. Update .env.example (DATABASE_URL, TEST_DATABASE_URL, PORT, APP_ORIGIN, SESSION_TTL_SECONDS, NODE_ENV, COOKIE_SECURE, SEED_DEMO_PASSWORD with placeholder values only). Verify .env is git-ignored.
5. Test harness: Vitest config; server/tests/helpers/ with resetAndSeed() against TEST_DATABASE_URL (hash the demo password once and reuse), createTestApp(), loginAs(email) returning the session cookie. Smoke tests: GET /api/health = 200; after migrate, expected tables, the two partial unique indexes and the CHECK constraints exist (query pg_indexes / information_schema).
6. server/scripts/record-test-run.js <label>: refuse to run if `git status --porcelain` shows changes outside docs/evidence; otherwise run the tests, write docs/evidence/<label>.txt (header: command, full `git rev-parse HEAD`, ISO date, node version; then full output) and docs/evidence/<label>.json (vitest JSON reporter); exit with the test exit code.
7. npm scripts: dev, test, test:record, db:migrate, db:seed.
8. Root README.md: prerequisites, setup (.env, create DBs, migrate, seed, run, test) written for Windows PowerShell.

Commit in small steps (chore(server) scaffold / feat(db) migration / feat(db) seed / test(infra) harness / docs README). Then actually run: db:migrate on dev and test DBs, db:seed, npm test — show real output. Append to docs/ai-use-log.md. Push the branch and give me PR title/body.
````

---

## P3 — F-01 Authentication (Red → Green)

Branch: `feature/f-01-auth` จาก `sprint-1-staging` (หลัง P2 merge)

````text
Read CLAUDE.md, docs/sprints/sprint-1/F-01-auth.md, test-spec.md (F-01 + AC-22), docs/system-sds.md (C.4, C.6, C.7). Run: git checkout sprint-1-staging; git pull; git checkout -b feature/f-01-auth.

Follow C.6.3: Login is public and succeeds without an existing Cookie; protected routes check Session and endpoint Role before UUID validation or Resource lookup.

PHASE RED
- Write server/tests/f01-auth.test.js for TEST-01..06 and TEST-22 exactly as the STS describes (names start with "TEST-xx / AC-yy:"). Cover: Customer and Host valid login, wrong password and unknown email (same 401 INVALID_CREDENTIALS), /auth/me, expired session (set sessions.expires_at in the past directly in the DB) -> 401, logout then reuse of the old cookie -> 401 and revoked_at set, anonymous call to protected endpoints -> 401 with no private data, Customer calling a Host-only endpoint -> 403 with no DB change, foreign Origin -> 403 ORIGIN_NOT_ALLOWED.
- TEST-01 must send no existing Session Cookie; TEST-05 must include a protected path with `not-a-uuid` and still receive 401 UNAUTHENTICATED before parameter validation.
- Also assert the token is not stored in plain text (only its hash) and password_hash starts with $argon2id$.
- Run them; confirm they fail because the behaviour is missing (not typos/imports). Commit: "test(F-01): add failing tests for AC-01..06, AC-22 (red)". Then npm run test:record -- f01-red on the clean tree and commit docs/evidence separately.

PHASE GREEN
- Implement: auth service (argon2.verify), session creation (32 random bytes, store SHA-256 only, expires_at from SESSION_TTL_SECONDS), cookie dineq_session (HttpOnly, SameSite=Lax, Secure via COOKIE_SECURE), auth middleware (load user from session; reject expired / revoked / inactive), requireRole(role), Origin check for POST/PUT/PATCH/DELETE (reject only if an Origin header is present and != APP_ORIGIN), routes POST /api/auth/login, POST /api/auth/logout (204, revoke), GET /api/auth/me.
- Mount a global auth guard on /api/* (except /api/auth/login and /api/health) and role guards on the Host-only routes from the contract (GET /api/queues/:queueId/entries, POST /api/queues/:queueId/call-next, POST /api/entries/:entryId/complete) with placeholder handlers returning 501 NOT_IMPLEMENTED — F-03 will replace the handlers. Never read user id/role from body, query or headers.
- All F-01 tests green; do not edit tests except genuine test bugs (list each one and why). Commit "feat(F-01): ...", then test:record -- f01-green, commit evidence separately.

End: table AC -> test -> result taken from the real output, the 4 commit SHAs (tests, red evidence, implementation, green evidence), PR title/body. No frontend work. Append to docs/ai-use-log.md and push.
````

---

## P4 — F-02 Join queue (Red → Green, TDD showcase = TEST-09 / BR-02)

Branch: `feature/f-02-join-queue` จาก `sprint-1-staging` (หลัง F-01 merge)

````text
Read CLAUDE.md, docs/sprints/sprint-1/F-02-join-queue.md, test-spec.md (F-02 including AC-21/23), docs/system-sds.md (C.2, C.3 Join Transaction, C.6 including C.6.1/C.6.3). Run: git checkout sprint-1-staging; git pull; git checkout -b feature/f-02-join-queue.

PHASE RED (all F-02 tests)
- server/tests/f02-join.test.js for TEST-07..13, TEST-21 and TEST-23:
  07 queue list (restaurant, queue, OPEN/CLOSED, isAssigned); 08 join with partySize=4 -> 201 WAITING, ticketNo/partySize correct, JOINED event row, retrievable via GET; 09 duplicate active join -> 409 DUPLICATE_ACTIVE and still exactly one active entry; 10 concurrency: 30 different customers join at once (Promise.all, pool large enough) -> 30 x 201, distinct ticketNo 1..30, 30 rows, next_ticket_no = 31; 11 Customer A reads B's ticket -> 403, response contains none of B's data; 12 CLOSED queue -> 409 QUEUE_CLOSED, and partySize 0, 9, 1.5, "abc", null, missing -> 400 INVALID_PARTY_SIZE, each time zero new entries/events and next_ticket_no unchanged; 13 Host calls join -> 403, no ticket; 21 restart persistence via a fresh createApp + new pool.
- Extend TEST-07 to assert the full C.6.1 shape (`data` array, `id`, `restaurant: { id, name }`, `status`, boolean `isAssigned`): assigned Host gets true for its queue, Customer and unassigned Host get false. Also cover a fresh fixture with no queues -> `{ "data": [] }`.
- TEST-23 / AC-23: as a logged-in Customer, GET /api/entries/:entryId and POST /api/queues/:queueId/entries with partySize=4 using `not-a-uuid` -> 400 VALIDATION_ERROR, then valid UUIDs confirmed absent in the DB -> 404 NOT_FOUND; repeat without a Session -> 401 UNAUTHENTICATED. Assert error shape and no new entries/events or counter changes. Keep TEST-11's existing-other-owner -> 403 assertions.
- Run, confirm red for the right reason, commit "test(F-02): add failing tests for AC-07..13, AC-21/23 (red)", test:record -- f02-red, commit evidence.

PHASE GREEN in two stages so TEST-09 has a genuine red->green interval:
- Implement queue-list fields exactly as C.6.1; apply C.6.3 ordering (Session -> endpoint Role -> UUID -> Resource -> ownership/assignment -> body -> business rules), with 404 NOT_FOUND for absent queue/entry.
- Stage 1: implement GET /api/queues, GET /api/me/entries, GET /api/entries/:entryId (owner or assigned Host) and the join transaction exactly as C.3 (BEGIN, SELECT ... FOR UPDATE on the queue, check OPEN, Customer role, partySize integer 1..8, take next_ticket_no, insert WAITING entry, increment counter, insert JOINED event, COMMIT; ROLLBACK on any failure) but WITHOUT the explicit duplicate-active pre-check and WITHOUT mapping the unique-violation error. Run everything. Report honestly which tests pass and the ACTUAL failure of TEST-09 (do not fake or guess it). Commit "feat(F-02): join queue transaction (duplicate rule pending)", then test:record -- f02-tdd-br02-red, commit evidence.
- Stage 2: add the duplicate-active pre-check inside the transaction and map PG error 23505 to 409 DUPLICATE_ACTIVE (also covers the race). Run everything -> all F-02 tests green. Commit "feat(F-02): enforce one active ticket per customer (BR-02)", then test:record -- f02-tdd-br02-green and commit evidence.
- Rules: no test edits to get green (list any genuine test bug and why). If you need an API field/shape that the contract lacks, stop and propose a contract revision first.

End: AC -> test -> result table from real output, all commit SHAs, PR title/body. Append to docs/ai-use-log.md and push.
````

---

## P5 — F-03 Host FIFO call + complete (Red → Green) — ทำขนานกับ P4 ได้

Branch: `feature/f-03-host-queue` จาก `sprint-1-staging` (หลัง F-01 merge)

````text
Read CLAUDE.md, docs/sprints/sprint-1/F-03-host-queue.md, test-spec.md (F-03), docs/system-sds.md (C.3 Call Next / Complete, C.4, C.6). Run: git checkout sprint-1-staging; git pull; git checkout -b feature/f-03-host-queue. Do not depend on F-02 code: in tests create WAITING entries (and their events) directly via SQL helpers (server/tests/helpers/, add a new file to avoid merge conflicts with the F-02 branch).

PHASE RED
- server/tests/f03-host.test.js for TEST-14..20 and TEST-24a..d:
  14 Assigned Host lists WAITING/CALLED in FIFO order with ticketNo/partySize/status (no customer email/private data); Unassigned Host -> 403; 15 with WAITING 1 and 2, Call Next -> ticket 1 CALLED with called_at + CALLED event, ticket 2 still WAITING; 16 CALLED already exists -> 409 UNRESOLVED_CALLED, nobody new is CALLED (plus TEST-16b: two simultaneous Call Next requests -> exactly one 200 and one 409, exactly one CALLED row); 17 Complete a CALLED ticket -> COMPLETED + completed_at + COMPLETED event in DB, owner Customer sees it via GET; 18 Complete a WAITING or COMPLETED ticket -> 409 INVALID_TRANSITION, row and events unchanged; 19 Unassigned Host list / call-next / complete -> 403 and DB unchanged; 20 Customer calls call-next / complete -> 403 and DB unchanged. Also: Call Next with neither WAITING nor CALLED -> 404 NO_WAITING_ENTRY (TEST-24a).
- TEST-24 / AC-24: (a) existing assigned queue with neither WAITING nor CALLED -> 404 NO_WAITING_ENTRY; (b) valid UUIDs confirmed absent in DB for list/call-next/complete -> 404 NOT_FOUND; (c) the same three endpoints with `not-a-uuid` as Host -> 400 VALIDATION_ERROR; (d) repeat (b)/(c) as anonymous -> 401 UNAUTHENTICATED and as Customer -> 403 FORBIDDEN before UUID/resource checks. Assert error shape and unchanged rows/events/counters. A CALLED entry with no WAITING still returns 409 UNRESOLVED_CALLED under TEST-16.
- Run, confirm red for the right reason, commit "test(F-03): add failing tests for AC-14..20, AC-24 (red)", test:record -- f03-red, commit evidence.

PHASE GREEN
- Follow SDS C.6.3 for all Host endpoints: Session -> Host Role -> UUID validation -> Resource lookup (404 NOT_FOUND) -> Assignment -> business rules. Do not treat a missing Resource as an assignment failure.
- Replace the F-01 placeholder (501) handlers with real ones. Call Next per C.3: BEGIN, lock the queue row FOR UPDATE, verify Host assignment (403), reject if a CALLED entry exists (409; also map the partial-unique violation), pick the WAITING entry with the lowest ticket_no (404 if none), set CALLED + called_at, insert CALLED event, COMMIT. Complete: lock the entry, verify the Host is assigned to its queue (403), require status CALLED (else 409 INVALID_TRANSITION), set COMPLETED + completed_at, insert event in the same transaction. Never trust a queue/customer id from the client body.
- No test edits to get green. Commit "feat(F-03): ...", test:record -- f03-green, commit evidence.

End: AC -> test -> result table from real output, commit SHAs, PR title/body. Append to docs/ai-use-log.md and push.
````

---

## P6 — UI ขั้นต่ำ 4 หน้า

Branch: `feature/ui-sprint-1` (หลัง F-01..F-03 merge ครบ)

````text
Read CLAUDE.md, docs/system-sds.md (C.5 screens, C.6 API) and the three F-0x contracts. Run: git checkout sprint-1-staging; git pull; git checkout -b feature/ui-sprint-1.

Build the minimal React + Vite client in client/ (plain CSS, no UI library, no polish beyond being clear):
- Vite dev server on :5173 with a proxy of /api to the API (so cookies are same-origin; APP_ORIGIN = http://localhost:5173). Document it in README.
- Pages: /login; /queues (Customer: queue list OPEN/CLOSED, partySize input 1..8, Join button); /my-queue (ticket no., partySize, status WAITING/CALLED/COMPLETED, empty state, Refresh button); /host/queues/:queueId (Waiting list in FIFO order, currently CALLED, Call Next, Complete).
- After login call GET /api/auth/me and route by the server-provided role (Customer -> /queues, Host -> its queue found via isAssigned). Logout button. The UI must never send user id or role; client-side hiding is only UX, the backend already enforces permissions.
- Read the queue list from `response.data`; each item has `id`, `restaurant: { id, name }`, `status`, `isAssigned` per SDS C.6.1. Use the item's `id` as `queueId` for Join and Host navigation.
- Every page handles loading, empty and error states and shows the server's error message/code (e.g. DUPLICATE_ACTIVE, QUEUE_CLOSED, INVALID_PARTY_SIZE, UNRESOLVED_CALLED, 403). Fully keyboard-usable: labels on inputs, Enter submits, visible focus, buttons are real <button>s. Add data-testid on key elements for E2E.
- If you need an API field or behaviour that is not in the contracts: stop and propose a contract revision first.

Run the UI against the seeded dev DB and walk through DEMO-01 by hand (customer01 joins partySize 4, host1 calls next, completes, customer refreshes). Give me the exact commands to start API + client. Small commits (feat(ui): ...). Append to docs/ai-use-log.md, push, PR title/body.
````

---

## P7 — E2E เฉพาะเส้นหลัก + screenshot หลักฐาน

Branch: `test/e2e-sprint-1` (หลัง P6 merge)

````text
Read CLAUDE.md, docs/sprints/sprint-1/test-spec.md and docs/reference/project_deliverable_1.md section 4.2. Run: git checkout sprint-1-staging; git pull; git checkout -b test/e2e-sprint-1.

Add a SMALL Playwright suite (Chromium only; tell me the one-time install command for Windows) under client/e2e/ or e2e/, runnable with an npm script (test:e2e) that resets and seeds the TEST database and starts API + client itself:
- E2E-1 / DEMO-01: customer01 logs in, joins with partySize 4 -> sees WAITING + ticket number; host1 logs in, Call Next -> CALLED, Complete -> COMPLETED; customer01 refreshes and sees COMPLETED (persisted).
- E2E-2 / DEMO-02: the same customer joins again while active -> UI shows the DUPLICATE_ACTIVE message. DEMO-03: partySize 9 -> INVALID_PARTY_SIZE message.
- E2E-3 / DEMO-04: a Customer opening the Host URL cannot see/operate it (redirect/forbidden) and a direct API call as Customer to call-next returns 403.
- E2E-4 / DEMO-05: logout, then the old session no longer works (/api/auth/me = 401).
Save screenshots at the key steps to docs/evidence/screenshots/DEMO-0X-step-N.png (readable size). Record the run with a label e2e-green (extend record-test-run or add a sibling script) — clean tree only. Do not weaken or skip steps to make them pass; if something is flaky, fix the cause. Keep unit/integration tests untouched. Append to docs/ai-use-log.md, push, PR title/body.
````

---

## P8 — Release prep (หลังทุก PR merge เข้า staging)

Branch: `chore/release-prep` จาก `sprint-1-staging`

````text
Read CLAUDE.md and docs/reference/project_deliverable_1.md (sections 2, 3.6, 4.4, 5). Run: git checkout sprint-1-staging; git pull; git checkout -b chore/release-prep.

1. Reproducibility (DoD-07): clone the repo into a NEW temporary folder outside the project, then follow README.md literally — nothing from memory — npm install/ci, create .env from .env.example, migrate, seed, run tests, start the app. Fix README/.env.example/scripts for every step that failed or was missing.
2. Restart persistence (DoD-01/NFR-02): start the API, join + call + complete via curl or the UI, stop the API process, start it again and retrieve the same ticket and events. Show the real output.
3. Full run on a clean tree: npm run test:record -- release-full-run (and the E2E label if P7 was done). Report counts of passed/failed/skipped exactly as printed.
4. Update docs/traceability.md and docs/sprints/sprint-1/test-spec.md: for each AC set PASS / FAIL / NOT EXECUTED strictly from the recorded runs, and add the tested commit SHA. Do not mark anything PASS without a recorded run.
5. Secrets check: git ls-files shows no .env; grep tracked files for the seed password value, "password=", tokens and private keys; report results.
6. Update docs/ai-use-log.md (full list of tools/tasks) and write docs/known-limitations.md from reality (skipped tests, defects, unfinished UI parts, things deliberately out of scope).
Commit in small steps, push, give me PR title/body, then print the exact PowerShell commands for me to (a) open the staging -> main release PR, (b) after my teammate's review and merge, tag and push: git checkout main; git pull; git tag -a v1.0-sprint1 -m "Sprint 1 release"; git push origin v1.0-sprint1. Do NOT merge or tag yourself.
````

---

## P9 — รวมหลักฐานสำหรับ Part F (หลัง tag)

Branch: `docs/part-f-evidence`

````text
Read CLAUDE.md, docs/reference/project_deliverable_1.md (sections 3.6, 4.2, 4.3) and docs/evidence/. Create docs/submissions/deliverable-1/part-f-evidence.md compiled ONLY from real recorded evidence and git history:
1. Setup summary and release reference (tag + full SHA).
2. Build/test commands, tested commit and the real pass/fail/skipped counts (from the evidence files).
3. AC -> planned TEST ID -> actual test file + test name -> result matrix (parse docs/evidence/*.json). Separate automated tests from manual checks.
4. Two short excerpts of real tests with setup + assertion: one domain rule (TEST-09 or TEST-10) and one role/ownership restriction (TEST-11 or TEST-20), each with its run result.
5. TDD table: Red SHA / output file -> implementation SHA -> Green SHA / output file, with dates and the ACTUAL failure message.
6. History sequence: from git log --date=iso --format="%h %ad %an %s": when contracts/tests were committed vs when implementation followed.
7. Contribution table prefilled from git log author counts and PR/Issue numbers if I give them — leave [ ] where unknown; do not invent anything.
8. AI-use declaration drafted from docs/ai-use-log.md and known limitations from docs/known-limitations.md.
9. A screenshot checklist for DEMO-01..05 (what to capture, which file in docs/evidence/screenshots/ or what is still missing) and a list of every placeholder in the Google Doc Part F that still needs real values.
Never write PASS for anything without an evidence file; mark missing items NOT EXECUTED / MISSING. Commit, push, PR title/body.
````

---

## PR-R — ผู้ช่วยตรวจ PR สำหรับเพื่อน (reviewer)

ใช้ในแชตใหม่ของ **reviewer** (ไม่ใช่ผู้เขียน) AI ไม่ approve แทน — reviewer อ่านผลแล้วเขียน comment เองใน GitHub

````text
Read CLAUDE.md and the contract for this PR (docs/sprints/sprint-1/<feature>.md + test-spec.md). Review branch <BRANCH> against sprint-1-staging using: git fetch; git diff sprint-1-staging...origin/<BRANCH> and git log --oneline sprint-1-staging..origin/<BRANCH>. Do not modify any file and do not approve anything.
Check and report with file:line references:
1. Every AC in the contract has a test; tests assert observable outcomes (status code, body, DB rows, events) and were not weakened (compare test files between the red and green commits).
2. Spec/test commits precede implementation; commit messages and evidence files make sense.
3. Authorization is enforced in the backend; no user id/role/ticket number taken from the client; 401/403 responses leak nothing.
4. Transactions and locks match the SDS; DB constraints exist; errors map to the documented codes.
5. No secrets, no .env, no debug leftovers, no unrelated changes.
Output (Thai): a list of 3–6 SPECIFIC findings or questions the human reviewer can verify themselves, plus one concrete reason to approve if everything checks out. Say clearly that the human must verify and write the review comment.
````

---

## HELP — เมื่อ test แดง / ติดปัญหา

````text
Read CLAUDE.md. A test is failing: <paste test name + error output>. Do NOT edit or skip the test and do not change expectations. Diagnose first: show the exact assertion that fails, what the code actually did, and whether the cause is in the implementation, the test setup, the DB state, or the spec. Propose the smallest fix and wait for my OK before changing anything. If you believe the test or spec is wrong, explain with evidence from the contract and propose a documented revision instead of a silent change.
````

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.3 | 2026-11-06 | Sync P3–P6 with PR #1 fixes: public Login, queue-list JSON/isAssigned, endpoint-specific check order and TEST-23/24 |
