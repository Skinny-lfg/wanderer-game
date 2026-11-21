# Wanderer v0.13 — Stage 6.12 verified controlled combat evidence

**Date:** 2026-11-21  
**Canonical merge target:** `audit/v013-stage6`  
**Implementation PR:** https://github.com/Skinny-lfg/wanderer-game/pull/108  
**Corrected, successful CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44889277689  
**Native source:** the Stage 6.11 consolidated live v0.13 engine; no game balance, saved data, Firebase or production code changed.

## The essential distinction

**Stage 6.11** followed naturally earned accounts from E1, reaching at most 8 earned points in its pilot; it could not demonstrate advanced builds.

**Stage 6.12** tests **controlled** native combat with synthetically supplied but **TalentGraph v15-legal** 12/24/36/60-point budgets, real native-rolled Rare gear at selected E5/E15/E35/E70 tiers, and actual game enemy AI/stat/damage routines.

The controlled fixture supplies the Talent budget, equipment and level access; it **does not prove** that players could obtain these combinations naturally. Enemies are staged as native combat actors in a controlled room, not organically reached along a Dungeon route. A result is a genuine engine execution, but **not a natural player-progression simulation**.

## Final corrected 144-fight matrix

| Verified measure | Result |
| --- | ---: |
| Current strategic/route archetypes represented | **48 / 48** (21 smart strategies + 27 live route endpoints) |
| Completed controlled native combats | **144** |
| Distinct native-valid Talent allocations (nodes, mode, prepared) | **121** |
| Distinct legal Talent allocation + actual weapon + armor + Off-Hand loadouts | **142** |
| Controlled Normal fights / wins | **48 / 44** |
| Controlled Elite fights / wins | **48 / 34** |
| Controlled Boss fights / wins | **48 / 6** |
| Three-Affinity builds actually used in controlled combat | **7** |
| Two-or-more Affinity builds actually used | **39** |
| Advanced prepared-ability fights | **23** |
| Timeout or invalid native combat result | **0** |

**By hypothetical point budget:** 12 points: 35 fights / 13 wins; 24 points: 36 / 22; 36 points: 37 / 24; 60 points: 36 / 25. These are mixed opponent/gear samples, not progression win rates.

The six actual Boss styles observed were `berserker`, `conductor`, `devourer`, `guardian`, `leech`, `matriarch`. Eight Elite labels were observed, without claiming full Elite spawn roster coverage.

The scenario generator designs **1,728** archetype × point-budget × controlled gear × opponent candidates. The workflow executes a deterministic **144**, not all 1,728. Source and scenario fingerprints are retained in the complete GitHub Actions JSON artifact.

## Critical sampling correction — avoid false Armor conclusions

The first draft tested 144 scenarios but accidentally coupled armor with enemy type: **43/49 Boss fights used Plate**, rendering cross-armor outcome comparisons misleading. That first draft is **not the accepted evidence**.

The final matrix crosses equipment variants with each Normal/Elite/Boss category independently, with a regression test for nine `armor × encounter` strata.

| Armor | Normal fights | Elite fights | Boss fights |
| --- | ---: | ---: | ---: |
| Cloth | 16 | 16 | 16 |
| Leather | 16 | 15 | 16 |
| Plate | 16 | 17 | 16 |

This removes the most obvious Armor/encounter confound. It does **not** remove every difference in weapon, talent budget, roll quality or strategy, so raw win rates still cannot be treated as causal individual balance rankings.

## Ten matched Off-Hand comparisons

- **10** replay-verified pairs = **20 more native fights** (separate from the 144 matrix).
- The test validates that talent state, main weapon, non-Off-Hand native rolled equipment fingerprint, resolved seed, Realm Affinity and match setup remain identical. Only the Off-Hand changes.
- Actual pairs include Shield vs Orb, Orb vs Tome, Charm vs Off-Hand Dagger, and Shield vs Charm, on compatible one-hand native weapons.
- Single-pair differences are not proof that an Off-Hand is universally stronger; more independent seeds and controlled adversaries are needed.

## Validation and interpretive limits

- Corrected Stage 6.12 checks: **10/10** passed. Stage 6.11 checks: **8/8**. Stage 6.10 checks: **6/6**.
- 18-fight final corrected smoke pilot: **18 fights**, 12 wins; this is a subset of the larger deterministic matrix, **do not add 18 to the 144 as independent new encounters**.
- The uncorrected initial smoke pilot had eight wins; it is superseded by the stratification correction.
- The controlled matrix has no forced damage multipliers or altered enemy threat. Its 48 Boss battles yielded 6 wins but were not matched against equal standardized gear/talent states across all bosses.
- The older role-affinity coverage test had a **historically obsolete hard-coded assertion** expecting exactly seven simulations; the existing engine already had eight pre-defined builds covering seven distinct weapons. That test was updated to count all eight builds while continuing to assert seven distinct weapon families (not deleted or skipped).
- Other CI workflows and the corrected role-affinity test must still complete successfully before final merge.

## Recommended following checkpoint

1. Run a genuine **matched cohort**: hold budget, armor, weapon roll, opponent, RNG and encounter fixed while changing one legal Talent route; compare effect activation, damage, mana, HP, barrier and win/timeout. Do not call different native rolls a causal build comparison.
2. Expand independently seeded Boss and Elite samples and inventory the full Elite encounter/spawn catalogue. Use per-Boss/per-Elite evidence rather than group-wide multipliers.
3. Continue improving the separate earned E1 progression pipeline to make late builds genuinely reachable. Do not mislabel a controlled 60-point build as naturally earned.
4. Only after those evidence gates should individual enemy Health, Defense, attack frequency, skills or prepared ability values be considered for balance adjustment.

**No gameplay balance edits, no guaranteed loot or achievements, no deployment, no production `main` merge, no save migration.**
