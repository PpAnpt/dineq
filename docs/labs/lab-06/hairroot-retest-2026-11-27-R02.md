# HairRoot corrected-release retest - 27 November 2026, R02

Tracking: [#48](https://github.com/PpAnpt/dineq/issues/48), [#51](https://github.com/PpAnpt/dineq/issues/51).
**Requested scope: UAT-07-R02 PASS and UAT-05 step 4 PASS.** Nine of nine negative inputs were rejected; one separate non-emoji positive control succeeded. Three post-deployment role observations support retained booking 4. This is a targeted follow-up, not a full-suite rerun or final team acceptance.

## Version, source and participation

- Product URL: https://hairroot-368003298307.asia-southeast1.run.app.
- Full commit: `cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d`; observed footer `cbaf1ba`. Public `/api/version` returned HTTP 200 with this commit at both `2026-11-27T10:00:09.567Z` and `2026-11-27T10:13:45.094Z`. [Original version responses and observations](../../evidence/lab6/hairroot-20261127-R02/run-summary.json) retain the exact times.
- Revision `hairroot-sha-cbaf1baa38a5-45975306714-2` and deployment time 27 November 16:44 Asia/Bangkok were supplied by HairRoot. This task did not independently query authenticated GCP revision/image metadata.
- Source: [partner policy at the tested commit](https://github.com/alvin777777/hairroot/blob/cbaf1baa38a5b20c98b006f6f6effbe0f2e3f39d/docs/labs/lab-06/HR-F01-topic-policy.md), preserved [verbatim](../../evidence/lab6/hairroot-20261127-R02/source-topic-policy.md). The student requested retest under the agreed amended rule: reject emoji/emoji-capable symbols anywhere, including a three-emoji string. Original R01 expected the three-emoji control to succeed; that historical expectation/result is not changed.
- Fix chain: [HR-F01](hairroot-finding-HR-F01.md), HairRoot [Issue #57](https://github.com/alvin777777/hairroot/issues/57), [fix PR #58](https://github.com/alvin777777/hairroot/pull/58), [release PR #59](https://github.com/alvin777777/hairroot/pull/59), followed by the partner readiness notice and observed corrected live version above.
- Tester/operator: **Siwarak Chatvichai, 67070501086 / BBINGOAL** requested execution, entered C1/S1/C3 credentials privately and confirmed successful logins. Codex assisted the recorded UI actions using Chrome/Playwright. All 22 selected R02 images are original Playwright page screenshots, including a fresh C1 login/read/capture at the student's request. The earlier native C1 capture remains local and is excluded from the selected package. Anapat execution is not recorded. No signature, second-student execution or final independent acceptance is supplied by this retest.
- Observation interval including the requested C1 Playwright recapture: **2026-11-27T17:00:09.567+07:00 to 2026-11-27T17:24:08.584+07:00** (Asia/Bangkok); UTC timestamps are retained per evidence record. The C1 recapture independently checked `/api/version` as HTTP 200 with the same full commit. C1 was captured after deployment, not represented as a new pre-deploy observation.

## UAT-07-R02 actual results

S1 created two fresh 30-minute Somchai consultation times on **16 December 2026**, 19 days ahead: negative 16:43-17:13 and positive 17:43-18:13 Bangkok. Both were initially Available. Old R01 fixtures were retained. The policy expressly permits repeated negatives on the same still-free slot.

Every negative used **16:43**, pressed Confirm booking, displayed **Topics cannot contain emoji.**, stayed on `/slots`, and did not open a confirmation. The full C3 My bookings text after all nine attempts exactly matched its ready baseline. C3 still saw the time offered; S1 refreshed and still saw it Available.

| Exact negative input | Result | Capture Bangkok time (27 Nov) | Evidence |
| --- | --- | --- | --- |
| 🙂🙂 | PASS | 17:09:40.830 | [HR-E07-NEG-01-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-01-R02.png) |
| 🙂🙂🙂 | PASS | 17:10:09.151 | [HR-E07-NEG-02-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-02-R02.png) |
| ก🙂ข | PASS | 17:10:18.149 | [HR-E07-NEG-03-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-03-R02.png) |
| ก❤ข | PASS | 17:10:26.665 | [HR-E07-NEG-04-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-04-R02.png) |
| ก☀ข | PASS | 17:10:48.612 | [HR-E07-NEG-05-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-05-R02.png) |
| ก©ข | PASS | 17:10:57.097 | [HR-E07-NEG-06-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-06-R02.png) |
| 🇹🇭 | PASS | 17:11:05.474 | [HR-E07-NEG-07-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-07-R02.png) |
| 1️⃣ | PASS | 17:11:27.141 | [HR-E07-NEG-08-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-08-R02.png) |
| 👨‍👩‍👧 | PASS | 17:11:35.515 | [HR-E07-NEG-09-R02](../../evidence/lab6/hairroot-20261127-R02/HR-E07-NEG-09-R02.png) |

The positive-control input was `  123 # *  ` (two leading/trailing spaces), on the separate **17:43-18:13** slot. It created **booking 14**, displayed the trimmed `123 # *`, Status Confirmed and the correct date/service/Specialist. Reload retained those fields. S1 then saw the positive slot Booked under Krit and the negative slot still Available.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Before / after rejected requests | Identical C3 booking list, no additional rejected-slot booking | HR-E07-C3-BEFORE-READY-R02 / HR-E07-C3-AFTER-NEGATIVES-R02 |
| Customer availability | 16:43 and 17:43 still offered after negatives | HR-E07-C3-SLOTS-UNCHANGED-R02 |
| Specialist availability | Both fresh slots still Available after negatives | HR-E07-SLOTS-BEFORE-R02 / HR-E07-S1-AFTER-NEGATIVES-R02 |
| Valid input / trimmed persistence | Booking 14 Confirmed; `123 # *` retained after reload | HR-E07-POSITIVE-INPUT-R02 / HR-E07-POSITIVE-CONFIRMED-R02 / HR-E07-POSITIVE-PERSISTED-R02 |
| Final Specialist state | Negative Available; positive Booked under Krit with `123 # *` | HR-E07-S1-FINAL-R02 |

Evidence IDs resolve to original `.png` and sanitized `.json` files in the [R02 evidence directory](../../evidence/lab6/hairroot-20261127-R02). No booking HTTP 400/201 response was captured; those are contract expectations, not claimed runtime HTTP observations. The recorded result is the UI outcome and independent role/list read-back.

## UAT-05 step 4: actual post-deployment persistence

Before evidence is the retained **26 November 18:26:54.534 Bangkok** [booking-4 image](../../evidence/lab6/hairroot-20261126/HR-E05-01-DETAIL-R01.png) on `ac0a57b`. The partner announced an actual corrected deployment; the new live full commit was observed. The after checks repeat the relevant C1/C3/S1 observations on that corrected release.

| Role / observation | Actual after deployment | Result / evidence |
| --- | --- | --- |
| C1 opens `/bookings/4` | Thu 10 Dec 16:07-16:37; Dr. Somchai Prasert; Hair transplant consultation; UAT hairline review; Confirmed. All five visible fields match the original record | PASS / HR-E05-C1-PLAYWRIGHT-R02 |
| C3 opens S1 consultation availability | Thu 10 Dec / 16:07 not offered; retained booked time cannot be selected | PASS / HR-E05-C3-AFTER-R02 |
| S1 refreshes schedule | Thu 10 Dec 16:07-16:37 still Booked under Anan, UAT hairline review; also retained in final schedule | PASS / HR-E05-S1-AFTER-R02, HR-E07-S1-FINAL-R02 |

[Machine comparison](../../evidence/lab6/hairroot-20261127-R02/c1-before-after-comparison.json) records the fields and three supporting role observations. **Booking 4 was read only**: no edit, cancellation, deletion, reseed or recreation. Old Unicode bookings 2/3 were not modified.

## Disposition, retained data and remaining work

HR-F01 is **retest PASS on the corrected policy/version** within this scope. The former UAT-05 step-4 blocker is resolved by the above post-deployment observations. Keep [R01](hairroot-run-2026-11-26-R01.md) unchanged: 5 PASS / 1 FAIL / 1 BLOCKED cases, 39 PASS / 3 FAIL / 1 BLOCKED steps. Do not relabel those historical counts as a fully rerun green suite or combine different-version rows without their dates.

Two new synthetic slots and one new booking (14) remain as evidence. All old fixtures were retained. C1/S1/C3 were logged out and their test browsers closed. There was no partner source change, cloud/deployment operation or direct partner message by this task.

An early C3 baseline capture showed Loading and was excluded from the selected proof; the later READY record supplies the baseline. A local checker output-encoding issue was fixed before validation and is not a product failure. The [SHA-256 manifest](../../evidence/lab6/hairroot-20261127-R02/sha256-manifest.json) verifies selected bytes.

Remaining Lab6 work includes the students' actual participation records and independent version-bound acceptance decisions, plus the separate DineQ TA/exercise dependency and final report. No new product defect was observed in these requested checks. The local DOCX/PDF working draft must incorporate this follow-up before submission; this evidence does not claim that draft is already final.
