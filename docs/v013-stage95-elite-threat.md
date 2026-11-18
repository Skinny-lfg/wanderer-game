# Wanderer v0.13 — Stage 9.5: Elite threat vs normal Tanks

## Scope

This branch deliberately separates **live gameplay balance** from Stage 9.4/9.4.1's **simulator-only decision changes**. It is stacked on the Stage 9.4 PR and **is not merged or deployed**. No equipment, drops, talents, Boss stats, map topology, or ordinary Tank balance is changed.

## Observed problem

Stage 9.4.1's natural, earned-account E1 encounters indicated that Elites were often easier than normal single enemies (and were defeated in all 9 E1 and all 4 E2 natural Elite fights in the targeted cohort). In that uncontrolled progression sample, 9 E1 Elite fights cost an average of ~27.6 player HP damage and ~14.1 seconds; 22 single-enemy normal fights cost ~57.4 damage and ~20.6 seconds. These fights do **not** use matched starting gear/HP, so this comparison is descriptive only.

The new Stage 9.5 independent, **controlled** script runs the same E1 seed, card, player gear, and initial HP against (a) a *genuine role=Tank* drawn from the native seeded roster and (b) a randomly rolled native Elite leader. It stages the combat in a first-ring room; this explicit fixture is **not** a real Expedition progression route. Both use real combat physics and all real enemy abilities; no enemy receives synthetic HP during the fight.

## Verified 24 seed-matched Tank/Elite pairs per gear setup

| Same E1 gear | Metric | Original Elite | Revised Elite | Unchanged Tank |
|---|---|---:|---:|---:|
| Native starter | Wins out of 24 | 24 | 24 | 21 |
| Native starter | Mean damage received | 30.58 | 71.50 | 94.58 |
| Native starter | Mean combat duration | 16.32 s | 29.07 s | 45.63 s |
| Native starter | Stage 8.2 cast count | 0.13 | 0.88 | — |
| Fixed Common | Wins out of 24 | 24 | 24 | 24 |
| Fixed Common | Mean damage received | 15.67 | 33.29 | 49.25 |
| Fixed Common | Mean combat duration | 16.12 s | 27.19 s | 43.84 s |

Tank class abilities use the Stage 8.1 metric, not Stage 8.2. Their mean activated abilities stayed 5.79 with starter and 5.67 with Common gear. Legacy Elite passive mechanics are **not** necessarily represented in the Stage 8.2 cast counter.

## Live changes

- Elite endurance multiplier: **1.8× → 3×** of each archetype's original base HP, using the same live combat function that already applies the ordinary-mob 3× endurance; Boss multiplier remains 1.8×.
- Elite attack scale: **0.65× → 0.75×** after its existing archetype and difficulty multipliers. Normal mobs and Bosses remain at 0.65×.
- Solo **Rotbound Exarch** uses its existing 15%-max-HP Barrier on itself when no ally is available, instead of idling through the encounter. If an ally is present, it still prioritizes the ally. No new cooldown or ability has been invented.
- The Exarch tooltip accurately reflects the solo behavior in the game and published docs mirror.

## Earned-account regression (two profiles, one seed, up to 12 attempts each)

- **E1:** 24 native attempts; 9 Elite encounters, **9 wins**; 7 Boss encounters, **0 Boss victories**; no simulation errors.
- Previously, on the identical Stage 9.4.1 cohort, one native E1 Boss win unlocked E2. The new cohort did **not** unlock E2.
- The stronger Elites noticeably increase pre-Boss attrition, even if they are still generally beatable. Do not treat the missing Boss victory as definitive causal evidence: sample is small, and a single Boss result can vary after different rewards and combat RNG.
- E2–E8 remain **not reached**, not 0% success rates, in this revised cohort.

## Recommendation before release

**Provisional balance proposal; do not auto-merge.** The paired test establishes that the Elites were clearly undertuned versus individual Tanks, and the targeted changes narrow the gap without modifying Tanks. However, the natural E1 regression indicates that cumulative Expedition survival must be verified on broader native cohorts and by actual players before choosing whether 3×/0.75× is the final tuning.

Native tests: `node --test tests/v013-stage95-elite-parity.test.cjs`, `node --test tests/v013-stage82-elite-abilities.test.cjs`, `npm run test:v013:natural`, `npm run test:v013:human-decisions`, `npm run test:v013:balance`. The Stage 9.5 workflow also runs controlled starter/Common comparisons and a real earned-account E1–E8 cohort without deploying the website.
