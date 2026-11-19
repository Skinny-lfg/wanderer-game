# Wanderer v0.13 — Definitive retirement of the old Realm generator and Talent modules

**Date:** 19 November 2026  
**Isolated branch:** `audit/v013`  
**Verified gameplay/source commit:** `bce286931b137132d62b76c9c1f679bed3f2bf59`  
**C4 release-gate:** [run 44611463018](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44611463018) — **4/4 jobs successful**  
**Clean-sheet integration and Pages sync:** [run 44611462918](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44611462918) — **3/3 jobs successful**  
**Deployment/merge:** Not performed.

## Removed from executable game

- Deleted the retired non-Dungeon 15-Realm generator, historical map branch creation, offer/reroll/affinity influence/selection API, its persisted 15×3 reroll state and old route save rollback checks from `online/v012-expedition-controller.js`, `online/v012-save.js`, `online/v012-persistence-runtime.js` and `online/v012-expedition-runtime.js`. The controller now rejects starts lacking `{dungeon:true}`; restore accepts only valid current Dungeon v2 checkpoints.
- Deleted `expeditionRouteMap` and old route UI from `index.html`. The live game uses `dungeonMapMarkup` with the current deterministic three-card Dungeon, fog of war, map navigation and contract/boon workflow.
- Removed all v9–v14 constructor mode flags `legacyTopology`, `legacyBasic`, `legacyFocused`, `legacyV14` and old graph definitions from the **still-active** `combat/talent-graph-next.js`. Retained the v15 builder and `combat/talent-catalog.js`, `combat/talent-graph-bridge.js` and `combat/talent-graph-runtime.js`; the public global `WandererAutomaticTalents` remains the current v15 runtime, not the deleted old module.
- Physically deleted `combat/automatic-talents.js` and `combat/automatic-talent-layout.js`, 19 pages/scripts in 10 historical Talent prototype directories and 11 retired fixture/test/browser scripts tied to old saves, routes or inline Talent layout.
- Migrated the actual VM harness (`tests/v012-economy-harness.cjs`), deterministic simulator (`scripts/simulate-progression.cjs`), current graph tests, combat/gear stat tests and release workflows to the native v15 catalog. Added `tests/v013-current-only-dependencies.test.cjs` to make accidental reintroduction of retired modules/generator fail the current gate.
- Updated the Pages build to **remove** the deleted module files from `docs/combat/`, instead of merely copying the current source on top of an obsolete generated file. The current `docs/preview/talent-rebuild` iframe is retained. A second build proved `C3_DOCS_SOURCE_PARITY=true` with zero changed paths.

## Native/test evidence

| Gate | Verified results |
|---|---|
| Current v0.13 native gameplay | 272/272 |
| Simulation engine | 7/7 |
| Current v15 Talent Graph | 79/79 |
| Independent Boss/Elite/build cases | 89/89 |
| Integration, economy, checkpoints | 82/82 |
| Save/cloud/identity fixtures | 51/51 |
| Firebase emulator authorization tests | 11/11 |
| Chromium desktop/mobile and long-form E1 Boss/extraction | PASS |
| Pages source parity and cleanup | PASS |

All four **mandatory** C4 jobs passed at `bce28693`. The clean-sheet workflow passed its static, browser and generated Pages jobs at the same source SHA. The modern iframe retained **343 nodes** and the browser tests traversed real Talent purchases/reload, Forge, Inventory, map, Oracle, Marked Elite, final Boss and extraction. The build and smoke environments were isolated; no production Firestore data were used.

The audit detected and corrected actual hard dependencies before passing: the Dungeon startup still passed a deleted `freeBuild` local; the simulator still requested the deleted `allowed()` controller API when resolving an event; the native harness and Pages builder still referenced deleted Talent layout files. These have been corrected. Tests that asserted the old event schedule and pre-clean-sheet save behaviors were replaced with current Dungeon/v15 assertions.

## Deliberate preservation and limits

- Preserve active modules despite their `v012` names: the Dungeon controller's current path, Buildcraft, all combat, security, cloud revision checks, boss and loot mechanics. The old naming alone is not evidence of obsolescence.
- This change **does not** introduce save migrations, restore old saves or modify player account identity, combat coefficients or drop chances.
- This cleanup definitively removes the requested **generator and historical Talent module files**, but is **not** a claim that every retired explanatory comment, old screenshot, archived workflow or unreachable historical UI conditional throughout the whole repository has been purged. Such residual code should be scoped and reviewed separately rather than deleting current functionality by string match.
- The C4 natural-player decision agents still exhibited an early progression bottleneck; deleting the generator does not constitute a balance adjustment or a verified fix to those outcomes. Release-quality judgement remains separate from the now-green technical checks.

## Source commits

- `63d63da`: eliminate pre-v15 graph construction modes.
- `30c6055`, `d115f51`, `e7bbdae`: remove old Realm generator, reroll/checkpoint format and route UI.
- `3eacfb5`, `80f92cb`: repair current-only Dungeon startup and simulation event choices.
- `5960784`, `c183ac2`, `80974bf`, `47bd61d`: migrate tests/harness to v15, delete obsolete modules, fixtures and prototypes.
- `a094fd2`, `f9ce0ac`: update Pages cleanup and remove stale VM module loads.
- `bce2869`: update remaining event-scheduler assertion; current native/browser/security gate is fully green.

**Final status:** Requested legacy generator/module retirement **completed and tested on `audit/v013`**. Production, `main`, GitHub Pages deployment and actual player saves remain unchanged.
