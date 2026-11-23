# Wanderer v0.13 — Stage 6.44: E10 weapon AoE, secondary statuses and mixed Blood/Decay laboratory

**Status: EXPERIMENTAL / NOT APPROVED FOR MERGE OR DEPLOY.** Branch `balance/stage-6.40-e1-calibration`.

All combat changes below are **trial-only source patches inside GitHub Actions runners**. They have **not** been applied to production game modules on the branch. The committed changes are laboratory scripts, tests, and CI workflows.

## Provenance / method

- 100 matched combat random seeds per variant per group size (1, 4, 8, 12 normal enemies), Blood realm Risk 1, E10, native runtime.
- Groups of 8/12 use successive reinforcements; never more than **4 active enemies at a time**.
- Original hero gear/XP comes from genuinely earned E10 Camp checkpoints; studies with `respec*` reset and legally repurchase talents using that **same earned XP**, without granting gear, levels or points.
- Where a talent is mechanically disabled in the trial, its points stay spent to isolate the *effect*, not to model a better reallocated build. This is a controlled ablation, not a full alternative-build comparison.
- Usually **two real E10 characters per profile**, not 100 independently earned accounts. Interpret every win percentage as preliminary first-ring normal-room evidence, not Expedition/Elite/Boss victory rates.
- Test-only secondary status mechanic samples *relative proc chance* 35%, 50%, 65%, a 50% potency DoT, and retains cost/stack restrictions. This is a prototype implementation, not final ability balance.
- Functional contract: **5/5 native tests passed, zero failures**. [Stage 6.44 functional run](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45287650637).
- General matched matrix (21 variants × 100 seeds × 4 sizes): [Stage 6.44 main matrix](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45287786436) **success**.
- Legal Bow respec: [run 45288060526](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45288060526) **success**.
- Legal Two-Handed/Mace respec: [run 45288629145](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45288629145) **success**.
- Legal Blood/Decay and physical Bloom respec: [run 45288890078](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45288890078) **success**.

## Bow: legal earned-XP purchase of Deep Pierce

The original E10 `smart-fury-bow` profile had **not actually purchased `bow_pierce`**. A legal v15 respec using the *same earned XP and Bow gear* was essential.

| Trial mechanic | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Current purchased Deep Pierce, up to 3 extra targets | 95% | 54% | 26% | 49% |
| Exactly 1 extra target (60% hit), no new statuses | 95% | 42% | 0% | 5% |
| Exactly 1 extra + status 35% of primary proc chance | 95% | 40% | 3% | 7% |
| Exactly 1 extra + status 50% | 95% | 41% | 3% | 8% |
| Exactly 1 extra + status 65% | 95% | 42% | 3% | 7% |

**Do not ship the Bow 1-extra-target change as-is.** The requested Piercing identity is coherent, but the reduction causes severe losses against large groups and 35–65% secondary status chance does not compensate. It needs a dedicated damage or synergy design followed by another matched test. A conditional targeting/penetration model should not be confused with generic multi-target.

## Two-Handed: legally purchased Sweeping Force

| Effect (same earned XP+gear) | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|
| Sweeping Force mechanically disabled (points still spent) | 70% | 49% | 42% |
| Sweeping Force active | 75% | 52% | 45% |
| Sweeping Force + 50% status bridge | 75% | 54% | 47% |

Modest positive AoE contribution. The original normal-character `smart-blood-two-handed` profile did not purchase the skill; only the respec test actually measures it.

## Mace: legally purchased Concussive Swing

| Effect | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|
| Skill mechanically disabled (points still spent) | 98% | 57% | 74% |
| Concussive Swing active | 100% | 79% | 80% |
| Concussive Swing + 50% status bridge | 100% | 79% | 80% |

Strong effect in 8-mob groups; the Aegis/Vitality cohort does not automatically have Blood/Decay/Fury status talents, so no benefit from the universal status bridge is expected. Need diverse mixed-affinity cohorts before final tuning.

## Blood + Decay — legal Carrion Detonation respec

E10 real Sword+Tome gear; original `decay-blood-spread` had **Contagion but not Carrion Detonation**, so a separate legal respec was necessary. The changed talent budget can worsen the overall build relative to the original; compare only the two matched respec variants below.

| Mechanic | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Existing Carrion Detonation | 83% | 17% | 0% | 0% |
| Counterfactual build-up then AoE burst (test-only) | 94% | 32% | 0% | 3% |

Secondary damage total at sizes 4/8/12: previous **396 / 360 / 513**, trial **21,350 / 29,406 / 33,706**. The concept triggers and deals meaningful AoE damage but is still dramatically underpowered for 8/12. Avoid shipping without charge-rate, DoT interaction, death/respawn, and incoming-reinforcement analysis. Do not simply multiply the burst until a desired win rate appears.

## Grave Bloom — physical Infusion path

Two E10 Sword+Tome actors legally respecced to Magic+Decay and *prepared* Grave Bloom. The existing physical Arcane Infusion path did not produce measured secondary damage; the trial adds the missing immediate secondary damage, while the caster-funded path is unchanged.

| Variant | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Physical Infusion current | 98% | 39% | 0% | 0% |
| Physical Infusion with immediate burst | 98% | 40% | 0% | 0% |

Secondary damage 4/8/12: **0 / 0 / 0 → 1,056 / 1,253 / 1,628**. Confirms an effect-path inconsistency and that the isolated patch moves damage, **not** that a full shared Grave Bloom resolver or new ability identity is implemented or balanced.

## Universal secondary effects

Direct functional checks demonstrate secondary AoE from Bow, Two-Handed, Daggers, Sword+Shield and Mace can apply reduced Bleed/Rot/Sunder to live extra targets without pre-hitting reserves, with paid Mana for Rot and no independent primary `onAttack` recursion. Actual balance depends on an eligible build owning those affinities and having those weapons/skills; a copied function test alone is not a validated mixed E10 build.

## Outstanding weapon-specific E10 experiments

- Sword+Shield: legal purchased `sword_sweep`, 100 combat seeds/group, [run 45289298780](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45289298780) **success**. Only **one independently earned eligible E10 hero** (Sword+Shield, 17 spent points). Skill disabled vs enabled: 4 mobs **50%→62%**, 8 mobs **0%→8%**, 12 mobs **0%→7%**. Extra 50% status bridge did not change results (Aegis-only actor, no Blood/Decay/Fury proc access). Secondary damage with Shielded Sweep: 4/8/12 **23,165 / 33,159 / 39,541**, versus zero with skill disabled. Improves performance, remains very weak against 8/12.
- Daggers: obtain natural E1-born E10 Daggers users, then legal `fan_of_blades` vs mechanical ablation and 50% status bridge: [run 45289345976](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45289345976). Different capture provenance; **do not mix the cohort with prior frozen-Stage6.42 baselines**.
- Universal status fidelity must be audited against the full active talent ranks, skills, weapons, effects, cooldowns and scaling before any production change. 
- Full Grave Bloom unified resolver, Carrion charge contribution from secondary attacks, sustained DoT/rot-tick telemetry, boss/elite testing and final E10 balancing remain **not yet approved**.

**Conclusion: Keep Stage 6.43 gameplay untouched. Stage 6.44 is a successful research lab, with several material design and sample-eligibility findings, not yet a deployable balance patch.**
