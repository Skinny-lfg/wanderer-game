# R6 — Apothecary & Potion Crafting
Based on R5.1 (1450430, 72/72 directed tests). Apothecary has Buy and Craft modes. All 21 fixed recipes known at Camp; no additional Blueprint or progression gate. Selection is explicit even for identical ingredient pairs. One craft grants one dose. No Gold or Fragments are charged; existing Essence and Reagent inventory is shared with Forge. Common costs 2 Essence, Uncommon 3, Rare 5, Epic 8. Common uses no Reagents; all other recipes consume one of each of two distinct Reagents. Prices and reagent consumption are provisional R7 tuning choices, not final balance.

| Potion | Essence | Reagents (one each) |
|---|---:|---|
| Health Potion | 2 | — |
| Mana Potion | 2 | — |
| Potion of Might | 3 | Blood + Fury |
| Arcane Elixir | 3 | Arcane + Decay |
| Ironhide Tonic | 3 | Aegis + Radiance |
| Trail Draught | 3 | Fury + Radiance |
| Scout Tonic | 3 | Arcane + Fury |
| Purifying Tincture | 3 | Radiance + Aegis |
| Elixir of Renewal | 3 | Radiance + Blood |
| Haste Draught | 5 | Fury + Arcane |
| Barrier Flask | 5 | Aegis + Arcane |
| Veilsight Elixir | 5 | Arcane + Radiance |
| Fate Distillate | 5 | Arcane + Aegis |
| Rejuvenation Potion | 5 | Radiance + Arcane |
| Withering Elixir | 5 | Blood + Decay |
| Precision Draught | 5 | Fury + Blood |
| Phantom Tonic | 5 | Fury + Aegis |
| Executioner's Draught | 5 | Fury + Decay |
| Potion of Fortune | 8 | Radiance + Decay |
| Elixir of Wisdom | 8 | Radiance + Arcane |
| Prospector's Elixir | 8 | Decay + Arcane |

Craft preview shows all 21 selectable recipes grouped by rarity, potion effect, owned count, have/need materials, destination and availability. Crafting uses the same Camp gate and capacity rules as purchase: new type auto-equips in free slot, duplicates go to Stash, 99-dose stacks and 99999 per-type cap, three slots maximum. All resources and inventory updated together; synchronous save rejection rolls back the transaction (existing asynchronous cloud persistence semantics unchanged). No new save schema, no RNG, no stock replacement or effect changes. Existing buy/restock independent. Both entrypoints and native mirrors updated. Art placeholders retained. Directed tests authored; CI results pending at commit creation; visual review and calibration remain pending.
