# Wanderer v0.13 — Stage 6.19 COMPLETE: eight separately scaled native Elites

**Date:** 2026-11-21. **PR:** https://github.com/Skinny-lfg/wanderer-game/pull/116. **Successful revised native CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44915195931.

## What was actually implemented

`online/v013-elite-abilities.js` now defines **eight distinct early E6–E35 and late E36–E70 HP/Attack/Defense bonus curves**. `combat/v012-combat-runtime.js` applies the curves only to the actual spawning named Elite. The hard-coded, native base archetypes, abilities and cooldowns remain unchanged; E1–E5 deliberately return exactly `{hp:1,atk:1,def:1}`, verified by **every E5 battle** matching its historical original in stats, win/loss, damage taken and duration. The gains stop increasing at E70, avoiding unbounded scaling.

This is real gameplay code, **not only simulator coefficients**. Normal mobs, final Bosses, player Talents, potions, loot, Realm maps, artwork, save format, Firebase and production remain unchanged. The old runtime is reconstructed byte-for-byte only inside the native diagnostic VM for comparisons.

## Complete native validation

- **96 distinct native matched hero configurations** (6 Realms × 4 legal synthetic E/point budgets E5/12, E15/24, E35/36, E70/60 × 2 valid strategic profiles × 2 seeds), **eight forced named Elites**, **two runtime versions** = **1,536 genuine native combat executions**. The 768-fight pilot is included in the full 1,536.
- **96/96 strict matchup checks PASSED**, covering native rolled Rare gear fingerprints, legal Talents v15, budget, attunement, player HP/MP, Realm, Risk 1 Dangerous, Condition, seed, actual requested Elite ID and old/new runtime source fingerprints.
- **All four acceptance gates passed**, including all E5 fights byte-result-equivalent before and after. Pre-existing Elite specials and Boss/mob regressions passed in the Stage 6.19 pilot CI.

### Overall by named Elite — full 96 comparable fights per Elite and version

| Elite | Original player wins | New player wins | Original median hero damage | New median hero damage |
|---|---:|---:|---:|---:|
| Gravebound Bulwark | 81/96 (84.4%) | **58/96 (60.4%)** | 145.5 | **195.5** |
| Bloodscar Ravager | 82/96 (85.4%) | **63/96 (65.6%)** | 158 | **199.5** |
| Sanguine Wraith | 73/96 (76.0%) | **58/96 (60.4%)** | 165.5 | **199.5** |
| Voidborne Hexer | 90/96 (93.8%) | **73/96 (76.0%)** | 132.5 | **186** |
| Gravecaller | 81/96 (84.4%) | **66/96 (68.8%)** | 136 | **191.5** |
| Oathbound Exarch | 93/96 (96.9%) | **73/96 (76.0%)** | 112.5 | **186.5** |
| Briarspine Horror | 95/96 (99.0%) | **75/96 (78.1%)** | 105 | **178** |
| Ashen Executioner | 87/96 (90.6%) | **68/96 (70.8%)** | 141.5 | **185.5** |

**Equal-weight eight-Elite mean (768 fights/version)**: **682/768 (88.8%) before → 534/768 (69.5%) after**. This mean is for *explicit equal forced subtypes*, **not** the naturally sampled mix from Stage 6.16, which had unequal denominators.

### Overall by controlled E tier

Every tier is **192 native combats per version** (24 per named Elite, eight types):

| Synthetic tier | Original player wins | New player wins | Interpretation |
|---|---:|---:|---|
| E5 / 12 valid points | 124/192 (64.6%) | **124/192 (64.6%)** | **Identical** outcomes/initial Elite stats, as planned |
| E15 / 24 valid points | 176/192 (91.7%) | **152/192 (79.2%)** | Better pressure but still comparatively easy |
| E35 / 36 valid points | 190/192 (99.0%) | **131/192 (68.2%)** | Back near provisional Elite goal |
| E70 / 60 valid points | 192/192 (100%) | **127/192 (66.1%)** | Previously trivial endgame significantly corrected |

## Remaining **unresolved** calibration

These are **not yet equally difficult** and the provisional 60–70% win target is only approximate. Voidborne Hexer (76.0%), Oathbound Exarch (76.0%) and Briarspine Horror (78.1%) are comparatively easy in the equally forced aggregate. E15 still has 79.2% player wins.

More importantly, forcing every identity uncovered pre-existing differences at **E5**: Sanguine Wraith **7/24** (29.2%) player wins, Gravebound Bulwark **10/24** (41.7%), Gravecaller **10/24** (41.7%), while Oathbound Exarch **22/24** (91.7%) and Briarspine Horror **23/24** (95.8%). The code change **does not alter E5**. Changing E5 abilities or stat ratios requires a separate explicit balance decision and, ideally, natural-account validation; don't overfit to these synthetic Rare-geared profiles.

An individual next step is to investigate real uptime/value of Oathward Benediction, Thornbloom and Voidborne Hexer weakened debuff and reconsider very hard E5 Wraith/Gravecaller/Bulwark mechanics, instead of adding a new blanket coefficient. Preserve all eight names and their existing differentiated mechanics.

## Engineering and safe integration

- Final revised study source SHA and all individual battle JSON are contained in `stage619-full-1536-native-eight-elite-fights`, GitHub Actions https://github.com/Skinny-lfg/wanderer-game/actions/runs/44915195931.
- The pilot check includes the *byte-exact original native combat runtime Git blob* and validates no E5 encounter drift, all eight IDs and original Elite/Boss/mob unit regression suites. No manual graphics or browser QA is claimed.
- `scripts/simulate-progression.cjs` only supports **test-only, gated forced Elite identity and old runtime module override** in isolated VMs. No Elite selection logic was changed in the actual game.
- No merge to production `main` and no deploy. After successful scoped PR #116 integration, record the checkpoint on canonical `audit/v013-stage6` for continuity.
