# Lab 6: DineQ Sprint 1 independent UAT

Updated 25 November 2026. L6-1 baseline/CI preparation merged in [PR #53](https://github.com/PpAnpt/dineq/pull/53); the [DineQ UAT cases](uat-cases.md) passed teammate review and merged in [PR #54](https://github.com/PpAnpt/dineq/pull/54). #46 is complete and **L6-3 / #47 safe handoff** is the active authoring task. Date-level coordination is recorded; final session-version confirmation remains open in #45. All independent UAT results are NOT EXECUTED; no acceptance is claimed.

## Two products and two responsibilities

| Product | Product Team | Independent UAT Team | Material |
| --- | --- | --- | --- |
| **DineQ** - restaurant walk-in queue management | Our team: Anapat Banjerdsilp / PpAnpt (67070501049), Siwarak Chatvichai / BBINGOAL (67070501086) | Partner team HairRoot | We prepare DineQ cases/handoff; HairRoot executes them and makes the independent DineQ acceptance decision |
| **HairRoot** - hair-transplant consultation booking | Partner team หัวล้านได้หวี: Tithinan Sobking (67070501018), Iivo Peter Alvey Ranne (67070501051), as supplied in the student's updated registration | Our DineQ team | Their supplied `uat-cases_HairRoot.md` belongs to HairRoot and will be executed by both DineQ students under L6-4 |

HairRoot case IDs, AC references, accounts and booking rules are not DineQ requirements. Each product has its own tested-version and execution/acceptance records. A product team cannot independently accept its own product.

## Baseline and coordination

See [coordination.md](coordination.md) for exact source versions, provenance and the student-reported arrangements: initial UAT 25 November, correction/retest 26 November by availability, Discord รอดไหมปี3, and the updated instructor/TA submission date of 29 November 2026 (no cutoff time supplied). Exact session hours and final version confirmation remain pending. The accepted Sprint 1 scope is DineQ F-01 authentication, F-02 queue joining/own-ticket access and F-03 assigned-Host FIFO calling/completion, as specified in:

- [F-01](../../sprints/sprint-1/F-01-auth.md)
- [F-02](../../sprints/sprint-1/F-02-join-queue.md)
- [F-03](../../sprints/sprint-1/F-03-host-queue.md)
- [SDS](../../system-sds.md) and [STS](../../sprints/sprint-1/test-spec.md)

Cancellation, no-show, table assignment, multiple queues, reporting and unfinished Sprint 2/3 features are outside this acceptance. No contract or application behavior is changed here.

## Integration and commits

```text
reviewed Lab 5 staging (6f1d31f)
  -> lab6-staging
     -> issue-specific feature/docs/fix branch
     -> teammate-reviewed PR into lab6-staging
  -> separately reviewed release PR: lab6-staging -> main
  -> same-commit CI gate -> deployment
```

The integration branch starts from `6f1d31f6f82808ef9e8d611b305ede20d63e96e3`, the accepted Lab 5 staging head. Its difference from deployed main `17c8b90` at preparation time is only the Lab 5 deployment documentation and AI-use log. The integration/documentation version is distinct from the deployed product version being proposed for UAT.

`ci-docker.yml` now checks PRs into and pushes to `lab6-staging`, preserving the existing staging/main/legacy PR triggers. The deploy workflow is unchanged: only main can deploy, and its deploy job still requires successful same-commit CI. Creating or merging into lab6-staging does not deploy. This CI update does not configure a new GitHub branch-protection ruleset for lab6-staging; the team still requires a substantive teammate review before integration.

Work one issue at a time. Commit meaningful steps separately. Code fixes need a reproducing test and genuine RED/GREEN evidence; do not weaken assertions. Keep passwords, cookies, tokens and database URLs out of all documents. Coordinate any deployment affecting the UAT window with the other team before it happens.

## Kanban work packages

| Work item | Tracking | Planned artifact / completion evidence |
| --- | --- | --- |
| L6-1 Partner, baseline and integration workflow | [#45](https://github.com/PpAnpt/dineq/issues/45) | Reviewed CI preparation and updated date-level coordination; final session details/version confirmation pending |
| L6-2 DineQ UAT cases | [#46](https://github.com/PpAnpt/dineq/issues/46) | DONE: [uat-cases.md](uat-cases.md), eight executable cases reviewed by PpAnpt, PR #54 merged; execution NOT EXECUTED |
| L6-3 Safe DineQ handoff | [#47](https://github.com/PpAnpt/dineq/issues/47) | [handoff.md](handoff.md): account labels, release/scope, private access, ordered setup/cleanup and owner-only conditional operations; review/actual receipt pending |
| L6-4 DineQ independently tests HairRoot | [#48](https://github.com/PpAnpt/dineq/issues/48) | Actual HairRoot execution record with both DineQ testers and findings |
| L6-5 Triage incoming DineQ findings | [#49](https://github.com/PpAnpt/dineq/issues/49) | All received findings/dispositions; distinguish none received from a completed clean test |
| L6-6 Corrections and reviewed release | [#50](https://github.com/PpAnpt/dineq/issues/50) | Additional issue per real defect; RED/GREEN/regression/PR/release/deploy chain, or TA-approved isolated exercise |
| L6-7 Independent retest/acceptance | [#51](https://github.com/PpAnpt/dineq/issues/51) | Version-bound decisions by the independent team for each product |
| L6-8 Submission evidence | [#52](https://github.com/PpAnpt/dineq/issues/52) | One self-contained Parts A-D PDF with cases, actual evidence, contributions, AI use and limitations |

The merged technical preparation in #45 is complete, but that issue stays open with `waiting-on-coordination` for final session arrangements/version confirmation. #46 is Done; #47 is the only active authoring work item; #48-52 remain Todo. This register does not mark Lab 6 or independent UAT complete.

## Candidate DineQ case outline for L6-2

This original scope outline now has complete [executable cases](uat-cases.md), reviewed under #46/PR #54. The cases separate UI/API observations, declare the FIFO/data dependencies and record unexecuted/conditional subcases explicitly. All results are **NOT EXECUTED**.

| Draft ID | DineQ behavior to exercise | Contract references / coverage note |
| --- | --- | --- |
| DQ-UAT-01 | Customer/Host sign-in, wrong credentials, logout and protected reload | F-01 AC-01..05; expiry and token storage require separate API/DB support |
| DQ-UAT-02 | Customer joins party size 4, assigned Host calls/completes, Customer refreshes the same ticket | F-02 AC-07/08; F-03 AC-14/15/17 |
| DQ-UAT-03 | Same Customer attempts another join while WAITING and CALLED | F-02 AC-09; show rejection and unchanged active ticket |
| DQ-UAT-04 | Party-size boundaries and rejected input | F-02 AC-12; distinguish native form validation from backend rejection; CLOSED-queue setup needs owner coordination |
| DQ-UAT-05 | Customer/Host role restrictions and unassigned Host denial | F-01 AC-06; F-02 AC-13; F-03 AC-19/20; verify no state/data disclosure |
| DQ-UAT-06 | Customer A cannot read Customer B's ticket | F-02 AC-11; direct API support is needed because the UI has no arbitrary ticket-detail route |
| DQ-UAT-07 | FIFO, one unresolved CALLED entry and valid completion transitions | F-03 AC-15/16/18; invalid-state requests absent from UI must be labelled as API checks |
| DQ-UAT-08 | Same ticket after reload/new session, plus agreed owner-controlled restart/redeploy check | F-03 AC-17; F-02 AC-21; UI cannot prove internal event rows by itself |

Shared FIFO preconditions and existing active tickets must be recorded before choosing cases/accounts. Do not drain unrelated tickets, reset the live database or invent an empty queue. True 30-request concurrency (AC-10), Origin rejection (AC-22), raw event/hash checks and malformed/missing-resource checks (AC-23/24) need clearly separated supporting API/automated evidence. Such developer evidence does not replace independent user execution.

## Preparation checks and honest status

- [CI guard RED](../../evidence/lab6/ci-branch-red.txt): 6 passed, 2 failed, 0 skipped at test commit `2f1f5b33ba067f3e055a21f937bd320d54eec944`; the missing lab6-staging filters caused the intended failures.
- [CI guard GREEN](../../evidence/lab6/ci-branch-green.txt): 8 passed, 0 failed, 0 skipped at implementation commit `edf330788a8fcafceb0ce1fe569f4c09d4a026f3` with the same assertions.
- These are infrastructure preparation checks, **not** a real UAT-found defect or the TA-controlled exercise required if no legitimate defect is found.
- Date-level arrangements and a student-reported credential receipt are recorded; case review is complete. Exact session hours/current running-version confirmation, per-account access and DineQ handoff receipt, handoff review, independent execution and acceptance remain pending.
