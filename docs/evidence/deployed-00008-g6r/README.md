# Screenshots from the deployed service (Cloud Run revision `s21271a0d-00008-g6r`)

Taken by the owner in the browser with the synthetic demo account `customer29@dineq.test` after the deploy of 28 November 2026 (20:52 Asia/Bangkok). The images do not show the address bar or a clock, so the exact capture time is not recorded; the files reached the assistant on 29 November 2026 at 00:07 Asia/Bangkok. No password is visible.

| File | What it shows | What it does not show |
| :-- | :-- | :-- |
| `S2-party-size-11-validation.png` | Queue page, label `Party size (1-10)` (the main queue limit is 10, set by migration 006), value 11 typed, the browser blocks the submit with "Value must be less than or equal to 10." | A server response: the form's `max` attribute stops the request in the browser, so the 400 `INVALID_PARTY_SIZE` of the API is not shown (it is covered by TEST-25 with status codes) |
| `S3-party-size-10-form.png` | The same form with party size 10, ready to submit | The submit itself |
| `S4-ticket-25-waiting-24-cancelled.png` | My queue: Ticket #25, party size 10, WAITING with a Cancel button; Ticket #24, party size 10, CANCELLED (the ticket from the first manual check) | The order and times of the two joins; the numbers 24 then 25 are consistent with a new number after a cancel |
| `S5-ticket-25-cancelled.png` | My queue after the cancel: Ticket #25 CANCELLED and Ticket #24 CANCELLED | The confirmation dialog |
