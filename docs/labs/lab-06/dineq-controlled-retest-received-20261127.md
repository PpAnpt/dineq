# Received DineQ controlled-release retest - 27 November 2026

Tracking [#63](https://github.com/PpAnpt/dineq/issues/63), [#50](https://github.com/PpAnpt/dineq/issues/50), [#51](https://github.com/PpAnpt/dineq/issues/51).
**HairRoot reports DQ-UAT-07 PASS, nine of nine distinct steps. Its latest clarification limits Accepted to the original baseline 17c8b90; final acceptance of the new 1ffb8b0 release is NOT CONFIRMED.** See the [latest source clarification](partner-clarification-20261127.md). No acceptance is inferred from PASS counts.

## Release, source and participants

Full main commit `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931`; revision `s21271a0d-00007-pnb`; runtime manifest `sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47`. These match our [actual deployment record](controlled-fifo-release-20261127.md). The partner takes these values from the handoff/deploy log and explicitly does not claim an independent Cloud Run query.

Source archive: UAT-DinoQ-Pic-3.zip, SHA-256 `5d4387c3f04abcc08a7b899ad58e32e9e4a7cd52d6c6f52f42fcf22d90c6737a`. All **45 supplied files, including 27 PNGs**, are retained byte-for-byte in [source](../../evidence/lab6/dineq-retest-20261127/source); [manifest](../../evidence/lab6/dineq-retest-20261127/sha256-manifest.json) and [receipt summary](../../evidence/lab6/dineq-retest-20261127/receipt-summary.json). We read, but did not execute, the supplied live runner. Credentials/session values were not requested or imported.

Selected final clean run: **27 November 2026, 22:54:04-22:54:15 Asia/Bangkok**, exact UTC `2026-11-27T15:54:04.261Z` to `2026-11-27T15:54:15.373Z`. Requested tester is **Tithinan Sobking / HairRoot TH-060_P1**. The final supplied report attributes script authorship and Playwright action execution to **OpenAI Codex at Tithinan's request**; it says Tithinan supplied credentials/authorization and does not claim personal manual operation/script authorship. This new-run attribution is distinct from the earlier original-UAT message's declared Tithinan authorship. The later clarification reports Iivo's original DQ-UAT-01 steps 1/3 on 26 Nov at 19:33 (E-B7-E-B9); Siwarak additionally attributes review of retest results/images to Iivo. Those statements and their unverified evidence/date limits are recorded separately; no new retest execution is inferred.

## Received step results

| Step | Partner result / actual recorded summary | Evidence qualification |
| --- | --- | --- |
| 1 | PASS: C1 party 3 joins first as #22, UUID 1a395b36-4731-4273-8e1a-f72a5243ea40; C2 party 5 as #23, UUID 92858610-677e-417e-921a-5f53ab566e27; WAITING | Two Join rows belong to one source step, not two cases. C1 image ready; C2 image Loading; API assertion/result summary supports C2 |
| 2 | PASS: Host list #22 then #23, both WAITING, no CALLED | Ready screenshot corroborates visible FIFO and no Customer emails. Source runner sorts its own comparison and does not independently assert raw-response privacy |
| 3 | PASS: Call Next returns A #22 CALLED, B stays WAITING | Runner checks returned A id/status; screenshot only shows success notice while list is Loading, so it cannot prove B's rendered state |
| 4 | PASS: Complete WAITING B returns 409 INVALID_TRANSITION; owner record equality check | Recorded result and supplied runner assertion; raw before/after payloads not retained |
| 5 | PASS: repeated Call Next returns 409 UNRESOLVED_CALLED; A owner equality/B WAITING checks | Not a saved full queue-field comparison; do not overstate the source's snapshot wording |
| 6 | PASS: A COMPLETED, B remains WAITING | Completion response check, owner read in subsequent step and B guard before step 8; image captures success notice/Loading |
| 7 | PASS: second Complete A returns 409 INVALID_TRANSITION; owner read equals first completion response | Recorded assertion/result, including completedAt comparison; raw payloads not retained |
| 8 | PASS: B CALLED then COMPLETED, C2 reads same UUID/party 5, active list empty | Source assertions/results; two images show success notices while list Loading |
| 9 | PASS: empty Call Next returns 404 NO_WAITING_ENTRY; active Host list still empty | Ready empty-list image and runner equality check support empty active list. No subsequent read of both completed owner records is performed here, so the extra 'completed history unchanged' claim needs a follow-up |

Source final report contains 11 records: one precondition, two joins for step 1, and steps 2-9. Count **9 distinct numbered steps**, not 11 tests. The raw run and consolidated report preserve the same recorded outcomes; two timestamp strings lose a trailing zero but represent the same instants.

## Attempts and source consistency

| Supplied report | Source conclusion | Numbered steps covered |
| --- | --- | --- |
| 2026-11-27T15-47-21-731Z-DQ-UAT-07-report.json | BLOCKED | Read-only inspection; no numbered steps |
| 2026-11-27T15-48-21-598Z-DQ-UAT-07-report.json | PASS | Read-only inspection; no numbered steps |
| 2026-11-27T15-49-23-735Z-DQ-UAT-07-report.json | INTERRUPTED | 1,2,3,4,5,6,7 |
| 2026-11-27T15-50-31-426Z-DQ-UAT-07-report.json | PASS | 8,9 |
| 2026-11-27T15-53-10-132Z-DQ-UAT-07-report.json | PASS | 1,2,3,4,5,6,7,8,9 |
| 2026-11-27T15-54-04-260Z-DQ-UAT-07-report.json | PASS | 1,2,3,4,5,6,7,8,9 |

An inspection-only PASS and a resume-only PASS are not full case passes. Earlier BLOCKED/INTERRUPTED attempts are retained rather than replaced by the final result. Partner attributes interruptions to its Join parser and active-count guard, then reports normal completion of pairs #18/#19 and #20/#21 before the final #22/#23 run. We did not repeat those actions. The original failed Join response is not retained, so its exact parser diagnosis is source-attributed; the DineQ contract still returns the ticket object under data, not a revised API contract.

**Raw-versus-consolidated discrepancy:** raw final JSON leaves both fixture-summary status fields at WAITING despite completedAt values; the partner's consolidated final JSON changes those fields to COMPLETED. IDs/completedAt/outcome rows agree. Preserve both originals and label this as a reporting discrepancy, not an invented live product defect or an independently verified correction.

## Acceptance and remaining evidence

The initially relayed single-word Accepted was interpreted as new-release acceptance. **The later explicit partner clarification supersedes that interpretation: Accepted applies only to original baseline 17c8b90 / s21271a0d-00005-rdp.** New release 1ffb8b09b8df7f6b6954047ccdef4c2ccc113931 / s21271a0d-00007-pnb retains reported PASS 9/9, with final acceptance NOT CONFIRMED. Preserve the earlier relay as communication history, not the current decision. The partner promises a read-only owner supplement; no new files have arrived with the clarification.

Before final PDF completion, request a small **read-only** supplement rather than rerunning the whole case: owner JSON/ready screenshots for the same #22/#23 records, compare the known ids/numbers/party sizes/status and completedAt against the consolidated report, and identify when captured. This can corroborate current retained records without rewriting the original execution timeline or claiming a missing historical full-payload comparison was performed. Obtain the new-release decision when the independent team actually makes it, the cited E-B7-E-B9 original-participation evidence, and details/evidence/date for Iivo's additionally reported review role. Additional evidence may change the qualification but never rewrites source R01/earlier interrupted runs.

Do not execute the received runner, create tickets for replacement photos, alter original screenshots, or claim a new independent run from this import. No natural product finding is submitted in this selected report; no new product defect is established by the source reporting gaps. Keep the evidence gaps visible until supplemented or expressly disclosed in the final report.
