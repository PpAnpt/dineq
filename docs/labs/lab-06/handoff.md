# DineQ Sprint 1 - independent UAT handoff to HairRoot

Version 0.1, prepared 25 November 2026 for [L6-3 / #47](https://github.com/PpAnpt/dineq/issues/47). Handoff review and session readiness confirmation are pending. All case results remain **NOT EXECUTED**. Preparation/review does not establish independent acceptance.

## 1. Who tests which product

**DineQ** is our restaurant walk-in queue product. Its Product Team is Anapat Banjerdsilp / PpAnpt and Siwarak Chatvichai / BBINGOAL. **HairRoot**, team หัวล้านได้หวี, independently tests DineQ; its participants are Tithinan Sobking and Iivo Peter Alvey Ranne. Both independent testers must participate and identify their actual case/actions in the execution record.

Our DineQ students separately test HairRoot's product under [#48](https://github.com/PpAnpt/dineq/issues/48), using HairRoot's supplied cases. Those results must not be entered as execution of the DineQ cases below. Participant IDs, partner registration provenance and both products' candidate versions are in [coordination.md](coordination.md).

## 2. Release, URL and scope

| Item | DineQ handoff value |
| --- | --- |
| Repository | <https://github.com/PpAnpt/dineq> |
| Open this URL | <https://s21271a0d-4d7hbszvwq-as.a.run.app/login> |
| Original accepted Sprint 1 tag / full commit | `v1.0-sprint1` / `eaa555dfb062d3fc627a374cd55a910b6d609509` |
| Candidate deployed release for this UAT | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` |
| Recorded deployed revision | `s21271a0d-00005-rdp` |
| Deployment source | Successful [main deploy 44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220); GitHub main/latest successful deploy checked again 25 November |
| Reviewed executable cases | [uat-cases.md](uat-cases.md), eight cases with separate subcase records; content approved by PpAnpt at `1a9d04388c1773152908dfbf28a7b809f9188f86`, [PR #54](https://github.com/PpAnpt/dineq/pull/54) merged as `1a144dd85c2003ca94eee9a5977123dff83f3c3e` |
| This handoff/integration branch | Documentation under `lab6-staging`; merging documentation there does not deploy or change the candidate product release |
| Actual version at session start | PENDING joint confirmation; fill the receipt below before running |

Accepted-for-test scope: F-01 Customer/Host login, session/logout and role restrictions; F-02 queue list, party-size 1..8 joins, duplicate prevention and own-ticket access; F-03 assigned-Host FIFO call/complete and persisted ticket state. Case [AC coverage and observation limits](uat-cases.md#4-coverage-and-limits-of-observation) distinguish manual observations from automated/internal support. Cancellation, no-show, table assignment, queue administration, multiple-queue UI, reports and unfinished Sprint 2/3 features are outside this scope.

At session start the DineQ Product Team supplies a current Cloud Run service/traffic revision and its image-to-full-commit record using its authenticated owner access; HairRoot records that confirmation with the run. Compare against the candidate above. The GitHub deployment history alone is not a live service query. DineQ's login release label is static text, and `/api/health` reports health, not a build SHA. Do not use either as proof of the running commit. If metadata disagrees or a deployment is announced, pause and agree the actual tested version/affected retests. This handoff authorizes no deployment.

## 3. Dates, contact and receipt

Student-reported arrangements, timezone **Asia/Bangkok**:

- Initial independent UAT: **25 November 2026**. Exact hours and session length have not been supplied; agree a quiet queue window with both teams before joining tickets.
- Defect correction and independent retest: **26 November 2026**, by availability. Record the actual slot, finding owner and corrected release when known.
- Contact/notification: Discord **รอดไหมปี3**. The student reports test credentials received. The report does not prove HairRoot has received this exact DineQ packet or accessed every listed account.
- Latest instructor/TA submission date, as reported by the student: **29 November 2026**; cutoff time and announcement link were not supplied. Do not infer a time from the older handout.

The supplied message about retaining DineQ `17c8b90` and HairRoot `ac0a57b` asks for agreement; no affirmative two-team version-freeze reply is yet recorded. Use the following receipt in the agreed private chat or a sanitized Issue #47 reply, then retain its reference. Do not include passwords in that reply.

| Receipt/readiness field | Actual confirmation to record |
| --- | --- |
| HairRoot recipient(s), team, date/time | PENDING |
| Received handoff/case document version or commit/link | PENDING |
| Both independent testers and agreed session start/end | PENDING |
| DineQ actual full commit/revision, URL and owner confirmation reference | PENDING |
| HairRoot actual full commit/revision and confirmation reference for our separate run | PENDING |
| Both teams' notice-before-deploy agreement | PENDING |
| Private DineQ account delivery/access for C1-C4/H1/H2 | PENDING per-account receipt/access; record labels only |
| Actual Q and shared-queue readiness | PENDING read-only check at session start |
| 04C CLOSED fixture and 08B restart operator/method/authorization/window | NOT PREPARED / NOT AUTHORIZED by this handoff; separate owner agreement required |

Read this handoff/cases and agree these gates before mutations. Normal/UI cases can run after their own gates pass while 04C/08B remain separately blocked. A missing required subcase still prevents an unsupported overall acceptance; it must not be silently dropped.

## 4. Accounts and private access

The following are **proposed seeded test accounts**, not confirmed current live-account access. The Product Team checks availability and assigns them before the independent session; replacements must be recorded consistently in the case/run sheet.

| Label | Email | Role / use |
| --- | --- | --- |
| C1 | `customer03@dineq.test` | Customer: normal journey, duplicate, first FIFO ticket |
| C2 | `customer04@dineq.test` | Customer: ownership fixture, second FIFO ticket, persistence |
| C3 | `customer05@dineq.test` | Customer: lower valid/invalid boundary and CLOSED attempts |
| C4 | `customer06@dineq.test` | Customer: upper valid boundary |
| H1 | `host1@dineq.test` | Host assigned to the seeded queue |
| H2 | `host2@dineq.test` | Host without a queue assignment |
| ANON | Signed out | No session, protected-route rejection |

The Product Team delivers the demo password privately to named testers through the agreed private channel. Do not put it in git, an Issue/PR, the PDF, screenshots, Console output or a recorded login request. This preparation neither reads nor changes the password. If login fails, record the observed code/account label and ask the owner to check access privately; do not repeatedly guess or publish secrets. Receipt and successful access are separate facts.

Use separate browser profiles/browsers for actors, or explicitly logout/login and verify the displayed email/role before each action. Two tabs in one profile share a session. Customer login goes to Queues; assigned H1 goes to `/host/queues/Q`; H2 sees the unassigned notice. Keep the canonical origin above for every session and supporting API request.

## 5. Data preparation and execution order

No local install, DB connection or cloud credential is required for HairRoot testers. Open the deployed URL, use the private test login and follow [the executable cases](uat-cases.md). For steps explicitly marked API, use only that document's same-origin browser Console helper while signed in as the stated actor; it cannot substitute for the manual UI steps. If the tester cannot perform an API step, record BLOCKED and arrange assisted independent execution. The Product Team must not fill in an independent result instead.

Before the first mutation:

1. Confirm the actual version and assigned accounts; record both independent participants and actual start time. Wait until the UI finishes loading. Do not capture a password-filled login form.
2. Read the queue list; set **Q from the queue item's `id`**, not `restaurant.id`. The seed normally uses `22222222-2222-4222-8222-222222222222`; record the actual value/name/status. Use the assigned OPEN queue.
3. As each Customer, read My queue; as H1, read the Host waiting/CALLED lists. Record existing test/other entries, statuses and ticket IDs before proceeding. H2 is intentionally unassigned. Do not assume a clean queue or ticket number 1.
4. Agree an exclusive/quiet slot for the shared queue and keep it through the dependent cases. The standalone joining scenarios require no active entries unless their own fixture declares them. If an unrelated WAITING/CALLED entry interferes, stop and record the unmet setup gate; do not drain it, alter its data or complete it.
5. Save both entry UUID and displayed ticket number for every created fixture. Before every Host action refresh the list. Only Call Next when the intended test entry is the FIFO head and no unrelated CALLED entry exists; after Call Next verify the returned ID before Complete. Stop on a mismatch or unexpected mutation.

| Order | Case / prerequisite / retained data |
| --- | --- |
| 1 | 01 authentication; finish role checks using isolated sessions |
| 2 | 04A/B invalid and valid party-size boundaries; no intervening other joins in the ticket-number check; complete only the two test fixtures afterward |
| 3 | 02 normal join/call/complete; retain completed C1 ticket **T02** and its full before-data for 08 |
| 4 | 03 duplicate checks in WAITING and CALLED; retain evidence, then legitimately complete its test ticket |
| 5 | 05 roles/unassigned Host; retain C2 WAITING **T05B** for the next case |
| 6 | 06 C1 cannot read C2's T05B; verify unchanged owner state; H1 performs guarded cleanup afterward |
| 7 | 07 FIFO/transition rules; act only on the two recorded test entries; empty-call check only when the queue is genuinely empty |
| 8 | 04C only in a separately approved owner-prepared CLOSED window, after joining cases; owner must confirm restoration to OPEN before 08 |
| 9 | 08A uses retained completed T02 and newly joined C2 WAITING **T08**; 08B requires a separately approved real app operation and before/after evidence |

The sequence is intentional. Agree enough session time to execute it and capture evidence; no particular duration is currently agreed. If interrupted, record remaining UUIDs/statuses and the last completed step. A rerun of 06 needs a valid 05 ownership fixture; a rerun of 08 needs a completed normal fixture and a fresh WAITING baseline. Preserve earlier FAIL/BLOCKED attempts and use a new attempt ID.

## 6. Owner-only conditional preparation

**No live SQL, restart, redeploy, reset or cloud operation has been performed or authorized by publishing this handoff.** HairRoot testers use Customer/Host UI/API only; they receive no DB/GCP access.

| Subcase | Owner, method and required record |
| --- | --- |
| 04C CLOSED queue | A named DineQ operator (Anapat or Siwarak, selected in the actual agreement) obtains explicit authorization for the exact Q and window. No queue-admin UI/API exists. Before any manual DB change, the owner records original OPEN state, current fixtures, an exact guarded change/restoration plan and its authorization. The agreed operation changes only that queue's status; it must not reset counters, delete tickets or reseed. HairRoot independently observes CLOSED/disabled UI, the specified API rejection and unchanged ticket state. Owner records actual operation/time and restores the original OPEN status, then HairRoot verifies readiness for 08. If unavailable/unauthorized or original state is not as agreed, mark 04C BLOCKED and stop that preparation |
| 08B real application restart | A named DineQ operator obtains explicit authorization and selects/records an actual app restart operation with the same DB before execution. Collect T02/T08 before-data and full commit/revision/time first; freeze ticket mutations during the window. Owner records actual command/console action, timing and relevant revision/instance evidence, then announces readiness. HairRoot independently compares the same ticket fields afterward. Browser reload is only 08A; old Lab5 evidence or an idle wait alone does not prove a new restart. If a same-image replacement or code deployment is proposed, agree the method/version and affected retests first; do not silently substitute it for the operation. No database restart/reset is needed. If no approved operation/evidence is available, mark 08B BLOCKED |

Keep the operation record, authorization reference, pre/post version, exact Q/entry IDs and restoration outcome with that attempt. Inferred instance behavior must be labelled as inference. Do not mark a failed restoration or missing before-data as completed preparation. The outstanding operator/method/authorization is visible in the receipt rather than assumed from the reviewer approving the cases.

## 7. Cleanup without deleting history

After evidence is saved, H1 may legitimately Call Next -> Complete **only the recorded case's own test entries**, in FIFO order, after the guard above passes. This retains completed ticket/history records. There is no cancellation/delete/reset UI. Never truncate, migrate/reseed, reset `next_ticket_no`, mass-complete, or manipulate an unrelated ticket to prepare a clean run.

For 08, keep T08 WAITING until its required before/after comparison is complete. If 08B is postponed, agree whether to retain it or perform guarded cleanup; record that decision and remaining UUID/status. A later 08B needs a new WAITING baseline if it was completed. Preserve T02. If cleanup is blocked by unrelated state or an unexpected mutation, stop and give the Product Team the remaining fixture ledger; do not claim cleanup succeeded.

## 8. Record results, evidence and findings

Use the [independent execution sheet](uat-cases.md#5-independent-execution-and-evidence-record) or a copy preserving its case/subcase IDs. Each actual attempt records tester/team and second participant's contribution, real start/end/timezone, full commit/revision/URL, actor labels, Q/entry IDs, actual inputs/actions/outcomes, before/after state, PASS/FAIL/BLOCKED, evidence and cleanup. Write observed results; do not copy the expected column as proof. All eleven preparation rows are currently NOT EXECUTED.

For a normal journey capture WAITING -> CALLED -> COMPLETED on the same recorded ticket. For negative/access cases show the rejection and unchanged/protected owner state. Label captures with case/step/attempt, time, URL and version; wait for loaded content. Omit passwords, cookies, tokens, authentication headers, DB URLs and login payloads. Keep readable selected evidence for the eventual self-contained PDF, not only external links.

For a real mismatch, create or request a DineQ finding in <https://github.com/PpAnpt/dineq/issues> and notify the Product Team through Discord รอดไหมปี3. If the reporter cannot create an Issue, an owner may transcribe the actual report with reporter attribution and confirmation. Do not invent a defect or represent transcription as owner-independent testing. Retain the Issue link and actual notification acknowledgement/outcome; no message has been sent by preparing this packet.

Finding fields: product/owner, reporter/team, case/AC, full tested version and time, role and fixture IDs, preconditions, reproduction steps, expected versus actual behavior, supporting evidence and severity explained by user impact. The Product Team records triage/disposition under #49 and real corrections under #50. Critical/major accepted defects block acceptance; minor defects require correction or explicit independent acceptance as a known limitation. An unmet prerequisite is BLOCKED, not automatically a product defect.

Only HairRoot can record the independent DineQ decision under #51 for the exact tested Sprint 1 release. Developer CI and this reviewed handoff do not replace that decision. Required BLOCKED cases and unresolved critical/major defects cannot be hidden by a sign-off. If no legitimate defect is found, the handout's TA-approved controlled exercise remains separate; no defect is fabricated here.

## 9. Preparation status

Reviewed DineQ case content is available on `lab6-staging`; this new handoff and coordination metadata require teammate review. Account/queue checks, final joint version confirmation, exact hours, packet receipt, conditional owner operations and actual independent execution have not been performed by this preparation. No live request or data/cloud mutation was made to create these documents. #47 remains open until its actual review/receipt requirements are met; #45 retains final joint coordination. Do not mark #48-52 Done from document preparation.
