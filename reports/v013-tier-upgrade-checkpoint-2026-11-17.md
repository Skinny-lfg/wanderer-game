# Wanderer v0.13 — Expedition progression and gear upgrade checkpoint
2026-11-17 · **WIP / do not publish**

## Implemented on PR #39
- The recovered local WIP is preserved on wip/v013-recovery-20261117; this work is on a separate branch.
- E1–E5 equipment generation retains its original stat budgets and costs.
- Named tiers: Adventurer E1–4, Veteran E5–14, Ascendant E15–34, Ancient E35–69, Exalted E70+.
- Beyond E5, equipment uses the E5 base budget and named multipliers rather than an indefinitely growing raw expedition tier. The old E200 gear multiplier is disabled for the new mode.
- Forge: owned Stash or equipped item can be advanced one named tier if that tier is unlocked and its displayed materials are available. A preview compares current and new stats, and a confirmation precedes the transaction.
- The item keeps its ID, name, slot, rarity, trait, effects, source, protection, special abilities and Legendary reinforcement rank. Upgrading a reinforced Legendary recalculates its original base values so subsequent +rank upgrades remain compatible.
- No migration of existing items or changes to Talent Tree.

## Provisional economy formula
Tier unlocks: E5, E15, E35, E70. The cost increases with the target tier and item rarity:
- Fragments: ceil((30 + 9 × target tier) × rarity factor)
- Essence: ceil((1 + target tier / 5) × rarity factor)
- Factors: Common 1.0, Uncommon 1.2, Rare 1.5, Epic 2.0, Legendary 2.5

These prices are **initial design values**, not a proven economy balance. Further tuning requires real earning rates and full-run simulation.

## Local validation completed on source snapshot
- Focused progression/crafting/upgrading: **29/29 passed**.
- Seven new pure upgrade tests passed: unlocks, currency, immutability, equipped items, multi-stage, Legendary reinforcement, duplicate ownership and terminal Exalted tier.
- In a focused headless browser DOM test, an E5 item was upgraded to E15 with resource deductions and preserved ID. Forcing persistence failure rolled the transaction back.
- Broader 67-test feature suite: **49 passed, 18 failed**. Running the same pre-existing 60 tests against the original uploaded snapshot produced **42 passed, 18 failed**. Failed test names match; no newly observed failure in this comparison.
- GitHub CI has not yet confirmed the new branch. No merge or deployment performed.

## Exploratory combat simulation
The existing runner in scripts/simulate-progression.cjs uses the combat engine but artificially scales a starter build, starts an E1 expedition, runs isolated encounters with fully restored resources, and samples only three fixed seeds per build. It cannot establish production balance.

At E100, all four tested builds beat each sampled boss (3/3). At E250, Blood/Fury was 2/3 and other builds 3/3. At E1000, boss results were: Blood/Fury 1/3, Aegis/Vitality 3/3, Magic/Decay 3/3, Blood/Decay 0/3. All tested groups were won at those levels. Equipment remains Exalted ×1.60 while enemy reference continues increasing logarithmically.

**Unresolved:** full-expedition cumulative damage/mana, actual earned equipment distributions, bosses and statuses under varied seeds, and proven long-run balance. Do not change production curve solely on these exploratory results.

## Next manual acceptance checks before merge/publication
1. Open Forge on desktop and mobile in a normal authenticated game session.
2. Upgrade an existing stash item; verify preview, confirmation, exact resource deduction, persistence and reload.
3. Upgrade an equipped item; verify stats, identity, equipment slot and no duplicate item.
4. Confirm Legendary +rank after a tier upgrade.
5. Run full-expedition samples at E5, E15, E70, E100, E250, E1000 with multiple skill and equipment paths.
6. Triage pre-existing failing suites separately, resolving contradictory armor-profile expectations before modifying old gameplay rules.
