# F-03 Host FIFO Calling & Complete Seating - Sprint 1 Contract

> **Status:** Draft v0.1 (2026-11-04) · CPE334 Theme 9 · DineQ

เป้าหมาย: Host ที่ได้รับมอบหมายดู Waiting List พร้อมเลขคิวและจำนวนคน เรียกเลขถัดไปตาม FIFO แล้วกด Completed เมื่อพาลูกค้าเข้าร้านเรียบร้อย; API: GET /api/queues/:queueId/entries, POST /api/queues/:queueId/call-next, POST /api/entries/:entryId/complete

Main Flow: Host Login → โหลด Waiting List → Call Next โดย Server เลือก ticketNo น้อยที่สุด → CALLED → Complete → COMPLETED พร้อม Event → Customer Refresh แล้วเห็นผล; Reject ไม่มีสิทธิ์, CALLED ค้าง, ไม่มี WAITING, Complete ผิดสถานะ

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-14 / TEST-14 | Assigned Host GET Waiting List; Unassigned Host ลองเช่นกัน | Assigned ได้เรียง FIFO + partySize; Unassigned 403 | API Integration |
| AC-15 / TEST-15 | มี WAITING ticketNo 1/2; Host กด Call Next | ticketNo 1 → CALLED พร้อม Timestamp/Event; No.2 ยัง WAITING | API + DB |
| AC-16 / TEST-16 | มี CALLED ค้างอยู่ แล้วกด Call Next ซ้ำ | 409 UNRESOLVED_CALLED ไม่มีใบใหม่เป็น CALLED | API + DB |
| AC-17 / TEST-17 | Host Complete Ticket ที่ CALLED และ Customer GET อีกครั้ง | COMPLETED + completed_at/Event อยู่ DB และอ่านได้จริง | API + DB |
| AC-18 / TEST-18 | ลอง Complete Ticket ที่ WAITING หรือ COMPLETED | 409 INVALID_TRANSITION; Row/Event ไม่เปลี่ยน | API + DB Boundary |
| AC-19 / TEST-19 | Host ที่ไม่ Assigned ลองดู/เรียก/Complete Queue อื่น | 403 ไม่เปิดข้อมูลและไม่แก้ DB | API + Authorization |
| AC-20 / TEST-20 | Customer ลอง Call Next/Complete | 403 ไม่มีข้อมูลสถานะเปลี่ยน | API + Authorization |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
