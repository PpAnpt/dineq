# Controlled FIFO release and retest handoff - 27 November 2026

Tracking: [#63](https://github.com/PpAnpt/dineq/issues/63), [#50](https://github.com/PpAnpt/dineq/issues/50), [#51](https://github.com/PpAnpt/dineq/issues/51).
**Release deployed; independent DQ-UAT-07 retest remains NOT EXECUTED.**

## Actual version chain

| Stage | Actual value / evidence |
| --- | --- |
| Healthy original release | 17c8b90642ecb742b4f8b7e8c55da7fd34ddd620 |
| Controlled defect, isolated branch only | 513e6599cc39b73579c3a3caf9a8bf9571b84c06 |
| Reproducing test / RED | ea646a970d04323d10b954f21a8ee13b859692b7; 109 PASS / 3 FAIL / 0 SKIPPED |
| Correction / GREEN | 58c5b779e71817b69ce3c1030278bff457134e21; 112 PASS / 0 FAIL / 0 SKIPPED |
| Reviewed squash into staging | PR #64, fb98f4c54d4d65173f465b1f87c7d58da1245a52; deliberate defect/RED SHAs are not ancestors |
| Reviewed release into main | PR #65, 1ffb8b09b8df7f6b6954047ccdef4c2ccc113931; merged 27 Nov 15:25:52 UTC |
| Successful pipeline | [46024849737](https://github.com/PpAnpt/dineq/actions/runs/46024849737), same-main-commit CI, build/push, migration, deploy and smoke succeeded |
| New revision | s21271a0d-00007-pnb, 100% traffic in authenticated deploy response at 15:28:57 UTC / 22:28:57 Bangkok |
| New runtime manifest | sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47, exported by the deploy build under the full main-SHA tag; not a separate status.imageDigest query |
| Independent retest operator | Tithinan Sobking, HairRoot TH-060_P1, planned/confirmed assignment; actual execution/result still awaited |

The reviewed [exercise record on the released main commit](https://github.com/PpAnpt/dineq/blob/1ffb8b09b8df7f6b6954047ccdef4c2ccc113931/docs/labs/lab-06/controlled-fifo-exercise.md) retains original RED/GREEN history. No final runtime source/workflow difference from healthy baseline was introduced; the deliberate change was fully reverted. The rebuilt image digest differs; it is not assumed equal to the old release.

## Partner notice, preparation and smoke

Siwarak explicitly confirmed HairRoot had received notice and was waiting until deployment completed. The agent did not send a Discord/partner message. BBINGOAL's substantive release review covered the exact staging head, 24 changed files, unchanged runtime/workflow/original tests, identical new RED/GREEN test, excluded defective ancestry and evidence hashes. PR #65 was opened by PpAnpt; review was submitted from the other account, not author self-approval.

Only retained T08 #17 (922aad64-621e-402b-b926-20d0c1fef4ce) was found WAITING. Automatic review initially rejected its completion for missing ticket-specific authorization; no mutation preceded Siwarak's explicit authorization for WAITING -> CALLED -> COMPLETED. The assigned Host then used normal UI Call Next/Complete. Before/after API records preserve the same id, number, party size and createdAt; final target is COMPLETED and active list empty. No deletion/reseed/other-ticket completion occurred. Host logged out and browser closed.

The preparation captures showing Loading are excluded from visual proof. Committed proof uses authenticated before/after API JSON and the ready CALLED Playwright image. The final public read-only Playwright smoke at 15:29:36 UTC / 22:29:36 Bangkok finds the login form, /api/health=200 and /api/ready=200 with database connected. It performs no login or new ticket action. The unchanged static Lab5 label is not commit verification; pipeline/image metadata supplies the version binding.

## Original-revision image comparison requested by TA

Authenticated read-only Cloud Shell queries observed both s21271a0d-00005-rdp and s21271a0d-l6-1126161809 using runtime digest **sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8** in spec/status. Pre-deploy service traffic was 100% to l6-1126161809. Original successful deploy run 44986245220 exports this exact runtime manifest, names the full 17c8b90 tag and deploys 00005-rdp, linking the historical source/revision/image chain. This proves old-revision equality; it does not claim the new release uses that old image. A supplementary Artifact Registry describe was submitted but not collected and is not used as evidence.

## Evidence and remaining gates

[Raw records, narrow logs and original images](../../evidence/lab6/controlled-release-20261127) are indexed by the [SHA-256 manifest](../../evidence/lab6/controlled-release-20261127/sha256-manifest.json). The raw deployment excerpt contains a different image from the CI-only build as well as the actual deploy build; use only the deploy job's runtime manifest for the release.

The local READY handoff contains the canonical URL, full main SHA/revision/runtime manifest source, original DQ-UAT-07 nine steps, private-account guidance and blank actual/result/evidence fields. Tithinan must verify queue/account prerequisites again and return real execution time, actual states/IDs, screenshots, script authorship/operator if used, findings and a version-bound conclusion. No agent-generated independent PASS or new-release acceptance is supplied. Iivo is not credited with unconfirmed retest/review work. Keep #63/#50 open for this independent retest and final reporting; the earlier original-release Accepted is not automatically acceptance of this release. Final DOCX/PDF is not updated by this source-record task.
