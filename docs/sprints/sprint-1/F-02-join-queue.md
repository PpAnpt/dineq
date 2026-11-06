# F-02 Customer Walk-in Ticket Joining - Sprint 1 Contract

> **Status:** Draft v0.3 (2026-11-06) · CPE334 Theme 9 · DineQ

เป้าหมาย: ลูกค้าดูร้าน/คิว OPEN ระบุจำนวนคน (partySize 1–8) กดรับคิวและดูสถานะ WAITING ที่บันทึกจริง; API: GET /api/queues, POST /api/queues/:queueId/entries, GET /api/me/entries, GET /api/entries/:entryId

Main Flow: Login → เลือก OPEN Queue → ใส่ partySize → Join → Backend เปิด Transaction ตรวจคิวเดิม/จำนวนคน/Status → ออก ticketNo จาก Counter → บันทึก Entry/Event → คืน 201 → Refresh GET ตรง DB; Reject คิวซ้ำ CLOSED Queue/Invalid Party Size/Forbidden

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-07 / TEST-07 | Customer, Assigned Host และ Unassigned Host GET Queue List หลัง Login | 200 `{ data: [...] }` แต่ละรายการมี `id`, `restaurant: { id, name }`, `status` OPEN/CLOSED, `isAssigned` ตาม SDS C.6.1; Assigned Host ได้ true เฉพาะคิวที่ดูแล อีกสองบทบาทได้ false; ไม่มีคิวได้ `{ "data": [] }` | API / E2E |
| AC-08 / TEST-08 | Customer Join OPEN Queue ด้วย partySize=4 | 201 WAITING, ticketNo/partySize ตรง, มี JOINED Event และ GET ซ้ำได้ | API + DB |
| AC-09 / TEST-09 | Customer คนเดิม Join ซ้ำขณะ WAITING/CALLED | 409 DUPLICATE_ACTIVE; Active Entry ไม่เพิ่ม | API + DB |
| AC-10 / TEST-10 | 30 Customer ต่างบัญชี Join พร้อมกัน | ticketNo ภายใน Queue ไม่ซ้ำ, DB/Counter สอดคล้อง | Concurrency + DB |
| AC-11 / TEST-11 | Customer A GET Ticket ของ Customer B | 403 ไม่มีข้อมูล B ใน Response | API + Authorization |
| AC-12 / TEST-12 | Join Queue CLOSED หรือ partySize=0,9,1.5/ข้อความ | 409 QUEUE_CLOSED หรือ 400 INVALID_PARTY_SIZE; ไม่ Insert และไม่กินเลขคิว | API + DB Boundary |
| AC-13 / TEST-13 | Host เรียก Join Endpoint ที่อนุญาตเฉพาะ Customer | 403 ไม่เกิด Ticket ใหม่ | API + Role |
| AC-21 / TEST-21 | Customer Join สำเร็จ แล้วสร้าง App Instance ใหม่พร้อม DB Pool ใหม่ต่อ DB เดิม (จำลอง Restart) | Ticket และ JOINED Event ที่สร้างไว้ก่อนหน้ายังอ่านได้ครบ (ticketNo/partySize/status ตรงเดิม) | API + DB (Restart Persistence) |
| AC-23 / TEST-23 | Customer เรียก GET /api/entries/:entryId และ POST /api/queues/:queueId/entries (partySize=4) ด้วย `not-a-uuid` หรือ UUID ที่ยืนยันว่าไม่มีใน DB; ทวนคำขอทั้งสองแบบโดยไม่มี Session | มี Session: UUID ผิดรูปแบบ → 400 VALIDATION_ERROR, UUID ถูกแต่ไม่มี Resource → 404 NOT_FOUND; ไม่มี Session → 401 UNAUTHENTICATED ก่อนตรวจ UUID; ทุกกรณีไม่เพิ่ม Entry/Event/Counter และไม่เปิดเผยข้อมูลส่วนตัว | API + DB Boundary |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Add AC-21/TEST-21 (restart persistence) to give NFR-02 a Sprint 1 test |
| v0.3 | 2026-11-06 | Extend TEST-07 for queue JSON/isAssigned/empty results; add AC-23/TEST-23 for UUID validation, missing resources and authentication precedence |
