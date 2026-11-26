# R4 — Potion System Review
Date: 2026-11-26. Baseline: `a06ffd1d6ef691a08f0f751ad8b572b2d345e31c` (R3). Scope: static native-code audit and tooltip corrections only; no balance changes, crafting, new potion IDs, art, or schema changes. R5 owns expansion; R7 owns calibration.

## Catalog and actual effects
Gold uses ceil(base × (1 + 0.12 × economyTier)); examples are tier 1/10. Chance is per independent shop offer, not per restock.

| ID | Name | Rarity | Base | Gold T1/T10 | Offer % | Actual effect |
|---|---|---|---:|---:|---:|---|
| health | Health Potion | Common | 14 | 16/31 | 25.893 | +35% max HP, rounded up and capped |
| mana | Mana Potion | Common | 14 | 16/31 | 25.893 | +40% max Mana, rounded up and capped |
| might | Potion of Might | Uncommon | 22 | 25/49 | 5.179 | +10% Attack, next 3 completed combats |
| arcane | Arcane Elixir | Uncommon | 22 | 25/49 | 5.179 | +10% Spell Power, next 3 completed combats |
| ironhide | Ironhide Tonic | Uncommon | 22 | 25/49 | 5.179 | +10% Defense, next 3 completed combats |
| trail | Trail Draught | Uncommon | 22 | 25/49 | 5.179 | Restore up to 2 spent steps, bounded by step limit including Wayfarer's Bargain |
| scout | Scout Tonic | Uncommon | 22 | 25/49 | 5.179 | Reveal nearest reachable unknown chosen destination type (Echo Font, treasure, elite/boss) and path |
| purifying | Purifying Tincture | Uncommon | 24 | 27/53 | 5.179 | Halve combat Condition penalties for next 2 completed combats; not Veiled Passages |
| haste | Haste Draught | Rare | 36 | 41/80 | 3.452 | +8% attacks per second, next 3 completed combats |
| barrier | Barrier Flask | Rare | 36 | 41/80 | 3.452 | Prepare 15% max HP base Barrier next combat; up to 30% base from two doses; setBarrier applies wardBonus + barrierPower, no global cap; no carryover |
| veilsight | Veilsight Elixir | Rare | 38 | 43/84 | 3.452 | Reveal all reachable unknown Echo Fonts and paths (up to two) |
| fate | Fate Distillate | Rare | 40 | 45/88 | 3.452 | Reroll open Echo Font offer once per Font; no dose on failure |
| fortune | Potion of Fortune | Epic | 42 | 48/93 | 3.333 | Auto-consumed at loadout start; ×1.25 relative random equipment drop chance, capped at 95% in Dungeon; does not change rarity distribution or other rewards |

## Verified by static inspection
- Three individual dose slots, independent of equipment loot. Duplicates allowed except Fortune and Trail. No in-combat use or reloading. Ordinary recovery/buffs require between-combat preparation after first encounter; map utility can be used after choosing a Realm, including before first combat; Fate requires valid current boon offer.
- Potions reserve owned quantities in preparation, then decrement inventory and clear selection when loaded. Used doses never return. Unused loaded doses return on safe extraction/victory, not defeat. Rejected effects retain dose, but first attempted map utility can start/load all selected doses.
- Same active stat buff cannot be used at full 3-combat duration; refresh to 3 when partially expired, not additive. Purifying cannot refresh while active. Different buffs can coexist. Duration decrements on completed combat rather than elapsed time; events do not decrement. Barrier preparation can stack twice. Recovery refuses full resource; map utilities refuse unavailable targets or full step allowance.
- Apothecary: 4 independent weighted offers, replacement of each purchased offer, separate paid restock (12 + ceil(tier/2) Gold), new type auto-equips if free slot, duplicates go to stash. 99 doses per stash stack; per-type save cap 99999. Catalog weights sum 84000, normalized per rarity bucket. Common ~51.786% of offers combined. Fortune ~3.333% per offer; ~12.68% chance of at least one in an independent four-offer roll.
- Contract reward pool includes Ironhide/Purifying/Fate. R3 Forge influence does not add potion crafting. No potion reagent recipe introduced here.
- Native stats path: index statContext -> gear stats -> combat core applyExpeditionModifiers, so Attack, Spell Power, Defense and attacksPerSec modifiers are wired. Condition mitigation applies to marked rooms/boss according to specific Condition; its duration can run out on unaffected fights.
- Corrected Arcane, Fortune, Barrier and Fate tooltips in both HTML entrypoints, preserving distinct existing file contents. No runtime logic modified.

## Design recommendations (not implemented)
- Keep recovery as accessible baseline; avoid making two recovery potions mandatory for every build. Retain all 13 pending R5/R7.
- Compare Haste against Might/Arcane using actual damage/survival per slot and price, not raw percentage. Consider Uncommon or stronger effect only after evidence.
- Keep Scout flexible and Veilsight dedicated to Echo Fonts; assess whether Rare premium is worth it once both are discovered. Fate value depends on ability to find Fonts and build-specific Boon pool.
- Purifying may be wasteful against boss-only Conditions or unmarked rooms; consider counting affected encounters or a clearly targeted activation policy (requires design decision and tests).
- Barrier should remain a single-fight tactical option; compare actual effective HP with Health and Aegis synergy. Do not silently restore removed cap or add Spell Power coefficient.
- Fortune should remain optional economy trade-off. At base 20% loot chance, 25% relative produces 25% (5 percentage points); compare extra items against price and loss of survival slot. An XP potion in R5 should compete for the same three slots and never change combat strength mid-run without explicit design approval.
- R5: add deliberately distinct recovery/defensive/offensive/exploration/progression roles only; XP boost candidate, no new IDs until R5. Reagent potion recipes with multiple distinct families belong in a subsequent crafting stage; verify unlocks, atomic costs, UI, inventory and economy.
- R7: measure usage, wasted doses, HP/Mana preserved, actual damage per slot, survival/extraction, net gold and incremental equipment/XP. Avoid large simulations until approved.

## Validation status
Static source inspection and exact catalog arithmetic only. Existing test files inspected: tests/v012-complete-potions.test.cjs and tests/v013-stage74-potions.test.cjs; they cover catalog/odds, slots, purchase, returns, map reveal, reroll and Purifying durations. They have not been executed for R4. Proposed focused command: `node --test tests/v012-complete-potions.test.cjs tests/v013-stage74-potions.test.cjs tests/v012-unified-gear-potions.test.cjs`. Also verify desktop/mobile tooltips and native Barrier grant. No claim of passing CI or browser testing.
Sources: online/v012-consumables.js, economy/v012-equipment-runtime.js:278–356, online/v012-expedition-runtime.js, combat/v012-combat-core.js, combat/v012-gear-stats.js, combat/v012-combat-runtime.js, online/v013-expedition-conditions.js, online/v012-expedition-controller.js, online/v013-expedition-contracts.js, online/v012-persistence-runtime.js, index.html and docs/index.html. Historical v0.12 backlog is not canonical for current behavior.
