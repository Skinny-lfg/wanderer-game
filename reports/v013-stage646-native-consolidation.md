# Stage 6.46 — Consolidated Piercing, weapon status propagation, Carrion

**Status: implemented and matched E10 replay verified; full corrected regression pending. No merge or deploy.**
- Gameplay commit: [f83412f](https://github.com/Skinny-lfg/wanderer-game/commit/f83412fd055b7b7d95617ae333e0fb9e9ef03ea5).
- Source: [Stage 6.45 verified research](v013-stage645-blood-decay-piercing.md), 6,000 matched native fights. The user explicitly selected single-extra 100% Piercing plus statuses.
- Native E10 and full npm regression: [run 45353646342](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45353646342).
- Earlier directed AoE access CI at the gameplay commit: [run 45353576292](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45353576292), success.

## Actual gameplay changes

1. Bow hits exactly one additional active target: 66% without the talent (research starting coefficient), 100% with Piercing. Does not change the normal single-target attack. Uses the secondary target's Defense. No target-cap increase.
2. All weapon-generated secondary hits share one status bridge. Eligible Bleeding Edge and Toxic Touch use actual rank-dependent chance and native application/scaling, 50% relative probability and potency, separate per-target cooldowns of .9s/1.3s, paid native Rot Mana. Fury Sunder preserves the same target cooldown and cap with half probability and strength. Enemy-facing equipment Bleed/Burn/Slow/Sunder use native applyAffinity with half probability and status potency; eligible magic offhand status affixes also use the bridge. Self-healing/Barrier and direct bonus-damage effects are not propagated. No recursive onAttack.
3. Carrion replaces the old consume-one-Bleed-and-Rot on-hit handler. Direct physical weapon damage actually taken by Health, including eligible secondary weapon hits, charges an enemy affected by Bleed and Rot. Threshold 1.5x Attack Power (minimum 10), then 0.75x threshold burst to other living active enemies, 35% of that burst to marked foe, raw damage capped at 25% normal / 8% elite / 4% boss maximum HP before combat modifiers. 1.5s cooldown per marked enemy. Spread copies of an original Bleed and Rot at half strength, up to three remaining ticks, flagged nonrecursive. No damage or spread to reserves. Charge resets when required DOTs expire. Contagion and Bloodshed unchanged.
4. Talent and weapon descriptions, a Carrion charge indicator, script cache keys, canonical modules and Pages mirrors updated. Native simulator exports first kill time and weapon-status/Carrion counters, no separate gameplay engine.
5. New actual-source contract tests do not patch source files. Earlier historical Stage 6.44/6.45 candidate patch scripts are research archives; replay their original commit if reproducing old experiments, not the new live-code checkpoint.

## Validation scope

Four legal E10 cohorts, each 100 seeds for 1/4/8/12 normal enemies (1,600 fights); original gear and XP from Stage 6.42 snapshots, same talent allocations and roster/seeds as selected Stage 6.45 experimental scenarios. Native replay imports only the old respec helper, never its patch function. Compare paired outcomes, status telemetry and Carrion activations with original Stage 6.45 samples. Extra equipment status behavior and expiration safety can cause genuine differences from the experimental results. Do not assert exact equality without inspecting output. CI also runs current npm regression and direct contract/mirror tests. No boss/elite or progression rebalancing in this stage.

## Open gates

- Verify all CI results, including any historic assertions superseded by intentional mechanics changes.
- Evaluate representative earned E10 gear/talents and full Dual Daggers. New numbers are starting candidates, not global E10 balance approval.
- Validate Thornbloom, wards, boss-specific caps and summons with Carrion before approving leader balance.
- Stage 6.47: Grave Bloom redesign and consistent funded cast / Arcane Infusion activation. Do not automatically advance before reviewing Stage 6.46.


## Verified native E10 results

[Replay and matched aggregate, run 45353646342](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45353646342): all eight replay shards and aggregation passed, **1,600 fights, zero timeouts**. Same two legally earned E10 actors per cohort, same talent allocations, gear, XP and encounter rosters as the selected 6.45 experiments.

| Cohort | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Fury Bow | 95→95% | 59→59% | 17→17% | 28→28% |
| Blood/Decay/Fury Bow | 77→77% | 57→57% | 45→42% | 48→47% |
| Blood/Decay Two-Handed | 69→69% | 67→66% | 57→56% | 51→51% |
| Blood/Decay Sword + Tome | 100→100% | 92→92% | 96→96% | 84→84% |

The small differences are consistent with the native charge-expiration safeguard; no new numerical tuning was performed. The Sword + Tome cohort matched the experimental outcomes exactly. Its eight-mob group retained 307 Carrion bursts. **Equipment status counters were zero across these four sampled cohorts**, so the matched replay does not establish E10 balance for the additional equipment-affix propagation feature. Functional contracts cover the status bridge; actual eligible earned affix cohorts still need targeted integration tests.

The directed native mechanics and mirror checks passed. The original full npm regression failed on two stale C1 assertions (343 vs 367 graph nodes; unversioned script src). Both assertions were updated, preserving their original invariants. [Corrected CI run 45353809961](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45353809961) is pending final confirmation. Do not claim full regression success until that run is verified.
