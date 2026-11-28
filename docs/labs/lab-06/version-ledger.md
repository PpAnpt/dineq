# Lab 6 version ledger: DineQ and HairRoot

Drafted 27 November 2026 and updated 28 November 2026 with the deployment facts verified from GitHub for the Lab 6 report (#52) and the version table required by the handout. **Rows marked PENDING have not happened or have not been read yet; nothing in them is a result.** Update a row only from an actual observation, and keep earlier rows unchanged. Times are UTC with Asia/Bangkok (UTC+7) in brackets where useful.

## 1. DineQ release chain

| # | Stage | Commit / ref | Cloud Run revision | Image digest (runnable) | Source / evidence | State |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Original accepted Sprint 1 baseline | tag `v1.0-sprint1`, `eaa555dfb062d3fc627a374cd55a910b6d609509` | n/a (not a recorded deployment) | n/a | Sprint 1 baseline tag in the repository | Historical |
| 2 | Lab 5 release of record on `main` | `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` (merge commit of PR #42) | `s21271a0d-00005-rdp`, created 2026-11-22 04:45:08 [11:45:08] by the pipeline deployer account | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` | Deploy run [44986245220](https://github.com/PpAnpt/dineq/actions/runs/44986245220); revision/digest read in Cloud Shell on 27 Nov (section 3) | Existing release; HairRoot's original-release decision refers to it (received, see section 5) |
| 3 | Same-image revision replacement for DQ-UAT-08B | same image as row 2 (no code change) | `s21271a0d-l6-1126161809`, created 2026-11-26 16:18:12 [23:18:12] by the DineQ owner operator through `gcloud run deploy` of the same digest | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` (identical to row 2) | [owner run R03](dineq-owner-run-R03.md), [received follow-up R02](dineq-received-followup-R02.md); digest equality read in Cloud Shell on 27 Nov 14:34:54 | Served 100% of traffic from 26 Nov 16:18:12 until row 12 replaced it on 27 Nov 15:28:57 (read in Cloud Shell on 27 Nov 14:34:54) |
| 4 | Exercise staging base | `6f1d31f6f82808ef9e8d611b305ede20d63e96e3` | not deployed | n/a | `docs/labs/lab-06/controlled-fifo-exercise.md` (on `staging` through PR #64; not yet on `lab6-staging`) | Runtime source identical to row 2 |
| 5 | Exercise healthy baseline suite | `8e01a953fbef08b2c40f42a32648ea7092f47ce7` | not deployed | n/a | `docs/evidence/ce-fifo-baseline.txt`: 111 passed / 0 failed / 0 skipped | Historical |
| 6 | Controlled defect (newest-first Call Next) | `513e6599cc39b73579c3a3caf9a8bf9571b84c06` | **never deployed** | n/a | Exercise branch only; not an ancestor of `staging` | Isolated |
| 7 | Reproducing test (RED) | `ea646a970d04323d10b954f21a8ee13b859692b7` | never deployed | n/a | `docs/evidence/ce-fifo-red.txt`: 109 passed / 3 failed / 0 skipped | Historical, local run |
| 8 | Correction (GREEN) | `58c5b779e71817b69ce3c1030278bff457134e21` | never deployed | n/a | `docs/evidence/ce-fifo-green.txt`: 112 passed / 0 failed; 22 production checks; 6 browser journeys | Historical, local run |
| 9 | Squash into `staging` (PR #64) | `fb98f4c54d4d65173f465b1f87c7d58da1245a52` | not deployed | n/a | Hosted CI on the PR head (run 46002808751) succeeded; the squash commit adds only the new test and documents | On `staging` |
| 10 | Release PR `staging` to `main` | [PR #65](https://github.com/PpAnpt/dineq/pull/65), opened as a draft by PpAnpt, approved by BBINGOAL, **merged 27 Nov 15:25:52 UTC [22:25:52]** | n/a | n/a | Pre-merge checklist in the PR; the retained ticket T08 #17 was finished through the normal Host UI before the deploy (see PR #66 `controlled-fifo-release-20261127.md`) | Merged |
| 11 | Merge commit on `main` | `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931`; its tree `708cb3e69f60265e9c874be94034ea842055281e` equals the tree of row 9 on `staging` (`git rev-parse` of both, read 28 Nov) | n/a | n/a | GitHub | On `main` |
| 12 | Deploy run on `main` | [run 46024849737](https://github.com/PpAnpt/dineq/actions/runs/46024849737): success on `1ffb8b0`; jobs `test / test-and-docker` and `deploy` both success | `s21271a0d-00007-pnb`, "deployed and serving 100 percent of traffic" at 2026-11-27 15:28:57 UTC [22:28:57] (deploy log) | Runnable manifest exported by the deploy build: `sha256:6cd1b0549e795905ef04d84eb553388e9ee9943089727a2e3a20089e4baf1c47` (deploy log; not a separate Cloud Run `status.imageDigest` read). **Different from rows 2 and 3** | Deploy log: smoke test passed at 15:29:01 (`/api/health`, `/api/ready` ready with `db: connected`, UI root) | Deployed; a direct Cloud Run read of the serving revision is still PENDING |
| 13 | HairRoot independent DQ-UAT-07 retest | `1ffb8b0` / `00007-pnb` as handed over | partner-reported run 15:54:04-15:54:15 UTC [22:54:04-22:54:15], fixtures #22/#23 | n/a | Received from HairRoot and recorded in PR #66; partner-reported 9 of 9 steps PASS, findings none; evidence qualifications (Loading images, raw versus consolidated summary, no completed-owner read-back yet) are recorded there | Reported PASS 9/9; the partner Accepted decision for this release is recorded in section 5 (source `docs/labs/lab-06/dineq-new-release-decision-20261128.md`) |

### Notes that the report must state
- **Runtime source did not change** between rows 2 and 11: `server/src`, `client/src`, `database`, `Dockerfile` and `.github` are identical. The image copies only `server/src`, `database/` and the built client, and `docs` is excluded by `.dockerignore`, so the added tests and documents are not in the image. The rebuilt image did produce a different digest (row 12), as the registry notes below allow; it is not a defect and not evidence of a source change (row 11 has the same tree as row 9, and the runtime source equals row 2).
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

## 4. Post-deploy record for DineQ

Facts read from GitHub on 28 November 2026 (UTC) unless stated. Cloud Run itself was not queried after the deploy by this draft.

| Field | Value |
| --- | --- |
| Deploy run id and conclusion | 46024849737, success (same-commit CI job and deploy job) |
| Full `main` commit deployed / tag of the image | `1ffb8b09b8df7f6b6954047ccdef4c2ccc113931` (the workflow tags the image with the full SHA) |
| `main` tree equals `staging` tree? | Yes: both `708cb3e69f60265e9c874be94034ea842055281e` |
| Serving revision / traffic | `s21271a0d-00007-pnb`, 100% per the deploy log at 15:28:57; **PENDING** a direct `gcloud` read |
| Deployer account | PENDING (the pipeline deployer is expected; not read) |
| Runnable image digest; registry index digest | `sha256:6cd1b05...1c47` from the deploy build log; registry index digest PENDING |
| Digest equal to rows 2 and 3? | No: `sha256:78f53db5...c138b8` for rows 2 and 3 versus `sha256:6cd1b05...1c47` for row 12 |
| Migration job image | PENDING (read after the deploy) |
| Smoke checks | Workflow smoke test passed at 15:29:01 UTC; a separate public read-only Playwright smoke at 15:29:36 UTC is reported in PR #66 (not repeated here) |
| Version sent to HairRoot | Reported in PR #66: notice given and the deployment record handed over before the retest; HairRoot's retest started at about 15:47 UTC |

## 5. Decisions and which version each refers to

| Decision | By | Version it refers to | Status |
| --- | --- | --- | --- |
| DineQ original Sprint 1 UAT: Accepted | HairRoot (Tithinan Sobking), 27 November; scope clarified later | **Original baseline only:** commit `17c8b90`, revision `00005-rdp` (the same image served again as `l6-1126161809`) | Relayed through the student; a HairRoot-authored record is still wanted |
| DineQ controlled-exercise release: Accepted | HairRoot (Tithinan Sobking), relayed by Siwarak; dated 27 November after the retest, received 28 November | `1ffb8b0` / `00007-pnb` | DQ-UAT-07 reported PASS 9/9 and the partner Accepted response is recorded (source `docs/labs/lab-06/dineq-new-release-decision-20261128.md`); the exact decision time was not supplied, and the later owner read-back for #22/#23 is still missing and remains a disclosed limit |
| HairRoot Sprint 1 corrected release: Accepted | DineQ, recorded as declared by Siwarak Chatvichai on 27 November (see PR #66, `hairroot-acceptance-declared-20261127.md`) | `cbaf1ba` | Targeted R02 retest PASS; R01 history (5 PASS / 1 FAIL / 1 BLOCKED) preserved; Anapat took part as a UAT-07-R02 tester per the student's statement (source `docs/labs/lab-06/anapat-retest-statement-20261128.md`): original R02 interval 27 November 17:00:09-17:24:08 Bangkok, original attribution kept (Siwarak privately authenticated the roles, Codex drove the browser actions) |

The service currently runs `00007-pnb`, not the originally accepted image (the baseline Accepted covers only `17c8b90` / `00005-rdp`; the later Accepted covers `1ffb8b0` / `00007-pnb`); the report must say which version each decision covers.

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
| 0.2 | 2026-11-28 | Rows 10-13 and sections 4-5 filled from GitHub (PR #65 merge, tree equality, deploy run 46024849737 log) and the received retest in PR #66; direct Cloud Run read and registry digest still PENDING |
| 0.3 | 2026-11-28 | PR #67 review (P2): align the decision rows with the records already in this PR: the new-release Accepted response (`dineq-new-release-decision-20261128.md`, author Tithinan Sobking per Siwarak, dated 27 November after the retest, received 28 November, exact time not supplied) replaces 'acceptance not confirmed', and Anapat's UAT-07-R02 tester participation (`anapat-retest-statement-20261128.md`) replaces 'execution not recorded'; the older wording is kept here as history |
