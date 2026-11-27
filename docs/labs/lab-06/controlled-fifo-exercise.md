# CE-FIFO-01 - TA-authorized controlled FIFO exercise

Tracking: [exercise #63](https://github.com/PpAnpt/dineq/issues/63), parent
[L6-6 #50](https://github.com/PpAnpt/dineq/issues/50). Product: **DineQ**.
Independent UAT team: HairRoot, **TH-060_P1**, as explicitly confirmed by the
student. This is an intentionally introduced, isolated training defect, not a
natural defect found in HairRoot's UAT of the healthy Sprint 1 release.

## Authorization and boundaries

On **27 November 2026**, Siwarak supplied the TA's reply in the working chat and
authorized execution. This record attributes the approval to that supplied
transcript; it does not invent email headers, an earlier approval time, a partner
acknowledgement or a final acceptance decision.

The TA authorized this specific scenario: Host **Call Next selects the newest
WAITING ticket instead of the oldest**, violating FIFO. Required evidence is an
explicit controlled-defect commit; defect report/triage; a regression test with
at least two WAITING tickets; intended RED; correction and unchanged-test GREEN
plus original regression; substantive teammate review into **staging**, CI,
reviewed release into main, pipeline deployment/smoke, and independent HairRoot
DQ-UAT-07 retest on the corrected deployed version. The defective commit must
never be deployed. The final PDF must separate this exercise from healthy
Sprint 1 and identify every version in the chain.

This specific TA instruction uses staging, overriding the earlier generic
Lab6 plan to integrate exercise changes through lab6-staging. Lab6 evidence PR
#62 stays separate. A dedicated local worktree prevents unrelated local files
or the HairRoot evidence branch from entering the exercise.

## Requirement and test design recorded before implementation

- [F-03 contract AC-15 / TEST-15](../../sprints/sprint-1/F-03-host-queue.md):
  with WAITING ticket numbers 1/2, Call Next selects 1, sets CALLED/timestamp/event,
  and leaves 2 WAITING.
- [SDS C.3](../../system-sds.md): the queue-locked transaction selects the lowest
  WAITING ticket number. Join allocates increasing numbers under the same queue
  lock; sequential successful Join requests establish arrival order.
- The unchanged original `server/tests/f03-host.test.js` already contains a FIFO
  regression. This exercise does not claim discovery of a missing original test.
- Add `server/tests/controlled-fifo.test.js`, named
  `TEST-15-CE / AC-15: sequential joins call the oldest ticket and leave every later ticket WAITING`.
  Use three real authenticated Customers joining the seeded OPEN queue in order,
  with different party sizes. Check generated ticket numbers and creation order,
  then real assigned-Host Call Next, returned identity, DB statuses/timestamps and
  per-entry CALLED events. Use soft behavioral assertions so one RED run records
  both the wrong selected ticket and incorrectly changed later-ticket state.
- Existing assertions will not be modified, weakened or skipped. Record full
  suites on a clean tree using `npm run test:record -- <label>`; output identifies
  its full tested commit, ISO time and Node version. Setup/import failures do not
  count as intended RED.

## Isolation and integration plan

Start from staging `6f1d31f6f82808ef9e8d611b305ede20d63e96e3` on
`codex/lab6-controlled-fifo`. Healthy main remains
`17c8b90642ecb742b4f8b7e8c55da7fd34ddd620`. Runtime Host implementation has no diff
between these starting refs. Tests use only the separately named local `_test`
database on loopback; do not reset development/GCP data. Credentials remain in
ignored local configuration and are never included in recorded commands/output.

Only publish the exercise branch for review after its HEAD is corrected and
GREEN. Preserve small historical commits on that branch. **Squash the reviewed
corrected PR into staging**, so intentionally defective/test-RED commits do not
become ancestors of staging/main. The final runtime fix restores the baseline
selection; the additional regression protects the behavior. Do not manually run
the deploy workflow against any intermediate SHA. Existing pipeline deployment
is restricted to main and gated on that same commit's CI.

Peer review, release merge, deployment and independent retest are later gates;
they are not supplied by local developer tests. Announce the corrected release
to HairRoot before changing the version used for their testing. No partner
message or cloud operation is performed by this preparation.

## Version and evidence ledger

| Stage | Exact version / evidence | State |
| --- | --- | --- |
| Healthy Sprint 1 main baseline | 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620 | Existing release; final independent decision still to be supplied by HairRoot |
| Exercise staging base | 6f1d31f6f82808ef9e8d611b305ede20d63e96e3 | Branch created; runtime Host code matches healthy main |
| Baseline automated suite | NOT EXECUTED | Record before introducing defect |
| Controlled defect commit | PENDING | Local exercise only; never deploy |
| New reproducing test commit / RED | PENDING | Must fail for wrong FIFO selection/state |
| Corrected commit / GREEN + regression | PENDING | Same test/assertions and original suite |
| Reviewed corrected staging PR / CI | PENDING | Substantive PpAnpt review; squash only GREEN head |
| Fixed release commit on main | PENDING | Reviewed release PR after staging integration |
| Deployed revision / image digest / smoke | PENDING | Pipeline deploy of corrected main only |
| HairRoot TH-060_P1 independent DQ-UAT-07 | PENDING | Actual tester, version, time, outcomes and evidence |

## Defect report and triage

| Field | Record |
| --- | --- |
| ID / origin | CE-FIFO-01 / TA-controlled exercise; not an independently discovered production defect |
| Owner | DineQ; Siwarak / BBINGOAL implements with assistance; PpAnpt substantive review pending |
| Reporter / authority | Scenario supplied by TA through the student's pasted reply on 27 November |
| Requirement / case | Sprint 1 F-03 AC-15, SDS C.3; DQ-UAT-07 independent follow-up |
| Preconditions | Local separate test DB, seeded OPEN queue, three sequential Customer joins, assigned Host, no unresolved CALLED |
| Reproduction | Join three Customers in order, then assigned Host POST /api/queues/:queueId/call-next; inspect response plus persisted statuses/events |
| Expected | Oldest/lowest ticket CALLED with timestamp/event; every later ticket WAITING with no CALLED event |
| Controlled change / intended failure | Reverse only Call Next selection from ticket_no ASC to DESC; newest ticket selected and oldest remains waiting |
| Actual reproduction | NOT EXECUTED; fill only from recorded RED output |
| Severity / rationale | Major within the isolated defective version: normal queue servicing violates its central fairness/ordering rule; no live incident is claimed |
| Triage | Accepted controlled-exercise defect under TA authorization; in Sprint 1 scope, not an enhancement/duplicate and not a natural incoming UAT finding |
| Status | Preparation; correction, CI/review, release, deploy and independent retest not yet completed |

## Parallel PDF requirements from the TA reply

The student confirms HairRoot is **TH-060_P1**; other spellings in the pasted
reply are not used as a new team identity. Still obtain the partner's own final
decision/authors/date/exact accepted release, Iivo's actual contribution, and
who authored/ran the independent team's Playwright scripts. Retain a findings
table explicitly saying none if no natural findings were received. Compare
image digests for baseline revisions `s21271a0d-00005-rdp` and
`s21271a0d-l6-1126161809` before asserting both used the same `17c8b90` image.
These records remain separate from this exercise and are not prerequisites for
the TA-authorized local RED/GREEN work. Final report/PDF remains local until
prepared and checked; no final acceptance, contribution or digest is invented.
