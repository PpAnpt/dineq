# DineQ remaining UAT handoff: 04C and 08B

Prepared: 26 November 2026. This packet lets HairRoot and the available DineQ
teammate finish the remaining checks without waiting for Siwarak personally.
**It is a procedure and blank result sheet, not an executed PASS or acceptance.**

## 1. Who needs to be present

| Role | Person/team | Work |
| --- | --- | --- |
| Independent UAT testers | HairRoot: Tithinan Sobking and Iivo Peter Alvey Ranne | Operate Customer/Host UI/API, capture before/after evidence, record actual results and decide DineQ acceptance |
| Product operator | Available DineQ member: Anapat / PpAnpt or Siwarak / BBINGOAL | Use their own existing authorized GCP account, prepare CLOSED/OPEN and the same-image app restart, retain actual operation records |

Name who actually operates each step. A teammate can take over as DineQ owner;
they do not need Siwarak to stay online if they already have the necessary
authorized GCP access. **HairRoot testers do not receive DineQ Cloud/DB access
from this packet and must not be asked to execute owner commands.** If nobody
from DineQ is available with working access, perform the read-only preparation
and leave the owner-dependent steps BLOCKED. Passing a document does not remove
that dependency. Do not change IAM, share a Google login, or send credentials.

## 2. Current facts and fixed targets

Previous HairRoot run on 25 November: **9 PASS / 2 BLOCKED / 0 FAIL**. Keep that
record and add a new attempt for each remaining subcase; do not rewrite it.

| Item | Value |
| --- | --- |
| DineQ URL | https://s21271a0d-4d7hbszvwq-as.a.run.app/login |
| Queue Q | `22222222-2222-4222-8222-222222222222` - DineQ Demo Restaurant |
| C1 / completed-ticket owner | `customer03@dineq.test` |
| C2 / waiting-ticket owner | `customer04@dineq.test` |
| C3 / CLOSED-attempt Customer | `customer05@dineq.test` |
| H1 / assigned Host | `host1@dineq.test` |
| T02 | `37696ade-6374-46bb-b603-4e19e5f48af4`, ticket **12**, partySize **4**, **COMPLETED** |
| T08 | `922aad64-621e-402b-b926-20d0c1fef4ce`, ticket **17**, partySize **2**, **WAITING** |
| Declared baseline source commit | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` |
| Last authenticated revision check | `s21271a0d-00005-rdp`, 100% traffic, 26 Nov 21:47 Bangkok |
| Last authenticated runtime digest | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` |
| Last owner DB read | 26 Nov 21:48:59 Bangkok: Q OPEN, next counter 18, 17 entries / 49 events; both fixtures above retained |

These are historical reference values. Re-read the actual queue, fixtures and
service immediately before the new attempt. Do not assume current state from
this file, a health response, static login label or an old screenshot. If either
fixture changed, stop and agree a replacement with the owner; never edit it back
to the expected state. No deployment or reset of application data is needed.

Use the demo password already delivered privately. Do not send it to an agent,
store it in this file, capture the login payload, or export browser cookies.
Use isolated browser profiles for C1, C2, C3 and H1, or explicit logout/login;
two tabs in one profile share a session. Verify visible email/role each time.

## 3. Start message and session gates

Before any live owner change, complete and share this short record in the agreed
Discord channel **รอดไหมปี3**, using account labels and no secrets:

```text
DineQ remaining UAT attempt: __________
Date/time + timezone: __________
Independent testers and who operates each actor: __________
DineQ operator: __________
Actual full source commit / serving revision / image digest: __________
Q verified; C3 has no active ticket; T02/T08 fields freshly saved: YES / NO
Quiet queue window reserved; no joins/call/complete during comparison: YES / NO
Testers ready to observe CLOSED and the announced same-image replacement: YES / NO
```

Until those gates are met, testers can sign in, verify their own records and
capture preparation. **Do not Join, Call Next or Complete T08.** It is deliberately
retained WAITING for the restart comparison. Preserve unrelated tickets.

## 4. Same-origin API helper for independent testers

Only use this in the browser's Developer Tools Console while signed into the
correct DineQ actor at the URL above. It uses the browser's existing session;
it does not read or print a password/token/cookie. It does not run any request
until called. Label these observations **manual API checks** in the report.

```javascript
async function dq(path, { method = 'GET', body } = {}) {
  const response = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const result = { status: response.status, body: await response.json() };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
```

Read-only actor check: `await dq('/auth/me')`. If any read returns an error,
stop and record the actual error; do not compare missing data as a PASS. Capture
only relevant responses/UI, not the Network login request or browser storage.

## 5. DQ-UAT-04C: joining a CLOSED queue

Requirement: F-02 AC-12. Expected: CLOSED UI, disabled Join, valid-size API join
returns **409 QUEUE_CLOSED**, no new ticket and no state change from that request.

1. **HairRoot / C3:** sign in, check identity, open Queues and My queue. Confirm
   no active C3 ticket in Q. Save `await dq('/me/entries')` as C3 before-data.
   H1 separately saves `await dq('/queues/22222222-2222-4222-8222-222222222222/entries')`.
   Tell the DineQ operator: **"04C before-data saved; ready for CLOSED."**
2. **DineQ operator:** take a fresh owner snapshot and close only Q using section
   7. Announce actual time, Q and confirmed CLOSED status. If close fails, inspect
   actual state; never assume the operation rolled back from a CLI error alone.
3. **HairRoot / C3:** refresh Queues. Capture the CLOSED label and disabled Join
   controls. Do not change HTML to re-enable buttons. Run the explicit API step:

   ```javascript
   const closedAttempt = await dq('/queues/22222222-2222-4222-8222-222222222222/entries', {
     method: 'POST', body: { partySize: 4 },
   });
   ```

   Expected HTTP **409**, `body.error.code === 'QUEUE_CLOSED'`, no success ticket.
   Save actual response/time. If a ticket is created, record FAIL and its ID;
   do not delete it or continue further mutations.
4. **HairRoot:** C3 re-reads `/me/entries`; H1 re-reads the same Host list. Compare
   IDs/counts/status/fields with before-data; no new/changed ticket is expected.
   Tell the operator **"04C observations saved; restore OPEN now."** This message
   is needed even when a test fails.
5. **DineQ operator:** restore original OPEN immediately and retain the actual
   restore output. Data-hash mismatch is an investigation, not permission to
   rewrite ticket data. Do not leave the queue CLOSED if the tester disconnects.
6. **HairRoot:** refresh Queues and verify OPEN restoration before 08B. Do not
   click Join as a readiness check. Record a separate actual 04C outcome.

Required evidence: fresh C3/H1 before-data, CLOSED UI, actual 409/error code,
C3/H1 unchanged after-data, owner's close/restore records, OPEN UI, tester/time/
version. A screenshot of OPEN before closure does not pass this case.

## 6. DQ-UAT-08B: persistence across actual app replacement

Requirement: F-02 AC-21 / NFR-02 and the agreed actual-restart subcase. Use the
same database and exactly the currently served image digest; create a distinct
app revision. This is an app-process replacement, not an OS/Cloud SQL restart.

1. **HairRoot / C1:** open My queue, find ticket **12**, capture its card and:

   ```javascript
   const beforeT02 = await dq('/entries/37696ade-6374-46bb-b603-4e19e5f48af4');
   ```

2. **HairRoot / C2 in its own session:** find ticket **17**, capture its card and:

   ```javascript
   const beforeT08 = await dq('/entries/922aad64-621e-402b-b926-20d0c1fef4ce');
   ```

   Save both **full ticket response bodies** outside temporary Console variables,
   since a new session/reload may clear those variables. Compare fresh before-data
   to the reference IDs/states; stop on mismatch. Save the owner-confirmed old
   commit/revision/image/time, then announce **"08B before-data saved; ready."**
3. **DineQ operator:** take a separate fresh 08B snapshot and run the section 7
   same-image replacement. Save the exact command, time, old/new revision,
   unchanged image digest, health/readiness and data comparison. Announce
   **"New revision ready: [actual name], same image/database; re-read now."**
   A browser refresh or waiting for an idle service does not satisfy this step.
4. **HairRoot:** after that announcement, sign in again if needed and refresh
   each owner's My queue. Re-run the exact GET for each ticket in the correct
   owner's session. Capture cards and full response bodies. Expected: same IDs,
   queue, ticket numbers, party sizes, statuses and created/called/completed
   timestamps as fresh before-data. #12 remains COMPLETED, #17 remains WAITING.
5. **HairRoot:** compare before/after records and enter actual PASS / FAIL /
   BLOCKED with evidence references. Missing/deleted/changed ticket is FAIL;
   absent owner-operation proof or no actual operation is BLOCKED. Do not infer
   a PASS from health being green or a new revision name alone.

Leave T08 WAITING until evidence is saved and its owner agrees cleanup. This
packet does not authorize completing it or other entries to clear the queue.
If an error interrupts the operation, keep logs, record actual service/fixture
state, and arrange a new attempt rather than substituting earlier Lab 5 proof.

## 7. DineQ operator only: exact Cloud Shell commands

Use your own authorized account in project **cpe-se-course-2026**. The prepared
tools already exist in **Siwarak's** private Cloud Shell directory
`~/dineq-lab6-owner-v2`; that directory is not shared automatically with Anapat.
For another operator, transfer the accompanying **owner-tools ZIP** privately
and upload it to their Cloud Shell home directory. It contains only this packet
and the two owner helper sources, no password/connection string or partner ZIP.
Inspect the code before running it; do not upload the entire workspace.

In another operator's Cloud Shell, extract into a new directory:

```bash
unzip -n ~/DineQ-remaining-UAT-owner-tools.zip -d ~/dineq-lab6-remaining
cd ~/dineq-lab6-remaining
python3 cloud-owner.py inspect --output evidence/session-inspect.json
```

If using the existing prepared directory instead:

```bash
cd ~/dineq-lab6-owner-v2
python3 cloud-owner.py inspect --output evidence/session-inspect.json
```

Use a new attempt directory or distinct filenames if an output already exists;
do not overwrite historical evidence. Stop on permission errors and ask the
existing project administrator; do not expand IAM or borrow an account.

Only after HairRoot confirms actual 04C readiness:

```bash
python3 cloud-owner.py snapshot --output evidence/04C-before.json
python3 cloud-owner.py close --baseline evidence/04C-before.json --testers-ready --output evidence/04C-closed.json
# Announce CLOSED; HairRoot executes section 5 immediately.
python3 cloud-owner.py restore --baseline evidence/04C-before.json --output evidence/04C-restored.json
# Announce OPEN; HairRoot verifies restoration.
```

Restore even if the test fails or the testers disconnect. There is no automatic
timer restoring OPEN: an operator must remain available for this short window.
The helper changes only Q.status, preserves tickets/events/counters and reports
unexpected data change while still attempting OPEN recovery. If a command/log
read fails, inspect actual state and run restore with a new output filename;
do not assume the queue is OPEN until verified.

Only after HairRoot saves fresh 08B before-data and confirms readiness:

```bash
python3 cloud-owner.py snapshot --output evidence/08B-before.json
python3 cloud-owner.py restart --baseline evidence/08B-before.json --testers-ready --output evidence/08B-owner-after.json
# Announce the actual new revision; HairRoot executes section 6 steps 4-5.
```

The tools reject unsupported job commands, a mismatching image/DB binding,
split traffic, changed before-data and baselines over 30 minutes old for close/
restart. They use one-off execution argument overrides of the existing
`s21271a0d-migrate` job, without changing its permanent migration command.
They do not run migration/seed, restart the database, or alter billing/IAM.
`restart` deliberately creates a new revision from the existing immutable image;
record that actual operation accurately. No code release PR/main merge is needed
for this same-image operation. Any proposed different code/image needs a newly
agreed release/version and affected retests.

## 8. Return these records to DineQ

Complete every blank with actual observations; do not pre-fill PASS:

| Field | Actual record |
| --- | --- |
| Attempt ID, actual start/end and timezone | PENDING |
| Testers, actor operated and actions personally performed/observed | PENDING |
| DineQ operator and actual operation times | PENDING |
| Actual tested source commit, old/new revision and image digest | PENDING |
| 04C: CLOSED UI / valid-size API status and code / no new ticket | NOT EXECUTED in this attempt |
| 04C: original OPEN restored and independently observed | NOT EXECUTED in this attempt |
| 04C actual overall result + evidence IDs | NOT EXECUTED in this attempt |
| 08B: T02/T08 full fresh before-data and screenshots | NOT EXECUTED in this attempt |
| 08B: actual same-image replacement proof and readiness | NOT EXECUTED in this attempt |
| 08B: same-ticket after-data, comparison and screenshots | NOT EXECUTED in this attempt |
| 08B actual overall result + evidence IDs | NOT EXECUTED in this attempt |
| New findings: expected / actual / reproduction / impact / evidence | PENDING; write NONE only if no new finding actually arose |
| Unresolved dependencies and retained fixtures | PENDING |

Return: a filled Markdown record, readable screenshots, sanitized API before/
after JSON, the owner's operation JSON, and any real finding report. Name files
by attempt/case/time. Include no demo password, cookie, token, login payload,
DATABASE_URL or exported browser profile/storage. Do not send full GCP job/service
specs containing environment values. The helper's evidence output is narrower.

If both previously blocked rows pass with adequate evidence and no new finding,
the earlier nine reported passes plus these two new passes cover the eleven
agreed subcase records; they may span distinct recorded attempts/revisions, not
one invented clean run. The **HairRoot UAT Team** then records its final DineQ
decision (Accepted / Accepted with explicit minor limitations / Not Accepted),
tested version, actual tester names, date, reasons and any remaining conditions.
The DineQ operator cannot sign independent acceptance of DineQ. Missing required
tests, unexplained version changes or missing contribution evidence must remain
visible instead of being hidden behind an all-PASS total.

## 9. Scope of this handoff

This packet does not retest HairRoot's Unicode defect HR-F01 and does not close
HairRoot UAT-05's announced-redeployment dependency; those concern **HairRoot's**
service. DineQ's restart cannot satisfy HairRoot's case. No new product bug is
invented here. If completed independent DineQ UAT finds no legitimate defect,
the DineQ team follows Lab 6 section 3.5 to request a TA-approved isolated
exercise; no such exercise or TA approval is represented by this packet.
