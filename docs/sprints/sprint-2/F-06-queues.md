# F-06 Multiple Queues, Host Assignment and Open/Close - Sprint 2 Contract

> **Status:** Draft v0.1 (2026-11-28) · CPE334 Theme 9 · DineQ · เชื่อมโยง FR-11, FR-12, BR-03, BR-07, BR-08, NFR-01, NFR-03, NFR-06

เป้าหมาย: ร้านมีหลายคิว (เช่น คิวหลักและเคาน์เตอร์บาร์) แต่ละคิวมีชื่อ เลขคิวของตนเอง และ Host ผู้รับผิดชอบ; Host ที่ Assigned เปิด/ปิดคิวของตนได้ คิวที่ปิดไม่รับ Join ใหม่แต่ยังให้บริการตั๋วเดิมจนจบ; API: `GET /api/queues` (เพิ่ม `name`), `PATCH /api/queues/:queueId`

## 1. ขอบเขตและการตัดสินใจ

| หัวข้อ | การตัดสินใจ | เหตุผล |
| :---- | :---- | :---- |
| การกำหนด Host ให้คิว (FR-11) | ทำผ่าน Seed/SQL (`queue_operator_assignments`) เท่านั้น ไม่มี API จัดการ Assignment | ระบบมีแค่ Role CUSTOMER/HOST ไม่มี Admin; เป็น Known Limitation |
| ตั้งค่าร้าน (FR-12) | ใน Sprint 2 หมายถึงการเปิด/ปิดคิวโดย Host ที่ Assigned เท่านั้น | ขอบเขตเล็กและทวนสอบได้ |
| API เปิด/ปิด | `PATCH /api/queues/:queueId` body `{ "status": "OPEN" \| "CLOSED" }`; ส่งสถานะเดิมซ้ำคืน 200 โดยไม่เปลี่ยนข้อมูล (Idempotent) | กดซ้ำหรือสองหน้าจอไม่ควรเกิด Error |
| ความหมายของ CLOSED | ห้าม Join ใหม่ (BR-07, `409 QUEUE_CLOSED`); Waiting List, Call Next, Complete ใช้งานต่อได้เพื่อเคลียร์ตั๋วเดิม; เปิดใหม่ได้ทุกเมื่อ และ `next_ticket_no` ต่อจากเดิม | ลูกค้าที่รอแล้วต้องไม่ถูกทิ้ง |
| ชื่อคิว | เพิ่ม `service_queues.name` (1–60 ตัวอักษร, ไม่ซ้ำภายในร้าน) และคืนใน Queue JSON | แยกสองคิวของร้านเดียวกันบนหน้าจอ |
| Audit | ไม่มี Event การเปิด/ปิดคิว (`queue_events` ผูกกับ Entry) | บันทึกเป็น Known Limitation; ไม่ขัด FR-16 ซึ่งกล่าวถึงเหตุการณ์ของ Ticket |
| Seed | คิวที่สอง `Bar counter` + `host3@dineq.test` ผูกกับคิวนั้น; `host1` ผูกคิวหลัก `Main queue`; `host2` ยังไม่ผูกคิวใด | คง "Unassigned Host" ที่ Sprint 1 ใช้ในหลายเทส |

นอกขอบเขต: API สร้าง/ลบคิว/แก้ชื่อ/จัดการ Assignment, Admin Role, Event การเปิด/ปิด, ตารางโต๊ะ (F-05), Customer มีตั๋ว Active มากกว่าหนึ่งใบในคิวเดียวกัน (BR-02 คงเดิม).

## 2. Workflow และ Transaction

State ของคิว: `OPEN ⇄ CLOSED` (ไม่ใช่ Terminal) เปลี่ยนโดย Host ที่ Assigned เท่านั้น

Set Status Transaction:

1. (นอก Transaction) Origin → Session → Role = HOST → รูปแบบ UUID → คิวมีอยู่ (`404`) → Assignment (`403`) → ตรวจ Body (`400 VALIDATION_ERROR` ถ้า `status` ไม่ใช่ `OPEN`/`CLOSED`)
2. `BEGIN`
3. `SELECT ... FROM service_queues WHERE id = $1 FOR UPDATE` (Lock เดียวกับ Join และ Call Next) แล้วตรวจ Assignment ซ้ำภายใต้ Lock
4. ถ้า `status` ตรงกับค่าที่ขออยู่แล้ว ไม่แก้ข้อมูล; ไม่เช่นนั้น `UPDATE service_queues SET status = $2`
5. `COMMIT` และคืน Queue JSON ของคิวนั้น (`isAssigned: true`)

เพราะ Join ล็อกแถวคิวเดียวกัน คำขอ Join ที่ Commit หลังการปิดจะเห็นสถานะ CLOSED และได้ `409 QUEUE_CLOSED` โดยไม่กินเลขคิว; Join ที่ Commit ก่อนการปิดยังถูกต้องตามปกติ

## 3. API

| Method | Endpoint | บทบาท | Request | Response |
| :---- | :---- | :---- | :---- | :---- |
| GET | `/api/queues` | Login แล้ว | - | `200 { data: [ { id, name, restaurant: { id, name }, status, isAssigned } ] }` เรียงตามชื่อร้าน ชื่อคิว แล้ว `id`; `401` |
| PATCH | `/api/queues/:queueId` | Host ที่ Assigned กับคิวนั้น | `{ "status": "OPEN" \| "CLOSED" }` (Field อื่นถูกละเว้น) | `200 { data: QueueItem }` (รูปแบบเดียวกับ List, `isAssigned: true`); `400 VALIDATION_ERROR`, `401`, `403 FORBIDDEN` / `ORIGIN_NOT_ALLOWED`, `404 NOT_FOUND` |

ไม่มี Error Code ใหม่. ลำดับตรวจตาม SDS C.6.3: Origin → Session `401` → Role `403` (Customer ได้ 403 ก่อนตรวจ UUID) → UUID `400` → คิวมีอยู่ `404` → Assignment `403` → Body `400`

Join (`POST /api/queues/:queueId/entries`), Waiting List, Call Next, Complete ไม่เปลี่ยน Contract; ผลของการปิดคิวต่อ Endpoint เหล่านั้นตรวจใน AC-49

## 4. ข้อมูล

Migration `database/migrations/005_queue_names.sql` (ทำใน Transaction เดียว):

| รายการ | รายละเอียด |
| :---- | :---- |
| คอลัมน์ | `service_queues.name text NOT NULL DEFAULT 'Main queue'` พร้อม CHECK ความยาว 1–60 หลังตัดช่องว่าง |
| Constraint | `UNIQUE (restaurant_id, name)` |
| ข้อมูลเดิม | คิวเดิมได้ชื่อ `Main queue` จากค่า Default; ตั๋ว Event Assignment ไม่เปลี่ยน |
| ตาราง/Index อื่น | ไม่เปลี่ยน |

Seed (`database/seed/seedData.js`, รันซ้ำปลอดภัย): `Main queue` (id เดิม `2222...`, อัปเดตชื่อเมื่อ Conflict), `Bar counter` (id คงที่ใหม่, OPEN), บัญชี `host3@dineq.test` (รหัสผ่านจาก `SEED_DEMO_PASSWORD`), Assignment `host1 → Main queue`, `host3 → Bar counter`

## 5. UI

| หน้าจอ | พฤติกรรม |
| :---- | :---- |
| `/queues` (ทุกบทบาท) | แสดงทุกคิวพร้อมชื่อร้าน + ชื่อคิว + สถานะ; Customer เห็นฟอร์ม Join ของแต่ละคิวและข้อความเมื่อ CLOSED; Host เห็นลิงก์เฉพาะคิวที่ Assigned |
| `/host/queues/:queueId` (Host ที่ Assigned) | แสดงชื่อคิวและสถานะ พร้อมปุ่ม "ปิดคิว" หรือ "เปิดคิว"; การปิดมีกล่องยืนยัน (อธิบายว่าตั๋วที่รออยู่ยังถูกเรียกได้); Loading ระหว่างเรียก API กันกดซ้ำ; แสดง Error ที่อ่านเข้าใจได้ |
| Host ที่ไม่ Assigned กับคิวใด | แสดงข้อความ "ไม่มีคิวที่ได้รับมอบหมาย" (ตามเดิม) |
| Customer มีตั๋วหลายคิว | `/my-queue` แสดงตั๋วของตนทุกใบพร้อมชื่อคิว |

## 6. สิทธิ์

| Operation | Customer | Host Assigned กับคิวนั้น | Host อื่น (รวมที่ไม่ Assigned) | ไม่ Login |
| :---- | :---- | :---- | :---- | :---- |
| ดูรายการคิว | ได้ | ได้ | ได้ | 401 |
| เปิด/ปิดคิว | 403 | ได้ | 403 | 401 |
| Join | ได้ (เมื่อ OPEN) | 403 | 403 | 401 |
| Waiting List / Call Next / Complete | 403 | ได้เฉพาะคิวของตน | 403 | 401 |

## 7. Acceptance Criteria และ Test Specification

เลข AC ของ F-06 คือ AC-46..51 (F-07 เริ่ม AC-52). ทุกแถวเป็น PLANNED จนกว่าจะมีผลรันจริงและ Commit SHA

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-46 / TEST-46 | Customer, `host1` (Main queue), `host3` (Bar counter) และ `host2` (ไม่ Assigned) เรียก `GET /api/queues` บน Seed | ทุกบทบาทได้ 2 คิว เรียงตามชื่อร้าน ชื่อคิว `id`; แต่ละรายการมี `id`, `name`, `restaurant`, `status`, `isAssigned`; `host1` ได้ `true` เฉพาะ Main queue, `host3` ได้ `true` เฉพาะ Bar counter, `host2` และ Customer ได้ `false` ทั้งสอง (เดิม AC-07/TEST-07 คาดว่ามีคิวเดียว) | API |
| AC-47 / TEST-47 | `host1` ส่ง `PATCH` `{ "status": "CLOSED" }` ที่ Main queue แล้ว GET List; ส่ง CLOSED ซ้ำ; ส่ง `{ "status": "OPEN" }`; ส่ง `PATCH` พร้อม `maxPartySize`/`nextTicketNo` ปนมา | 200 และคืน Queue JSON `isAssigned: true`; GET ซ้ำเห็นสถานะใหม่; ซ้ำสถานะเดิมได้ 200 และข้อมูลไม่เปลี่ยน; Field อื่นไม่มีผลต่อ DB; `next_ticket_no` ไม่เปลี่ยน; Bar counter ไม่ถูกกระทบ | API + DB |
| AC-48 / TEST-48 | Customer; `host2` (ไม่ Assigned); `host1` ปิด Bar counter (ของ `host3`); ไม่มี Session; Origin ไม่ตรง `APP_ORIGIN`; `not-a-uuid`; UUID ที่ไม่มีในระบบ; Body `{}`, `{ "status": "PAUSED" }`, `{ "status": 1 }`, ไม่ใช่ JSON Object | 403 `FORBIDDEN` (Customer ก่อนตรวจ UUID), 403 (Host ไม่ Assigned) และไม่เปิดเผยข้อมูลคิว, 401 `UNAUTHENTICATED`, 403 `ORIGIN_NOT_ALLOWED`, 400 `VALIDATION_ERROR`, 404 `NOT_FOUND` (ก่อน 403 Assignment), 400 `VALIDATION_ERROR` สำหรับ Body ผิด; ทุกกรณีสถานะคิวใน DB ไม่เปลี่ยน | API + Authorization |
| AC-49 / TEST-49 | ปิด Main queue ที่มีตั๋ว WAITING 1 และ 2; Customer ใหม่ Join; Host `host1` ดู Waiting List, Call Next, Complete; เปิดคิวอีกครั้งแล้ว Customer เดิม Join | Join ได้ 409 `QUEUE_CLOSED`, ไม่ Insert และ `next_ticket_no` ไม่เพิ่ม; Waiting List/Call Next/Complete ทำงานตามเดิม (FIFO เรียก 1 แล้ว 2); หลังเปิด Join สำเร็จด้วยเลขถัดไปต่อเนื่อง | API + DB |
| AC-50 / TEST-50 | (ก) Customer Join ทั้ง Main queue และ Bar counter; (ข) `host1` เรียก Waiting List/Call Next/Complete/GET entry ของ Bar counter; (ค) 20 Join พร้อมกันบน Main queue ระหว่างที่ `host1` ปิดคิว; (ง) 15 Customer ต่างบัญชี Join ทั้งสองคิวพร้อมกัน | (ก) ได้ตั๋วสองใบ เลขคิวนับแยกกันคิวละ 1 และไม่ติด `DUPLICATE_ACTIVE`; (ข) 403 ทุกกรณีและไม่มีข้อมูลคิวอื่นรั่ว; (ค) ทุก Join เป็น 201 (Commit ก่อนปิด) หรือ 409 `QUEUE_CLOSED` (หลังปิด); ไม่มีตั๋วถูกสร้างหลังการปิดสำเร็จ; เลขคิวของตั๋วที่สำเร็จเป็นเลขต่อเนื่องไม่ซ้ำ; (ง) เลขคิวไม่ซ้ำและต่อเนื่องในแต่ละคิว | API + DB + Concurrency |
| AC-51 / TEST-51 | รัน Migration 005 บน DB ที่มีคิวและตั๋วเดิมแล้วรันซ้ำและรัน Seed ซ้ำ; INSERT คิวชื่อซ้ำในร้านเดียวกัน, ชื่อว่าง, ชื่อยาว 61 ตัวอักษร; ปิดคิวแล้วสร้าง App Instance ใหม่พร้อม DB Pool ใหม่ต่อ DB เดิม | คิวเดิมได้ชื่อ `Main queue` ตั๋ว/Event/เลขคิวเดิมไม่เปลี่ยน; Migration/Seed ซ้ำไม่ล้มและไม่เปลี่ยนข้อมูลเดิม; มี Bar counter และ `host3` ผูกถูกคิว; DB ปฏิเสธชื่อซ้ำ (23505) ว่าง/ยาวเกิน (23514); สถานะ CLOSED ยังอยู่หลัง Restart | DB Constraint + Migration + Restart Persistence |

เทส Sprint 1 ที่ต้องแก้ตาม Contract นี้ (แก้ในขั้น RED พร้อมเหตุผล ไม่ลด Assertion): TEST-07 (`GET /api/queues` บน Seed ได้ 2 รายการและมี `name`; Test "CLOSED queue is listed" ต้องระบุคิวที่ปิดจาก `id` ในรายการสองคิว), INFRA-06 (Host ใน Seed เป็น `host1`, `host2`, `host3`; Assignment ของ Main queue ยังเป็น `host1` เท่านั้น). เทสอื่นที่ใช้ `seedIds.queue` และ `host2` เป็น Unassigned Host ต้องผ่านโดยไม่แก้

ชั้นที่ไม่ต้องแก้: Authentication/Session, Origin Check, Join/Call Next/Complete Service (เว้นแต่ชื่อใน Queue JSON), Ticket JSON, F-04 ตรรกะ Cancel

## 8. Definition of Done

- Contract นี้ถูก Review และ Merge ก่อนเริ่มเขียนเทส
- เขียนเทส TEST-46..51 และแก้ TEST-07/INFRA-06 ตามที่ระบุก่อน Implement; รัน RED ล้มด้วยเหตุผลที่ตั้งใจ; Commit เทสและผลรันแยกกัน
- Implement Migration 005, Seed, `PATCH` Route/Service, Queue JSON `name` และ UI; รัน GREEN และ Regression ทั้งชุด (รวม TEST-10) ผ่าน
- Playwright อย่างน้อยหนึ่ง Journey: Host ปิดคิว → Customer เห็นปิดและ Join ไม่ได้ → Host เปิด → Customer Join ได้
- `docs/traceability.md` เปลี่ยน PLANNED เป็น PASS เฉพาะเมื่อมีผลรันจริงและ Commit SHA
- Known Limitations ถูกบันทึก: ไม่มี API จัดการ Assignment/สร้างคิว, ไม่มี Event เปิด/ปิด
- แถวใหม่ใน `docs/ai-use-log.md`; ไม่มี Secret ใน Repo

## 9. Dependencies และข้อสังเกต

- ขึ้นกับ Sprint 1 baseline; ลำดับ Migration: 002 (Lab 7) → 003 (F-04) → 004 (F-05) → 005 (F-06)
- Seed ถูกแก้ทั้ง Lab 7 (`max_party_size`) และ F-06 (คิว/Host) ให้ Merge Lab 7 ก่อน แล้วค่อยรวม F-06
- Queue JSON ของ Lab 7 (`maxPartySize`) และ F-06 (`name`) เป็น Field เพิ่ม ไม่ขัดกัน
- เนื้อหาใน F-02/SDS สำหรับ `name`, `PATCH`, Seed และ Role/Permission จะถูกรวมใน PR สรุป Contract (S3-C) เพื่อลดการชนกันของไฟล์ระหว่าง Branch ขนาน

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-28 | Initial draft, committed before tests and implementation |
