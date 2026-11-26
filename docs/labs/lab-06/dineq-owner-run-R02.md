# DineQ owner operation R02 - 26 November 2026

Tracking: #47 / #49, with independent outcome/acceptance under #51. This is the DineQ Product Team operator record, not HairRoot's independent UAT result. The student explicitly requested this operator to perform CLOSED/OPEN preparation and confirmed HairRoot ready now. Exact participating independent tester names/actions remain to be supplied by HairRoot.

Operator: Siwarak / BBINGOAL with assisted Cloud Shell commands. Original JSON output stays in `/home/siwarakbingo/dineq-lab6-owner-v2/evidence/R02`. Selected fields below were transcribed from authenticated command output; they are not a full raw-file export.

| Phase | Actual authenticated observation |
| --- | --- |
| Fresh before snapshot | 22:35:28.413 Bangkok (15:35:28.413Z); execution s21271a0d-migrate-tf2wf; revision s21271a0d-00005-rdp; Q OPEN; counter 18; 49 events; only active ticket T08/#17 WAITING |
| Guarded close | 22:36:19.094 Bangkok (15:36:19.094Z); execution s21271a0d-migrate-kk2dh; Q CLOSED; counter 18; unchanged=true |
| Restore OPEN | PENDING - HairRoot reports testing in progress; operator remains available |
| 08B fresh before-data | PENDING |
| Same-image revision replacement | NOT EXECUTED |
| Independent 04C outcome | PENDING actual tester result and evidence; not inferred from successful closure |
| Independent 08B outcome | PENDING |

Target Q: `22222222-2222-4222-8222-222222222222`. Both owner snapshots have data hash `1c6c296bf941a8d8ae256ee428004cb0b0899a88cbb58c60069750b4e87bae59`, covering entries/events/counter while excluding the deliberately changed queue status. T08 ID is `922aad64-621e-402b-b926-20d0c1fef4ce`. No ticket, event or counter was modified by closure.

The operator announced CLOSED and requested the independent 04C outcome before restoration. The student replied that HairRoot is still testing. Do not mark this row PASS until the actual UI/API/state observations and restoration are recorded. The exact recovery command is:

```bash
python3 cloud-owner.py restore --baseline evidence/R02/04C-before.json --output evidence/R02/04C-restored.json
```

No code release/main merge, seed/reset, database restart or IAM/billing change was performed by these two phases. A successful owner operation is not independent acceptance.
