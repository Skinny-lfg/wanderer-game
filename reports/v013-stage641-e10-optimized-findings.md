# Stage 6.41 — E10 benchmark with earned and specialized agents

**Status: executed and verified (GitHub Actions 20/20 jobs successful).** Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45252571384. Source fingerprint of the full 18-account run: `3b239408a2e65c01411f56a0a4e710511b7c0746702c3536a0d7fe0308f9e743`.

This stage improved the **research agents and combat telemetry**, not enemy difficulty. No merge/deploy. Previous Stage 6.40 unvalidated gameplay candidates remain isolated in `balance/stage-6.40-e1-calibration`.

## What changed

- Research-only E10 agents prefer Risk 0 and conservative resource/extraction decisions; still start at E1 with weak real initial gear, zero points, native fights, and earned loot/XP.
- Dedicated Fire and Lightning profiles retain their intended element instead of pivoting to an unrelated one after failed Expeditions.
- Planner now supports a deliberately ordered elemental milestone route, allowing Lightning to buy Overcharge before its Storm Mastery amplifier and Fire to obtain Kindling before Fire Spread. Added `magic-fire-pure` plan. Ordering is opt-in and does not change every other build.
- E10 run used **up to 24 native attempts per Expedition** and at most 240 per character, instead of the previous 12/120. Report the limits whenever comparing reach rates.
- Burn spread damage on living secondary targets is included in native `secondaryTargetDamage` (without altering combat damage), and its separate `secondaryDotDamage` is now exported from the simulation row.

## Build-readiness outcomes

**16/18 accounts reached E10; 9/16 had actual AoE skills/gear, and all nine produced measured secondary-target damage.**

Two failed E1 even with 24 attempts: `magic-fire/9861` and `magic-lightning/9861`. This is an important **early survival/access problem**. Reached E10 accounts had equipment and 16–36 invested Talent nodes, with large differences in quality and advancement.

A build's intended label is *not* the same as its actual capability: `leather-duelist` 2/2 equipped Bow and `smart-blood-pure` 1/2 equipped Two-Handed. Thus the E10 cohort has both AoE and non-AoE, but the latter is not always a highly optimized **pure** Single Target benchmark. We must distinguish intended ST, actual non-AoE, and intentionally pure ST in follow-ups.

## Controlled E10: 16 earned Camp snapshots, two combat seeds each

Each of the 16 real E10 entrants faced each normal size, eight Elite identities and six Boss identities in first-ring Risk 1 native controlled fights. **These are 32 repeated fights per encounter, not 32 independent players nor natural full-Expedition clear rates.** The 16 survivors are also a selected population.

| Normal group size | All | AoE-capable | Non-AoE |
|---|---:|---:|---:|
| 1 | 32/32 (100%) | 18/18 (100%) | 14/14 (100%) |
| 2 | 32/32 (100%) | 18/18 (100%) | 14/14 (100%) |
| 3 | 31/32 (96.9%) | 17/18 (94.4%) | 14/14 (100%) |
| 4 | 22/32 (68.8%) | 12/18 (66.7%) | 10/14 (71.4%) |
| 5 | 29/32 (90.6%) | 17/18 (94.4%) | 12/14 (85.7%) |
| 8 | 28/32 (87.5%) | 17/18 (94.4%) | 11/14 (78.6%) |
| 12 | 32/32 (100%) | 18/18 (100%) | 14/14 (100%) |

### Elites

| Identity | Player victories |
|---|---:|
| Tank | 32/32 (100%) |
| Berserker | 32/32 (100%) |
| Vampire | 31/32 (96.9%) |
| Caster | 32/32 (100%) |
| Gravecaller | 32/32 (100%) |
| Oathbound Exarch | 27/32 (84.4%) |
| Briarspine Horror | 26/32 (81.3%) |
| Ashen Executioner | 32/32 (100%) |

### Bosses

| Affinity / identity | Player victories |
|---|---:|
| Blood / Rift Harbinger | 21/32 (65.6%) |
| Decay / Carrion Matriarch | 32/32 (100%) |
| Vitality / Heartroot Devourer | 16/32 (50.0%) |
| Aegis / Abyssal Guardian | 30/32 (93.8%) |
| Fury / Ember Sovereign | 27/32 (84.4%) |
| Magic / Stormglass Conductor | 30/32 (93.8%) |

## Identified structural imbalance: 4 normal enemies harder than 12

A plausible **code-grounded cause** is that `applyMinionEscortRelief` stays active at every Expedition for normal groups of at least 5 with Minions, even while the separate E1 pressure relief now tapers smoothly.

For instance, a 12-enemy roster with 9 Minions grants its **principal enemies** factors:

- HP `max(.38, 1-9×.055) = .505`
- ATK `max(.50, 1-9×.045) = .595`
- DEF `max(.65, 1-9×.025) = .775`

The Minions additionally receive the normal-room fragile profile (`HP .38, ATK .60`). This is not the only influence — natural role compositions and player targeting also vary — but it plausibly makes 12-enemy rooms easier for Single Target than 4-enemy rooms. Avoid global enemy nerfs.

**Next controlled change proposal (not yet applied):** taper the `MINION_ESCORT_RELIEF` benefit smoothly from E1 to E10 and, if needed, recalibrate Minion native durability by stage. Match same player checkpoints and random streams before accepting, keeping ST strongest against solo and AoE strongest against large groups.

## Data provenance and Fire Burn metric caveat

The archived aggregate from the **initial 18-profile run** reports totals for `secondaryTargetDamage` correctly, but displays `secondaryDotDamage=0` because that extra telemetry field had not yet been exported by `scripts/simulate-progression.cjs` at the run's SHA. **That zero is missing breakdown, not proof of zero Fire Burn spread.** A local native replay on `magic-fire/9863` after exporting the field recorded **2,031 secondary damage, all from 2,031 spread Burn DoT**, while keeping the same combat outcomes. The exporter-only change was committed after the 20/20 CI run; it requires its own regression validation if used in a new full cohort.

## Decision and next calibration gate

E10 is now a **usable reference cohort**, not an approved final difficulty. Coarse targets remain roughly 80–90% normals for natural mixed progression, 60–70% Elites, 35–45% Bosses, while true optimized pure Single Target and AoE intentionally follow opposite group-size curves.

1. Fix the four-versus-twelve normal group composition/escort discontinuity with **same earned E10 snapshots and seeds**. Do not overfit 2-point-rate differences.
2. Calibrate each Elite/Boss individually at E10, prioritizing the big outliers; respect summon mechanics and build matchups instead of forcing exactly one rate.
3. Once E10 is credible, fit smooth reduced enemy pressure backwards E9→E1 based on real earned HP, DPS, armor and ability unlock timing, paying attention to E1→E2.
4. Validate E3/E5/E8/E10 and later E20/E35/E70/E200. Do not claim E10 proves all Expeditions are balanced.

**Stage 6.41 delivered:** better agent specializations, genuine E10 AoE sample, full 18-account pilot, corrected native secondary damage tracking, and a concrete evidence-based next calibration scope. **Enemy balance is still open.**
