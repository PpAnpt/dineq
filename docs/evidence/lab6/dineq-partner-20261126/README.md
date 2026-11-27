# DineQ follow-up evidence received from HairRoot

Source: student attachment `UAT-DinoQ-Pic-2 (2).zip`, archive SHA-256
`77cc56a568662cb97c03f9f54f98b0fa55795a871bcc66aeb5f8a338304efbdf`.
Reviewed on 27 November 2026 Asia/Bangkok; exact delivery time was not recorded.
The [manifest](source-manifest.json) lists 23 byte-identical selected originals:
five JSON observations, sixteen screenshots and two relayed owner records.
The original ZIP remains local, including earlier preparation-only attempts.
No runner scripts, private credentials or configuration are published here.

## Records and interpretation

| Evidence ID | Source / actual action | Expected and actual | Result / limit |
| --- | --- | --- | --- |
| DQ-R02-04-PREP | [22:53 baseline](results/2026-11-26T15-53-41-810Z-prep.json), 26 Nov Bangkok, C1/C2/C3/H1 reads at the DineQ URL | Fresh baseline before closure; source reports OPEN and retained fixtures | PREPARED, not an executed rejection |
| DQ-R02-04-CLOSED | [23:07:36–23:07:45](results/2026-11-26T16-07-36-406Z-closed.json), C3 UI/API attempt and H1 reads | CLOSED, Join disabled, POST size 4 returns 409 QUEUE_CLOSED, C3/H1 lists unchanged; actual matches | OBSERVATION_PASS as supplied |
| DQ-R02-04-RESTORED | [23:11:36–23:11:41](results/2026-11-26T16-11-36-096Z-restored.json), independent C3/H1 reads | OPEN after owner restoration; C3/H1 lists match the rejected-attempt after-state | OBSERVATION_PASS as supplied |
| DQ-R02-08-PREP | [23:12:36–23:12:45](results/2026-11-26T16-12-36-455Z-prep.json), C1/C2 retained-ticket API reads | T02 #12 COMPLETED and T08 #17 WAITING saved before replacement | PREPARED; full fields retained |
| DQ-R02-08-AFTER | [23:20:42–23:20:49](results/2026-11-26T16-20-42-923Z-after-restart.json), C1/C2 reads | Same ticket bodies and timestamps after reported replacement; actual t02Matches/t08Matches true | OBSERVATION_PASS; requires the separate owner-operation record |
| DQ-R03-OWNER | [R03 transcription](owner-R03-transcribed.json), existing authenticated operator output | CLOSED 22:58:56.155 / OPEN 23:09:47.375, counter 18, unchanged=true | Corroborates 04C setup/restoration; full originals remain in Cloud Shell |
| DQ-R02-08-OWNER | [Relayed inspect](results/08B-owner-inspect-relayed.md) at 23:24 and [later comparison](results/08B-owner-before-after-comparison.md) reporting 23:27 | Distinct revision, same digest/DB binding, 17 entries / 49 events / same hash | Partner-relayed transcription, not a fresh authenticated read; the later comparison supplies verification pending in the earlier inspect |

All times above are 26 November 2026 Asia/Bangkok (UTC+7). Exact UTC start/end
fields remain unchanged in each JSON. The UI/API base is
<https://s21271a0d-4d7hbszvwq-as.a.run.app>.
The commit `17c8b90642ecb742b4f8b7e8c55da7fd34ddd620` is a handoff reference,
not reverified by the partner in this attempt. Owner records identify revision
`s21271a0d-00005-rdp` before and `s21271a0d-l6-1126161809` after replacement,
with runtime digest `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8`.

## Screenshot use

Each JSON lists the original screenshot paths for its own observation. Preserve
the originals and their manifest hashes. Their filename/overlay times are capture
times, not necessarily the exact API response time. Use the JSON for status codes,
full ticket equality and timestamps; a screenshot alone cannot prove these.

- `04C-closed-*-C3-queue.png`: CLOSED and disabled Join context for C3 before/after
  the rejected request. H1 companion captures show the retained WAITING list.
- `04C-restored-C3-queue.png` and H1 companion: observed OPEN/restored context.
- Prep captures preserve the C1/C2/C3/H1 UI context at that snapshot. API bodies
  supply the actual ticket baseline; a context image is not automatically a
  ready-state ticket-detail image.
- `08B-after-restart-C2-ticket17.png`: retained #17 WAITING UI context.
  `08B-after-restart-C1-ticket12.png` actually displays the queues page, so it is
  **not** a visual proof of ticket #12. Its retained body is evidenced by the JSON.

The partner attributes automated Playwright observations to Tithinan Sobking's
request. Iivo's execution is not confirmed by this source. The summary reports
08B PASS and 04C OBSERVATION PASS with owner evidence pending; the existing R03
operator transcription is now cross-linked, not silently substituted into the
original summary. No final independent acceptance is supplied or invented.
