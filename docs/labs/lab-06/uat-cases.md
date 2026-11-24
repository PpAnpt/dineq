# DineQ - Sprint 1 UAT cases for the HairRoot team

Version 0.1 - DRAFT for peer review, 24 November 2026. Tracking: [L6-2 / #46](https://github.com/PpAnpt/dineq/issues/46). Product Team: **DineQ** (Anapat Banjerdsilp / PpAnpt and Siwarak Chatvichai / BBINGOAL). Independent UAT Team: **HairRoot**. Their HairRoot product has separate cases and execution records; no HairRoot booking behavior or AC number is imported here.

All cases/subcases are **NOT EXECUTED**. This document prepares independent testing; source inspection and green developer CI are not independent UAT results or acceptance. The session version, dates, credential acknowledgement and final handoff remain subject to [coordination](coordination.md) and L6-3 / #47.

## 1. Product, version and scope

| Item | Value / verification status |
| --- | --- |
| Product / repository | DineQ, restaurant walk-in queues; <https://github.com/PpAnpt/dineq> |
| URL (`BASE`) | <https://s21271a0d-4d7hbszvwq-as.a.run.app> |
| Sprint 1 baseline | Tag `v1.0-sprint1`, commit `eaa555dfb062d3fc627a374cd55a910b6d609509` |
| Candidate deployed release under test | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620`; recorded deploy [44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220), revision `s21271a0d-00005-rdp` |
| Actual session version | PENDING owner/UAT-team confirmation immediately before execution; record full commit, revision and time in each run |
| In scope | F-01 login/logout/current user/roles; F-02 queue list, Customer join and own tickets; F-03 assigned-Host FIFO call/complete and persisted ticket state |
| Out of scope | Cancellation, no-show, table assignment, queue administration/multiple-queue UI, reporting, and unfinished Sprint 2/3 features |
| Contracts | [F-01](../../sprints/sprint-1/F-01-auth.md), [F-02](../../sprints/sprint-1/F-02-join-queue.md), [F-03](../../sprints/sprint-1/F-03-host-queue.md), [SDS C.6](../../system-sds.md#c6-api-specification--endpoint-inventory) |

The recorded release is a candidate, not a live-version query. If the running version changes during a case, record that run and the interruption; agree which cases to repeat on the new version. Never mix versions into one PASS or silently replace an earlier actual result.

## 2. Accounts, variables and execution gates

Passwords are supplied privately through the agreed course handoff. The labels below are proposed synthetic seed accounts; confirm availability and absence of old active tickets before assigning them. If an account is unsuitable, the Product Team records the replacement label/email before execution. Never record the correct password, session cookie, token or login request payload in evidence.

| Label | Proposed account | Role / purpose |
| --- | --- | --- |
| C1 | `customer03@dineq.test` | Customer: normal journey, duplicate, first FIFO ticket |
| C2 | `customer04@dineq.test` | Customer: ownership target, second FIFO ticket, persistence before-data |
| C3 | `customer05@dineq.test` | Customer: lower valid party-size boundary |
| C4 | `customer06@dineq.test` | Customer: upper valid party-size boundary |
| H1 | `host1@dineq.test` | Host assigned to the seeded queue |
| H2 | `host2@dineq.test` | Host without an assignment |
| ANON | No session | Signed-out checks |

`Q` is the actual queue item's **id**, not restaurant.id, selected from `GET /api/queues` -> `body.data`. H1's post-login address is `/host/queues/Q`. The seed normally uses queue `22222222-2222-4222-8222-222222222222` and DineQ Demo Restaurant; verify and record the actual item. Ticket variables such as `T02` mean entry UUIDs; `N02` means the associated numeric ticketNo. Record both and partySize. Ticket numbers keep increasing and are not assumed to start at 1. When there are several cards in My queue, locate the recorded ticket, not simply the first card.

Before execution, the Product and UAT Teams confirm:

1. Actual version/scope and private account access are agreed; both independent testers are named in the run record.
2. A quiet shared-queue window is reserved. H1 refreshes the Host list before each mutating case. Standalone cases start with no CALLED/WAITING entry, except their explicitly declared fixtures. Each Customer used to join has no active ticket in Q.
3. Existing Lab 5/other users' tickets are preserved. If an unrelated older WAITING or any unrelated CALLED ticket exists, stop before Host mutation and record BLOCKED/setup reason. The Product Team coordinates legitimate preparation; testers do not drain/reset a queue, truncate/reseed the DB or complete someone else's ticket to make a case work.
4. For every Call Next, verify its returned entry ID/visible ticket number is the intended test ticket **before** Complete. If it selects another entry, preserve the observation and stop; do not complete that entry.
5. Roles use isolated browser profiles/browsers or explicit logout/login. A second tab is not a separate session. The Customer and H1 views must show the intended email/role before actions. Use the canonical BASE consistently.

Recommended order: **01 -> 04A/04B -> 02 -> 03 -> 05 -> 06 -> 07 -> agreed 04C -> 08**. Case 06 uses the WAITING fixture from 05; 08 uses the recorded COMPLETED ticket from 02 and creates its own WAITING before-data. These dependencies are intentional. Independently rerunning 06 requires rerunning the fixture step of 05 first; rerunning 08 requires a recorded completed fixture equivalent to 02. Case 04C needs separately announced CLOSED-state preparation and restoration to OPEN before 08.

Cleanup means completing only the case's own tickets through valid H1 Call Next -> Complete after evidence is saved and the FIFO guard passes. Completed tickets/events stay in the database. There is no cancel/delete/reset UI in Sprint 1. If the guard fails or a case stops early, record the remaining test UUIDs/statuses and ask the Product Team to coordinate; do not invent cleanup success.

### Supporting manual API checks

Most steps use the delivered UI. Steps explicitly marked **API** are supporting requests made by the independent tester in the browser's Developer Tools Console on the canonical DineQ origin, after signing in as the stated account. They are not automated test runs. Inspect only response status/JSON; omit authentication headers and login payloads from captures. Redefine the helper after a full navigation/new login if it is no longer present.

```javascript
async function dqRequest(method, path, data) {
  if (location.origin !== 'https://s21271a0d-4d7hbszvwq-as.a.run.app') {
    throw new Error('Open the agreed canonical DineQ test URL first');
  }
  const options = { method, credentials: 'same-origin' };
  if (data !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  const response = await fetch('/api' + path, options);
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
```

For example, `await dqRequest('GET', '/me/entries')` returns `{status, body}`; success data is `body.data`, errors are `body.error.code`/`body.error.message`. Replace Q/T variables below with recorded UUID strings (or define those variables in the current Console). The browser supplies its own Origin/session; do not inject user IDs/roles or override security settings. This helper does not log in or read the HttpOnly cookie. If API tooling cannot be used, record the affected substeps BLOCKED and arrange supervised independent execution rather than inferring backend permission from hidden buttons.

## 3. Executable cases

### DQ-UAT-01 - Sign-in, roles and sign-out

| Field | Definition |
| --- | --- |
| Purpose / category | Correct credentials establish the stated role; rejected login and logout protect user data. Authentication/access |
| Requirements | FR-01; F-01 AC-01/02/03/04/05 (session expiry and reuse of the old revoked token have separate automated support) |
| Roles | ANON, C1, H1, H2 |
| Preconditions | Execution gates 1/5; no queue mutation is needed |
| Synthetic inputs | C1 email; an intentionally incorrect non-empty password confirmed different from the private demo password, recorded only as `WRONG`; unknown email `uat-nobody@dineq.test`; private correct credential for each role |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | Open BASE/login in a fresh signed-out session. Open BASE/my-queue, then return to /login | Sign-in page is presented; no ticket/private account data is shown |
| 2 | **API as ANON:** `await dqRequest('GET', '/auth/me')` | HTTP 401, error code UNAUTHENTICATED, no user/ticket data |
| 3 | At /login, submit C1 email with WRONG. Repeat using the unknown email with WRONG | Both stay on sign-in and show 401 INVALID_CREDENTIALS with the same generic message; no authenticated session is obtained |
| 4 | Sign in as C1 using the private correct credential | Restaurant queues at /queues; header identifies C1 and CUSTOMER. **API** GET /auth/me returns 200 with C1 email and role CUSTOMER |
| 5 | Choose Logout. Use Back and reload a protected page; **API** GET /auth/me again | Logout request is 204, sign-in is shown after protected reload, API is 401 UNAUTHENTICATED; C1 data is not available. This does not by itself prove reuse of an old token is rejected |
| 6 | In a fresh signed-out session sign in as H1 | Host queue at /host/queues/Q; header is H1/HOST; **API** GET /queues returns the same Q with isAssigned=true |
| 7 | Logout; sign in as H2 | Assigned queues page, notice that no queue is assigned; no Open Host queue link for Q. **API** GET /queues identifies isAssigned=false for Q |
| 8 | Logout H2 | Signed-out state; no queue/ticket changes from this case |

Evidence: rejected-login message for both inputs (without password), C1/H1 role/destination, H2 unassigned notice, protected reload/API 401. Cleanup: logout only. Record each role/input outcome, not one generic login PASS.

### DQ-UAT-02 - Normal join, call, complete and Customer refresh

| Field | Definition |
| --- | --- |
| Purpose / category | A saved Customer ticket passes through the delivered UI/API/database journey. Normal domain journey |
| Requirements | FR-02/03/04/05/06/07; F-02 AC-07/08, F-03 AC-14/15/17 |
| Roles | C1 and H1 in isolated sessions |
| Preconditions | All execution gates; Q OPEN, no active queue ticket and C1 has no active ticket |
| Synthetic input | partySize=4 |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | Sign in as C1; inspect Restaurant queues and **API** GET /queues | DineQ restaurant/OPEN status; 200 with data array, Q from item.id, restaurant {id,name}; C1 sees isAssigned=false |
| 2 | Enter Party size (1-8)=4 and choose Join queue | /my-queue opens; card shows Ticket #N02, Party size 4, WAITING; POST /queues/Q/entries is 201 |
| 3 | **API as C1:** GET /me/entries; record the new entry as T02/N02 and its JSON fields | Exactly one newly created C1 ticket for this join; id=T02, queueId=Q, partySize=4, status=WAITING, createdAt present, calledAt/completedAt null |
| 4 | As H1 refresh Host queue | T02/N02 appears in Waiting list with party size 4, no currently CALLED ticket, FIFO guard passes. Host response exposes ticket fields, not Customer emails |
| 5 | As H1 choose Call Next; inspect its response before any Complete | HTTP 200, returned id=T02 and status=CALLED; Currently called shows N02/4. No other entry is selected |
| 6 | As C1 open My queue and choose Refresh | The recorded T02/N02 is CALLED with party size 4; **API** GET /entries/T02 also returns CALLED with calledAt present |
| 7 | As H1 choose Complete for the currently called N02 | HTTP 200, same T02, COMPLETED, completedAt present; success notice identifies N02; it leaves the active Host list |
| 8 | As C1 Refresh My queue; **API** GET /entries/T02 | Same T02/N02/Q/partySize now COMPLETED; createdAt/calledAt remain recorded, completedAt present |

Evidence: Customer WAITING -> Host CALLED -> Customer COMPLETED with the same UUID/number and visible URL, plus selected sanitized response fields. Save T02/N02 for 08. Cleanup: no further action; retain the completed record/events. Internal JOINED/CALLED/COMPLETED event rows are corroborated by developer tests, not inferred from the screenshot.

### DQ-UAT-03 - Duplicate rejection in WAITING and CALLED

| Field | Definition |
| --- | --- |
| Purpose / category | One Customer has at most one active ticket per queue. Business rule |
| Requirements | BR-02; F-02 AC-09 |
| Roles | C1 and H1 |
| Preconditions | Quiet OPEN Q with no active tickets; C1 has none active; previous completed tickets may remain |
| Synthetic input | partySize=4 for the first join and both duplicates |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | As C1 record **API** GET /me/entries, then join Q through the UI with size 4; record T03/N03 | One new ticket is 201/WAITING; own-ticket count increases by one |
| 2 | Return to Queues and try Join queue with 4 again | Visible 409 DUPLICATE_ACTIVE; no navigation to a new successful ticket |
| 3 | **API as C1:** GET /me/entries and /entries/T03 | Same sole active T03/N03 remains WAITING; count/entry fields are unchanged from immediately after the successful join |
| 4 | As H1 refresh, verify T03 is the FIFO head and choose Call Next | 200, intended T03 becomes CALLED; verify the returned ID |
| 5 | As C1 return to Queues and try Join queue with 4 again | Visible 409 DUPLICATE_ACTIVE also while CALLED |
| 6 | **API as C1:** GET /me/entries and /entries/T03 | Same sole active T03/N03 is CALLED; no additional ticket or changed party size; own-ticket count remains the post-first-join count |
| 7 | As H1 Complete T03; C1 Refresh | Same ticket becomes COMPLETED; both rejected attempts remain rejected |

Evidence: both 409/code outcomes, before/after own-ticket list and the original ID/state. Cleanup: step 7 completes only T03. No claim about raw counter/event rows is made from the list alone; supporting TEST-09 covers those internals.

### DQ-UAT-04 - Party-size boundaries and CLOSED rejection

| Field | Definition |
| --- | --- |
| Purpose / category | UI and backend enforce integer party sizes 1..8; a CLOSED queue cannot accept a valid join. Boundary/business rule |
| Requirements | BR-07/09; F-02 AC-12 |
| Roles | C3, C4, H1; Product Team for separately agreed CLOSED fixture |
| Preconditions | For 04A/B: OPEN Q, no active tickets, C3/C4 have none active, no other actor joins during the numeric-gap check. For 04C: owner announces a CLOSED Q fixture after other mutating cases; no closure/admin UI is expected in Sprint 1 |
| Synthetic inputs | UI 0, 9, 1.5; API partySize values 0, 9, 1.5, string `four`; valid sizes 1 and 8; CLOSED attempt uses numeric 4 |

**04A - native UI validation and backend rejection are separate observations.**

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| A1 | As C3 record own entries, then enter each UI value 0, 9, 1.5 and try Join queue | Browser form validation rejects the attempt, stays on Queues and creates no ticket; browser wording may vary. Confirm no join POST was sent. Do not expect an API 400 from a request the browser never sent |
| A2 | **API as C3:** for each of 0, 9, 1.5 and `four`, call `await dqRequest('POST', '/queues/' + Q + '/entries', {partySize: VALUE})` | Each actual response is HTTP 400 with error.code INVALID_PARTY_SIZE. A text value is a JSON string, not numeric 4 |
| A3 | **API as C3:** compare GET /me/entries with its saved before-list; H1 refreshes list | No C3 ticket added and active Host list unchanged. Preserve individual results for all four API values |

**04B - inclusive bounds and counter observation in a quiet window.**

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| B1 | As C3 join through UI with 1; record T04L/N04L | 201, WAITING, partySize=1 |
| B2 | As C4 record own entries; repeat the four invalid API requests from A2 before any valid C4 join | Each is 400 INVALID_PARTY_SIZE; own entries unchanged; T04L remains WAITING and unchanged |
| B3 | As C4 join through UI with 8; record T04H/N04H | 201, WAITING, partySize=8. With no intervening successful joins, N04H=N04L+1; rejected B2 requests consumed no observed ticket numbers |
| B4 | As H1 refresh and verify the only active entries are these two. Call/Complete T04L, then Call/Complete T04H, verifying each returned ID before Complete | Valid boundaries are accepted, lower ticket called first, both become COMPLETED; no unrelated entry is acted on |

**04C - requires owner-provided CLOSED state; schedule it separately and last among join scenarios.**

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| C1 | Wait for owner confirmation that Q is CLOSED; C3 has no active ticket. Refresh Queues and save own before-list | Q displays CLOSED, notice says new tickets unavailable, Join controls disabled; no queue-administration feature is assumed |
| C2 | **API as C3:** POST /queues/Q/entries with {partySize:4} | HTTP 409 QUEUE_CLOSED; success ticket is not returned |
| C3 | Re-read C3 entries and H1's list, then wait for owner-confirmed OPEN restoration before any later join | No new entry/state change from the rejected request; owner records preparation/restoration. If no CLOSED fixture/window is available, record 04C BLOCKED, not PASS |

Evidence: native UI rejection versus real 400 responses, accepted 1/8 tickets, recorded consecutive numbers under quiet-window conditions, CLOSED UI/409 if performed. Cleanup: B4 retains completed records; owner restores only the agreed fixture. Exact raw counter/event invariants and CLOSED-counter handling have separate TEST-12 support. Record 04A/04B/04C separately; do not claim full AC-12 coverage if 04C was not run.
