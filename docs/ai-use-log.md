# AI-use log

Short log for the AI-use declaration (DoD-08). One entry per AI-assisted task: date, tool/model, task, what the human checked.

| Date | Tool / model | Task | Human verification |
| :---- | :---- | :---- | :---- |
| 2026-11-06 | Claude (Antigravity) | (example) scaffold server + migration | ran npm test, read diff, reviewed by teammate in PR #__ |
| 2026-11-06 | Claude Code (Sonnet 5.5) | Spec revision 1: traceability fixes, AC-21/22, error catalog, seed/shape conventions, Sprint 1 issue drafts (docs only, no code) | read full diff before commit, reviewed by teammate in PR #__ |
| 2026-11-06 | Codex | Address PR #1 review: endpoint check order, complete queue-list JSON, assignment checks and planned TEST-23/24; sync contracts, STS, traceability, issue drafts and implementation prompts | Pending teammate verification of the follow-up commit in PR #1; no runtime tests executed (docs-only change) |
| 2026-11-06 | Codex | P2: Express/workspace scaffold, transactional migrations, Argon2id seed, isolated local PostgreSQL setup, safe test helpers, infrastructure tests, evidence recorder and Windows README | Automated validation: dev/test migrations, seed, 8 infrastructure tests and live HTTP health check; teammate review pending in P2 PR |
| 2026-11-06 | Codex | P3/F-01: tests first and recorded Red, then real Argon2id login, hashed expiring/revocable sessions, session/role/Origin middleware, Host placeholders and README | Automated PostgreSQL checks: Red 38 failed / 10 passed (including infra); Green 48 passed / 0 failed / 0 skipped; tests unchanged since Red. Live HTTP Host login/placeholders/logout/revoked-Cookie checked; teammate verification pending in P3 PR |
