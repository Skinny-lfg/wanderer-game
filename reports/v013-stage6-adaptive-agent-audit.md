# Wanderer v0.13 — Stage 6 refined agents: AoE, focus and mixed Affinities

**Status:** native simulation agent logic refined and regression-validated; **gameplay balance is NOT READY**.
Working branch: `audit/v013-stage6`. The live game, main branch, published build and combat coefficients were not changed.

## 1. Verified improvements

- `scripts/v013-agent-strategy.cjs`: classifies owned weapon, off-hand, armour, actual v15 talent nodes, selected element and active build. Reports four independent continuous values: area, focused damage, defence and real native talent investments.
- Distinguishes **combat damage mode** (AoE, single-target, both, defensive, developing) from **Affinity composition** (no earned affinity, one earned affinity, two or more earned affinities) and **mixed synergy** (genuine cross-axis skill unlocked or still only potential).
- `scripts/v013-natural-progression.cjs`: can use adaptive Realm choice with only publicly visible card information (Affinity/Boss, first revealed omen, condition, risk, item bias), adaptive legal room pathing, and current HP, Bag, available gear and real AoE capacity. No hidden modifier is consulted for selection.
- Real native player-click target priorities for mechanics-aware profiles: Blood Vessel, Matriarch Brood, Stormglass Anchor, Heartroot Mawbud avoidance and situational Gravecaller Deathbound. Thornbloom remains a visible reactive counter.
- Crucial correction: the agent **respects an explicitly selected focus target policy** (Daring/Leather Duelist) instead of silently replacing it with generic mechanics-first attacks. That was the principal cause of the observed Duelist regression.
- Passive/read-only telemetry: net HP and Barrier lost by actual Boss, Elite, Minion and normal enemies, non-focused loss, newly observed enemies, target switches, subtype, modifiers and composition. It is **not source-attributed DPS**; DOTs, healing within a tick and reinforcements complicate attribution.
- `scripts/v013-stage6-agent-comparison.cjs`: repeatable paired *initial* seeds with real account XP, legitimate loot, native gear, native talent purchases, no synthetic unlocks. Separate diagnostic `scripts/v013-stage6-policy-ablation.cjs` isolates each decision policy.

## 2. Final natural E1–E2 comparison

**CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44769237928
29 final relevant automated tests passed (0 failed). Additional 63 tests passed at the earlier full native/checkpoint run https://github.com/Skinny-lfg/wanderer-game/actions/runs/44768762731.

Four seeds (9701–9704), five profiles, twenty independently created native accounts per policy. Up to 18 attempts per Expedition level and 36 total per account.

| Metric | Risk-aware baseline | Refined adaptive |
|---|---:|---:|
| Accounts | 20 | 20 |
| Total attempts | 373 | 361 |
| E1 cleared | 13/20 | **13/20** |
| E2 cleared | 9/20 | **10/20** |
| Errors | 0 | **0** |

### Per profile: account-level clears

| Profile | Baseline E1/E2 | Adaptive E1/E2 |
|---|---:|---:|
| Balanced | 4/4 / 4/4 | 4/4 / 4/4 |
| Plate Warden | 4/4 / 4/4 | 4/4 / 4/4 |
| Leather Duelist | 3/4 / 1/4 | **3/4 / 1/4** |
| Magic Lightning | 1/4 / 0/4 | 1/4 / **1/4** |
| Hexblade Hybrid | 1/4 / 0/4 | 1/4 / 0/4 |

### Observable build-aware behaviour

- AoE: grouped fights in **8/15 (53%)** adaptive observations versus **8/21 (38%)** baseline.
- Both AoE + focused: grouped fights in **25/49 (51%)** adaptive observations versus **13/45 (29%)** baseline.
- Predominantly single-target: grouped fights in **25/67 (37%)** adaptive observations versus **16/32 (50%)** baseline.
- Mixed-Affinity ownership (two Affinities actually acquired) is observed in **49** adaptive fight records versus **68** baseline. But **zero acquired mixed-axis skills** appeared in this E1–E2 pilot; these are dual-affinity foundations, **not mature mixed-synergy builds**.
- These are distinct distributions of naturally acquired equipment and XP under different policies, not a controlled test of *damage build strength*. Encounter observations within an account are correlated.

### Why the Duelist originally regressed

Policy ablation on the same four Duelist seeds:

| Single intervention | E1 clears | E2 clears |
|---|---:|---:|
| Baseline | 3/4 | 1/4 |
| Realm choice only | 3/4 | 1/4 |
| Room choice only | 3/4 | 1/4 |
| Target switching only, *before correction* | **1/4** | **0/4** |
| All adaptive, *before correction* | **1/4** | **0/4** |
| All adaptive, explicit focus preserved, *final* | **3/4** | **1/4** |

The original reactive targeting overrode the explicit focus style. Protecting the focus policy restores baseline E1/E2 advancement while retaining AoE-aware routing. The ablation follows same initial seeds, but future RNG and earned resources diverge with actions.

## 3. Controlled native Boss and Elite target policy experiments

Synthetic but **native combat-executed** diagnostic fixtures, entirely separate from natural progression: fixed v15 24-point talent build, rolled equipment at the fixture tier, real 6 Affinity Bosses, and specifically selected 4 Elite types. Three target policies (focus, mechanics, adaptive), identical pre-fight native snapshot SHA for each matched policy set. Each fixture includes 60 matched scenario sets, **0 invalid pairings and 0 runtime errors**.

| Controlled fixture | Boss wins per policy, out of 36 | Elite wins per policy, out of 24 |
|---|---:|---:|
| E5 Rare, Dangerous | 0/36 | 23/24 focus; 23/24 mechanics; 22/24 adaptive (before Gravecaller retarget correction) |
| E1 Epic, Guarded | 36/36 | 24/24 |
| E1 Rare, Guarded | 36/36 | 24/24 |
| E5 Epic, Dangerous | 2/36 | 24/24 |

CI:
- https://github.com/Skinny-lfg/wanderer-game/actions/runs/44768335336
- https://github.com/Skinny-lfg/wanderer-game/actions/runs/44768762731
- https://github.com/Skinny-lfg/wanderer-game/actions/runs/44769342244

**Important:** These controlled conditions are too polarised to establish an optimal Boss target policy. Mechanic-first clicks are exercised (and some Boss summons are prevented), but wins are nearly always identical. At E5 Epic Dangerous, all three policies won 2 of 36 Boss fights; at E1 Rare Guarded all three won 36 of 36. The game has not been changed or balanced from this test.

## 4. Limitations and next verification stage

1. E1–E2 does **not** provide enough earned XP to reliably observe complete mixed-axis abilities. Expand natural E3–E8 progression **after** investigating the historical E3 `Invalid talent progress` exception (seed 9701, Daring, attempt 14); do not suppress it by resetting the simulator.
2. Test Boss and Elite abilities at genuinely intermediate difficulty and with realistic staged preparations, so target decisions have a measurable effect; current controlled extremes establish correct scenario pairing and safe execution, not balancing superiority.
3. Add exact **source-tagged secondary damage** to simulation telemetry, if necessary; observed net loss is only an approximation, not a true AoE damage-source counter.
4. Re-examine Gravecaller target switching: the controlled native sample suggests that refocusing summoned minions can increase damage taken under some conditions. Keep it a situational counter rather than unconditional targeting.
5. More seeds and real playtesting are required. **No buffs or nerfs are justified by this small experiment.**

**Native integrity:** no forced player XP, guaranteed loot, forced Boss victories, arbitrary enemy HP changes, or artificial Expedition unlocking in natural-account comparisons. Controlled Boss/Elite fixtures deliberately stage battles and fixed talent budgets and must not be presented as natural player progression.

**No merge, deployment or published game changes.**
