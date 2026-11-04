# F-02 Customer Walk-in Ticket Joining - Sprint 1 Contract

> **Status:** Draft v0.1 (2026-11-04) · CPE334 Theme 9 · DineQ

เป้าหมาย: ลูกค้าดูร้าน/คิว OPEN ระบุจำนวนคน (partySize 1–8) กดรับคิวและดูสถานะ WAITING ที่บันทึกจริง; API: GET /api/queues, POST /api/queues/:queueId/entries, GET /api/me/entries, GET /api/entries/:entryId

Main Flow: Login → เลือก OPEN Queue → ใส่ partySize → Join → Backend เปิด Transaction ตรวจคิวเดิม/จำนวนคน/Status → ออก ticketNo จาก Counter → บันทึก Entry/Event → คืน 201 → Refresh GET ตรง DB; Reject คิวซ้ำ CLOSED Queue/Invalid Party Size/Forbidden

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-07 / TEST-07 | Customer GET Queue List หลัง Login | 200 แสดงชื่อร้าน คิว และ OPEN/CLOSED | API / E2E |
| AC-08 / TEST-08 | Customer Join OPEN Queue ด้วย partySize=4 | 201 WAITING, ticketNo/partySize ตรง, มี JOINED Event และ GET ซ้ำได้ | API + DB |
| AC-09 / TEST-09 | Customer คนเดิม Join ซ้ำขณะ WAITING/CALLED | 409 DUPLICATE_ACTIVE; Active Entry ไม่เพิ่ม | API + DB |
| AC-10 / TEST-10 | 30 Customer ต่างบัญชี Join พร้อมกัน | ticketNo ภายใน Queue ไม่ซ้ำ, DB/Counter สอดคล้อง | Concurrency + DB |
| AC-11 / TEST-11 | Customer A GET Ticket ของ Customer B | 403 ไม่มีข้อมูล B ใน Response | API + Authorization |
| AC-12 / TEST-12 | Join Queue CLOSED หรือ partySize=0,9,1.5/ข้อความ | 409 QUEUE_CLOSED หรือ 400 INVALID_PARTY_SIZE; ไม่ Insert และไม่กินเลขคิว | API + DB Boundary |
| AC-13 / TEST-13 | Host เรียก Join Endpoint ที่อนุญาตเฉพาะ Customer | 403 ไม่เกิด Ticket ใหม่ | API + Role |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
