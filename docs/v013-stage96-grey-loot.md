# Wanderer v0.13 — Stage 9.6: Grey loot as early progression and Forge material

## Existing behaviour confirmed

Grey equipment is internally `Common`. Before this stage, the live **v0.13** Dungeon already allowed Common equipment in normal encounters, but at 12.6%, 10.5% and 8% unconditional per-cleared-combat rates at ordinary loot stages 1, 2, 3 (base CHA=5). No Common equipment could roll from Elite or Boss rarity tables.

The **first completed Dungeon encounter in each new Expedition** already guarantees equipment, and an otherwise-Common roll is promoted to **Uncommon**. This rule is preserved. It is not the same as a free Common gear item, and it is intentionally excluded from ordinary Grey statistics.

The Blacksmith/Forge already buys back native non-starter equipment for **Fragments** via its salvage system. A Grey item has only one stat, no Strength/Agility/Intellect/Endurance/Charisma, and its salvage value is positive. The three protected starter items return zero resources.

## Stage 9.6 proposal — extra Grey without taking better drops away

Each ordinary cleared combat still produces **at most one equipment item**. More Grey items are introduced by adding extra Common *chance*, not by converting higher-rarity drops or giving extra items on the same fight.

| Native loot stage | Before: total gear chance | Before: Common chance | Extra Common chance | After: total gear chance | After: Common chance |
|---|---:|---:|---:|---:|---:|
| 1 (earliest combats) | 28% | 12.6% | +10pp | 38% | **22.6%** |
| 2 (middle combats) | 30% | 10.5% | +8pp | 38% | **18.5%** |
| 3 (later ordinary combats) | 32% | 8.0% | +6pp | 38% | **14.0%** |
| 4 (Elite) | 60% | 0% | 0 | 60% | 0% |
| 5 (Boss) | 100% | 0% | 0 | 100% | 0% |

All rates are per encounter before Risk/Bounty/Fortune modifiers. At CHA > 5, original rarity modifiers remain; the extra Grey probability is still added as an independent absolute component. Crucially, for every Uncommon/Rare/Epic/Legendary rarity: `new_drop * new_rarity_share == original_drop * original_rarity_share`. We do not modify v0.12 legacy drop odds or combat balance.

This makes basic gear available for filling initially empty slots, and later for dismantling into native Forge Fragments. Items still enter the actual Expedition Bag, use the same 12-slot limit/overflow, and remain exposed to loss if the run fails; there is **no direct Fragments or Essence injection** when the item drops.

## Updated simulation motor (Stage 9.6)

The Stage 9.1–9.5 simulator and real v0.13 game logic are retained on top of the latest visual preview. The natural E1–E8 account model now:

- Reads the new live loot function rather than having an independent Grey drop table;
- Records **all** actual room-equipment drops, including ordinary Grey, not only Elite loot;
- Reports initial guaranteed gear separately from non-guaranteed Common drops;
- Equips useful earned gear before attempting to salvage anything;
- In Camp, selects only surplus **native loot-sourced Common** items that are worse than the equipment already worn; calls the *real* Camp bulk-salvage action and checks the exact observed Fragments gain and inventory removal;
- Records per-E Grey drops, native Camp Grey salvage counts, and Fragments gained specifically from that salvage;
- Preserves actual XP, earned equipment, Boss-gated unlocks, inventory capacity, and ordinary loss/extraction; it creates neither artificial Grey items nor artificial Forge resources.

## Tests and release gate

`node --test tests/v013-stage96-grey-loot.test.cjs` tests distribution conservation, v0.12 isolation, starter gear integrity, actual first-room guarantee, a later native Grey drop, extraction, and native Forge salvage.

Workflow: `.github/workflows/v013-stage96-grey-loot.yml`. It also runs the current v0.13 regression suite, Stage 9.1–9.5 native tests, module mirrors, and two persistent-account simulation cohorts. Both are diagnostic, not representative real-player win rates.

**Status: unmerged, not deployed.** This branch starts from the newer preview (including recent character loadout art) and supersedes PR #90's older integration baseline; do not merge both PR histories without deduplication.
