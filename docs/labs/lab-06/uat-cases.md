# DineQ - Sprint 1 UAT cases for the HairRoot team

Version 0.2 - preparation metadata updated 25 November 2026; case steps/expected results unchanged from version 0.1, approved by PpAnpt at `1a9d04388c1773152908dfbf28a7b809f9188f86` and merged in [PR #54](https://github.com/PpAnpt/dineq/pull/54). Tracking: [L6-2 / #46](https://github.com/PpAnpt/dineq/issues/46), completed case preparation; [L6-3 / #47](https://github.com/PpAnpt/dineq/issues/47), handoff preparation. Product Team: **DineQ** (Anapat Banjerdsilp / PpAnpt and Siwarak Chatvichai / BBINGOAL). Independent UAT Team: **HairRoot**. Their HairRoot product has separate cases and execution records; no HairRoot booking behavior or AC number is imported here.

All cases/subcases are **NOT EXECUTED**. This document prepares independent testing; source inspection and green developer CI are not independent UAT results or acceptance. Student-reported initial UAT is 25 November 2026 and correction/retest is 26 November by availability. Confirm actual session versions/hours, per-account access and handoff receipt using [coordination](coordination.md) and the [L6-3 / #47 handoff](handoff.md).

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
| Contracts | [F-01](../../sprints/sprint-1/F-01-auth.md), [F-02](../../sprints/sprint-1/F-02-join-queue.md), [F-03](../../sprints/sprint-1/F-03-host-queue.md), [SDS C.6](../../system-sds.md) |

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

COMPLETED means the Host has admitted/seated the group; it does not mean their meal has ended. FIFO uses ticket number regardless of party size. No daily counter reset is assumed.

Before execution, the Product and UAT Teams confirm:

1. Actual version/scope and private account access are agreed; both independent testers are named in the run record.
2. A quiet shared-queue window is reserved. H1 refreshes the Host list before each mutating case. Standalone cases start with no CALLED/WAITING entry, except their explicitly declared fixtures. Each Customer used to join has no active ticket in Q.
3. Existing Lab 5/other users' tickets are preserved. If an unrelated older WAITING or any unrelated CALLED ticket exists, stop before Host mutation and record BLOCKED/setup reason. The Product Team coordinates legitimate preparation; testers do not drain/reset a queue, truncate/reseed the DB or complete someone else's ticket to make a case work.
4. For every Call Next, verify its returned entry ID/visible ticket number is the intended test ticket **before** Complete. If it selects another entry, preserve the observation and stop; do not complete that entry.
5. Roles use isolated browser profiles/browsers or explicit logout/login. A second tab is not a separate session. The Customer and H1 views must show the intended email/role before actions. Use the canonical BASE consistently.

Recommended order: **01 -> 04A/04B -> 02 -> 03 -> 05 -> 06 -> 07 -> agreed 04C -> 08**. Case 06 uses the WAITING fixture from 05; 08 uses the recorded COMPLETED ticket from 02 and creates its own WAITING before-data. These dependencies are intentional. Independently rerunning 06 requires rerunning the fixture step of 05 first; rerunning 08 requires a recorded completed fixture equivalent to 02. Case 04C needs separately announced CLOSED-state preparation and restoration to OPEN before 08.

Cleanup means completing only the case's own tickets through valid H1 Call Next -> Complete after evidence is saved and the FIFO guard passes. Completed tickets/events stay in the database. There is no cancel/delete/reset UI in Sprint 1. If the guard fails or a case stops early, record the remaining test UUIDs/statuses and ask the Product Team to coordinate; do not invent cleanup success.

If a request unexpectedly mutates protected state, a target disappears or the actor/returned ticket is wrong, record the actual FAIL and stop the remaining mutation steps. Preserve the failed run and remaining fixture IDs; obtain clarification/re-preparation before rerunning. Do not silently restore data, change the expected result or continue with invalid fixtures just to finish the case.

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
| 3 | At /login, submit C1 email with WRONG. Repeat using the unknown email with WRONG. After each attempt **API** GET /auth/me | Both stay on sign-in and show 401 INVALID_CREDENTIALS with the same generic message; subsequent /auth/me remains 401 UNAUTHENTICATED, with no authenticated session |
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

### DQ-UAT-05 - Forbidden roles and unassigned Host

| Field | Definition |
| --- | --- |
| Purpose / category | Hiding a UI control is backed by rejection of unauthorized operations; protected state/data remain protected. Forbidden role/assignment |
| Requirements | BR-03/08; F-01 AC-05/06, F-02 AC-13, F-03 AC-14/19/20 |
| Roles | C2 creates fixture; ANON, C1, H2 attempt restricted actions; H1 provides positive control |
| Preconditions | OPEN quiet Q with no active entries; C2 has none active. Use one isolated session for C2 and another that explicitly logs out/in between ANON/C1/H2/H1 |
| Synthetic input | C2 joins with partySize=2; known existing Q and the resulting T05B/N05B |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | As C2 join Q through the UI; **API** GET /me/entries and /entries/T05B. Save the UUID, number and full ticket JSON | New fixture T05B is WAITING, size 2. Keep the C2 session for before/after owner checks |
| 2 | As H1 **API** GET /queues/Q/entries; save active-list before-data, then Logout | 200; T05B exists as the only WAITING entry and is visible to the assigned Host. Positive control prevents a false permission PASS on a missing fixture |
| 3 | As ANON open /host/queues/Q; **API** GET /queues/Q/entries | UI presents sign-in with no Host ticket data; API returns 401 UNAUTHENTICATED. C2 re-reads T05B: unchanged |
| 4 | Sign in as C1 and open /host/queues/Q | Local Access denied view shows 403 FORBIDDEN; no Call Next/Complete control or protected ticket details. This local view may make no Host-list request and is UI evidence only |
| 5 | **API as C1:** GET /queues/Q/entries; POST /queues/Q/call-next; POST /entries/T05B/complete (no body needed) | All three return 403 FORBIDDEN, error JSON without protected data. After each rejection C2 re-reads T05B: same UUID, WAITING, size and timestamps |
| 6 | Logout C1; sign in as H2. Inspect Assigned queues, then directly open /host/queues/Q | Unassigned notice/no Open Host queue link. Direct Host page shows backend 403 FORBIDDEN and no tickets. Its action buttons may be present but disabled; hidden controls are not the expected assignment proof |
| 7 | **API as H2:** repeat the three requests from step 5 | Each returns 403 FORBIDDEN; no ticket/customer data. C2's known fixture stays unchanged after each request |
| 8 | Logout H2; sign in as H1. **API** POST /queues/Q/entries with {partySize:2}, then GET /queues/Q/entries | Join returns 403 FORBIDDEN because joining is Customer-only. The authorized Host list remains equal to the saved before-list, with no extra ticket; C2's fixture is unchanged |

Evidence: UI role/assignment observations, individual 401/403 responses, positive control and owner before/after ticket/list snapshots. API rejections do not necessarily render an error in the UI when sent directly from Console. Cleanup: **leave T05B WAITING for 06**. If 06 will not run, record the fixture and arrange H1 completion only after checking that T05B is still the FIFO target; never silently discard it.

### DQ-UAT-06 - Customer ownership and no disclosure

| Field | Definition |
| --- | --- |
| Purpose / category | One Customer cannot read another Customer's known existing ticket. Ownership/access |
| Requirements | FR-04, BR-08; F-02 AC-11 |
| Roles | C2 owner of T05B; C1 unauthorized reader; H1 for normal cleanup |
| Preconditions | 05 fixture T05B still exists and is WAITING; C2 is available in its isolated session. C1 owns T02 from 02 as positive control (or an explicitly recorded equivalent own ticket) |
| Synthetic inputs | Existing T05B UUID from C2's own response; existing C1 ticket T02; no guessed third-party UUIDs |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | **API as C2:** GET /entries/T05B and /me/entries; save the owner before-result | 200; known fixture ID/number/queue/size/WAITING fields are present to its owner |
| 2 | Sign in as C1. Open My queue; **API** GET /me/entries and /entries/T02 | C1 sees its own cards only; T05B absent from the own-entry array. Known own ticket T02 is 200, proving valid authentication/resource access |
| 3 | **API as C1:** GET /entries/T05B using the exact existing UUID | HTTP 403 FORBIDDEN under the DineQ contract. No data object or B ticket fields/customer data; not a 200, not a missing-resource result |
| 4 | As C2 Refresh and **API** GET /entries/T05B again | Owner still gets 200; same UUID/Q/number/party size/WAITING/timestamps as before. The rejected read neither exposes nor changes the ticket |
| 5 | As H1 refresh; if T05B is the only FIFO target, Call Next, verify returned id=T05B, then Complete | Normal authorized workflow completes only this fixture. C2 Refresh shows the same T05B/N05B COMPLETED |

Evidence: owner 200, C1's own positive-control 200, unauthorized 403/error-only response and unchanged owner state before cleanup. There is no arbitrary Customer ticket-detail UI route in this release: steps 2/3 are explicitly manual API checks alongside the My queue observation. Cleanup: step 5; retain completed data and evidence.

### DQ-UAT-07 - FIFO, unresolved call and invalid transitions

| Field | Definition |
| --- | --- |
| Purpose / category | Lowest ticket number is called first, only one is CALLED, and only CALLED -> COMPLETED is allowed. Business/state rules |
| Requirements | BR-04/05/06; F-03 AC-14/15/16/17/18; empty Call Next AC-24 (TEST-24a) |
| Roles | C1, C2, H1 |
| Preconditions | OPEN Q, no unrelated WAITING/CALLED; C1 and C2 have no active entries. 06 cleanup is complete if that sequence was used |
| Synthetic inputs | C1 size 3; C2 size 5. Actual ticket numbers are recorded, not assumed to be 1/2 |

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| 1 | As C1 join with 3, record T07A/N07A. Then as C2 join with 5, record T07B/N07B | Both are 201/WAITING, own party sizes correct; N07A<N07B |
| 2 | As H1 Refresh Host queue and **API** GET /queues/Q/entries | Both WAITING, sorted N07A then N07B, correct party sizes, no CALLED entry or exposed Customer emails |
| 3 | As H1 choose Call Next and verify returned ID | 200, T07A becomes CALLED; T07B stays WAITING. Selection follows ticket number, not party size |
| 4 | **API as H1:** POST /entries/T07B/complete while B is WAITING | 409 INVALID_TRANSITION; C2's before/after GET /entries/T07B is unchanged, still WAITING |
| 5 | As H1 choose Call Next again while A remains CALLED | Visible 409 UNRESOLVED_CALLED; after loading finishes the Host list still has only A CALLED and B WAITING; both owners confirm unchanged ticket states |
| 6 | As H1 Complete A through the UI; C1 Refresh and save its completed JSON | 200, same T07A COMPLETED; B remains WAITING |
| 7 | **API as H1:** POST /entries/T07A/complete again | 409 INVALID_TRANSITION; C1's completed ticket fields, including completedAt, remain identical to step 6 |
| 8 | As H1 choose Call Next; verify returned id=T07B before Complete, then Complete | B alone transitions CALLED -> COMPLETED, correct size 5; C2 sees the same completed UUID/number |
| 9 | With authorized Host GET /queues/Q/entries now returning data=[], choose Call Next; afterward re-read the Host list and both owners' completed entries | 404 NO_WAITING_ENTRY, UI message visible, active list still empty and both completed records unchanged. If another entry arrived, the empty-queue precondition is not met: do not call it to finish this check |

Evidence: FIFO list, returned IDs and per-owner states, 409 results, unchanged rejected-transition snapshots, empty-queue 404 if executed. There is no UI Complete button for WAITING/already-completed entries; steps 4/7 are supporting manual API checks. Cleanup: both test tickets are completed normally. Internal event counts are corroborated by TEST-15..18/24a, not claimed from the UI alone.

### DQ-UAT-08 - Recorded state in new sessions and after an agreed app restart

| Field | Definition |
| --- | --- |
| Purpose / category | The same persisted ticket survives reload/new session and an owner-coordinated application restart using the same database. State/persistence |
| Requirements | FR-04, NFR-02; F-03 AC-17 and F-02 AC-21 (the internal JOINED-event requirement has separate DB-test support) |
| Roles | C1 owns completed T02; C2 creates a WAITING fixture T08; Product Team coordinates app operation; HairRoot independently observes/compares |
| Preconditions | Recorded T02 from 02/equivalent still exists. Q OPEN and empty of active tickets, C2 has none active. For 08B only: agreed owner-controlled restart window, actual version metadata before/after, and no ticket mutations during the window |
| Synthetic inputs | Retained completed T02/N02, plus C2 join partySize=2 to obtain T08/N08 |

**08A - user-facing state and new sessions.**

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| A1 | As C1 find the recorded T02/N02 card in My queue, not just the newest card. **API** GET /entries/T02; save JSON | 200, same completed UUID/Q/number/partySize=4 and recorded timestamps |
| A2 | As C2 join through UI with 2; record T08/N08. **API** GET /entries/T08; save JSON | 201, WAITING, correct Q/number/size; createdAt present, calledAt/completedAt null. Do not call this ticket yet |
| A3 | Reload each Customer page and find the respective recorded card; repeat the two GET requests | COMPLETED T02 and WAITING T08 remain; all ticket fields equal their respective before-data |
| A4 | Logout each Customer; sign in again in a fresh isolated session, find the recorded card and repeat the GET | Same UUID/Q/number/partySize/state/timestamps after a new session; signing out did not remove the ticket |

**08B - actual app restart; reload alone does not satisfy AC-21.**

| Step | Independent tester action | Specific expected result |
| --- | --- | --- |
| B1 | Save fresh before screenshots/API snapshots for T02/T08 and actual full commit/revision/time; obtain Product Team announcement of the agreed operation | Complete before-record exists before the operation. Without an agreed operation/version record, mark 08B BLOCKED; 08A may have its own result |
| B2 | Product Team performs/records the approved application restart with the same DB, then announces readiness. Testers wait; they do not run cloud/DB commands | Owner supplies actual operation/time and relevant revision/instance evidence, stating any inference/limits. No data reset or Cloud SQL restart is needed. If a code redeploy occurs, record its new tested version and agreed affected retests |
| B3 | Independently sign in again as C1/C2 if needed, Refresh, locate T02/T08 and repeat owner GET /entries requests | Same UUIDs, queue, numbers, sizes, COMPLETED/WAITING and timestamps as B1; no missing or replaced record |
| B4 | Compare the selected full ticket JSON and screenshots before/after; record the actual after-version and each result | Matching state supports persistence across the documented operation. A changed instance/revision alone or an old Lab5 result does not prove this new UAT run; a page refresh alone is not a restart |

Evidence: separate 08A/08B results, both before/after IDs/fields/UI and owner's real operation/version record. No JOINED/CALLED/COMPLETED event-log screen exists, so raw event persistence is TEST-21 support rather than a manual observation. Do not mark overall 08/AC-21 PASS from 08A alone if the agreed scope requires 08B. Required BLOCKED work prevents an unsupported acceptance decision.

Cleanup: only after all before/after evidence is saved, H1 may Call/Complete T08 if it is still the intended FIFO target. If 08B is postponed, record BLOCKED and coordinate this cleanup; a later restart check needs a new recorded WAITING fixture/baseline, not an invented comparison to the now-completed one. Preserve T02 and all completed records. Cleanup must not rewrite the result of the original run.

## 4. Coverage and limits of observation

| Lab 6 minimum category | Delivered draft case |
| --- | --- |
| Normal domain journey | DQ-UAT-02, visible Customer -> assigned Host -> Customer flow |
| Business rule/boundary | DQ-UAT-03/04/07 |
| Forbidden role/ownership | DQ-UAT-05/06, UI observations plus independently performed manual API denials |
| State/history/persistence | DQ-UAT-08, with new-session and actual-restart results recorded separately |
| Additional authentication | DQ-UAT-01 |

The table below describes planned coverage, not execution results. Developer test references provide supporting checks for internal or non-UI behavior; this document does not assert those tests were rerun while drafting. They do not replace the HairRoot team's independent user-facing execution.

| DineQ AC | Independent case / observation planned | Supporting scope or limit |
| --- | --- | --- |
| AC-01 | 01 correct Customer/Host login with a fresh session | TEST-01 also checks stored hashes/session internals |
| AC-02 | 01 wrong/unknown login, generic 401 | Full negative-input variants in TEST-02 |
| AC-03 | 01 current-user role/email | Session expiry is TEST-03 support; do not change live session expiry/DB for this pack |
| AC-04 | 01 logout and protected reload | Reusing the old revoked token is TEST-04 support; a signed-out reload alone is partial coverage |
| AC-05 | 01/05 anonymous denial/no private data | Malformed-UUID authentication precedence additionally in TEST-05 |
| AC-06 | 05 Customer Host-only requests, unchanged known fixture | TEST-06 supports raw DB invariants |
| AC-07 | 01/02/05 queue data/id/assignment roles | Empty queue-list result requires a separate owner fixture or TEST-07; this pack does not remove queues |
| AC-08 | 02 real join/WAITING/read-back | JOINED event row is TEST-08 support |
| AC-09 | 03 duplicate WAITING and CALLED, no extra own entry | Counter/event invariants in TEST-09 |
| AC-10 | Automated support only | TEST-10 real 30-Customer concurrency; sequential manual joins are not that concurrency test |
| AC-11 | 06 known other-owner entry returns 403, owner still reads it | TEST-11 support |
| AC-12 | 04A native validation, 04A/B manual API rejection, valid 1/8 and quiet-window number check; 04C CLOSED rejection if actually prepared | Record subcases separately; full AC coverage cannot be claimed without the required CLOSED check. Raw event/counter checks in TEST-12 |
| AC-13 | 05 Host join rejected | TEST-13 support |
| AC-14 | 02/07 assigned list/FIFO, 05 unassigned denial | TEST-14 support |
| AC-15 | 07 two-ticket FIFO and returned target UUID | TEST-15 also checks event/timestamp transaction details |
| AC-16 | 07 unresolved CALLED -> 409 and unchanged states | TEST-16 support |
| AC-17 | 02/07/08 same completed ticket read back | COMPLETED event row in TEST-17 |
| AC-18 | 07 supporting manual API completion of WAITING/already-COMPLETED -> 409 | Those invalid transitions have no UI button; TEST-18 checks raw DB invariants |
| AC-19 | 05 H2 list/call/complete denial on existing resources | TEST-19 support |
| AC-20 | 05 Customer call/complete denial | TEST-20 support |
| AC-21 | 08B actual app restart with the same recorded tickets/DB | 08A refresh/login alone is insufficient; internal JOINED-event persistence is TEST-21 support |
| AC-22 | Automated support only | TEST-22 foreign-Origin rejection; this same-origin browser helper does not spoof Origin or disable protections |
| AC-23 | Automated support only | TEST-23 malformed/missing resource and auth precedence; no arbitrary UUID probing in this pack |
| AC-24 | 07 step 9 empty Call Next (24a) | TEST-24b..d cover malformed/missing Host resources and role/auth precedence; not claimed as independent UI execution |

Supporting source files: [F-01 tests](../../../server/tests/f01-auth.test.js), [F-02 tests](../../../server/tests/f02-join.test.js), [F-03 tests](../../../server/tests/f03-host.test.js), [STS](../../sprints/sprint-1/test-spec.md). Report any unexecuted supporting evidence as such; do not copy historical green counts into a new run record.

## 5. Independent execution and evidence record

HairRoot records actual DineQ observations here or in an equivalent copied execution sheet retaining these IDs. Both independent team members participate, with names attached to actual actions/cases. DineQ authors may help explain setup but cannot fill in an independent PASS/acceptance on the testers' behalf. DineQ's later execution of HairRoot uses a separate product record under #48.

| Case/subcase | Initial status | Actual run-record reference |
| --- | --- | --- |
| DQ-UAT-01 | NOT EXECUTED | Not recorded |
| DQ-UAT-02 | NOT EXECUTED | Not recorded |
| DQ-UAT-03 | NOT EXECUTED | Not recorded |
| DQ-UAT-04A | NOT EXECUTED | Not recorded |
| DQ-UAT-04B | NOT EXECUTED | Not recorded |
| DQ-UAT-04C | NOT EXECUTED | Not recorded |
| DQ-UAT-05 | NOT EXECUTED | Not recorded |
| DQ-UAT-06 | NOT EXECUTED | Not recorded |
| DQ-UAT-07 | NOT EXECUTED | Not recorded; identify the empty-queue substep outcome explicitly |
| DQ-UAT-08A | NOT EXECUTED | Not recorded |
| DQ-UAT-08B | NOT EXECUTED | Not recorded |

Copy this record for every actual run; retain earlier FAIL/BLOCKED runs when retesting:

| Field | To be completed from actual execution |
| --- | --- |
| Run ID / case/subcase / attempt | Not recorded |
| Tester name and team / second participant's actual contribution | Not recorded |
| Start/end date-time and timezone | Not recorded; use Asia/Bangkok or explicit UTC offset |
| Actual product URL, full commit/tag, deployed revision | Not recorded; confirm with Product Team at session start |
| Actual role/account labels, Q, entry UUIDs/numbers, party sizes | Not recorded; credentials excluded |
| Preconditions and before-state/version evidence | Not recorded; state whether each gate was met |
| Actions performed and actual inputs | Not recorded; distinguish UI steps and supporting manual API requests |
| Actual observed result per step/subcase | Not recorded; write what happened, including codes/status/state, not copied expected results |
| After-state comparison | Not recorded; for negative cases show no protected-state change/disclosure |
| Execution result | Once run: PASS / FAIL / BLOCKED with reason; preparation starts NOT EXECUTED |
| Evidence IDs / files / time / version | Not recorded |
| Finding Issue / reported owner / notification outcome | Not recorded, or explicit no finding for this actual run |
| Cleanup action / remaining fixtures / interruption | Not recorded; retain IDs/statuses and owner agreement |

Give each selected capture/log an ID such as `DQ-E02-05-R01`, naming the case/step/attempt. Its caption must identify action, expected and actual result, time, relevant commit/revision and URL. Capture the visible UI after Loading/Checking session has finished; a loading-only picture is not ticket proof. Record the specific ticket number/UUID match, not just matching display text from another record. Supporting API captures show sanitized status/JSON, not cookies or login payloads.

At minimum retain the normal journey's WAITING/CALLED/COMPLETED observations and a negative/access outcome with before/after protected state. Add the other captures/results needed to substantiate every executed case. The Lab6 PDF later embeds the cases, selected readable observations and findings/decisions directly; links alone are not the assessed material.

## 6. Results, findings and next handoff

- Missing access, version lock, account/queue preparation, CLOSED fixture or agreed restart before execution is **BLOCKED**, with the unmet precondition recorded. It is not a PASS. Agree required subcases before testing; do not drop a failing contract requirement afterward to obtain acceptance.
- With verified preconditions, an observed mismatch is **FAIL** and needs a reproducible finding: case/AC, owner/reporter, version/time, inputs, steps, expected/actual, user-impact severity and evidence. Record any actual external interference; do not erase the run or silently substitute another successful attempt.
- A valid run is PASS only for the steps/subcases actually completed with their expected observations. Conditional/incomplete subcases stay separately visible. An old CI result or Lab5 screenshot is supporting history, not a new independent UAT run.
- The Product Team classifies received findings under #49 and fixes accepted defects under #50 with genuine regression RED/GREEN, teammate review, CI and a coordinated release. No finding is fabricated by this pack. If no legitimate defect is found, the TA-approved isolated exercise remains a separate requirement.
- Only the independent UAT team gives the final version-bound Accepted / Accepted with explicit minor limitations / Not Accepted decision under #51. Required BLOCKED cases and unresolved critical/major defects must not be hidden by a sign-off.
- Case preparation passed peer review in #46/PR #54. L6-3 / #47 provides the safe handoff, data preparation/cleanup responsibilities and private credential acknowledgement; those actual readiness confirmations are separate from case approval.

## Revision history

| Version | Date | Change / execution status |
| --- | --- | --- |
| 0.1 | 2026-11-24 | First DineQ-specific executable draft from F-01/F-02/F-03 and the delivered UI/API; eight cases, declared dependencies, coverage limits and blank execution records. All cases NOT EXECUTED; peer review pending |
| 0.2 | 2026-11-25 | Record completed v0.1 case review/PR #54 integration and student-reported UAT dates for #47 handoff; no case steps, expected outcomes, AC coverage or execution results changed. All results NOT EXECUTED |
