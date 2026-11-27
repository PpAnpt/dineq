# Lab 6 independent acceptance records

Prepared 27 November 2026 for [#51](https://github.com/PpAnpt/dineq/issues/51).
**Both records are PENDING.** Prepared fields are source references, not a
tester signature or a completed decision. Only the independent UAT team records
its own decision. A product team's PR approval is not independent acceptance.

## DineQ acceptance to be completed by HairRoot

The [latest received-result reconciliation, PR #60](https://github.com/PpAnpt/dineq/pull/60)
preserves the original 25 November 9 PASS / 2 BLOCKED / 0 FAIL run and adds the
26 November 04C OBSERVATION PASS plus partner-reported 08B PASS. Existing R03
close/OPEN records corroborate setup; 08B owner verification is partner-relayed.
HairRoot must confirm the linked evidence and record its actual decision.

| Field | Prepared value / independent team to complete |
| --- | --- |
| Product / Product Team | DineQ / Anapat Banjerdsilp and Siwarak Chatvichai |
| Independent UAT Team | HairRoot / หัวล้านได้หวี |
| Scope | Sprint 1 F-01 authentication, F-02 joining/own entries, F-03 assigned Host FIFO/completion; DQ-UAT-01..08 including 04A/B/C and 08A/B |
| Application | https://s21271a0d-4d7hbszvwq-as.a.run.app |
| Source commit reference | 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620; handoff-declared, not reverified by the partner follow-up |
| Operation revision before / after | s21271a0d-00005-rdp / s21271a0d-l6-1126161809; reported same-image replacement, see PR #60 provenance |
| Exact version accepted by UAT Team | PENDING independent confirmation; identify full commit/revision and source of verification |
| Initial / follow-up evidence | 25 Nov initial run; 26 Nov CLOSED/restored and restart observations, source-qualified in PR #60 |
| Tithinan contribution | Source attributes automated Playwright observations to Tithinan's request; confirm actual case/actions and time |
| Iivo contribution | PENDING actual case/actions, time and evidence; do not infer participation from membership |
| Finding disposition | No product defect submitted in supplied runs; confirm any additional findings or explicitly none |
| Required cases / remaining conditions | Confirm 04C owner evidence and 08B provenance, then list any remaining required BLOCKED work |
| Final decision | PENDING — independent team chooses Accepted / Accepted with explicitly documented minor limitations / Not Accepted |
| Reasons / limitations accepted | PENDING; list Issue, impact and explicit independent agreement for each minor limitation, or state none |
| Decision made by / team / date and time | PENDING actual names and Asia/Bangkok time |
| Decision evidence | PENDING actual authored message/document/Issue URL or retained original, with receipt time |

### Return format for the independent team

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
The TA exercise, if approved, stays separate from the healthy release accepted
here. This preparation sends no message to the partner.

## HairRoot acceptance to be completed by DineQ after independent retest

The student has deferred this retest until HairRoot is ready. Preparing this
record authorizes no booking, deployment or partner source change.

| Field | Current record / still required |
| --- | --- |
| Product / owner | HairRoot / หัวล้านได้หวี |
| Independent team | DineQ / Anapat Banjerdsilp and Siwarak Chatvichai |
| Original evidence | [R01](hairroot-run-2026-11-26-R01.md): 5 PASS / 1 FAIL / 1 BLOCKED cases; 39 PASS / 3 FAIL / 1 BLOCKED steps; HR-F01 is one defect |
| Original version | Observed footer ac0a57b; full handoff commit ac0a57b9eb871128807733a0e9d75d77a662b477; declared revision hairroot-sha-ac0a57b9eb87-44992339630-1 |
| Partner fix chain checked 27 Nov | [Issue #57](https://github.com/alvin777777/hairroot/issues/57), merged [fix PR #58](https://github.com/alvin777777/hairroot/pull/58); [release PR #59](https://github.com/alvin777777/hairroot/pull/59) was still open when checked |
| Changed expectations | Partner proposes rejecting all emoji/emoji-capable symbols; original R01 allowed the three-symbol control. Review and agree the dated amendment before retest; never rewrite the old FAIL |
| Corrected deployed commit/revision | PENDING actual release and readiness notice; a merged fix PR is not a deployed version |
| Fresh fixtures / original baseline | PENDING quiet window and unused slots; preserve original bookings 2/3/4 and other R01 evidence, no reset/deletion |
| Required retest | Original HR-F01 reproduction against the agreed corrected contract, affected valid-input controls, unchanged state after rejection, UAT-05 step 4 with actual announced redeployment |
| Both students' actual actions | PENDING fresh case/action/time/evidence attribution; original R01 does not establish Anapat execution |
| Retest results / findings | NOT EXECUTED for the corrected release; retain original FAIL/BLOCKED history |
| Final independent decision | PENDING actual DineQ decision, exact version, authors, date/time, reasons and any accepted minor limitations |

## Completion gate

Before finalising either record, check actual tester participation, the exact
tested release, disposition of every finding, actual outcomes of required cases,
and the independent team's own reasoned decision. Required BLOCKED cases and
unresolved critical/major defects prevent Accepted. Unfixed minor defects need
explicit independent acceptance as limitations; the Product Team cannot supply
that agreement. Until the evidence exists, retain PENDING or the actual adverse
decision rather than supplying a convenient signature.
