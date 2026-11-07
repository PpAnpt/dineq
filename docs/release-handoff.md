# Release handoff — P8

The P8 PR targets `sprint-1-staging`. Have the teammate review and merge that PR
before opening the release PR below. This task does not approve/merge PRs or tag.
The candidate's evidence/limitations are in
[release-verification.md](evidence/release-verification.md) and
[known-limitations.md](known-limitations.md).

From the repository root, Windows PowerShell, after P8 is merged into staging:

```powershell
git checkout sprint-1-staging
git pull --ff-only
gh pr create --repo PpAnpt/dineq --base main --head sprint-1-staging --title "release: DineQ Sprint 1" --body-file docs/release-pr-body.md --reviewer PpAnpt
```

Review the concrete staging release, including the evidence source SHA and any
changes since that run. A different final merge SHA is expected; documentation
and evidence commits do not change application behavior. To compare executable
source with the tested candidate:

```powershell
git diff --exit-code a7a145ec6b870abaed2b3ae13a88e0ffa832818d HEAD -- server client database package.json package-lock.json .env.example
```

No output and exit 0 means those files match. If they differ, run/record the
relevant checks for that changed source before accepting the release.

After the teammate reviews and merges the staging-to-main release PR, run:

```powershell
git checkout main
git pull --ff-only
git tag -a v1.0-sprint1 -m "Sprint 1 release"
git push origin v1.0-sprint1
git rev-parse HEAD
git rev-parse v1.0-sprint1
```

Use the accepted main commit and annotated tag in the final PDF. P9 must copy
the actual values, finish captions/AC excerpts/contribution table/navigation,
and disclose the pending manual checks. Existing run headers retain the full
SHA they actually tested; do not replace those SHA values with the later tag.
