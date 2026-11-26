# DineQ owner preparation for DQ-UAT-04C and DQ-UAT-08B

Prepared on 26 November 2026 after receipt of `UAT-DinoQ-Pic.zip`. The final
25 November partner run records **9 PASS / 2 BLOCKED / 0 FAIL**. The later
`BLOCKED-EVIDENCE: PASS` means context screenshots were captured; it does not
pass either blocked case. Earlier STOPPED attempts remain historical attempts.

This task prepares the existing cases, not a new feature or a defect. Work is on
`codex/lab6-dineq-uat-operations`, branched from `lab6-staging`. No main merge,
new source release, IAM/billing change, database reset, reseed or ticket cleanup
is part of this work. The student's instruction to prepare the remaining cases
authorizes the bounded owner preparation; actual execution/time is recorded
separately, never inferred from this document.

## Exact scope and sequence

- Project `cpe-se-course-2026`, region `asia-southeast1`, service `s21271a0d`,
  existing database job `s21271a0d-migrate`.
- Queue `22222222-2222-4222-8222-222222222222`; verify its identity and OPEN state.
- Operator: Siwarak Chatvichai, with assisted commands; do not attribute an
  operation to Anapat or an independent tester who did not perform it.
- HairRoot retains the independent tester role. Agree a quiet window and have
  its tester ready **before closing the queue**. Do not leave a closed fixture
  waiting for an unavailable tester.
- Snapshot fresh queue/ticket/event state. Old partner IDs are historical hints,
  not a substitute for a fresh before-read. Preserve unrelated entries.
- Close only the target queue with a guarded transaction. HairRoot executes
  04C: CLOSED UI, valid-size join gives 409 QUEUE_CLOSED, no new ticket. Restore
  the original OPEN state promptly, including if the independent test fails.
- For 08B take another fresh baseline after OPEN restoration. HairRoot saves
  fresh before-data for the retained completed/waiting fixtures. Freeze ticket
  mutations, then replace the app revision using the **currently served image
  digest** and existing bindings/database. Do not restart Cloud SQL or deploy a
  locally built image. Save old/new revisions, command/time and health checks.
- HairRoot independently reads the same tickets after the operation and records
  its actual results. The owner compares stored entries/events/counter as
  supporting evidence, not as an independent UAT sign-off.

The supplied final-run IDs are T02 `37696ade-6374-46bb-b603-4e19e5f48af4`
(COMPLETED) and T08 `922aad64-621e-402b-b926-20d0c1fef4ce` (WAITING).
Check them immediately before the new session. If they changed, agree a fresh
fixture with the testers; never silently edit these records to match old data.

## Operator tooling

The accompanying Cloud Shell helper uses the existing job's database binding
and per-execution argument overrides. It does not print DATABASE_URL, read
passwords, alter the persistent job definition, or install cloud credentials
on this PC. It refuses an unsupported job command, a different job image,
split traffic, or a queue snapshot mismatch. All generated evidence stays
under an ignored/local output directory until reviewed for publication.

Read the exact commands and prerequisites below after implementation. A missing
Cloud Shell login/permission or unavailable independent tester remains a real
dependency; do not broaden IAM or invent a completed run.

## Current execution record

| Item | Actual state |
| --- | --- |
| Received final partner execution | 9 PASS / 2 BLOCKED / 0 FAIL, 25 November |
| Authenticated live service/image verification in this task | NOT EXECUTED |
| Fresh owner DB snapshot | NOT EXECUTED |
| CLOSED preparation / OPEN restoration | NOT EXECUTED |
| Same-image new revision / readiness | NOT EXECUTED |
| HairRoot independent 04C / 08B results | BLOCKED pending preparation/session |
| Second HairRoot student's participation / final acceptance | Not confirmed in supplied report |

Keep the original blocked record and add a dated new attempt. Preparation,
operator database comparisons and an automated health response do not change
the independent result to PASS.
