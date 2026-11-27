# DQ-UAT-07 retest status — 27 Nov 2026

- Tester requested: Tithinan Sobking.
- Release reference: `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931`.
- Cloud Run revision: `s21271a0d-00007-pnb`.
- Runtime manifest digest from DineQ deploy build log: `sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47`.
- Read-only smoke recheck at 2026-11-27 22:43:33 +07:00: `/api/health` HTTP 200; `/api/ready` HTTP 200, database connected. See `preflight-2026-11-27.json`.
- Final clean run: **PASS, 9/9 steps**, observed 22:54:04–22:54:15 Asia/Bangkok. See `DQ-UAT-07-final-report-2026-11-27.md` and `.json`.
- Preconditions passed immediately before the final Join: queue OPEN, no active queue entries, and C1/C2 had no active tickets.
- Final-run tickets were #22 (C1, party size 3) and #23 (C2, party size 5); both ended COMPLETED. No ticket number was assumed.
- Two earlier fixture pairs (#18/#19 and #20/#21) were also completed while correcting runner assumptions; their interruptions and safe recovery are disclosed in the final report. The final clean run then passed all nine steps.

The targeted Playwright runner is `../run-dq-uat-07-retest.mjs`. Passwords were supplied privately at runtime and were cleared afterwards; they are not stored in reports, screenshots, or this folder.
