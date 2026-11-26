# DineQ received UAT results and triage - 26 November 2026

Tracking: [L6-5 / #49](https://github.com/PpAnpt/dineq/issues/49). Product Team:
Anapat Banjerdsilp and Siwarak Chatvichai. Independent UAT Team: HairRoot,
team หัวล้านได้หวี. This record covers findings **received about DineQ**;
[HR-F01](hairroot-finding-HR-F01.md) is a different product's defect, reported
by DineQ about HairRoot, and must not be counted as a DineQ defect.

## Received source and actual results

The student supplied `UAT-DinoQ-Pic.zip` on 26 November. Exact delivery time was
not supplied. Archive SHA-256:
`1760da3a3375db247396793f5bdc5451d7e37ed1aba8764468e5383f9d761466`.
The [source manifest](../../evidence/lab6/dineq-partner-20261125/source-manifest.json)
records selected original-byte copies, hashes and historical stopped attempts.
The original ZIP stays local; executable scripts, credential input and unrelated
cleanup/preflight files are not copied into this review.

The [final partner JSON](../../evidence/lab6/dineq-partner-20261125/final-run.json)
reports **9 PASS / 2 BLOCKED / 0 FAIL**, across eleven case/subcase rows. Its
actual result timestamps span 25 November 2026, 21:19:29 to 21:19:59 Bangkok
(14:19:29 to 14:19:59 UTC). `startedAt` in that source is 14:19:59.131Z,
later than some result rows: preserve it as supplied; do not silently use it as
the actual beginning or rewrite source timestamps. The filename timestamp is
not itself a verified start time.

Named operator: **Tithinan Sobking, automated Playwright session**. The source
explicitly says the second independent tester is not confirmed. Do not sign
Iivo's participation or an acceptance decision on their behalf. This triage is
a Product Team review of submitted results, not a new independent execution.

| Case / subcase | Received result | Partner-recorded observation | Triage disposition |
| --- | --- | --- | --- |
| DQ-UAT-01 | PASS | Authentication, Customer/Host role, logout and unassigned Host checks | Retain reported PASS; no defect submitted |
| DQ-UAT-02 | PASS | Same ticket #12 WAITING -> CALLED -> COMPLETED | Retain reported PASS and fixture T02 |
| DQ-UAT-03 | PASS | Duplicate joins rejected in WAITING and CALLED; original ticket #13 completed | Retain reported PASS; no defect submitted |
| DQ-UAT-04A | PASS | UI rejects 0/9/1.5; API rejects 0/9/1.5/"four"; state unchanged | Retain reported PASS for invalid sizes |
| DQ-UAT-04B | PASS | Sizes 1 and 8 accepted as #10/#11 and completed | Retain reported PASS for valid boundaries |
| DQ-UAT-04C | BLOCKED | No owner-prepared CLOSED queue | Setup dependency DQ-DEP-01; no product defect established |
| DQ-UAT-05 | PASS | Unauthorized requests 401/403; C2 fixture preserved for ownership check | Retain reported PASS; no defect submitted |
| DQ-UAT-06 | PASS | C1 denied C2's known ticket; owner data unchanged | Retain reported PASS; no defect submitted |
| DQ-UAT-07 | PASS | FIFO, unresolved-call/invalid-transition checks; empty call 404 | Retain reported PASS; no defect submitted |
| DQ-UAT-08A | PASS | Reload and new-session reads retain T02 COMPLETED / T08 WAITING | Retain reported PASS for 08A only |
| DQ-UAT-08B | BLOCKED | No owner-confirmed actual app restart with before/after comparison | Setup dependency DQ-DEP-02; no persistence defect established |

PASS here means the partner's recorded outcome for the stated checks. It does
not establish every AC or internal invariant from UI observations. The reviewed
[case coverage limits](uat-cases.md#4-coverage-and-limits-of-observation) and
separate developer tests still apply. In particular 08A does not satisfy 08B,
and partial 04A/B execution does not turn unexecuted CLOSED behavior into PASS.

## Product finding register

**No DineQ product defect, duplicate report or enhancement was submitted in the
received final run. Accepted DineQ defects: 0.** Severity, fix owner and defect
Issue are therefore **N/A**, not invented values. The two blocked prerequisites
below are not accepted defects. If a later attempt reports behavior violating
the contract, add a dated finding with reproduction, expected/actual, severity,
owner and links; preserve this earlier none-received state.

The source says no FAIL, not that DineQ is defect-free or accepted. Do not create
a fake defect or damage the live release to fill the defect-correction section.

## Open prerequisite dispositions

| Record | Contract / agreed case | Impact and disposition | Owner / next real action | Evidence / linked work |
| --- | --- | --- | --- | --- |
| DQ-DEP-01 | F-02 AC-12: CLOSED join is 409 QUEUE_CLOSED, no inserted ticket/counter use; 04C | BLOCKED setup, **not a product defect**. CLOSED behavior remains unexecuted in this partner run; severity N/A | DineQ / Siwarak prepares a bounded CLOSED window and restores OPEN; HairRoot independently checks UI/API/state | [Original OPEN context](../../evidence/lab6/dineq-partner-20261125/04C-blocked-open.png), [owner procedure](dineq-owner-operations.md), #47 / #49 |
| DQ-DEP-02 | F-02 AC-21 / NFR-02 and agreed 08B actual restart | BLOCKED owner operation, **not a reported data-loss defect**. Reload/new login cannot close it; severity N/A | DineQ / Siwarak announces same-image revision replacement using the same DB; HairRoot captures fresh before/after ticket reads | [Original pre-restart context](../../evidence/lab6/dineq-partner-20261125/08B-blocked-before.png), [owner preparation](../../evidence/lab6/dineq-owner-20261126/preparation.json), #47 / #51 |
| DQ-DEP-03 | Independent tester contributions and version-bound acceptance | Execution contribution / acceptance evidence incomplete; no sign-off may be inferred | HairRoot names the actual participating tester(s), their actions/time and final decision; DineQ retains the record | Source `bothIndependentTestersConfirmed: false`; #45 / #51 |
| DQ-DEP-04 | Exact deployed release at execution | Partner used handoff reference; authenticated live commit/image was not verified during 25 November run | Teams confirm the version for the next attempt and preserve provenance of earlier evidence | Source `versionSource`; current owner check below; #45 / #51 |

Owner preparation on 26 November at 21:47-21:48 Bangkok authenticated revision
`s21271a0d-00005-rdp` serving 100% traffic and runtime digest
`sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8`.
Its existing job has the same DB binding and matching linux/amd64 image manifest.
This later check supports **current** readiness; it does not retroactively
prove every 25 November screenshot ran that revision or resolve DQ-DEP-04.

The fresh owner snapshot at 21:48:59 Bangkok, execution
`s21271a0d-migrate-bpt96`, found Q OPEN, 17 entries, 49 events and next ticket 18.
The retained fixtures still match the partner IDs: T02
`37696ade-6374-46bb-b603-4e19e5f48af4` (#12, size 4, COMPLETED) and T08
`922aad64-621e-402b-b926-20d0c1fef4ce` (#17, size 2, WAITING).
No queue state or ticket was changed by that snapshot. Original evidence stays
in Cloud Shell, with explicitly transcribed selected fields linked above.

The student reports HairRoot ready **by 22:00 Bangkok on 26 November**, not an
actual ready/observing confirmation. Take fresh before-data in the actual quiet
window; no close or restart is performed merely because this time arrives.

## Evidence interpretation and captions

| Evidence | Actual action / expected versus actual | Outcome and limits |
| --- | --- | --- |
| DQ-R01-JSON / final-run.json | Partner's final recorded run at the stated DineQ URL; eleven rows | 9 PASS / 2 BLOCKED / 0 FAIL, unmodified source bytes; reported baseline 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620 / s21271a0d-00005-rdp, explicitly unverified by that run |
| DQ-04C-CONTEXT / 04C-blocked-open.png | 25 Nov 21:24:50.391 Bangkok, H1 at `/queues`; preparing 04C needs CLOSED; screen actually shows OPEN | BLOCKED context, not a successful CLOSED/rejection test; original screenshot bytes preserved |
| DQ-08B-CONTEXT / 08B-blocked-before.png | 25 Nov 21:24:50.958 Bangkok, C2 at `/my-queue`; before-data shows #17 WAITING, #16/#14/#9 COMPLETED | Before restart only; no after-operation evidence or persistence PASS implied |
| DQ-CONTEXT-JSON / blocked-context.json | Source records screenshot capture only at 25 Nov 21:24:51.048 Bangkok | `BLOCKED-EVIDENCE: PASS` means capture succeeded; it is **not** a twelfth UAT row or a PASS for 04C/08B |
| DQ-OWNER-PREP / preparation.json | Authenticated owner checks on 26 Nov, with timestamps/revision/fixtures | Supporting later preparation, not independent execution or retrospective acceptance |

Selected source PNGs show synthetic test account identities and ticket IDs, not
passwords or sessions. Only these two prerequisite context images are included
here; the received ZIP holds the partner's wider screenshot set. Do not present
this selected set as a complete exported screenshot archive.

## Historical interrupted attempts

The archive also contains seven earlier `run-report.json` attempts with STOPPED
rows. Reasons include missing helper environment lookup, an identity-visibility
assertion, JavaScript initialization/name errors, an unexpected join-response
shape and an already-active fixture. Preserve their source hashes and actual
STOPPED reasons in the manifest. These attempts are neither silently discarded
nor added to the final eleven-row totals. A helper/setup interruption is not,
by itself, a reproduced DineQ product defect; the final successful checks do not
erase earlier attempts or independently explain every interrupted assertion.

## Work ready before the next session

- Incoming result/defect/prerequisite register, source hashes and captions:
  prepared in this record; peer review pending.
- Owner close/restore/restart procedure: locally tested and live snapshot
  completed; actual CLOSED/restart and partner observations still pending.
- PDF-ready Part C material: the product-finding and prerequisite tables above.
  They can be incorporated while other evidence is outstanding; no final PDF
  or final acceptance is claimed here.
- If complete independent DineQ UAT yields no legitimate defect, request the
  instructor/TA-approved isolated exercise under Lab 6 section 3.5 for #50.
  This is a conditional next step, not an approved or performed exercise.

Keep #49 open through review and any newly received results; #47/#48/#50/#51/#52
are not closed by this triage. No existing STS PASS/FAIL records, application
contracts, live data, cloud service configuration or independent decisions are
changed by this document.

## Validation of this register

Local structural validation recomputed every selected source SHA-256 and compared copied bytes directly with the ZIP, confirmed eleven unique IDs and exactly 9 PASS / 2 BLOCKED / 0 FAIL, matched all eleven table rows to source statuses, preserved seven earlier STOPPED attempts separately, and resolved local Markdown file links. Gitleaks scanned Lab6 documents/tools and the selected incoming evidence with no leaks found; whitespace checks passed. These are evidence/document checks, not a new product test run. The earlier owner helper test against real local PostgreSQL was 1 PASS / 0 FAIL / 0 SKIPPED; cloud snapshot execution succeeded separately. Hosted CI on the new PR must be checked independently.
