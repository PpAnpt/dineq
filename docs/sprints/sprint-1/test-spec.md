# Sprint 1 Software Test Specification (STS)

> **Status:** Draft v0.3 (2026-11-06) · CPE334 Theme 9 · DineQ

รวม AC/TEST ของ F-01..F-03 และ Definition of Done; รายละเอียด flow อยู่ในไฟล์ contract แต่ละฟีเจอร์ สถานะทุกรายการเป็น PLANNED จนกว่าจะมีหลักฐานการรันจริง

## F-01 Authentication & Role Protection

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-01 / TEST-01 | Customer/Host ที่ Seed ไว้ Login ด้วยรหัสถูกต้อง โดยไม่ส่ง Session Cookie | 200, Session Cookie, Role จาก Server ถูกต้อง; Public Login ไม่ถูก Session Guard ปฏิเสธ | API Integration |
| AC-02 / TEST-02 | Email/Password ไม่ถูกต้อง | 401 ไม่มี Session ใช้งานได้ | API Integration |
| AC-03 / TEST-03 | Login แล้ว GET /auth/me และทดสอบ Session Expire | User ตรง; Expire แล้วคืน 401 | API Integration |
| AC-04 / TEST-04 | Logout แล้วใช้ Cookie เดิมเรียก /auth/me | 401 และ Session ถูกเพิกถอน | API Integration |
| AC-05 / TEST-05 | ไม่ Login แล้วเรียก Endpoint ที่ Protected รวมกรณี Path UUID ผิดรูปแบบ | 401 UNAUTHENTICATED ก่อนตรวจ UUID ไม่มีข้อมูลส่วนตัวรั่วไหล | API Integration |
| AC-06 / TEST-06 | Customer เรียก Host-Only Endpoint | 403 ไม่มีการเปลี่ยน DB | API Integration |
| AC-22 / TEST-22 | Request ที่เปลี่ยนข้อมูล (POST) ส่ง Header Origin ที่ไม่ตรง APP_ORIGIN | 403 ORIGIN_NOT_ALLOWED ไม่มีการเปลี่ยน DB | API Integration |

## F-02 Customer Walk-in Ticket Joining

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

## F-03 Host FIFO Calling & Complete Seating

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-14 / TEST-14 | Assigned Host GET Waiting List; Unassigned Host ลองเช่นกัน | Assigned ได้เรียง FIFO + partySize; Unassigned 403 | API Integration |
| AC-15 / TEST-15 | มี WAITING ticketNo 1/2; Host กด Call Next | ticketNo 1 → CALLED พร้อม Timestamp/Event; No.2 ยัง WAITING | API + DB |
| AC-16 / TEST-16 | มี CALLED ค้างอยู่ แล้วกด Call Next ซ้ำ | 409 UNRESOLVED_CALLED ไม่มีใบใหม่เป็น CALLED | API + DB |
| AC-17 / TEST-17 | Host Complete Ticket ที่ CALLED และ Customer GET อีกครั้ง | COMPLETED + completed_at/Event อยู่ DB และอ่านได้จริง | API + DB |
| AC-18 / TEST-18 | ลอง Complete Ticket ที่ WAITING หรือ COMPLETED | 409 INVALID_TRANSITION; Row/Event ไม่เปลี่ยน | API + DB Boundary |
| AC-19 / TEST-19 | Host ที่ไม่ Assigned ลองดู/เรียก/Complete Queue อื่น | 403 ไม่เปิดข้อมูลและไม่แก้ DB | API + Authorization |
| AC-20 / TEST-20 | Customer ลอง Call Next/Complete | 403 ไม่มีข้อมูลสถานะเปลี่ยน | API + Authorization |
| AC-24 / TEST-24 | Host เรียก List/Call Next/Complete ด้วย UUID ผิดรูปแบบหรือ UUID ที่ไม่มี Resource; Assigned Host Call Next ในคิวที่ไม่มี WAITING/CALLED; ทวน Path ที่ผิด/ไม่มี Resource ด้วย Anonymous และ Customer | Host: UUID ผิด → 400 VALIDATION_ERROR, Resource ไม่มี → 404 NOT_FOUND; Assigned Host บนคิวว่าง → 404 NO_WAITING_ENTRY; Anonymous → 401 UNAUTHENTICATED, Customer → 403 FORBIDDEN ก่อนตรวจ UUID; Row/Event/Counter ไม่เปลี่ยนและไม่เปิดเผยข้อมูลส่วนตัว | API + DB Boundary / Authorization |

รายละเอียด TEST-24 (ทุกกรณีใช้ Error Shape จาก SDS C.6.2 และเทียบ DB ก่อน/หลัง):

| Subcase | Preconditions / Action | Expected Result |
| :---- | :---- | :---- |
| TEST-24a | Seed Queue ที่มีอยู่จริงและ Host ที่ Assigned; ไม่มี WAITING หรือ CALLED แล้ว POST /api/queues/:queueId/call-next | 404 NO_WAITING_ENTRY |
| TEST-24b | Login เป็น Host; ใช้ UUID ที่ถูกต้องและยืนยันว่าไม่มี Queue/Entry ใน DB กับ GET /api/queues/:queueId/entries, POST /api/queues/:queueId/call-next และ POST /api/entries/:entryId/complete | ทั้งสามคำขอคืน 404 NOT_FOUND ไม่คืน 403 จากการหา Assignment ไม่พบ |
| TEST-24c | Login เป็น Host; ใช้ `not-a-uuid` กับทั้งสาม Endpoint ใน TEST-24b | ทั้งสามคำขอคืน 400 VALIDATION_ERROR ไม่เกิด DB Cast Error |
| TEST-24d | ทวนทั้งสาม Endpoint ด้วย Path จาก TEST-24b/c โดยไม่ Login และโดย Login เป็น Customer | Anonymous ได้ 401 UNAUTHENTICATED; Customer ได้ 403 FORBIDDEN ก่อนตรวจ UUID/Resource |

ถ้ามี CALLED ค้างอยู่แม้ไม่มี WAITING ให้ใช้ AC-16/TEST-16 (`409 UNRESOLVED_CALLED`) ไม่ใช่ TEST-24a

## Definition of Done

| DoD ID | Definition of Done — เงื่อนไขที่ต้องตรวจ | สถานะ |
| :---- | :---- | :---- |
| DoD-01 | UI → API → PostgreSQL ครบ Normal Flow Customer/Host และ Restart แล้วยังอ่านข้อมูลได้ | [เติมหลังทำ] |
| DoD-02 | Specification, Contract, AC, STS Commit ก่อน Implement และเก็บ Revision History | [เติม SHA] |
| DoD-03 | Unit / Integration / E2E Tests ที่เหมาะสมรันจริง ครอบคลุม Negative/Boundary/Role/DB | [เติมผลจริง] |
| DoD-04 | มีหลักฐาน TDD Red→Green อย่างน้อยหนึ่งกฎสำคัญ เช่นคิวซ้ำหรือ FIFO | [เติม SHA/Output] |
| DoD-05 | ทั้งสองคนมี Issue, Code/Test, Peer Review และร่วม Integration | [เติม PR/Comment] |
| DoD-06 | Feature PR เข้า Sprint Staging ผ่าน Review และ Release PR เข้า main ผ่าน Integration | [เติมหลักฐาน] |
| DoD-07 | สร้าง Tag/Commit ของ Release และ README/Migration/Seed/.env.example รันซ้ำได้ | [เติม Release] |
| DoD-08 | แจ้ง Failed/Skipped Tests, Known Defects, AI-use, ข้อจำกัดอย่างตรงไปตรงมา | [เติมรายการ] |


ตัวอย่าง TDD สำหรับ BR-02: เขียน TEST-09 ให้ Fail เมื่อสร้าง Active Queue ซ้ำได้ → Commit Test/ผล Red → Implement Transaction + DB Unique → Test เดิม Pass + ตรวจ DB → Commit Green และเปิด PR Review ห้ามสร้างหลักฐานย้อนหลังหรือแก้ Assertion ให้ผ่านแบบผิดกฎ

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Add AC-21/TEST-21 (restart persistence) and AC-22/TEST-22 (Origin check); keep in sync with F-01/F-02 contracts |
| v0.3 | 2026-11-06 | Sync reviewed contracts: public-login/auth precedence, queue JSON/isAssigned, new AC-23/24 with explicit 400/401/403/404 cases; all tests remain PLANNED |
