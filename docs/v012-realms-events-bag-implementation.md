# Wanderer v0.12 — Affinities, Realms, Events and Expedition Bag

Date: 2026-10-20. Branch: `development` ONLY. No production deploy, `main` merge, Firebase rules, cloud account saves or real player data changes.

## Implemented scope

- Six temporary affinity families (Blood/Decay/Vitality/Aegis/Fury/Magic), three-family cap. 63 catalogued temporary passives, 30 hybrids (15 prior plus 15 alternative), at most three distinct hybrids per run and at most one per pair, with hybrid draft unlocks on Realms 6/8/10. A qualifying hybrid appears among the three choices if available. Staff/Wand Spellblade correction and bounded trade-offs for new hybrids. Existing permanent equipment affinities and set bonuses remain intentionally DISABLED in v0.12.
- 12 active Realm themes, two per affinity. Reused 11 stable IDs and assigned new `bloodscar`. `frost` and `quarry` stay in the global classic catalog and remain valid in legacy checkpoint data but are excluded from fresh v0.12 Realm selection. Bloodscar uses Obsidian Quarry background and repurposed Blood Forge enemies as TEMPORARY art.
- Exactly 15 stages per Expedition. Controller chooses 3 or 4 distinct real non-combat event stages in early/mid/late windows and selects one event from each distinct category, protecting Realm 1, two guaranteed Elites, and final boss Realm 15. Regular combat encounters continue to use original graphics and combat rules.
- New isolated event module `online/v012-events.js`: twelve distinct encounter IDs across Trade, Pacts, Treasure and Survival; two risk/reward options per event plus a refusal option in the UI. Explicit costs and rewards. Bounds for HP spending, Gold/Fragments, buff stacking, Mana restores, equipment rolls. Player cannot navigate to Forge/Merchant/gear during committed events. Events use controller progress and isolated validation-slot checkpoint routines, never Firebase/cloud.
- Expedition bag capacity **6** (previously 9); overflow is displayed and must be resolved by explicit discard/equip before advancing, never discarded automatically. Main/global Stash capacity and historical saves are not reduced.

## Validation done

- 2,000 seeded complete structural Expedition runs through the actual current `online/v012-expedition-controller.js` passed with 15 completed stages, exactly 3/4 events, one boss unlock and no transition deadlocks. Observed 995 with three events, 1,005 with four.
- 63-passive synthetic execution checks verified that each exhibited an observable effect and no new hybrid hook threw in isolated combat context. Dedicated Node tests for `v012-buildcraft`, `v012-events`, `v012-expedition-controller` PASS in the development CI's focused step.
- The general `npm test` remains **RED** in legacy `tests/affinity-combat.test.cjs` due to 5-piece set/gear affinity assertions incompatible with the intentional removal of permanent gear affinities in v0.12; re-enabling mechanics to make those old assertions pass is NOT acceptable. The historical standalone `v093-shatter-double-strike.cjs` check also previously failed before this change in a baseline `development` run because Frost Shatter is not active with the current magic cast path (`element=null`). Keep failures visible rather than bypassing them.
- A newly added isolated Playwright end-to-end Expedition with synthetic high-tier gear, real event UI/decisions, 14 passive drafts, all 15 stages, boss unlock, 6-slot bag and account-save sentinels **PASSED at 390px and 1280px** in CI, see \`tests/v012-events-browser.cjs\`. This is functional browser integration, NOT a legitimate-gear balancing simulation or human playtest. Synthetic pass rates are NOT balancing evidence.

## Known limitations and risks / next actions

1. **Not ready for production** until independent runtime and browser validations pass: encounter entry, magic-element first choice, event award/checkpoint/refresh, 6-slot bag overflow, Rune boss, XP and progression, no saved loot duplication, mobile UI.
2. Event rewards currently approximate two ordinary Waves in Gold/Fragments, with special loot only on certain choices. Real combat attrition is reduced by events; economy and loot parity need an integrated simulation before numbers are approved.
3. Several event effects are **first-pass mechanics** (e.g. Oracle shows next room, no alteration of routes; Relic Collector provides a bounded resource option without a real item-trade picker; Runic Vault provides a temporary boost, no permanent Rune). Full content specificity and visuals need human QA.
4. Twelve thematic Realms currently reuse existing enemy pools and backgrounds, including a placeholder for Bloodscar. Final custom art and distinctive enemy behaviors have **not** been completed.
5. The buildcraft 15 alternative hybrids have not been balanced using integrated simulations. No claim of competitive parity; test sustain/burst with every weapon and tier before publication.
6. New checkpoints store event identity; restore validation has explicit checks and old schedules remain accepted, but cross-version browser checkpoint tests still required.
7. Confirm that the preview remains gated by `?expeditionPhase1=1` and validation save uses dedicated `?expeditionSave=1&validationSlot=...`; normal classic mode cannot modify accounts.

## Internal implementation links

- `online/v012-expedition-controller.js`, `online/v012-events.js`, `combat/v012-buildcraft.js`, `index.html`
- `tests/v012-expedition-controller.test.cjs`, `tests/v012-events.test.cjs`, `tests/v012-buildcraft.test.cjs`
- `.github/workflows/development-tests.yml`

Never merge into `main` or deploy until failures and QA are resolved and the user separately authorizes publication.
