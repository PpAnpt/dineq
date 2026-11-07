# Part F — Working Sprint 1 and verification (evidence compilation)

> **Source discipline.** Every number below is copied or computed from a recorded file in `docs/evidence/` (the `.txt` run output and the Vitest/Playwright `.json` reports), from `git log`, or from `gh` (GitHub PR/Issue metadata). Anything with no evidence file is marked `NOT EXECUTED`, `MISSING` or `[ ]`. Nothing is PASS without a recorded run. Compiled 2026-11-07 on top of `origin/sprint-1-staging` = `b164d2f545f5ef91f91c39c6047b2bc3e8c2fe2f`.
> Draft for the PDF; two students must still read and confirm it.
> Review update 2026-11-07: evidence assertions were checked against the JSON reports, metadata refreshed from GitHub, and a current (non-final) board snapshot recorded. Runtime tests were not re-run for this docs-only review.

## 1. Setup summary and release reference

**Stack:** Node (ESM) + Express, `pg` with plain SQL, PostgreSQL, Argon2id, `cookie-parser`; Vitest + Supertest (API/DB); React + Vite client; Playwright/Chromium for E2E. Recorded runs used Node v24.14.0 on Windows with a local PostgreSQL 18 (`docs/known-limitations.md`).

**Reproduce (from README, verified in a fresh clone by `docs/evidence/release-verification.md`):**

1. `npm ci`
2. Copy `.env.example` to `.env`; set `DATABASE_URL`, `TEST_DATABASE_URL`, `APP_ORIGIN`, `SEED_DEMO_PASSWORD` (local value only; never committed).
3. `npm run db:migrate`, `npm run db:migrate -- --test`, then `npm run db:seed` (idempotent, synthetic data: 1 restaurant/queue, 2 Hosts, 30 Customers).
4. `npm run dev` (API, port 3000) and `npm run dev:client` (Vite, port 5173).

Evidence: `docs/evidence/p2-setup.txt` (migrate/seed), `docs/evidence/release-fresh-clone.txt` and `release-fresh-clone-fixed-label.txt` (fresh clone: README setup, 108 passed). One README command (`test:record -- p2-infra-green`) failed in the fresh clone with `Evidence label already exists`; this was a documentation defect, not a test failure, and the README was corrected (`release-verification.md`).

**Release reference**

| Item | Value | Evidence / status |
| :-- | :-- | :-- |
| Release tag | **MISSING** — `git tag -l` returns nothing | `docs/release-handoff.md` plans `v1.0-sprint1` after the release PR is merged |
| `main` commit | `8c20805` ("chore: initial commit") — **the Sprint 1 release has NOT been merged into `main` yet** | `git log origin/main` |
| Release PR `sprint-1-staging` → `main` | **NOT OPENED** (no open PR; PRs #1–#17 all merged into staging) | `gh pr list` |
| Tested release-candidate commit | `a7a145ec6b870abaed2b3ae13a88e0ffa832818d` | headers of `release-full-run.txt`, `release-e2e-run.txt` |
| Current staging head | `b164d2f545f5ef91f91c39c6047b2bc3e8c2fe2f` (merge of PR #17) | `git rev-parse origin/sprint-1-staging` |
| Source equivalence | `server/`, `client/`, `database/`, `package*.json`, `.env.example` identical between tested `a7a145e`, integrated staging `b164d2f` and initial P9 head `d36945b`; later review changes are docs/evidence only | `docs/evidence/part-f-review-checks.txt`; historical P8 check remains in `release-source-equivalence.txt` at `82ab0e0` |

**To fill after the release PR is merged and tagged:** the accepted `main` full SHA and the annotated tag SHA (`git rev-parse HEAD`, `git rev-parse v1.0-sprint1`). Do not substitute the tag for the SHAs inside run headers.

## 2. Build and test commands, tested commit, counts

All rows: tested commit `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`, 2026-11-07.

| Command (from repo root unless noted) | Result | Passed / Failed / Skipped | Evidence |
| :-- | :-- | :-- | :-- |
| `npm run test:record -- release-full-run` (Vitest, real PostgreSQL, 4 files) | recorded | 108 total / 108 passed / 0 failed / 0 skipped (feature cases 100, infrastructure 8) | `release-full-run.txt/.json` |
| `npm run test:e2e:record -- release-e2e-run` (Playwright, Chromium, 1 worker, 0 retries) | recorded | 4 / 0 / 0 | `release-e2e-run.txt/.json` |
| `npm run test:review --workspace=client` (headless Chrome with **API response fixtures**, not real DB) | recorded | 3 / 0 / 0 | `release-build-ui-checks.txt` |
| `npm run build:client` | PASS (19 modules transformed) | n/a | `release-build-ui-checks.txt` |
| Fresh-clone API suite (README procedure) | recorded | 108 / 0 / 0 | `release-fresh-clone-fixed-label.txt/.json` |

The 108 API/DB cases are separate from the 4 E2E and 3 UI-fixture cases (the counts are not summed). Failed/skipped automated tests in these candidate runs: **none recorded** (0 and 0); historical Red failures are retained in section 5. Known defects and unexecuted checks are in section 10.

Output excerpt (`docs/evidence/release-full-run.txt`):

```
 Test Files  4 passed (4)
      Tests  108 passed (108)
   Duration  16.09s
```

## 3. AC → planned TEST → actual test → result

Source: `docs/evidence/release-full-run.json` (parsed; each case's file and title come from the report). Planned IDs come from `docs/sprints/sprint-1/test-spec.md`. The result column counts recorded cases only; PASS means every recorded case for that AC passed in the run at `a7a145e`.

### 3.1 Automated API/DB tests (Vitest + Supertest + PostgreSQL)

| AC | Planned TEST ID | Actual test file | Cases | Distinct test IDs run | Result (recorded) |
| :-- | :-- | :-- | --: | :-- | :-- |
| AC-01 | TEST-01 | `server/tests/f01-auth.test.js` | 3 | TEST-01 | PASS (3/3 passed) |
| AC-02 | TEST-02 | `server/tests/f01-auth.test.js` | 8 | TEST-02 | PASS (8/8 passed) |
| AC-03 | TEST-03 | `server/tests/f01-auth.test.js` | 4 | TEST-03 | PASS (4/4 passed) |
| AC-04 | TEST-04 | `server/tests/f01-auth.test.js` | 1 | TEST-04 | PASS (1/1 passed) |
| AC-05 | TEST-05 | `server/tests/f01-auth.test.js` | 12 | TEST-05 | PASS (12/12 passed) |
| AC-06 | TEST-06 | `server/tests/f01-auth.test.js` | 6 | TEST-06 | PASS (6/6 passed) |
| AC-07 | TEST-07 | `server/tests/f02-join.test.js` | 6 | TEST-07 | PASS (6/6 passed) |
| AC-08 | TEST-08 | `server/tests/f02-join.test.js` | 2 | TEST-08 | PASS (2/2 passed) |
| AC-09 | TEST-09 | `server/tests/f02-join.test.js` | 3 | TEST-09 | PASS (3/3 passed) |
| AC-10 | TEST-10 | `server/tests/f02-join.test.js` | 1 | TEST-10 | PASS (1/1 passed) |
| AC-11 | TEST-11 | `server/tests/f02-join.test.js` | 2 | TEST-11 | PASS (2/2 passed) |
| AC-12 | TEST-12 | `server/tests/f02-join.test.js` | 9 | TEST-12 | PASS (9/9 passed) |
| AC-13 | TEST-13 | `server/tests/f02-join.test.js` | 2 | TEST-13 | PASS (2/2 passed) |
| AC-14 | TEST-14 | `server/tests/f03-host.test.js` | 3 | TEST-14 | PASS (3/3 passed) |
| AC-15 | TEST-15 | `server/tests/f03-host.test.js` | 1 | TEST-15 | PASS (1/1 passed) |
| AC-16 | TEST-16 | `server/tests/f03-host.test.js` | 3 | TEST-16, TEST-16b | PASS (3/3 passed) |
| AC-17 | TEST-17 | `server/tests/f03-host.test.js` | 1 | TEST-17 | PASS (1/1 passed) |
| AC-18 | TEST-18 | `server/tests/f03-host.test.js` | 2 | TEST-18 | PASS (2/2 passed) |
| AC-19 | TEST-19 | `server/tests/f03-host.test.js` | 2 | TEST-19 | PASS (2/2 passed) |
| AC-20 | TEST-20 | `server/tests/f03-host.test.js` | 1 | TEST-20 | PASS (1/1 passed) |
| AC-21 | TEST-21 | `server/tests/f02-join.test.js` | 1 | TEST-21 | PASS (1/1 passed) |
| AC-22 | TEST-22 | `server/tests/f01-auth.test.js` | 6 | TEST-22 | PASS (6/6 passed) |
| AC-23 | TEST-23 | `server/tests/f02-join.test.js` | 13 | TEST-23 | PASS (13/13 passed) |
| AC-24 | TEST-24 | `server/tests/f03-host.test.js` | 8 | TEST-24a, TEST-24b, TEST-24c, TEST-24d | PASS (8/8 passed) |


Full per-case ledger (file + verbatim test name + result) is in Appendix A. It matches `docs/evidence/release-ac-results.md`.

### 3.2 Automated browser tests (Playwright, `client/e2e/sprint-1.spec.js`, `release-e2e-run.json`)

| Test name (verbatim) | Linked AC | Result |
| :-- | :-- | :-- |
| E2E-1 / DEMO-01: join, Host Call Next + Complete, customer sees persisted COMPLETED | AC-08, 14, 15, 17 | PASS |
| E2E-2 / DEMO-02 + DEMO-03: duplicate active join and invalid party size are rejected | AC-09, 12 | PASS |
| E2E-3 / DEMO-04: a Customer cannot use the Host page or call-next API | AC-06, 20 | PASS |
| E2E-4 / DEMO-05: after logout the old session cookie is rejected | AC-03, 04 | PASS |

UI fixture regressions (`client/tests/review-ui.test.js`; API fixtures, not backend proof): 3 PASS (Host refresh after 409 UNRESOLVED_CALLED, after 409 INVALID_TRANSITION, CLOSED-queue explanation).

### 3.3 Manual checks (not automated)

| Check | Status | Evidence |
| :-- | :-- | :-- |
| Manual two-profile DEMO-01 walkthrough | **NOT EXECUTED** | `docs/known-limitations.md` |
| Full keyboard / assistive-technology audit; exhaustive loading/empty/error states | **NOT EXECUTED** (partial label/focus/Enter checks only) | `docs/known-limitations.md` |
| Cross-browser, HTTPS deployment, GCP, performance p95 | **NOT EXECUTED** | `docs/known-limitations.md` |
| PostgreSQL service restart / DB-loss recovery | **NOT EXECUTED** | `docs/known-limitations.md` |

### 3.4 Scripted process-restart check (automated)

| Check | Actual result | Evidence |
| :-- | :-- | :-- |
| API **process** restart against the same DB (real HTTP + SQL event comparison), a scripted check, not a manual walkthrough | recorded: same ticket and JOINED→CALLED→COMPLETED events before/after | `release-restart-persistence.txt` (run at `3d2ba1b`, equivalent source) |

## 4. Test excerpts with run results

### 4.1 Domain rule — TEST-09 / AC-09 (BR-02: one active ticket per Customer), `server/tests/f02-join.test.js:129`

```js
  test.each(['WAITING', 'CALLED'])('TEST-09 / AC-09: joining again while %s is rejected with 409 DUPLICATE_ACTIVE', async (status) => {
    const cookie = await login(customerEmail(1));
    expect((await joinAs(cookie, 2)).status).toBe(201);
    if (status === 'CALLED') {
      await pool.query("UPDATE queue_entries SET status = 'CALLED', called_at = now()");
    }
    const before = await state();
    const second = await joinAs(cookie, 3);
    expectError(second, 409, 'DUPLICATE_ACTIVE');
    expect(await state()).toBe(before);
    const active = await pool.query(`SELECT count(*)::int AS n FROM queue_entries
      WHERE customer_id = $1 AND status IN ('WAITING', 'CALLED')`, [await userId(customerEmail(1))]);
    expect(active.rows[0].n).toBe(1);
    expect(await count('queue_events')).toBe(1);
    expect(await nextTicketNo()).toBe(2);
  });

```

Setup: a seeded Customer logs in and joins once (201); for the CALLED variant the entry is set to CALLED directly in SQL. Assertion: the second join returns the documented 409 envelope, the full DB snapshot is unchanged, and exactly one active entry / one event / `next_ticket_no = 2` remain. Recorded result (`release-full-run.json`):

```
TEST-09 / AC-09: joining again while WAITING is rejected with 409 DUPLICATE_ACTIVE → PASS
TEST-09 / AC-09: joining again while CALLED is rejected with 409 DUPLICATE_ACTIVE → PASS
```

The same file also contains the concurrent variant (ten simultaneous joins by one Customer: one 201, nine 409).

### 4.2 Role restriction — TEST-20 / AC-20 (Customer cannot use Host operations), `server/tests/f03-host.test.js:212`

```js
  test('TEST-20 / AC-20: Customer cannot list / call-next / complete; no state changes', async () => {
    const called = await insertEntry(pool, { customer: 1, ticketNo: 1, status: 'CALLED' });
    await insertEntry(pool, { customer: 2, ticketNo: 2 });
    const before = await dbState(pool);
    const cookie = await login(customerEmail(1));

    for (const response of [await list(cookie), await callNext(cookie), await complete(cookie, called.id)]) {
      expectError(response, 403, 'FORBIDDEN');
      expect(JSON.stringify(response.body)).not.toContain('ticketNo');
    }
    expect(await dbState(pool)).toBe(before);
  });
```

Setup: a CALLED and a WAITING ticket are inserted by SQL fixtures and the DB state is snapshotted. Assertion: a logged-in Customer gets 403 FORBIDDEN on list, Call Next and Complete, no ticket data in the body, and the DB snapshot is identical. Recorded result:

```
TEST-20 / AC-20: Customer cannot list / call-next / complete; no state changes → PASS
```

(Related ownership test, TEST-11 / AC-11 — Customer A reading Customer B's ticket → 403 with no B data — is also PASS in Appendix A.)

## 5. TDD Red → implementation → Green

Dates are git author dates (Asia/Bangkok). Run counts are from the `.txt` headers/summaries; the run's `Commit:` header is the SHA it tested. Failure messages are the first assertion line from the matching `.json`.

| Sequence | Red test commit → Red evidence commit / output | Actual Red result and failure message | Implementation commit | Green evidence commit / output | Green result |
| :-- | :-- | :-- | :-- | :-- | :-- |
| F-01 auth (AC-01..06, 22) | `d0bf738` (2026-11-06 18:54:20) → `ca6ece4` / `f01-red.txt` | 38 failed, 10 passed (48) (Vitest total). Failing: `expected 404 to be 200 // Object.is equality`; `expected 404 to be 401 // Object.is equality`; `expected 404 to be 400 // Object.is equality`; `Error: loginAs expected 200, received 404; F-01 must be implemented first`; `expected 400 to be 401 // Object.is equality`; `expected 400 to be 403 // Object.is equality`; `expected 404 to be 403 // Object.is equality` (38 failing) | `98863bd` (2026-11-06 18:58:36) | `44c9d9f` (2026-11-06 18:59:58) / `f01-green.txt` | 48 passed (48) (Vitest total) |
| F-02 join (AC-07..13, 21, 23) — initial red | `79b4eb1` (2026-11-06 19:28:20) → `a549cc2` / `f02-red.txt` | 27 failed, 55 passed (82) (Vitest total) (includes F-01/infra tests). Failing: `expected 404 to be 200 // Object.is equality`; `expected 404 to be 201 // Object.is equality`; `expected [ 404, 404, 404, 404, 404, 404, …(24) ] to deeply equal [ 201, 201, 201, 201, 201, 201, …(24) ]`; `TypeError: Cannot read properties of undefined (reading 'id')`; `expected 404 to be 409 // Object.is equality`; `expected 404 to be 400 // Object.is equality`; `expected 404 to be 403 // Object.is equality` (27 failing) | `d927b40` (2026-11-06 19:31:00) — join without duplicate rule | see next row | — |
| **F-02 BR-02 duplicate rule — TEST-09** | `79b4eb1` tests unchanged → `431480f` / `f02-tdd-br02-red.txt` (header commit `d927b40`) | 2 failed, 80 passed (82) (Vitest total). Failing: `expected 500 to be 409 // Object.is equality` (2 failing) | `be72710` (2026-11-06 19:31:21) | `b043f53` (2026-11-06 19:31:38) / `f02-tdd-br02-green.txt` | 82 passed (82) (Vitest total) |
| F-02 PR #13 review (malformed-JSON ordering) | `64370b8` (2026-11-06 21:17:08) → `eb38975` / `f02-review-red.txt` | 1 failed, 86 passed (87) (Vitest total). Failing: `expected 400 to be 404 // Object.is equality` (1 failing) | `bced128` (2026-11-06 21:17:42) | `b56bed4` (2026-11-06 21:18:09) / `f02-review-green.txt` | 87 passed (87) (Vitest total) |
| F-03 host (AC-14..20, 24) | `33c581a` (2026-11-06 22:48:24) → `4c1340c` / `f03-red.txt` | 18 failed, 90 passed (108) (Vitest total). Failing: `expected 501 to be 200 // Object.is equality`; `expected 501 to be 403 // Object.is equality`; `expected 501 to be 409 // Object.is equality`; `expected [ 501, 501 ] to deeply equal [ 200, 409 ]`; `expected 501 to be 404 // Object.is equality`; `expected 501 to be 400 // Object.is equality` (18 failing) (the endpoints were 501 placeholders) | `3f212d7` (2026-11-06 22:49:50) | `86d4256` (2026-11-06 22:50:18) / `f03-green.txt` | 108 passed (108) (Vitest total) |
| UI review fixes (PR #15) | `719ebc1` (2026-11-07 19:13:58) → `fed5f06` / `p6-review-red.txt` | 3 failed (UI fixtures; not DB tests). Actual error: `locator.waitFor: Timeout 2500ms exceeded.` while waiting for CALLED, the refreshed empty state, and the CLOSED explanation | `87ffa24` (2026-11-07 19:15:30) | `5bb2f2c` (2026-11-07 19:17:23) / `p6-review-ui-green.txt` | 3 passed |

Test-file integrity: `git diff --stat 79b4eb1 be72710 -- server/tests` and `git diff 79b4eb1 d927b40 -- server/tests/f02-join.test.js` showed no change to the F-02 tests between red and the BR-02 implementation; the PR #13 and PR #14 reviewers independently state the same (quoted in section 6). A reviewer-facing check is `git diff 33c581a 3f212d7 -- server/tests`.

## 6. Issues and PRs (two completed examples + overview)

| Issue | Feature / contract | Branch → base | PR | Author | Reviewer / state recorded | Merged by, date |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| #7 P4 / F-02 | F-02, AC-07..13, 21, 23 | `feature/f-02-join-queue` → `sprint-1-staging` | #13 | PpAnpt | BBINGOAL: CHANGES_REQUESTED (2026-11-06 13:15Z); follow-up comment 2026-11-07 10:08Z says both findings addressed | PpAnpt, 2026-11-06 15:42Z |
| #8 P5 / F-03 | F-03, AC-14..20, 24 | `feature/f-03-host-queue` → `sprint-1-staging` (base changed by reviewer from `main`) | #14 | PpAnpt | BBINGOAL: COMMENTED (2026-11-07 10:08Z) | PpAnpt, 2026-11-07 12:07Z |

Substantive review content (quoted from GitHub, shortened):

- **PR #13:** independent PostgreSQL run 82 passed / 0 failed / 0 skipped; F-02 test file unchanged from Red `79b4eb1`; ten same-Customer concurrent joins gave one 201 + nine 409, one entry, `next_ticket_no = 2`; forced event-insert failure rolled back everything. **Blocking finding:** malformed JSON to a missing queue returned 400 before the 404 resource lookup, contradicting SDS C.6.3. Fixed in `bced128` after Red `64370b8` (section 5).
- **PR #14:** independent run 108 / 0 / 0; F-03 tests unchanged from `33c581a`; checked FIFO, assignment/role checks, UUID/resource precedence, concurrent Call Next, transitions and atomic writes; no blocking findings.

Other merged PRs into staging: #1 docs (APPROVED by BBINGOAL after CHANGES_REQUESTED), #2 scaffold (APPROVED by PpAnpt), #3 F-01 (APPROVED by PpAnpt), #15 UI (two COMMENTED reviews by PpAnpt), #16 E2E (COMMENTED by BBINGOAL), #17 release prep (COMMENTED by PpAnpt). Issues #4–#11 are now CLOSED; #11 closed at 2026-11-07 13:48:35Z after its P8 PR merged. #12 (P9) remains OPEN with PR #18 in review.

**Gaps to disclose honestly:** GitHub shows no `APPROVED` review state on #13, #14, #15, #16 or #17 (reviews are CHANGES_REQUESTED/COMMENTED; #13/#14 were merged by their author after a comment-only follow-up). If the team's approvals were given elsewhere, add that evidence.

**Current board metadata (not final-release proof):** [DineQ Sprint 1 Board](https://github.com/users/PpAnpt/projects/4) is Kanban grouped by Status. The review synchronized completed P8 to Done and P9 to In Review. The actual snapshot is `docs/evidence/part-f-board-snapshot.json`: P1–P8 Done, P9 In Review, with capture time in the file. The final board screenshot after accepted release/P9 completion remains **MISSING**; do not call this in-progress snapshot the final board.

## 7. History sequence (contracts/tests before implementation)

Full `git log --date=iso --format="%h %ad %an %s"` of `origin/sprint-1-staging`, oldest first:

| SHA | Date (+0700) | Author | Subject |
| :-- | :-- | :-- | :-- |
| `8c20805` | 2026-11-04 23:43:48 | PpAnpt | chore: initial commit |
| `4805512` | 2026-11-04 23:45:00 | PpAnpt | chore: add project folder skeleton |
| `bf95f70` | 2026-11-04 23:51:24 | PpAnpt | docs: add SRS, feature inventory, traceability, system SDS, sprint plan |
| `ce707ec` | 2026-11-04 23:51:35 | PpAnpt | docs: add Sprint 1 contracts (F-01..F-03), STS and DoD |
| `5f62f03` | 2026-11-06 10:33:01 | PpAnpt | docs: add CLAUDE.md, course reference docs and Sprint 1 prompt pack |
| `7d33fe3` | 2026-11-06 11:05:40 | PpAnpt | docs: spec revision 1 - close traceability gaps, add AC-21/22 and error catalog |
| `12a51b8` | 2026-11-06 11:05:40 | PpAnpt | docs: add Sprint 1 issue drafts |
| `831677f` | 2026-11-06 17:34:53 | Siwarak Chatvichai | docs: address Sprint 1 contract review findings |
| `2d87368` | 2026-11-06 17:49:33 | BBINGOAL | Merge pull request #1 from PpAnpt/docs/spec-revision-1 |
| `007b7d3` | 2026-11-06 17:58:20 | Siwarak Chatvichai | chore(server): scaffold Express app and npm workspaces |
| `7341453` | 2026-11-06 17:58:20 | Siwarak Chatvichai | feat(db): add transactional migrations and Sprint 1 constraints |
| `e8a5590` | 2026-11-06 17:58:20 | Siwarak Chatvichai | feat(db): add idempotent synthetic demo seed |
| `ea2033d` | 2026-11-06 18:04:55 | Siwarak Chatvichai | test(infra): add PostgreSQL harness and test evidence recorder |
| `65a4ea9` | 2026-11-06 18:04:55 | Siwarak Chatvichai | docs: document Windows setup and P2 verification workflow |
| `252d20c` | 2026-11-06 18:06:53 | Siwarak Chatvichai | docs(evidence): record P2 setup and passing infrastructure tests |
| `8f4dc4e` | 2026-11-06 18:48:32 | PpAnpt | Merge pull request #2 from PpAnpt/feature/scaffold-db |
| `d0bf738` | 2026-11-06 18:54:20 | Siwarak Chatvichai | test(F-01): add failing tests for AC-01..06, AC-22 (red) |
| `ca6ece4` | 2026-11-06 18:54:27 | Siwarak Chatvichai | docs(evidence): record F-01 red test run |
| `98863bd` | 2026-11-06 18:58:36 | Siwarak Chatvichai | feat(F-01): implement login, hashed sessions and API access guards |
| `44c9d9f` | 2026-11-06 18:59:58 | Siwarak Chatvichai | docs(evidence): record F-01 green run and AC verification summary |
| `5c1dfce` | 2026-11-06 19:24:35 | PpAnpt | Merge pull request #3 from PpAnpt/feature/f-01-auth |
| `79b4eb1` | 2026-11-06 19:28:20 | PpAnpt | test(F-02): add failing tests for AC-07..13, AC-21/23 (red) |
| `a549cc2` | 2026-11-06 19:29:30 | PpAnpt | docs(evidence): record F-02 red run (27 failed, 55 passed incl. F-01/infra) |
| `d927b40` | 2026-11-06 19:31:00 | PpAnpt | feat(F-02): join queue transaction (duplicate rule pending) |
| `431480f` | 2026-11-06 19:31:09 | PpAnpt | docs(evidence): record BR-02 red run (TEST-09 fails with 500 before duplicate rule) |
| `be72710` | 2026-11-06 19:31:21 | PpAnpt | feat(F-02): enforce one active ticket per customer (BR-02) |
| `b043f53` | 2026-11-06 19:31:38 | PpAnpt | docs(evidence): record BR-02 green run (82 passed) |
| `70f66db` | 2026-11-06 19:31:38 | PpAnpt | docs: log F-02 AI use |
| `64370b8` | 2026-11-06 21:17:08 | PpAnpt | test(F-02): add malformed-JSON ordering and same-customer concurrency cases (PR #13 review, red) |
| `eb38975` | 2026-11-06 21:17:27 | PpAnpt | docs(evidence): record PR #13 review red run (1 failed, 86 passed) |
| `bced128` | 2026-11-06 21:17:42 | PpAnpt | fix(F-02): resolve queue before parsing join body (SDS C.6.3, PR #13 review) |
| `b56bed4` | 2026-11-06 21:18:09 | PpAnpt | docs(evidence): record PR #13 review green run (87 passed) |
| `885a658` | 2026-11-06 21:18:09 | PpAnpt | docs: log PR #13 review follow-up |
| `facb223` | 2026-11-06 22:42:12 | PpAnpt | Merge pull request #13 from PpAnpt/feature/f-02-join-queue |
| `33c581a` | 2026-11-06 22:48:24 | PpAnpt | test(F-03): add failing tests for AC-14..20, AC-24 (red) |
| `4c1340c` | 2026-11-06 22:48:45 | PpAnpt | docs(evidence): record F-03 red run (18 failed, 90 passed) |
| `3f212d7` | 2026-11-06 22:49:50 | PpAnpt | feat(F-03): implement Host waiting list, Call Next and Complete |
| `86d4256` | 2026-11-06 22:50:18 | PpAnpt | docs(evidence): record F-03 green run (108 passed) |
| `0867b8c` | 2026-11-06 22:50:24 | PpAnpt | docs: log F-03 host queue task |
| `1dd489f` | 2026-11-07 17:11:28 | Siwarak Chatvichai | feat(ui): scaffold React Vite client and same-origin API proxy |
| `9e848d6` | 2026-11-07 17:11:28 | Siwarak Chatvichai | feat(ui): add Customer and Host Sprint 1 screens |
| `0d75bc5` | 2026-11-07 17:15:09 | Siwarak Chatvichai | docs: explain P6 setup, demo checks and F-03 integration dependency |
| `69dfb0d` | 2026-11-07 17:16:25 | Siwarak Chatvichai | docs(evidence): record P6 browser checks and API regression |
| `05ab965` | 2026-11-07 17:18:32 | Siwarak Chatvichai | docs(evidence): store browser transcript as readable UTF-8 |
| `64cfaf1` | 2026-11-07 19:07:29 | PpAnpt | Merge pull request #14 from PpAnpt/feature/f-03-host-queue |
| `c6b99af` | 2026-11-07 19:12:33 | Siwarak Chatvichai | merge: integrate reviewed F-03 from sprint-1-staging |
| `719ebc1` | 2026-11-07 19:13:58 | Siwarak Chatvichai | test(ui): cover Host conflict refresh and CLOSED queue explanation |
| `fed5f06` | 2026-11-07 19:14:33 | Siwarak Chatvichai | docs(evidence): record P6 review regression red run |
| `87ffa24` | 2026-11-07 19:15:30 | Siwarak Chatvichai | fix(ui): refresh Host state after conflicts and explain closed queues |
| `5bb2f2c` | 2026-11-07 19:17:23 | Siwarak Chatvichai | docs(evidence): record P6 peer review fixes and combined green suite |
| `d947278` | 2026-11-07 19:26:44 | PpAnpt | Merge pull request #15 from PpAnpt/dineq feature/ui-sprint-1 |
| `eda34e3` | 2026-11-07 19:36:34 | PpAnpt | test(e2e): add Playwright Sprint 1 journeys DEMO-01..05 and E2E recorder |
| `a1ad489` | 2026-11-07 19:36:53 | PpAnpt | docs(evidence): record e2e-green run and DEMO-01..05 screenshots |
| `3d2ba1b` | 2026-11-07 19:54:22 | BBINGOAL | Merge pull request #16 from PpAnpt/test/e2e-sprint-1 |
| `a7a145e` | 2026-11-07 20:00:10 | Siwarak Chatvichai | docs: fix fresh-clone evidence command and record P8 verification scope |
| `842bd30` | 2026-11-07 20:10:31 | Siwarak Chatvichai | docs(evidence): record fresh-clone release suites and process restart |
| `2e75e30` | 2026-11-07 20:10:31 | Siwarak Chatvichai | docs: map all Sprint 1 AC to recorded results and tested source |
| `82ab0e0` | 2026-11-07 20:10:31 | Siwarak Chatvichai | docs: disclose release limitations and provide review and tag handoff |
| `7c438cc` | 2026-11-07 20:11:08 | Siwarak Chatvichai | docs(evidence): verify final tracked secrets and source equivalence |
| `1858363` | 2026-11-07 20:21:13 | PpAnpt | docs: attach v0.4 Revision History rows to their tables |
| `b164d2f` | 2026-11-07 20:32:04 | BBINGOAL | Merge pull request #17 from PpAnpt/chore/release-prep |

Reading guide (from the table above):

- Contracts, SRS/SDS and the Sprint 1 STS: `bf95f70`, `ce707ec` (2026-11-04), revised in `7d33fe3`/`831677f` and merged by PR #1 (`2d87368`, 2026-11-06 17:49) — **before** any F-01 test or code.
- F-01: tests `d0bf738` 18:54:20 → implementation `98863bd` 18:58:36.
- F-02: tests `79b4eb1` 19:28 → `d927b40` 19:31:00 → BR-02 `be72710` 19:31:21; review round `64370b8` 21:17:08 → `bced128` 21:17:42.
- F-03: tests `33c581a` 22:48:24 → implementation `3f212d7` 22:49:50.
- UI `1dd489f`/`9e848d6`, E2E `eda34e3`, release prep `2e75e30`..`1858363` follow on 2026-11-07.

Caveat: red→green gaps are short (seconds to minutes) because AI-assisted commits were made in a tight loop; the recorded `.txt` red outputs, not the timestamps, are the proof that the tests failed first.

## 8. Contribution table

Commit counts (`git log origin/sprint-1-staging --format=%an | sort | uniq -c`):

| Git author name | Commits |
| :-- | --: |
| BBINGOAL | 3 |
| PpAnpt | 32 |
| Siwarak Chatvichai | 26 |

| Student | Name | Student ID | GitHub login / git author | PRs authored | Reviews given (from `gh`) | Issues / work | Notes |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| A | [ ] | [ ] | `PpAnpt` (git author `PpAnpt`) | #1, #13, #14, #16; #18 in review | #2, #3 (APPROVED); #15, #17 (COMMENTED) | P1 specs; P4/F-02; P5/F-03; P7 E2E; P9 draft | [ ] confirm |
| B | [ ] | [ ] | `BBINGOAL` (git author `Siwarak Chatvichai` and `BBINGOAL` — **[ ] confirm these are the same person**) | #2, #3, #15, #17 | #1 (CHANGES_REQUESTED → APPROVED); #13 (CHANGES_REQUESTED); #14, #16 (COMMENTED) | P2 scaffold; P3/F-01; P6 UI; P8 release prep | [ ] confirm |

PR/Issue numbers come from `gh pr list/view` and `gh issue list`; who is "Student A/B" and the mapping of git author names to people is **not** in any file and needs the students' confirmation. Pair-work notes per Issue: `[ ]`.

## 9. AI-use declaration (draft from `docs/ai-use-log.md`)

AI tools were used on the tasks actually logged in `docs/ai-use-log.md`: Claude Code (Sonnet 5.5) and Codex. The log records: specification revision and issue drafts; P2 scaffold, migrations, seed and test harness; F-01 auth (Red 38 failed / 10 passed → Green 48 passed); F-02 join (Red 27 failed → BR-02 Red 2 failed → Green 82 passed; review fix Red 1 failed → Green 87 passed); F-03 host (Red 18 failed → Green 108 passed); React/Vite UI and its review fixes (3 failed → 3 passed); Playwright E2E (4 passed); P8 fresh-clone/restart/release evidence; and this P9 compilation/review. Entries distinguish automated verification from the human-review status; an automated test run is not a manual check. Tool assistance also included review comments and the user-authorized GitHub CLI merge of PR #17 into staging (`b164d2f`), as recorded in the review follow-up log. GitHub account attribution alone does not establish which steps a student performed manually. The students must confirm their human review/approval steps and remain responsible for correctness and explaining the design, tests and final release.

Remaining log hygiene: several historical rows still contain `PR #__` or "teammate review pending". Add confirmed PR references and distinguish each row's original status from the current release status. The example row was removed in P8; both P8 and P9 have real task entries. Do not treat the former example as evidence of another tool's use. One F-03 entry is out of date order. Final human confirmations are still pending.

## 10. Known limitations (from `docs/known-limitations.md`)

- **Defect:** an oversized JSON body (>100 KB) returns HTTP 413 with code `INTERNAL_ERROR` / message `request entity too large`; 413 is not in the error catalog. Unresolved (needs a contract revision first); no session is created (`release-build-ui-checks.txt`).
- **NOT EXECUTED:** manual two-profile DEMO-01; full keyboard/assistive audit and exhaustive state checklist; cross-browser; HTTPS/GCP; p95 performance; PostgreSQL service restart / DB-loss recovery.
- **Scope/behavior:** plain-CSS UI with manual Refresh (no push/polling); one restaurant and one queue; fixed ports 3000/5173; E2E needs the dev stack stopped and resets only the `_test` database; frontend-only start can show 502; all seeded accounts share one local demo password; no self-registration or password recovery.
- **Out of Sprint 1 scope (not built):** cancel, no-show, tables, multiple queues, reports, Docker/CI/GCP (Lab 5).
- **Pending process items:** release PR into `main`, release tag, final PDF Parts A–F, student identities/contribution confirmation, captions/navigation/page numbers. TA confirmation of the SRS theme/assumptions is not claimed.
- **Failed / skipped automated tests at the release candidate:** none (0 / 0).

## 11. Screenshot checklist (DEMO-01..05)

Two PNG sets exist. **Set R (preferred):** `docs/evidence/release-screenshots/` produced by `release-e2e-run` at `a7a145e`. **Set E:** `docs/evidence/screenshots/` produced by `e2e-green` at `eda34e3` (older run; same file names). All are automated headless Chromium captures, not manual captures. Use **one** set and state its commit once in the PDF. Files marked *viewed* were opened and checked by this task; the others were not individually inspected.

| ID | Role | Start condition | Steps | Expected | File(s) in Set R | Status |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| DEMO-01 (AC-08, 14, 15, 17, 03) | Customer, then Host | Reseeded test DB, queue OPEN, no tickets | Customer joins partySize 4; Host Call Next; Host Complete; Customer reloads | WAITING → CALLED → COMPLETED, retrieved after reload | `DEMO-01-step-1.png` (WAITING), `-step-2.png` (CALLED; *viewed*: shows Host "Ticket #1 CALLED, party 4"), `-step-3.png` (Complete), `-step-4.png` (Customer reload COMPLETED) | Files exist. Add caption with expected vs actual. |
| DEMO-02 (AC-09) | Customer | Customer already has a WAITING ticket | Join again | 409 DUPLICATE_ACTIVE shown | `DEMO-02-step-1.png` | File exists (not individually viewed) |
| DEMO-03 (AC-12) | Customer | Queue OPEN | Enter partySize 9 (browser max check bypassed in the test) | 400 INVALID_PARTY_SIZE from the server | `DEMO-03-step-1.png` (*viewed*: shows "400 INVALID_PARTY_SIZE: partySize must be an integer from 1 to 8", customer02, value 9) | File exists |
| DEMO-04 (AC-06, 20) | Customer | Logged in as Customer | Open Host page; direct call-next API | 403 FORBIDDEN | `DEMO-04-step-1.png` (*viewed*: "Access denied — 403 FORBIDDEN", customer01). The direct-API 403 is asserted in the test, not visible in the image | File exists; **backend proof is the API tests TEST-06/20, not this screenshot** |
| DEMO-05 (AC-03, 04) | Customer | Logged in | Logout; reuse old cookie | Login screen; old cookie → 401 | `DEMO-05-step-1.png` (signed in), `-step-2.png` (login after logout) | Files exist (not individually viewed). The 401 is a test assertion, not on screen |

**Still MISSING (no evidence file):** (a) a screenshot of the Vitest/Playwright console output for the PDF (only `.txt`/`.json`); (b) GitHub screenshots of PR #13 and #14 reviews, the merge into staging, and the final project board; (c) a manual (human) run of DEMO-01 in two browser profiles; (d) a screenshot of the release PR and tag (do not exist yet); (e) a caption per image with feature/AC IDs, role, start state, steps, expected vs actual, and one release commit.

## 12. Placeholders still needing real values

No specific live Google Doc URL/key was verified for this compilation. This checklist comes from the repository and course requirements (§3.6/§4.2/§4.3); it is not a verified inventory of placeholders in a live Doc. Compare it with the actual document before submission:

1. Both students' names and IDs, repository URL (`https://github.com/PpAnpt/dineq`, from `gh`), selected theme (Theme 9) — [ ] names/IDs.
2. Release tag name, annotated-tag SHA, accepted `main` full SHA, release PR number/date — **do not exist yet**.
3. Final project-board status (screenshot) — MISSING.
4. Pair-work notes for each Issue, who did what, student ↔ git author mapping — [ ].
5. Screenshot captions (AC IDs, role, start condition, steps, expected/actual) and the single release commit for the demo set — [ ].
6. Which PNG set (R or E) goes into the PDF — [ ] decide.
7. GitHub review screenshots for two Issues/PRs (#13, #14 suggested) — MISSING.
8. Any "teammate approval" evidence for #13–#17 (GitHub shows no APPROVED) — [ ].
9. Navigation table page numbers (§4.3) and table of contents — [ ].
10. `docs/ai-use-log.md` placeholders `PR #__` and stale "pending" notes — [ ].
11. DoD-01 manual walkthrough and any other DoD item still not PASS in `test-spec.md` (e.g. release/tag, DoD-07) — [ ] after release.
12. Decision on whether to fix or just disclose the 413 `INTERNAL_ERROR` defect (needs a contract revision before code).

## Appendix A — per-case ledger (`release-full-run.json`, tested commit `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`)

| AC | Test file | Test name (verbatim from JSON) | Result |
| :-- | :-- | :-- | :-- |
| AC-01 | `server/tests/f01-auth.test.js` | TEST-01 / AC-01: 'CUSTOMER' logs in without a Cookie; identity, Argon2id and hashed session come from the server | PASS |
| AC-01 | `server/tests/f01-auth.test.js` | TEST-01 / AC-01: 'HOST' logs in without a Cookie; identity, Argon2id and hashed session come from the server | PASS |
| AC-01 | `server/tests/f01-auth.test.js` | TEST-01 / AC-01: Secure cookie and session TTL follow the supplied server configuration | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: wrong password and unknown email return the same 401 without a session or DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: an inactive account cannot log in or create a session | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: 'null body' is rejected with the SDS validation code and no DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: 'missing credentials' is rejected with the SDS validation code and no DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: 'missing password' is rejected with the SDS validation code and no DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: 'non-string email' is rejected with the SDS validation code and no DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: 'non-string password' is rejected with the SDS validation code and no DB changes | PASS |
| AC-02 | `server/tests/f01-auth.test.js` | TEST-02 / AC-02: malformed JSON at public Login is a validation error with no DB changes | PASS |
| AC-03 | `server/tests/f01-auth.test.js` | TEST-03 / AC-03: /auth/me returns the session user and ignores forged identity/role fields | PASS |
| AC-03 | `server/tests/f01-auth.test.js` | TEST-03 / AC-03: a session expired directly in PostgreSQL is rejected without changing DB state | PASS |
| AC-03 | `server/tests/f01-auth.test.js` | TEST-03 / AC-03: an existing session stops working when its user becomes inactive | PASS |
| AC-03 | `server/tests/f01-auth.test.js` | TEST-03 / AC-03: an unknown session token is rejected without creating or mutating a session | PASS |
| AC-04 | `server/tests/f01-auth.test.js` | TEST-04 / AC-04: Logout revokes the stored session, clears the Cookie and rejects reuse of the old Cookie | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/auth/me' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'post' '/api/auth/logout' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/queues' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/me/entries' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'post' '/api/queues/22222222-2222-4222-8222-2…' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/entries/not-a-uuid' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/queues/not-a-uuid/entries' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'post' '/api/queues/not-a-uuid/call-next' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'post' '/api/entries/not-a-uuid/complete' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/unknown-protected-route' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: anonymous 'get' '/api/auth/login' is rejected before routing/UUID checks with no private data or DB changes | PASS |
| AC-05 | `server/tests/f01-auth.test.js` | TEST-05 / AC-05: an anonymous malformed JSON request is rejected by Session before Body parsing | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'get' '/api/queues/22222222-2222-4222-8222-2…' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'post' '/api/queues/22222222-2222-4222-8222-2…' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'post' '/api/entries/00000000-0000-4000-8000-…' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'get' '/api/queues/not-a-uuid/entries' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'post' '/api/queues/not-a-uuid/call-next' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-06 | `server/tests/f01-auth.test.js` | TEST-06 / AC-06: Customer 'post' '/api/entries/not-a-uuid/complete' is forbidden despite forged Host identity, with DB unchanged | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: 'Customer' gets the C.6.1 shape with isAssigned=false | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: 'Assigned Host' gets the C.6.1 shape with isAssigned=true | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: 'Unassigned Host' gets the C.6.1 shape with isAssigned=false | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: a CLOSED queue is listed with status CLOSED | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: a fixture with no queues returns { "data": [] } | PASS |
| AC-07 | `server/tests/f02-join.test.js` | TEST-07 / AC-07: queue list requires a Session | PASS |
| AC-08 | `server/tests/f02-join.test.js` | TEST-08 / AC-08: Customer joins an OPEN queue with partySize=4 and can read the ticket back | PASS |
| AC-08 | `server/tests/f02-join.test.js` | TEST-08 / AC-08: a Customer without tickets gets { "data": [] } from /api/me/entries | PASS |
| AC-09 | `server/tests/f02-join.test.js` | TEST-09 / AC-09: joining again while WAITING is rejected with 409 DUPLICATE_ACTIVE | PASS |
| AC-09 | `server/tests/f02-join.test.js` | TEST-09 / AC-09: joining again while CALLED is rejected with 409 DUPLICATE_ACTIVE | PASS |
| AC-09 | `server/tests/f02-join.test.js` | TEST-09 / AC-09: ten simultaneous joins by the same Customer yield one 201 and nine 409 DUPLICATE_ACTIVE | PASS |
| AC-10 | `server/tests/f02-join.test.js` | TEST-10 / AC-10: 30 customers join at once with distinct ticket numbers 1..30 | PASS |
| AC-11 | `server/tests/f02-join.test.js` | TEST-11 / AC-11: Customer A cannot read Customer B ticket (403, no B data in response) | PASS |
| AC-11 | `server/tests/f02-join.test.js` | TEST-11 / AC-11: Assigned Host may read the ticket, Unassigned Host gets 403 | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: joining a CLOSED queue is 409 QUEUE_CLOSED with no insert and no ticket number used | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize 0 is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize 9 is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize 1.5 is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize "abc" is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize null is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: partySize missing is 400 INVALID_PARTY_SIZE and changes nothing | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: boundary partySize 1 is accepted | PASS |
| AC-12 | `server/tests/f02-join.test.js` | TEST-12 / AC-12: boundary partySize 8 is accepted | PASS |
| AC-13 | `server/tests/f02-join.test.js` | TEST-13 / AC-13: Host cannot join (403 FORBIDDEN), no ticket and no counter change | PASS |
| AC-13 | `server/tests/f02-join.test.js` | TEST-13 / AC-13: Host has no Customer ticket list (/api/me/entries is Customer-only) | PASS |
| AC-14 | `server/tests/f03-host.test.js` | TEST-14 / AC-14: assigned Host lists WAITING/CALLED in FIFO order without private data | PASS |
| AC-14 | `server/tests/f03-host.test.js` | TEST-14 / AC-14: assigned Host gets { "data": [] } for an empty queue | PASS |
| AC-14 | `server/tests/f03-host.test.js` | TEST-14 / AC-14: unassigned Host gets 403 FORBIDDEN and no ticket data | PASS |
| AC-15 | `server/tests/f03-host.test.js` | TEST-15 / AC-15: Call Next calls the lowest ticket (FIFO); the next one stays WAITING | PASS |
| AC-16 | `server/tests/f03-host.test.js` | TEST-16 / AC-16: Call Next while a CALLED ticket is unresolved -> 409 UNRESOLVED_CALLED | PASS |
| AC-16 | `server/tests/f03-host.test.js` | TEST-16 / AC-16: CALLED with no WAITING still returns 409 UNRESOLVED_CALLED (not 404) | PASS |
| AC-16 | `server/tests/f03-host.test.js` | TEST-16b / AC-16: two simultaneous Call Next requests -> exactly one 200 and one 409 | PASS |
| AC-17 | `server/tests/f03-host.test.js` | TEST-17 / AC-17: Complete a CALLED ticket -> COMPLETED in DB and visible to the owner | PASS |
| AC-18 | `server/tests/f03-host.test.js` | TEST-18 / AC-18: Complete a WAITING ticket -> 409 INVALID_TRANSITION, row and events unchanged | PASS |
| AC-18 | `server/tests/f03-host.test.js` | TEST-18 / AC-18: Complete a COMPLETED ticket -> 409 INVALID_TRANSITION, row and events unchanged | PASS |
| AC-19 | `server/tests/f03-host.test.js` | TEST-19 / AC-19: unassigned Host cannot list / call-next / complete; DB unchanged | PASS |
| AC-19 | `server/tests/f03-host.test.js` | TEST-19 / AC-19: assigned Host cannot act on another existing queue it is not assigned to | PASS |
| AC-20 | `server/tests/f03-host.test.js` | TEST-20 / AC-20: Customer cannot list / call-next / complete; no state changes | PASS |
| AC-21 | `server/tests/f02-join.test.js` | TEST-21 / AC-21: ticket and JOINED event survive a new app instance with a new DB pool | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on post is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on put is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on patch is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on delete is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on Login cannot create a session even with valid credentials | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: matching Origin permits Login, and foreign Origin does not block a read-only request | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: GET entry with malformed UUID is 400 VALIDATION_ERROR | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: POST join with malformed UUID is 400 VALIDATION_ERROR | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: GET entry with an absent UUID is 404 NOT_FOUND | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: POST join with an absent UUID is 404 NOT_FOUND | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: GET entry (malformed) without a Session is 401 UNAUTHENTICATED before UUID checks | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: POST join (malformed) without a Session is 401 UNAUTHENTICATED before UUID checks | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: GET entry (absent) without a Session is 401 UNAUTHENTICATED before UUID checks | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: POST join (absent) without a Session is 401 UNAUTHENTICATED before UUID checks | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: malformed JSON to an absent queue is 404 NOT_FOUND (resource before body parsing) | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: malformed JSON to a malformed UUID is 400 VALIDATION_ERROR | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: malformed JSON to an existing queue is 400 VALIDATION_ERROR and changes nothing | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: Session and Role are still checked before malformed JSON (401 anonymous, 403 Host) | PASS |
| AC-23 | `server/tests/f02-join.test.js` | TEST-23 / AC-23: resource lookup precedes body validation (absent queue + bad partySize is 404; malformed id is 400) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24a / AC-24: Call Next on an assigned queue with neither WAITING nor CALLED ('no entries at all') -> 404 NO_WAITING_ENTRY | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24a / AC-24: Call Next on an assigned queue with neither WAITING nor CALLED ('only a COMPLETED entry') -> 404 NO_WAITING_ENTRY | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24b / AC-24: host1@dineq.test with a valid but absent UUID gets 404 NOT_FOUND on all three endpoints (not 403) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24b / AC-24: host2@dineq.test with a valid but absent UUID gets 404 NOT_FOUND on all three endpoints (not 403) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24c / AC-24: host1@dineq.test with not-a-uuid gets 400 VALIDATION_ERROR on all three endpoints | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24c / AC-24: host2@dineq.test with not-a-uuid gets 400 VALIDATION_ERROR on all three endpoints | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24d / AC-24: anonymous -> 401 UNAUTHENTICATED and Customer -> 403 FORBIDDEN before UUID/resource checks (00000000-0000-4000-8000-000000000000) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24d / AC-24: anonymous -> 401 UNAUTHENTICATED and Customer -> 403 FORBIDDEN before UUID/resource checks (not-a-uuid) | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-01: health endpoint returns the public success envelope | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-02: missing config fails fast and test reset rejects unsafe database URLs | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-03: migration creates all tables, UUID IDs, timestamptz fields and foreign keys | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-04: PostgreSQL exposes both partial unique indexes and required CHECK constraints | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-05: rerunning migrations and seed preserves identities, rows and ticket counter | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-06: seed contains 30 hashed customers and correctly scoped Hosts | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-07: DB rejects invalid party sizes, statuses, counters and foreign keys | PASS |
| Infra | `server/tests/infra.test.js` | INFRA-08: unique indexes and timestamp/event constraints reject inconsistent rows | PASS |


## Revision History

| Version | Date | Change |
| :-- | :-- | :-- |
| v0.1 | 2026-11-07 | Initial Part F evidence compilation from recorded evidence, git history and GitHub metadata |
| v0.2 | 2026-11-07 | Review: align tool declaration with current log, separate scripted/manual checks, refresh Issue/board metadata and verify ledger/excerpts/source equivalence; release/human placeholders retained |
