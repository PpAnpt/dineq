# Requirements Traceability Matrix (B.2)

> **Status:** Sprint 1 results v0.4 (2026-11-07) · CPE334 Theme 9 · DineQ

| Requirement / Rule | Feature / Sprint | AC หรือ Verification / Test ที่วางไว้ | สถานะ |
| :---- | :---- | :---- | :---- |
| FR-01, NFR-05 | F-01 / S1 | AC-01..AC-04 / TEST-01..04 | PASS (mapped Sprint 1 API cases; source SHA below) |
| BR-03 | F-01 & F-02 & F-03 / S1 | AC-05/06/13/19/20/24 / TEST-05/06/13/19/20/24 (AC-13 = Host เรียก Join; AC-24 = Role Guard ก่อนตรวจ UUID) | PASS (mapped Sprint 1 API cases; source SHA below) |
| NFR-01 | F-01 & F-02 & F-03 / S1 | AC-05/06/11/13/19/20/22/23/24 / TEST-05/06/11/13/19/20/22/23/24 | PASS (mapped Sprint 1 API cases; source SHA below) |
| NFR-02 | F-02 / S1 (ทวนสอบบน GCP ใน Lab 5) | AC-21 / TEST-21 | PASS local API/process restart; GCP NOT EXECUTED (Lab 5) |
| NFR-06 | F-01 & F-02 & F-03 / S1; F-09 / S3 | S1: AC-02/05/06/09/11/12/16/18/22/23/24 / TEST-02/05/06/09/11/12/16/18/22/23/24; 404 NOT_FOUND = TEST-23/24b, 404 NO_WAITING_ENTRY = TEST-24a | PASS mapped S1 cases only; S3 NOT EXECUTED |
| FR-02 | F-02 / S1 | AC-07 / TEST-07 (Queue JSON, isAssigned ของ Customer/Assigned Host/Unassigned Host และ Empty List) | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-03, BR-09 | F-02 / S1 | AC-08/12 / TEST-08/12 | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-03, BR-09 (Lab 7, L7-CR-01) | F-02 / S1 change in Lab 7 | AC-07 (revised, adds maxPartySize), AC-12 (revised), AC-25/26/27 / TEST-07/12/25/26/27 | PASS for the revised rule at `680e8aab2c5977ebc14dfee969af29d7bc44645c` on branch `test/l7-per-queue-party-limit` (API/DB: [l7-red](evidence/l7-red.txt) 28 failed / 113 passed / 0 skipped of 141, then [l7-green](evidence/l7-green.txt) 141 passed / 0 failed / 0 skipped; Playwright [l7-e2e-green](evidence/l7-e2e-green.txt) 6 passed). Local run only: not merged, not deployed; the PASS above still refers to the old fixed 1–8 rule at the Sprint 1 baseline |
| FR-04, BR-08 | F-02 / S1; F-07 / S3 | AC-11/23 / TEST-11/23; S3 Test ยังต้องออกแบบ | PASS mapped S1 cases only; S3 NOT EXECUTED |
| BR-01, NFR-03 | F-02 / S1 | AC-10 / TEST-10 | PASS (mapped Sprint 1 API cases; source SHA below) |
| BR-02 | F-02 / S1 | AC-09 / TEST-09 | PASS (mapped Sprint 1 API cases; source SHA below) |
| BR-07 | F-02 / S1 | AC-12 / TEST-12 | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-05 | F-03 / S1 | AC-14/24 / TEST-14/24 | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-06, BR-04/05 | F-03 / S1 | AC-15/16/24 / TEST-15/16/24 | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-07, BR-06/12 | F-03 / S1 | AC-17/18/24 / TEST-17/18/24 | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-08, BR-10 | F-04 / S2 | AC-28..35 / TEST-28..35 (`docs/sprints/sprint-2/F-04-cancel.md`; BR-12/FR-16 ของ Event CANCELLED = AC-28/29/35, BR-02 = AC-33) | PLANNED / NOT EXECUTED (contract v0.1 2026-11-28; ยังไม่มีเทสหรือโค้ด) |
| FR-09/10/16, BR-03/04/05/08/10/11/12, NFR-01/02/06/07 | F-05 / S2 | [No-show, seating, release and UI contract](sprints/sprint-2/F-05-no-show-seating.md): AC-36..45 / TEST-36..45; SDS C.9 | PARTIAL: 26 table/read/release/DB cases passed locally at a6aea0fb2a76f47d55495c6d039addc2b9edda8c; [record](evidence/f05-table-verification.md). No-show/Seat/UI/full integration NOT EXECUTED; not full F-05 PASS |
| FR-11/12, BR-07/08 (หลายคิว) | F-06 / S2 | AC-46..51 / TEST-46..51 (`docs/sprints/sprint-2/F-06-queues.md`; BR-07 ปิดคิว = AC-49, BR-08 แยกคิว = AC-48/50, NFR-03 ต่อคิว = AC-50) | PLANNED / NOT EXECUTED (contract v0.1 2026-11-28; ยังไม่มีเทสหรือโค้ด) |
| FR-16 (JOINED/CALLED/COMPLETED) | F-02 & F-03 / S1 | AC-08/15/17 / TEST-08/15/17 (ตรวจ Event ใน DB) | PASS (mapped Sprint 1 API cases; source SHA below) |
| FR-13, FR-16 (เหตุการณ์ภายหลัง) | F-07 / S3 | F-07a: AC-52..57 / TEST-52..57 (วางแผน Implement ใน D2); F-07b: AC-58/59 / TEST-58/59 (PLANNED) (`docs/sprints/sprint-3/F-07-history.md`) | PLANNED / NOT EXECUTED (contract v0.1 2026-11-28) |
| FR-15 (ส่วน S1) | F-02 / S1 | AC-12 / TEST-12 (400/409 + ไม่ Insert); UI Validation/Loading/Error/Empty ตรวจด้วย E2E/Manual (ยังไม่มี TEST ID) | PASS AC-12 and selected E2E/error states; full UI-state/manual checklist NOT EXECUTED |
| FR-14 | F-08 / S3 | AC-60..64 / TEST-60..64 (`F-08-reporting.md`) | PLANNED / NOT EXECUTED (contract v0.1 2026-11-28; ไม่ Implement ใน D2) |
| NFR-06 (413) , FR-15 (ส่วนที่เหลือ) | F-09a / S3 | AC-70..72 / TEST-70..72 (`F-09-hardening.md`; 413 PAYLOAD_TOO_LARGE) | PASS local API/DB at e75a598: 11 F-09a cases; full suite 123 passed / 0 failed / 0 skipped, [recorded GREEN](evidence/f09-payload-green.txt). Review/integration/deployment pending |
| NFR-04, NFR-07, FR-15 (UX), Final Regression | F-09 / S3 | AC-73..76 / TEST-73..76 (ผลวัด/Checklist/ผลรันจริงเท่านั้น) | PLANNED / NOT EXECUTED (contract v0.1 2026-11-28) |


Traceability ของ Sprint 2–3 ระบุเป็น PLANNED ได้ใน D1 โดยต้องเชื่อม Requirement กับฟีเจอร์และ Sprint ครบก่อนเริ่ม Implement; อย่าถือว่ามี Test ที่รันผ่านแล้ว

## Recorded Sprint 1 verification

Tested commit: `a7a145ec6b870abaed2b3ae13a88e0ffa832818d`. All AC-01..24 are PASS in the actual [AC execution table](sprints/sprint-1/test-spec.md#execution-results--p8-2026-11-07), supported by [release-full-run.txt](evidence/release-full-run.txt) and its JSON (108 passed / 0 failed / 0 skipped). [release-ac-results.md](evidence/release-ac-results.md) maps every actual test file/name/result; 100 cases map to feature AC and 8 are infrastructure cases.

Selected UI journeys: [release-e2e-run.txt](evidence/release-e2e-run.txt), 4 passed / 0 failed / 0 skipped; UI fixtures/build: [release-build-ui-checks.txt](evidence/release-build-ui-checks.txt), 3 passed / 0 failed / 0 skipped. Local NFR-02 also has a [real process restart and SQL-event comparison](evidence/release-restart-persistence.txt) on source-equivalent baseline `3d2ba1b78714f51127cdf07b7e44951c06ed8d7a`.

PASS applies to the specified recorded cases, not all future work. Manual two-profile walkthrough, full loading/empty/keyboard audit, Sprint 2/3 checks, GCP, accepted main release and release tag remain NOT EXECUTED. Release-prep review is pending. See [known limitations](known-limitations.md).

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Close gaps before implementation: add NFR-02→AC-21, NFR-06 S1 mapping, FR-16/FR-15 S1 rows, AC-22 under NFR-01; split BR-03 and NFR-01 |
| v0.3 | 2026-11-06 | Map queue-shape/assignment checks and new AC-23/24; explicitly cover both 404 codes and auth precedence without changing PLANNED statuses |
| v0.4 | 2026-11-07 | P8: map actual S1 API/E2E/restart evidence and tested SHA; distinguish later-sprint/manual/release work as NOT EXECUTED |
| v0.5 | 2026-11-28 | Lab 7 (L7-CR-01): add BR-09 per-queue party-size row (AC-07/12 revised, AC-25..27) as PLANNED; the earlier PASS stays attached to the Sprint 1 baseline rule |
| v0.6-f05 | 2026-11-28 | Map F-05 AC-36..45 / TEST-36..45 to the proposed no-show/table contract and SDS C.9 as PLANNED; retain every historical Sprint 1 result |
| v0.6 | 2026-11-28 | F-04: map FR-08/BR-10 to AC-28..35 (PLANNED) |
| v0.7 | 2026-11-28 | Sprint 3: map FR-13/14/15, NFR-04/06/07 to AC-52..76 (PLANNED)|
| v0.8 | 2026-11-28 | F-06: map FR-11/12 to AC-46..51 (PLANNED) |
| v0.9 | 2026-11-28 | Lab 7: BR-09 per-queue row changes from PLANNED to PASS for the local API/DB and E2E runs at `680e8aa` (l7-green, l7-e2e-green); deployment and review still pending |
| v0.10 | 2026-11-28 | Record local AC-70..72 results from f09-payload-green at e75a5989f909a5ebcf08041085a861a34596dc90; integration/deployment remain pending |

| v0.11-f05 | 2026-11-28 | Record partial F-05 table-slice results from real runs at a6aea0fb2a76f47d55495c6d039addc2b9edda8c; keep remaining F-05 checks unexecuted |
