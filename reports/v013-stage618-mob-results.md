# Wanderer v0.13 — Stage 6.18: native normal-mob balance IMPLEMENTED

**Date:** 2026-11-21. **PR:** https://github.com/Skinny-lfg/wanderer-game/pull/115. **Final successful CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44912112430.

## Scope and implementation

`online/v013-enemy-roster.js` now changes actual gameplay for normal groups **above four mobs**:
- Keeps the **1/2/3/4-mob native roster and scales unchanged**, including the E1 opening.
- Adds **2–3 principal roles at 5–6 mobs**; three at 8; 3–4 for larger swarms while remaining Minion-heavy. Principals remain in four visible slots.
- Keeps two different principal roles initially, then lets later ones repeat based on **the Realm-specific role weights**, preserving Aegis Tanks, Magic Casters and Fury Skirmishers.
- Replaces the discontinuous 6+ scaling for **principal Tanks/Casters/Skirmishers only** with gradual target curves: count 6 **HP 0.53 / ATK 0.45 / DEF 0.70**; count 12 **0.40 / 0.34 / 0.64**; count 20+ **0.29 / 0.25 / 0.60**, interpolated between counts. Minion stats are unchanged. No global enemy multiplier and no changes to Elite or Boss mechanics.
- Original historical Stage 6.17 roster is reconstructed byte-for-byte inside the test VM as the control, not shipped as obsolete live gameplay code.

## Completed native regression — final tuned version

**96 matched ten-arm (five group sizes × original/new) native scenarios = 960 actual fights; 96/96 strict same player, legal Talents, original rolled Rare gear, Realm, Risk 1, starting HP/MP, Condition and seed parity checks passed**. The initial 480-fight pilot is a **subset of these 960 fights**, not additional data. Six Affinities × E5/E15/E35/E70 synthetic legal point budgets × two profile policies × two seed starts.

| Initial normal mobs | Old wins | New wins | Old median damage received | New median damage received | New mean principal roles |
|---:|---:|---:|---:|---:|---:|
| 4 | 95/96 | 95/96 | 99 | **99** | 2.43 |
| 6 | 96/96 | 95/96 | 22 | **78** | 2.54 |
| 8 | 96/96 | 96/96 | 25.5 | **83** | 3.00 |
| 12 | 96/96 | 95/96 | 34 | **79.5** | 3.25 |
| 20 | 96/96 | 96/96 | 44 | **69.5** | 3.53 |

The 6-mob / 4-mob median damage ratio is now **78.8%** rather than 22.2%. It does **not** establish perfectly monotonic difficulty (20-mob medians remain below 4/6/8/12), but the huge 4→6 inversion is substantially reduced. The normal-mob win-rate ceiling persists at high synthetic E tiers, so median damage is the more informative measure.

### E5 (12 legal synthetic Talent points, not naturally earned)

| Initial normal mobs | Original wins | Updated wins | Original median damage | Updated median damage |
|---:|---:|---:|---:|---:|
| 4 | 23/24 | **23/24** | 132 | **132** |
| 6 | 24/24 | **23/24** | 34 | **108.5** |
| 8 | 24/24 | **24/24** | 39 | **131** |
| 12 | 24/24 | **23/24** | 48.5 | **124** |
| 20 | 24/24 | **24/24** | 68.5 | **110.5** |

**All five predeclared Stage 6.18 acceptance checks passed** on the final full cohort: E5 6-mob player survival >=80%; E5 6-mob wins not more than 12 percentage points below E5 four-mob wins; six-mob damage >=60% of four-mob damage; 2+ principal roles at six and larger; valid positive roster health and no stat overflow.

### Independent earned-account E1/E2 safety smoke

Four genuine E1 native accounts, weak Common starter gear, no initial permanent talent points and native agent actions, were executed using the Stage 6.11 real-account runner. **11 real combat rooms**, zero Boss encounters, three Elite encounters. **0/4 accounts reached E2 within the capped two attempts per account**. They did not demonstrate regression from this change because 1–4 mob encounters are unchanged and no matched natural pre/post campaign was executed. **E1 progress remains a separate unresolved bottleneck**; do not claim Stage 6.18 fixed it or extrapolate these four non-independent adaptive profiles.

## Tests and safety

- Final GitHub Actions pilot + full workflow https://github.com/Skinny-lfg/wanderer-game/actions/runs/44912112430 **success**.
- Stage 8.0 roster determinism / affinity distributions; Stage 6.17 historical baseline parity; new Stage 6.18 live-vs-baseline 10-arm checks; Stage 8.1 mob abilities, Stage 8.2 Elites, Stage 8.4 Bosses, and real native integration all passed in the successful targeted workflow.
- No change to Elite/Boss data, loot, TalentGraph, consumables, maps, UI, artwork, saves, Firebase or `main`. No deploy.
- Final full raw JSON, per-arm Markdown and earned-account E1/E2 evidence are saved in CI artifact `stage618-full-960-native-mobs-and-earned-e1-e2` (artifact ID 14710177431).
- First implementation calibration failed the >=60% damage threshold at 57.5/99 = 58.1%; second targeted principal-role retuning passed. Never misattribute the earlier failed tuning's results to the final source.

## Next

Stage 6.19: individually address the eight named Elites and their per-E scaling, preserving early E5 survival; Stage 6.20: prepared Boss balance. The E1 earned-account progression bottleneck deserves its own targeted fix before final release testing. For large swarms, review their intended role and encounter frequency in a future checkpoint rather than raising every enemy globally.
