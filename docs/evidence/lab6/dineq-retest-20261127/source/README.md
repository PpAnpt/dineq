# DineQ DQ-UAT-07 retest

This folder contains a targeted Playwright runner and timestamped evidence for DQ-UAT-07 only. The runner never resets data and never calls cloud or database administration APIs.

## Preconditions and authorization

- Release source: `DineQ-DQ-UAT-07-retest-handoff-READY.md`, full commit `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931`, revision `s21271a0d-00007-pnb`.
- It logs in as C1, C2 and H1, verifies queue OPEN, both customers have no active tickets and the queue has no active entries immediately before creating tickets.
- If a precondition fails, it stops before joining. If another user changes the queue mid-run or Call Next selects a different ticket, it stops without completing an unexpected ticket.
- Three private passwords are read from process environment only: `DQ_PASSWORD_C1`, `DQ_PASSWORD_C2`, and `DQ_PASSWORD_H1`. Never save them here, in command history, screenshots, reports or Git.

## Run

Use the normal private credential handoff to set the three process environment variables, then run in PowerShell:

```powershell
$env:HAIRROOT_REPO = 'C:\Users\Titinan\.codex\worktrees\lab5-deploy-workflow\hairroot'
$env:DQ_TESTER_1 = 'Tithinan Sobking'
$env:DQ_ALLOW_MUTATIONS = 'USER_REQUESTED'
node 'C:\Doc\Kmutt\UAT-DinoQ-Pic-3\run-dq-uat-07-retest.mjs' run
```

Clear the three `DQ_PASSWORD_*` variables and `DQ_ALLOW_MUTATIONS` after execution. The runner writes sanitized JSON/Markdown reports to `results/` and screenshots to a timestamped subfolder of `screenshots/`.

Script author: OpenAI Codex, based on the supplied READY handoff and the existing DineQ UAT runner. The report must identify the actual runner/operator; it does not claim Tithinan personally authored the script.
