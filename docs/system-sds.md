# PART C — System-Level Software Design Specification (SDS) | 15 คะแนน

> **Status:** Draft v0.3 (2026-11-06) · CPE334 Theme 9 · DineQ

## C.1 Architecture และ Stack

เลือก Modular Monolith 3 ชั้น: React + Vite (Frontend) → Node.js + Express REST API (Backend) → PostgreSQL (Persistent Database); ผู้ใช้โต้ตอบกับ UI, API ตรวจ Session/Role/Ownership/Business Rules แล้วจึงอ่าน–เขียน DB โดยใช้ Transaction

เหตุผล: React จัดหน้า Customer/Host ได้เร็ว, Express รองรับ API/Middleware และ PostgreSQL มี Row-Level Lock, Transaction, Unique Index สำหรับออกหมายเลขคิวและป้องกันคิวซ้ำจริง ไม่ต้องใช้ Microservices

แผน Deployment: เพิ่ม Docker, CI/CD และ GCP ใน Lab 5; Deliverable 1 ต้อง Run ในเครื่องได้ พร้อม README, Migration, Seed และ .env.example แต่ยังไม่บังคับ Deploy Cloud

## C.2 ฐานข้อมูลหลักและข้อกำหนด (Data Model)

| Table | Fields ที่สำคัญ | Relationship/Constraint | Sprint |
| :---- | :---- | :---- | :---- |
| users | id, email, password_hash, role CUSTOMER/HOST, is_active, created_at | email UNIQUE; Password Argon2id | 1 |
| sessions | id, user_id, token_hash, expires_at, revoked_at | FK users; token_hash UNIQUE | 1 |
| restaurants | id, name, status, created_at | สาขาร้านอาหาร หนึ่งสาขา Seed | 1 |
| service_queues | id, restaurant_id, status OPEN/CLOSED, next_ticket_no, max_party_size (v0.4) | FK restaurants; next_ticket_no ≥ 1; max_party_size 1–10 DEFAULT 8 | 1; คอลัมน์ max_party_size ใน Lab 7 (Migration 002) |
| queue_operator_assignments | queue_id, host_user_id | PK (queue_id,host_user_id); ตรวจ Host role ที่ API | 1 |
| queue_entries | id, queue_id, customer_id, ticket_no, party_size, status, created_at, called_at, completed_at, table_id (S2 nullable, COMPLETED only) | UNIQUE ticket; partial unique Active; party_size 1–10 (v0.4; เพดานสัมบูรณ์ของ DB, ขีดจำกัดจริงต่อคิวตรวจโดย Backend ภายใต้ Lock) | 1 |
| dining_tables | id, queue_id, label, capacity 1..10, status AVAILABLE/OCCUPIED, occupied_entry_id nullable | Unique queue label/current occupant; same-queue composite FKs with queue_entries; see C.9 | 2 |
| queue_events | id, entry_id, actor_id, event_type, from_status, to_status, occurred_at | FK entry/user; เขียน Atomic กับ Transition | 1 |


ความสัมพันธ์: users 1:N sessions, users 1:N queue_entries (Customer), restaurants 1:N service_queues, service_queues 1:N queue_entries, queue_entries 1:N queue_events และ users (Operator) N:M service_queues ผ่าน queue_operator_assignments

Database Constraints: UNIQUE(queue_id,ticket_no); UNIQUE แบบ Partial สำหรับ (queue_id,customer_id) เฉพาะ WAITING/CALLED; UNIQUE แบบ Partial สำหรับ queue_id ที่มี CALLED; CHECK party_size BETWEEN 1 AND 10; CHECK timestamps/สถานะ; Foreign Key ตามความสัมพันธ์; ไม่ปล่อยให้ Browser เป็นผู้กำหนด Customer ID หรือ Ticket Number

ชนิดข้อมูลมาตรฐาน: Primary Key ของทุกตารางที่มี `id` เป็น UUID (`gen_random_uuid()`); `ticket_no` และ `next_ticket_no` เป็น integer; ทุก Timestamp เป็น `timestamptz`; JSON ใช้ camelCase และ DB ใช้ snake_case

## C.3 State Transition และ Transaction

สถานะ Sprint 1: JOIN → WAITING → CALLED → COMPLETED โดย COMPLETED หมายถึงพนักงานพาลูกค้าเข้าร้าน/ปิดกระบวนการรอคิวแล้ว ไม่ได้หมายถึงรับประทานอาหารเสร็จ

Join Transaction: BEGIN → ล็อกแถว service_queues FOR UPDATE → ตรวจ party_size อยู่ในช่วง 1 ถึง max_party_size ของแถว Queue ที่ล็อกอยู่ (ก่อนตรวจ OPEN เพื่อคงลำดับ Sprint 1; v0.4), ตรวจ OPEN, Customer Role, ไม่มี Active Ticket เดิม → ใช้ next_ticket_no สร้าง WAITING Entry → เพิ่ม Counter → เขียน JOINED Event → COMMIT; ล้มเหลวต้อง ROLLBACK ทั้งหมด

Call Next Transaction: BEGIN → ล็อก Queue → ตรวจ Host Assignment และไม่มี CALLED ค้าง → เลือก WAITING ที่ ticket_no น้อยที่สุด → เปลี่ยน CALLED, called_at → เขียน CALLED Event → COMMIT; หากสอง Operator กดพร้อมกันต้องไม่เรียกสองใบ

Complete Transaction: BEGIN → ตรวจ Host Assignment และ Ticket = CALLED → เปลี่ยนเป็น COMPLETED พร้อม completed_at และ Event → COMMIT; Complete ซ้ำหรือข้ามสถานะ = 409 และไม่มี Event ใหม่

F-05 extensions: assigned Host No-show changes CALLED -> NO_SHOW with one atomic event; Seat changes CALLED -> COMPLETED together with table occupancy and the historical table link. Queue -> Entry -> Table locks and rollback preserve FIFO/one-CALLED; Release changes only current occupancy, retaining history. Legacy table-less Complete stays valid. See C.9 for exact transactions and checks.

## C.4 Role / Permission Matrix

| Operation | Customer | Host |
| :---- | :---- | :---- |
| Login / Logout / Me | ของตนเอง | ของตนเอง |
| ดูร้าน/บริการที่เปิดรับคิว | ได้ | ได้ |
| Join Queue | ได้ (สร้างให้ตนเอง) | ไม่ได้ |
| ดูข้อมูล Ticket ส่วนตัว | เฉพาะเจ้าของ | เฉพาะ Queue ที่ Assigned |
| ดู Waiting List | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| Call Next / Complete | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| No-show / Seat / Release / Table list | Not permitted | Assigned active Host only, own queue (F-05) |
| ดู Ticket ของ Customer อื่น | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| จัดการโต๊ะ / Queue Config | ไม่มีใน Sprint 1 | ต้องทำ Contract เพิ่มใน Sprint 2 |


## C.5 หน้าจอหลักและสถานะที่ต้องรองรับ

| หน้าจอ | ผู้ใช้ | พฤติกรรม / Error States |
| :---- | :---- | :---- |
| /login | Customer/Host | ฟอร์ม Login, Invalid Credentials, Loading, Logout |
| /queues | Customer | รายการร้าน/คิว OPEN/CLOSED, ใส่ partySize, Join, แจ้งซ้ำ/คิวปิด |
| /my-queue | Customer | Ticket No., partySize, WAITING/CALLED/COMPLETED/CANCELLED/NO_SHOW, Empty, Refresh |
| /host/queues/:queueId | Host ที่ Assigned | Waiting List FIFO, Currently CALLED, Call Next, Complete, Conflict/Error; No-show confirmation, fitting-table picker and Release (F-05) |


## C.6 API Specification — Endpoint Inventory

รูปแบบ Response: สำเร็จ { data: ... } / ล้มเหลว { error: { code, message } }; ห้ามเปิดเผยข้อมูลส่วนตัวเมื่อ 401 หรือ 403; User ID และ Role ต้องอ่านจาก Session ฝั่ง Server

| Method | Endpoint | บทบาท / Request สำคัญ | Response / Error |
| :---- | :---- | :---- | :---- |
| POST | /api/auth/login | Public: email, password | 200 User + Cookie; 400/401/403 |
| POST | /api/auth/logout | Login แล้ว | 204; ยกเลิก Session |
| GET | /api/auth/me | Login แล้ว | 200 User; 401 |
| GET | /api/queues | Login แล้ว | 200 Queue List (แต่ละรายการมี `maxPartySize` และ `isAssigned`); 401 |
| POST | /api/queues/:queueId/entries | Customer: { partySize: 1..maxPartySize ของ Queue นั้น } | 201 WAITING; 400/401/403/404/409 |
| GET | /api/me/entries | Customer | 200 ตั๋วของตัวเอง; 401 |
| GET | /api/entries/:entryId | เจ้าของหรือ Assigned Host | 200 Ticket; 400/401/403/404 |
| GET | /api/queues/:queueId/entries | Assigned Host | 200 WAITING/CALLED FIFO; 400/401/403/404 |
| POST | /api/queues/:queueId/call-next | Assigned Host | 200 CALLED; 400/401/403/404/409 |
| POST | /api/entries/:entryId/complete | Assigned Host | 200 COMPLETED; 400/401/403/404/409 |
| POST | /api/entries/:entryId/no-show | Assigned Host; no body | 200 NO_SHOW Ticket; 400/401/403/404/409 |
| GET | /api/queues/:queueId/tables | Assigned Host | 200 Table array; 400/401/403/404 |
| POST | /api/entries/:entryId/seat | Assigned Host: { tableId } after entry permission | 200 { entry: Ticket, table: Table }; 400/401/403/404/409/413 |
| POST | /api/tables/:tableId/release | Assigned Host; no body | 200 AVAILABLE Table, idempotent; 400/401/403/404 |

### C.6.1 Response Shapes (v0.3)

- `GET /api/queues`: คืน `{ data: [...] }`; เมื่อไม่มีคิวคืน `{ "data": [] }` แต่ละรายการมี `id` (Queue UUID), `restaurant: { id, name }` (Restaurant UUID และชื่อร้าน), `status` (`OPEN` หรือ `CLOSED`) และ `maxPartySize` (integer 1–10; v0.4) และ `isAssigned` (boolean) เป็น `true` เฉพาะเมื่อผู้เรียกเป็น Host ที่ถูก Assign ให้ Queue นั้น; Customer และ Host ที่ไม่ได้ Assign ได้ `false` — UI ใช้ `item.id` เป็น `queueId` สำหรับ Join และ `/host/queues/:queueId` ไม่ใช้ Restaurant ID แทน Queue ID

ตัวอย่าง Response สำหรับ Assigned Host (`isAssigned` ของรายการเดียวกันต้องเป็น `false` สำหรับ Customer และ Unassigned Host):

```json
{
  "data": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "restaurant": {
        "id": "11111111-1111-4111-8111-111111111111",
        "name": "DineQ Demo Restaurant"
      },
      "status": "OPEN",
      "maxPartySize": 10,
      "isAssigned": true
    }
  ]
}
```

UUID และชื่อร้านในตัวอย่างเป็นข้อมูลสมมติสำหรับอธิบาย Shape ไม่ใช่ค่าตายตัวที่ Seed ต้องใช้; Response ไม่ส่ง `next_ticket_no`, Assignment Rows หรือข้อมูลส่วนตัวของ Customer

- Ticket JSON (Join, `/api/me/entries`, `/api/entries/:entryId`, Waiting List): `id`, `queueId`, `ticketNo`, `partySize`, `status`, `createdAt`, `calledAt`, `completedAt` (`calledAt`/`completedAt` เป็น `null` จนกว่าจะเปลี่ยนสถานะ); ไม่มี Email หรือข้อมูลส่วนตัวของ Customer ใน Waiting List ของ Host

F-05 Ticket responses retain the same eight keys, with terminal NO_SHOW supported. Historical table_id stays in the database; Table responses and Seat response composition are defined in C.9.1.

### C.6.2 Error Code Catalog (v0.2)

รูปแบบ `{ error: { code, message } }`; `code` เป็นค่าคงที่ตามตาราง ส่วน `message` อ่านเข้าใจได้และไม่เปิดเผยข้อมูลส่วนตัว

| HTTP | code | ใช้เมื่อ |
| :---- | :---- | :---- |
| 400 | VALIDATION_ERROR | Body/Param ไม่ถูกรูปแบบ (เช่น Login ไม่ส่ง email/password, UUID ผิดรูปแบบ) |
| 400 | INVALID_PARTY_SIZE | partySize ไม่ใช่จำนวนเต็ม 1 ถึง maxPartySize ของ Queue ปลายทาง (0, 1.5, ข้อความ, null, ไม่ส่ง หรือเกิน limit; กรณีเกิน limit message ระบุ limit ของคิว; v0.4) |
| 401 | UNAUTHENTICATED | ไม่มี Session, Session หมดอายุ หรือถูกเพิกถอน |
| 401 | INVALID_CREDENTIALS | Email/Password ไม่ถูกต้อง (ข้อความเดียวกัน ไม่บอกว่า Email มีหรือไม่) |
| 403 | FORBIDDEN | Role ไม่ถูกต้อง, ไม่ใช่เจ้าของ Ticket หรือ Host ไม่ได้ Assigned |
| 403 | ORIGIN_NOT_ALLOWED | Request ที่เปลี่ยนข้อมูลมี Origin ไม่ตรง APP_ORIGIN |
| 404 | NOT_FOUND | ไม่มี Resource (Queue/Entry/Table) นั้นอยู่จริง |
| 404 | NO_WAITING_ENTRY | Call Next แต่ไม่มี Ticket WAITING |
| 409 | DUPLICATE_ACTIVE | Customer มี Ticket WAITING/CALLED อยู่แล้วใน Queue นั้น |
| 409 | QUEUE_CLOSED | Join Queue ที่ CLOSED |
| 409 | UNRESOLVED_CALLED | Call Next ขณะมี CALLED ค้างอยู่ |
| 409 | INVALID_TRANSITION | เปลี่ยนสถานะผิดลำดับ (เช่น Complete ใบที่ไม่ใช่ CALLED) |
| 409 | TABLE_OCCUPIED | Seat target is occupied (before capacity check) |
| 409 | INSUFFICIENT_CAPACITY | Available Seat target is too small |
| 413 | PAYLOAD_TOO_LARGE | Parsed JSON exceeds 100 KB; Request body is too large (F-09a) |

### C.6.3 ลำดับตรวจตามประเภท Endpoint (v0.3)

1. Origin: ทุก `POST/PUT/PATCH/DELETE` ที่มี Origin Header และไม่ตรง `APP_ORIGIN` คืน `403 ORIGIN_NOT_ALLOWED` ก่อนตรวจ Session/Body รวมถึง Login; ถ้าไม่มี Origin Header ให้ตรวจขั้นถัดไปตามปกติ
2. Public Endpoint: `POST /api/auth/login` ไม่ต้องมี Session/Cookie; ตรวจ Body ก่อน (`400 VALIDATION_ERROR` เมื่อ email/password ขาดหรือชนิดข้อมูลไม่ถูกต้อง) แล้วตรวจ Credentials (`401 INVALID_CREDENTIALS` เมื่อไม่ตรง, `200` เมื่อถูกต้อง) ส่วน `GET /api/health` ไม่ต้องมี Session
3. Protected Endpoint: ตรวจ Session ก่อน (`401 UNAUTHENTICATED`) แล้วตรวจ Role ของ Endpoint (`403 FORBIDDEN` เช่น Host เรียก Join หรือ Customer เรียก Host-only API) โดยยังไม่อ่าน/ส่งข้อมูล Resource ให้ผู้ไม่มีสิทธิ์
4. สำหรับ Endpoint ที่รับ `:queueId`/`:entryId`/`:tableId`: ตรวจรูปแบบ UUID (`400 VALIDATION_ERROR`) ก่อน Query Resource; UUID ถูกต้องแต่ไม่มี Queue/Entry นั้นคืน `404 NOT_FOUND` จากนั้นจึงตรวจ Ownership/Assignment ของ Resource ที่พบ (`403 FORBIDDEN`) โดยไม่เปิดเผยข้อมูลส่วนตัวใน Response ที่ปฏิเสธ
5. ตรวจ Body ของคำขอที่ผ่านสิทธิ์แล้ว เช่น Join ที่ partySize ไม่ใช่จำนวนเต็ม ≥ 1 คืน `400 INVALID_PARTY_SIZE` และเมื่อล็อก Queue แล้วตรวจช่วง 1 ถึง maxPartySize ของ Queue (`400 INVALID_PARTY_SIZE`, ก่อน `409 QUEUE_CLOSED`) จากนั้นตรวจ Business Rules ใน Transaction ตาม C.3 (`409` ตาม Catalog) ก่อนเขียนข้อมูล; Role/Assignment และสถานะที่ใช้ตัดสินการเขียนต้องยังถูกต้องภายใต้ Lock

กรณี Call Next: หลังพบ Queue และผ่าน Assignment แล้ว ตรวจ CALLED ค้างก่อน (`409 UNRESOLVED_CALLED`); ถ้าไม่มี CALLED และไม่มี WAITING คืน `404 NO_WAITING_ENTRY` เป็นกรณีไม่พบรายการที่เรียกได้ ไม่ใช่ Queue หายไป

ตัวอย่างผลที่ต้องได้ตามลำดับข้างต้น:

| Endpoint / เงื่อนไข | Expected Result | Planned Verification |
| :---- | :---- | :---- |
| Login ด้วย Body ถูกต้องและไม่มี Cookie | 200 เมื่อ Credentials ถูกต้อง; ไม่ถูก Session Guard ปฏิเสธ | AC-01 / TEST-01 |
| Anonymous เรียก Protected Endpoint แม้ UUID ผิดรูปแบบ | 401 UNAUTHENTICATED ไม่เปิดเผยข้อมูล Resource | AC-05 / TEST-05, AC-23/24 |
| Customer เรียก Host-only Endpoint แม้ UUID ผิดรูปแบบ | 403 FORBIDDEN ก่อนตรวจ UUID | AC-20 / TEST-20, AC-24 |
| ผู้ Login และ Role ถูกต้อง เรียกด้วย UUID ผิดรูปแบบ | 400 VALIDATION_ERROR | AC-23/24 / TEST-23/24 |
| ผู้ Login และ Role ถูกต้อง เรียกด้วย UUID ที่ถูกต้องแต่ไม่มี Resource | 404 NOT_FOUND | AC-23/24 / TEST-23/24 |
| Resource มีอยู่จริง แต่ไม่ใช่เจ้าของ/Host ไม่ได้ Assigned | 403 FORBIDDEN ไม่เปิดเผยข้อมูลส่วนตัว | AC-11/19 / TEST-11/19 |
| Assigned Host Call Next เมื่อไม่มีทั้ง WAITING และ CALLED | 404 NO_WAITING_ENTRY; Row/Event/Counter ไม่เปลี่ยน | AC-24 / TEST-24 |

คำขอที่ถูกปฏิเสธต้องไม่เปลี่ยน DB และไม่กินเลขคิว; ทุก Error ใช้ Shape ใน C.6.2


## C.7 Authentication / Security / Configuration

Login ใช้ Password Hash (Argon2id) จากบัญชี Seed; Server ออก Session Token แบบสุ่ม เก็บ Hash Token ใน PostgreSQL และส่ง HttpOnly Cookie; Logout เพิกถอน Session ฝั่ง Server; /api/auth/me ใช้ตรวจตัวตนปัจจุบัน; Secure Cookie บน HTTPS และ Origin/CSRF Protection สำหรับคำขอที่เปลี่ยนข้อมูล

| ตัวแปร / ไฟล์ | ตัวอย่างที่ต้องกำหนด | ข้อควรระวัง |
| :---- | :---- | :---- |
| DATABASE_URL | PostgreSQL connection string ใน .env | ห้าม Commit Secret จริง |
| PORT | API Server port | Document ใน README |
| APP_ORIGIN | Origin ที่ Frontend ใช้งาน | ใช้สำหรับ CORS/Origin/CSRF Policy |
| SESSION_TTL_SECONDS | อายุ Session เป็นวินาที | Server บังคับ Expiry |
| NODE_ENV / COOKIE_SECURE | development / production / HTTPS config | Secure Cookie ใน Production |
| .env.example + README | Migrate, Seed, Build, Run, Test commands | เก็บตัวอย่างเท่านั้น ไม่มี Credential จริง |


การตั้งค่าทดสอบ: Seed Customer อย่างน้อย 30 Accounts สำหรับ Concurrency Test, Host ที่ Assigned 1 คน, Host ไม่ Assigned 1 คน, ร้านอาหารหนึ่งสาขาและ OPEN Queue หนึ่งคิว; ใช้ข้อมูลสมมติและวิธีสร้างบัญชีทดสอบอย่างปลอดภัย ไม่ใส่รหัสผ่านจริงใน PDF

บัญชี Seed (v0.2): `customer01@dineq.test` ถึง `customer30@dineq.test` (CUSTOMER), `host1@dineq.test` (HOST, Assigned กับ Queue ที่ Seed), `host2@dineq.test` (HOST, ไม่ Assigned); รหัสผ่านทุกบัญชีอ่านจาก env `SEED_DEMO_PASSWORD` ตอนรัน Seed (ไม่ Commit ลง Git/เอกสาร/Log) และเก็บเป็น Argon2id Hash เท่านั้น; ตัวแปร `TEST_DATABASE_URL` ใช้ฐานข้อมูลแยกสำหรับ Test (เพิ่มใน `.env.example` ร่วมกับ `DATABASE_URL`)

## C.8 Sprint 2-3 Planned Additions (v0.4-s3)

หัวข้อนี้รวบรวมสิ่งที่ Contract ของ Sprint 2-3 เพิ่มจาก C.2-C.6 โดยไม่แก้แถวเดิม (รายละเอียดอยู่ใน Contract แต่ละฟีเจอร์); เมื่อ Implement เสร็จให้ย้ายไปรวมในตาราง C.2/C.6 พร้อม Revision History. สถานะ: PLANNED จนกว่าจะมีผลรันจริง

**ข้อมูล (C.2 เพิ่มเติม)**

| รายการ | ฟีเจอร์ / Migration | รายละเอียด |
| :---- | :---- | :---- |
| `queue_entries.status` เพิ่ม `CANCELLED`, `NO_SHOW`; `queue_events.event_type/from_status/to_status` เพิ่มค่าเดียวกัน; Transition CHECK ใหม่ | F-04 / 003 | CANCELLED จาก WAITING เท่านั้น; NO_SHOW จาก CALLED (ใช้โดย F-05) |
| ตารางโต๊ะและการผูกโต๊ะกับตั๋ว | F-05 / 004 | กำหนดใน Contract F-05 (ความจุ, สถานะ AVAILABLE/OCCUPIED) |
| `service_queues.name` (1-60 ตัวอักษร, UNIQUE ต่อร้าน) | F-06 / 005 | แยกหลายคิวในร้านเดียวกัน; Seed เพิ่มคิว `Bar counter` และ `host3@dineq.test` |
| `service_queues.max_party_size` (1-10, ค่าเริ่มต้น 8) | Lab 7 / 002 | BR-09 ต่อคิว; `queue_entries.party_size` CHECK 1-10 |

**API (C.6 เพิ่มเติม)**

| Method | Endpoint | บทบาท | ฟีเจอร์ | สถานะ |
| :---- | :---- | :---- | :---- | :---- |
| POST | `/api/entries/:entryId/cancel` | Customer เจ้าของ | F-04 | วางแผน Implement ใน D2 |
| PATCH | `/api/queues/:queueId` `{ status }` | Host ที่ Assigned | F-06 | วางแผน Implement ใน D2 |
| GET | `/api/queues` (เพิ่ม `name`, `maxPartySize`) | Login แล้ว | F-06, Lab 7 | วางแผน Implement ใน D2 |
| GET | `/api/me/entries?status&from&to` | Customer | F-07a | วางแผน Implement ใน D2 |
| GET | `/api/queues/:queueId/history`, `/api/entries/:entryId/events` | Host ที่ Assigned / เจ้าของ | F-07b | PLANNED |
| GET | `/api/queues/:queueId/summary` | Host ที่ Assigned | F-08 | PLANNED |
| (No-show and seating) | Canonical endpoints in C.6 and details in C.9 | Assigned Host | F-05 | Local implementation and recorded verification below; release pending |

**Error Catalog เพิ่มเติม (C.6.2):** `413 PAYLOAD_TOO_LARGE` (Body JSON เกิน 100 KB; F-09a, ไม่สร้าง Session/Row; Endpoint ที่ตรวจสิทธิ์ก่อน Parse Body ยังคืน 401/403/400/404 ก่อน) ไม่มี Code ใหม่อื่นใน Sprint 2: Cancel/ปิดคิวใช้ `INVALID_TRANSITION`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR` ที่มีอยู่

**ข้อกำหนดร่วม:** ลำดับตรวจตาม C.6.3 ทุก Endpoint ใหม่; การเปลี่ยนสถานะที่แก้ตั๋วเขียน Event ใน Transaction เดียวกัน (BR-12) และล็อกแถวคิวก่อนแถวตั๋วเพื่อไม่ให้เกิด Deadlock กับ Call Next; ไม่รับ User ID/Role/ticketNo จาก Client

## C.9 F-05 No-show and Seating — Contract and Local Implementation

**Locally verified candidate**, 2026-11-28, source `1a3d66dfa57e47df1999c215f24e26ef1577419f`. [F-05](sprints/sprint-2/F-05-no-show-seating.md) remains the normative contract; [recorded runs](evidence/f05-verification.md) map all AC-36..45. This is not a deployed-release claim.

| Area | Planned addition |
| --- | --- |
| Data / C.2 | Migration 004 adds queue-scoped `dining_tables` (label, capacity 1..10, AVAILABLE/OCCUPIED, nullable occupied_entry_id) and nullable `queue_entries.table_id`. Unique queue label and occupied entry, occupancy CHECK, and composite same-queue FKs protect the row model. API checks capacity/state across rows under lock; no cross-table trigger is claimed. Migration 003, owned by F-04, already reserves NO_SHOW/CANCELLED and their event/timestamp checks; 004 must not replace them. |
| State / C.3 | Assigned Host No-show: CALLED -> NO_SHOW, retain called_at, no completed_at/table. Seat: CALLED -> COMPLETED plus historical table_id and occupied table, with one existing COMPLETED event. All transition/event/table effects commit together or roll back. Legacy table-less Complete remains valid and unchanged. Release only clears current table occupancy; historical entry linkage stays. |
| Permission / C.4 | All four new endpoints are HOST-only and require assignment to the resource's queue. Tables cannot be shared across queues, even by a Host assigned to both. Session/Role precede UUID/resource/body checks; writes keep the existing Origin guard first. Seat resolves entry existence/assignment before JSON parsing and target-table validation. |
| UI / C.5 | Extend the Host queue screen with confirmed No-show, table list/capacity/occupancy, Seat selection and Release. Keep legacy Complete, loading/empty/error/success/refresh and keyboard controls. Customer ticket view displays terminal NO_SHOW and permits navigation to rejoin. |
| Transactions | Queue -> Entry -> Table lock order, authoritative assignment/state recheck, one terminal transition/event under competing Seat/No-show/legacy Complete. CLOSED blocks new Join but permits serving existing tickets and releasing tables. Preserve FIFO and the one-CALLED partial unique index. |
| Seed | Insert absent deterministic T1 (4 seats) and T2 (10 seats) on the seeded main queue. Re-seeding never releases occupied tables or resets ticket/event/counter history. No new environment variables or dependencies. |

### C.9.1 API and error additions

| Method / endpoint | Request | Success |
| --- | --- | --- |
| POST /api/entries/:entryId/no-show | No body required | 200 `{ data: Ticket }`, NO_SHOW |
| GET /api/queues/:queueId/tables | None | 200 `{ data: Table[] }`, label then id order; `[]` if empty |
| POST /api/entries/:entryId/seat | JSON object `{ tableId: UUID }` | 200 `{ data: { entry: Ticket, table: Table } }` |
| POST /api/tables/:tableId/release | No body required | 200 `{ data: Table }`, AVAILABLE; idempotent |

`Ticket` keeps C.6.1's eight keys. `Table` contains exactly id, queueId, label, capacity, status, occupiedEntryId, occupiedTicketNo; both occupied fields are null when AVAILABLE. No customer identifiers/emails are added. Persisted historical table_id does not silently extend the old Ticket response.

C.6.2 catalog additions: **409 TABLE_OCCUPIED** for an occupied target and **409 INSUFFICIENT_CAPACITY** for an available undersized target. Seat evaluates valid CALLED state before occupancy, then capacity. Reuse INVALID_TRANSITION for a non-CALLED entry and the existing 400/401/403/404 codes/check order; cross-queue table choice is 403, missing target is 404. Rejections never change entries/tables/events/counters. All errors retain `{ error: { code, message } }` and hide database details.

AC-36..45 / TEST-36..45 have 68 passing local cases within the recorded 257-test suite; UI journeys 10/11 pass within the 10-test browser suite at `1a3d66dfa57e47df1999c215f24e26ef1577419f`. Implemented migrations 001..005 are integrated. Peer review, staging merge, final cross-feature release and deployment verification are not certified by these local results.

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Add error-code catalog and check order (C.6.2), response shapes incl. `isAssigned` and ticket JSON (C.6.1), UUID/timestamptz conventions (C.2), seed accounts and TEST_DATABASE_URL (C.7) |
| v0.3 | 2026-11-06 | Address PR #1 review: define full queue-list JSON and endpoint-specific check order, clarify public login and the two 404 outcomes, link planned verification |
| v0.4 | 2026-11-28 | Lab 7 (L7-CR-01, BR-09): add `service_queues.max_party_size` (1–10, default 8), widen `queue_entries.party_size` CHECK to 1–10, per-queue range check in the Join transaction (after the queue lock, before the CLOSED check), `maxPartySize` in the queue JSON, error text. Old wording: "party_size 1–8", "partySize: 1..8" |
| v0.5-f05 | 2026-11-28 | Propose C.9 F-05 data/API/error/lock/UI contract and AC-36..45; preserve legacy Complete; reserve migration 004 after implemented 002/003. No implementation or verification result claimed |
| v0.5 | 2026-11-28 | Add C.8 collecting the Sprint 2-3 planned additions (statuses, queue name, new endpoints, 413 error) without editing existing C.2-C.6 rows|

| v0.6-f05 | 2026-11-28 | Consolidate implemented F-05 table/API/security/error details into C.2/C.4/C.6/C.9 and record real API/UI verification; retain legacy Complete and release/manual-audit limits |
