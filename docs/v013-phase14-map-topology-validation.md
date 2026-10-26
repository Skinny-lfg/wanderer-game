# Wanderer v0.13 — Phase 1.4 Map Topology Validation

**Status: READY**  
**Branch:** `development`  
**Starting HEAD:** `c9f79e5`  
**Firebase, production saves, deployment, `main`:** untouched

## Summary

Phase 1.4 replaces the nearly fixed V2 route graph with deterministic, seed-selected macro topologies. Maps retain 15 Realms and the Realm 15 boss, while offering three or four strategic forks with variable start positions, lengths, widths, and merge locations. The topology still uses the existing combat, Elite, Event, affinity, and reward systems.

Combat and Elite map nodes now use the assigned encounter affinity icon as their primary mark. Their corner badge identifies Combat or Elite. Events and the boss retain distinct icons. Future Combat/Elite nodes without an assigned encounter do not show a decorative affinity. Available route details show actual affinity, encounter type, waves, and the existing Elite premium context.

## Topology and encounter results

The generator provides nine macro topology families:

* `long-outer-routes`
* `narrow-passages`
* `braided-approach`
* `scattered-crossings`
* `late-convergence`
* `crossroads`
* `staggered-trails`
* `split-and-rejoin`
* `deep-detours`

Forks contain two or three options and keep lanes separated for the generated segment before merging. The graph is seed-deterministic, acyclic, connected from the start to Realm 15, and validated for reachability. Older V1 and structured V2 checkpoints remain restorable.

`npm run simulate:v013-map` generated 10,000 maps and enumerated 343,506 complete paths:

| Measure | Result |
| --- | ---: |
| Topology templates observed | 9 / 9 |
| Maps with 3 decisions | 3,322 |
| Maps with 4 decisions | 6,678 |
| Route choice widths | 15,533 two-way; 21,145 three-way |
| Elites on a route | 1: 134,358; 2: 74,790; 3: 134,358 |
| Mean Elites per route | 2.00 |
| Existing Events on a route | 3: 170,943; 4: 172,563 |
| Mean nodes per map | 29.69 |
| Mean expected waves per route | 25.00 |
| Mean bonus Gold / Fragments | 14.80 / 11.10 |

Compared with the fixed V2 graph, every V2 Expedition had the same 15-row, 35-node layout, four three-option decision points, and 81 graph paths. V3 varies the macro template, row widths, and fork locations; maps now have three or four decisions and average 29.69 nodes. All rows still connect only to the next Realm, and every generated node remains reachable and can reach the boss.

The risk fork has an equal-weight distribution of one, two, or three Elite encounters. A sample safe route has one Elite, 10 Combat nodes, and three Events; the dangerous route has three Elites, eight Combat nodes, and three Events. Under existing reward formulas, expected bonus Gold/Fragments are 12/9 versus 18.4/13.8, expected waves are 25.5 versus 26.5, and expected Combat/Boss item drops are 7.40 versus 8.09. No loot formula or balance coefficient changed.

## Visual evidence

The 30-map matrix includes at least three maps from each of the nine macro topology families. It varies segment positions, widths, path silhouettes, and row distributions rather than only shifting node coordinates.

* [30-seed topology matrix](v013-phase14-map-topology-validation/screenshots/topology-matrix-30.png)
* [320 px mobile map](v013-phase14-map-topology-validation/screenshots/affinity-map-320.png)
* [390 px mobile map](v013-phase14-map-topology-validation/screenshots/affinity-map-390.png)
* [768 px tablet map](v013-phase14-map-topology-validation/screenshots/affinity-map-768.png)
* [1280 px desktop map](v013-phase14-map-topology-validation/screenshots/affinity-map-1280.png)
* [1920 px desktop map](v013-phase14-map-topology-validation/screenshots/affinity-map-1920.png)
* [Viewport and visual audit metrics](v013-phase14-map-topology-validation/screenshots/viewport-metrics.json)

The browser visual audit found zero overlapping nodes at each viewport; SVG edge endpoints remained within 0.016 px of their node centers; choice cards had no horizontal text overflow; map heights ranged from 923 to 986 px; touch targets measured at least 44×44 px. At a 320 px viewport the available map panel width is 268 px after the surrounding game layout, with no page-level horizontal overflow.

## Files changed

* `online/v013-expedition-map.js` — V3 macro-topology generation, validation, path preview and legacy structured-map compatibility.
* `online/v013-expedition-map-layout.js` — graph-driven deterministic node placement and curved edge layout for variable row widths.
* `online/v012-expedition-controller.js` — restores V1/V2 saved maps while accepting the current structured map version.
* `online/v013-expedition-map.css`, `index.html` — affinity-first node icons, encounter badges, compact contextual details and adaptive route rendering.
* `scripts/v013-map-stress.cjs` — 10,000-map route, topology, encounter, and economic simulation.
* `tests/v013-map-generation.test.cjs`, `tests/v013-map-controller.test.cjs`, `tests/v013-map-layout.test.cjs`, `tests/v012-complete-schedule.test.cjs` — topology constraints, legacy restore, generated route completion, and variable encounter schedule coverage.
* `tests/v013-map-browser.cjs` — five viewport sizes, topology matrix, affinity icon correspondence, reroll persistence, and direct node selection.
* `tests/v013-event-progression-browser.cjs` — synthetic Event/passive/reload progression, explicit checkpoint resume, Magic element decisions, and Bag cleanup using normal discard behavior.
* `tests/v013-full-bag-extraction-browser.cjs` — pauses auto-advance before checking the full-Bag map warning and extraction behavior.
* `tests/v012-complete-browser.cjs` — tests the user-controlled pause before inspecting between-Realm equipment and retains auto-advance persistence coverage.

## Validation

| Command / check | Result |
| --- | --- |
| `npm test` | PASS — 384 tests, 0 failures |
| `npm run test:preview` | PASS — 4 isolated preview security tests |
| `npm run test:browser` | PASS — complete browser suite; desktop/mobile, Events, Bag full, map, and existing UI regression checks |
| `npm run test:assets` | PASS — 29 VFX PNGs, affinity weapon mapping, enemy/boss routing |
| `npm run simulate:v012` | PASS — 174 cases, 0 timeouts, 61 wins |
| `npm run simulate:v013-map` | PASS — 10,000 maps, 343,506 complete paths; no invalid reachability or schedule distributions |
| `npm run test:rules` / Firebase Emulators | NOT RUN — no Rules were changed; production services were not accessed |
| Map browser visual checks | PASS — 320, 390, 768, 1280, 1920 px; no overlap or horizontal overflow |
| Event checkpoint/reload browser | PASS — 15 Realms, 3–4 encountered Events, 14 mandatory passive choices, no duplicate reward ledger |

An initial preview/unit run without elevated localhost permission reported `listen EPERM`; rerunning with the allowed local-server permission passed. Browser fixtures were also corrected where previous fixed-graph assumptions were no longer valid: they now pause auto-advance when testing map controls, proceed to the first actual fork, clear synthetic Bag overflow normally, resume saved checkpoints before interacting, and compare Event positions with generated segments rather than fixed Realm numbers. No gameplay transition or balance rule was changed for these test corrections.

## Compatibility and safety

Map state remains explicitly versioned. V3 maps save their seed, template, rows, nodes, edges, segments, selected path, current node, completed nodes, and available nodes. Deterministic validation rejects malformed graphs. V1 and V2 restore tests pass. Events, affinity limits, three rerolls, rewards, and extraction rules continue to use current runtime logic. All browser and simulation data was synthetic.

The pre-change checkout backup remains at `/workspace/.wanderer-backups/wanderer-development-c9f79e5.bundle`, SHA-256 `358465870641d6446d8c394e74e311fee310b837f650fa68e8a73894a3b118a2`.

## Commits

Local implementation and test commits on `development`:

* `6c986ad` — `feat(v0.13): generate seed-selected expedition topologies`
* `d10a886` — `feat(v0.13): render affinity-first route map nodes`
* `835312e` — `test(v0.13): cover variable route and event checkpoints`

This report and its screenshot evidence are committed separately. The branch remains local and ahead of `origin/development`; no push, merge, deploy, Firebase Rules publication, or `main` modification was performed.
