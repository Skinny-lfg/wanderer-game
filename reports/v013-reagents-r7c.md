# R7C — Final Integration Audit
Baseline 8fa1be9; R7B.1 directed CI 45849472495 passed 103/103, zero failures or skips. Approved economy unchanged: 2/3/5/8 Essence; 0/1/2/2 Reagents, Prospector 8 Essence only; 48/30/16/6 offers. Purifying effect and two-combat duration unchanged; refinement Forge-only.

## Integration review
- Shared crafting wallet and atomic Forge/Apothecary deductions; potion capacity gate, loadout ownership, three slots, unique automatic effects; no new save fields. Recipes and shop rarity source centralized in consumables.
- Expedition permanent reward ledger, Prospector random multiplier, guaranteed boss drops, optional contract receipts and marked Elite settlement reviewed. Marked settlement already separate from optional Contracts. 
- Fixed synchronous save rejection in buy, restock and loadout selection: restore wallet, stock, selection and shop state; use same native persistence gate as craft. Block removal from loadout when it would create a new Stash stack without space; existing partial stacks remain eligible.
- Fixed cap consistency for marked Elite and Bounty Essence increments, clamp to existing save maximum 1e9; require safe-exit outcome for marked settlement. No rate or reward changes below cap.
- Both browser module mirrors updated, cache keys updated in both entrypoints. Existing contract potion and unused-dose return paths deliberately preserve earned doses even if resulting Stash exceeds nominal capacity; no new discard/overflow policy introduced. Browser visual QA and cloud async failure recovery are not validated; local synchronous rollback matches existing Forge behavior. No broad combat or economy simulation.
- Directed tests: synchronous transaction rollback, Stash boundary, shared Forge/Apothecary material competition, safe exit and once-only payout at caps, real first-room Prospector award threshold, Bounty cap. CI results pending at commit creation.
