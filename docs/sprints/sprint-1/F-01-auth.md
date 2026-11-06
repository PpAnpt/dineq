# F-01 Authentication & Role Protection - Sprint 1 Contract

> **Status:** Draft v0.2 (2026-11-06) · CPE334 Theme 9 · DineQ

เป้าหมาย: Customer และ Host Login/Logout ได้อย่างปลอดภัย Backend ตรวจ Role/Session ได้; UI มี Login Form, Loading, Error และ Redirect ตาม Role; Data ได้แก่ users/sessions

Main Flow: Login → Server ตรวจ Argon2id Hash → ออก HttpOnly Session → GET /auth/me คืน Role → ใช้ API ตามสิทธิ์ → Logout เพิกถอน Token; Invalid Login/Expired/Unauthenticated/Forbidden ต้องถูกปฏิเสธ

| AC / Test ID | เงื่อนไข / Test Input | Expected Result | Test Level |
| :---- | :---- | :---- | :---- |
| AC-01 / TEST-01 | Customer/Host ที่ Seed ไว้ Login ด้วยรหัสถูกต้อง | 200, Session Cookie, Role จาก Server ถูกต้อง | API Integration |
| AC-02 / TEST-02 | Email/Password ไม่ถูกต้อง | 401 ไม่มี Session ใช้งานได้ | API Integration |
| AC-03 / TEST-03 | Login แล้ว GET /auth/me และทดสอบ Session Expire | User ตรง; Expire แล้วคืน 401 | API Integration |
| AC-04 / TEST-04 | Logout แล้วใช้ Cookie เดิมเรียก /auth/me | 401 และ Session ถูกเพิกถอน | API Integration |
| AC-05 / TEST-05 | ไม่ Login แล้วเรียก Endpoint ที่ Protected | 401 ไม่มีข้อมูลส่วนตัวรั่วไหล | API Integration |
| AC-06 / TEST-06 | Customer เรียก Host-Only Endpoint | 403 ไม่มีการเปลี่ยน DB | API Integration |
| AC-22 / TEST-22 | Request ที่เปลี่ยนข้อมูล (POST) ส่ง Header Origin ที่ไม่ตรง APP_ORIGIN | 403 ORIGIN_NOT_ALLOWED ไม่มีการเปลี่ยน DB | API Integration |

## Revision History

| Version | Date | Change |
| :---- | :---- | :---- |
| v0.1 | 2026-11-04 | Initial draft, committed before implementation |
| v0.2 | 2026-11-06 | Add AC-22/TEST-22 (Origin check on mutating requests) to cover the CSRF rule in system-sds C.7 |
