# Stage 6.42 — E10, 100 independent combat seeds per build and normal-group size

**Measured, not proposed.** GitHub Actions execution: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45272938568 — **35/35 jobs successful**, 22/22 replay shards, no unresolved combats. Machine-readable outputs are available as the `stage642-e10-100seed-summary` artifact (JSON and CSV).

## Experimental design

- **11 intended builds × 3 group sizes (4, 8, 12) × 100 matched combat RNG seeds = 3,300 fully executed native E10 first-ring Risk 1 fights.**
- Combat source fingerprint `98fc9ed555d031e6ad421b39219e4ad0214dcdf2f4ebfbaedd55524fa47bd180`, taken from the current Stage 6.42 candidate at commit `e98b8ea6eb2cc78c571ee2cecae574971cec853a`.
- All builds faced Blood-Affinity normal mobs, same 100 initial combat seeds per group; no custom enemy roles and no added buffs/nerfs.
- Character states came from real E1-born E10 Camp checkpoints earned under frozen Stage 6.41 source `449940d08be86de09f7688f0e2a98d4497817b98`, fingerprint `3b239408a2e65c01411f56a0a4e710511b7c0746702c3536a0d7fe0308f9e743`. **This avoids selecting only players able to survive changed E2–E9 encounters under the current candidate.**
- When both natural seeds 9861 and 9863 reached E10, each contributed 50 trials per size. Only one genuine checkpoint was available for Fire and Lightning, so its state was replayed 100 times/size.
- **100 combat seeds are not 100 independently acquired gear/talent builds.** Confidence intervals below (Wilson, 95%) are conditional on these fixed character states, and should not be generalized to all possible E10 players.
- No Expedition victory rates, Elites, or Bosses were assessed in this particular 100-seed exercise; those remain separately measured.

## Actual E10 normal group success by intended build

| Intended build | E10 snapshots | Group 4 | Group 8 | Group 12 |
|---|---:|---:|---:|---:|
| Balanced (Sword/Mace; no AoE) | 2 | 99/100 | 89/100 | 86/100 |
| Hexblade Hybrid (Wand/Daggers; no AoE) | 2 | 8/100 | 0/100 | 0/100 |
| Leather Duelist (**actually Bow + pierce**) | 2 | 27/100 | 4/100 | 9/100 |
| Blood Pure (**actually Two-Handed/Sword**) | 2 | 86/100 | 78/100 | 76/100 |
| Blood + Two-Handed (real Cleave) | 2 | 66/100 | 49/100 | 42/100 |
| Fury + Bow (attack speed + pierce) | 2 | 42/100 | 0/100 | 4/100 |
| Magic Fire (Wand; real secondary Burn) | 1 | 87/100 | 23/100 | 35/100 |
| Magic Lightning (Staff; secondary hits) | 1 | 6/100 | 0/100 | 0/100 |
| Plate Warden (Mace; no AoE) | 2 | 100/100 | 77/100 | 82/100 |
| Decay + Blood (Sword; Plague Spread) | 2 | 61/100 | 11/100 | 21/100 |
| Magic + Decay (Wand/Staff; Grave Bloom **earned but no AoE observed**) | 2 | 37/100 | 0/100 | 1/100 |

All 3,300 fights resolved as wins or losses; **0 native timeouts**. `Decay + Blood` had actual `plague_spread` on both earned checkpoints, with measured transfer counters and secondary damage. Both Magic + Decay checkpoints owned `grave_bloom`, but measured **zero secondary damage** (unresolved spell/usage/activation issue).

### Total by group (equal number of fights per intended build)

| Normal group | Wins / 1,100 | Win % |
|---|---:|---:|
| 4 mobs | 619/1,100 | 56.3% |
| 8 mobs | 331/1,100 | 30.1% |
| 12 mobs | 356/1,100 | 32.4% |

**The apparent 8-vs-12 gap is now only +2.3 percentage points for 12.** Across 11 intended builds, 6 have higher player success against 12, 3 against 8, and 2 tie. It is **not** justified to conclude universally that 8-mob rooms are harder. The substantial common discontinuity is 4→8, with huge build-to-build variance. More player-state diversity and matched paired outcome analysis may be needed before taking the small 8→12 difference as a stable effect.

### Enemy composition (mean across the 100 matched seeds)

| Group | Minions | Tanks | Casters | Skirmishers | Principal combined HP (after budget) |
|---|---:|---:|---:|---:|---:|
| 4 | 1.5 | 0.6 | 0.9 | 1.0 | 1,225 |
| 8 | 5.0 | 0.5 | 1.0 | 1.5 | 1,311 |
| 12 | 8.7 | 0.5 | 1.1 | 1.7 | 1,337 |

There can be only four simultaneously active attackers. Bigger groups add mostly fragile Minions, while the canonical budget reduces the principal units' HP/ATK/DEF as Minions increase. This is a **plausible mechanistic explanation** for an occasional 12-mob advantage, but the 2.3-point mean difference is too small to justify an 8-only adjustment.

## Specialized-AoE conclusion

The dedicated Bow builds frequently lose to large groups **despite dealing measured secondary damage**. Bow pierces at most one additional target; attack speed increases piercing frequency, not the number of simultaneous pierced targets. Blood Two-Handed does real cleave, but its large-group win rate still drops to 42% at 12. Fire likewise loses many group fights. Decay + Blood activates spread but only wins 11% vs 8 and 21% vs 12.

Therefore **do not globally nerf groups to make all AoE labels win, nor globally buff everything to punish Single Target**. First distinguish true pure-ST, 2-target cleave, direct AoE, on-kill DOT-spread, and balanced survival builds; examine effective secondary damage, defensive endurance, gear maturity and spell activation separately.

## Decision

- This exercise **does not approve** the current 6.42 candidate for merge/deploy.
- No gameplay constants were changed by the 100-seed runner; only analysis script/workflow/report were added.
- Prioritize the **build disparities** and real activation of Grave Bloom before further enemy coefficient adjustments.
- For later evidence, use matched source-controlled E10 Camp snapshots; investigate minion composition and principal stat budget **within its single existing function**, not another correction layer.
- E1–E9 and E20+ remain outside the current calibration scope.
