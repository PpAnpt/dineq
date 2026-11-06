# Sprint 1 — GitHub Issue drafts

Ready-to-paste Issues for F-01..F-03. Replace `@ASSIGNEE` with the real GitHub login and `<owner>/<repo>` in links if needed. Branches start from `sprint-1-staging`; PRs target `sprint-1-staging`; the author never approves their own PR.

---

## Issue 1

**Title:** `F-01: Authentication & role protection (login, logout, me, Origin check)`

**Body:**

```markdown
## Contract
- [docs/sprints/sprint-1/F-01-auth.md](../blob/sprint-1-staging/docs/sprints/sprint-1/F-01-auth.md)
- Test spec: [docs/sprints/sprint-1/test-spec.md](../blob/sprint-1-staging/docs/sprints/sprint-1/test-spec.md)
- Error codes / API shapes: docs/system-sds.md C.6, C.6.1, C.6.2

## Linked requirements
- FR-01, FR-15 (S1 part)
- BR-03, BR-08
- NFR-01, NFR-05, NFR-06

## Acceptance criteria / tests
AC-01..AC-06 and AC-22 -> TEST-01..TEST-06, TEST-22

## Scope
- Seed accounts (customer01..30, host1, host2), Argon2id hashes, password from `SEED_DEMO_PASSWORD`
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Session: 32 random bytes, only SHA-256 stored, HttpOnly cookie `dineq_session`
- Auth / role middleware, Origin check on mutating requests
- UI: `/login` with loading and error states, role-based redirect

## Out of scope
Registration, password recovery, account administration.

## Definition of Done
- [ ] Tests written from test-spec first; Red run recorded in `docs/evidence/` and committed separately
- [ ] Implementation done; Green run recorded and committed separately
- [ ] TEST-01..06 and TEST-22 pass against a real PostgreSQL (`TEST_DATABASE_URL`)
- [ ] No secrets or real passwords in git, docs or logs; `.env.example` updated
- [ ] traceability.md / test-spec.md statuses changed only with a recorded run + commit SHA
- [ ] `docs/ai-use-log.md` updated
- [ ] PR into `sprint-1-staging` reviewed by teammate (specific check/finding recorded)

## Assignee
@ASSIGNEE (pair work: mention both students in the PR)

Branch: `feature/f-01-auth`
```

---

## Issue 2

**Title:** `F-02: Customer joins queue (queue list, join with partySize, my tickets)`

**Body:**

```markdown
## Contract
- [docs/sprints/sprint-1/F-02-join-queue.md](../blob/sprint-1-staging/docs/sprints/sprint-1/F-02-join-queue.md)
- Test spec: [docs/sprints/sprint-1/test-spec.md](../blob/sprint-1-staging/docs/sprints/sprint-1/test-spec.md)
- Error codes / API shapes: docs/system-sds.md C.6, C.6.1, C.6.2

## Linked requirements
- FR-02, FR-03, FR-04 (S1 part), FR-15 (S1 part), FR-16 (JOINED event)
- BR-01, BR-02, BR-07, BR-08, BR-09, BR-12
- NFR-01, NFR-02, NFR-03, NFR-06

## Acceptance criteria / tests
AC-07..AC-13 and AC-21 -> TEST-07..TEST-13, TEST-21

## Scope
- Migrations: restaurants, service_queues, queue_operator_assignments, queue_entries, queue_events (constraints per system-sds C.2)
- `GET /api/queues` (with `isAssigned`), `POST /api/queues/:queueId/entries`, `GET /api/me/entries`, `GET /api/entries/:entryId`
- Join transaction: `SELECT ... FOR UPDATE` on queue row, counter, JOINED event, rollback on failure
- Map PG `23505` to `DUPLICATE_ACTIVE`
- UI: `/queues`, `/my-queue`

## Definition of Done
- [ ] Tests written from test-spec first; Red run recorded and committed separately (BR-02 / TEST-09 is the TDD example)
- [ ] Implementation done; Green run recorded and committed separately
- [ ] TEST-07..13 and TEST-21 pass against a real PostgreSQL; TEST-10 uses 30 concurrent customers
- [ ] Rejected requests do not insert rows or consume ticket numbers (checked in DB)
- [ ] Ticket JSON fields match system-sds C.6.1; no private data in 401/403
- [ ] traceability.md / test-spec.md statuses changed only with a recorded run + commit SHA
- [ ] `docs/ai-use-log.md` updated
- [ ] PR into `sprint-1-staging` reviewed by teammate (specific check/finding recorded)

## Assignee
@ASSIGNEE (pair work: mention both students in the PR)

Branch: `feature/f-02-join-queue`
Depends on: F-01
```

---

## Issue 3

**Title:** `F-03: Host FIFO call-next and complete`

**Body:**

```markdown
## Contract
- [docs/sprints/sprint-1/F-03-host-queue.md](../blob/sprint-1-staging/docs/sprints/sprint-1/F-03-host-queue.md)
- Test spec: [docs/sprints/sprint-1/test-spec.md](../blob/sprint-1-staging/docs/sprints/sprint-1/test-spec.md)
- Error codes / API shapes: docs/system-sds.md C.6, C.6.1, C.6.2

## Linked requirements
- FR-05, FR-06, FR-07, FR-15 (S1 part), FR-16 (CALLED/COMPLETED events)
- BR-03, BR-04, BR-05, BR-06, BR-08, BR-12
- NFR-01, NFR-06

## Acceptance criteria / tests
AC-14..AC-20 -> TEST-14..TEST-20

## Scope
- `GET /api/queues/:queueId/entries` (WAITING/CALLED, FIFO, assigned Host only)
- `POST /api/queues/:queueId/call-next` (lowest ticketNo, one CALLED at a time, partial unique index)
- `POST /api/entries/:entryId/complete` (CALLED -> COMPLETED, event in the same transaction)
- UI: `/host/queues/:queueId` (waiting list, current CALLED, Call Next, Complete, conflict/error states)

## Definition of Done
- [ ] Tests written from test-spec first; Red run recorded and committed separately (FIFO / TEST-15 is a TDD candidate)
- [ ] Implementation done; Green run recorded and committed separately
- [ ] TEST-14..20 pass against a real PostgreSQL
- [ ] Unassigned Host and Customer get 403 and the DB is unchanged
- [ ] Invalid transitions return 409 `INVALID_TRANSITION` with no new event
- [ ] traceability.md / test-spec.md statuses changed only with a recorded run + commit SHA
- [ ] `docs/ai-use-log.md` updated
- [ ] PR into `sprint-1-staging` reviewed by teammate (specific check/finding recorded)

## Assignee
@ASSIGNEE (pair work: mention both students in the PR)

Branch: `feature/f-03-host-queue`
Depends on: F-01, F-02
```

---

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.2 | 2026-11-06 | Initial issue drafts for F-01..F-03 (added with spec revision 1) |
