# Wanderer v0.13 — Stage 5 · Expedition Conditions + native simulation

**Status:** implemented on the draft stacked PR #53, based on #52. **No merge or deploy.** Published v0.13 and live v0.12 remain unchanged.

## Scope and gameplay contract

Stage 0 already supplied a deterministic three-card manifest with six lore-approved conditions and conflicts. Stage 5 now activates those planned conditions without creating a second combat system or simplifying the 18/20/22-room map.

| Condition | Native implementation | Counterplay |
| --- | --- | --- |
| Relentless Hunt | Exactly 2 selected normal combat rooms, enemies attack at ×1.15 speed | Block, Barrier and control |
| Carrion Swarm | Exactly 2 normal combat rooms with deterministic 18–22 weaker enemies, retaining the four-active-slot reinforcement rules | Area damage and attack speed |
| Unbroken Ward | Boss starts with extra Barrier equal to 15% of its max HP; no guard receives the bonus | Sustained/Barrier-breaking damage |
| Blighted Ground | Player healing ×0.85 in 2 marked normal rooms; Barrier is unchanged | Preserve potions and plan recovery |
| Veiled Passages | Exactly 2 real, non-secret map edges charge +1 travel step on their first crossing only; no topology edits | Inspect highlighted routes and budget steps |
| Sanguine Rite | At boss HP strictly below 50%, one-time Attack ×1.12 and attack speed ×1.08 | Hold defensive cooldowns for phase two |

All six remain affinity-eligible, conflict-safe and distinct across the three Realm Cards, as enforced by the Stage 0 manifest. The stage-specific RNG channel is `condition_v1_<realm>_<condition>`, derived from the manifest seed so combat and ordinary map RNG are not consumed by condition placement.

The condition state lives in the normal run. The only new persistent field is `dungeon.conditionEdgesUsed`, an at-most-two-item list of canonical edge IDs. The current controller validates its content and ensures first-crossing surcharges cannot be repeated through travel or reload. No production save schema or Firebase writes were introduced.

### UI

Realm Card: name, precise danger and counterplay. Realm map: active condition text; visible marked rooms and two dotted/pink Veiled edges. Do not show hidden rooms or secret shortcuts to the player.

### Simulation: two tiers

1. Existing native simulator `scripts/simulate-progression.cjs` now accepts `--mode=conditions`: it takes **all three naturally generated cards** for each supplied E/build/seed, follows a real route and records wins, deaths, timeouts, economic deltas, duration, HP, damage, condition exposure, Sanguine triggers, Barrier grants and Veiled crossings. The selected route is **not guaranteed to be optimal** and defeated runs remain defeated.
2. `scripts/v013-stage5-stress.cjs` groups those native runs by E/build/difficulty/condition, plus pooled observational breakdowns, reports 95% Wilson intervals, mean time/damage/lowest HP, p50/p90 duration, encounter exposure and missing-condition warnings. It explicitly warns that the condition comparison is confounded by Realm affinity, route and risk. It never converts exceptions or unfinished maps into victories, nor asserts that a six-run smoke sample proves balance.

**Validated baseline:** GitHub Actions [run #44191893667](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44191893667) passed Stage 5 focused checks **13/13**, current native v0.13 **237/237**, mandatory simulations **7/7**, current P0 safety **15/15**, and Expedition/checkpoint **25/25**. Two-seed smoke passed 6/6. A separate **192 native dungeon** stress matrix (four seeds × E1/E15/E50/E200 × four builds × all three naturally offered Realm Cards) produced **176 wins, 16 ordinary losses, zero errors, zero timeouts and zero blocked routes**. Every one of the six Conditions appeared (Relentless Hunt 20, Carrion Swarm 32, Unbroken Ward 36, Blighted Ground 16, Veiled Passages 56, Sanguine Rite 32). These counts are observations, not relative difficulty or causal effect estimates.

**Expanded stress checkpoint:** Stage 5 CI now includes **1,152 real dungeons** (24 seeds × E1/E15/E50/E200 × four builds × three Realm Cards). It archives individual scenarios, detailed cohorts and pooled observational summaries by Condition, difficulty, build and Expedition Level, including median and 90th percentile fight duration, 95% Wilson win intervals and coverage warnings. These are useful technical/balance signals, not sufficient evidence for final sign-off without representative play strategies and full progression.

## How to run a larger analysis

```bash
npm ci
npm run test:v013:gate
npm run test:v013:stage5
node scripts/v013-stage5-stress.cjs --seed-start=9101 --seed-count=48 --levels=1,15,50,100,200 --builds=all --out=reports/v013-stage5-stress.json
```

The example uses 48 × 5 × 4 × 3 = **2,880** dungeons within the 3,000-dungeon safety cap. Repeat with a different `--seed-start` for independent samples. Do not change source formulas, gear, the map or acquisition rules merely to hit a desired win rate.

## Limitations and next checkpoint

- These runs hold a fixed synthetic gear/talent budget; they do not simulate complete long-term gear drops, social play or learned human route selection. Conditions are implemented on a real Realm Card rather than across fifteen independent Realm progressions.
- Stage 4.5.6 P0 candidates (overflow / guaranteed boss Runes / Crimson Fang interactions / Legendary timings) remain tracked. This Stage 5 workflow re-runs the existing targeted P0 assertions as blockers; any newly confirmed gameplay defect must be fixed before final balancing.
- Required before **final balance sign-off**: larger independently seeded samples covering all four builds/levels/difficulties/conditions, sufficient sample size, real player strategy comparison, and human playtests. A 100% win rate on six starter runs is not evidence of ideal difficulty.
- Keep PR in draft and isolated from the GitHub Pages published preview until a specific deployment decision.

**Gate for Stage 5 completion:** current v0.13 tests, all six pure/native condition checks, natural three-card simulation and browser map/offer checks pass; no confirmed blocker. Release/production remains a separate decision.
