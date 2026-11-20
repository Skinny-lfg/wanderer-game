# Wanderer v0.13 — Stage 6.7 Pilot: E6–E10 Progressive Enemy Scaling

**Date:** 2026-11-20  
**Status:** Completed, validated, **diagnostic-only**. No balance change accepted.  
**Branch:** audit/v013-stage6  
**Tested revision:** 1fed20a5b80472f580addfa9d1b08b065ca86436  
**GitHub Actions:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44828105899  
**Result artifact:** stage67-native-scaling-comparison; original four-variant native traces in stage67-native-physical, stage67-native-magic, stage67-native-mixed.

## Question

Can we improve the difficulty curve from E6 to E10 **before balancing individual Affinities and weapons** by changing only how enemy HP/Attack/Defense scale? The early E1–E5 campaign remains unchanged; its absolute difficulty is separately known to be high.

## Native experimental design

- Same 48 naturally created accounts, 12 profile policies over four shared seeds (9701–9704), with 18 native attempts per Expedition and 85 total attempts per account.
- Identical legitimate E1–E5 history for every account under all four curves (verified using complete attempt SHA-256 digests).
- Identical earned **E6 starting account** before entering any E6+ combat (gear, XP, talent investments and Gold verified).
- Only the code implementation of enemyReference(E) is overridden inside the isolated native harness; no production source file, build stats, loot, reward, boss ability or talents were modified.
- Native RNG, map, gear, combat, target priority, Camp, potions and Boss unlocks remain in operation. The player's decisions, loot and RNG downstream of E6 may diverge because the fights actually change.
- 9/9 CI regression tests passed; all three cohort jobs and aggregation completed successfully.
- The original Stage 6.5 baseline was reproduced exactly: **1,640 attempts, 19 accounts entering E6, 18 completing E10**.

## Curves tested

The reference number is a source input to enemy HP, Attack and Defense, **not a final damage multiplier**.

Define d=E−5 for E>5. E1–E5 remain exactly R(E)=E.

| Variant | Experimental E>5 formula | E5 | E6 | E8 | E10 |
|---|---|---:|---:|---:|---:|
| Baseline | 5 + ln(1 + d/5) | 5.00 | 5.18 | 5.47 | 5.69 |
| Mild | 5 + 0.35d + 0.05d² | 5.00 | 5.40 | 6.50 | 8.00 |
| Firm | 5 + 0.55d + 0.07d² | 5.00 | 5.62 | 7.28 | 9.50 |
| Linear | 5 + d | 5.00 | 6.00 | 8.00 | 10.00 |

**Important:** these quadratic alternatives are *temporary E6–E10 probes*. They would grow far too quickly over higher levels if copied directly into the permanent E1–E200 game. A selected production curve would require a separately designed continuation past E10 and compatibility with later gear tiers.

## Aggregate account outcomes

All four alternatives start E6 with **the same nineteen eligible native accounts**. The remaining 29 accounts are censored before E6 and never receive artificial unlocks.

| Curve | E6 entered | E10 completed | Attempts E6–E10 | Boss deaths / native Boss fights | Elite deaths / Elite fights | Ordinary deaths / ordinary fights | Unresolved native fights at 4,500 ticks |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline | 19 | **18** | 187 | 35/125 (28.0%) | 2/108 (1.9%) | 0/382 (0%) | 0 |
| Mild | 19 | **12** | 452 | 172/255 (67.5%) | 8/218 (3.7%) | 5/857 (0.6%) | 1 |
| Firm | 19 | **8** | 509 | 185/253 (73.1%) | 14/247 (5.7%) | 4/938 (0.4%) | 1 |
| Linear | 19 | **4** | 599 | 212/271 (78.2%) | 24/307 (7.8%) | 13/1094 (1.2%) | 4 |

Counts are **observed native fights selected by a scripted agent**, not independent samples or human-player win rates. The number of Boss fights increases as players retry; a per-fight death fraction is not directly a per-Expedition win rate.

**Finding A:** baseline E6–E10 is comparatively forgiving, especially for standard encounters. However, the Mild increase (E10 reference 8.00) was already too strong for the sampled non-defensive cohort: it more than doubled late attempts and cut E10 clears from 18 to 12.

**Finding B:** the increase predominantly penalizes **Boss fights**, not normal or Elite encounters. Even under Mild, only 8 of 218 Elite fights ended in death versus 172 of 255 Boss fights. A global scaling coefficient alone does not repair the Elite-vs-Tank hierarchy or smooth every role evenly.

**Finding C:** more difficult native fights change future resource usage and RNG paths, so E6 level clears need not decrease monotonically with the reference. Under Mild, 19/19 completed E6 versus 18/19 at baseline. The causal control is the **identical E6 starting account and rules**, not identical future random rewards.

## Level-by-level entry/clear counts

| E | Baseline | Mild | Firm | Linear |
|---|---|---|---|---|
| E6 | 19 entered / 18 cleared | 19 / 19 | 19 / 19 | 19 / 19 |
| E7 | 18 / 18 | 19 / 18 | 19 / 18 | 19 / 15 |
| E8 | 18 / 18 | 18 / 18 | 18 / 12 | 15 / 13 |
| E9 | 18 / 18 | 18 / 16 | 12 / 11 | 13 / 8 |
| E10 | 18 / 18 | 16 / 12 | 11 / 8 | 8 / 4 |

## E10 completions by build

| Native policy | Baseline | Mild | Firm | Linear |
|---|---:|---:|---:|---:|
| Balanced | 4 | 4 | 2 | 1 |
| Cautious | 4 | 4 | 2 | 1 |
| Plate Warden | 4 | 3 | 3 | 1 |
| Cloth Battlemage | 1 | 1 | 1 | 1 |
| Magic Staff | 2 | 0 | 0 | 0 |
| Magic Fire | 1 | 0 | 0 | 0 |
| Magic Frost | 1 | 0 | 0 | 0 |
| Magic Wand | 1 | 0 | 0 | 0 |
| Magic Lightning, Magic Arcane, Leather Duelist, Hexblade Hybrid (each) | 0 | 0 | 0 | 0 |

**Finding D:** a global scaling increase **widens build disparity in this sample**. The Mild candidate preserved 11/12 E10 successes in the three strongly defensive profiles but eliminated E10 successes for all pure Magic profiles. That does not prove a specific Magic damage defect: the defensive builds may simply survive more retries, gain more loot or suffer less from E8–E10 Boss ability pressure. Tune the global Expedition curve *before* individual builds, but do not declare a candidate balanced only because its late-game Boss death fraction resembles E1–E5.

## Native combat duration caps

An isolated native fight was allowed 4,500 updates, unchanged between baseline and all candidates. Six fights reached this limit without a win or death:

- Mild: Plate Warden, seed 9703, E10 attempt 5.
- Firm: Plate Warden, seed 9703, E8 attempt 1.
- Linear: Plate Warden, seed 9702, E9 attempt 4; Balanced, seed 9703, E9 attempt 10; Plate Warden, seed 9703, E10 attempt 8; Plate Warden, seed 9704, E9 attempt 2.

These were preserved as **censored, unresolved combats**, never counted as a player death or Boss win and never silenced as success. This demonstrates a separate design concern: excessive enemy endurance versus highly defensive low-DPS builds can lead to prohibitively long combat.

## Decision and next proposed tests

**Do not promote any of the tested stronger curves to production yet.** The test proves E6–E10 reacts strongly to global enemy scaling, but Mild is already aggressive. Likewise, **do not begin global Magic or weapon buffs** to compensate for an experimental difficulty increase.

1. Narrow the comparison to more gradual curves with an E10 reference approximately **6.3, 6.7 and 7.1**, between today's 5.69 and the tested Mild 8.00. Use a smooth shape anchored at E5, avoiding an abrupt E6 jump. Still simulate at least E1–E10; do not deploy a quadratic formula without an E11–E200 continuation plan.
2. Compare E6+ **Boss and Elite threat independently** after selecting the baseline enemy reference. If the only way to make Elites dangerous is also to make Bosses near-unbeatable, global scaling is insufficient.
3. Keep E1–E5 unchanged during the E6+ experiment to preserve a causal baseline; later address their independently verified global initial attrition and Boss difficulty.
4. Expand to more than four independent seeds before accepting any numerical balance change. For each seed, account for blocked E1–E5 players, and compare the same earned E6 entrants.
5. Keep the outcome objective **consistent challenge and readable role hierarchy**, not reproducing E1–E5's current approximately 72% Boss-combat death fraction (itself suspected overtuned).

**No production combat coefficients, builds, enemy data, drop chances, saves, main merges or deploys changed.** The temporary module overrides exist exclusively in scripts/v013-stage67-enemy-curve-sweep.cjs.

## Reproduction and provenance

CI: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44828105899  
Script: scripts/v013-stage67-enemy-curve-sweep.cjs  
Cross-cohort aggregator: scripts/v013-stage67-compare-curves.cjs  
Tests: tests/v013-stage67-curves.test.cjs  
Original raw JSON for all 48 accounts × four curves plus SHA-provenance available as GitHub Actions artifacts.
