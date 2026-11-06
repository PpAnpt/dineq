# F-01 Red / Green verification

- Baseline: merged P2, PR #2, commit 8f4dc4e23bd06adecdca65beb40067d3137e5120.
- Test commit (Red source): d0bf738ac4ab8abd0187f7f1ee7531588a1c3f78.
- Red evidence commit: ca6ece4ecd41859fb02c54881feb203393f7f964.
- Implementation (Green source): 98863bdc1f4b8aa61f48f096ab8d2c9da05d7cac.
- Automated test file: server/tests/f01-auth.test.js.
- The F-01 test file is byte-identical to its Red version; no test changes were made.

## Results parsed from the recorded Vitest JSON

| AC | Test | Cases | Red passed / failed | Green passed / failed |
| --- | --- | ---: | ---: | ---: |
| AC-01 | TEST-01 | 3 | 0 / 3 | 3 / 0 |
| AC-02 | TEST-02 | 8 | 2 / 6 | 8 / 0 |
| AC-03 | TEST-03 | 4 | 0 / 4 | 4 / 0 |
| AC-04 | TEST-04 | 1 | 0 / 1 | 1 / 0 |
| AC-05 | TEST-05 | 12 | 0 / 12 | 12 / 0 |
| AC-06 | TEST-06 | 6 | 0 / 6 | 6 / 0 |
| AC-22 | TEST-22 | 6 | 0 / 6 | 6 / 0 |

Red full suite: 10 passed / 38 failed / 0 skipped (40 F-01 cases plus 8 infrastructure cases).
Green full suite: 48 passed / 0 failed / 0 skipped (40 F-01 cases plus 8 infrastructure cases).

Recorded files: f01-red.txt/json and f01-green.txt/json in this directory.
The two F-01 cases already passing in Red are null-body and malformed-JSON rejection, provided by the existing parser.

## Actual Red failures

- Login: AssertionError: expected 404 to be 200 // Object.is equality.
- Anonymous malformed JSON: AssertionError: expected 400 to be 401 // Object.is equality.
- Foreign Origin before JSON parsing: AssertionError: expected 400 to be 403 // Object.is equality.
- Session/role cases requiring Login: loginAs expected 200, received 404; F-01 must be implemented first.
These are missing authentication/guard behavior; the DB setup and infrastructure tests passed.

## Manual HTTP checks (supplementary, not additional automated tests)

- Started createApp on a temporary local HTTP port using the dev PostgreSQL pool.
- Host login: 200 with the server-provided HOST role.
- The three authenticated Host placeholders: 501 NOT_IMPLEMENTED.
- Logout: 204; reuse of the old Cookie for /auth/me: 401.
The temporary HTTP listener was closed; no password or token was printed.

No frontend or queue business operations are included. Feature-wide contract statuses remain PLANNED pending the later release verification.
