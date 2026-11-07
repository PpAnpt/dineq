Sprint 1 implements session-based Customer/Host login/logout, walk-in queue joining,
FIFO Call Next/Complete and the four React screens, with PostgreSQL persistence.

Recorded candidate source: `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`.

- API/DB: 108 passed / 0 failed / 0 skipped (`release-full-run.txt/json`).
- Chromium E2E DEMO-01..05: 4 passed / 0 failed / 0 skipped (`release-e2e-run.txt/json`).
- UI fixture regressions: 3 passed / 0 failed / 0 skipped; production build passed.
- Fresh clone outside the project with new empty dev/test databases: migrate,
  seed, tests and startup passed; README's reused-label example was corrected
  and the corrected command was exercised in that clone.
- Real process restart: identical COMPLETED ticket, timestamps and JOINED/CALLED/
  COMPLETED event rows retrieved after a new API process started on the same DB.
- All 24 AC map to actual recorded API test names/results and the tested SHA.

Evidence index: `docs/evidence/release-verification.md`. Setup: README.
Limitations: `docs/known-limitations.md`, including the unresolved HTTP 413 error
code and pending manual walkthrough/audit. Automated evidence is not manual proof.
Final PDF/evidence assembly is P9.

This PR requests the accepted Sprint 1 release on main. The tag is created only
after teammate review and merge. P8 follow-up changes are documentation/evidence;
confirm the application/test source still matches the tested candidate before
acceptance. Re-run and record checks if executable source changes.
