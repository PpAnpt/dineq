# F-08 Queue Reporting Summary - Sprint 3 Contract

> **Status:** Draft v0.1 (2026-11-28) · CPE334 Theme 9 · DineQ · **PLANNED (ไม่ Implement ใน Deliverable 2)** · เชื่อมโยง FR-14, BR-08, NFR-01, NFR-04, NFR-06

เป้าหมาย: Host ที่ Assigned ดูสรุปจำนวนตั๋วของคิวตนเองตามสถานะ (รอ เสร็จ ยกเลิก No-show) ในช่วงเวลาที่เลือก

## 1. API

| Method | Endpoint | บทบาท | Request | Response |
| :---- | :---- | :---- | :---- | :---- |
| GET | `/api/queues/:queueId/summary?from&to` | Host ที่ Assigned | `from`/`to` ตามกฎของ F-07a (ไม่บังคับ; `created_at >= from`, `< to`) | `200 { data: { queueId, from, to, totals: { joined, waiting, called, completed, cancelled, noShow } } }`; `400 VALIDATION_ERROR`, `401`, `403`, `404` |

กฎ: ตัวเลขนับจากตั๋วของคิวนั้นในช่วงเวลา (`joined` = ทุกสถานะรวมกัน); ไม่มีข้อมูลส่วนตัวของ Customer; คิวว่างได้ตัวเลข 0 ทั้งหมดไม่ใช่ Error; ลำดับตรวจตาม SDS C.6.3 (Role → UUID → 404 → Assignment 403 → Query)

UI: หน้า `/host/queues/:queueId/summary` มีตัวเลขหกช่อง, ตัวเลือกช่วงเวลา, Loading, Empty (ศูนย์), Error; ใช้ Keyboard ได้

## 2. Acceptance Criteria (PLANNED)

| AC / Test ID | เงื่อนไข | Expected Result | Level |
| :---- | :---- | :---- | :---- |
| AC-60 / TEST-60 | คิวมีตั๋วทุกสถานะอย่างละจำนวนที่รู้ | `totals` ตรงกับจำนวนใน DB ทุกช่อง และ `joined` = ผลรวม | API + DB |
| AC-61 / TEST-61 | ใส่ `from`/`to` ที่ตัดกลางข้อมูล | นับเฉพาะตั๋วในช่วง (>= from, < to) | API + DB Boundary |
| AC-62 / TEST-62 | คิวที่ไม่มีตั๋วเลย | 200 และทุกช่องเป็น 0 | API |
| AC-63 / TEST-63 | Host ที่ Assigned กับคิวอื่น, Customer, ไม่มี Session, UUID ผิดและไม่มีคิว, Filter ผิด | 403, 403, 401, 400/404, 400 ตามลำดับตรวจ; ไม่รั่วข้อมูลคิวอื่น | API + Authorization |
| AC-64 / TEST-64 | Host เปิดหน้าสรุปแล้วเปลี่ยนช่วงเวลา | แสดงตัวเลขตรง API; Empty/Error/Loading ถูกต้อง | E2E |

## 3. Definition of Done

Contract Review แล้ว; เทสเขียนก่อน Implement; GREEN พร้อมบันทึกผลรัน; วัด NFR-04 ร่วมกับ F-09 (AC-73); ยังไม่ Implement ใน Deliverable 2

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft (PLANNED) |
