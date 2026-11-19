# Local cleanup changelog

## Stage 1
- index.html uses the catalog rarity in potion inspection, reports the current displayed version to feedback and renders reward art independently of current ownership.
- online/v012-expedition-runtime.js records subtype, armor type and legendary identity with reward snapshots. online/v013-boss-abilities.js describes existing Guardian and Convergence behavior.
- Targeted test: node --test tests/v012-unified-gear-potions.test.cjs (6 passed). No combat coefficients changed.

## Stage 2
- index.html and economy/v012-equipment-runtime.js now use the equipment runtime's stash count for the UI. Removed the unreachable classic forge render branch.
- combat/v012-gear-stats.js initializes shared Magic/Decay resources once, retaining both flags. combat/v012-combat-runtime.js, online/v012-expedition-runtime.js and the HTML ports no longer dispatch the three empty legendary hooks. online/v012-expedition-controller.js drops the unreachable nested boss check.
- online/v012-save.js creates a validated current profile directly. Removed classic conversion, source archives, old gear/treasure repairs and history metadata. Revision checks, backups, account binding, checkpoint validation and the award ledger remain. This change performs no storage deletion or remote reset.
- Updated tests/v012-save.test.mjs, tests/v012-cloud-save.test.mjs and tests/v012-save-browser.cjs to use current saves. tests/v0120-results.test.cjs now loads the crafting validator used by current profiles.
- Targeted Node run: 48/48 passed across local save, cloud save, dungeon checkpoint integrity, unified gear/potion UI and Stage 7.4 potion files. Separate Node assertions passed for stash counts (0, 99, 100 and reserved dose) and detached armor reward identity.
- Additional historical result suite: 2/5 now pass; the same five tests failed on baseline 8d07cf3 before these changes. Remaining failures concern the old Realm passive flow, extraction setup and a synthetic Boss modifier setup. This does not validate those three flows through the browser. No browser suite or large balancing campaign was run.

## Stage 3
- tests/v012-economy-harness.cjs records executed bytes and exposes the shared target action; scripts/simulate-progression.cjs records ordered sources, replay settings, initial state digest, native elapsed time and target policy. Replaced inferred reinforcement counts with observed reserve actors.
- index.html centralizes the existing player action; selection policy stays in the CLI.
- tests/v013-runtime-parity.test.cjs covers ordered provenance, overrides, cross-engine snapshots and combat events. tests/v0120-results.test.cjs corrects three obsolete/invalid scenarios. No changes to the combat formulas.
