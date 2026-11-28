# Part C: Sprint 3 status and remaining work

Status words: planned = contract only; in progress = started; implemented = code merged; tested = recorded run; accepted = independently accepted (none yet).

## C.1 Status per feature

| Feature | AC | Contract | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| F-07a Customer history filter | 52 to 57 | `docs/sprints/sprint-3/F-07-history.md` (merged #101) | **implemented and tested locally** (merged #109, merge `890be0f`); not accepted, not deployed | `f07a-red` 15 failed / 173 passed; `f07a-green` 188 passed (`d527981`); `f07a-fix-red` 3 failed then `f07a-fix-green` 194 passed (`d45a2be`); Playwright 8 passed |
| F-09a 413 PAYLOAD_TOO_LARGE | 70 to 72 | `F-09-hardening.md` | **implemented and tested locally** (merged #105, merge `11d6bf5`); not deployed | `f09-payload-red` 2 failed / 121 passed; `f09-payload-green` 123 passed (`e75a598`) |
| F-07b Host history and ticket events | 58, 59 | merged | planned | none |
| F-08 Reporting summary | 60 to 64 | `F-08-reporting.md` | planned | none |
| F-09 performance (NFR-04) | 73 | `F-09-hardening.md` | planned | none |
| F-09 keyboard (NFR-07) | 74 | `F-09-hardening.md` | planned | partial Sprint 1 checks and the Enter-on-button steps in E2E-9/E2E-10/E2E-11 only |
| F-09 UX states (FR-15) | 75 | `F-09-hardening.md` | planned | selected states covered by tests |
| F-09 final regression | 76 | `F-09-hardening.md` | planned | pending the integrated record |

## C.2 Remaining work to the 13 December plan

The owners and dates below are **proposals** from the working plan and must be confirmed by the two authors before they go into the PDF.

| Feature / AC | What remains | Proposed owner | Proposed date |
| :-- | :-- | :-- | :-- |
| F-07b (AC-58, 59) | tests first, endpoints for Host history and ticket events, UI | Anapat | 6 to 8 Dec |
| F-08 (AC-60 to 64) | tests first, summary endpoint and Host page | Siwarak | 6 to 10 Dec |
| AC-73 | measurement script and a real run with environment, tool and time recorded | Anapat | 10 Dec |
| AC-74 | manual keyboard checklist with recorded results | both | 11 Dec |
| AC-75 | screen by state checklist with captures | Siwarak | 11 Dec |
| AC-76 and release | final regression, release PR, deploy, post-deploy checks, version ledger | both | 12 to 13 Dec |
| Carry-over | merge `lab6-staging` records if wanted, extend demo data on production, share `assertAssigned`, make INFRA schema checks use `current_schema()` everywhere | both | before 13 Dec |
