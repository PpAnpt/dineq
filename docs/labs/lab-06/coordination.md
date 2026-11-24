# Lab 6 coordination and candidate version register

Status: DRAFT, 24 November 2026. Tracking: [L6-1 / #45](https://github.com/PpAnpt/dineq/issues/45). Partner identification comes from the user-supplied HairRoot handoff; no partner acknowledgement or agreed test date is inferred from receiving that file.

## Version register

| Field | DineQ: our product, HairRoot tests it | HairRoot: partner product, DineQ tests it |
| --- | --- | --- |
| Context | Restaurant walk-in queue management | Hair-transplant consultation booking |
| Repository | <https://github.com/PpAnpt/dineq> | <https://github.com/alvin777777/hairroot> |
| Accepted Sprint 1 tag | `v1.0-sprint1` | `v0.1.0-sprint1`, declared by partner draft |
| Original Sprint 1 commit | `eaa555dfb062d3fc627a374cd55a910b6d609509` | `d1e8d81d630bbc6e377bdd07a65e2b39e6967680` |
| Candidate deployed commit under test | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` | `ac0a57b9eb871128807733a0e9d75d77a662b477`, declared by partner draft |
| Public test URL | <https://s21271a0d-4d7hbszvwq-as.a.run.app/login> | <https://hairroot-368003298307.asia-southeast1.run.app/login> |
| Recorded/declarative revision | `s21271a0d-00005-rdp`, from successful [deploy run 44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220) | `hairroot-sha-ac0a57b9eb87-44992339630-1`, declared by partner draft |
| Version verification at preparation | Remote main and newest successful deploy workflow still identify 17c8b90. No authenticated GCP service metadata was queried in this preparation | Both supplied abbreviated commit IDs resolve to the full commits above via the public repository API; this does not independently verify the running service/revision |
| Version lock for the actual UAT session | PENDING joint confirmation before execution | PENDING confirmation from HairRoot before execution |

Record the actual version at execution time. If either product deploys a changed version, inform the UAT team, update the register/execution row and agree affected retests. Acceptance applies to the exact tested release and Sprint 1 scope. Do not label branch HEAD, a historical tag or a previous deploy record as the current running image without checking.

DineQ's new `lab6-staging` starts at accepted staging `6f1d31f6f82808ef9e8d611b305ede20d63e96e3`; only Lab 5 documentation/AI-log changes distinguish that source point from main at preparation. It is an integration source version, not a new deployed UAT release.

## Participants and coordination

| Team | Participants | Responsibility |
| --- | --- | --- |
| DineQ | Anapat Banjerdsilp / PpAnpt / 67070501049; Siwarak Chatvichai / BBINGOAL / 67070501086 | Product team for DineQ; both participate as independent testers of HairRoot; teammates review each other's preparation/corrections |
| HairRoot | ไอโว ปีเตอร์ อัลวิน รันเน่ / 67070501051; ทิฐินันท์ สอบกิ่ง / 67070501018 (source: supplied draft) | Product team for HairRoot; independent testers/acceptance decision makers for DineQ |

| Agreement | Value / status | Required record |
| --- | --- | --- |
| Initial UAT window (Asia/Bangkok) | PENDING | Start/end time and agreement by both teams |
| Defect clarification/correction window | PENDING | Contact channel, response expectations, owners and correction cutoff |
| Independent retest window | PENDING | Testers, availability, corrected version and original failed cases |
| Handoff/finding notification channel | PENDING | Partner-confirmed channel and accessible finding location for each product |
| Private credentials delivered/received | PENDING | Record delivery acknowledgement/date only; never the password or token |
| Applicable submission deadline | PENDING course-announcement confirmation | Supplied handout says 22 November 2026 23:59; any later arrangement needs the actual course/TA confirmation |

If partner access or availability blocks independent testing, record BLOCKED and notify the TA through a student-authorized channel. Do not replace the independent team with the product team or invent a sign-off. No notification was sent by this preparation.

## Provenance and next issue

The received `uat-cases_HairRoot.md` identifies itself as HairRoot version 0.1 draft dated 21 November 2026. Received through the student on 24 November. Source-file SHA-256: `81BB05B121C68454B475ED75B1B0FB2731EAACD4C6E1FD0B9608D2C8906F64A3`. It contains six HairRoot cases and a blank execution table. Its instructions and scope apply to HairRoot's proposed handoff, not to DineQ's contract. No partner execution result was copied into our records.

The L6-1 baseline/CI preparation was reviewed and merged in PR #53. The [DineQ case draft](uat-cases.md) is being developed/reviewed under #46; the safe handoff remains #47. L6-1 stays open with `waiting-on-coordination` until joint arrangements are actually confirmed. The case draft can be reviewed before dates are agreed; independent execution still requires the real version lock, data/access preparation and handoff.
