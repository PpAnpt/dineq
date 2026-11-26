# DineQ team - independent UAT execution record for HairRoot

Version 0.2 preparation, updated 26 November 2026 for [L6-4 / #48](https://github.com/PpAnpt/dineq/issues/48), aligned to the student's newly supplied HairRoot v0.2 case pack. **The template case/step rows below start NOT EXECUTED; independent acceptance is PENDING.** Record actual attempts separately without replacing expected outcomes or inventing student participation.

Actual attempt: [26 November 2026 R01 assisted run](hairroot-run-2026-11-26-R01.md), with a complete 43-step actual-result/evidence table: **5 cases PASS / 1 FAIL / 1 BLOCKED**. The rows in this file remain reusable blank templates, not the aggregate result. The Unicode failure is [HR-F01](hairroot-finding-HR-F01.md); no independent acceptance has been given.

Product under test: **HairRoot**, hair-transplant consultation booking (team หัวล้านได้หวี). Independent UAT Team: **DineQ**, Anapat Banjerdsilp (PpAnpt, 67070501049) and Siwarak Chatvichai (BBINGOAL, 67070501086). The cases belong to HairRoot: [received v0.2 source](reference/hairroot-uat-cases-v0.2.md), draft dated 26 November 2026, supplied by the student for this run; SHA-256 `82e9981d1aca88f0a31c830279b45aaa8431befc1aaebcd88377e6ccdfb29938`. The earlier v0.1 source/hash remains historical provenance in [coordination](coordination.md). HairRoot case IDs, AC numbers and booking rules are not DineQ requirements, and this record must not be mixed with the [DineQ cases](uat-cases.md) that HairRoot executes.

## How to use this record

1. Copy the run sheet (section 2) and one case section for **each attempt**; keep earlier FAIL/BLOCKED attempts and give a retest a new attempt number (R01, R02, ...).
2. Both DineQ students take part. Write the name of the student who actually performed each case or step. If an agent or tool helps, say so and record the student who supervised and observed; never record a person who did not take part.
3. Fill the **Actual** column with what you saw (message text, page, state). Never copy the Expected column into it. If the outcome could not be reached because a precondition failed, write BLOCKED and the reason; BLOCKED is not a pass.
4. For a rejected operation, show the rejection **and** that the protected state did not change or leak (a before and an after observation).
5. Capture only after the page has finished loading. Give every capture an evidence ID `HR-E<case>-<step>-R<attempt>` (for example `HR-E01-05-R01`) and a caption with action, expected, actual, time, URL and the tested version. Do not capture a password-filled form, a password, cookies, tokens or request headers.
6. Do not copy HairRoot passwords, tokens or private chat content here. Account labels only.
7. Do not change HairRoot code, data or cloud resources. Leftover synthetic times and bookings stay; there is no cancellation in HairRoot Sprint 1.
8. A real mismatch against HairRoot's declared Sprint 1 scope is a finding (section 4); an unmet precondition or an out-of-scope feature is not.

## 1. Product under test and session version

| Field | Value |
| --- | --- |
| Repository | <https://github.com/alvin777777/hairroot> |
| URL (`<URL>` in the cases) | <https://hairroot-368003298307.asia-southeast1.run.app> (sign in at `/login`) |
| Sprint 1 baseline | Tag `v0.1.0-sprint1`, commit `d1e8d81d630bbc6e377bdd07a65e2b39e6967680` |
| Candidate release declared by HairRoot | Commit `ac0a57b9eb871128807733a0e9d75d77a662b477`; revision `hairroot-sha-ac0a57b9eb87-44992339630-1`; the page footer should read `Version ac0a57b` |
| Observation on 25 November 2026 | The public `/login` page returned HTTP 200 and showed "Version ac0a57b"; `/api/health` returned 200. This is a page observation, not a service query |
| **Actual version for this run** | PENDING: record the footer text, the full commit/revision supplied by HairRoot and where it came from, at the start of every session |
| Version freeze agreed with HairRoot | PENDING: HairRoot's affirmative reply and reference (no reply recorded yet) |
| Scope accepted for test | Sign in/out and role pages; a Specialist adds a time (15 to 120 minutes, future, no overlap); a Customer books service, day, time and a topic (3 to 200 characters); exclusive booking; own bookings and own schedule only |
| Out of scope | Cancel/reschedule, edit/delete/repeat times, filtering, outcomes, history, reports, public Home page. Report these as enhancements, not defects |
| Account labels | S1, S2 (Specialists); C1, C2, C3 (Customers). Credentials received privately; not recorded here |
| Time zone | Asia/Bangkok (HairRoot shows all times in it) |

## 2. Run sheet (copy for each attempt)

| Field | To be completed from actual execution |
| --- | --- |
| Run ID / case / attempt | Not recorded |
| Tester(s) and team; student who performed each step; supervision if a tool helped | Not recorded |
| Start / end date-time (Asia/Bangkok) | Not recorded |
| Browser and window setup (profiles, private windows) | Not recorded |
| Actual footer version / full commit / revision and its source | Not recorded |
| Fixtures chosen (date D, start time T, other dates and times used, team-unique start minute) | Not recorded |
| Preconditions met? (account access, no clash with seeded or earlier times) | Not recorded |
| Result (PASS / FAIL / BLOCKED) and reason | Not recorded |
| Evidence IDs | Not recorded |
| Finding / notification outcome | Not recorded, or explicit "no finding in this attempt" |
| Records created in HairRoot (for the ledger in section 5) | Not recorded |

## 3. Cases

Each step table lists the expected result from the supplied HairRoot source for judging the outcome; setup steps for which the source states no expected result are marked as such. Cases 01-06 retain their reviewed actions/expected outcomes; v0.2 adds case 07. Dates D, D2, D3 and D7 are 10 to 30 days after the execution day; compute them on the day, choose unused team-specific times and record the real values in the run sheet.

### UAT-01 - Normal journey: add a time, book it, retrieve it

Category: normal domain journey. HairRoot refs: FR-04 to FR-08; AC-10, AC-14, AC-15, AC-20, AC-22, AC-27. Roles: S1, then C1, then S1. Inputs: service "Hair transplant consultation"; date D; start T; 30 minutes; topic `UAT hairline review`. Preconditions: signed out. Overall result: **NOT EXECUTED**. Performed by: not recorded. Keep the created booking for UAT-05.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Sign in as S1 | "My schedule" page opens | | NOT EXECUTED | |
| 2 | Service "Hair transplant consultation", date D, start T, 30 minutes, Add time | "Time added." appears; T to T+30 is listed under D as Available | | NOT EXECUTED | |
| 3 | Log out; sign in as C1 | "Book an appointment" page opens | | NOT EXECUTED | |
| 4 | Choose the S1 consultation service, day D, time T | Step 4 shows the service, the specialist and D, T to T+30 | | NOT EXECUTED | |
| 5 | Topic `UAT hairline review`, Confirm booking | "Your booking is confirmed." with When, Specialist, Service, Topic, Status Confirmed | | NOT EXECUTED | |
| 6 | My bookings, then open the new booking | It is listed and opens with the same details | | NOT EXECUTED | |
| 7 | Log out; sign in as S1 | Under D, T to T+30 shows Booked, the customer name and the topic | | NOT EXECUTED | |

### UAT-02 - Business rule: two customers try to book the same time

Category: business rule. HairRoot refs: BR-01; AC-16. Roles: S1, C2 and C3 in two separate browser windows (one normal, one private). Inputs: topics `UAT race C2` and `UAT race C3`. Preconditions: as S1, add a new time T2 on date D2 (as UAT-01 steps 1 and 2) and log out. Overall result: **NOT EXECUTED**. Note: the two confirmations are sequential; HairRoot's source states that true concurrency (AC-17) is covered only by their automated test.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Window A: sign in as C2. Window B: sign in as C3 | (setup step; no expected result stated in HairRoot's source) | | NOT EXECUTED | |
| 2 | In both windows choose the S1 consultation service, day D2, time T2 and enter that window's topic; do not confirm yet | (setup step; no expected result stated in HairRoot's source) | | NOT EXECUTED | |
| 3 | Window A: Confirm booking | C2's booking is confirmed | | NOT EXECUTED | |
| 4 | Window B: Confirm booking | "Another customer has just taken this time. Please choose another."; T2 is no longer offered for D2 | | NOT EXECUTED | |
| 5 | Window B: My bookings | No booking for D2, T2 | | NOT EXECUTED | |
| 6 | Window A: My bookings | C2's booking for D2, T2 is still there with topic `UAT race C2` | | NOT EXECUTED | |

### UAT-03 - Boundaries: invalid times, durations, topic length

Category: business rule / boundary. HairRoot refs: BR-03, BR-04, BR-08; AC-11, AC-12, AC-15b. Roles: S1, then C1. Preconditions: signed out; choose a new date D3. Inputs: past date (yesterday 10:00); times on D3: 17:00 for 60 minutes, 17:30 for 30 minutes, 18:00 for 30 minutes, 19:00 for 15 minutes, 20:00 for 120 minutes; topics `ab` (2 characters), `abc`, a 200-character topic and a 201-character topic (the 200-character topic is `0123456789` repeated exactly 20 times, as in HairRoot's source; add one `X` at the end for 201; copy it from a text editor so no line break is added, and check the length). Overall result: **NOT EXECUTED**. Notes from the source: 14 and 121 minutes and an end not after the start cannot be entered in the UI (HairRoot cites automated tests T-11a/T-11b); record that limit, do not claim it was observed.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | S1: yesterday's date, 10:00, 30 minutes, Add time | "A slot must start in the future."; nothing added | | NOT EXECUTED | |
| 2 | Add D3, 17:00, 60 minutes | "Time added." | | NOT EXECUTED | |
| 3 | Add D3, 17:30, 30 minutes | "This time overlaps another slot on the schedule."; nothing added | | NOT EXECUTED | |
| 4 | Add D3, 18:00, 30 minutes (starts exactly when 17:00 ends) | "Time added." (adjacent times allowed) | | NOT EXECUTED | |
| 5 | Add D3, 19:00, 15 minutes | "Time added", shown as 19:00 to 19:15 | | NOT EXECUTED | |
| 6 | Add D3, 20:00, 120 minutes | "Time added", shown as 20:00 to 22:00 | | NOT EXECUTED | |
| 7 | Open the Duration list | Only 15, 30, 45, 60, 90 and 120 minutes are offered | | NOT EXECUTED | |
| 8 | Log out; sign in as C1; choose the S1 consultation service, D3, 18:00; topic `ab`; confirm | "Enter a topic of 3 to 200 characters." under the topic; no booking made | | NOT EXECUTED | |
| 9 | Replace the topic with the 201-character topic; confirm | The same message; no booking made | | NOT EXECUTED | |
| 10 | Replace it with the 200-character topic; confirm | Booking confirmed; its detail shows the full topic | | NOT EXECUTED | |
| 11 | Choose D3 and 19:00; topic `abc`; confirm | Booking confirmed | | NOT EXECUTED | |
| 12 | My bookings | Exactly two bookings on D3 (18:00 and 19:00); none for the rejected attempts | | NOT EXECUTED | |

### UAT-04 - Forbidden role and ownership

Category: forbidden role / ownership (negative and access case). HairRoot refs: BR-05, BR-06; AC-05, AC-06, AC-21, AC-23. Roles: C1, C2, S2 and a signed-out visitor. Preconditions: C1 has at least one booking (for example from UAT-01 or UAT-03). Input: the address of one of C1's bookings, `<URL>/bookings/<id>`. Overall result: **NOT EXECUTED**. For this case, also record the before and after state to show nothing leaked or changed.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Sign in as C1, open one of C1's bookings, copy its address, log out | (setup step; no expected result stated in HairRoot's source) | | NOT EXECUTED | |
| 2 | Sign in as C2 and open the copied address | "Booking not found."; no topic, time or name of C1 shown | | NOT EXECUTED | |
| 3 | As C2 open `<URL>/schedule` | C2 is sent to the booking page; no specialist schedule or other customers' bookings shown | | NOT EXECUTED | |
| 4 | Log out; without signing in open `<URL>/bookings` | The sign-in page is shown | | NOT EXECUTED | |
| 5 | Sign in as S2; open the Service list on "My schedule" | Only S2's own service is listed; none of S1's bookings or customer names appear | | NOT EXECUTED | |

### UAT-05 - State and persistence

Category: state / persistence. HairRoot refs: FR-07, FR-08, BR-01; AC-14, AC-20, AC-22, AC-24. Roles: C1, C3, S1. Preconditions: UAT-01 is complete; note its booking (date D, time T, topic `UAT hairline review`). Step 4 needs HairRoot to announce a redeployment and say when it is finished; without that, step 4 is **BLOCKED**, and steps 1 to 3 alone must not be reported as proof of persistence across a redeployment. Overall result: **NOT EXECUTED**.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Sign in as C1 in a fresh private window; open My bookings | The UAT-01 booking is listed with the same date, time and topic | | NOT EXECUTED | |
| 2 | Log out; sign in as C3; choose the S1 consultation service and day D | Time T is not offered | | NOT EXECUTED | |
| 3 | Log out; sign in as S1 | D, T still shows Booked with C1's name and topic | | NOT EXECUTED | |
| 4 | After HairRoot announces a redeployment and says it is finished, repeat steps 1 to 3 (record the version before and after) | The same results: the data survived the redeployment | | NOT EXECUTED | |

### UAT-06 - Sign-in and sign-out

Category: authentication. HairRoot refs: FR-01 to FR-03; AC-01 to AC-03. Roles: C1 and a signed-out visitor. Inputs: C1's email with the wrong password `Wrong-Pass1` (the only password that may appear in a capture, because it is HairRoot's published wrong-password example), then C1's correct password (never captured). Overall result: **NOT EXECUTED**.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Open `<URL>/login`; C1's email and `Wrong-Pass1`; Sign in | "Invalid email or password."; stay on the sign-in page | | NOT EXECUTED | |
| 2 | Unknown email `nobody@hairroot.test` with any password | The same message (does not reveal whether the account exists) | | NOT EXECUTED | |
| 3 | Sign in with C1's correct password | The booking page opens; the header shows the Customer name and role | | NOT EXECUTED | |
| 4 | Log out; press Back; reload | The sign-in page, not C1's data | | NOT EXECUTED | |

### UAT-07 - Topic length with Unicode characters

Category: business rule / boundary. HairRoot refs: BR-08; AC-15b. Roles: S1, then C3, then S1. Preconditions: signed out; choose D7 10 to 30 days ahead and two unused non-overlapping S1 consultation times T7A/T7B, each 30 minutes. Inputs: `🙂🙂` (two displayed characters) and `🙂🙂🙂` (three displayed characters), copied from the supplied v0.2 source. Overall result: **NOT EXECUTED**. These are partner-supplied expectations, not a change to DineQ's contract.

| Step | Action (summary of source) | Expected (HairRoot source) | Actual (tester) | Result | Evidence ID |
| --- | --- | --- | --- | --- | --- |
| 1 | Sign in as S1; add T7A and T7B on D7 to Hair transplant consultation, each 30 minutes; log out | "Time added." for each; both Available | | NOT EXECUTED | |
| 2 | Sign in as C3; select the same service, D7, T7A; enter `🙂🙂`; Confirm booking | "Enter a topic of 3 to 200 characters."; confirmation page does not open; T7A stays available | | NOT EXECUTED | |
| 3 | Open My bookings, then return to Book | No booking for D7/T7A | | NOT EXECUTED | |
| 4 | Choose the same service, D7, T7B; enter `🙂🙂🙂`; confirm; log out | Booking confirmed; detail shows the three symbols unchanged | | NOT EXECUTED | |
| 5 | Sign in as S1; open D7 on My schedule | T7A Available; T7B Booked with C3 and the three-symbol topic | | NOT EXECUTED | |

## 4. Findings register

Create a finding only for an observed, reproducible mismatch against HairRoot's declared Sprint 1 scope, after re-running the step to confirm it. Report it through the channel agreed with HairRoot (GitHub Issue with label `uat` in their repository, or the agreed chat) and record the actual notification and the answer. Do not invent findings; "none" is a valid result.

| Finding ID / Issue link | Case / step / attempt | Tested version and time | Reporter and team | Preconditions and data | Steps to reproduce | Expected | Actual | Severity and user-impact reason | Evidence IDs | Notified how / when / outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| None recorded | | | | | | | | | | |

Actual finding from the separately recorded 26 November assisted attempt: [HR-F01](hairroot-finding-HR-F01.md), UAT-07 two-symbol Unicode topic accepted and persisted. Partner triage/notification and the final independent decision remain pending. The blank row above is a reusable report template; it is not a claim that no finding exists.

Severity is explained by user impact. Critical and major findings block acceptance; a minor finding must be corrected, or explicitly accepted by the independent UAT Team (here DineQ) as a documented known limitation, with that decision recorded; HairRoot's own acknowledgement or documentation of the limitation is not sufficient. An enhancement outside Sprint 1 is not a defect.

## 5. Evidence log and fixture ledger

| Evidence ID | Case / step / attempt | Action | Expected | Actual | Time (Asia/Bangkok) | Version and URL | File or location |
| --- | --- | --- | --- | --- | --- | --- | --- |
| None recorded | | | | | | | |

| Record created in HairRoot | Created by (student) and when | Case | Left in place? |
| --- | --- | --- | --- |
| None recorded | | | |

## 6. Execution index

| Case | Category | Status | Attempts and run-sheet references |
| --- | --- | --- | --- |
| UAT-01 | Normal journey | NOT EXECUTED | None |
| UAT-02 | Business rule | NOT EXECUTED | None |
| UAT-03 | Boundary | NOT EXECUTED | None |
| UAT-04 | Forbidden role / ownership | NOT EXECUTED | None |
| UAT-05 | State / persistence (step 4 needs HairRoot's announced redeployment) | NOT EXECUTED | None |
| UAT-06 | Authentication | NOT EXECUTED | None |
| UAT-07 | Unicode topic-length boundary | NOT EXECUTED | None |

## 7. Independent decision on HairRoot (DineQ team as UAT Team)

PENDING. Record one decision only after every required case has an actual result, for the exact version tested: **Accepted**, **Accepted with explicitly documented minor limitations**, or **Not Accepted**, with reasons. Required BLOCKED cases or unresolved critical/major findings mean Not Accepted; do not hide them behind a sign-off. The decision belongs to the DineQ students as HairRoot's independent testers; HairRoot cannot supply it, and this document cannot carry it before the tests are done.

| Field | Record |
| --- | --- |
| Decision | PENDING |
| Exact release tested (full commit and revision) | PENDING |
| Independent testers (both DineQ students) and date | PENDING |
| Evidence IDs and run-sheet references | PENDING |
| Conditions / documented minor limitations (each one explicitly accepted by the DineQ UAT Team, with the acceptance recorded) | PENDING |
| Retest of corrected findings (if any): version, tester, actual result | PENDING |

## 8. Contributions, AI use and limitations

| Item | Record |
| --- | --- |
| Contributions (who performed and who observed each case) | PENDING, from the actual sessions |
| AI use | PENDING for execution; this template was drafted with AI assistance (see the AI-use log). AI does not substitute for the students' independent execution or sign-off |
| Limitations | PENDING; list BLOCKED steps, HairRoot behaviors that could not be observed through the UI, and anything not tested |

## Revision history

| Version | Date | Change / execution status |
| --- | --- | --- |
| 0.1 | 2026-11-25 | Blank execution record created from HairRoot's v0.1 cases for #48. All cases NOT EXECUTED; no finding or decision recorded |
| 0.2 | 2026-11-26 | Align preparation to newly received HairRoot v0.2/hash and append its five-step UAT-07 Unicode case. Seven cases / 43 template steps; actual execution and student contributions must be recorded separately |
