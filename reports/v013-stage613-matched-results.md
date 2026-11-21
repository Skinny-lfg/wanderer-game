# Wanderer v0.13 — Stage 6.13 verified matched-Talent combat report

**Date:** 2026-11-21  
**Canonical base:** `audit/v013-stage6` at `dbb3b52d48e7a83436420a9bbd8e447578b3c40a`  
**PR:** https://github.com/Skinny-lfg/wanderer-game/pull/109  
**Native pilot/matrix CI evidence:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44892589387

## Executive conclusion

The Stage 6.13 controlled native-combat paired tests isolate **the chosen TalentGraph allocation as a whole** while holding the equipment, opponent, seed, and Buildcraft background fixed. This is a substantially stronger test of the *marginal effect of changing a complete legal talent allocation* than Stage 6.12's unmatched 144-loadout evidence. It is **not** an isolation of each individual skill: many comparisons change several nodes and sometimes elemental attunement/prepared ability together.

All pair setup integrity checks passed on **72 / 72 pairs**. Five actual paired comparisons reversed a combat's victory/death result while 67 were concordant. Among pairs where both builds won, the median absolute difference in combat duration was **2.75 seconds** (not a universal speed advantage for a particular Affinity).

## Actually executed results

| Measure | Verified result |
| --- | ---: |
| Eligible different-talent, equal-points pair designs | **3,637** (planned; not combat tested) |
| Selected, successfully executed native pairs | **72** |
| Actual native fights | **144** |
| Existing current route/profile archetypes represented | **48 / 48** |
| Distinct v15-valid TalentGraph state fingerprints | **95** |
| Same full native equipment, resolved seed and initial enemy roster | **72 / 72** |
| Native Boss / Elite / Normal paired matchups | **24 / 24 / 24** |
| Both builds won | **39** |
| Both builds lost | **28** |
| Left-only win | **4** |
| Right-only win | **1** |
| Played arms with an advanced prepared skill | **30** |
| Played arms with three allocated Affinities | **13** |
| Unmatched / timed-out / erroneous native pairs | **0** |

The matrix was deliberately balanced for armor and opponent: each of the nine combinations `Cloth/Leather/Plate × Normal/Elite/Boss` has **8 pairs**. It covers **seven** real weapon families, **three** armor types, **six** Realm Affinities, and the point budgets **12, 24, 36 and 60**. It uses real native gear rolls, not numeric hand-built affixes, but acquisition of that gear and XP is synthetic.

**Profile comparator composition:** 20 Affinity-investment, 16 same-primary/different-plan, 16 Magic elemental mode, 15 same-primary alternate route, and five cross-primary comparisons. Therefore **67 / 72** pairs compare plans from the same main Affinity; the remaining five are explicitly conditional on a shared fixed Buildcraft background.

### Discordant outcome evidence (only these five changed win vs loss)

| Match | Enemy and Affinity | Point budget | First legal talent plan | Second legal talent plan | Winning plan |
| --- | --- | ---: | --- | --- | --- |
| match-027 | Normal / Aegis | 36 | Decay + Magic + Aegis strategy | Blight target-route strategy | First |
| match-044 | Boss / Blood | 36 | Magic Fire + Aegis strategy | Magic Wand Defense strategy | First |
| match-046 | Elite / Blood | 36 | Decay + Magic + Aegis strategy | Septic Wound target-route strategy | First |
| match-047 | Boss / Blood | 24 | Aegis + Vitality strategy | Unbreakable target-route strategy | Second |
| match-067 | Elite / Aegis | 36 | Magic Arcane Pure strategy | Grave Bloom target-route strategy | First |

**Important:** These are single matchups with seeded equipment and controlled opponents; do not interpret a winning plan as generically better. They also do not identify a *single* strong or weak node: complete node allocations differ.

### Observed mechanical differences

Across the 72 pairs, even where both builds won or both lost, **55** changed combat duration, **41** changed surviving HP fraction, **22** changed Barrier generated, **30** changed actual healing, **34** changed native DoT damage, and **41** changed Mana spent (using greater than 0.001 absolute difference). A zero for a particular metric does not mean the talents have no effect: many encounters end before a skill is activated, and no consumables were used.

### Progression and inference restrictions

- Controlled Talent XP, expedition access, item rarity/tier, weapon and armor are deliberately selected. None of this was earned from a fresh E1 account. Stage 6.11 remains the separate actual earned progression evidence (eight earned points maximum in its prior pilot).
- Each pair has **equal earned *budget* in the fixture and equal actual invested node count**, verified by the real v15 TalentGraph. Do **not** call the budget naturally earned.
- Entire native gear roll fingerprint, non-Off-Hand fingerprint, seed, seed shift, Boss/Elite actor roster, encounter trait, conditions, native scenario stage, opponent group and source game version are checked for exact match between arms.
- Even when two arms start with identical random seeds, they may consume RNG differently once abilities activate. We have matched *initial* randomness, not guaranteed identical per-tick draws. This is a standard paired experiment, not a counterfactual replay of each random event.
- A 144-fight paired cohort is too small for confident individual Boss, weapon, perk or Affinity ranking. Each individual combination has very few independently seeded observations and the candidate planner deliberately enriches diverse strategies.
- A controlled fight changing multiple Talent nodes can establish the effect of that *whole allocation in that fixture*; to isolate an ability, additionally require **one native-legal changed node/rank at a time**, with enough matched seeds.
- No potions, Boons, Crafting economy, full expedition traversal, learned save state or cross-E account respecs were part of this comparison.
- The 12-pair pilot is a deterministic **subset** of the 72-pair matrix. Do not add its 24 fights to the 144 as independent evidence.

## Reproducibility and validation

- Native source fingerprint: `5b271f2e9bd8eeccd888db7426811db6794e4697cebfbf4a0331fcb8bffec921`
- Matched source/checkpoint version, plan and settings are recorded in the uploaded full JSON artifact `stage613-matched-72-pairs-native`.
- Dedicated Stage 6.13 tests **9/9 passed** in the first verified pilot; Stage 6.12 **10/10**, Stage 6.11 **8/8**, Stage 6.10 **6/6**.
- The final candidate-stratification regression adds an additional dedicated test; verify a newer workflow on that SHA before final merge.
- CI runs do not deploy or modify player data.

## Next engineering question (not a premature balance change)

Run matched-seed, **single-legal-node/rank ablations** and sample more independently seeded Boss/Elite fights per exact matchup. Separately improve E1 progression reachability. Only thereafter target individual enemy health, attack frequency, passive effect strength and prepared abilities for balance. No group-wide buffs/nerfs were applied in this stage.
