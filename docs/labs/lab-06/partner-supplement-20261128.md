# Partner supplement received 28 November 2026

Source: Siwarak supplied message.txt and lab-06.zip. ZIP SHA-256
b5155d772268cbe6f230ee8da5f016f7b376bda0d271868378a807ee7cdb7bf3.
The ZIP contains 90 files. Extracted/read only; no supplied script executed.

## Owner ticket read-back still missing

Parsed message.txt is structurally identical to the original 27 November
15:54:04–15:54:15 UTC raw DQ-UAT-07 JSON, including WAITING fixture summaries
with completedAt for #22/#23. It has no new Refresh/GET response or later
capture time. It therefore does not satisfy the promised fresh read-only
owner COMPLETED evidence. No original data is changed to manufacture it.
Original baseline-only Accepted and new-release reported PASS 9/9 stay separate.

Full archive recheck on 28 November parsed all 31 JSON files in lab-06.zip:
none contains either #22/#23 owner UUID or ticketNo 22/23. All eight JSON files
in the earlier UAT-DinoQ-Pic-3.zip were also checked: only the known timestamped
raw run and consolidated final report contain these records. Neither is a newly
captured owner Refresh/GET supplement. This conclusion uses content, not just
filenames. No JSON parsing failures occurred.

## Iivo original evidence located and inspected

Partner report maps E-B7/B8/B9 to the following three original PNGs. All three
were visually inspected. Password fields are empty; no credential is disclosed.
Baseline 17c8b90 is the partner report's reference, not proved by the static
Lab 5 text in the images. The image banners attribute tester ไอโว (Iivo).

| Evidence | Actual visible observation | Capture time Bangkok on 26 Nov 2026 |
| --- | --- | --- |
| E-B7 / DQ-ALVIN-A01-anon-my-queue.png | Signed-out My queue leads to login; 401 UNAUTHENTICATED; banner says GET /api/auth/me 401 | 19:33:51.533 |
| E-B8 / DQ-ALVIN-A02-wrong-password-c1.png | customer03 wrong-password attempt; generic 401 INVALID_CREDENTIALS; password empty; banner reports subsequent /auth/me 401 | 19:33:52.604 |
| E-B9 / DQ-ALVIN-A03-unknown-email.png | uat-nobody unknown email; same generic rejection; password empty; banner reports /auth/me 401 | 19:33:53.746 |

These support DQ-UAT-01 steps 1 and 3 only. Although the partner prose says
steps 1 to 3, do not invent a separately evidenced step 2. The additional
retest-results/image review role remains the student's separately reported role.

## Anapat contribution clarification

Siwarak states Anapat has a role like Iivo: review retest results/images. Record
this as user-reported review, with no supplied review time or specific item list.
There is still no record that Anapat executed HairRoot test cases; do not invent
case IDs, execution outcomes or dates, or treat review as proof of the handout's
both-students-execute requirement. Retain existing substantive PR review credit.

Original selected files and SHA-256 manifest:
[supplement evidence](../../evidence/lab6/partner-supplement-20261128).
No live request, ticket mutation, acceptance signature or new test is performed
by this inspection. PDF review copy can incorporate verified Iivo images now.
