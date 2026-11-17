# Wanderer v0.13 — Stage 5.1 · Equipment and combat foundation

**Status:** Implemented in draft PR #54, stacked on draft Stage 5 PR #53; **not merged, not deployed**. Published v0.13 GitHub Pages and public v0.12 Firebase remain unchanged.

## Design changes

### Fixed initial equipment

Every fresh v0.13 character starts with:
- **Worn Sword** — 3 flat Attack, zero STR/AGI/INT/END/CHA
- **Worn Tunic (Cloth)** — 1 Defense, 5 Health, zero primary attributes
- **Worn Hood (Cloth)** — 1 Defense, 2 Health, zero primary attributes

The code retains the original starter-roll RNG consumption, then normalises item values, so map-generated seeds do not drift. The old v0.12 paths are untouched.

### Rarity budgets and item diversity

`economy/v013-item-rolls.js` implements a single power budget per item with weighted stats, instead of adding the full old set of flat stats on top of every piece.

| Rarity | Number of positive affixes | Primary attributes? |
|---|---:|---|
| Common (white) | 1 | No |
| Uncommon | 2 | Yes, in slot-specific pools |
| Rare | 2–3 | Yes |
| Epic | 3–4 | Yes, plus any existing Epic trait |
| Legendary | 4 | Yes, plus its identity effect |

A two-stat item distributes the whole power budget over **two stronger values**, not two weaker leftover values. Affix pools are specific to the subtype: swords and daggers may roll INT, bows may roll STR, maces END/HP, while wands and staves never roll STR or AGI. Rings and amulets draw from a broad cross-role stat pool. Physical armor continues to use Cloth, Leather or Plate themes.

**Determinism:** new affix-roll streams are local to the v0.13 equipment runtime. They use an item sequence number plus tier, rarity and slot; they never draw from the existing global map/combat/loot PRNG. Forge previews use a constant example identity and do not increment that sequence.

### Crafting

All v0.13 recipes apply the same rarity budget and slot pool. The recipe's guaranteed attribute direction replaces a legal affix within the budget; it is not another free bonus line. Added INT Sword and INT Daggers plus STR Bow Rare recipe alternatives. Repeated real crafting can yield different affix combinations, while the Forge shows an explicitly labelled **example roll** (not a guaranteed final stat sheet).

### Bag and encounter rewards

The original low-tier normal drop rate was only 4%, explaining how a player could clear several normal rooms without receiving equipment. New v0.13 behavior:
- 1 item on the **first naturally completed dungeon combat**, guaranteed
- Later normal encounters: **at least 28%** equipment chance, plus existing difficulty/reward modifiers
- Elite encounters: **at least 65%** chance
- Boss victory: **guaranteed equipment** and existing Rune/reagent logic

Loot remains in the existing Bag/Stash/overflow ledger, with protection against duplicate awards and no inventory reset. The 12-slot Bag and overflow choices are unchanged.

### Dual Daggers

- Dual-wield main-hand hits cannot also trigger the unrelated 25% Double Strike proc, preventing a triple strike.
- Offhand hits occur **once per two main-hand attacks** (50% cadence) and use **50% of comparable dagger damage**.
- The offhand also contributes 50% of its eligible offensive equipment attributes, as before; no recursively triggered extra offhand.
- Single-hand Daggers still retain their distinct optional Double Strike proc.

### HUD and display

- Gold, Fragments, **Essence** and each of six affinity reagent counts share the HUD, with family icons.
- The **Talents** navigation button gets a visible ✦ count when unspent points exist; its accessible button name remains stable.
- Normal UI item stats are displayed with 2-decimal precision; large resource values use K/M/B abbreviations. Internal stat values are **not rounded**.
- The equipped-slot tile no longer adds an E1/E2-style badge in v0.13; equipment progression levels remain available in inventory/inspect.

## Tests and scope

`npm run test:v013:stage51` covers the fixed starter across seeds, Common purity, Rare line count, allowed per-weapon affixes, jewelry/craft variability, native first-room Bag drop, dual-dagger hit/cadence and source UI assertions.

`npm run test:v013:gate` exercises the current native v0.13 game and simulator. GitHub Actions also runs real-map integration, Stage 4.5.6 critical regression guards, isolated browser QA and an isolated GitHub Pages build.

**Balance warning:** Stage 5's older 1,152-dungeon win rate was measured with **different, stronger gear**; do not reuse those win rates to sign off the new item budgets. The next step is a new, appropriately stratified post-gear balance baseline. Test fixtures that once *required a win* must now assert the appropriate real combat outcome (win or defeat) and no engine errors/timeouts. This is an intentional gear-budget change, not a waived simulation defect.

**Future release caveats:** loot rates and stat budget numbers are provisional; verify human gameplay, readable mobile HUD, weapon/class survival and whole-Expedition economy before release. Existing local v0.13 playtest saves may contain old-format items, while new items use the v0.13 budget.
