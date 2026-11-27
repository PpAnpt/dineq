# DineQ 08B owner snapshot comparison

Compared from two DineQ Cloud Shell outputs relayed by the HairRoot user on 26 Nov 2026. This is a transcription and field-by-field comparison of the supplied output, not direct GCP access by the tester. The full original outputs remain with the DineQ operator.

| Check | Before | After | Result |
| --- | --- | --- | --- |
| Revision | `s21271a0d-00005-rdp` | `s21271a0d-l6-1126161809` | Changed |
| Image digest | `sha256:78f53db5fad8092256caf57ef4be872a09286379ab0879ce7487c53223c138b8` | Same | Match |
| DB binding | `true` | `true` | Match |
| Queue status / next ticket | `OPEN` / 18 | `OPEN` / 18 | Match |
| Entries | 17 supplied records | Same 17 records and fields | Match |
| Event count | 49 | 49 | Match |
| Data hash | `1c6c296bf941a8d8ae256ee428004cb0b0899a88cbb58c60069750b4e87bae59` | Same | Match |
| Traffic | 100% | 100% | Match |

The tester's C1/C2 API records and screenshots also matched before/after. The `restart` command was interrupted during its final database verification, after a distinct revision was created. The separate post-interruption snapshot completed that verification without repeating the restart.
