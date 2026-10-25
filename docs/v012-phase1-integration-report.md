# Wanderer v0.12 — Phase 1 original-game integration report

Date: 2026-10-19
Branch: `development` only
Starting revision: `29bf7eba446c53f270553558e02c09cbc04295ab`
Verified existing safety branch: `backup/development-2026-10-19` (`83ea8be4941477561176aaacf7e77d5cc6d72a1b`)
Release status: **isolated development preview — NOT production ready**.

## Decision and architecture

Read `docs/v012-integration-audit.md` and inspected current classic `index.html`, `online/v012-engine.mjs`, tests and CI. Reused the original in-page battle engine instead of migrating the standalone prototype simulator. The new pure controller `online/v012-expedition-controller.js` handles selection/progression only; the classic game still resolves enemy attacks, weapon skills, legendary effects, combat VFX, loot items and enemy portraits.

Preview opt-in: `?expeditionPhase1=1` on a server serving the `development` files. This does **not** publish the mode on main. With the flag, no classic save load/write and no online app or prototype module initialization. In normal mode, the original module tags and bootstrap timing remain intact.

## Delivered in Phase 1

1. Expedition selector with first Expedition available; clearing the fifteenth Plane boss unlocks the next Expedition for this in-memory test session.
2. Exactly 15 Planes per Expedition and **three** offered choices before each, using original thematic art. Show wave count, Elite/Boss warning, six-family affinity and event indicator.
3. Six families: Blood, Decay, Vitality, Aegis, Fury and Magic. First family cannot repeat before a second is acquired; after two are acquired any eligible family may appear immediately; maximum three unique families per Expedition. Temporary families reset on completion or defeat. Phase 1 does not yet activate passive/spell effects.
4. Starting a Plane enters the existing player-versus-enemy arena and calls existing `updateFight`, `enemyFor`, combat timing, original character/enemy assets and VFX. Elite/Boss applied to the last Wave where indicated. One enemy active at a time.
5. Waves progress automatically one by one. Each defeated enemy independently rolls Gold, Fragments and equipment; more Waves mean more opportunities. Rewards are immediately retained in isolated in-memory state. A completed Plane returns to the next three offers.
6. HP and Mana carry into later Planes, displayed before selection. New Expedition restores full current-stat values. A defeat ends the experimental run without removing equipped or collected gear. Old D1–D200 records are **not read or migrated**.
7. Classic gameplay, saves, account flows, gameplay features and the production look remain the default when the feature flag is absent.

## Changed files

- `index.html`: isolated opt-in entry, old combat hooks (victory, death, per-Wave enemy), battle presentation, guarded save and original-module preservation.
- `online/v012-expedition-controller.js`: pure, dependency-free 15-Plane progression state machine.
- `online/v012-phase1.css`: dark-fantasy responsive cards, affinity symbols, resource/status readouts.
- `tests/v012-expedition-controller.test.cjs`: controller invariants, 15 Plane progression, family rules, unlocked gate, defeat and isolation contract.
- `tests/v012-expedition-browser.cjs`: mobile/desktop browser test with original art/VFX, automatic transition and sentinel save protection.
- `package.json`: run controller tests as part of `npm test`, browser integration in `test:assets`, and add `test:v012:integration`.
- This report: `docs/v012-phase1-integration-report.md`.

## Commits (all on development)

- `b49d9fe`: add pure scheduler.
- `6995077`: style isolated Plane UI.
- `26c8adc`: connect classic combat, enemy data and VFX to Plane navigation.
- `4f51d64`: add unit/state-machine regressions.
- `14e7818`: add real-browser integration test.
- `ccf91e3`: wire smoke/browser gates and extended audit.
- `632d3a7`: reuse original themed dungeon backgrounds in arena.
- `3844225` and `74e3d31`: affinity symbols, carried HP/Mana and styling.
- `8084e83` and `263b208`: restore original static module timing and verify the opt-in skip.

## Validation

- `npm test` — PASS on GitHub Actions, including the new state-machine tests and classic regression suite.
- `test:assets` — PASS on the follow-up audit: original VFX/assets, classic desktop/mobile browser regressions and new phase1 browser round-trip.
- `tests/stress-browser.cjs` — PASS on the follow-up audit, including classic save/account and equipment paths; an earlier audit failed due to an opt-in module-loader regression, now fixed.
- Dedicated Phase 1 browser test covers 390px and 1280px, three offers, original hero/enemy/VFX asset requests, first Plane combat and automatic return to Plane 2, and two unmodified sentinel localStorage keys.
- State-machine tests cover a full logical 15-Plane traversal and boss-only unlock; **not** a full fifteen-Plane live combat/balance playthrough.
- Reference CI audit: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39275688226 (final status/remaining jobs available at that URL).

**No** Firebase deployment, production rule change, live-save migration, reset, or main-branch modification.

## Known limitations / deliberately deferred

- Experimental state (unlocks, gear, rewards) is **RAM only**, lost on refresh. Do not treat it as an online or persistent player save.
- Event/Chest/Altar indicators are informational in Phase 1; distinct event resolutions are not yet implemented.
- Gear **swaps between Planes** and between-Plane Health/Mana potion use are deferred. Potion use is not available in combat or the main Camp in the Phase 1 preview.
- Permanent affinities on equipment vs temporary run passives, Decay-specific mechanics, Magic elemental selection (Fire/Frost/Lightning), Storm icon reuse beyond the family badge and new spell amplification are deferred.
- Forge/Merchant/Runes and cloud sync remain unchanged; permanent economy ledger/reward persistence must be integrated safely in later phases.
- Progression pacing, Boss rewards/rune integration and cross-Expedition balance require later simulation and supervised playtesting.
- The original prototype (`?playtest=v012`) is retained but remains **separate** from this integrated feature flag.
- Unrelated legacy non-gated test expectation mismatches noted in the Codex audit were not refactored during Phase 1.

## Phase 2 priority

Integrate temporary passive choices with the original stat/combat systems; implement the six families properly (Decay separately from Blood; Fire/Frost/Lightning for Magic with original Lightning/Storm assets and Staff/Wand amplification); expose permitted preparation actions (equip/swap gear, use HP/Mana potions between Planes only); implement event resolution; design a versioned, opt-in durable Expedition save model that preserves legacy D1–D200 history without automatic D200→Expedition200 migration. Run browser save-conflict, cloud restore and balance tests before enabling persistence or exposing the feature outside development.

**Go/no-go**: Phase 1 is suitable for isolated gameplay evaluation only. Do not merge to `main` or deploy until Phase 2 and persistent-save protection are validated.
