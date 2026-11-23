# Stage 6.42 — E10-only native calibration, matched evidence and acceptance gates

**Status: candidate committed to isolated `balance/stage-6.40-e1-calibration` branch; NOT APPROVED for merge/deploy.** This file records executed results, not desired outcomes. Do not use the fact that CI passed as proof of game balance.

## Scope and no-stacking changes

- The only normal-group balancing pass is `WandererV012CombatCore.applyNormalRoomBudget`, which blends **opening and mature** coefficients in the same existing formula. Earlier `applySoloNormalReinforcement`, `applyNormalRoomMinionProfile`, `applyMinionEscortRelief` and extra runtime group-pressure passes are retired.
- Changes to all eight Elite identities are direct values in `ELITE_ARCHETYPES`; six Boss mature identities are direct `BOSS_BASE` values in `combat/expedition-progression.js` (Stormglass Conductor preserved during the last tuning pass). Every code change has a `docs/` mirror.
- No extra combat multipliers or E-specific overrides were introduced. The E1 starting normal-group values were preserved by smoothly blending E1→E10 in the same canonical function; the 20 structural/regression tests passed.
- **E1–E9 are not being calibrated as an objective now.** Because the shared formulas interpolate between opening and E10 values, the new mature coefficients still influence natural E2–E9 progression. Therefore the observed change in who *reaches* E10 is selection bias; it must not be misrepresented as an E10-only effect.
- Telemetry correction includes transferred Bleed/Rot and Grave Bloom as secondary DOT when actually applied, without changing their native damage.

## Latest native GitHub E10 run

Original 18-cohort GitHub Actions run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45269240361. Preflight **20/20 passed**, early E1/E2 job **skipped**, 17 of 18 cohort jobs completed. The last job, `plate-warden/9863`, reached E10 but encountered a **native first-ring solo combat timeout**, originally causing a runner error.

Recovery run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45270269153. **Verified success**: imported all 17 original JSON artifacts, reran only `plate-warden/9863`, retained an actual timeout as **censored, never a win or defeat**, and aggregated 18 accounts on the same game source fingerprint `98fc9ed555d031e6ad421b39219e4ad0214dcdf2f4ebfbaedd55524fa47bd180`.

- **9/18 genuinely reached E10**; **1/9 with actual AoE**; this is not an adequate AoE-versus-Single Target natural cohort.
- The earlier 6.42 candidate's 14/18 E10 reach does **not** make a direct E10 enemy-strength comparison: changed E2–E9 difficulty alters survivor selection.
- This test ran 2 controlled native combat seeds per reachable character, first-ring Risk 1, with real earned Camp gear/XP/Talents. Plate Warden is only partly observed: 22 fights before one censored timeout.
- Repeated fights within one character are correlated; n=17 resolved per identity is not 17 independently sampled human players.

| Group (mobs) | Player wins (resolved, censored excluded) |
|---|---:|
| 1 | 17/17 (100%; **one timeout** excluded) |
| 2 | 17/17 (100%) |
| 3 | 17/17 (100%) |
| 4 | 13/17 (76.5%) |
| 5 | 14/17 (82.4%) |
| 8 | 10/17 (58.8%) |
| 12 | 13/17 (76.5%) |

| Elite identity | E10 player wins |
|---|---:|
| Tank | 12/17 (70.6%) |
| Berserker | 13/17 (76.5%) |
| Vampire | 17/17 (100%) |
| Caster | 17/17 (100%) |
| Gravecaller | 7/17 (41.2%) |
| Oathbound Exarch | 15/17 (88.2%) |
| Briarspine Horror | 17/17 (100%) |
| Ashen Executioner | 14/17 (82.4%) |

| Boss affinity | E10 player wins |
|---|---:|
| Blood | 12/17 (70.6%) |
| Decay | 7/17 (41.2%) |
| Vitality | 10/17 (58.8%) |
| Aegis | 10/17 (58.8%) |
| Fury | 10/17 (58.8%) |
| Magic | 7/17 (41.2%) |

The Boss category has improved in some identities, but some Elites remain much too weak relative to a target near 60–70%, and Gravecaller may be too strong. No exact-percentage microtuning is justified by this survivor-selected sample.

## Independent E10 matched comparison, with progression held FIXED

To isolate E10 combat difficulty from E1–E9 survivor selection, the local native simulation replayed **the same eleven genuinely earned E10 Camp snapshots**, their exact XP, Talents, equipped items and seeds, against the pre-6.42 source and the final current mature-budget candidate. One native trial per identity and 7 group sizes, **11 observations per encounter**. The same accounts in each arm; three are actual AoE-capable (two Two-Handed, one Bow), eight lack active AoE. These are laboratory fights, not natural full-Expedition completions.

| Group | Previous source | Current candidate |
|---|---:|---:|
| 1 | 11/11 | 11/11 |
| 2 | 11/11 | 11/11 |
| 3 | 11/11 | 11/11 |
| 4 | 8/11 | 8/11 |
| 5 | 9/11 | 9/11 |
| 8 | 10/11 | 6/11 |
| 12 | 10/11 | 5/11 |

In the 12-enemy arm, the **non-AoE** group changed 7/8→4/8 and the **actual AoE** group 3/3→1/3. **This violates the proposed goal for strongly specialized AoE against large groups.** The Bow pierces only one secondary target even with high attack speed, not the whole swarm. Treat Bow+Fury as limited cleave, not indiscriminate AoE. Do not buff groups universally to force AoE to win.

| Elite | Prior | Candidate |
|---|---:|---:|
| Tank | 11/11 | 4/11 |
| Berserker | 7/11 | 6/11 |
| Vampire | 11/11 | 9/11 |
| Caster | 10/11 | 9/11 |
| Gravecaller | 11/11 | 6/11 |
| Oathbound Exarch | 11/11 | 8/11 |
| Briarspine Horror | 10/11 | 10/11 |
| Ashen Executioner | 8/11 | 8/11 |

| Boss | Prior | Candidate |
|---|---:|---:|
| Blood | 10/11 | 10/11 |
| Decay | 8/11 | 4/11 |
| Vitality | 11/11 | 8/11 |
| Aegis | 9/11 | 8/11 |
| Fury | 11/11 | 10/11 |
| Magic | 7/11 | 4/11 |

The second-trial extension was started but **exceeded the local execution limit before completing**, so its partial observations are excluded entirely from this report.

## Real E10 DOT specialization coverage

GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45268656635 (6/6 jobs passed).

| Build | Real E10 | Ability earned | Native activations | Recorded secondary DOT |
|---|---|---|---:|---:|
| Decay + Blood seed 9861 | yes | Plague Spread | 124 transfers | 342 |
| Decay + Blood seed 9863 | yes | Plague Spread | 112 transfers | 378 |
| Magic + Decay seed 9861 | yes | Grave Bloom | 0 attributed | 0 |
| Magic + Decay seed 9863 | yes | Grave Bloom **not yet earned** | 0 attributed | 0 |

Grave Bloom was earned and prepared by the first Magic + Decay character, but did not produce measured secondary damage in the studied first-ring group fights; its activation/cast conditions need separate investigation before any buff or nerf.

## Current acceptance verdict and next concrete work

**Candidate NOT ACCEPTED for release.** No merge or deploy.

- **Mobs:** single/2/3 too easy for available E10 characters; large groups improved in difficulty, but ST/AoE matchup is not correct (specialized AoE also collapses). Inspect damage effectiveness, Minion/principal composition and Bow target cap, then revise **the same single normal-room budget** or direct weapon AoE mechanic, no emergency rules.
- **Elites:** target rough 60–70%; Tank and Gravecaller are around/under this band depending on cohort, whereas Vampire, Caster, Briarspine and Oathbound remain too easy. Investigate identity mechanics before further direct-stat changes.
- **Bosses:** some identities around 41–59% but Blood remains much too easy (~71%), while the earlier fixed-snapshot data show substantial heterogeneity by player. Prefer a modest identity-level adjustment only after seeing representative AoE and ST comparators.
- **Cohorts:** real E10 population contracted to 9/18 and only one AoE entrant; build a control panel from fixed earned E10 snapshots and cover Fire/Lightning, Rot-spread, Bow, Two-Handed, pure Single Target and hybrid before accepting enemies.
- **Progression E1–E9 remains a separate later phase**. Do not run an E2-specific calibration to disguise the E10 issue. The full game curve will be revisited once E10 is stable.

**Technical outcome:** genuine E10 samples, a 17-artifact recovery instead of rerunning all, a repaired timeout-aware simulator, DOT telemetry validation, and explicit rejection of a poorly balanced candidate. Gameplay constants remain provisional in the isolated branch.
