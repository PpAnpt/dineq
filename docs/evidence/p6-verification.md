# P6 verification — 2026-11-07

UI source: `9e848d632dddd23aee10e49895b0c8ce2b79d52a`.
README/use-log commit: `0d75bc5` (no executable source changes).
UI base: staging `facb223759e69c7d79929d138561e51d50866770`.

## Actual results

| Check | Result | Evidence / tested source |
| --- | --- | --- |
| Production client build | PASS, 19 modules transformed | `npm run build:client`; Vite 8.3.6, Node 24.14.0 |
| Staging API regression on this UI branch | 87 passed, 0 failed, 0 skipped; 3 files | `p6-api-regression.txt` / `.json`, full SHA in header |
| Independent P5 review run | 108 passed, 0 failed, 0 skipped; 4 files | PR #14 review comment; backend `0867b8ca9924c211d467358815c366b773fa06de` |
| Browser application checks | 15 passed, 0 failed | `p6-browser-check.txt`; Chromium 156.0.8078.81 |
| Manual desktop walkthrough | NOT EXECUTED | Browser access host and native pipe unavailable |

The counts differ because P5/F-03 was not merged into staging. The browser checks
used the UI on this branch plus P5's backend from an isolated worktree, both
connected to the seeded **dev** database. The 87-test recorder used the **test**
database and the backend actually committed on the UI branch. No backend source
was copied into the UI branch, and no PR was merged during this task.

DEMO-01 used real HTTP requests through the Vite proxy and PostgreSQL writes:
Customer 01 joined with partySize 4, Host 1 called and completed the ticket,
and Customer 01 refreshed to see COMPLETED. SQL verified partySize, timestamps
and JOINED → CALLED → COMPLETED events for the ticket identified in the transcript.
The completed dev ticket was retained. No existing dev records were deleted.

Real conflict/permission/authentication checks covered DUPLICATE_ACTIVE,
UNRESOLVED_CALLED, INVALID_CREDENTIALS, Customer denial of the Host page and
direct API operation, old-cookie rejection after logout, and unassigned Host UX.
Queue-empty/CLOSED and resource-error UI states used explicitly labeled response
fixtures; they are not evidence of those backend behaviors. The party-size 9
check verified native form validation, not a backend INVALID_PARTY_SIZE response.
Sign-in and Join were submitted using Enter. CSS provides visible keyboard focus;
a complete assistive-technology audit has not been performed.

## Browser script snapshot

`p6-browser-check-source.mjs` is a snapshot of the executed temporary script, not
the P7 E2E suite. To rerun it, copy it to `.local/ui-check/check.mjs`, run
`npm install --prefix .local/ui-check --no-audit --no-fund playwright`, and start
the API and client as documented in README. It uses the installed Chrome path
shown in the script. Change that path if necessary.

It requires a fresh seeded dev database with no active entries and no tickets
for customer01; it refuses active queues and never truncates the dev DB. The
snapshot's source/backend labels describe the original run, so update those
labels when testing different commits. It reads the password only from the
ignored root `.env`. Use a fresh disposable dev database for another full run;
do not remove existing data just to satisfy the empty-state assertion.

## Screenshots inspected

| File under `p6-screenshots/` | Source |
| --- | --- |
| `DEMO-01-waiting.png` | Real Customer WAITING ticket, partySize 4 |
| `DEMO-01-called.png` | Real Host CALLED ticket with Complete action |
| `DEMO-01-completed.png` | Real Customer COMPLETED ticket after Refresh |
| `mobile-closed-queue.png` | UI-only CLOSED response fixture, width 390px; no horizontal overflow |

The remaining human checks are review of PR #14 and P6, merge in dependency
order, and the manual walkthrough using two separate browser profiles.

## PR #15 review follow-up — 2026-11-07

PR #14 has since merged into staging at `64cfaf1`; integration commit `c6b99af`
brings it into the UI branch. There is no separate-worktree runtime dependency
for this follow-up. The only merge conflict was the appended use-log rows;
both rows were retained.

Peer suggestions were implemented in `87ffa245abe13951480bf95f56a53689e7785858`:

- Refresh the Host list after a 409, retaining its server error/code.
- Remove the unused action argument.
- Explain why a CLOSED queue cannot accept new tickets.

The three regression tests in `client/tests/review-ui.test.js` were committed
first (`719ebc1`) and failed for the missing refresh/explanation, then passed
unchanged after the implementation. These browser tests use explicit response
fixtures, no DB writes. Run Vite and Google Chrome, then
`npm run test:review --workspace=client`.

| Check | Actual result | Evidence |
| --- | --- | --- |
| UI regressions before fix | 0 passed / 3 failed / 0 skipped | `p6-review-red.txt` |
| Same UI regressions after fix | 3 passed / 0 failed / 0 skipped | `p6-review-ui-green.txt` |
| Combined real-DB API suite on this branch | 108 passed / 0 failed / 0 skipped, 4 files | `p6-review-api-green.txt` / `.json` |
| Client production build | PASS, 19 modules | `npm run build:client` output in review task |
| Live connectivity/Login check | 6 passed / 0 failed | `p6-review-live-check.txt`, `p6-review-login.png` |

The reported 502 was reproduced: Vite was listening, API port 3000 had no
listener, and the local PostgreSQL instance was stopped. Restarting the existing
instance and API restored both direct and proxied health to 200. Anonymous me
returns the expected 401 and the UI renders Login. The live browser check logged
in and out with the seeded Customer through the real proxy/API, without changing
queue entries. API and the user's existing Vite process were left running so
the user can Retry/reload. The manual two-profile DEMO-01 check remains pending;
these headless checks do not claim to be that manual walkthrough.
