# Wanderer v0.13 — Phase 1.1 map UX validation

**Result: READY on the local checkout for the next combat phase.**
**Branch:** `development`
**Starting HEAD:** `941740286d2b6b8d4bea2d05e0ad4fa6b01954c7`
**Worktree at start:** clean. The work below stays on the local branch; nothing was pushed, deployed, merged to `main`, or connected to live Firebase/saves.

## Scope and implementation

The existing 15-Realm graph, controller, calendar, checkpoints, and transition rules remain in place. The change is presentational:

- Replaced each large Realm card with a compact encounter marker: crossed swords for Combat, skull for Elite, star for Event, and crown for Boss.
- Kept all 41 route nodes and all graph links. Completed nodes are green, available routes are highlighted, unchosen future nodes are dimmed, and the final boss has a distinct marker and `BOSS` label.
- Highlighted the route already chosen with a solid gold line; the next available edges use a dashed gold line.
- Reduced repeated Realm labels to milestones and the current Realm. Future nodes show only their known encounter kind; they do not expose a theme, affinity, or reward before it is offered.
- Added a compact detail strip for only the live route options. Each choice reports its actual name, affinity, encounter kind, and generated wave count. Events correctly say “no combat”; no loot or advantage is implied. Rerolls remain attached to their respective option and retain the shared saved count.
- At the one-option final route, the heading reads “Next · final boss · enter in one click”. Selecting a route marker still enters its Realm immediately.

No controller/runtime, encounter calendar, balance, reward, save format, or Firebase Rules were changed. Linear auto-advance still requires the saved preference, one remaining offer, no pending mandatory reward, and available Bag capacity. The equipment/build tabs, Bag, potion slots, vitals, and Extract remain accessible from the between-Realms workspace. A full or overflowing Bag still blocks route entry.

## Map-choice relevance

Choices are not wholly cosmetic: the available offers can have different affinities and generated wave counts, and the selected affinity influences later offers under the existing planner. Theme/name differences also remain visible. The current calendar assigns the same encounter kind to every lane of a given Realm, however, so a branch does not let the player choose between Combat, Elite, and Event at that depth; the graph’s fork is partly a layout for the existing affinity choices.

For a later phase, path-dependent encounter kinds could create route-level risk choices. That would need to preserve exactly two Elites and three or four Events on every complete route, plus the current affinity cap and reward rules. No such calendar or balance change is included here.

## Visual comparison

The Phase 1 baseline screenshots were copied unchanged into this report’s `screenshots/before-*` files. The baseline report had full-page screenshots but no saved DOM panel-height measurement, so the full-page comparison is exact while the baseline panel-only height is not.

| Viewport | Baseline full-page screenshot | New full-page screenshot | New map panel | Rendered map |
|---|---:|---:|---:|---|
| 390 px | 4,565 px high | 1,764 px high | 1,114 px | 15 rows, 41 compact nodes, 3 current route details |
| 1280 px | 1,947 px high | 1,793 px high | 1,204 px | 15 rows, 41 compact nodes, 3 current route details |

At 390 px, the full-page height is down 61.4%. The former 41 repeated, text-heavy encounter cards are now 41 small graph nodes; only the three current choices retain detail text. At 320 px the player sees the current options and the first path rows immediately; the remaining route is available by vertical scroll.

Panel heights recorded by Playwright:

| Width | Height |
|---:|---:|
| 320 px | 1,106 px |
| 390 px | 1,114 px |
| 768 px | 1,191 px |
| 1280 px | 1,204 px |
| 1920 px | 1,204 px |

All five widths had no horizontal page overflow, no browser page errors, and all interactive map targets measured at least 44×44 px. Screenshots:

- [Before, mobile 390 px](v013-phase11-map-ux-validation/screenshots/before-map-390.png)
- [After, mobile 390 px](v013-phase11-map-ux-validation/screenshots/after-map-390.png)
- [Before, desktop 1280 px](v013-phase11-map-ux-validation/screenshots/before-map-1280.png)
- [After, desktop 1280 px](v013-phase11-map-ux-validation/screenshots/after-map-1280.png)
- [Measured panel dimensions at all five widths](v013-phase11-map-ux-validation/screenshots/viewport-metrics.json)

## Flow and persistence checks

- Route selection starts the Realm in one click; there is no Exit/Enter pair.
- The saved auto-advance toggle survives refresh. The browser flow confirms it can be paused and re-enabled. Runtime guards prevent auto-advance with multiple options, a pending reward, or a full/overflowing Bag.
- Mandatory passive selection precedes returning to the map; the existing Event resolution and final boss/Rune sequence passed the full browser/regression suites.
- Refresh preserves the graph, current progress, shared reroll count, and auto-advance preference in isolated synthetic browser storage.
- Equipment, Bag, potions, stats/passives, and Extract remain available. Full-Bag tests still block route entry without deleting items or granting a Rune.

## Validation

| Command/check | Result |
|---|---|
| `npm test` | PASS — 379/379, 0 failures |
| `npm run test:preview` | PASS — 4/4 private-preview tests; isolated local fixtures |
| `npm run test:browser` | PASS — complete browser regression chain; includes login gate, full Expedition, full-Bag extraction, equipment, and map flow |
| Map Playwright matrix | PASS — 320, 390, 768, 1280, 1920 px; 44 px targets, no overflow/page errors, map <1,250 px at every width |
| `npm run test:assets` | PASS — VFX/asset smoke |
| `npm run test:rules` | PASS — 10/10 Auth/Firestore Emulator tests with `demo-wanderer`; no live project or player data |
| `npm run simulate:v012` | PASS — 174 scenarios, 0 timeouts, 61 wins; all 174 result rows match the Phase 0.2 baseline. The full-file HTML hash changes because `index.html` contains the new map UI. |
| `npm run simulate:v013-map` | PASS — 10,000 deterministic maps; all branches reach Realm 15, with two Elites and three/four Events |
| `git diff --check` | PASS |

The route-flow browser test also checks equipment access, reroll persistence, map reload, one-click entry, and page errors at each viewport. The existing complete-Expedition browser test reaches the boss and claims its Rune. No live accounts, saves, or Firebase services were used.

## Branch snapshot and remote difference

The connected GitHub read returned remote `development` at `8fa391c68058bea81df4c7bdb0711d1c07800dd7`, while the requested local base is `9417402`. They diverge after common commit `173034a532eaeb5bb3a2597e59deaa472e4440a6`. The remote snapshot currently has a different entrypoint/module composition, and the Phase 1 map CSS/report are absent there. I preserved the requested local history and did not move local refs, merge, rebase, or overwrite either line. **This READY result applies to the specified local checkout only; it does not claim parity with the current remote branch.**

## Changed files and commits

Implementation and browser measurement changes:

- `index.html` — compact node graph, chosen-route path emphasis, option context and Next label.
- `online/v013-expedition-map.css` — compact responsive nodes, connections, states, and choice panel.
- `tests/v013-map-browser.cjs` — visual metrics and assertions across the requested viewport matrix; screenshots now go to this report instead of overwriting the Phase 1 baseline.

Evidence:

- Baseline and after screenshots plus viewport metrics in `docs/v013-phase11-map-ux-validation/screenshots/`.
- This report records architecture, branch comparison, interaction review, and test results.

Commits are local on `development`; no push was performed:

- `7fef13a` — `feat(expedition): compact route map and clarify choices`
- `8323e62` — `docs(expedition): record phase 1.1 map UX validation`

**Recommendation: READY for the next combat phase on this local branch.** The compact map is validated without changing encounters or balance. The only open coordination item is that local `development` and GitHub `development` have diverged; any later push/integration needs an explicit review of those histories.
