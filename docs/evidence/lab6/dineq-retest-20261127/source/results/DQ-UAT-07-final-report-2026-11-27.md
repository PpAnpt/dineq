# DineQ DQ-UAT-07 targeted retest

## Run identity

- Product: DineQ, TH-007_P9
- Independent UAT team: HairRoot, TH-060_P1
- Requested tester: Tithinan Sobking
- Playwright script author and action executor: OpenAI Codex (GPT-6), at Tithinan's request. Tithinan supplied the account credentials and authorized the run; this report does not claim he personally authored or operated the script.
- Final clean run: 27 Nov 2026, 22:54:04–22:54:15 Asia/Bangkok (UTC timestamps are retained in the JSON evidence).
- URL: https://s21271a0d-4d7hbszvwq-as.a.run.app
- Full release commit supplied by DineQ: `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931`
- Cloud Run revision supplied by DineQ: `s21271a0d-00007-pnb`
- Runtime manifest digest from DineQ's deploy build log: `sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47`. This digest was not independently queried from Cloud Run.
- Read-only smoke recheck at 22:43:33: `/api/health` 200; `/api/ready` 200, database connected. See `preflight-2026-11-27.json`.

## Preconditions and fixtures

Immediately before the final clean run created test tickets, the runner verified that queue `22222222-2222-4222-8222-222222222222` was OPEN, its active list was empty, and C1/C2 had no active tickets.

| Fixture | Customer | Party size | Ticket | UUID | Final state |
|---|---|---:|---:|---|---|
| T07A | C1 | 3 | #22 | `1a395b36-4731-4273-8e1a-f72a5243ea40` | COMPLETED |
| T07B | C2 | 5 | #23 | `92858610-677e-417e-921a-5f53ab566e27` | COMPLETED |

Earlier automation attempts exposed two runner issues and were stopped safely: the first parser assumed the Join response contained the ticket number, and a later guard expected two active tickets before calling B after A was completed. Read-only inspections identified the exact tickets before any Host action, and those first two fixture pairs (#18/#19 and #20/#21) were completed. The final run above used the corrected owner read-back and queue guards. All synthetic tickets from these attempts are completed; no active ticket was left behind.

## DQ-UAT-07 results

| Step | Result | Actual result | Evidence |
|---:|---|---|---|
| 1 | PASS | C1 joined first with party size 3 and received #22, UUID above, WAITING. C2 joined second with party size 5 and received #23, UUID above, WAITING. | `T07A-waiting.png`, `T07B-waiting.png` |
| 2 | PASS | Host queue showed #22 then #23, both WAITING; no CALLED ticket and no customer email exposed. | `step2-fifo-waiting.png` |
| 3 | PASS | Call Next selected A #22 as CALLED; B #23 remained WAITING by Host API and owner read-back. | `step3-A-called-B-waiting.png` plus sanitized API snapshots |
| 4 | PASS | Attempting to Complete B while WAITING returned HTTP 409 `INVALID_TRANSITION`; C2's owner record remained unchanged and WAITING. | Sanitized status/code and before/after comparison in JSON report |
| 5 | PASS | Calling Next while A remained CALLED returned HTTP 409 `UNRESOLVED_CALLED`; owner and queue snapshots were unchanged. | Sanitized status/code and before/after comparison in JSON report |
| 6 | PASS | Host completed A #22; C1 read back the same UUID as COMPLETED; B remained WAITING. | `step6-A-completed.png` |
| 7 | PASS | Repeating Complete on A returned HTTP 409 `INVALID_TRANSITION`; A's completed record, including `completedAt`, did not change. | Sanitized status/code and before/after comparison in JSON report |
| 8 | PASS | Call Next selected B #23 after A completed; B was completed and C2 read back the same UUID, party size 5, and COMPLETED state. | `step8-B-called.png`, `step8-B-completed.png` |
| 9 | PASS | With no active entries, Call Next returned HTTP 404 `NO_WAITING_ENTRY`; queue and completed entries remained unchanged. | `step9-empty-queue.png` |

The step 3 screenshot captured the page during its post-action refresh; the sanitized API result and before/after owner checks establish the state for that step.

## Conclusion

DQ-UAT-07 passed all nine steps on the release and revision listed above. Findings: **None observed within this case and run.** This is a targeted retest result, not a DineQ team acceptance decision or a retest of other DQ-UAT cases. Detailed sanitized observations are in `DQ-UAT-07-final-report-2026-11-27.json`; final-run screenshots are in `screenshots/2026-11-27T15-54-04-260Z/`. Passwords, cookies, tokens, and login payloads are not included.
