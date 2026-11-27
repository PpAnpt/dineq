# DineQ received UAT follow-up R02

Reviewed 27 November 2026 under [#49](https://github.com/PpAnpt/dineq/issues/49).
This is a Product Team reconciliation of HairRoot's supplied 26 November
observations, not a new execution or an acceptance decision. The original
[25 November run](dineq-received-triage.md) remains **9 PASS / 2 BLOCKED / 0 FAIL**.
Do not overwrite its JSON or infer that every case was rerun on 26 November.

## Sources and responsibility

The student supplied `UAT-DinoQ-Pic-2 (2).zip`, SHA-256
`77cc56a568662cb97c03f9f54f98b0fa55795a871bcc66aeb5f8a338304efbdf`.
The [evidence index](../../evidence/lab6/dineq-partner-20261126/README.md)
and [manifest](../../evidence/lab6/dineq-partner-20261126/source-manifest.json)
identify 23 unchanged selected original files and excluded prep-only attempts.
The partner's summary is retained in the local source ZIP and its hash is
recorded in the manifest. Its statements below are attributed to that source.

- Product Team/operator: DineQ; Siwarak's existing authenticated R03 close/restore
  record is [cross-linked here](dineq-owner-run-R03.md).
- Independent observations: automated Playwright session requested by Tithinan
  Sobking, as declared by the partner source.
- Iivo's actual execution contribution is not observed in that source.
- The partner summary says no operator action was directly observed by its
  tester; its 08B Cloud Shell comparison is explicitly relayed evidence. This
  does not negate the earlier authenticated R03 record or convert relayed 08B
  fields into a new authenticated read by this reconciliation.

## Timeline and actual comparisons

All times below are **26 November 2026 Asia/Bangkok**. Original UTC timestamps
remain in the linked JSON; ZIP/file creation times are not execution times.

| Time | Actual action and evidence | Expected / actual outcome |
| --- | --- | --- |
| 22:53 | [Fresh partner prep](../../evidence/lab6/dineq-partner-20261126/results/2026-11-26T15-53-41-810Z-prep.json) | OPEN baseline, C3/H1 lists and retained T02/T08 saved; PREPARED only |
| 22:58:56.155 | Existing [R03 guarded close](dineq-owner-run-R03.md), execution s21271a0d-migrate-jb6l9 | CLOSED, counter 18, unchanged=true; actual owner setup |
| 23:07:36–23:07:45 | [Independent closed attempt](../../evidence/lab6/dineq-partner-20261126/results/2026-11-26T16-07-36-406Z-closed.json) | CLOSED and Join disabled; valid size 4 yields 409 QUEUE_CLOSED; C3 and H1 lists identical before/after |
| 23:09:47.375 | Existing [R03 OPEN restoration](dineq-owner-run-R03.md), execution s21271a0d-migrate-ll8kb | OPEN, counter 18, unchanged=true |
| 23:11:36–23:11:41 | [Independent restored check](../../evidence/lab6/dineq-partner-20261126/results/2026-11-26T16-11-36-096Z-restored.json) | OPEN; C3 and H1 lists equal the rejected-attempt after-state |
| 23:12:36–23:12:45 | [Fresh 08B baseline](../../evidence/lab6/dineq-partner-20261126/results/2026-11-26T16-12-36-455Z-prep.json) | T02 #12 COMPLETED / size 4; T08 #17 WAITING / size 2; full JSON bodies saved |
| 23:20:42–23:20:49 | [Independent after-read](../../evidence/lab6/dineq-partner-20261126/results/2026-11-26T16-20-42-923Z-after-restart.json) | Both entire ticket bodies, IDs and timestamps equal baseline; t02Matches=true / t08Matches=true |
| 23:24; later comparison reports 23:27 | [Relayed inspect](../../evidence/lab6/dineq-partner-20261126/results/08B-owner-inspect-relayed.md) and [later owner comparison](../../evidence/lab6/dineq-partner-20261126/results/08B-owner-before-after-comparison.md) | Distinct revision, same image/DB binding, 100% traffic; same 17 entries / 49 events / data hash |

The 08B owner script was interrupted during its final database verification
after creating the distinct revision. The later relayed snapshot/comparison
reports completion of that verification without another restart. Preserve this
qualification. The earlier inspect's pending-DB statement is historical; the
later comparison supplies the subsequent reported result. Original owner JSON
files remain in Cloud Shell and have not been imported or newly authenticated
by this task.

## Version and retained records

| Field | Recorded value and source limit |
| --- | --- |
| Application | https://s21271a0d-4d7hbszvwq-as.a.run.app |
| Source commit | 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620; handoff reference, not reverified by the follow-up tester |
| Revision before / after 08B | s21271a0d-00005-rdp / s21271a0d-l6-1126161809; partner-relayed owner comparison |
| Runtime image | sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8; reported equal before/after |
| Queue | 22222222-2222-4222-8222-222222222222; OPEN / counter 18 after restoration |
| T02 | 37696ade-6374-46bb-b603-4e19e5f48af4; #12, size 4, COMPLETED |
| T08 | 922aad64-621e-402b-b926-20d0c1fef4ce; #17, size 2, WAITING; not called/completed in this follow-up |
| Owner data hash | 1c6c296bf941a8d8ae256ee428004cb0b0899a88cbb58c60069750b4e87bae59; partner-relayed before/after equality |

## Latest outcome without rewriting the original run

| Scope | Supplied result | Product Team disposition |
| --- | --- | --- |
| Original nine passing rows | 9 PASS, 25 Nov | Retain historical results; no claim of a complete new run |
| DQ-UAT-04C | OBSERVATION PASS; partner summary still asks for owner evidence | Actual 409, disabled Join, unchanged lists and OPEN restoration checked. Existing R03 owner proof now linked; return this reconciliation for independent confirmation |
| DQ-UAT-08B | PASS in partner summary; raw after-read is OBSERVATION_PASS | Retain partner-reported PASS with the explicit relayed owner comparison and interrupted-script qualification |
| Submitted DineQ defects | 0 | No new defect, duplicate or enhancement submitted; severity/defect owner/fix issue N/A |
| Final independent acceptance | Not supplied | PENDING under #51; cannot be filled by the Product Team |

Across attempts there are **ten partner-reported PASS subcase outcomes and one
04C OBSERVATION PASS**, with owner closure/restoration now corroborated locally.
This is a source-qualified reconciliation of eleven subcases, not an original
single-run result of 11 PASS. Neither the first run nor its BLOCKED history is
erased. No product FAIL was submitted in these two received runs; this does not
prove the absence of all defects or satisfy the separate TA exercise.

## Prerequisite dispositions and remaining work

| Record | Latest disposition | Remaining action |
| --- | --- | --- |
| DQ-DEP-01 / CLOSED fixture | Operational setup/restoration supplied; actual rejection observed | HairRoot acknowledges the linked R03 operator records in its final case/acceptance record |
| DQ-DEP-02 / restart fixture | Partner reports PASS with before/after ticket comparison and relayed operation proof | Retain/export original owner JSON for final PDF corroboration when available; preserve source qualification |
| DQ-DEP-03 / participation and acceptance | Still pending | Record actual actions by both independent students and the version-bound decision; do not count PR review as test execution |
| DQ-DEP-04 / version provenance | Later same-image revision evidence supplied | Preserve earlier declared-versus-observed version limits; independent team confirms the version it accepts |
| #50 / no natural DineQ defect | No approved exercise recorded | Prepare a §3.5 request; record actual sending/reply when available. No invented bug or change to live service |

This completes source reconciliation available to #49, subject to teammate
review. Keep #49 In Review when a PR is opened, not Done before review/integration.
The independent confirmation belongs to #51; report compilation belongs to #52.
No live mutation, redeploy, partner message or TA email was performed here.

## Local validation

Source review compared all 23 copied originals byte-for-byte and by SHA-256,
checked the CLOSED response code, full C3/H1 list equality, restored OPEN/list
equality, and every saved T02/T08 field across the 08B baseline and after-read.
Gitleaks scanned the imported text with no leaks found. These are source and
documentation checks, not a new product test run or an independent sign-off.
