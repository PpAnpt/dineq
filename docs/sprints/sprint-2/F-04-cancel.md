# F-04 Customer Cancel Ticket - Sprint 2 Contract

> **Status:** Draft v0.5 (2026-11-28) · CPE334 Theme 9 · DineQ · เชื่อมโยง FR-08, FR-16, BR-02, BR-04, BR-10, BR-12, NFR-01, NFR-02, NFR-06

เป้าหมาย: Customer ยกเลิกคิวของตนเองที่ยังเป็น WAITING ได้ โดยระบบบันทึกประวัติ (Event) ใน Transaction เดียวกัน ไม่ทำให้เลขคิวของคนอื่นเปลี่ยน และปลดกฎ "หนึ่ง Active Ticket ต่อคิว" ให้กลับมา Join ใหม่ได้; API: `POST /api/entries/:entryId/cancel`

## 1. ขอบเขตและการตัดสินใจ

| หัวข้อ | การตัดสินใจ | เหตุผล |
| :---- | :---- | :---- |
| สถานะที่ยกเลิกได้ | เฉพาะ `WAITING` → `CANCELLED` | `CALLED` อยู่ในมือ Host; ลูกค้าที่ถูกเรียกแล้วไม่มา ใช้ No-show ของ F-05 (`CALLED → NO_SHOW`). การไม่เปิด `CALLED` ตัดเคสแข่งกับ Complete/No-show ออก (BR-10) |
| เวลาที่ยกเลิก | อ่านจาก `queue_events.occurred_at` ของ Event `CANCELLED`; ไม่เพิ่มคอลัมน์ใน `queue_entries` | Ticket JSON ไม่เปลี่ยน ลด Test และ Migration |
| เลขคิว | ไม่ Reuse ไม่ Renumber; เกิดช่องว่างได้ | BR-01/NFR-03 และ FIFO ตาม ticketNo (BR-04) |
| Active rule | `CANCELLED` ไม่ถูกนับเป็น Active (partial unique index ครอบเฉพาะ WAITING/CALLED) จึง Join ใหม่ได้ด้วยเลขใหม่ | BR-02 |
| Error code | ไม่เพิ่ม Code ใหม่; ใช้ `INVALID_TRANSITION` เมื่อสถานะไม่ใช่ WAITING | ใช้ Catalog เดิม (SDS C.6.2) |
| Migration | `003` ขยาย CHECK ของ status และ event ให้รองรับ `CANCELLED` และ `NO_SHOW` พร้อมกัน; `NO_SHOW` เป็น schema-only ใน F-04 (ไม่มี API/พฤติกรรม ไว้ให้ F-05 ใช้โดยไม่แก้ Constraint ชุดเดิมซ้ำ) | ลดการชนกันของ Migration ระหว่าง F-04/F-05 |

นอกขอบเขต: Host ยกเลิกแทนลูกค้า, ยกเลิกใบ CALLED, ยกเลิกหลายใบพร้อมกัน, เหตุผลการยกเลิก, การคืนเลขคิว, Notification.

## 2. Workflow และ Transaction

State: `WAITING → CANCELLED` (Terminal) เป็นการเปลี่ยนใหม่เพียงอย่างเดียวของ F-04

Cancel Transaction (ลำดับล็อกตรงกับ Call Next: Queue ก่อน แล้วจึง Entry เพื่อไม่ให้เกิด Deadlock):

1. (นอก Transaction) ตรวจ Origin → Session → Role = CUSTOMER → รูปแบบ UUID → อ่าน Entry (`404 NOT_FOUND` ถ้าไม่มี) → เจ้าของ Ticket (`403 FORBIDDEN` ถ้าไม่ใช่)
2. `BEGIN`
3. `SELECT ... FROM service_queues WHERE id = <entry.queue_id> FOR UPDATE`
4. `SELECT * FROM queue_entries WHERE id = $1 FOR UPDATE` แล้วตรวจซ้ำภายใต้ Lock ว่ายังเป็นเจ้าของ และ `status = 'WAITING'` (ไม่ใช่ → `409 INVALID_TRANSITION`)
5. `UPDATE queue_entries SET status = 'CANCELLED'` (`called_at`, `completed_at` ยังเป็น `NULL`)
6. `INSERT INTO queue_events (entry_id, actor_id, event_type, from_status, to_status) VALUES (entry, <session user>, 'CANCELLED', 'WAITING', 'CANCELLED')`
7. `COMMIT`; ถ้าขั้นใดล้มเหลว `ROLLBACK` ทั้งหมด (Entry ยังเป็น WAITING และไม่มี Event) ตาม BR-12

`actor_id` และเจ้าของ Ticket มาจาก Session เท่านั้น ไม่รับจาก Client

## 3. API

| Method | Endpoint | บทบาท | Request | Response |
| :---- | :---- | :---- | :---- | :---- |
| POST | `/api/entries/:entryId/cancel` | Customer เจ้าของ Ticket | ไม่มี Body (Body ที่ส่งมาถูกละเว้น; `status`, `customerId`, `ticketNo` จาก Client ไม่มีผล) | `200 { data: Ticket }` โดย `status = "CANCELLED"`; `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN` / `ORIGIN_NOT_ALLOWED`, `404 NOT_FOUND`, `409 INVALID_TRANSITION` |

Ticket JSON ตาม SDS C.6.1 ไม่เปลี่ยนรูปแบบ (`id`, `queueId`, `ticketNo`, `partySize`, `status`, `createdAt`, `calledAt`, `completedAt`); `status` เพิ่มค่า `CANCELLED`

ลำดับตรวจ (SDS C.6.3): Origin → Session `401` → Role `403` (Host ได้ 403 ก่อนตรวจ UUID) → UUID `400` → Entry มีอยู่ `404` → เจ้าของ `403` → สถานะ `409`

พฤติกรรมของ Endpoint เดิมหลัง F-04: `GET /api/me/entries` และ `GET /api/entries/:entryId` คืนใบ `CANCELLED` ของเจ้าของได้ตามปกติ; Waiting List (`GET /api/queues/:queueId/entries`) แสดงเฉพาะ WAITING/CALLED จึงไม่แสดงใบที่ยกเลิก; Call Next เลือกเฉพาะ WAITING จึงข้ามใบที่ยกเลิก

## 4. ข้อมูล

Migration `database/migrations/003_cancel_and_no_show_status.sql` (ทำใน Transaction เดียว; ชื่อ Constraint อัตโนมัติของ CHECK แบบ Inline ต้องยืนยันจาก `pg_constraint` ก่อนเขียน):

| รายการ | ก่อน (001) | หลัง (003) |
| :---- | :---- | :---- |
| `queue_entries.status` CHECK | WAITING, CALLED, COMPLETED | + CANCELLED, NO_SHOW |
| `queue_entries_status_timestamps_check` | 3 สถานะ | CANCELLED: `called_at` และ `completed_at` เป็น NULL; NO_SHOW: `called_at` NOT NULL, `completed_at` NULL |
| `queue_events.event_type`, `from_status`, `to_status` CHECK | JOINED, CALLED, COMPLETED | + CANCELLED, NO_SHOW |
| `queue_events_transition_check` | 3 Event | + `CANCELLED` ต้อง `from_status = 'WAITING'` และ `to_status = 'CANCELLED'`; + `NO_SHOW` ต้อง `from_status = 'CALLED'` และ `to_status = 'NO_SHOW'` (schema-only) |
| Partial unique indexes | `queue_entries_one_active_customer` (WAITING/CALLED), `queue_entries_one_called` (CALLED) | ไม่เปลี่ยน |
| ตาราง/คอลัมน์ใหม่ | - | ไม่มี |

Seed: ไม่เปลี่ยน. ข้อมูลเดิม (WAITING/CALLED/COMPLETED) ผ่าน CHECK ที่ขยายโดยไม่ต้อง Backfill

## 5. UI

หน้า `/my-queue` (Customer):

| สถานะหน้าจอ | พฤติกรรม |
| :---- | :---- |
| Ticket เป็น WAITING | แสดงปุ่ม "ยกเลิกคิว" (เป็น `button`, เข้าถึงด้วย Keyboard ได้) |
| กดปุ่ม | เปิดกล่องยืนยัน ("ยกเลิกคิวหมายเลข N?") พร้อมปุ่ม ยืนยัน/ไม่ยกเลิก; ไม่เรียก API จนกว่าจะยืนยัน |
| ระหว่างเรียก API | Loading, ปุ่มถูกปิดกันกดซ้ำ |
| สำเร็จ | แสดงสถานะ CANCELLED พร้อมข้อความและลิงก์กลับไปหน้ารับคิว; ไม่แสดงปุ่มยกเลิก |
| `409 INVALID_TRANSITION` | แสดงข้อความว่าสถานะคิวเปลี่ยนไปแล้วและโหลดสถานะล่าสุด (เช่น ถูกเรียกไปแล้ว) |
| `401` / `403` / ข้อผิดพลาดอื่น | แสดง Error ที่อ่านเข้าใจได้ ไม่เปิดเผยข้อมูลส่วนตัว |
| Ticket เป็น CALLED / COMPLETED / CANCELLED | ไม่แสดงปุ่มยกเลิก |

## 6. สิทธิ์

| Operation | Customer เจ้าของ | Customer อื่น | Host (ทุกคน) | ไม่ Login |
| :---- | :---- | :---- | :---- | :---- |
| Cancel Ticket | ได้ (เฉพาะ WAITING) | 403 | 403 | 401 |

## 7. Acceptance Criteria และ Test Specification

ลำดับเลข AC ต่อจาก Lab 7 (AC-25..27). Test ID = AC ID; ทุกแถวเป็น PLANNED จนกว่าจะมีผลรันจริงและ Commit SHA

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-28 / TEST-28 | Customer เจ้าของ Ticket WAITING เรียก `POST /api/entries/:entryId/cancel` แล้ว GET Ticket ซ้ำ และ GET `/api/me/entries`; ส่ง Body ที่มี `status: "CALLED"`, `customerId` ของผู้อื่น | 200 `status = CANCELLED`, `calledAt`/`completedAt` เป็น null, `ticketNo`/`partySize` เดิม; GET ซ้ำได้ CANCELLED; ค่าจาก Body ไม่มีผล; มี Event `CANCELLED` (WAITING → CANCELLED, `actor_id` = Customer) หนึ่งแถว | API + DB |
| AC-29 / TEST-29 | ยกเลิกโดยบังคับให้การเขียน Event ล้มเหลว (fault injection ในเทสเท่านั้น เช่น ชั่วคราวทำให้ INSERT ลง `queue_events` ผิดพลาด) | Request ล้มเหลว (5xx ที่ไม่รั่วรายละเอียด DB); Entry ยังเป็น WAITING, `queue_events` ไม่มีแถว CANCELLED (BR-12) | API + DB (Atomicity) |
| AC-30 / TEST-30 | ไม่มี Session; Host ที่ Assigned และ Host ที่ไม่ Assigned; Customer B ยกเลิก Ticket ของ Customer A; คำขอที่มี Origin ไม่ตรง `APP_ORIGIN` | 401 `UNAUTHENTICATED`; 403 `FORBIDDEN` (Host ทั้งสองแบบ ก่อนตรวจ UUID/Resource); 403 `FORBIDDEN` (Customer B) โดย Response ไม่มีข้อมูลของ A; 403 `ORIGIN_NOT_ALLOWED`; ทุกกรณี Ticket ของ A ยัง WAITING และไม่มี Event ใหม่ | API + Authorization |
| AC-31 / TEST-31 | Customer ใช้ `not-a-uuid` และ UUID ถูกรูปแบบที่ไม่มีใน DB; ทวนทั้งสองแบบโดยไม่มี Session และโดย Host | Customer: 400 `VALIDATION_ERROR` และ 404 `NOT_FOUND`; ไม่มี Session: 401 ก่อนตรวจ UUID; Host: 403 ก่อนตรวจ UUID; ไม่มีการเปลี่ยนแปลงใน DB | API + DB Boundary |
| AC-32 / TEST-32 | Customer เจ้าของยกเลิก Ticket ที่เป็น CALLED, COMPLETED และ CANCELLED แล้ว (ยกเลิกซ้ำ) | 409 `INVALID_TRANSITION` ทุกกรณี; Row และ Event ไม่เปลี่ยน | API + DB Boundary |
| AC-33 / TEST-33 | คิวมี WAITING หมายเลข 1, 2, 3 (ต่างลูกค้า); ลูกค้าหมายเลข 2 ยกเลิก; ลูกค้านั้น Join ใหม่; Host ดู Waiting List, กด Call Next (ได้หมายเลข 1), กด Call Next ซ้ำทันที (ต้องถูกปฏิเสธเพราะยังมี CALLED ค้าง), Complete หมายเลข 1 แล้วตรวจว่าเสร็จ, จากนั้นกด Call Next อีกครั้ง | ลูกค้า 2 Join ใหม่ได้ (ไม่ติด `DUPLICATE_ACTIVE`) ด้วย ticketNo ใหม่ = 4 (ไม่ Reuse เลข 2); หมายเลข 1 และ 3 ไม่เปลี่ยน; Waiting List ไม่มีใบ CANCELLED; Call Next ครั้งแรกเรียกหมายเลข 1; ครั้งที่สองก่อน Complete ได้ 409 `UNRESOLVED_CALLED` (BR-05/TEST-16 ไม่เปลี่ยน และเทสนี้ห้ามผ่อนกฎดังกล่าว); หลัง Complete หมายเลข 1 เป็น COMPLETED แล้ว Call Next เรียกหมายเลข 3 ตาม FIFO (ข้าม 2 ที่ยกเลิก) | API + DB |
| AC-34 / TEST-34 | (ก) ลูกค้าหมายเลข 1 ยกเลิกพร้อมกับ Host Call Next บนคิวที่มี WAITING 1 และ 2; (ข) Customer เดียวกันยกเลิกใบเดียวพร้อมกัน 10 คำขอ | (ก) ผลลัพธ์ที่เป็นไปได้มีเพียงสองแบบและต้องสอดคล้องกับ DB: ยกเลิกสำเร็จแล้ว Call Next ได้หมายเลข 2, หรือ Call Next ได้หมายเลข 1 แล้วยกเลิกได้ 409; ไม่มีใบที่มีทั้ง CANCELLED และ CALLED; (ข) สำเร็จ 1 ครั้ง (200) ที่เหลือ 409; มี Event CANCELLED เพียงแถวเดียว | Concurrency + DB |
| AC-35 / TEST-35 | (ก) INSERT/UPDATE ตรงใน DB: Entry สถานะ CANCELLED พร้อม/ไม่พร้อม `called_at`/`completed_at`; Event CANCELLED/NO_SHOW ที่ `from_status` เป็น NULL หรือไม่ใช่ WAITING/CALLED ตามลำดับ; รันไฟล์ Migration ซ้ำ; (ข) ยกเลิกสำเร็จแล้วสร้าง App Instance ใหม่พร้อม DB Pool ใหม่ต่อ DB เดิม | (ก) DB รับ CANCELLED เมื่อ `called_at`/`completed_at` เป็น NULL และปฏิเสธเมื่อมีค่า (23514); ปฏิเสธ Event CANCELLED ที่ผิด `from_status`; Migration ซ้ำไม่เปลี่ยนข้อมูลเดิมและไม่ล้ม; ข้อมูลเดิมก่อน Migration ยังอ่านได้เหมือนเดิม; (ข) Ticket CANCELLED และ Event ยังอ่านได้ครบ | DB Constraint + Restart Persistence |

ชั้นที่ไม่ต้องแก้: Authentication/Session, Login/Logout, Origin Check (ใช้ Middleware เดิม), Join (ยกเว้นผลที่ AC-33 ตรวจ), Complete, Waiting List query (กรองสถานะอยู่แล้ว), Seed

## 8. Definition of Done

- Contract นี้ถูก Review และ Merge ก่อนเริ่มเขียนเทส
- เขียนเทส TEST-28..35 ตามตารางก่อน Implement; รัน RED แล้วล้มด้วยเหตุผลที่ตั้งใจ (ยังไม่มี Endpoint/สถานะ); Commit เทสและบันทึกผลรันแยก Commit
- Implement Migration 003, Service/Route และ UI; รัน GREEN ผ่าน และรัน Regression ทั้งชุด (รวม TEST-10 Concurrency) ผ่าน
- Playwright อย่างน้อยหนึ่ง Journey: Customer Join → ยกเลิกพร้อมยืนยัน → เห็น CANCELLED → Join ใหม่
- `docs/traceability.md` เปลี่ยน PLANNED เป็น PASS เฉพาะเมื่อมีผลรันจริงและ Commit SHA
- ไม่มี Secret ใน Repo; แถวใหม่ใน `docs/ai-use-log.md`

## 9. Dependencies และข้อสังเกต

- ขึ้นกับ: Sprint 1 baseline (F-02, F-03) และ Contract นี้; ไม่ขึ้นกับ F-05/F-06 แต่ใช้ Migration 003 ร่วมกับ F-05 (ค่า NO_SHOW)
- Lab 7 (Migration 002, AC-25..27) เป็นอิสระต่อกัน ลำดับ Migration คือ 002 → 003
- F-07a (ตัวกรองประวัติ) ใช้สถานะ CANCELLED ที่ Contract นี้เพิ่ม

## 9. Execution Results (2026-11-28)

Recorded at commit `0805dca9a4c4eb35613b05296819a23f518e91fe` on branch `feature/f-04-cancel` (local PostgreSQL test database; not merged, not deployed). RED: [f04-red](../../evidence/f04-red.txt), 15 failed / 155 passed / 0 skipped of 170 on unmodified application code (missing endpoint, CANCELLED/NO_SHOW checks and migration 003). GREEN: [f04-green](../../evidence/f04-green.txt), 170 passed / 0 failed / 0 skipped; Playwright [f04-e2e-green](../../evidence/f04-e2e-green.txt), 7 passed (E2E-7 was written first and failed without the UI).

| AC / Test | Actual file | Result |
| --- | --- | --- |
| AC-28 / TEST-28 | `server/tests/f04-cancel.test.js` | PASS |
| AC-29 / TEST-29 | `server/tests/f04-cancel.test.js` | PASS (fault injected by a temporary trigger) |
| AC-30 / TEST-30 | `server/tests/f04-cancel.test.js` | PASS |
| AC-31 / TEST-31 | `server/tests/f04-cancel.test.js` | PASS |
| AC-32 / TEST-32 | `server/tests/f04-cancel.test.js` | PASS (CALLED, COMPLETED, double cancel) |
| AC-33 / TEST-33 | `server/tests/f04-cancel.test.js`; E2E-7 | PASS |
| AC-34 / TEST-34 | `server/tests/f04-cancel.test.js` | PASS (10 rounds of cancel vs Call Next, 10 parallel cancels) |
| AC-35 / TEST-35 | `server/tests/f04-cancel.test.js` | PASS (constraints, upgrade fixture for 003, restart) |

Review fix (PR #106, P2, NULL from_status): [f04-fix-red](../../evidence/f04-fix-red.txt) 2 failed / 170 passed / 0 skipped of 172 in a freshly created schema before the migration change, then [f04-fix-green](../../evidence/f04-fix-green.txt) 172 passed / 0 failed / 0 skipped and [f04-fix-e2e-green](../../evidence/f04-fix-e2e-green.txt) 7 passed at `af2b247b0a16ddf27cdf4e401a2e0a8b7ef543d8`. These runs supersede the counts above (170) as the latest; the earlier runs stay as recorded history.

Not covered by these runs: manual keyboard audit of the confirmation (AC-74 stays PLANNED) and any deployed-environment check.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft, committed before tests and implementation |
| v0.2 | 2026-11-28 | Address PR #99 review: AC-33 now completes ticket 1 between the two Call Next requests and asserts the 409 `UNRESOLVED_CALLED` guard in between (old wording: two consecutive Call Next calls returning 1 then 3) |
| v0.3 | 2026-11-28 | Add execution results for AC-28..35 from f04-red, f04-green and f04-e2e-green at `0805dca`; contract text unchanged |
| v0.4 | 2026-11-28 | PR #106 review: the event transition CHECK must state `from_status IS NOT NULL` for CANCELLED and NO_SHOW (a NULL from_status otherwise passes); AC-35 now also covers NULL from_status. Contract intent unchanged (CANCELLED only from WAITING, NO_SHOW only from CALLED) |
| v0.5 | 2026-11-28 | Record the review-fix RED/GREEN runs (f04-fix-red, f04-fix-green, f04-fix-e2e-green) at `af2b247` |
