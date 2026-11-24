# Stage 6.47C — Native Grave Bloom and assisted capture

## Implementation

- Approved Stage 6.47B variant C integrated in commit `91b2359be4859a1c58bce3b8681b4929649429cf`: two native Rot stacks on a paid Arcane Infusion hit, primary burst based on the sum of all live Rot stack tick damage, up to two copied stacks on each of two other living active targets at 75% potency. No consumption of original stacks; native stack caps, three remaining ticks on copied stacks, primary burst raw caps 22% normal / 7% elite / 3.5% boss. Old cast and three-hit Bloom resolvers removed; Spell Echo remains independent. Catalog and browser mirrors updated.
- Fixed measured harness dropping the third dotDamage argument, which suppressed secondary Rot attribution without affecting actual combat damage. Forward all arguments to native function.
- Simulator-only `scripts/v013-capture-assistance.cjs`: explicit natural/assisted cohort policy. 70% enemy HP and attack in E1–E9; unchanged defense, barrier, interval, loot and rewards. Each active/reserve actor scaled once. Dynamically spawned actors are handled at the next simulation tick boundary (not an alteration of their native creation code). No assistance at E10 or beyond. Native Camp stop only after legal unlock. Non-attacking actors retain zero ATK (final guard commit `56e66159d08499811c305540d20b8aafefbd500e`; separate boundary contract run 45364357307).
- `scripts/v013-stage647c-capture.cjs`: reusable independent account capture for any known profile or new Magic + Decay profiles, distinct cohort labels, two account seeds per shard. `scripts/v013-stage647c-native-replay.cjs`: legal prepared-talent respec for Bloom comparisons; no modification of source or difficulty in E10 native replay. Prior historical snapshots remain intact.
- The old candidate labs are historical experiments and should be reproduced at their original source commits, not reapplied to integrated gameplay.

## Verified live-code confirmation

[45364086473](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45364086473): 6/6 jobs passed, full npm regression, directed native mechanics and isolation contracts, 800 matched native encounters, zero timeouts, zero outcome changes compared to 6.47B C. Same actors, earned XP, gear and enemy rosters.

| Profile | 1 | 4 | 8 | 12 |
|---|---:|---:|---:|---:|
| Wand/Staff | 100% | 98% | 85% | 72% |
| Sword + Tome | 100% | 96% | 76% | 63% |

Actual attributed secondary DOT HP damage at 8 mobs: 59,767 and 52,865 respectively. At 12: 78,371 and 64,608. The attributed damage confirms the telemetry repair.

## First independent account pilot

[45364130583](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45364130583), coverage stage completed: 40 attempted independent account runs, matched seeds 12001–12010 per profile/mode. Assisted: 20/20 reached native E10 Camp, natural: 15/20. Caster 10/10 assisted versus 7/10 natural; Sword + Tome 10/10 versus 8/10. All natural scaledActors counts zero. Assisted capture uses fewer attempts and therefore tends to have lower talent XP; legal Bloom eligibility and earned weapon type are checked separately for E10 replays. The assisted caster cohort includes one character with Daggers + Tome rather than the desired Wand/Staff, so it is not counted as a caster in that replay. No forced unlocks or fabricated gear. This pilot was launched before the additional zero-ATK preservation guard; summoned Convergence Anchors are already excluded from ordinary attack clocks in native gameplay, but final guard has its own directed contract.

New cohort E10 replay aggregate still pending at the time of this checkpoint. Do not present pilot account coverage as an E10 win rate or mix these populations with the paired historical samples. The target is 5–10 eligible distinct actors per build, with additional account seeds or legitimate earned-XP training if needed; do not force eligibility.

No merge/deploy. Enemy balance and elite/boss validation remain future stages.
