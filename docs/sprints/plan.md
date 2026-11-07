# PART D — Three-Sprint Plan | 5 คะแนน

> **Status:** Draft v0.1 (2026-11-04) · CPE334 Theme 9 · DineQ

| Sprint | Feature IDs | ผลลัพธ์ที่ต้องเสร็จ | กำหนด |
| :---- | :---- | :---- | :---- |
| Sprint 1 | F-01, F-02, F-03 | Login + Join พร้อม partySize + FIFO Call + Complete + DB/Tests + Reviewed PR/Tag | 8 พ.ย. |
| Sprint 2 | F-04, F-05, F-06 | Cancel, No-show, โต๊ะและความจุ, Multiple Queues; Tested Release | 29 พ.ย. |
| Sprint 3 | F-07, F-08, F-09 | History, Reporting, UX, Security/Performance/Regression, Final Release | 13 ธ.ค. |


Dependency: F-01 Authentication → F-02 Join → F-03 Host Call/Complete → F-04 Cancellation / F-05 No-show & Seating / F-06 Restaurant Configuration → F-07 History / F-08 Reporting / F-09 Hardening

## D.1 แผนแบ่งงานทีม 2 คน

| ช่วงงาน | สมาชิกคนที่ 1 (Lead) | สมาชิกคนที่ 2 (Lead) |
| :---- | :---- | :---- |
| Requirements/Design | ร่วม SRS, Review SDS/DB และ Traceability | ร่วม SRS, ออกแบบ DB/Role/FIFO และ Review Contracts |
| Implementation | F-01 Auth, Customer UI, Join API บางส่วน | F-02 DB Transaction, F-03 Host UI/API |
| Testing & Review | Auth/Ownership Tests และ Review PR ของเพื่อน | Concurrency/FIFO/Transition Tests และ Review PR ของเพื่อน |
| Release & Evidence | ร่วม Integrate/Test, เอกสาร Part F, Demo | ร่วม Integrate/Test, Tag/Commit, Demo |


ทั้งสองคนต้องร่วมกันออกแบบ เขียน Test/Code ตรวจ PR และสามารถอธิบายระบบได้ ไม่แบ่งเป็นผู้เขียนเอกสารกับผู้เขียนโค้ดอย่างถาวร

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
