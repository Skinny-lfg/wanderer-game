# R7A — Reagent Economy & Potion Calibration (static audit)
2026-11-26. Baseline release/v013-consolidated, commit 8e6fe9c; R6.1 directed CI run 45846535075: 99/99 passed, 0 failures, 0 skipped. No production changes, no combat simulations, no balance approval implied.

## Verified baseline
Sources: online/v012-persistence-runtime.js (phase4CommitRealm, phase4LoseLoot, settleContract), online/v012-expedition-runtime.js (phase1WaveWon, phase6TickDurations), economy/v013-crafting.js (cost, award, refine), online/v012-consumables.js (catalog, offer weights, recipes), online/v012-expedition-controller.js (startDungeon), economy/v012-loot-rules.js (v013DungeonWaveOdds), online/v013-expedition-conditions.js (applyEncounter/tick).

- Normal: 1 Essence, 22% random chance of one family Reagent. Elite: 2 Essence, 65%. Boss: 5 Essence and one guaranteed family Reagent. One family per selected Realm; three distinct family cards at entry, with persistent seed until entering a room. No per-mob multiplier on material awards. Risk and large groups increase Gold/Fragments and equipment chance but not the ordinary Essence/Reagent rate.
- Marked Elite settlement on victory/extraction: +1 family Reagent and 2/4/6 Essence at risk 0/1/2, in addition to the normal Elite roll. Optional Stage 7 Contracts can grant Essence, Reagents (1/1/2), Gold, Fragments, potions or blueprint; not modeled as guaranteed.
- Completed-room Essence, Reagents, XP, Gold and Fragments persist after later defeat; physical unsecured Bag loot is lost. No award from an incomplete fight. Guaranteed settlement is not assumed on defeat.
- Existing dry streak refinement: after 3 unsuccessful eligible family awards, 6 Essence converts to 1 Reagent, resetting that streak. Current UI exposes this through eligible unlocked Forge recipes only, not the Apothecary.
- No need to introduce a separate potion material or change the Forge baseline solely because potions were added.

## Analytical scenarios (not measured playtest routes)
Expected reagents = 0.22N + 0.65E + B + M, Essence = N + 2E + 5B + (2 + 2r)M; N normal, E elite, B boss, M marked-Elite settlement indicator. Assumes risk 0 for the settlement increment, all listed encounters completed, no Contracts, no refinement, no Bounty Writ bonus, no capacity issue. These are illustrative encounter counts, not a claim that the specific route is always attainable.

| Route | N/E/B/M | Essence | Expected Reagents | Extra with Prospector (+25% relative) |
|---|---|---:|---:|---:|
| Short extraction | 4/0/0/0 | 4 | 0.88 | 0.22 |
| Short victory + marked | 4/1/1/1 | 13 | 3.53 | 0.3825 |
| Longer victory + marked | 8/1/1/1 | 17 | 4.41 | 0.6025 |
| High-combat illustrative route | 10/2/1/1 | 21 | 5.50 | 0.875 |

Last row is a high-combat theoretical scenario; two Elites occur in Brutal maps, so actual marked bonus there is +6 Essence (25 total rather than 21). Travel/step budget (12-14) constrains actual routes. Prospector affects the random portion only: extra = .055N + .1625E, never boss or settlement. An 8-normal/1-elite run therefore produces only .6025 extra; crafting it consumes two Reagents of different families plus 8 Essence. The same Realm cannot return both consumed families. Bought Prospector has a Gold/slot opportunity cost, not a Reagent cost. Treat the reagent return deficit as a design concern, not proof of total utility.

## Forge vs Apothecary
| Rarity | Forge Essence | Forge Reagents | Potion Essence | Potion Reagents |
|---|---:|---:|---:|---:|
| Common | n/a | n/a | 2 | 0 |
| Uncommon | 4 | 0 | 3 | 2 |
| Rare | 35 | 2 | 5 | 2 |
| Epic | 55 | 4 | 8 | 2 |

Forge also spends Fragments, needs Rare/Epic blueprints; optional influence adds 1/2 Reagents to Rare/Epic respectively. A permanent Rare gear recipe competes with one expendable Rare dose for the same two Reagents; Common potion crafting consumes half an Uncommon gear's Essence. Uncommon potions are particularly inefficient in reagent terms. The 21 potion recipes have 38 required family entries: Arcane 9, Radiance 8, Fury 7, Aegis 5, Decay 5, Blood 4. This counts recipe coverage, not observed demand; don't equalize mechanically without knowing usage.

## Shop / price / utility
R6 weights: Common 51.785714%, Uncommon 31.071429%, Rare 13.809524%, Epic 3.333333%; each of 3 Epics 1.111111%. Four independently sampled offers with replacement: chance of at least one specific Epic 4.370918%; any Epic 12.681358%. Prices ceil(base*(1+.12*unlocked)); restock 12+ceil(unlocked/2). Examples E1/E10/E20: Health 16/31/48, representative base-36 Rare 41/80/123, base-42 Epic 48/93/143; restock 13/17/22. Base normal gold is 4.5+floor(tier/2) before size/risk/rounding; price scaling broadly tracks normal-room income at equivalent tier, so no blanket price cut recommended. Farming low E while shop prices use unlocked E may be inefficient. Don't redesign economy from these estimates alone.
- Fortune increases random equipment drop chance only, not rarity. Ordinary base chance .38, Elite .60, Boss .85 before risk/size/cap; 25% relative gives .475/.75/.95 on baseline (cap .95). Compare it against a consumed slot and actual item retention.
- Wisdom adds XP and occupies a slot; no direct material return. Keep +25% provisional.
- Precision/Phantom, Withering, Executioner and Renewal already use specified native effect paths; do not alter raw potency without targeted combat results.
- Purifying spends duration on all completed fights although marked conditions/boss conditions apply selectively. Recommend only decrement on an actually affected combat (marked room for relentless_hunt, carrion_swarm or blighted_ground; boss for unbroken_ward/sanguine_rite), keep 50% mitigation and 2 eligible fights. Distinguish design change from regression.
- Scout/Veilsight/Fate/Trail provide map utility, not direct combat power; keep effects. Measure usage before changing duration or prices.

## R7B candidate — pending user approval, NOT implemented
1. Keep normal/Elite/Boss drops, guaranteed rewards, Forge costs and all potion magnitudes initially. Avoid increasing permanent gear supply across the board.
2. Keep Common 2 Essence, no Reagents. Uncommon 3 Essence + 1 thematic Reagent (Might Blood; Arcane Arcane; Ironhide Aegis; Trail Fury; Scout Fury; Purifying Radiance; Renewal Radiance). This would replace R6's pair, including the previously approved Renewal pair; needs explicit approval. Rare remain 5 Essence + one of each of two families. Epic Fortune/Wisdom remain 8 Essence + pair. Prospector exception: 8 Essence only, no Reagents, +25% relative remains. Convert Essence into a chance at materials at opportunity cost, without directly destroying the resource it farms. Alternative if preserving pair is essential: keep recipe unchanged and rely on Gold purchase; no automatic buff. 
3. Offer mass candidate Common 48%, Uncommon 30%, Rare 16%, Epic 6% (sum 100%); each Epic 2%, four offers: 7.763184% specific and 21.925104% any. Same 4 slots and restock price; no guaranteed Epic. Keep base Gold prices provisionally. 
4. Expose existing gated 6-Essence dry-streak refinement through Apothecary for the selected recipe's missing Reagent; same shared dry counter and atomic persistence, not unrestricted exchange. 
5. Purifying eligible-duration adjustment as described. No other effect changes in R7B. Confirm the rule for Sanguine Rite whether eligibility means boss encounter rather than actual trigger; candidate uses boss encounter.
6. R7C: deterministic tests for all costs, balance of offer probabilities, rollback, refinement shared counter, actual eligible duration, and real award thresholds. Short directed native integration tests only; hold broad combat simulations until artistic redesign approved. Validate browser UI separately. Compare against R6.1 baseline; no new branches required.

Status: R7A audit complete, mechanics unchanged. R7B decisions require approval. R6.1 validated (99/99); visual QA outstanding.
