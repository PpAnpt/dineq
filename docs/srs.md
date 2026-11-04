# PART A - Software Requirements Specification (SRS)

> **Status:** Draft v0.1 (2026-11-04) · CPE334 Theme 9 · DineQ

## A.1 ปัญหาและเป้าหมายผลิตภัณฑ์

ร้านอาหารที่มีลูกค้า Walk-in เข้าคิวมักใช้การจดชื่อบนกระดาษหรือเรียกด้วยเสียง ทำให้เกิดเลขคิวซ้ำ ลูกค้าไม่ทราบสถานะ ตลอดจนเจ้าหน้าที่อาจเรียกข้ามลำดับหรือเปลี่ยนสถานะผิดขั้นตอน DineQ ช่วยให้ลูกค้า Login รับคิวตามจำนวนคน และตรวจสอบบัตรคิวของตน ส่วนพนักงาน Host ดูแถวคอย เรียกคนถัดไปตาม FIFO และปิดงานเมื่อพาเข้าร้านเรียบร้อย

Sprint 1 โฟกัสการพิสูจน์ Flow จริง UI → API → PostgreSQL และการบังคับใช้ Domain Rules เท่านั้น ยังไม่อ้างว่ามีการจัดโต๊ะหรือเช็กโต๊ะว่างอัตโนมัติ

## A.2 ผู้ใช้ระบบและขอบเขตความรับผิดชอบ

| Actor | หน้าที่ | ขอบเขตสิทธิ์ |
| :---- | :---- | :---- |
| Customer (ลูกค้า) | Login, ดูคิว, ระบุจำนวนคน, รับคิว, ตรวจสถานะ/ประวัติคิวของตน | เข้าถึงเฉพาะบัตรของตนเอง |
| Host (พนักงานหน้าร้าน) | Login, ดูแถวคอย, Call Next, Complete เมื่อพาลูกค้าเข้าร้าน | จัดการได้เฉพาะร้าน/คิวที่ Assigned |

## A.3 In Scope / Out of Scope

| กลุ่ม | รายละเอียด | Sprint |
| :---- | :---- | :---- |
| ทำใน Sprint 1 | Seed Account, Login/Logout, Role, Queue OPEN 1 รายการ, รับคิว Walk-in พร้อมจำนวนคน | 1 |
| ทำใน Sprint 1 | FIFO Call Next, Complete หลังเข้าร้าน, Persistent DB, Queue Events | 1 |
| ทำใน Sprint 1 | Negative/Boundary/Concurrency/Ownership Tests และ GitHub PR Review | 1 |
| ขยายภายหลัง | Cancel, No-show, จัดโต๊ะให้ตรงจำนวนคน และ Multiple Queue/Counter | 2 |
| ขยายภายหลัง | Ticket History/Filters, Reporting, UX, Regression/Release Hardening | 3 |
| ไม่ทำ | จองเวลาล่วงหน้า, ชำระเงิน, SMS จริง, AI ทำนายคิว, VIP Priority | นอก Scope |

## A.4 Functional Requirements (FR)

FR ทุกข้อมีรหัสถาวร แสดงพฤติกรรมที่ตรวจสอบได้ และระบุ Sprint ที่ตั้งใจทำ; รายการส่วนหลังเป็น Product Baseline ยังไม่จำเป็นต้องเสร็จใน Sprint 1

| ID | Functional Requirement — ความสามารถของระบบ | Sprint |
| :---- | :---- | :---- |
| FR-01 | Customer และ Host สามารถ Login/Logout และตรวจสอบ Current User พร้อม Role จาก Server | 1 |
| FR-02 | ผู้ Login แล้วดูคิวร้านอาหารที่เปิดรับ Walk-in พร้อม OPEN/CLOSED | 1 |
| FR-03 | Customer ระบุจำนวนคนในกลุ่มและกดรับคิวโดยได้เลขบัตรที่บันทึกใน DB | 1 |
| FR-04 | Customer ดูเลขคิว สถานะ และบัตรของตนเองย้อนหลังได้ | 1,3 |
| FR-05 | Host ที่ Assigned ดูรายการ WAITING/CALLED และจำนวนคนของคิวที่ดูแลได้ | 1 |
| FR-06 | Host เรียกคิว WAITING ถัดไปตาม FIFO ได้ | 1 |
| FR-07 | Host ปิดกระบวนการรอคิวเมื่อพาลูกค้าเข้าร้าน (COMPLETED) ได้ | 1 |
| FR-08 | Customer ยกเลิกคิวที่เข้าเงื่อนไขและบันทึกเหตุการณ์ได้ | 2 |
| FR-09 | Host บันทึก No-show เมื่อเรียกแล้วลูกค้าไม่มาได้ | 2 |
| FR-10 | Host จัดสรรโต๊ะตามจำนวนคนและความจุในสถานะที่กำหนดได้ | 2 |
| FR-11 | รองรับหลายคิว/เคาน์เตอร์และกำหนด Host ผู้รับผิดชอบได้ | 2 |
| FR-12 | Host ที่มีสิทธิ์เปิด/ปิดคิวและดูแลการตั้งค่าร้านได้ | 2 |
| FR-13 | ผู้ใช้ค้นหา/กรองรายการคิวที่มีสิทธิ์ และดูประวัติการเปลี่ยนสถานะได้ | 3 |
| FR-14 | Host ดูรายงานสรุปจำนวนคิวที่รอ เสร็จ ยกเลิก และ No-show ได้ | 3 |
| FR-15 | UI และ API แสดง Validation/Loading/Success/Error ให้เข้าใจได้และตรวจสอบได้ | 1–3 |
| FR-16 | ระบบเก็บ Audit Event ของ JOINED/CALLED/COMPLETED และเหตุการณ์ภายหลัง | 1–3 |


## A.5 Business Rules (BR)

กฎธุรกิจต้องตรวจที่ Backend/Database ไม่ใช่เพียงปิดปุ่มบนหน้าเว็บ กฎ FIFO และการไม่สร้างคิวซ้ำต้องถูกทดสอบเมื่อมีคำขอพร้อมกัน

| ID | Business Rule — ข้อจำกัดที่ระบบต้องบังคับใช้ | Sprint |
| :---- | :---- | :---- |
| BR-01 | เลขคิวต้องไม่ซ้ำภายใน Queue เดียวกัน รวมกรณีลูกค้ากด Join พร้อมกัน | 1 |
| BR-02 | Customer มีบัตร Active (WAITING/CALLED) ได้ไม่เกิน 1 ใบต่อ Queue | 1 |
| BR-03 | รับคิวต้องเป็น Customer ที่ Login; Call/Complete ต้องเป็น Host ที่ Assigned เท่านั้น | 1 |
| BR-04 | Host ต้องเรียก WAITING ที่ ticket_no ต่ำสุด (FIFO) ห้ามเลือกข้ามลำดับใน Sprint 1 | 1 |
| BR-05 | หากมี CALLED ค้างอยู่ ต้องไม่ Call Next เพิ่ม (หนึ่งจุดเรียก) | 1 |
| BR-06 | เปลี่ยนสถานะได้เฉพาะ JOIN→WAITING→CALLED→COMPLETED ใน Sprint 1 | 1 |
| BR-07 | ห้าม Join Queue ที่ CLOSED; คำขอที่ถูกปฏิเสธห้ามกินเลขคิว | 1 |
| BR-08 | Customer อ่านข้อมูลส่วนตัวเฉพาะของตน; Host อ่าน/แก้คิวที่ Assigned เท่านั้น | 1 |
| BR-09 | partySize ต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ถึง 8; ค่าที่ไม่ถูกต้องต้องถูกปฏิเสธก่อน Insert | 1 |
| BR-10 | ใน Sprint 2 การ Cancel/No-show ทำได้เฉพาะสถานะที่อนุญาต และต้องเก็บประวัติ | 2 |
| BR-11 | ใน Sprint 2 ห้าม Assign โต๊ะที่นั่งไม่พอหรือถูกใช้งาน โดยไม่อนุญาตให้ข้าม FIFO ตามอำเภอใจ | 2 |
| BR-12 | State Transition และ Queue Event ต้องบันทึกใน Transaction เดียวกัน; Fail แล้ว DB ไม่เปลี่ยน | 1–3 |


## A.6 Non-Functional Requirements (NFR)

ค่าเป้าหมายเป็นข้อเสนอของทีมเพื่อใช้ตรวจวัดจริง หากปรับค่า ต้องบันทึกเหตุผลและเวอร์ชันที่แก้

| ID | เป้าหมายที่วัดได้ | วิธีทดสอบ / หลักฐาน | Sprint |
| :---- | :---- | :---- | :---- |
| NFR-01 | Protected API ที่ทดสอบทุกกรณีต้องคืน 401/403 เมื่อไม่มีสิทธิ์และไม่เปิดเผยข้อมูลส่วนตัว | API Integration Tests: Anonymous, Customer, Unassigned Host | 1–3 |
| NFR-02 | ข้อมูล Ticket และ Event ต้องยังอ่านได้หลัง Restart Application โดยใช้ DB เดิม | Restart + API/DB Retrieval; ทวนสอบบน GCP ใน Lab 5 | 1, Lab 5 |
| NFR-03 | จำลอง Join พร้อมกันอย่างน้อย 30 คำขอจากลูกค้าต่างบัญชีแล้ว ticketNo ไม่ซ้ำ | Concurrent PostgreSQL Integration Test ตรวจ Unique และ Counter | 1 |
| NFR-04 | GET /api/queues และ /api/me/entries p95 ≤ 1000 ms สำหรับ 100 Tickets / 20 Requests หลัง Warm-up | วัดจริงและบันทึก Environment, Tool, Time | 3 |
| NFR-05 | Password เก็บเป็น Argon2id Hash, Session Token เก็บเฉพาะ Hash, ไม่มี Secrets จริงใน Repo | ตรวจ Seed/DB/Repo และ Security Test | 1 |
| NFR-06 | Error 400/401/403/404/409 คืน Code และข้อความชัดเจนตาม API Contract | Negative API Tests + UI Error Evidence | 1–3 |
| NFR-07 | Flow Join, Call Next, Complete ใช้งานผ่าน Keyboard ได้ | Manual Keyboard Checklist พร้อมผลจริง | 3 |


## A.7 สมมติฐานและการตัดสินใจ

| ID | ข้อสมมติ / การตัดสินใจของทีม | สถานะ |
| :---- | :---- | :---- |
| DEC-01 | Sprint 1 ใช้ร้านตัวอย่างหนึ่งสาขา, Queue หนึ่งรายการ และจุดเรียกหนึ่งจุด | เสนอ |
| DEC-02 | กลุ่มลูกค้า 1–8 คนต่อ Ticket; ยังไม่มีระบบจองโต๊ะล่วงหน้า | เสนอ |
| DEC-03 | เลขคิวเพิ่มต่อ Queue ไม่ Reset รายวันใน Sprint 1 | เสนอ |
| DEC-04 | COMPLETED หมายถึงรับลูกค้าเข้าร้านแล้ว ไม่ใช่กินอาหารเสร็จ | เสนอ |
| DEC-05 | FIFO เรียกตามเลขคิวน้อยที่สุดก่อนโดยไม่ดูขนาดโต๊ะใน Sprint 1 | เสนอ |
| DEC-06 | Sprint 2 เพิ่มโต๊ะและ No-show ผ่าน Contract/Migration ใหม่ ไม่แก้ History เก่า | รอทบทวน |


ประเด็นที่ต้องยืนยันกับ TA: (1) ร้านอาหาร Walk-in เป็นบริบทที่เหมาะสมกับ Theme 9 (2) การทำ Queue แบบหนึ่งสาขา หนึ่งจุดเรียก ใน Sprint 1 เพียงพอ (3) เมื่อเพิ่มโต๊ะใน Sprint 2 จะใช้ FIFO แบบเข้มงวด ไม่ข้ามคิวเพราะจำนวนคนโดยไม่มีนโยบายที่อนุมัติ

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
