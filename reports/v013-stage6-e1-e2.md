# Wanderer v0.13 — Stage 6: E1/E2 native progression audit

**Date:** 20 November 2026
**Status:** Pilot executed; diagnostic findings available; **not yet balance-approved**.
**Branch:** audit/v013-stage6, based on audit/v013 at 1bb4dd66eace660af82ed7b16af1495a2c015997.
**Tested revision:** b56194d09be6fa480cca721217d43fd095aa05da.
**GitHub Actions:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44758379623
**Artifacts:** stage6-e1-e2-A (ID 14640256205) and stage6-e1-e2-B (ID 14640591491).

## Experiment

- Four independent deterministic map seeds: 9701, 9702, 9703 and 9704.
- Ten natural decision profiles, four accounts/profile: cautious, balanced, daring, plate-warden, magic-fire, magic-frost, magic-lightning, cloth-battlemage, leather-duelist, hexblade-hybrid.
- 40 persistent native accounts; each starts at E1 with starter gear and zero earned talents.
- Maximum 18 attempts per E, 40 total attempts per account. E2/E3 are only entered after a native Boss win at the previous level.
- Native seeded rooms, loot, XP, stats, equipment, Camp actions, potion use, talents, Boss preparations and combat tick mechanics; **no forced rewards or gameplay number changes**.
- The four seeds are reused across the ten profiles for strategic comparisons, so 40 accounts are **not 40 independent seeds**.
- Cohort A passed (20 accounts, 492 attempts, 0 errors). Cohort B ran 20 accounts / 497 attempts but exited nonzero due to one native talent-progress error during E3. Both raw artifacts are preserved. Validate job passed regression tests and analyzer syntax.
- Full reports are available in workflow artifacts. Cohort B did not produce the custom summary because the native CLI correctly returned nonzero on the error; the combined figures below were recomputed from both preserved raw JSON outputs. Do not mistake its failed CI status for invalidating all observations.

## Observed progression

| Expedition | Accounts entered | Attempts | Boss encounters | Boss victories | Combat deaths | Extractions | Native errors | Mean first-fight HP lost |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| E1 | 40 | 545 | 103 | 28 | 211 | 306 | 0 | 43.53% |
| E2 | 28 | 284 | 91 | 19 | 113 | 152 | 0 | 36.95% |
| E3 | 19 | 160 | 67 | 15 | 61 | 83 | 1 | 28.14% |

Totals: 989 attempts; 1 observed native error; 28/40 accounts cleared E1, 19/40 cleared E2, 15/40 cleared E3 within the finite attempt budgets. These are account outcomes under scripted policies and are **not measured human-player win rates**. A censored account is not proven unable to clear a level.

The current first-fight HP-loss averages include repeat attempts with legitimate accumulated gear. They are not directly comparable with the older ~62% initial-E1 one-attempt survey.

### By profile

| Profile | E1 cleared / 4 | E2 cleared / 4 | E3 cleared / 4 | Attempts |
|---|---:|---:|---:|---:|
| Cautious | 4 | 4 | 4 | 88 |
| Balanced | 4 | 4 | 4 | 83 |
| Plate Warden | 4 | 4 | 4 | 64 |
| Cloth Battlemage | 3 | 2 | 2 | 107 |
| Daring | 2 | 2 | 1 | 112 |
| Leather Duelist | 3 | 1 | 0 | 118 |
| Magic Fire | 3 | 1 | 0 | 126 |
| Magic Frost | 3 | 1 | 0 | 127 |
| Magic Lightning | 1 | 0 | 0 | 87 |
| Hexblade Hybrid | 1 | 0 | 0 | 77 |

A striking directional contrast exists between Cautious/Balanced/Plate Warden and Magic Lightning/Hexblade Hybrid, but four seeds per profile are **insufficient to identify balance changes or rank all builds reliably**. Gear access and the scripted planner may explain some of this gap.

## Failure localization

Deaths by last combat room:
- E1: 75 Boss, 73 ordinary combat, 63 Elite.
- E2: 72 Boss, 17 ordinary combat, 24 Elite.
- E3: 52 Boss, 3 ordinary combat, 6 Elite.

Bosses account for approximately 64% (72/113) of E2 combat deaths among observed attempts. This is a stronger argument for isolating Boss mechanics and preparation than for a global enemy-damage reduction. The Boss encounters are correlated repeats with differing native gear; do not treat them as controlled, independent Boss win rates.

Actual Boss preparation observed on entry: 42/103 E1 Boss-reaching attempts; 45/91 at E2; 39/67 at E3. Investigate preparation opportunity and route choice separately from Boss combat power.

## Economy and decision behavior

| Metric | E1 | E2 |
|---|---:|---:|
| Gear drops | 447 | 272 |
| Common (Grey) drops | 257 | 123 |
| First fights won without loot | 263 | 153 |
| Forge pieces crafted at Camp | 175 | 128 |
| Merchant gear purchases | 6 | 10 |
| Potions used | 164 | 176 |
| Extractions marked protect_carried_loot | 242 | 130 |

E1 extraction reasons were dominated by saving carried loot: 242 of 306 extractions. Another 32 returned to Camp to invest. These are rational under the scripted policy's weights but may be overconservative compared with a human player willing to push the Boss. They cause slower E1/E2 unlocks without necessarily indicating combat overtuning.

The Forge is used extensively, while the Merchant is rarely used for gear. That deserves a comparison of legal stock, affordability, actual marginal upgrade value and scorer behavior before concluding Merchant availability is faulty. No loot is guaranteed and none was added.

## Simulator defect discovered

**Reproduction candidate:** seed 9701, profile daring, E3 attempt 14, after long native progress, at XP 2,941 and 28 allocated nodes in the prior successful attempt. Runner error: "Invalid talent progress"; account stopped. Earlier E3 attempts with a prepared Last Bastion skill were recorded. This must be traced to the exact v15 talent validity operation before declaring a gameplay bug or changing talent rules.

Reproduction command (not yet independently re-run):

    node scripts/v013-natural-progression.cjs --seeds=9701 --profiles=daring --max-level=3 --max-attempts=18 --max-total-attempts=40 --out=reports/stage6-repro-9701.json

Important nuance: source fingerprints between the two cohorts differ because Node patch versions differ (v22.23.4 vs v22.23.5); the existing sourceFingerprint explicitly includes process.version. Both workflows used the same Git revision and identical hashes for the three key source files in provenance. Do not mistake this for an actual code-change difference.

## Stage 6 decision

1. **Keep gameplay balance frozen.** No evidence yet supports a global buff or nerf.
2. **Fix the simulator validity issue** with focused seed reproduction and v15 graph-state trace; distinguish runner/player-policy defects from genuine runtime bugs.
3. **Audit build policy and early equipment access:** compare legal gear offers, Forge timing, talent path viability and early-caster power under matched seeds. The hardest profiles may be making inefficient decisions or might be underpowered.
4. **Isolate Boss difficulty** by Boss affinity, guards, minions, status, attack frequency and Boss preparation, using legitimately earned same-checkpoint equipment; do not mix this with the synthetic Off-Hand benchmark.
5. **Expand seeds only after the gate is green** (first 12–20 seeds/profile, then larger 100–1,000-seed sets as compute budgets permit). Preserve deterministic source fingerprints, artifact provenance and censored-account labels.
6. Examine Tome only after obtaining meaningful natural Mana-user coverage. The Stage 5 synthetic Tome result alone is insufficient to set a coefficient.

**No main merge, deployment, edits to gameplay stats, loot rates, talent coefficients, Bosses, or actual player saves.**
