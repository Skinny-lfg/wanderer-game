# Wanderer v0.12 — current-only development cleanup

**Scope:** `development` only. **No changes:** `main`, existing backup branches, live Railway deploy, Firebase rules, real players' saves.

## Completed

- Development's `index.html` now boots **v0.12 Expedition only**; deleted the obsolete `v012PrototypeLoader` and `onlineAccountLoader` plus obsolete prototype CSS link.
- Removed standalone `online/v012-engine.mjs`, `online/v012-prototype.mjs`, `online/v012-prototype.css`, and the publicly unnecessary `preview/server.mjs` while keeping `preview/private-server.mjs`.
- Removed `online/v012-legacy-controller.js` and its scheduler bridge. Modern `online/v012-expedition-controller.js` only restores version-2 calendars; unsupported historical checkpoints fail closed instead of being interpreted as modern progress.
- Removed 71 historical (pre-v0.12) docs, 30 obsolete/versioned test files, 11 historical simulation scripts and five standalone/prototype/legacy runtime files in the first cleanup commit. Removed one further obsolete classic-auth equipment browser test. These assets remain accessible in Git history/backups.
- Replaced the enormous older-version npm test chain and GitHub Actions workflow with modern v0.12 test, save/preview, asset and opt-in Chromium/metrics coverage.
- Updated `README.md`, `AGENTS.md`, integrated harness and v0.12 compatibility tests for a single current Expedition implementation.
- Didn't remove the game art needed by the current Expedition.

## Still coupled — do not claim all old code is removed

The live v0.12 Expedition still shares significant native combat, equipment, loot, shop and UI helper functions inside a very large `index.html`. Those functions originated in the classic implementation but **remain required by current gameplay**. The file still contains some now unreachable classic views, UI handlers, set-bonus paths and save routines. Blind deletion would break modern attacks, drops, runes, gear and safeguards.

Likewise, `online/v012-events.js` is still referenced by obsolete, currently unreachable event branches in `index.html`; remove it only together with these branches after verifying the new `online/v012-expedition-events.js` is authoritative. Some older online/cloud files remain on disk for future identity/leaderboard development but are **not bootstrapped by development's current entrypoint**.

## Required second step for complete source cleanup

1. Extract the active v0.12 gameplay helpers from the inline HTML into well-scoped combat, gear, expedition, UI and persistence modules **without changing game formulas, stats, loot, appearance or flow**.
2. Remove unreachable classic path routing, legacy set-bonus code, old save/back-up migration handlers and unused event implementation only after dependency/asset graph confirmation.
3. Recheck that developer/test entrypoint always runs current v0.12 and old account/legacy screens never load.
4. Retain only modern v0.12 tests and QA; add regression tests where old helper removal affects current combat/gear.
5. Run current unit/simulated 15-Realm E1–E200 tests; isolated Chromium 390px/1280px tests; Static, potion, Rune, boss and checkpoint refresh; verify no real saves accessed.
6. Make further changes only on `development`; no merge to `main` and no Railway/Firebase deployment without separate approval.

**Design constraint:** this is a *refactor and deletion*, not a new gameplay update. Preserve the existing current mechanics and assets, including 63 passives/30 hybrids, Static, 16 events, 3 shared rerolls, 3 potions, 6-item bag, one randomized final boss and 1 Rune per completed Expedition.
