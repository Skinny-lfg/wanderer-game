# Wanderer v0.13 — Stage 6.17 COMPLETE: isolated native 4→6 mob difficulty study

**Executed:** 2026-11-21. **CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44908515780 (**success**, pilot and full). **PR:** https://github.com/Skinny-lfg/wanderer-game/pull/114.

**Full evidence:** 6 Realms × 4 legal synthetic point budgets (E5/12, E15/24, E35/36, E70/60) × 2 player profiles × 4 new seeded starts = **192 matched five-way native player states**, **960 genuine combats**. All **192/192 strict player/gear/Talents/Realm/Risk/Condition/seed checks passed**. The earlier pilot 480 fights was *contained* in the full 960; do not add it separately.

## Full matrix: actual outcomes

| Condition | Player wins | Win % | Median damage taken | Median roster HP | Median roster attack | Mean Minions |
|---|---:|---:|---:|---:|---:|---:|
| 4 native mobs | 188/192 | **97.9%** | **98** | 1369 | 48 | 1.53 |
| 6 native mobs | 192/192 | **100%** | **24** | 990 | 23 | 4.79 |
| 6 mobs: 3 principal roles only | 192/192 | **100%** | **44.5** | 1331 | 32 | 3 |
| 6 mobs: small-group scaling only | 192/192 | **100%** | **48** | 1149 | 32 | 4.79 |
| 6 mobs: both changes | 176/192 | **91.7%** | **119.5** | 1793 | 55.5 | 3 |

**Strong causal signal:** composition-only and scaling-only each increase the six-mob median damage from 24 to ~45–48, but neither restores the four-mob median (98). Combining both raises damage to 119.5 and produces a 91.7% overall victory rate.

## By controlled E/point tier

| Synthetic tier | 4 native | 6 native | 6 composition only | 6 scaling only | 6 both |
|---|---|---|---|---|---|
| E5 / 12 | 44/48 (91.7%), damage 139.5 | 48/48 (100%), damage 35 | 48/48 (100%), damage 71.5 | 48/48 (100%), damage 67 | 33/48 (68.8%), damage 174.5 |
| E15 / 24 | 48/48 (100%), damage 103.5 | 48/48 (100%), damage 24.5 | 48/48 (100%), damage 42.5 | 48/48 (100%), damage 49.5 | 47/48 (97.9%), damage 124.5 |
| E35 / 36 | 48/48 (100%), damage 75.5 | 48/48 (100%), damage 16.5 | 48/48 (100%), damage 28 | 48/48 (100%), damage 29.5 | 48/48 (100%), damage 93 |
| E70 / 60 | 48/48 (100%), damage 63 | 48/48 (100%), damage 6 | 48/48 (100%), damage 19 | 48/48 (100%), damage 28.5 | 48/48 (100%), damage 91 |

**E5 gate:** the combined trial drops player wins to **33/48 (68.8%)** against six mobs, versus **44/48 (91.7%)** against four native mobs. This is close to the provisional **60–70% Elite target** and potentially too punishing for a normal room at low level. It is **not safe** to copy the combined rule directly into gameplay without calibration.

## Per-Realm overall results

| Realm | 4 native wins | 6 native wins | 6 combined wins | 4 damage | 6 native damage | 6 combined damage |
|---|---:|---:|---:|---:|---:|---:|
| blood | 96.9% | 100% | **93.8%** | 74.5 | 16.5 | 92 |
| decay | 100% | 100% | **96.9%** | 122 | 27 | 160.5 |
| vitality | 96.9% | 100% | **93.8%** | 169 | 36.5 | 230 |
| aegis | 100% | 100% | **93.8%** | 97.5 | 17.5 | 121.5 |
| fury | 93.8% | 100% | **93.8%** | 82 | 22 | 106.5 |
| magic | 100% | 100% | **78.1%** | 95 | 32.5 | 114 |

Magic is the most sensitive to the combined variant in this cohort (**78.1%** player wins overall), although per-Realm pooled results can hide E-tier imbalance. Use matched per-Realm/E5 gates when choosing a live rule.

## Decision and exact next implementation gate

1. **Do not implement either isolated change alone as the full solution:** six mobs are still much less threatening than four in damage taken, although both are measurable improvements.
2. **Do not copy the maximum combined variant as-is:** it causes 15/48 E5 deaths, and the Magic Realm may be disproportionately affected. Normal groups should stay clearly easier than serious Elites.
3. **Stage 6.18 should start implementing a calibrated native roster rule** in `online/v013-enemy-roster.js` after a short, targeted E5/Magic/E1–E2 comparison. Candidate: introduce a smoother principal/Minion mix and intermediate principal role scaling near the 4→6 threshold, **without adding blanket HP/ATK multipliers**.
4. Regression gates for the live change: native sizes **1/2/3/4/6/8/12/20**, six Affinities, E5 and naturally earned E1/E2 survival, and solo/Elite/Boss hierarchy. Only after passing these tests merge the gameplay code into the canonical development branch. **No production deploy.**

## What was actually changed in Stage 6.17

- Added a *diagnostic-only* isolated VM module-override hook in `scripts/simulate-progression.cjs`, a five-arm audit runner, tests, native CI workflow and reports.
- No gameplay code, enemy data, HP/Attack numbers, game art, saves, Talents, Firebase or production `main` were modified.
- Experimental source hashes are recorded in the full native JSON and Markdown artifacts under `stage617-full-960-native-4to6-ablation-fights`. Trial rules are not live game rules.
- All point budgets and rolled Rare gear are synthetic legal fixtures, not naturally earned player progression. The pilot is included in the full sample.
