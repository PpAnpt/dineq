# PART C — System-Level Software Design Specification (SDS) | 15 คะแนน

> **Status:** Draft v0.1 (2026-11-04) · CPE334 Theme 9 · DineQ

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
| service_queues | id, restaurant_id, status OPEN/CLOSED, next_ticket_no | FK restaurants; next_ticket_no ≥ 1 | 1 |
| queue_operator_assignments | queue_id, host_user_id | PK (queue_id,host_user_id); ตรวจ Host role ที่ API | 1 |
| queue_entries | id, queue_id, customer_id, ticket_no, party_size, status, created_at, called_at, completed_at | UNIQUE ticket; partial unique Active; party_size 1–8 | 1 |
| queue_events | id, entry_id, actor_id, event_type, from_status, to_status, occurred_at | FK entry/user; เขียน Atomic กับ Transition | 1 |


ความสัมพันธ์: users 1:N sessions, users 1:N queue_entries (Customer), restaurants 1:N service_queues, service_queues 1:N queue_entries, queue_entries 1:N queue_events และ users (Operator) N:M service_queues ผ่าน queue_operator_assignments

Database Constraints: UNIQUE(queue_id,ticket_no); UNIQUE แบบ Partial สำหรับ (queue_id,customer_id) เฉพาะ WAITING/CALLED; UNIQUE แบบ Partial สำหรับ queue_id ที่มี CALLED; CHECK party_size BETWEEN 1 AND 8; CHECK timestamps/สถานะ; Foreign Key ตามความสัมพันธ์; ไม่ปล่อยให้ Browser เป็นผู้กำหนด Customer ID หรือ Ticket Number

## C.3 State Transition และ Transaction

สถานะ Sprint 1: JOIN → WAITING → CALLED → COMPLETED โดย COMPLETED หมายถึงพนักงานพาลูกค้าเข้าร้าน/ปิดกระบวนการรอคิวแล้ว ไม่ได้หมายถึงรับประทานอาหารเสร็จ

Join Transaction: BEGIN → ล็อกแถว service_queues FOR UPDATE → ตรวจ OPEN, Customer Role, party_size 1–8, ไม่มี Active Ticket เดิม → ใช้ next_ticket_no สร้าง WAITING Entry → เพิ่ม Counter → เขียน JOINED Event → COMMIT; ล้มเหลวต้อง ROLLBACK ทั้งหมด

Call Next Transaction: BEGIN → ล็อก Queue → ตรวจ Host Assignment และไม่มี CALLED ค้าง → เลือก WAITING ที่ ticket_no น้อยที่สุด → เปลี่ยน CALLED, called_at → เขียน CALLED Event → COMMIT; หากสอง Operator กดพร้อมกันต้องไม่เรียกสองใบ

Complete Transaction: BEGIN → ตรวจ Host Assignment และ Ticket = CALLED → เปลี่ยนเป็น COMPLETED พร้อม completed_at และ Event → COMMIT; Complete ซ้ำหรือข้ามสถานะ = 409 และไม่มี Event ใหม่

## C.4 Role / Permission Matrix

| Operation | Customer | Host |
| :---- | :---- | :---- |
| Login / Logout / Me | ของตนเอง | ของตนเอง |
| ดูร้าน/บริการที่เปิดรับคิว | ได้ | ได้ |
| Join Queue | ได้ (สร้างให้ตนเอง) | ไม่ได้ |
| ดูข้อมูล Ticket ส่วนตัว | เฉพาะเจ้าของ | เฉพาะ Queue ที่ Assigned |
| ดู Waiting List | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| Call Next / Complete | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| ดู Ticket ของ Customer อื่น | ไม่ได้ | เฉพาะ Queue ที่ Assigned |
| จัดการโต๊ะ / Queue Config | ไม่มีใน Sprint 1 | ต้องทำ Contract เพิ่มใน Sprint 2 |


## C.5 หน้าจอหลักและสถานะที่ต้องรองรับ

| หน้าจอ | ผู้ใช้ | พฤติกรรม / Error States |
| :---- | :---- | :---- |
| /login | Customer/Host | ฟอร์ม Login, Invalid Credentials, Loading, Logout |
| /queues | Customer | รายการร้าน/คิว OPEN/CLOSED, ใส่ partySize, Join, แจ้งซ้ำ/คิวปิด |
| /my-queue | Customer | Ticket No., partySize, WAITING/CALLED/COMPLETED, Empty, Refresh |
| /host/queues/:queueId | Host ที่ Assigned | Waiting List FIFO, Currently CALLED, Call Next, Complete, Conflict/Error |


## C.6 API Specification — Endpoint Inventory

รูปแบบ Response: สำเร็จ { data: ... } / ล้มเหลว { error: { code, message } }; ห้ามเปิดเผยข้อมูลส่วนตัวเมื่อ 401 หรือ 403; User ID และ Role ต้องอ่านจาก Session ฝั่ง Server

| Method | Endpoint | บทบาท / Request สำคัญ | Response / Error |
| :---- | :---- | :---- | :---- |
| POST | /api/auth/login | Public: email, password | 200 User + Cookie; 401 |
| POST | /api/auth/logout | Login แล้ว | 204; ยกเลิก Session |
| GET | /api/auth/me | Login แล้ว | 200 User; 401 |
| GET | /api/queues | Login แล้ว | 200 Queue List |
| POST | /api/queues/:queueId/entries | Customer: { partySize: 1..8 } | 201 WAITING; 400/403/409 |
| GET | /api/me/entries | Customer | 200 ตั๋วของตัวเอง; 401 |
| GET | /api/entries/:entryId | เจ้าของหรือ Assigned Host | 200 Ticket; 403/404 |
| GET | /api/queues/:queueId/entries | Assigned Host | 200 WAITING/CALLED FIFO; 403 |
| POST | /api/queues/:queueId/call-next | Assigned Host | 200 CALLED; 404/409 |
| POST | /api/entries/:entryId/complete | Assigned Host | 200 COMPLETED; 403/409 |


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

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
