# HairRoot R01 - evidence captions for the Lab 6 PDF

Use the captions below with the unchanged source images. The exact time/URL/build context comes from the actual capture records in [run-summary.json](../../evidence/lab6/hairroot-20261126/run-summary.json). These captions do not add a timestamp banner to or otherwise edit an original screenshot. Select relevant material once in the final PDF and use internal evidence/page references.

All dates below are actual capture dates, not the earlier planned session date. The visible build is ac0a57b. Full candidate commit `ac0a57b9eb871128807733a0e9d75d77a662b477` and revision `hairroot-sha-ac0a57b9eb87-44992339630-1` were partner-declared during R01. A later public version check is recorded separately in the [follow-up](follow-up-2026-11-26.md); it does not retroactively authenticate the GCP image/revision for each capture.

## HR-E01-05-R01 - PASS

HR-E01-05-R01. UAT-01 step 5. Captured 2026-11-26T18:11:40.847+07:00 (Asia/Bangkok); UTC 2026-11-26T11:11:40.847Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/4. Observed version: ac0a57b. Actor: C1. Action: Topic `UAT hairline review`, Confirm booking Expected: "Your booking is confirmed." with When, Specialist, Service, Topic, Status Confirmed Actual: Normal topic produced booking 4, Confirmed, with correct date/time/service/Specialist/topic. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E01-05-R01.png)

## HR-E01-06-DETAIL-R01 - PASS

HR-E01-06-DETAIL-R01. UAT-01 step 6. Captured 2026-11-26T18:12:32.050+07:00 (Asia/Bangkok); UTC 2026-11-26T11:12:32.050Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/4. Observed version: ac0a57b. Actor: C1. Action: My bookings, then open the new booking Expected: It is listed and opens with the same details Actual: Booking 4 appeared in My bookings; clicking its link reopened the same details. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E01-06-DETAIL-R01.png)

## HR-E02-04-R01 - PASS

HR-E02-04-R01. UAT-02 step 4. Captured 2026-11-26T18:18:49.874+07:00 (Asia/Bangkok); UTC 2026-11-26T11:18:49.874Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/slots. Observed version: ac0a57b. Actor: C3. Action: Window B: Confirm booking Expected: "Another customer has just taken this time. Please choose another."; T2 is no longer offered for D2 Actual: Stale C3 confirmation showed Another customer has just taken this time. Please choose another.; D2/T2 disappeared. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E02-04-R01.png)

## HR-E02-06-R01 - PASS

HR-E02-06-R01. UAT-02 step 6. Captured 2026-11-26T18:19:21.736+07:00 (Asia/Bangkok); UTC 2026-11-26T11:19:21.736Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings. Observed version: ac0a57b. Actor: C2. Action: Window A: My bookings Expected: C2's booking for D2, T2 is still there with topic `UAT race C2` Actual: C2 list retained the single 11 Dec 16:17 booking with UAT race C2. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E02-06-R01.png)

## HR-E03-08-R01 - PASS

HR-E03-08-R01. UAT-03 step 8. Captured 2026-11-26T18:13:03.685+07:00 (Asia/Bangkok); UTC 2026-11-26T11:13:03.685Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/slots. Observed version: ac0a57b. Actor: C1. Action: Log out; sign in as C1; choose the S1 consultation service, D3, 18:00; topic `ab`; confirm Expected: "Enter a topic of 3 to 200 characters." under the topic; no booking made Actual: ASCII ab rejected with Enter a topic of 3 to 200 characters.; stayed on booking form. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E03-08-R01.png)

## HR-E03-09-R01 - PASS

HR-E03-09-R01. UAT-03 step 9. Captured 2026-11-26T18:13:34.809+07:00 (Asia/Bangkok); UTC 2026-11-26T11:13:34.809Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/slots. Observed version: ac0a57b. Actor: C1. Action: Replace the topic with the 201-character topic; confirm Expected: The same message; no booking made Actual: Exactly 201 ASCII characters rejected with the same topic validation message. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E03-09-R01.png)

## HR-E03-10-R01 - PASS

HR-E03-10-R01. UAT-03 step 10. Captured 2026-11-26T18:14:03.480+07:00 (Asia/Bangkok); UTC 2026-11-26T11:14:03.480Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/5. Observed version: ac0a57b. Actor: C1. Action: Replace it with the 200-character topic; confirm Expected: Booking confirmed; its detail shows the full topic Actual: Exactly 200 source digits accepted as booking 5; detail text equals the complete 200-character input. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E03-10-R01.png)

## HR-E03-11-R01 - PASS

HR-E03-11-R01. UAT-03 step 11. Captured 2026-11-26T18:14:29.263+07:00 (Asia/Bangkok); UTC 2026-11-26T11:14:29.263Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/6. Observed version: ac0a57b. Actor: C1. Action: Choose D3 and 19:00; topic `abc`; confirm Expected: Booking confirmed Actual: ASCII abc accepted as booking 6 at 19:00-19:15. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E03-11-R01.png)

## HR-E04-02-R01 - PASS

HR-E04-02-R01. UAT-04 step 2. Captured 2026-11-26T18:19:41.067+07:00 (Asia/Bangkok); UTC 2026-11-26T11:19:41.067Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/4. Observed version: ac0a57b. Actor: C2. Action: Sign in as C2 and open the copied address Expected: "Booking not found."; no topic, time or name of C1 shown Actual: C2 saw Booking not found. at /bookings/4 with no C1 name/topic/time. Later fresh C1 read-back has identical booking fields. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E04-02-R01.png)

## HR-E04-03-R01 - PASS

HR-E04-03-R01. UAT-04 step 3. Captured 2026-11-26T18:20:03.121+07:00 (Asia/Bangkok); UTC 2026-11-26T11:20:03.121Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/slots. Observed version: ac0a57b. Actor: C2. Action: As C2 open `<URL>/schedule` Expected: C2 is sent to the booking page; no specialist schedule or other customers' bookings shown Actual: C2 /schedule redirected to /slots; no Specialist schedule/private booking list was displayed. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E04-03-R01.png)

## HR-E04-04-R01 - PASS

HR-E04-04-R01. UAT-01 step 3, UAT-04 step 4, UAT-07 step 1. Captured 2026-11-26T17:57:14.621+07:00 (Asia/Bangkok); UTC 2026-11-26T10:57:14.621Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/login. Observed version: ac0a57b. Actor: ANON. Action: Log out; sign in as C1 Expected: "Book an appointment" page opens Actual: S1 was logged out; private C1 login in a separate isolated context opened Book as Anan Suksan (Customer). Result: PASS. Action: Log out; without signing in open `<URL>/bookings` Expected: The sign-in page is shown Actual: Signed-out /bookings redirected to /login without private booking details. Result: PASS. Action: Sign in as S1; add T7A and T7B on D7 to Hair transplant consultation, each 30 minutes; log out Expected: "Time added." for each; both Available Actual: S1 added both fresh 13 Dec 30-minute fixtures, T7A 16:27 and T7B 17:27, then logged out. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E04-04-R01.png)

## HR-E04-05-R01 - PASS

HR-E04-05-R01. UAT-04 step 5. Captured 2026-11-26T18:23:22.706+07:00 (Asia/Bangkok); UTC 2026-11-26T11:23:22.706Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/schedule. Observed version: ac0a57b. Actor: S2 Dr. Nida Wongsa. Action: Sign in as S2; open the Service list on "My schedule" Expected: Only S2's own service is listed; none of S1's bookings or customer names appear Actual: S2 Dr. Nida sees only its consultation schedule option 3; no S1 Customer names or test topics. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E04-05-R01.png)

## HR-E05-01-DETAIL-R01 - PASS

HR-E05-01-DETAIL-R01. UAT-04 step 2, UAT-05 step 1. Captured 2026-11-26T18:26:54.534+07:00 (Asia/Bangkok); UTC 2026-11-26T11:26:54.534Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/4. Observed version: ac0a57b. Actor: C1. Action: Sign in as C2 and open the copied address Expected: "Booking not found."; no topic, time or name of C1 shown Actual: C2 saw Booking not found. at /bookings/4 with no C1 name/topic/time. Later fresh C1 read-back has identical booking fields. Result: PASS. Action: Sign in as C1 in a fresh private window; open My bookings Expected: The UAT-01 booking is listed with the same date, time and topic Actual: New Chrome process/isolated context with private C1 login listed booking 4 and reopened identical details. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E05-01-DETAIL-R01.png)

## HR-E06-02-R01 - PASS

HR-E06-02-R01. UAT-06 step 2. Captured 2026-11-26T17:57:30.883+07:00 (Asia/Bangkok); UTC 2026-11-26T10:57:30.883Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/login. Observed version: ac0a57b. Actor: unknown email nobody@hairroot.test. Action: Unknown email `nobody@hairroot.test` with any password Expected: The same message (does not reveal whether the account exists) Actual: Unknown email displayed the identical generic invalid-credentials message. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E06-02-R01.png)

## HR-E06-04-R01 - PASS

HR-E06-04-R01. UAT-04 step 1, UAT-06 step 4. Captured 2026-11-26T18:15:39.415+07:00 (Asia/Bangkok); UTC 2026-11-26T11:15:39.415Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/login. Observed version: ac0a57b. Actor: C1 signed out. Action: Sign in as C1, open one of C1's bookings, copy its address, log out Expected: (setup step; no expected result stated in HairRoot's source) Actual: Recorded C1-owned /bookings/4 and its details, then C1 logged out. Result: PASS. Action: Log out; press Back; reload Expected: The sign-in page, not C1's data Actual: C1 logout, Back and reload ended at login with no C1 details. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E06-04-R01.png)

## HR-E07-02-AFTER-R01 - FAIL

HR-E07-02-AFTER-R01. UAT-07 step 2. Captured 2026-11-26T18:03:39.945+07:00 (Asia/Bangkok); UTC 2026-11-26T11:03:39.945Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/2. Observed version: ac0a57b. Actor: C3 Krit Boonmee. Action: Sign in as C3; select the same service, D7, T7A; enter `🙂🙂`; Confirm booking Expected: "Enter a topic of 3 to 200 characters."; confirmation page does not open; T7A stays available Actual: Two symbols 🙂🙂 unexpectedly confirmed booking 2 at T7A; the required rejection message did not appear. Result: FAIL.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E07-02-AFTER-R01.png)

## HR-E07-02-INPUT-R01 - FAIL

HR-E07-02-INPUT-R01. UAT-07 step 2. Captured 2026-11-26T18:03:12.050+07:00 (Asia/Bangkok); UTC 2026-11-26T11:03:12.050Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/slots. Observed version: ac0a57b. Actor: C3 Krit Boonmee. Action: Sign in as C3; select the same service, D7, T7A; enter `🙂🙂`; Confirm booking Expected: "Enter a topic of 3 to 200 characters."; confirmation page does not open; T7A stays available Actual: Two symbols 🙂🙂 unexpectedly confirmed booking 2 at T7A; the required rejection message did not appear. Result: FAIL.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E07-02-INPUT-R01.png)

## HR-E07-02-PERSISTED-R01 - FAIL

HR-E07-02-PERSISTED-R01. UAT-07 step 2. Captured 2026-11-26T18:06:04.703+07:00 (Asia/Bangkok); UTC 2026-11-26T11:06:04.703Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/2. Observed version: ac0a57b. Actor: C3. Action: Sign in as C3; select the same service, D7, T7A; enter `🙂🙂`; Confirm booking Expected: "Enter a topic of 3 to 200 characters."; confirmation page does not open; T7A stays available Actual: Two symbols 🙂🙂 unexpectedly confirmed booking 2 at T7A; the required rejection message did not appear. Result: FAIL.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E07-02-PERSISTED-R01.png)

## HR-E07-03-R01 - FAIL

HR-E07-03-R01. UAT-07 step 3. Captured 2026-11-26T18:04:12.956+07:00 (Asia/Bangkok); UTC 2026-11-26T11:04:12.956Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings. Observed version: ac0a57b. Actor: C3 Krit Boonmee. Action: Open My bookings, then return to Book Expected: No booking for D7/T7A Actual: My bookings listed the invalid two-symbol T7A booking instead of having no such entry. Result: FAIL.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E07-03-R01.png)

## HR-E07-04-AFTER-R01 - PASS

HR-E07-04-AFTER-R01. UAT-07 step 4. Captured 2026-11-26T18:05:42.749+07:00 (Asia/Bangkok); UTC 2026-11-26T11:05:42.749Z. URL: https://hairroot-368003298307.asia-southeast1.run.app/bookings/3. Observed version: ac0a57b. Actor: C3 Krit Boonmee. Action: Choose the same service, D7, T7B; enter `🙂🙂🙂`; confirm; log out Expected: Booking confirmed; detail shows the three symbols unchanged Actual: Three symbols 🙂🙂🙂 confirmed separate booking 3, unchanged after reload; C3 later logged out. Result: PASS.

Image: [original PNG](../../evidence/lab6/hairroot-20261126/HR-E07-04-AFTER-R01.png)
