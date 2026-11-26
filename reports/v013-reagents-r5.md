# R5 — Potion Expansion & Runtime Integration
2026-11-26; based on R4 `34abc4cc95b43a785babd66f7b8ceeb593fc201b`. Expand from 13 to 21. No Clarity, no crafting, no changes to existing effect magnitudes. R6 owns recipes and new art remains placeholder.

| ID | Name | Rarity | Base Gold (provisional) | Effect | R6 recipe only (not active) |
|---|---|---|---:|---|---|
| wisdom | Elixir of Wisdom | Epic | 42 | +25% XP, whole expedition, auto | Radiance + Arcane |
| rejuvenation | Rejuvenation Potion | Rare | 36 | +20% max HP and +25% max Mana | Radiance + Arcane |
| withering | Withering Elixir | Rare | 36 | +15% DoT Power for 3 combats | Blood + Decay |
| precision | Precision Draught | Rare | 36 | +5 percentage points Critical Chance for 3 combats | Fury + Blood |
| phantom | Phantom Tonic | Rare | 36 | +5 percentage points physical Evasion for 3 combats, cap 45% | Fury + Aegis |
| prospector | Prospector's Elixir | Epic | 42 | +25% relative random Reagent probability, entire expedition, auto | Decay + Arcane |
| executioner | Executioner's Draught | Rare | 40 | +15% damage to Elite/Boss only for 3 eligible encounters | Fury + Decay |
| renewal | Elixir of Renewal | Uncommon | 24 | 3% max HP per second for first 15 combat seconds of next encounter | Radiance + Blood |

- All three progression consumables can coexist, each unique per loadout. Three slots unchanged. Other consumption and settlement rules preserved.
- Wisdom uses existing native XP award ledger. Prospector changes random normal chance from 22% to 27.5%, Elite 65% to 81.25%; guaranteed Boss and Contract rewards remain unmodified. Wisdom rounds the final awarded XP to integer.
- Withering adds 0.15 to existing DoT Power; existing Bleed/Burn/Rot application snapshots potency, so stack transfer and Rot bursts inherit the stored value without another DoT Power multiplication.
- Phantom adds a flat probability after native rating conversion, respecting the existing physical-only 45% cap; preview display matches. Precision adds five points to percent-valued crit.
- Executioner factor at direct, secondary, periodic and spread burst payout, excludes ordinary summons and stage84 nodes. Three eligible encounters only. Renewal uses the native heal path and native one-second combat tick, never exceeds 15 ticks or carries into the next encounter.
- R4 aggregate rarity bucket weights preserved; new distribution is 2 Common, 7 Uncommon, 9 Rare, 3 Epic. Per-offer probabilities are 25.892857%, 4.438776%, 1.534392%, and 1.111111%, respectively (each item in its rarity). Fortune individual probability falls from 3.333% to 1.111%; provisional until R7. Pricing and probabilities need R7 review.
- Both entrypoints and native module mirrors updated; isolated preview save prefix preserved. New potion art uses existing fallback. No new crafting or art.
- Validation: authored focused tests plus updated catalog expectations, not yet executed at report creation. CI results must be checked before calling R5 validated. No heavy simulations. External Lore Bible not modified by this commit.

## R5.1 — regression fixes
Initial directed CI run 45844354765: 67/71 passed. Corrected the actual ReferenceError in phase3StatValue (stats.evasionBonus, not s.evasionBonus) in both entrypoints and added a native stat-render regression. Updated three obsolete assertions: explicitly reserve one owned potion in the 99-dose capacity test and derive actual capacity; clean-sheet restore ignores retired free supplies while retaining owned doses; shared Stash includes Runestone Shards alongside potions. No mechanic or balance changes. Rerun required before declaring validated.
