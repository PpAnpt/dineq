# DineQ 08B owner inspect, relayed 26 Nov 2026

The DineQ operator's Cloud Shell `inspect` output was relayed by the HairRoot user. This is a transcription of selected fields, not the original JSON file or an independently authenticated GCP read.

| Field | Relayed value |
| --- | --- |
| Check time | 2026-11-26T16:24:02.132671+00:00 |
| Old revision from owner pre-restart snapshot | `s21271a0d-00005-rdp` |
| New revision | `s21271a0d-l6-1126161809` |
| New revision traffic | 100% |
| Image digest before and after | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` |
| Database binding matches | `true` |

The owner script was interrupted during `database('verify')`. A separate post-restart database snapshot and data-hash comparison are still pending. The tester's two ticket records matched before and after the interruption; see `2026-11-26T16-20-42-923Z-after-restart.json`.
