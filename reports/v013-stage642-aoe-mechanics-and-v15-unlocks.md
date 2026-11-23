# Wanderer v0.13 — Stage 6.42 AoE audit and verified E10 improvements

**Status:** candidate changes committed to `balance/stage-6.40-e1-calibration`; no merge/deploy and **not an approved final balance**. Enemy HP/ATK/DEF and Expedition scaling were **not modified in this AoE intervention**. Continue E10-first; no E1/E2 calibration here.

## What the comprehensive source audit actually found

1. Bow pierce hit **one additional enemy** for 35% normally / 55% with `bow_pierce`. Fury attack speed increased hit frequency but not the count of pierced enemies.
2. Lightning funded chains originally hit two additional foes for 50% and 30%; Storm Mastery added a third for 20%. On a four-active-target arena, there can be up to three secondary chain targets.
3. Fire Wildfire spread Burn at 50% for up to two seconds to two targets, without immediate splash on transfer.
4. Decay + Blood Plague Spread transferred one Bleed and Rot at 50% on kill to up to two recipients, without instant damage; reserve enemies must not be killed before entering play.
5. Grave Bloom required Rot already present when its every-third-funded-cast effect triggered; earned/prepared state alone did not produce AoE. Its separate paid Arcane Infusion path had a similar prerequisite issue.
6. **Serious TalentGraph v15 omission:** `bow_pierce`, `fan_of_blades`, `cleave_mastery`, `mace_shockwave`, `sword_sweep` and `single_target_mastery` existed in active combat and Talent Catalog but did **not** exist in the 343-node native v15 tree. Agents could never purchase them, irrespective of their talent budgets. This was more important than adding further generic damage modifiers.

## Gameplay mechanic fixes (one change in each original mechanic)

- **Bow:** basic piercing hits up to **two** further foes for 42% / 24%; with the *newly unlockable* Deep Pierce skill, up to **three** foes for 60% / 42% / 28%.
- **Lightning:** Overcharge jumps to up to three secondaries for 60%, 43%, 28%. Storm Mastery upgrades the same chain to 68%, 52%, 36%. It does not append a duplicate AoE attack.
- **Fire:** Wildfire spreads Burn at 65% for up to three seconds to two nearby foes and applies small immediate secondary splash. Conflagration's third Burn transfer was adjusted within the original code.
- **Plague Spread:** transferred Bleed/Rot on kill immediately deals one transferred tick to an active living recipient; reserve units retain DoT for entry but cannot take pre-entry instant damage.
- **Grave Bloom:** the existing every-third-cast/Infusion mechanic can seed initial Rot when missing, spread it to two active secondary foes, and deal an immediate burst; no new standalone multiplier.
- Descriptions/tooltips updated in `combat/talent-catalog.js` and `combat/v012-buildcraft.js`.
- Root and `docs/` counterparts of all modified gameplay modules were compared for exact content equality.

## Restoring missing abilities in the real TalentGraph v15

The six missing skills now have proper two-node weapon-fork routes plus their existing skill gate, in the **active** v15 graph. The atlas preview/prototype was updated with separated radial lanes and a fitted viewport so the new nodes do not overlap older roots or skills.

The Fury Bow research planner prioritizes `bow_pierce` before unrelated Fury milestones; the AoE classifier recognises *prepared* Grave Bloom. **These are agent/telemetry changes, not free gear, Talents or XP.**

**Validation:** the relevant v15 tree, layout, runtime bridge, combat, TalentGraph progression and AoE-readiness regression suite completed **92/92 passing tests** in https://github.com/Skinny-lfg/wanderer-game/actions/runs/45278230654.

A broader previous selection had **8/99 failures**: layout overlap and the hardcoded old node count were repaired; the remaining unrelated `v013-dead-talent-cleanup.test.cjs` failures concerned historic manual-attribute code. That test and its dependencies (`index.html`, `combat/talent-graph-runtime.js`, `combat/v012-gear-stats.js`) were verified byte-identical to the pre-AoE commit. They have **not** been silently declared fixed; they remain separate from the passing 92-test AoE suite.

## Real E10 combat improvement, 3,300 matched native fights

Identical genuinely earned E10 gear/Talent snapshots, identical Blood-realm Risk 1 mobs, same RNG seeds. 11 intended build labels ×100 seeds ×(4/8/12 mobs). **24/24 workflow jobs succeeded**: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45276225810. The run is **before** restoration of the missing talent nodes; the restored Bow node is evaluated separately below.

| Intended build | 4-mob before → after | 8-mob before → after | 12-mob before → after |
|---|---:|---:|---:|
| Balanced | 99%→99% | 89%→89% | 86%→86% |
| Hexblade Hybrid | 8%→8% | 0%→0% | 0%→0% |
| Leather Duelist (actual Bow) | 27%→30% | 4%→10% | 9%→20% |
| Blood Pure (Two-Handed/Sword) | 86%→86% | 78%→78% | 76%→76% |
| Blood + Two-Handed | 66%→66% | 49%→49% | 42%→42% |
| Fury + Bow | 42%→46% | 0%→5% | 4%→14% |
| Magic Fire | 87%→100% | 23%→91% | 35%→69% |
| Magic Lightning | 6%→37% | 0%→0% | 0%→0% |
| Plate Warden | 100%→100% | 77%→77% | 82%→82% |
| Decay + Blood | 61%→60% | 11%→14% | 21%→24% |
| Magic + Decay | 37%→47% | 0%→3% | 1%→5% |

**Fire** is now a credible specialized direct AoE option in this E10 sample. Bow/Lightning/DoT chains generate more secondary damage, but not necessarily enough survivability or total combat damage to win against large groups. No timeouts in the matched run.

## Separate LEGAL Bow respec study — why the inaccessible node was crucial

Workflow: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45278609368, **4/4 jobs successful**. Two independently earned Fury+Bow E10 Camp snapshots both had 3,695 XP, 36 earned Talent points, actual Bow, and no `bow_pierce`. Reset + repurchase were completed using the **real v15 graph**, with no gifted gear, points or XP. The same enemy seeds/rosters were checked and replayed for 100 fights/group **in both arms**. Unlike the first 3,300-fight study, this measures **Talent redistribution**, not only a damage formula change.

| Group | Original Fury+Bow | Legal respec with Deep Pierce | Secondary damage before→after |
|---|---:|---:|---:|
| 4 mobs | 46/100 | 54/100 | 41,524→66,256 |
| 8 mobs | 5/100 | 26/100 | 59,366→109,881 |
| 12 mobs | 14/100 | 49/100 | 78,287→141,284 |

These are **100 combat RNG seeds, not 100 independent hero builds**, and the after-state is a legitimate E10 counterfactual respec rather than a fresh naturally progressing player.

## Dedicated Lightning Mana Spring diagnosis — tested, NOT applied to the planner

Workflow: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45279167948, **2/2 jobs successful**. The only genuine E10 Lightning snapshot in the base cohort had a Staff, **8 gear pieces and 22 earned Talents** (where the Fire reference had 10 gear pieces and 28 talents). We legally reset the 22 points to keep Overcharge and Storm Mastery while buying Mana Spring in place of Chain Discharge. With **100 matched E10 combat RNG seeds/group**, it did **not improve** win rates:

- 4 mobs **37/100→37/100**
- 8 mobs **0/100→0/100**
- 12 mobs **0/100→0/100**
- Funded-cast counts stayed approximately unchanged and total damage in large rooms declined slightly. Therefore the hypothesis that **Mana Spring alone** was the key limiting resource was **rejected**, and that planner change was not applied.

Do **not** further increase Lightning jump damage blindly based on this one under-equipped survivor; inspect earned equipment, effective HP/avoidance, enemy attack timing and target choice, then compare a second real Lightning E10 build with more complete gear.

## Scope limits and acceptance

- These tests exercise first-ring Risk 1 battles at E10, not natural full-Expedition completion rates.
- Only one Fire and one Lightning earned E10 checkpoint were available. E10 character diversity is the limiting factor in extrapolating their results.
- Bow is stronger with actual Deep Pierce but 49% vs 12 mobs remains short of an optimized swarm-specialist goal. Blood+Decay immediate burst and Grave Bloom became functional but still weak for large groups.
- New Fan of Blades, Cleave Mastery and Shield/Mace AoE paths are graph-reachable and covered by v15 structural tests, **not yet performance-calibrated with specialized equipped E10 characters**.
- **The Stage 6.42 candidate remains unapproved.** No merge or deploy and no E1–E9 balance tuning from this AoE intervention.
- Main follow-up is to improve survivability/activation in Lightning and DoT builds without imposing blanket enemy multipliers; obtain additional legitimate E10 checkpoints for pure ST, hybrid and dedicated AoE comparisons.
