# Lab 6 independent acceptance records

Prepared 27 November 2026 for [#51](https://github.com/PpAnpt/dineq/issues/51).
**DineQ: partner-declared Accepted for the original release received on 27 November 2026.
The original digest link is recorded and Iivo participation is source-qualified below. New controlled-release acceptance is NOT CONFIRMED. HairRoot: final DineQ decision PENDING in this register.**
Only the independent UAT team records its own decision. A product team's PR
approval is not independent acceptance. The [received-message record](dineq-acceptance-received-20261127.md)
identifies the source and distinguishes a received decision from missing proof.
See [contributions and remaining evidence](contributions-and-gaps.md) for actual
known work, the supplementary-execution return sheet and missing fields.

## DineQ acceptance received from HairRoot

The [latest received-result reconciliation, PR #60](https://github.com/PpAnpt/dineq/pull/60)
preserves the original 25 November 9 PASS / 2 BLOCKED / 0 FAIL run and adds the
26 November 04C OBSERVATION PASS plus partner-reported 08B PASS. Existing R03
close/OPEN records corroborate setup; 08B owner verification is partner-relayed.
HairRoot's later decision is recorded below from the student's relay. The
[release record](controlled-fifo-release-20261127.md) supplies subsequent digest
verification; the latest clarification supplies second-tester contribution statements.

| Field | Prepared value / independent team to complete |
| --- | --- |
| Product / Product Team | DineQ / Anapat Banjerdsilp and Siwarak Chatvichai |
| Independent UAT Team | HairRoot / TH-060_P1 / หัวล้านได้หวี |
| Scope | Sprint 1 F-01 authentication, F-02 joining/own entries, F-03 assigned Host FIFO/completion; DQ-UAT-01..08 including 04A/B/C and 08A/B |
| Application | https://s21271a0d-4d7hbszvwq-as.a.run.app |
| Source commit reference | 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620; handoff-declared, not reverified by the partner follow-up |
| Operation revision before / after | s21271a0d-00005-rdp / s21271a0d-l6-1126161809; subsequent authenticated Cloud Shell evidence in the release record confirms equal image digest |
| Exact version accepted by UAT Team | Original Sprint 1 UAT on s21271a0d-00005-rdp with restart follow-up on s21271a0d-l6-1126161809; baseline 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620. Subsequent release evidence records digest-to-commit verification |
| Initial / follow-up evidence | 25 Nov initial run; 26 Nov CLOSED/restored and restart observations, source-qualified in PR #60 |
| Tithinan contribution | Partner declares Tithinan Sobking wrote and ran the Playwright script and made the original-release decision; exact script revision/per-case times not newly supplied |
| Iivo contribution | Latest partner clarification: DQ-UAT-01 steps 1/3, 26 Nov 2026 at 19:33 on 17c8b90, E-B7-E-B9 cited but not inspected here. Siwarak additionally reports review of retest results/images; review time/items/evidence not supplied. No new retest execution claimed |
| Finding disposition | None, explicitly confirmed in the received partner response; no natural DineQ finding invented |
| Required cases / remaining conditions | Preserve original/follow-up provenance and recorded baseline digest proof; verify cited Iivo E-B7-E-B9 and supplementary review details. Receive promised owner read-back for the separately recorded new retest |
| Final decision | **Accepted**, partner-declared for the original release; received through Siwarak's relay, not a Product Team-authored signature |
| Reasons / limitations accepted | Findings explicitly none; no further rationale or specific minor limitation supplied in this response. Source-qualified run evidence retained |
| Decision made by / team / date and time | Tithinan Sobking / HairRoot TH-060_P1 / 27 November 2026; exact clock time not supplied |
| Decision evidence | [27 Nov received-message record](dineq-acceptance-received-20261127.md), student-relayed partner statement; no separate authored artefact/direct-channel metadata supplied |

### New controlled-release retest is separate

[Latest partner clarification](partner-clarification-20261127.md) explicitly restricts Accepted to original baseline 17c8b90 / 00005-rdp. The new 1ffb8b0 / 00007-pnb has reported DQ-UAT-07 PASS 9/9 only; final new-release decision remains unconfirmed. Owner Refresh/GET supplement is promised, not received. Iivo's original execution and later user-reported review are separate contributions with the source limits above.

### Preserved return template for future independent responses

Copy the fields below and replace PENDING with actual facts. Do not paste a
password, cookie, token or private connection string.

```text
Product: DineQ
Independent UAT team: HairRoot / หัวล้านได้หวี
Tested and accepted version (full commit / revision / verification source): PENDING
Evidence reviewed (initial run, 04C CLOSED/OPEN, 08B comparison): PENDING
Tithinan actual cases/actions/time/evidence: PENDING
Iivo actual cases/actions/time/evidence: PENDING
Unresolved findings or required blocked work: PENDING
Decision (Accepted / Accepted with minor limitations / Not Accepted): PENDING
Reason and any explicitly accepted minor limitations: PENDING
Decision authors and date/time Asia/Bangkok: PENDING
```

An actual response can be retained in an Issue, an authored Markdown file, or
a dated message through the agreed Discord handoff. Do not fabricate a response
or count a Product Team-authored copy of this blank form as independent approval.
The TA-authorized [controlled exercise, PR #64](https://github.com/PpAnpt/dineq/pull/64),
stays separate from this original-release decision and requires its own later
deployed retest. This receipt task sends no message to the partner.

## HairRoot acceptance to be completed by DineQ after independent retest

After HairRoot's readiness notice, Siwarak requested the targeted
[27 November R02 retest](hairroot-retest-2026-11-27-R02.md). Both requested checks
passed. These observations support a later independent decision; they do not
supply a team signature or unrecorded student participation.

| Field | Current record / still required |
| --- | --- |
| Product / owner | HairRoot / หัวล้านได้หวี |
| Independent team | DineQ / Anapat Banjerdsilp and Siwarak Chatvichai |
| Original evidence | [R01](hairroot-run-2026-11-26-R01.md): 5 PASS / 1 FAIL / 1 BLOCKED cases; 39 PASS / 3 FAIL / 1 BLOCKED steps; HR-F01 is one defect |
| Original version | Observed footer ac0a57b; full handoff commit ac0a57b9eb871128807733a0e9d75d77a662b477; declared revision hairroot-sha-ac0a57b9eb87-44992339630-1 |
| Partner fix chain checked 27 Nov | [Issue #57](https://github.com/alvin777777/hairroot/issues/57), [fix PR #58](https://github.com/alvin777777/hairroot/pull/58), [release PR #59](https://github.com/alvin777777/hairroot/pull/59); later readiness notice states deployed 27 Nov 16:44 Bangkok |
| Changed expectations | Student requested retest under the agreed amended emoji prohibition, including the three-emoji negative. Source preserved with R02; original R01 expectation/results unchanged |
| Corrected deployed commit/revision | Public version responses before/after R02 report cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d; observed footer cbaf1ba. Revision hairroot-sha-cbaf1baa38a5-45975306714-2 remains partner-declared, not authenticated GCP verification |
| Fresh fixtures / original baseline | Two fresh 16 Dec slots, 16:43/17:43 Bangkok; positive booking 14 retained. Original bookings 2/3/4 unchanged; no reset/deletion |
| Required retest | Original HR-F01 reproduction against the agreed corrected contract, affected valid-input controls, unchanged state after rejection, UAT-05 step 4 with actual announced redeployment |
| Both students' actual actions | Siwarak privately authenticated C1/S1/C3 and requested assisted R02 actions; actual times/evidence in R02. Anapat execution remains PENDING; no inference from review |
| Retest results / findings | R02: UAT-07-R02 PASS (9 negatives / 1 positive plus unchanged-state reads); UAT-05 step 4 PASS (C1/C3/S1 after actual announced deploy). No new defect observed within this scope. Full seven-case suite not rerun; original FAIL/BLOCKED history retained |
| Final independent decision | PENDING actual DineQ decision, exact version, authors, date/time, reasons and any accepted minor limitations |

## Completion gate

Before finalising either record, check actual tester participation, the exact
tested release, disposition of every finding, actual outcomes of required cases,
and the independent team's own reasoned decision. Required BLOCKED cases and
unresolved critical/major defects prevent Accepted. Unfixed minor defects need
explicit independent acceptance as limitations; the Product Team cannot supply
that agreement. Until the evidence exists, retain PENDING or the actual adverse
decision rather than supplying a convenient signature.
