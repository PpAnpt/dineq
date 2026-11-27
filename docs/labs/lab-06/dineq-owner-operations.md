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

The per-execution override follows the official
[gcloud run jobs execute reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/execute).
A missing
Cloud Shell login/permission or unavailable independent tester remains a real
dependency; do not broaden IAM or invent a completed run.

### Cloud Shell commands

Copy `tools/cloud-owner.py` and `tools/queue-owner-operation.mjs` together to a
private Cloud Shell working directory. No password is needed by these tools;
they use the existing job's binding. From that directory:

```bash
python3 cloud-owner.py inspect --output evidence/inspect.json
python3 cloud-owner.py snapshot --output evidence/04C-before.json
```

Confirm the named independent testers are present, C3 has no active ticket and
the queue is quiet. The next command refuses an older-than-30-minute baseline.
Do not run close until HairRoot is ready to exercise 04C immediately:

```bash
python3 cloud-owner.py close --baseline evidence/04C-before.json --testers-ready --output evidence/04C-closed.json
# HairRoot now independently executes 04C C1-C3 and saves UI/API evidence.
python3 cloud-owner.py restore --baseline evidence/04C-before.json --output evidence/04C-restored.json
```

Run restore even if the test fails or an unexpected ticket mutation is seen.
It restores OPEN while reporting a changed data hash as a failure, preserving
the changed record for investigation. Do not retry a completed command using
the same output filename. If a job/log read fails after close, restore promptly
with a new output filename and inspect the actual operation; never assume it
rolled back merely because the CLI failed.

Before 08B, independently read T02/T08 again and preserve the exact JSON fields
and screenshots. If the historical fixtures no longer match, agree replacements
and record the new identifiers. Take a fresh owner snapshot, announce the exact
same-image revision replacement, then run:

```bash
python3 cloud-owner.py snapshot --output evidence/08B-before.json
python3 cloud-owner.py restart --baseline evidence/08B-before.json --testers-ready --output evidence/08B-owner-after.json
# HairRoot independently executes 08B B3-B4 against the same recorded tickets.
```

The restart result includes old/new revision, immutable image digest, command,
health/readiness and a DB comparison. It is an application process replacement
through a new revision of the same image, not an OS or database restart. A
successful owner command is supporting evidence, not a replacement for the
independent tester's result. Retain the evidence privately until sanitized.

### Local tool verification

From the repository root in PowerShell, with the separate TEST_DATABASE_URL in
the ignored local `.env` and PostgreSQL running:

```powershell
node --test docs/labs/lab-06/tools/queue-owner-operation.test.mjs
python docs/labs/lab-06/tools/cloud-owner.py --help
```

The test creates one uniquely named schema in the test database, exercises the
guarded close/restore and mismatch recovery against real PostgreSQL, then drops
only that schema. It never resets the existing test data or touches GCP.

## Agreed availability

The student reports on 26 November that HairRoot will be ready **by 22:00 Asia/Bangkok**. This is availability, not confirmation that its testers are already observing. Keep Q OPEN until their actual ready message. Tooling is available in Cloud Shell under `~/dineq-lab6-owner-v2`; the uploaded v2 ZIP SHA-256 is `265ba19bba2fff48085b54a2c82c2c95e4511439feb9ff0e6c04f600fcb5a614`. Run a fresh baseline for the actual session rather than reusing an older preparation snapshot.

## Current execution record

| Item | Actual state |
| --- | --- |
| Received final partner execution | 9 PASS / 2 BLOCKED / 0 FAIL, 25 November |
| Authenticated live service/image verification in this task | Verified 26 November at 21:47:38 Bangkok: revision s21271a0d-00005-rdp, 100% traffic; existing job DB binding matches service; linux/amd64 image digest matches |
| Fresh owner DB snapshot | Completed at 21:48:59 Bangkok; job execution s21271a0d-migrate-bpt96; Q OPEN, next ticket 18, 17 entries / 49 events; T02 ticket #12 COMPLETED and T08 ticket #17 WAITING retained |
| CLOSED preparation / OPEN restoration | NOT EXECUTED |
| Same-image new revision / readiness | NOT EXECUTED |
| HairRoot independent 04C / 08B results | BLOCKED pending preparation/session |
| Second HairRoot student's participation / final acceptance | Not confirmed in supplied report |

Keep the original blocked record and add a dated new attempt. Preparation,
operator database comparisons and an automated health response do not change
the independent result to PASS.

## Actual preparation evidence

See [selected authenticated preparation fields](../../evidence/lab6/dineq-owner-20261126/preparation.json). The full original snapshot remains in Cloud Shell at `~/dineq-lab6-owner-v2/evidence/preparation-before.json`. This is an owner read/short queue-row lock, with no ticket/queue status write. A local download of the full original was not verified; do not claim that the transcribed subset is the raw export. The existing migration job definition was preserved; its one-off execution ran only the snapshot helper, not a migration or seed.

Next live command, only after HairRoot confirms actual readiness: take a fresh snapshot as `evidence/04C-before.json`, close with that baseline, obtain independent 04C observations, restore OPEN, then take a separate fresh 08B baseline before the announced same-image revision replacement. Both independent subcase outcomes remain BLOCKED until the testers supply their actual new attempt.
