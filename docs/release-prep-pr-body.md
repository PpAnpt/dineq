Fresh-clone reproduction exposed an already-used test-recording label in README,
which failed with exit 1. The example now generates a fresh timestamp label; the
corrected command was exercised successfully in the external clone.

This release-prep change adds recorded candidate verification, all 24 AC results
and their actual test names, honest DoD status, limitations, secret-scan results
and exact release PR/tag handoff commands. Application/test/dependency source is
unchanged from integrated staging `3d2ba1b`.

Tested candidate: `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`.

- `npm run test:record -- release-full-run`: 108 passed / 0 failed / 0 skipped.
- `npm run test:e2e:record -- release-e2e-run`: 4 passed / 0 failed / 0 skipped.
- UI regression: 3 passed / 0 failed / 0 skipped; client production build passed.
- New clone outside the project with newly created empty dev/test databases:
  dependency install, migrations, seed, test, build and app startup passed.
- Real API process restart: same COMPLETED ticket, timestamps and all three event
  rows retrieved afterward, without resetting the DB.
- Current-tree scan found no configured local passwords, private keys or recognized
  service/session/JWT token values; `.env` is ignored and untracked.

Evidence index: `docs/evidence/release-verification.md`. All AC PASS statuses are
tied to the recorded API cases and the tested SHA. Future/manual/GCP work is
explicitly NOT EXECUTED; infrastructure cases are not counted as feature AC tests.
Historical screenshot evidence is preserved; new release screenshots have their
own directory.

Unresolved limitation: oversized JSON is rejected with HTTP 413 but code
INTERNAL_ERROR, outside the current error catalog. Manual walkthrough/full audit,
accepted release on main, tag and P9 PDF remain pending. See
`docs/known-limitations.md` and `docs/release-handoff.md`.

Review focus: evidence-to-AC mapping, README reproduction correction, pending DoD
items, documented limitation and source equivalence. No merge/tag was performed.

Refs #11.
