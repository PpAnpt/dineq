# F-02 Customer Walk-in Ticket Joining - Sprint 1 Contract

> **Status:** Draft v0.3 (2026-11-06) · CPE334 Theme 9 · DineQ

เป้าหมาย: ลูกค้าดูร้าน/คิว OPEN ระบุจำนวนคน (partySize 1 ถึง maxPartySize ของ Queue นั้น; v0.4) กดรับคิวและดูสถานะ WAITING ที่บันทึกจริง; API: GET /api/queues, POST /api/queues/:queueId/entries, GET /api/me/entries, GET /api/entries/:entryId

Main Flow: Login → เลือก OPEN Queue → ใส่ partySize → Join → Backend เปิด Transaction ตรวจคิวเดิม/จำนวนคน/Status → ออก ticketNo จาก Counter → บันทึก Entry/Event → คืน 201 → Refresh GET ตรง DB; Reject คิวซ้ำ CLOSED Queue/Invalid Party Size/Forbidden

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-07 / TEST-07 | Customer, Assigned Host และ Unassigned Host GET Queue List หลัง Login | 200 `{ data: [...] }` แต่ละรายการมี `id`, `restaurant: { id, name }`, `status` OPEN/CLOSED, `maxPartySize` (จำนวนเต็ม 1–10; v0.4), `isAssigned` ตาม SDS C.6.1; Assigned Host ได้ true เฉพาะคิวที่ดูแล อีกสองบทบาทได้ false; ไม่มีคิวได้ `{ "data": [] }` | API / E2E |
| AC-08 / TEST-08 | Customer Join OPEN Queue ด้วย partySize=4 | 201 WAITING, ticketNo/partySize ตรง, มี JOINED Event และ GET ซ้ำได้ | API + DB |
| AC-09 / TEST-09 | Customer คนเดิม Join ซ้ำขณะ WAITING/CALLED | 409 DUPLICATE_ACTIVE; Active Entry ไม่เพิ่ม | API + DB |
| AC-10 / TEST-10 | 30 Customer ต่างบัญชี Join พร้อมกัน | ticketNo ภายใน Queue ไม่ซ้ำ, DB/Counter สอดคล้อง | Concurrency + DB |
| AC-11 / TEST-11 | Customer A GET Ticket ของ Customer B | 403 ไม่มีข้อมูล B ใน Response | API + Authorization |
| AC-12 / TEST-12 (v0.4) | Join Queue CLOSED หรือ partySize=0,-1,1.5/ข้อความ/null/ไม่ส่ง หรือ partySize มากกว่า maxPartySize ของ Queue นั้น (Queue หลักของ Seed = 10 จึงใช้ 11) | 409 QUEUE_CLOSED หรือ 400 INVALID_PARTY_SIZE; ไม่ Insert และไม่กินเลขคิว; partySize ที่ผิดจะถูกรายงานก่อนสถานะ CLOSED; partySize 1 และ 10 บน Queue หลักต้องสำเร็จ (เดิม AC-12 ใช้ 0, 9, 1.5 และขอบ 1, 8) | API + DB Boundary |
| AC-25 / TEST-25 | Queue ที่มี maxPartySize = 4, 8 และ 10 รับ Join ด้วยค่าขอบ: limit 4 รับ 1 และ 4 ปฏิเสธ 5; limit 8 รับ 8 ปฏิเสธ 9; limit 10 รับ 9 และ 10 ปฏิเสธ 11; เปลี่ยน limit ของ Queue แล้ว Join ถัดไปใช้ค่าใหม่ | ค่าที่รับได้ได้ 201 WAITING; ค่าที่เกินได้ 400 INVALID_PARTY_SIZE โดย message ระบุ limit ของ Queue นั้น (เช่น "from 1 to 4"); ไม่ Insert ไม่มี Event และ next_ticket_no ไม่เพิ่ม | API + DB Boundary |
| AC-26 / TEST-26 | Seed ตั้ง Queue หลักเป็น 10; Queue ที่ไม่ระบุค่ามี maxPartySize = 8; Ticket/Event ที่มีอยู่ก่อนใช้ Migration 002 | GET /api/queues ของ Queue หลักคืน maxPartySize=10 และ Queue ที่ไม่ระบุคืน 8; Ticket และ Event เดิมอ่านได้เหมือนเดิม (ticketNo/partySize/status ไม่เปลี่ยน); รัน Migration และ Seed ซ้ำไม่เปลี่ยนข้อมูลเดิม | API + DB (Migration/Seed) |
| AC-26b / TEST-26b | บน DB ที่มี Queue หลัก (id คงที่ของ Seed) ค่า 8 (ทั้งที่เป็นค่าเริ่มต้นและที่ตั้ง 8 ไว้เอง), Queue อื่นค่า 8, Queue อื่นที่ปรับเป็น 4 และสถานการณ์แยกที่ Queue หลักถูกตั้งเป็น 4, 6, 9 หรือ 10 ไว้เอง: รัน Migration 006; รันซ้ำ; รันบน DB ที่ไม่มี Queue หลัก; ทั้งชุด Migration แล้ว Seed บน DB ใหม่ | Queue หลักที่มีค่า 8 กลายเป็น 10 **แม้ 8 นั้นถูกตั้งไว้เอง** (Migration แยกค่าเริ่มต้นกับค่าที่ตั้งเองไม่ได้); Queue หลักที่มีค่า 4, 6, 9 หรือ 10 ไม่เปลี่ยน; Queue อื่นทุกแห่งไม่เปลี่ยน (ไม่ลดค่าและไม่แก้ค่าอื่นที่ไม่ใช่ 8 ของ Queue หลัก); รันซ้ำไม่เปลี่ยนอะไร; ไม่มี Queue หลักก็ไม่ Error; Ticket, Event, Counter ไม่เปลี่ยน; บน DB ใหม่หลัง Seed ได้ 10 | DB Migration |
| AC-27 / TEST-27 | DB: INSERT/UPDATE service_queues.max_party_size = 0 หรือ 11; INSERT queue_entries.party_size = 0 หรือ 11 | DB ปฏิเสธด้วย CHECK violation (23514); ช่วง 1–10 รับได้ | DB Constraint |
| AC-13 / TEST-13 | Host เรียก Join Endpoint ที่อนุญาตเฉพาะ Customer | 403 ไม่เกิด Ticket ใหม่ | API + Role |
| AC-21 / TEST-21 | Customer Join สำเร็จ แล้วสร้าง App Instance ใหม่พร้อม DB Pool ใหม่ต่อ DB เดิม (จำลอง Restart) | Ticket และ JOINED Event ที่สร้างไว้ก่อนหน้ายังอ่านได้ครบ (ticketNo/partySize/status ตรงเดิม) | API + DB (Restart Persistence) |
| AC-23 / TEST-23 | Customer เรียก GET /api/entries/:entryId และ POST /api/queues/:queueId/entries (partySize=4) ด้วย `not-a-uuid` หรือ UUID ที่ยืนยันว่าไม่มีใน DB; ทวนคำขอทั้งสองแบบโดยไม่มี Session | มี Session: UUID ผิดรูปแบบ → 400 VALIDATION_ERROR, UUID ถูกแต่ไม่มี Resource → 404 NOT_FOUND; ไม่มี Session → 401 UNAUTHENTICATED ก่อนตรวจ UUID; ทุกกรณีไม่เพิ่ม Entry/Event/Counter และไม่เปิดเผยข้อมูลส่วนตัว | API + DB Boundary |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Add AC-21/TEST-21 (restart persistence) to give NFR-02 a Sprint 1 test |
| v0.3 | 2026-11-06 | Extend TEST-07 for queue JSON/isAssigned/empty results; add AC-23/TEST-23 for UUID validation, missing resources and authentication precedence |
| v0.4 | 2026-11-28 | Lab 7 (L7-CR-01, BR-09): party size limit becomes per-queue. AC-07 adds `maxPartySize`; AC-12 revised (old: partySize=0,9,1.5/text with boundaries 1 and 8, fixed range 1–8); new AC-25/26/27. See `docs/labs/lab-07/` |
| v0.5 | 2026-11-28 | Lab 7 change request v0.2: add AC-26b for migration `006` (activation of the main queue limit on existing data). AC-26 is unchanged |
| v0.6 | 2026-11-28 | Review wording fix (PR #112): AC-26b states that a main queue at 8 is raised to 10 even when 8 was set deliberately, and that 4, 6, 9 and 10 stay. Old wording left a deliberate value alone |
