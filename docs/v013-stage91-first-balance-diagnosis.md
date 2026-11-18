# Wanderer v0.13 — Stage 9.1: First balance diagnosis

## Purpose

Observe the **current native combat system** after Stage 7 and Stages 8.0–8.5. Do not alter HP, damage, AI, cooldowns, gear or progression. The Stage 9.1 runner uses three real v0.13 simulator modes in scripts/simulate-progression.cjs:

1. Six real Affinity Bosses × risk Normal (0), Dangerous (1), Deadly (2).
2. Normal groups of 3, 12 and 20 with current Stage 8 minions/casters and abilities.
3. Seed-dependent native Elite fights; all observed Elite archetypes are named in the report.

**No obsolete v0.12 simulation script is executed.** The native v0.13 harness retains the historical filename tests/v012-economy-harness.cjs, but it loads the live game runtime.

## Commands (Node 22, repository root)

~~~sh
npm run test:v013:stage91
npm run test:v013:balance

# Default pilot: 2 seeds × 3 builds × (6 Bosses × 3 risks + 3 swarm sizes + 1 Elite) = 132 fights
npm run diagnose:v013:stage91

# Small focused recheck
npm run diagnose:v013:stage91 -- --builds=blood-fury --seeds=9101,9102 --risks=1 --affinities=magic,blood --out=reports/stage91-focus.json

# Early game: 0 talents; do not compare to synthetic 24-point E15 builds
npm run diagnose:v013:stage91 -- --levels=1 --points=0 --rarity=Common --builds=blood-fury --seeds=9101,9102 --out=reports/stage91-e1.json

# Native manual-counterplay policy; compare same level/build/risk/resolvedSeed
npm run diagnose:v013:stage91 -- --target-policy=mechanics --out=reports/stage91-mechanics.json
~~~

Supports standard v0.13 simulator CLI controls: levels, seeds, builds, affinities, risks, group-sizes, points, rarity, gear, runes, target-policy, tick-limit and out (each as --name=value).

**Hard cap: 240 cases per invocation**. For larger evidence, filter dimensions into separate comparable cohorts. JSON and Markdown are written together at reports/v013-stage91-diagnosis.json and .md by default; CI stores them as artifacts and never deploys.

## Measured dimensions

- **Coverage:** requested/actual fights, six Boss Affinities, observed Elite archetypes, source hash, errors and timeouts.
- **Strata:** Boss/Affinity, build, difficulty, level; for swarms, group size; for Elites, actual Elite archetype.
- **Outcomes:** win/death separated from errors and timeouts. Win percentage is calculated only on resolved fights.
- **Duration and survivability:** p50/p90 seconds, damage dealt/taken, absorbed Barrier, Mana spent, median minimum/final HP.
- **Ability proxies:** casts/minute, Boss summons/healing/wards, preparations/interruptions, arcane pulses, node destruction, Elite summons, target switches.

**This does not attribute damage to each individual player skill or enemy ability.** "Ability efficacy" means observable cast frequency, mechanic consequences and whole-build output/survival, not skill-by-skill DPS. Stage 9.2 can add direct skill attribution if the initial data requires it.

## Reading the flags

The reporter flags errors, timeouts, no completed fights, under 5 completed fights per cell, median duration of at least 90 seconds, median lowest HP of at most 15%, and at least 50% deaths when 2+ resolved fights exist. Thresholds are exploratory triage signals, **not approved balance targets**. Most first-stage cells have n=2, so do not infer rates or rebalance from this report alone.

## Comparability and limitations

- Boss Affinities may use different resolvedSeed values to find a real Realm card. Cross-Affinity comparisons are **not** matched A/B experiments. Pair by resolvedSeed only **within** a fixed Boss/Affinity/risk/build.
- Boss/Elite encounters run in a controlled first-ring room, not through all 15 Realms or a complete Expedition.
- Default E15 has 24 **synthetic** talent points. Real E1 starts with zero, and gear is fixed during each controlled fight.
- No automatic potion timing, between-room equipment upgrades, crafting/trading, optimization of routes/Boons/Contracts, or full manual play.
- Elite archetype depends on seed; missing Elite types are explicitly untested.
- Stage 8.5 animations are visual-only and excluded from damage balance measurements.

## Stage 9.1 exit criteria

1. Unit tests and v0.13 balance simulator smoke pass.
2. Repeatable pilot report generated with all six Bosses, three risks, three builds, swarms and observed Elites.
3. No silent accounting of timeouts/errors as deaths. Source fingerprint and unresolved coverage visible.
4. Identify suspect cells for Stage 9.2 before touching combat constants.
5. Later validation requires 30–100 independent seeds per relevant cell and manual playtests.
