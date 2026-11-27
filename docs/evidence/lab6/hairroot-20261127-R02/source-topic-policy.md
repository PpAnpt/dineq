# HR-F01 booking topic policy amendment and retest

**Product decision (26 November 2026):** For the corrected release, a booking topic containing any emoji or emoji-capable symbol is invalid, regardless of its length. This changes the topic policy tested in the original DineQ UAT R01. The R01 evidence and its actual outcomes remain historical records; the new rule applies only after the corrected code is deployed. DineQ must agree to this amended expectation before retesting.

## Contract amendment: BR-08 / AC-15b

- Trim the topic. A non-emoji topic must contain 3–200 Unicode code points after trimming.
- Reject a topic containing an emoji or emoji-capable symbol anywhere, including a bare heart (`❤`), sun (`☀`), copyright sign (`©`), emoji mixed with text, a flag, keycap, modifier, or joined emoji. The server returns HTTP 400 `VALIDATION_ERROR` with `fields.topic = "Topics cannot contain emoji."`.
- Rejection creates no booking and does not consume the selected slot. A valid non-emoji topic continues to return 201 and is stored unchanged except for trimming.
- Ordinary digits, `#`, `*`, Thai text and non-emoji supplementary characters remain allowed when the length rule is satisfied. Recognition uses the JavaScript runtime's Unicode `Emoji` property, except for standalone ASCII digits, `#` and `*`; the combining keycap mark is rejected. The release uses Node 24.

This amendment supersedes only the emoji expectation in the original UAT-07: its three-emoji positive control is **not** a valid positive control for the corrected release. The original UAT-07 result remains a valid record of what happened on `ac0a57b`.

## UAT-07-R02: independent retest on the corrected release

| Item | Requirement |
| --- | --- |
| Tester | DineQ, signed in as a Customer; Specialist prepares fresh, unused slots |
| Version | Record deployed full commit, visible Version footer, and Cloud Run revision before testing |
| Preconditions | Use new 30-minute slots, not the retained 13 Dec R01 bookings 2 and 3. Confirm each slot is Available and note its date/time. Do not delete or reset R01 fixtures. |
| Negative inputs | `🙂🙂`, `🙂🙂🙂`, `ก🙂ข`, `ก❤ข`, `ก☀ข`, `ก©ข`, `🇹🇭`, `1️⃣`, `👨‍👩‍👧` on separate unused slots or repeated against one still-free slot |
| Positive input | `กขค`, `𠮷กข`, or `123 # *` on a separate unused slot |

1. For each negative input, enter the topic and choose **Confirm booking**. Expected: `Topics cannot contain emoji.` appears; no confirmation page opens.
2. Refresh **My bookings**. Expected: no new booking for the rejected slot(s).
3. Reopen **Book** and have the Specialist refresh the schedule. Expected: the rejected slot(s) remain Available.
4. Book the positive-control slot with a non-emoji topic. Expected: a confirmation page opens, the trimmed topic is displayed correctly, and the Specialist sees the slot Booked.
5. Record actual input, UI result, booking/slot state, tester, time, URL, version and screenshots. Mark PASS only if every negative input is rejected without a booking and the positive input succeeds. Record any divergence as FAIL; an unperformed step is BLOCKED.

The original UAT-07 R01 should not be rewritten as PASS. Link its HR-F01 finding, Issue #57, code PR #58, corrected deployment and this R02 result in the Lab 6 report.

