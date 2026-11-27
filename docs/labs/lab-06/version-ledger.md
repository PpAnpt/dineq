# Lab 6 version ledger: DineQ and HairRoot

Drafted 27 November 2026 for the Lab 6 report (#52) and the version table required by the handout. **Rows marked PENDING have not happened or have not been read yet; nothing in them is a result.** Update a row only from an actual observation, and keep earlier rows unchanged. Times are UTC with Asia/Bangkok (UTC+7) in brackets where useful.

## 1. DineQ release chain

| # | Stage | Commit / ref | Cloud Run revision | Image digest (runnable) | Source / evidence | State |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Original accepted Sprint 1 baseline | tag `v1.0-sprint1`, `eaa555dfb062d3fc627a374cd55a910b6d609509` | n/a (not a recorded deployment) | n/a | Sprint 1 baseline tag in the repository | Historical |
| 2 | Lab 5 release of record on `main` | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` (merge commit of PR #42) | `s21271a0d-00005-rdp`, created 2026-11-22 04:45:08 [11:45:08] by the pipeline deployer account | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` | Deploy run [44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220); revision/digest read in Cloud Shell on 27 Nov (section 3) | Existing release; HairRoot's original-release decision refers to it (received, see section 5) |
| 3 | Same-image revision replacement for DQ-UAT-08B | same image as row 2 (no code change) | `s21271a0d-l6-1126161809`, created 2026-11-26 16:18:12 [23:18:12] by the DineQ owner operator through `gcloud run deploy` of the same digest | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` (identical to row 2) | [owner run R03](dineq-owner-run-R03.md), [received follow-up R02](dineq-received-followup-R02.md); digest equality read in Cloud Shell on 27 Nov 14:34:54 | **Currently serving, 100% traffic** (read 27 Nov 14:34:54) |
| 4 | Exercise staging base | `6f1d31f6f82808ef9e8d611b305ede20d63e96e3` | not deployed | n/a | `docs/labs/lab-06/controlled-fifo-exercise.md` (on `staging` through PR #64; not yet on `lab6-staging`) | Runtime source identical to row 2 |
| 5 | Exercise healthy baseline suite | `8e01a953fbef08b2c40f42a32648ea7092f47ce7` | not deployed | n/a | `docs/evidence/ce-fifo-baseline.txt`: 111 passed / 0 failed / 0 skipped | Historical |
| 6 | Controlled defect (newest-first Call Next) | `513e6599cc39b73579c3a3caf9a8bf9571b84c06` | **never deployed** | n/a | Exercise branch only; not an ancestor of `staging` | Isolated |
| 7 | Reproducing test (RED) | `ea646a970d04323d10b954f21a8ee13b859692b7` | never deployed | n/a | `docs/evidence/ce-fifo-red.txt`: 109 passed / 3 failed / 0 skipped | Historical, local run |
| 8 | Correction (GREEN) | `58c5b779e71817b69ce3c1030278bff457134e21` | never deployed | n/a | `docs/evidence/ce-fifo-green.txt`: 112 passed / 0 failed; 22 production checks; 6 browser journeys | Historical, local run |
| 9 | Squash into `staging` (PR #64) | `fb98f4c54d4d65173f465b1f87c7d58da1245a52` | not deployed | n/a | Hosted CI on the PR head (run 46002808751) succeeded; the squash commit adds only the new test and documents | On `staging` |
| 10 | Release PR `staging` to `main` | [PR #65](https://github.com/PpAnpt/dineq/pull/65) (draft) | n/a | n/a | Pre-merge checklist in the PR | PENDING review, HairRoot's agreed window, ticket cleanup |
| 11 | Merge commit on `main` | PENDING (full SHA) | PENDING | PENDING | PENDING | PENDING |
| 12 | Deploy run on `main` | PENDING (run id, same-commit CI gate, migration job, smoke test) | PENDING (new revision name, deployer account, time) | PENDING | PENDING | PENDING |
| 13 | HairRoot independent DQ-UAT-07 retest | PENDING | PENDING (version they were given) | PENDING | PENDING | PENDING |

### Notes that the report must state
- **Runtime source did not change** between rows 2 and 11: `server/src`, `client/src`, `database`, `Dockerfile` and `.github` are identical. The image copies only `server/src`, `database/` and the built client, and `docs` is excluded by `.dockerignore`, so the added tests and documents are not in the image. A new build may nevertheless produce a different digest; record the observed one and do not assume equality.
- **Legitimate merge-commit differences:** row 9 is a squash commit on `staging`; row 11 will be a merge commit on `main` whose parents are the previous `main` commit and row 9. They are different commits with the same resulting tree. After merging, verify that with `git rev-parse origin/main^{tree} origin/staging^{tree}` (the two values should be equal) and record the result. The deploy workflow tags the image with the full SHA of the `main` commit (row 11), so use that SHA for the deployed version.
- **Registry digest versus runtime digest:** Artifact Registry resolves a tag to an image index (it includes the BuildKit attestation); Cloud Run reports the digest of the runnable `linux/amd64` manifest. They can differ legitimately. Record which value came from which command.
- Rows 6 to 8 are training commits on the exercise branch; the exercise is separate from the healthy Sprint 1 release and from the Accepted decision on row 2.

## 2. HairRoot chain (tested by the DineQ team)

| Stage | Commit | Cloud Run revision (partner-declared unless noted) | Observed by DineQ | Evidence |
| --- | --- | --- | --- | --- |
| Original Sprint 1 baseline | tag `v0.1.0-sprint1`, `d1e8d81d630bbc6e377bdd07a65e2b39e6967680` | n/a | n/a | HairRoot repository |
| R01 candidate | `ac0a57b9eb871128807733a0e9d75d77a662b477` | `hairroot-sha-ac0a57b9eb87-44992339630-1` | page footer `Version ac0a57b` on 26 Nov; public `/api/version` returned the full commit at 13:42:14 on 26 Nov | [R01 run](hairroot-run-2026-11-26-R01.md): 5 PASS / 1 FAIL / 1 BLOCKED cases; finding HR-F01 |
| Fix (their issue #57) | PR #58 (merged 26 Nov 18:50 UTC) and release PR #59 (merged 27 Nov 09:37 UTC) | n/a | n/a | HairRoot repository |
| R02 corrected release | `cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d` (merge of PR #59) | `hairroot-sha-cbaf1baa38a5-45975306714-2` | footer `Version cbaf1ba`; `/api/version` returned the full commit at 10:00:09 and 10:13:45 on 27 Nov | [R02 retest](hairroot-retest-2026-11-27-R02.md): UAT-07-R02 PASS and UAT-05 step 4 PASS (targeted, not a full rerun) |

HairRoot's revisions are not verified through authenticated GCP access by the DineQ team.

## 3. Pre-deploy record for DineQ (read in Cloud Shell, read-only commands)

| Field | Value read on 2026-11-27 14:34:54 UTC [21:34:54] |
| --- | --- |
| Serving revision / traffic | `s21271a0d-l6-1126161809`, 100%, latest ready equals latest created |
| Previous revision | `s21271a0d-00005-rdp` (not active; still readable) |
| Digest of both revisions | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` (identical) |
| Migration job image | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/s21271a0d/s21271a0d:17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` (tag, not digest) |
| Live checks | `/api/health` 200; `/api/ready` ready with `db: connected`; `/login` 200 |
| Link from commit `17c8b90` to the digest | PENDING: the runnable amd64 digest of the `17c8b90` tag, from `docker manifest inspect` (command in section 6); expected to equal the digest above |
| Queue state before the exercise retest | PENDING: retained ticket T08 #17 (id `922aad64-621e-402b-b926-20d0c1fef4ce`) was WAITING when last read; finish it through the normal Host UI and record it before the retest |

## 4. Post-deploy record for DineQ (fill from actual reads after the deploy run succeeds)

| Field | Value |
| --- | --- |
| Time of reads (UTC) | PENDING |
| Deploy run id and conclusion | PENDING |
| Full `main` commit deployed / tag of the image | PENDING |
| `git rev-parse origin/main^{tree}` equals `origin/staging^{tree}`? | PENDING |
| Serving revision / traffic | PENDING |
| Deployer account | PENDING (expected: the pipeline deployer, not a person) |
| Runnable image digest; registry index digest | PENDING; PENDING |
| Digest equal to row 2 and row 3? | PENDING; if different, state that a new build produced a new digest and why that is not a defect |
| Migration job image | PENDING |
| Smoke checks (workflow log and manual) | PENDING |
| Version sent to HairRoot (who, when, by what channel) | PENDING |

## 5. Decisions and which version each refers to

| Decision | By | Version it refers to | Status |
| --- | --- | --- | --- |
| DineQ original Sprint 1 UAT: Accepted | HairRoot (relayed by the student; see [received acceptance](dineq-acceptance-received-20261127.md)) | Commit `17c8b90`; revisions `00005-rdp` and `l6-1126161809` (identical digest, section 3) | Relayed message only; a HairRoot-authored record is still needed |
| DineQ controlled exercise release | HairRoot | Row 11/12 of section 1 | PENDING retest |
| HairRoot Sprint 1 (corrected release) | DineQ | `cbaf1ba` | PENDING; targeted R02 retest PASS recorded; formal decision not yet written |

## 6. Commands used or planned (all read-only)

```bash
# serving revision and traffic
gcloud run services describe s21271a0d --project=cpe-se-course-2026 --region=asia-southeast1 --format="value(status.latestReadyRevisionName,status.latestCreatedRevisionName,status.url)"
gcloud run services describe s21271a0d --project=cpe-se-course-2026 --region=asia-southeast1 --format="json(status.traffic)"
# digest of a revision
gcloud run revisions describe <REVISION> --project=cpe-se-course-2026 --region=asia-southeast1 --format="value(metadata.name,metadata.creationTimestamp,status.imageDigest)"
# runnable amd64 digest of a tag
docker manifest inspect asia-southeast1-docker.pkg.dev/cpe-se-course-2026/s21271a0d/s21271a0d:<FULL_SHA> | python3 -c "import sys,json;m=json.load(sys.stdin);print([x['digest'] for x in m.get('manifests',[]) if x.get('platform')=={'architecture':'amd64','os':'linux'}])"
```
Never run `gcloud run services describe` without `--format`: it prints the service's environment configuration.

## Revision history

| Version | Date | Change |
| --- | --- | --- |
| 0.1 | 2026-11-27 | First draft: DineQ chain, HairRoot chain, pre-deploy record read on 27 November 14:34:54 UTC; post-deploy and retest rows PENDING |
