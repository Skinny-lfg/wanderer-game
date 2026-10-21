# D.7 — Dual Dagger combat comparison

Date: 2026-10-21  |  Branch: `development`

## Method
Paired synthetic runs using the integrated v0.12 combat harness. Each level uses 16 shared seeds for Dual Daggers and a single Dagger. Epic Leather gear, Blood → Decay → Magic route steering, three comparable Runes, no potions, and declined events. E50 and E200 are normal levels; E201 and E300 are Endless. No saves, network services, or deployed systems were used.

The simulation records aggregate damage dealt and received, Realm reached (out of 15), combat duration, and attack clock cycles. A cycle can contain two distinct dagger impacts; the cycle count is not a count of individual hits.

## Results
| Level | Loadout | Wins / 16 | Mean Realm | Mean damage | Mean damage received | Mean seconds | Mean attack cycles |
|--:|:--|--:|--:|--:|--:|--:|--:|
| E50 | Dual Daggers | 16 | 15 | 36239 | 916 | 33.59 | 117.8 |
| E50 | Single Dagger | 0 | 10.69 | 23524 | 1581 | 31.94 | 113.6 |
| E200 | Dual Daggers | 16 | 15 | 131231 | 2710 | 28.73 | 118.2 |
| E200 | Single Dagger | 0 | 12 | 97001 | 5945 | 32.31 | 130.8 |
| E201 | Dual Daggers | 16 | 15 | 135533 | 3561 | 29.62 | 122.1 |
| E201 | Single Dagger | 0 | 12.19 | 97377 | 6097 | 32.23 | 130.3 |
| E300 | Dual Daggers | 15 | 15 | 214324 | 5558 | 31.97 | 131.7 |
| E300 | Single Dagger | 0 | 11.63 | 145605 | 8501 | 32.81 | 133.1 |

## Interpretation
The off-hand now contributes a distinct half-strength strike during a dagger attack cycle. The separate hit uses the dagger weapon path and can apply its ordinary hit effects; it cannot recursively roll Double Strike. The former Dual Dagger only +30% Endless multiplier is removed. Other weapon and shield Endless bonuses are unchanged.

Detailed paired rows are available in the generated JSON artifact when the simulation is run with an output path. These results compare the weapon configuration only; they do not validate representative E200 character builds (E.1.3 remains separate).

## Validation
The focused equipment, Legendary, and Endless suites pass (45/45). The full project suite reports 11 failures: six E200 reference digests for non-dagger loadouts, four local preview-server tests, and one endgame tier-cap test. All 11 also fail against untouched `development` HEAD. The preview tests are blocked because the sandbox rejects binding to `127.0.0.1` (`EPERM`). The dagger E1/E50/E200 reference traces were refreshed for the new second hit.
