# Lab 6 coordination and candidate version register

Updated 25 November 2026. Tracking: [L6-1 / #45](https://github.com/PpAnpt/dineq/issues/45). The student has supplied partner registration, date-level arrangements, a credential-receipt report and an updated deadline. Final joint session-version confirmation and exact session hours remain pending. This register is preparation, not a UAT execution or acceptance record.

## Version register

| Field | DineQ: our product, HairRoot tests it | HairRoot: partner product, DineQ tests it |
| --- | --- | --- |
| Context | Restaurant walk-in queue management | Hair-transplant consultation booking |
| Repository | <https://github.com/PpAnpt/dineq> | <https://github.com/alvin777777/hairroot> |
| Accepted Sprint 1 tag | `v1.0-sprint1` | `v0.1.0-sprint1`, declared by partner draft |
| Original Sprint 1 commit | `eaa555dfb062d3fc627a374cd55a910b6d609509` | `d1e8d81d630bbc6e377bdd07a65e2b39e6967680` |
| Candidate deployed commit under test | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` | `ac0a57b9eb871128807733a0e9d75d77a662b477`, supplied again in the student's partner update; expected footer `Version ac0a57b` |
| Public test URL | <https://s21271a0d-4d7hbszvwq-as.a.run.app/login> | <https://hairroot-368003298307.asia-southeast1.run.app/login> |
| Recorded/declarative revision | `s21271a0d-00005-rdp`, from successful [deploy run 44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220) | `hairroot-sha-ac0a57b9eb87-44992339630-1`, supplied again in the student's partner update |
| Version verification at preparation | GitHub main and newest successful deploy workflow checked on 25 November still identify 17c8b90. No authenticated GCP service metadata was queried in this preparation | The previously supplied abbreviated commit IDs resolve to the full commits above via the public repository API; the new partner update repeats the candidate release. Neither source independently verifies the current running service |
| Version lock for the actual UAT session | PENDING joint confirmation before execution | PENDING confirmation from HairRoot before execution |

Record the actual version at execution time. If either product deploys a changed version, inform the UAT team, update the register/execution row and agree affected retests. Acceptance applies to the exact tested release and Sprint 1 scope. Do not label branch HEAD, a historical tag or a previous deploy record as the current running image without checking.

DineQ's new `lab6-staging` starts at accepted staging `6f1d31f6f82808ef9e8d611b305ede20d63e96e3`; only Lab 5 documentation/AI-log changes distinguish that source point from main at preparation. It is an integration source version, not a new deployed UAT release.

## Participants and coordination

| Team | Participants | Responsibility |
| --- | --- | --- |
| DineQ | Anapat Banjerdsilp / PpAnpt / 67070501049; Siwarak Chatvichai / BBINGOAL / 67070501086 | Product team for DineQ; both participate as independent testers of HairRoot; teammates review each other's preparation/corrections |
| HairRoot, team หัวล้านได้หวี | Tithinan Sobking / 67070501018; Iivo Peter Alvey Ranne / 67070501051 (spellings supplied in the student's partner registration update) | Product team for HairRoot; both participate as independent testers/acceptance decision makers for DineQ |

| Agreement | Value / status | Required record |
| --- | --- | --- |
| Initial UAT window (Asia/Bangkok) | 25 November 2026, student-reported arrangement | Exact start/end and session length not supplied. Agree a quiet shared-queue slot before mutations; record actual times per run |
| Defect clarification/correction window | 26 November 2026, availability-based | Coordinate via the Discord channel below; actual finding owners, response expectations and correction cutoff remain to be recorded |
| Independent retest window | 26 November 2026, availability-based | Record actual tester/time, corrected version and original failed cases when scheduled; no fixed hour was supplied |
| Handoff/finding notification channel | Discord: รอดไหมปี3, supplied by the student | No invite URL supplied. Retain reproducible findings and notification outcomes with issue/run links; this preparation sent no Discord message |
| Private credentials delivered/received | Student reports "received" | Direction, individual account access and HairRoot's receipt of this DineQ handoff are not confirmed by that short report. Record those separately; no secret values |
| Applicable submission deadline | 29 November 2026, latest instructor/TA date as reported by the student | No cutoff time or announcement link supplied. The original handout's 22 November date is historical; do not copy its 23:59 time onto the updated date |

The student's final supplied message asks whether both candidate baselines will be retained without deployment changes before UAT. It is a request for confirmation, not an affirmative reply from both teams. Obtain that answer and record the actual versions at session start; if they change, update the run before proceeding. The date-level arrangements above do not establish a version freeze.

If partner access or availability blocks independent testing, record BLOCKED and notify the TA through a student-authorized channel. Do not replace the independent team with the product team or invent a sign-off. No notification was sent by this preparation.

## Provenance and next issue

The received `uat-cases_HairRoot.md` identifies itself as HairRoot version 0.1 draft dated 21 November 2026. Received through the student on 24 November. Source-file SHA-256: `81BB05B121C68454B475ED75B1B0FB2731EAACD4C6E1FD0B9608D2C8906F64A3`. It contains six HairRoot cases and a blank execution table. Its instructions and scope apply to HairRoot's proposed handoff, not to DineQ's contract. No partner execution result was copied into our records.

The later student message supplies the team name, preferred Latin name spellings, repeated HairRoot commit/revision, 25/26 November arrangements, Discord contact, credential-receipt report and revised 29 November deadline recorded above. These are attributed student reports; no chat screenshot, affirmative version-freeze reply, per-account access check or independent execution was supplied.

L6-1 baseline/CI preparation merged in PR #53. PpAnpt approved the [DineQ cases](uat-cases.md) at `1a9d04388c1773152908dfbf28a7b809f9188f86`; CI [45325580275](https://github.com/PpAnpt/dineq/actions/runs/45325580275) passed. On the student's instruction, PR #54 merged into `lab6-staging` as `1a144dd85c2003ca94eee9a5977123dff83f3c3e` on 25 November; #46 is complete. This integration did not deploy. #47 is the active safe-handoff task. #45 remains open for final session arrangements/version confirmation, and all independent results remain NOT EXECUTED.
