# Wanderer v0.13 C8 — Retirement of invalid historical test harnesses

**Branch**: audit/v013. **Scope**: test-only clean sheet, no gameplay or save migrations.

The three old suites contained 32 cases: 12 previously passing, 20 failing due to 7 retired-rule expectations and 13 incompatible fixtures. Their original text and the complete failure triage remain in the Git history and in [the detailed UI audit](v013-ui-mechanics-audit.md).

C8 physically removed the 20 invalid cases from the active tests instead of marking them skipped. It also removed the obsolete *exhausted passive draft pool* test, which passed in the old helper but represents the retired between-Realm passive offer mechanic. **11 surviving assertions** from the old files were preserved and added to the required current game gate.

| Original suite | Cases before | Preserved after | Removed |
|---|---:|---:|---:|
| `tests/v012-economy.test.cjs` | 8 | 2 | 6 |
| `tests/v0120-equipment.test.cjs` | 15 | 6 | 9 |
| `tests/v012-phase-d-endless.test.cjs` | 9 | 3 | 6 |

The removed intents are not silently discarded. C8 adds `tests/v013-c8-clean-sheet.test.cjs` with current native Dungeon coverage of defeat/Bag, secured overflow, real Boss Rune settlement, two-main-hit offhand cadence, six-second Wand/Orb Barrier and current Camp milestones. Existing v0.13 tests additionally cover crafting receipts, rarity tiers, current route/boss progression, checkpoints, combat, economy and extraction.

**This is not an assertion of full equivalence for all 20 obsolete historical fixtures.** The old exact E200 combat snapshots, legacy guaranteed Boss drop and E225 milestones are intentionally not reproduced because the mechanics no longer exist. The independent native tests preserve current gameplay invariants, not dead behaviour. Historical TAP remains available in the C7 follow-up artifact.

**Closure verified:** The 11 retained tests and all C8 cases ran inside the required `npm run test:v013` (295/295), with full C7 4/4 success on `e9e590ba5ce62bca96e21e1001ca6088613106a7`. The standalone npm scripts remain available for focused reruns; they were not claimed as separately executed.
