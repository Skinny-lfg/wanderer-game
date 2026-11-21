# Wanderer v0.13 — Stage 6.9: Native Earned-Account Build Comparison

**Date:** 2026-11-21  
**Status:** COMPLETE — validated diagnostic only; zero gameplay balance changes.  
**Branch:** \`audit/v013-stage6\`  
**GitHub Actions run:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44861943367  
**Data artifacts:** \`stage69-global-earned-build-comparison\` plus twelve \`stage69-e*-*\` exact native replay artifacts.

## Objective

Evaluate whether the *talent build decisions*, rather than enemy stat scaling, explain major differences in survivability and early Expedition outcomes. This is **not a synthetic 100-point endgame build test**.

## Protocol — genuine characters, paired native Camp rebuilds

- A single successful native origin policy **smart-blood-fury-vitality** was progressed naturally from E1, independently for shared seeds **9701–9704**, to **E5, E8 and E10**. There were no level unlocks or injected gear.
- Each level/seed checkpoint is replayed in five conditions: **unchanged baseline**, **Blood pure**, **Blood/Fury**, **Blood/Fury/Vitality with no Mixed nodes**, and **Vitality pure**.
- Every condition has a cryptographically matched **entire prior E1–E{level-1} attempt history** and the **same pre-intervention Camp equipment, inventory, XP, talents, consumables, money and Expedition unlock state**.
- Variants use only the **real native Camp reset and Talent allocation actions**, retaining the exact original earned XP; they may change only their talent nodes, element or prepared skill. The simulator explicitly rejects a mutation to gold, gear, inventory, potions, resources or unlocks.
- There are **12 real checkpoints**, **48 legal respec interventions**, **60 complete native account replays to their first attempt at the sampled Expedition**, and **36/36 passing CI unit/regression tests**. All 12 independent CI trial jobs and the final aggregator passed.
- **All twelve starting weapons were actually acquired/equipped Swords** (one per seed/Expedition), not manually granted. This isolates *talent allocation* but is not a fair test of Magic caster gear or Two-Handed/Bow/Staff synergies.
- The first encounter was confirmed identical by Realm, affinity, risk, condition, contract, room, room kind and initial enemy count in **all 60 comparisons**. The five build variants therefore face the same opening scenario, although combat stochastic outcomes can diverge through different skill effects.
- Later routes, potion consumption and Boss encounters can diverge. **Whole-Expedition Boss wins are observational agent-policy outcomes, NOT controlled identical Boss fights**.

## Real character points and weapon before the paired change

| Expedition | Actual earned Talent points by seed 9701, 9702, 9703, 9704 | Weapon |
|---|---|---|
| E5 | 25, 21, 20, 26 | Sword ×4 |
| E8 | 40, 29, 35, 38 | Sword ×4 |
| E10 | 43, 33, 45, 42 | Sword ×4 |

## Opening-encounter outcomes

**Means over the four seed-paired *identical first encounters* per Expedition.** Observed DPS is total damage dealt divided by actual combat seconds, not theoretical target-dummy DPS. HP loss is normalized to the character's own maximum HP.

| Expedition | Talents | Opening HP lost | Observed DPS | Boss victories / 4 full first attempts |
|---|---|---:|---:|---:|
| E5 | Original Mixed | 33.94% | 50.66 | 1 |
| E5 | Blood pure | 33.59% | 57.28 | 1 |
| E5 | Blood + Fury | 34.16% | 48.43 | 1 |
| E5 | Three Affinities, no Mixed | 32.96% | 54.43 | 0 |
| E5 | Vitality pure | 35.69% | 21.00 | 1 |
| E8 | Original Mixed | 26.57% | 71.93 | 2 |
| E8 | Blood pure | 29.08% | 81.58 | 2 |
| E8 | Blood + Fury | 19.98% | 79.47 | 2 |
| E8 | Three Affinities, no Mixed | 20.96% | 71.65 | 3 |
| E8 | Vitality pure | 16.97% | 28.19 | 3 |
| E10 | Original Mixed | 16.79% | 91.69 | 1 |
| E10 | Blood pure | 17.09% | 95.95 | 3 |
| E10 | Blood + Fury | 19.24% | 97.32 | 2 |
| E10 | Three Affinities, no Mixed | 15.21% | 80.31 | **4** |
| E10 | Vitality pure | **5.63%** | 29.68 | **4** |

The Boss victories column is from **the single first E5/E8/E10 attempt for each seed**, not the cumulative E1–E10 natural account clear rate. **It must not be used as a like-for-like Boss combat win rate** because later routing, Boons, potion uses, target choice and combat RNG can diverge.

### Observed first-attempt E10 status

- Original Mixed: one victory, two deaths, one extraction; Boss reached in three.
- Blood pure: three victories, one death; Boss reached in four.
- Blood/Fury: two victories, two deaths; Boss reached in four.
- Three Affinities, no Mixed: four victories; Boss reached in four.
- Vitality pure: four victories; Boss reached in four.

### Findings

1. **Talent allocation materially changes actual native combat performance, even with identical real gear and XP.** E10 Blood/Fury had highest observed opening DPS (97.32), while Vitality pure had 5.63% opening HP loss and only 29.68 observed DPS. Choosing builds solely by DPS is inadequate.
2. **Mixed skills are not automatically superior.** The 3-Affinity / no-Mixed alternative survived the first attempted E10 Expedition in 4/4 shared seeded source accounts. This is a **small exploratory sample**; it does not prove no-Mixed is always better or that Mixed needs a numerical nerf.
3. **High defense/sustain can create a powerful alternative path.** Vitality pure with the same Sword/Leather earned inventory cleared E10 in four first attempts despite much lower damage. Prior Battle-vs-Boss imbalance could reflect build selection and strategy, not only enemy raw HP/Attack.
4. **Stage 6.8 agents are coherent but not mathematically optimal.** Baseline earned mixed route can be less successful than a different legal allocation with the same accrued resources and scenario.
5. **E5 remains a bottleneck:** most first attempts extracted before reaching a Boss. Merely reducing Boss HP or multiplying normal mob damage is not an adequate global fix.

## Limitations and next targeted validations

- Four shared account seeds, one origin policy, equipped Sword only: **no direct conclusion about Magic (Wand/Staff), Bow, Two-Handed, Orb/Tome/Charm, or Plate gear**. These need separately reproduced earned-origin accounts with *their own legitimately acquired items* and matched scenarios.
- Real E8/E10 accounts had 29–45 earned points; they are developed builds, **not complete 100/100 Talent point characters**.
- Every respec is an isolated legal experiment; the native full-respec is not an alternative natural account earning gear or XP differently along prior Expeditions.
- First-fight identity was matched at a visible scenario level, not a guarantee of identical every internal RNG draw after combat begins.
- Boss clears were not paired to identical pre-Boss health/potions, so treat them as **exploratory whole-Expedition outcomes** rather than calibrated Boss win probabilities.
- Before modifying enemy attributes individually, run additional earned-origin fairness tests for **Wand, Staff, Daggers, Bow, Two-Handed and defensive Plate**, then paired **pre-Boss and Elite loadout/potion** comparisons where the real item exists. No guaranteed drop or artificially generated loadout is acceptable.
- Increase independent seeds beyond these four and test major build archetypes across E5–E10.

## Provenance and code

- \`scripts/v013-natural-progression.cjs\` — opt-in read-only Camp mutation guard and single target-level stop; existing native gameplay behavior unchanged when the option is disabled.
- \`scripts/v013-stage69-earned-paired.cjs\` — legal native talent-only reset and exact input fingerprint comparisons.
- \`scripts/v013-stage69-earned-aggregate.cjs\` — rejects incomplete, duplicated, mismatched cohorts; computes encounter-matched outcomes separately from other full Expedition observations.
- \`tests/v013-stage69-earned-paired.test.cjs\` — unit regressions rejecting synthetic gold/equipment/unearned points and verifying legal talent reset.
- \`.github/workflows/v013-stage69-earned-builds.yml\` — twelve native seed/E trial jobs and validation/aggregation.
- Successful run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44861943367

**No gameplay enemy stats, talents, rewards, drop chances, save format, \`main\` branch, merge or deployment were modified.**
