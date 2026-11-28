# F-07 Queue History and Filters - Sprint 3 Contract

> **Status:** Draft v0.2 (2026-11-28) · CPE334 Theme 9 · DineQ · เชื่อมโยง FR-04, FR-13, FR-16, BR-08, BR-12, NFR-01, NFR-04, NFR-06

เป้าหมาย: ผู้ใช้ดูประวัติของคิวที่ตนมีสิทธิ์เท่านั้น และกรองตามสถานะและช่วงเวลาได้ แบ่งเป็นสองส่วนตาม Checkpoint: **F-07a (วางแผน Implement ใน Deliverable 2)** คือตัวกรองประวัติตั๋วของ Customer และ **F-07b (PLANNED)** คือประวัติของ Host และประวัติการเปลี่ยนสถานะของตั๋ว

## 1. F-07a: Customer History Filter (วางแผน Implement)

API: `GET /api/me/entries` เดิม เพิ่ม Query Parameter ที่ไม่บังคับ (ไม่ส่ง = พฤติกรรม Sprint 1 เหมือนเดิมทุกประการ)

| Parameter | ชนิด | ความหมาย |
| :---- | :---- | :---- |
| `status` | หนึ่งในค่า `WAITING`, `CALLED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` (ตัวพิมพ์ใหญ่ตามนี้) | กรองสถานะของตั๋ว |
| `from` | ISO 8601 Timestamp ที่มี Timezone (`Z` หรือ `+07:00`) | `created_at >= from` |
| `to` | ISO 8601 Timestamp ที่มี Timezone | `created_at < to` |

กฎ:

- กรองเฉพาะตั๋วของผู้เรียก (`customer_id` มาจาก Session); Host เรียก Endpoint นี้ยังได้ 403 ตามเดิม (SDS C.6.3)
- Parameter ที่ไม่รู้จักถูกละเว้น; ค่าซ้ำ (`status=A&status=B`), ค่าว่าง (`status=`), `status` ที่ไม่อยู่ในรายการ, `from`/`to` ที่ Parse ไม่ได้หรือไม่มี Timezone, หรือ `from` > `to` คืน `400 VALIDATION_ERROR` และไม่ Query ข้อมูล
- ลำดับผลลัพธ์คงเดิม: `created_at DESC, ticket_no DESC` เพิ่ม `id` เป็นตัวตัดสินสุดท้ายให้ลำดับคงที่
- ไม่พบรายการคืน `200 { "data": [] }`; Ticket JSON ไม่เปลี่ยน
- ไม่มี Pagination (NFR-04 วัดที่ 100 ตั๋ว)

UI (`/my-queue`): ฟอร์มตัวกรอง (เลือกสถานะ, ช่วงเวลา), ปุ่มใช้ตัวกรอง/ล้างตัวกรอง, Loading, Empty ("ไม่พบตั๋วที่ตรงกับตัวกรอง"), Error ที่อ่านเข้าใจได้; ค่าเวลาจาก `datetime-local` ถูกแปลงเป็น ISO 8601 ก่อนส่ง; ใช้ Keyboard ได้

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-52 / TEST-52 | Customer มีตั๋ว WAITING, COMPLETED, CANCELLED (หลายคิวได้); `GET /api/me/entries?status=CANCELLED` และ `status=COMPLETED`; ไม่ส่ง Parameter | แต่ละ Query คืนเฉพาะตั๋วสถานะนั้นของตนเอง; ไม่ส่ง Parameter คืนทุกใบ เหมือนพฤติกรรมก่อนหน้า | API + DB |
| AC-53 / TEST-53 | ตั๋วสร้างที่เวลา t1 < t2 < t3; `from=t2`, `to=t3`, `from=t2&to=t3`, `from` เท่ากับ `created_at` พอดี, `to` เท่ากับ `created_at` พอดี | `from` รวมค่าที่เท่ากัน (>=) และ `to` ไม่รวม (<); ผลตรงกับการคำนวณเทียบ DB | API + DB Boundary |
| AC-54 / TEST-54 | `status=DONE`, `status=`, `status=WAITING&status=CALLED`, `status=waiting`, `from=yesterday`, `from=2026-11-28T10:00:00` (ไม่มี Timezone), `to` ผิดรูปแบบ, `from` > `to` | 400 `VALIDATION_ERROR` ทุกกรณี; ไม่มีข้อมูลรั่ว; Parameter ที่ไม่รู้จัก (`foo=1`) ถูกละเว้นและได้ 200 | API Boundary |
| AC-55 / TEST-55 | Customer A และ B มีตั๋วหลายใบ; A กรองด้วยทุก Parameter; Host ที่ Assigned และไม่ Assigned เรียกพร้อม Filter; ไม่มี Session | A ได้เฉพาะของ A; Host 403 `FORBIDDEN` (ก่อนตรวจ Filter); ไม่มี Session 401 `UNAUTHENTICATED`; Response ไม่มีข้อมูลของ B | API + Authorization |
| AC-56 / TEST-56 | ตั๋วหลายใบเวลาเดียวกันและต่างเวลา; กรอง `status` + ช่วงเวลารวมกัน; Filter ที่ไม่ตรงใบใดเลย | ลำดับ `created_at DESC, ticket_no DESC, id`; ผลตรงทั้งสองเงื่อนไข (AND); ไม่ตรงได้ `{ "data": [] }` | API + DB |
| AC-57 / TEST-57 | Customer เปิด `/my-queue`, เลือกสถานะ, ใส่ช่วงเวลา, ล้างตัวกรอง, ใส่ช่วงที่ไม่ตรง | ตั๋วที่แสดงเปลี่ยนตามตัวกรอง; Empty State ถูกต้อง; ใช้ Keyboard ได้; ข้อผิดพลาด 400 แสดงข้อความเข้าใจได้ | E2E (Playwright) |

## 2. F-07b: Host History and Ticket Event History (PLANNED)

ยังไม่ Implement ใน Deliverable 2; กำหนดสัญญาไว้เพื่อควบคุมการ Implement ภายหลัง

| API | บทบาท | ผล |
| :---- | :---- | :---- |
| `GET /api/queues/:queueId/history?status&from&to` | Host ที่ Assigned | ตั๋วทุกสถานะของคิวนั้นตามตัวกรองเดียวกับ F-07a (`from`/`to` เทียบ `created_at`); ไม่มีอีเมลหรือข้อมูลส่วนตัวของ Customer; `403` ถ้าไม่ Assigned, `404` ถ้าไม่มีคิว |
| `GET /api/entries/:entryId/events` | เจ้าของตั๋วหรือ Host ที่ Assigned | `200 { data: [ { eventType, fromStatus, toStatus, occurredAt } ] }` เรียงตาม `occurred_at, id`; ไม่มีข้อมูลส่วนตัวของผู้กระทำ; `403`/`404` ตาม SDS C.6.3 |

| AC / Test ID | เงื่อนไข | Expected Result | Level |
| :---- | :---- | :---- | :---- |
| AC-58 / TEST-58 | Assigned Host และ Host ที่ไม่ Assigned เรียก History ของคิว; Customer; ไม่มี Session | Assigned ได้ทุกสถานะตามตัวกรองและไม่มีข้อมูลส่วนตัว; Host อื่น 403; Customer 403; 401 | API + Authorization (PLANNED) |
| AC-59 / TEST-59 | เจ้าของ, Host ที่ Assigned และผู้อื่นเรียก Events ของตั๋วที่ผ่าน JOINED, CALLED, COMPLETED/CANCELLED/NO_SHOW | เจ้าของและ Host ได้ลำดับเหตุการณ์ครบถูกต้อง; ผู้อื่น 403; UUID ผิด 400; ไม่มีตั๋ว 404 | API + DB (PLANNED) |

## 3. Definition of Done

- F-07a: เทส TEST-52..57 เขียนก่อน, RED แล้ว GREEN พร้อมบันทึกผลรัน, Regression ทั้งชุดผ่าน (รวมเทสของ `/api/me/entries` เดิม), Playwright หนึ่ง Journey
- F-07b: Contract นี้ Review แล้ว สถานะ PLANNED ใน Traceability จนกว่าจะ Implement
- ไม่มี Secret; แถวใหม่ใน `docs/ai-use-log.md`

## 4. Dependencies

- F-07a ใช้ค่า `CANCELLED` (และ `NO_SHOW`) ที่เพิ่มใน Migration 003 ของ F-04 จึงต้อง Merge F-04 ก่อนเทสและ Implement; ไม่เพิ่ม Migration ใหม่
- ชั้นที่ไม่ต้องแก้: Authentication, Join/Call Next/Complete, Schema (F-07a)

## 5. Execution Results: F-07a (2026-11-28)

Recorded at commit `d52798182651a3eefe2dd7523cbcee108be4edf1` on branch `feature/f-07a-history-filter` (stacked on the F-04 branch because CANCELLED must exist; local PostgreSQL test database in an isolated schema; not merged, not deployed). RED: [f07a-red](../../evidence/f07a-red.txt), 15 failed / 173 passed / 0 skipped of 188 on unmodified application code. GREEN: [f07a-green](../../evidence/f07a-green.txt), 188 passed / 0 failed / 0 skipped; Playwright [f07a-e2e-green](../../evidence/f07a-e2e-green.txt), 8 passed (E2E-9 failed before the filter form existed).

| AC / Test | Actual file | Result |
| --- | --- | --- |
| AC-52 / TEST-52 | `server/tests/f07a-history.test.js` | PASS |
| AC-53 / TEST-53 | `server/tests/f07a-history.test.js` | PASS (from inclusive, to exclusive, offset form, empty range) |
| AC-54 / TEST-54 | `server/tests/f07a-history.test.js` | PASS (11 invalid inputs, each 400 VALIDATION_ERROR) |
| AC-55 / TEST-55 | `server/tests/f07a-history.test.js` | PASS (the owner-only case already held before the change) |
| AC-56 / TEST-56 | `server/tests/f07a-history.test.js` | PASS |
| AC-57 / TEST-57 | `client/e2e/sprint-2-history.spec.js` (E2E-9) | PASS |

Not covered: F-07b (AC-58/59) stays PLANNED; no manual keyboard audit beyond the Enter-on-button step in E2E-9 (AC-74 stays PLANNED); no deployed-environment check. The CI node checks showed one failure out of 22 twice right after the UI fixture run and could not be reproduced in eight later runs (22 of 22 each); the cause is not known.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft, committed before tests and implementation |
| v0.2 | 2026-11-28 | Add execution results for F-07a (AC-52..57) from f07a-red, f07a-green and f07a-e2e-green at `d527981`; contract text unchanged, F-07b still planned |
