# Release AC assertion ledger

Generated from the actual Vitest JSON report, not inferred from source names.

Tested commit: `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`. Command: `npm run test:record -- release-full-run`.
Report: [release-full-run.json](release-full-run.json). 108 passed, 0 failed, 0 skipped; 100 feature cases and 8 infrastructure cases.

| AC | Actual file | Actual recorded test title | Result |
| --- | --- | --- | --- |
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
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on post is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on put is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on patch is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on delete is rejected before Session and JSON parsing with no DB changes | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: foreign Origin on Login cannot create a session even with valid credentials | PASS |
| AC-22 | `server/tests/f01-auth.test.js` | TEST-22 / AC-22: matching Origin permits Login, and foreign Origin does not block a read-only request | PASS |
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
| AC-21 | `server/tests/f02-join.test.js` | TEST-21 / AC-21: ticket and JOINED event survive a new app instance with a new DB pool | PASS |
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
| AC-24 | `server/tests/f03-host.test.js` | TEST-24a / AC-24: Call Next on an assigned queue with neither WAITING nor CALLED ('no entries at all') -> 404 NO_WAITING_ENTRY | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24a / AC-24: Call Next on an assigned queue with neither WAITING nor CALLED ('only a COMPLETED entry') -> 404 NO_WAITING_ENTRY | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24b / AC-24: host1@dineq.test with a valid but absent UUID gets 404 NOT_FOUND on all three endpoints (not 403) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24b / AC-24: host2@dineq.test with a valid but absent UUID gets 404 NOT_FOUND on all three endpoints (not 403) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24c / AC-24: host1@dineq.test with not-a-uuid gets 400 VALIDATION_ERROR on all three endpoints | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24c / AC-24: host2@dineq.test with not-a-uuid gets 400 VALIDATION_ERROR on all three endpoints | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24d / AC-24: anonymous -> 401 UNAUTHENTICATED and Customer -> 403 FORBIDDEN before UUID/resource checks (00000000-0000-4000-8000-000000000000) | PASS |
| AC-24 | `server/tests/f03-host.test.js` | TEST-24d / AC-24: anonymous -> 401 UNAUTHENTICATED and Customer -> 403 FORBIDDEN before UUID/resource checks (not-a-uuid) | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-01: health endpoint returns the public success envelope | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-02: missing config fails fast and test reset rejects unsafe database URLs | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-03: migration creates all tables, UUID IDs, timestamptz fields and foreign keys | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-04: PostgreSQL exposes both partial unique indexes and required CHECK constraints | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-05: rerunning migrations and seed preserves identities, rows and ticket counter | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-06: seed contains 30 hashed customers and correctly scoped Hosts | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-07: DB rejects invalid party sizes, statuses, counters and foreign keys | PASS |
| Infrastructure | `server/tests/infra.test.js` | INFRA-08: unique indexes and timestamp/event constraints reject inconsistent rows | PASS |
