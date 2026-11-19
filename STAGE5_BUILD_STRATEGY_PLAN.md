# Wanderer — Stage 5.2: Build synergy, depth, hybrids and respec experiment

Status: **baseline instrumentation implemented; comparative agent experiments not yet executed**.
Branch: `audit/v013`. No gameplay balance changes authorized.

## Facts verified in the current implementation

- The complete talent tree is exposed through the **integrated VM** `a.talents`
  with valid node IDs like `passive_strong_heart`, `passive_quick_hands`,
  and `passive_arcane_focus`. The existing natural-policy target lists use
  several short identifiers without the `passive_` prefix, which do not
  point to the intended nodes. The fallback chooses other valid nodes.
- `T.path` / `T.allocate` enforce all prerequisite links, exclusions,
  hybrid bridge requirements, rank requirements and actual earned point limits.
- `T.reset` is available from Camp. It returns invested **talent nodes**
  to the pool while preserving accumulated XP and **allocated primary
  attributes**. Therefore switching from permanent Strength to Intellect
  is not the same as an unconstrained character rebuild.
- The current natural agent never invokes `T.reset` or
  `T.allocateAttribute`; its fixed gear score barely depends on talent
  synergies or its current weapon/armor archetype.
- v0.13 item rules allow cloth Intellect/Spell/Mana, leather
  Agility/Evasion/Speed, plate Endurance/Strength/Block, caster
  Wand/Staff/Orb, Agility Bow/Daggers, and mixed stat accessories.
  Gear is random, and these preferences are *not* guaranteed outcomes.

## Cohort dimensions to compare (one factor at a time)

**Archetype goals (all must use actual found or purchased equipment):**

1. Arcane/Fire — Cloth + Wand/Orb/Staff, Intellect, Fire branch
2. Arcane/Frost — Cloth + Wand/Orb/Staff, Intellect, Frost branch
3. Arcane/Lightning — Cloth + Wand/Orb/Staff, Intellect, Lightning branch
4. Plate bruiser — Plate + Two-Handed/Sword, Strength, Blood/Fury
5. Plate protector — Plate + Shield/Mace/Sword, Endurance, Aegis/Vitality
6. Leather attacker — Leather + Bow, Agility, Fury
7. Leather assassin — Leather + Daggers, Agility, Fury/Decay
8. Spellblade mixed — Cloth/Leather + compatible physical and Magic talents
9. Defensive caster mixed — Magic/Vitality/Aegis paths, including compatible gear
10. Damage-over-time hybrid — Blood/Decay with an attainable bridge and weapon

**Talent purchase policy:**

- Breadth-first: affordable baseline survivability and rank-1 abilities early
- Depth-first: use the genuine prerequisite path to a chosen advanced ability
- Flexible: pick a coherent near-term target based on actual gear and affordability
- Hybrid: pursue two real affinity paths and their bridge without skipping gates

**Build persistence / adaptation:**

- Locked: keep the chosen goal even with competing drops
- Opportunistic gear: change equipped gear when a major upgrade appears, no respec
- Limited respec: change talent nodes only in Camp when a measured advantage
  exceeds threshold (e.g. >=20% estimated *effective* score for two attempts)
- Experimental exploratory: optionally switch once after E5 or E10 to
  measure the value of experimentation, not to label switching as failure.

Never force a gear drop, rarity, XP, unlock or discounted reset to make
one strategy work. Attribute allocation and non-refundable stats must be
handled as real restrictions. Weapon/armor switching is not automatically a
talent respec.

## Instrumentation

Capture for each account and each attempt:

- Effective hero stats, currently equipped item subtypes and detailed affixes
- Acquired item and newly equipped item; swaps by slot, rarity and source
- Talent purchases, tree family coverage, deepest valid prerequisite path,
  ranks, optional deep skills and mutually exclusive specialisations
- Spent/unspent native talent points and attribute allocations
- Reset count, level and prior/new tree; what triggered a reset and whether
  it improved survival or progression; no invented reset cost
- Archetype signature and actual meaningful style transitions (not one item swap)
- XP, Gold, Fragments, Essence, Forge, Merchant and potion transactions
- E5/E10/E20 unlock and defeat attempt numbers; deaths, extractions,
  per-combat time, damage, heals and Boss/Elite exposure

For any outcome describe both **net benefit** and **cost of switching**
(e.g. loss of a learned ability for several runs, lack of matching gear,
inability to reallocate permanent attribute points).

## Test design and gates

- **Gate A:** audit current 3 heuristics using native VM, confirm zero resets
  and invalid priority IDs; verify snapshot correctness.
- **Gate B:** implement a single build planner that uses native `T.path`,
  `T.allocate`, `T.allocateAttribute` and slot-safe gear valuation.
  Add unit tests for every archetype + hybrid prerequisite and conflicting
  ability restrictions.
- **Gate C:** 4 matched seeds × 4 clear archetypes × 2 talent-allocation
  policies, E1–E5, with identical attempt budgets; compare exact trajectories.
- **Gate D:** only if Gate C passes, 12–20 seeds, E1–E20, adding mixed
  archetypes and controlled respec policies (0, 1, or max 2 planned changes).
  Report distinct seed count and censorship due to finite attempts.
- **Gate E:** replicate Boss/Elite comparisons at identical native earned
  gear/talent checkpoints and risk 0/1/2; do not mistake an easier chosen map
  or better extraction logic for stronger combat synergy.

**Interpretation:** broad/focused, high-rank/early, and adaptive/loyal
archetypes are *strategies* to compare, not guaranteed superior styles.
Winning more E20 runs with a particular strategy may reveal overly fast
power scaling, but never justifies directly changing permanent hero power
without controlling for actual gear, talents, map risk and encounter mix.

No new comparative build agent is claimed as implemented until Gates B–D
are coded, tested, and linked to a passed GitHub Actions run.
