# CPE 334 Lab 6: Independent UAT and Defect Management

**HairRoot**, hair clinic appointment booking (Group Project Theme 1). Group **TH-060_P1**, section 131.

| | |
|---|---|
| **Students** | ไอโว ปีเตอร์ อัลวิน รันเน่, 67070501051, GitHub `alvin777777`<br>ทิฐินันท์ สอบกิ่ง, 67070501018, GitHub `Ohmmykung09` |
| **Sprint 1 scope** | Sign-in and roles; a specialist adds times; a customer books by service, day, and time; exclusive booking; own-booking and own-schedule views (Part A, Section 1) |
| **Repository** | https://github.com/alvin777777/hairroot (public) |
| **Sprint 1 baseline** | Tag `v0.1.0-sprint1`, commit `d1e8d81` |
| **Tested releases** | R01: `ac0a57b`, Cloud Run revision `hairroot-sha-ac0a57b9eb87-44992339630-1`. Targeted R02 and accepted release: `cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d`, HairRoot-supplied revision `hairroot-sha-cbaf1baa38a5-45975306714-2` |
| **Deployed URL** | https://hairroot-368003298307.asia-southeast1.run.app |
| **Partner team** | ซวยแล้วหนูคู่หูพี่มาแล้ว: Anapat Banjerdsilp (67070501049) and Siwarak Chatvichai (67070501086). Product DineQ, restaurant walk-in queue (Theme 9). Repository https://github.com/PpAnpt/dineq |
| **Independent UAT testers of HairRoot** | DineQ: Siwarak Chatvichai operated runs R01 and R02 (Anapat Banjerdsilp's part is not recorded) |
| **Final UAT decision for HairRoot** | **Accepted**, stated by Siwarak Chatvichai for DineQ on 27 Nov 2026 for `cbaf1ba`; see Part D.2 and the transcribed decision. |

<!-- TOC -->

## Version table

| Role | Commit or tag | Cloud Run revision | Notes |
|---|---|---|---|
| Sprint 1 baseline | `v0.1.0-sprint1` (`d1e8d81`) | — | Accepted Sprint 1 contract and scope |
| Release under UAT | `ac0a57b` | `hairroot-sha-ac0a57b9eb87-44992339630-1` | It adds the Lab 5 changes (Docker, CI/CD, version footer), with no Sprint 1 behaviour change, and the guided flow (C-02) |
| Defective commit(s), if any | `ac0a57b` (topic length uses `topic.length`) | `hairroot-sha-ac0a57b9eb87-44992339630-1` | HR-F01 observed here by DineQ, run R01 |
| Regression test (RED) | `c569be9`, `5f6c1f4`, `fe1af6f` (PR #58) | — | Each test failed before the commit that follows it |
| Fix (GREEN) and release PR | `edaa6cf`, `0e489d0`, `dfc9364`; PR #58 merged as `76a4506`; release PR #59 merged into `main` as `cbaf1ba` | `hairroot-sha-cbaf1baa38a5-45975306714-2` | Deploy run 45975306714, 27 Nov 16:44 Bangkok |
| Revision re-tested by the UAT team | `cbaf1ba` | `hairroot-sha-cbaf1baa38a5-45975306714-2` | DineQ run R02, 27 Nov 2026 |

Each release into `main` passes through `sprint-1-staging` as a merge commit, so a release commit on `main` differs from the staging commit it merges. The deployed footer *Version abc1234* and `GET /api/version` give the commit actually served.

## Part A: UAT preparation and handoff

**Cases.** HairRoot's seven Sprint 1 UAT cases are in Appendix A, and they cover every required category:

| Category | Case | AC |
|---|---|---|
| Normal domain journey | UAT-01 | AC-10, AC-14, AC-15, AC-20, AC-22, AC-27 |
| Business rule | UAT-02 | AC-16 (AC-17 by automated T-17) |
| Boundary | UAT-03, UAT-07 | AC-11, AC-12, AC-15b |
| Forbidden role or ownership | UAT-04 | AC-05, AC-06, AC-21, AC-23 |
| State and persistence | UAT-05 | AC-14, AC-20, AC-22, AC-24 |
| Authentication | UAT-06 | AC-01, AC-02, AC-03 |

**Handoff.** Appendix A, Section 1 covers:
- the tested scope, and what is excluded as Sprint 2 or 3
- account labels S1, S2, and C1 to C3 with their roles, but no passwords
- data setup and independence: each case creates its own time; only UAT-05 follows UAT-01
- cleanup, and the rule that the Product Team announces deployments in advance
- how to report findings: the *UAT finding* Issue form, label `uat`

**Credentials.** The demo password is in Secret Manager. ทิฐินันท์ gave it to the UAT team privately by Discord direct message; DineQ's coordination log records receipt on 25 November 2026. No value is recorded anywhere. It does not appear in this PDF, in Git, or in any screenshot.

**Automated support.** E2E tests cover the same paths as UAT-01, UAT-02, and UAT-04: T-31, T-32, and T-39 (added in PR #54). They run in CI on every PR. They support the UAT but do not replace independent testing.

**Sessions with the partner team.**

| Session | Date and time | Who | Release | Outcome |
|---|---|---|---|---|
| Handoff | 24 Nov 2026 (cases v0.1); 26 Nov 2026 (v0.2 with UAT-07) | Both teams, Discord server *รอดไหมปี3* | `ac0a57b` | DineQ recorded receipt and the file hash of each version in their `coordination.md` |
| Initial UAT of HairRoot (run R01) | 26 Nov 2026, 17:46 to 18:27 Bangkok | Siwarak Chatvichai (DineQ); Anapat's part is not recorded in DineQ's run record | `ac0a57b` (footer) | 5 PASS, 1 FAIL (UAT-07), 1 BLOCKED (UAT-05 step 4) |
| Our UAT of DineQ (final run) | 25 Nov 2026, 21:19 to 21:24 Bangkok | ทิฐินันท์ (Playwright-driven session); ไอโว ran DQ-UAT-01 steps 1 to 3 separately on 26 Nov 19:33 | `17c8b90` (handoff value) | 9 PASS, 2 BLOCKED (DQ-UAT-04C, DQ-UAT-08B), no FAIL |
| Re-test after corrections (run R02) | 27 Nov 2026, 17:00 to 17:24 Bangkok | Siwarak Chatvichai (DineQ) | `cbaf1ba` (footer and `/api/version`) | UAT-07-R02 PASS (9 of 9 emoji topics rejected, non-emoji topic booked); UAT-05 step 4 PASS |

## Part B: Independent execution of the partner team's product

**Product tested.** DineQ (restaurant walk-in queue management, CPE 334 Theme 9) by ซวยแล้วหนูคู่หูพี่มาแล้ว.

| | |
|---|---|
| Release under test | Commit `17c8b90` on `main` (merge of their PR #42) |
| Cloud Run revision | `s21271a0d-00005-rdp` |
| URL | https://s21271a0d-4d7hbszvwq-as.a.run.app/login |
| Deploy evidence | https://github.com/PpAnpt/dineq/actions/runs/44986245220 |
| Cases received | DQ-UAT-01 to DQ-UAT-08B, `docs/labs/lab-06/uat-cases.md` and `handoff.md` in their repository |

ทิฐินันท์ ran the final pass on 25 November 2026 with a Playwright script that signs in through the visible login form and records each observation; no password, cookie, or token was recorded. Earlier attempts that evening (preflight at 20:40, and partial runs with cleanup) are kept in the raw logs but are not counted. ไอโว ran DQ-UAT-01 steps 1 to 3 independently on 26 November 2026 at 19:33 Bangkok (E-B7 to E-B9). The remaining steps of that run need a correct password, which ไอโว did not have at the time, so they are not claimed. The commit and revision are the values from DineQ's handoff; the DineQ owners have not yet confirmed them against the live service. Results are as observed, not copied from expected results.

| Case | Tester | Time (25 Nov, Bangkok) | Tested version | Inputs | Actual result | Result | Evidence |
|---|---|---|---|---|---|---|---|
| DQ-UAT-01 Sign-in, roles, sign-out | ทิฐินันท์ | 21:19:29 | `17c8b90` | Unknown email; Customer, assigned Host H1, unassigned Host H2 | Wrong credentials gave `401 INVALID_CREDENTIALS`; each role saw its own pages; H2 denied the queue; after logout a protected page returned to sign-in | PASS | E-B1 |
| DQ-UAT-02 Join, call, complete, refresh | ทิฐินันท์ | 21:19:45 | `17c8b90` | Customer joins with party size 4; H1 calls and completes | The same ticket #12 went WAITING, CALLED, COMPLETED, and the customer saw each state after refresh | PASS | E-B2, E-B3 |
| DQ-UAT-03 Duplicate join while WAITING or CALLED | ทิฐินันท์ | 21:19:47 | `17c8b90` | Second join by the same customer | `409 DUPLICATE_ACTIVE` in both states; only the original ticket #13 existed and was completed | PASS | E-B4 |
| DQ-UAT-04A Invalid party sizes | ทิฐินันท์ | 21:19:39 | `17c8b90` | 0, 9, 1.5 in the UI; also 0, 9, 1.5, "four" by API | All rejected; no ticket created | PASS | E-B5 |
| DQ-UAT-04B Valid party sizes 1 and 8 | ทิฐินันท์ | 21:19:42 | `17c8b90` | 1, then 8 | Both accepted (#10, #11) and later completed | PASS | Case summary only |
| DQ-UAT-04C Join a CLOSED queue | ทิฐินันท์ | 21:19:55; context captured 21:24 | `17c8b90` | — | Not run: the queue was OPEN, and only DineQ can close and reopen it | BLOCKED | Blocked-case summary |
| DQ-UAT-05 Customer and unassigned Host forbidden | ทิฐินันท์ | 21:19:50 | `17c8b90` | Customer and H2 call Host actions | 401/403 for every attempt; C2's ticket stayed WAITING | PASS | E-B6 |
| DQ-UAT-06 Ticket ownership | ทิฐินันท์ | 21:19:51 | `17c8b90` | C1 requests C2's ticket by API | Denied; C2's ticket unchanged | PASS | Case summary only |
| DQ-UAT-07 FIFO and invalid transitions | ทิฐินันท์ | 21:19:55 | `17c8b90` | Two waiting tickets; invalid transitions; empty queue | Called in arrival order; invalid transitions rejected; empty queue returned 404 | PASS | Case summary only |
| DQ-UAT-08A Reload and new session | ทิฐินันท์ | 21:19:59 | `17c8b90` | Reload and a fresh session for C1 and C2 | T02 still COMPLETED and T08 still WAITING | PASS | Case summary only |
| DQ-UAT-08B Persistence after restart | ทิฐินันท์ | 21:19:59; baseline captured 21:24 | `17c8b90` | — | Not run: DineQ has not performed and announced a restart; T08 is kept as the baseline | BLOCKED | Blocked-case summary |

The [case-summary report](evidence/DQ-run-summary-2026-11-25.json) and [blocked-case summary](evidence/DQ-blocked-summary-2026-11-25.json) are preserved here. They do not retain the individual API request/response payloads for DQ-UAT-04A, 04B, 06, 07, or 08A, so those API assertions cannot be independently verified from the evidence in this repository. The screenshot E-B6 supports DQ-UAT-05 only; it does not prove DQ-UAT-06 ticket ownership. Each screenshot has a banner with its evidence name, UTC time, and URL. All accounts are DineQ's synthetic accounts.

![E-B1](evidence/DQ-01-invalid-login.png)
*E-B1. DQ-UAT-01, 21:19:23. Action: sign in with the unknown email `uat-nobody@dineq.test`. Expected: rejected without signing in. Actual: `401 INVALID_CREDENTIALS: Email or password is incorrect`, still on the sign-in page. **PASS***

![E-B2](evidence/DQ-02-customer-waiting.png)
*E-B2. DQ-UAT-02, 21:19:43. Action: the customer joins with party size 4 and opens *My queue*. Expected: a new WAITING ticket. Actual: ticket #12, party size 4, WAITING. **PASS***

![E-B3](evidence/DQ-02-completed.png)
*E-B3. DQ-UAT-02, 21:19:44. Action: host H1 calls and completes the next ticket. Expected: the same ticket becomes COMPLETED. Actual: *Ticket #12: COMPLETED.* **PASS***

![E-B4](evidence/DQ-03-duplicate-waiting.png)
*E-B4. DQ-UAT-03, 21:19:46. Action: the customer with WAITING ticket #13 joins again. Expected: rejected; no second ticket. Actual: `409 DUPLICATE_ACTIVE: You already have an active ticket in this queue`. **PASS***

![E-B5](evidence/DQ-04A-invalid-boundaries.png)
*E-B5. DQ-UAT-04A, 21:19:39. Action: enter party size 1.5 (after 0 and 9) and join. Expected: rejected; queue unchanged. Actual: the browser's number check blocked submission (field outlined), and the run log records 0, 9, 1.5, and "four" also rejected by the API with no ticket created. **PASS***

![E-B6](evidence/DQ-05-customer-host-403.png)
*E-B6. DQ-UAT-05 access check, 21:19:50. Action: a customer opens the host page of the queue. Expected: denied with nothing of the queue shown. Actual: `403 FORBIDDEN: This page is not available for your role`. The DQ-UAT-06 ticket-ownership check was recorded only in the local case-summary report; its request and response were not retained here. **PASS for this DQ-UAT-05 step***

**Second tester, ไอโว (26 November 2026, 19:33 Bangkok, `17c8b90` per handoff).** The browser steps were scripted; no password was entered or recorded.

| Case | Tester | Time (26 Nov, Bangkok) | Inputs | Actual result | Result | Evidence |
|---|---|---|---|---|---|---|
| DQ-UAT-01 step 1 | ไอโว | 19:33 | Signed out; open `/my-queue` | Sign-in page; `/api/auth/me` 401 | PASS | E-B7 |
| DQ-UAT-01 step 3 | ไอโว | 19:33:52 | `customer03@dineq.test` with a made-up wrong password | `401 INVALID_CREDENTIALS`; still signed out (`/api/auth/me` 401) | PASS | E-B8 |
| DQ-UAT-01 step 3 | ไอโว | 19:33 | `uat-nobody@dineq.test` with the same wrong password | The same generic message; still signed out | PASS | E-B9 |

![E-B7](evidence/DQ-ALVIN-A01-anon-my-queue.png)
*E-B7. DQ-UAT-01 step 1, 26 Nov 2026 19:33 Bangkok, tester ไอโว. Action: open `/my-queue` while signed out. Expected: sign-in page, no private data. Actual: *Sign in to DineQ* shown; `/api/auth/me` returned 401.* **PASS**

![E-B8](evidence/DQ-ALVIN-A02-wrong-password-c1.png)
*E-B8. DQ-UAT-01 step 3, 26 Nov 2026 19:33:52 Bangkok, tester ไอโว. Action: C1's email with a wrong password. Expected: 401 INVALID_CREDENTIALS, no session. Actual: `401 INVALID_CREDENTIALS: Email or password is incorrect`; `/api/auth/me` 401. The password field is empty in the capture.* **PASS**

![E-B9](evidence/DQ-ALVIN-A03-unknown-email.png)
*E-B9. DQ-UAT-01 step 3, 26 Nov 2026 19:33 Bangkok, tester ไอโว. Action: unknown email `uat-nobody@dineq.test`. Expected: the same generic message, so the account's existence is not revealed. Actual: identical message; no session.* **PASS**

## Part C: Defect reporting and triage

### C.1 Findings we reported to the partner team

| ID | Case and requirement | Version | Steps, expected, and actual | Severity and user impact | Evidence | Partner's response |
|---|---|---|---|---|---|---|
| None | Every executed DineQ case passed. DQ-UAT-04C and DQ-UAT-08B are BLOCKED on DineQ-owned setup (a CLOSED queue, and a restart), not failures | `17c8b90` | — | — | — | Both remain BLOCKED: DineQ did not prepare a CLOSED queue or perform a restart before the deadline |

### C.2 Results of the independent UAT of HairRoot

DineQ ran HairRoot's cases v0.2 (UAT-01 to UAT-07) against the live service on 26 November 2026, run R01. The footer showed *Version ac0a57b* throughout. Their full record is `docs/labs/lab-06/hairroot-run-2026-11-26-R01.md` in https://github.com/PpAnpt/dineq (commit `26070fc`): 43 steps, 39 PASS, 3 FAIL, and 1 BLOCKED.

| Case | Result | What the UAT team observed |
|---|---|---|
| UAT-01 | PASS | Booking 4 confirmed, found again in *My bookings*, and shown to S1 with the customer and topic |
| UAT-02 | PASS | C2 won the time; C3's stale request got *Another customer has just taken this time*; neither list was wrong. Sequential, not concurrent |
| UAT-03 | PASS | Past start and overlap rejected; adjacent, 15- and 120-minute times accepted; topics of 2 and 201 characters rejected, 3 and 200 accepted |
| UAT-04 | PASS | C2 got *Booking not found.* for C1's booking; C2 was redirected from `/schedule`; a visitor was sent to sign-in; S2 saw only its own schedule |
| UAT-05 | BLOCKED | Steps 1 to 3 passed in a fresh session. Step 4 needs a redeployment announced by HairRoot, which had not happened |
| UAT-06 | PASS | Wrong and unknown credentials gave the same generic message; logout, Back, and reload returned to sign-in |
| UAT-07 | FAIL | The two-symbol topic `🙂🙂` was accepted as booking 2 and used up the time (finding HR-F01). The three-symbol control passed |

![HR-E01-05-R01](evidence/HR-E01-05-R01.png)
*HR-E01-05-R01. UAT-01 step 5, 26 Nov 2026 18:11:40 Bangkok, Version ac0a57b, actor C1. Action: C1 confirms a booking with topic `UAT hairline review`; expected: "Your booking is confirmed." with the details; actual: Booking 4 confirmed with the right time, specialist, service and topic.* **PASS**.

![HR-E02-04-R01](evidence/HR-E02-04-R01.png)
*HR-E02-04-R01. UAT-02 step 4, 26 Nov 2026 18:18:49 Bangkok, Version ac0a57b, actor C3. Action: C3 confirms the time C2 has just booked; expected: "Another customer has just taken this time"; T2 no longer offered; actual: The message shown; T2 removed from the list.* **PASS**.

![HR-E03-10-R01](evidence/HR-E03-10-R01.png)
*HR-E03-10-R01. UAT-03 step 10, 26 Nov 2026 18:14:03 Bangkok, Version ac0a57b, actor C1. Action: C1 books with the 200-character topic; expected: Booking confirmed with the full topic; actual: Booking 5 confirmed; detail shows all 200 characters.* **PASS**.

![HR-E04-02-R01](evidence/HR-E04-02-R01.png)
*HR-E04-02-R01. UAT-04 step 2, 26 Nov 2026 18:19:41 Bangkok, Version ac0a57b, actor C2. Action: C2 opens the address of C1's booking 4; expected: "Booking not found."; nothing of C1 shown; actual: Only "Booking not found."; no name, time or topic of C1.* **PASS**.

![HR-E05-01-DETAIL-R01](evidence/HR-E05-01-DETAIL-R01.png)
*HR-E05-01-DETAIL-R01. UAT-05 step 1, 26 Nov 2026 18:26:54 Bangkok, Version ac0a57b, actor C1. Action: C1 reopens booking 4 in a new browser session; expected: Same date, time and topic; actual: Unchanged and Confirmed; also shows C2's attempt in UAT-04 changed nothing.* **PASS**.

**Finding HR-F01 (UAT-07, BR-08, AC-15b).**

![HR-E07-02-INPUT-R01](evidence/HR-E07-02-INPUT-R01.png)
*HR-E07-02-INPUT-R01. UAT-07 step 2, 26 Nov 2026 18:03:12 Bangkok, Version ac0a57b, actor C3 Krit Boonmee. Action: C3 enters the topic `🙂🙂` (2 characters) for T7A; actual: The exact input before confirming.*

![HR-E07-02-AFTER-R01](evidence/HR-E07-02-AFTER-R01.png)
*HR-E07-02-AFTER-R01. UAT-07 step 2, 26 Nov 2026 18:03:39 Bangkok, Version ac0a57b, actor C3 Krit Boonmee. Action: C3 chooses Confirm booking; expected: "Enter a topic of 3 to 200 characters."; no booking; actual: Booking 2 confirmed with topic `🙂🙂`.* **FAIL**.

![HR-E07-02-PERSISTED-R01](evidence/HR-E07-02-PERSISTED-R01.png)
*HR-E07-02-PERSISTED-R01. UAT-07 step 2, 26 Nov 2026 18:06:04 Bangkok, Version ac0a57b, actor C3. Action: Booking 2 reopened later; expected: No such booking; actual: Still stored and Confirmed.* **FAIL**.

Screenshots are DineQ's, copied unchanged from their commit `26070fc`, with synthetic accounts and no passwords.

### C.3 Findings received about HairRoot

Every received finding is classified against the Sprint 1 contract. A failing requirement is never relabelled as an enhancement.

| Issue | Reporter | Case and requirement | Version | Classification | Reason, from the contract and evidence | Severity | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| HR-F01, Issue #57 | Siwarak Chatvichai (DineQ) | UAT-07 steps 2, 3, and 5; BR-08, AC-15b | `ac0a57b` | Accepted defect | AC-15b requires topics shorter than 3 characters to be rejected. `🙂🙂` is 2 characters but was stored. The cause is in `server/src/services/bookings.ts`: `topic.length` counts UTF-16 code units, so `"🙂🙂".length` is 4 | Minor: no access or data loss, but an invalid booking is saved and uses up a time | ทิฐินันท์ | Fixed in PR #58, released in #59 (`cbaf1ba`), re-test R02 PASS on 27 Nov; issue closed as completed |

### C.4 Accepted minor limitations

None documented in the supplied DineQ acceptance decision. HR-F01 was fixed and passed targeted R02 before acceptance.

## Part D: Resolution and independent re-test

### D.1 Accepted-defect chain

**HR-F01, Issue #57.** Opened by ทิฐินันท์ on 26 November 2026 from DineQ's finding.

**Product decision.** While fixing it, the HairRoot team also decided that a topic must not contain any emoji, whatever its length. This was recorded as a dated amendment to BR-08 and AC-15b in `docs/labs/lab-06/HR-F01-topic-policy.md`, with links from `srs.md` and `F-04-booking.md`. The original Sprint 1 criteria and DineQ's R01 result are kept unchanged as history. The re-test UAT-07-R02 (Appendix A) gives the new expected results. DineQ agreed to the amended rule before re-testing; their R02 record says the student asked for the re-test under it.

**Regression tests and fix (PR #58).** Each RED test commit failed on the code before it, and the next commit made it pass:

| Step | Commit | Observed |
|---|---|---|
| RED: `🙂🙂` must be rejected | `c569be9` | Expected 400, received 201 on the old server |
| GREEN: count code points | `edaa6cf` | `Array.from(topic).length` replaces `topic.length` |
| RED: emoji policy | `5f6c1f4` | Expected 400, received 201 for `🙂🙂🙂` |
| GREEN: reject emoji | `0e489d0` | Topics with RGI emoji rejected |
| RED: emoji-capable symbols | `fe1af6f` | Expected 400, received 201 for `ก❤ข` |
| GREEN: Unicode `Emoji` property | `dfc9364` | Rejects `❤`, `☀`, `©`, flags, keycaps, and joined emoji; allows plain digits, `#`, and `*` |

After the fix the server suite passed 47/47, and the client suite 8/8. The existing ASCII 2, 3, 200, and 201 boundary test still passes. ไอโว reviewed and approved PR #58, and CI `test-and-docker` (tests, E2E, Docker build) was green. It was merged into `sprint-1-staging` as `76a4506`.

The [RED/GREEN terminal output](evidence/HR-F01-RED-GREEN.txt) records the exact commit, input, expected and actual validation status, and exit code for each of the three pairs. The evidence script exercised `parseBookingInput` without a database; the deployed behavior is supported separately by DineQ's R02 retest.

**Release and deployment.** Before the release, the live service returned `ac0a57b` from `/api/version` (recorded 27 Nov 02:11 Bangkok, `evidence/pre-deploy-version.txt`). ทิฐินันท์ announced the deployment to DineQ in advance. ไอโว approved release PR #59 (`sprint-1-staging` into `main`) but held the merge until DineQ had recorded the pre-deploy state. It merged as `cbaf1ba` on 27 Nov 16:37 Bangkok. Deploy run 45975306714 passed both `test-and-docker` and `deploy`, producing revision `hairroot-sha-cbaf1baa38a5-45975306714-2`.

**Post-deployment smoke check** (27 Nov 20:14 Bangkok, `evidence/post-deploy-smoke.txt`): `/api/version` returned `cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d`, `/api/ready` returned `ready` with the database connected, and `/login` returned 200.

**Independent re-test by DineQ (run R02).** Siwarak Chatvichai re-tested on `cbaf1ba` on 27 November, 17:00 to 17:24 Bangkok, with fresh slots on 16 December.

| Check | Result | What the UAT team observed |
|---|---|---|
| UAT-07-R02, 9 emoji topics: `🙂🙂`, `🙂🙂🙂`, `ก🙂ข`, `ก❤ข`, `ก☀ข`, `ก©ข`, `🇹🇭`, `1️⃣`, `👨‍👩‍👧` | PASS | Each showed *Topics cannot contain emoji.*, no confirmation opened, C3's bookings were unchanged, and S1 still saw the time Available |
| UAT-07-R02, positive control `  123 # *  ` | PASS | Booking 14 confirmed with the trimmed topic `123 # *`; still there after reload; S1 saw it Booked |
| UAT-05 step 4, after the announced redeployment | PASS | Booking 4 from R01 (10 Dec 16:07, *UAT hairline review*) was unchanged for C1, not offered to C3, and still Booked for S1 |

DineQ's [complete R02 record](partner-r02/HairRoot-R02-results.md), [run summary](partner-r02/evidence/run-summary.json), and [SHA-256 manifest](partner-r02/bundle-sha256-manifest.json) are preserved in `partner-r02/` with all 22 original screenshot/JSON pairs. The manifest verified all 56 listed files in the supplied ZIP. R01 is kept unchanged as the result for `ac0a57b`. This targeted retest does not constitute DineQ's final team acceptance.

![HR-E07-NEG-01-R02](evidence/HR-E07-NEG-01-R02.png)
*HR-E07-NEG-01-R02. UAT-07-R02, 27 Nov 2026 17:09:40 Bangkok, Version cbaf1ba, C3. Action: topic `🙂🙂`, Confirm booking. Expected: *Topics cannot contain emoji.*, no booking. Actual: as expected; still on the booking form.* **PASS**

![HR-E07-NEG-02-R02](evidence/HR-E07-NEG-02-R02.png)
*HR-E07-NEG-02-R02. UAT-07-R02, 27 Nov 2026 17:10:09 Bangkok, Version cbaf1ba, C3. Action: topic `🙂🙂🙂`, which R01 accepted. Expected under the amended rule: rejected. Actual: *Topics cannot contain emoji.*; no booking.* **PASS**

![HR-E07-NEG-04-R02](evidence/HR-E07-NEG-04-R02.png)
*HR-E07-NEG-04-R02. UAT-07-R02, 27 Nov 2026 17:10:26 Bangkok, Version cbaf1ba, C3. Action: topic `ก❤ข`, an emoji-capable symbol inside Thai text. Expected: rejected. Actual: *Topics cannot contain emoji.*; no booking.* **PASS**

![HR-E07-POSITIVE-PERSISTED-R02](evidence/HR-E07-POSITIVE-PERSISTED-R02.png)
*HR-E07-POSITIVE-PERSISTED-R02. UAT-07-R02 positive control, 27 Nov 2026, Version cbaf1ba, C3. Action: book the 17:43 slot with `  123 # *  `, then reload. Expected: confirmed with the trimmed topic. Actual: booking 14 Confirmed, topic `123 # *`, unchanged after reload.* **PASS**

![HR-E07-S1-FINAL-R02](evidence/HR-E07-S1-FINAL-R02.png)
*HR-E07-S1-FINAL-R02. UAT-07-R02 final state, 27 Nov 2026, Version cbaf1ba, S1. Expected: the slot used for every rejected topic is still Available; the positive slot is Booked. Actual: 16:43 Available; 17:43 Booked under Krit with `123 # *`.* **PASS**

![HR-E05-C1-PLAYWRIGHT-R02](evidence/HR-E05-C1-PLAYWRIGHT-R02.png)
*HR-E05-C1-PLAYWRIGHT-R02. UAT-05 step 4, 27 Nov 2026 after the deployment, Version cbaf1ba, C1. Action: open booking 4, created on `ac0a57b` on 26 Nov. Expected: same date, time, and topic. Actual: 10 Dec 16:07 to 16:37, Dr. Somchai Prasert, *UAT hairline review*, Confirmed.* **PASS**


### D.2 Independent acceptance decision for HairRoot

Only the UAT team can confirm acceptance.

| | |
|---|---|
| Decision | **Accepted**, stated by Siwarak Chatvichai on behalf of DineQ (TH-007_P9) |
| Tested release and revision | Full commit `cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d` (`cbaf1ba`); HairRoot-supplied Cloud Run revision `hairroot-sha-cbaf1baa38a5-45975306714-2` for R02 |
| UAT testers (team and names) | DineQ; Siwarak Chatvichai operated the recorded R01 and R02 runs. Anapat's execution is not recorded in the supplied R02 package or decision. |
| Date | Decision: 27 Nov 2026; R01: 26 Nov 2026; targeted R02: 27 Nov 2026 |
| Conditions or reasons | Sprint 1 accepted after UAT-07-R02 passed the jointly amended emoji policy and UAT-05 step 4 confirmed the original booking persisted after deployment. R01 remains the historical record; R02 was not a full-suite rerun. |
| Record | [Transcription of the decision supplied by HairRoot's student](evidence/DineQ-acceptance-transcription-2026-11-27.md). The student will share the source image privately with the team; it is not stored in this repository. |

## Contributions, AI use, and limitations

| Work | ไอโว | ทิฐินันท์ |
|---|---|---|
| UAT cases and handoff (PR #42) | Wrote the cases and checked the expected messages against a local run | Reviewed them against the contract and the live app, requested the boundary and AC-17 corrections, and confirmed the release and revision |
| E2E for UAT-04 (PR #54) | Reviewed it and ran it locally (4/4, twice) | Wrote it |
| Testing the partner product | Ran DQ-UAT-01 steps 1 to 3 (E-B7 to E-B9); checked the run's screenshots and wrote Part B | Ran the full DineQ suite on 25 Nov (9 PASS, 2 BLOCKED) with a Playwright script, and sent the results to DineQ |
| Findings, triage, and fixes | Confirmed the HR-F01 cause; triage; reviewed and merged #58 and #55; approved release #59 and held it for DineQ's pre-deploy record; post-deploy smoke check | Opened and closed Issue #57; wrote the fix with three RED/GREEN pairs (PR #58) and the amendment; release #59 and deployment; coordinated R02 and the acceptance |
| This report | Structure, Parts A to D, evidence selection and captions, PDF build | Added the R02 package, RED/GREEN output, and the acceptance record; checked accuracy |

| Student | AI tool | Tasks assisted |
|---|---|---|
| ไอโว | Claude Code (Claude Opus 5.5) | Drafting the UAT cases and this report; the browser check of the expected results; reviewing PRs #54, #55, #58, #59; the DQ-UAT-01 browser script; the smoke check |
| ทิฐินันท์ | OpenAI Codex (GPT-6) | Adding E2E test T-39; reviewing PR #42; the HR-F01 fix and its RED/GREEN evidence; the DineQ Playwright test script |

No password or secret was given to an AI tool.

**Limitations.**
- DQ-UAT-04C (CLOSED queue) and DQ-UAT-08B (persistence after a restart) of DineQ were not run, because only DineQ can prepare them. They are BLOCKED, not passed.
- Our DineQ results use the commit and revision from DineQ's handoff (`17c8b90`, `s21271a0d-00005-rdp`); we did not query DineQ's cloud metadata.
- Most of our DineQ testing was one Playwright-driven session by ทิฐินันท์. ไอโว's own execution covers DQ-UAT-01 steps 1 to 3 only.
- DineQ's R01 and R02 runs of HairRoot were operated by Siwarak Chatvichai; Anapat Banjerdsilp's part is not recorded by DineQ.
- R02 re-tested only UAT-07 (amended) and UAT-05 step 4 on `cbaf1ba`; the other cases were last run on `ac0a57b`. The only code change between them is the topic validation.
- The emoji ban goes beyond fixing HR-F01. It was a product decision, recorded as a dated amendment, and DineQ agreed to it before R02.
- The Lab 6 deadline moved from 22 November to 29 November 2026, as DineQ also recorded. We found a partner team, so no TA notification was needed.

## Appendix A: HairRoot Sprint 1 UAT cases and handoff

The full handoff document given to the partner team follows.
