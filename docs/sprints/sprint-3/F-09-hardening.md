# F-09 Error/UX, Security, Performance and Final Regression - Sprint 3 Contract

> **Status:** Draft v0.1 (2026-11-28) · CPE334 Theme 9 · DineQ · เชื่อมโยง FR-15, NFR-01, NFR-02, NFR-04, NFR-06, NFR-07 · **F-09a Implement ใน Deliverable 2; ส่วนอื่น PLANNED**

## 1. F-09a: Oversized Request Body returns 413 PAYLOAD_TOO_LARGE (Implement)

ปัญหาที่ยืนยันแล้ว (`docs/known-limitations.md`): Body JSON เกิน 100 KB ได้ HTTP 413 แต่ Code เป็น `INTERNAL_ERROR` และข้อความ `request entity too large` ซึ่งไม่ตรงความหมายและไม่อยู่ใน Catalog

สัญญาใหม่:

| รายการ | กำหนด |
| :---- | :---- |
| Error | `413 PAYLOAD_TOO_LARGE`, message `Request body is too large` (ไม่เปิดเผยขนาดหรือข้อมูลภายใน) |
| เมื่อใด | Body ที่ JSON Parser ปฏิเสธเพราะเกิน Limit ปัจจุบัน 100 KB (`entity.too.large`) ทุก Endpoint ที่ Parse JSON |
| ลำดับตรวจ | ไม่เปลี่ยนจาก SDS C.6.3: Endpoint ที่ตรวจ Session/Role/Resource ก่อน Parse Body (เช่น Join) ยังคืน 401/403/400/404 ก่อน; Login (Public) คืน 413 เมื่อ Body ใหญ่เกิน |
| ผลข้างเคียง | ไม่สร้าง Session, ไม่ตั้ง Cookie, ไม่สร้างหรือแก้ Row ใด |
| Body ขนาดไม่เกิน Limit | ทำงานตามเดิมทุกประการ (เช่น Login ผิดได้ 401) |
| Catalog | เพิ่มแถว `413 PAYLOAD_TOO_LARGE` ใน SDS C.6.2 (บันทึกไว้ในหัวข้อ C.8 ของ SDS) |

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-70 / TEST-70 | `POST /api/auth/login` ด้วย JSON เกิน 100 KB (Field ที่ถูกต้อง + Padding) | 413 `PAYLOAD_TOO_LARGE`; ไม่มี Session ใน DB; ไม่มี `Set-Cookie`; Body ไม่มีข้อความภายใน | API + DB |
| AC-71 / TEST-71 | Customer Join ด้วย Body เกิน 100 KB; Join โดยไม่มี Session ด้วย Body เกิน; Join ที่ Body ใหญ่แต่ไม่เกิน Limit และถูกต้อง | 413 `PAYLOAD_TOO_LARGE` และไม่ Insert/ไม่กินเลขคิว; ไม่มี Session ได้ 401 ก่อน; Body ไม่เกิน Limit ได้ 201 ตามปกติ | API + DB Boundary |
| AC-72 / TEST-72 | ชุด Error เดิม: JSON ไม่ถูกรูปแบบ, Field ขาด, Body ว่าง | คงผลเดิมทุกกรณี (400/401/403/404/409); `INTERNAL_ERROR` ยังใช้เฉพาะ 5xx จริง | API Regression |

## 2. ส่วนที่ PLANNED

| AC / Test ID | หัวข้อ | เกณฑ์ | วิธีทวนสอบ |
| :---- | :---- | :---- | :---- |
| AC-73 / TEST-73 | NFR-04 Performance | `GET /api/queues` และ `GET /api/me/entries` p95 ≤ 1000 ms ที่ 100 ตั๋ว / 20 คำขอพร้อมกัน หลัง Warm-up | สคริปต์วัดจริง บันทึก Environment, Tool, Version, เวลา, จำนวนตัวอย่าง และค่าที่วัด (ไม่ประมาณ) |
| AC-74 / TEST-74 | NFR-07 Keyboard | Flow Join, Call Next, Complete (และ Cancel/ปิดคิว/ตัวกรอง) ทำได้ด้วย Keyboard; Focus มองเห็น; Dialog ปิดด้วย Escape | Manual Checklist บันทึกผลจริงต่อรายการ |
| AC-75 / TEST-75 | FR-15 UX States | ทุกหน้าจอมี Loading, Empty, Error, Success ที่เหมาะสม | Checklist หน้าจอ x สถานะ พร้อมภาพหน้าจอ |
| AC-76 / TEST-76 | Final Regression | ชุดทดสอบ API/DB, Playwright และ Smoke บน Deployment ผ่านโดยไม่มี Skip ที่ซ่อน | รันชุดเต็มที่ Release Commit และบันทึกจำนวนจริง |

## 3. Definition of Done

- F-09a: เทส TEST-70..72 เขียนก่อน; RED บนพฤติกรรมปัจจุบัน (413 พร้อม `INTERNAL_ERROR`) แล้ว GREEN; Regression ผ่าน; อัปเดต `docs/known-limitations.md` เฉพาะหลังมีผลรันจริง
- ส่วน PLANNED: Contract Review แล้ว สถานะ PLANNED จนกว่าจะมีผลวัดหรือผลรัน

## 4. Dependencies

F-09a ไม่ขึ้นกับ Sprint 2; ไม่มี Migration ใหม่; แก้เฉพาะ Error Handler ที่จับ `entity.too.large`

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft; F-09a ระบุจากข้อจำกัดที่บันทึกไว้ใน Sprint 1 |
