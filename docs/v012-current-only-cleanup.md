# Wanderer v0.12 — current-only cleanup

Scope: `development` only. No main, Railway/Firebase deployment, Rules changes or real-save access.

## Completed

- Kept the current-only entrypoint and version-2 Expedition controller established by the first cleanup.
- Removed 63 inline function declarations and 18 disabled classic branches: classic save/import/backup writers, dungeon routing/progression/protection, Sigils/transfer UI, set presentation and retired event transactions.
- Removed the old `online/app.mjs` entrypoint, `combat/affinities.js`, `online/v012-events.js`, their obsolete workflow/simulation and classic-only QA. The sixteen-event `online/v012-expedition-events.js` is authoritative.
- Removed nine unused embedded bitmap payloads, five classic-only Frost/Quarry mob/background assets and 340 unreachable CSS selector arms. Quarry's background remains: Bloodscar uses it.
- Reduced `index.html` from approximately 1.09 MB to 0.55 MB (49.5%). No whole-file formatting or combat-engine rewrite.
- Reused `economy/v0101.js` for the four active crafting/reinforcement primitives; verified their function bodies match the former inline definitions. Removed unused Sigil/transfer exports. Private hosting permits this dependency behind the same authentication gate.
- Updated fixture bootstrap hooks and the generated stats extractor to the current entrypoint. Removed assertions about retired storage/migration paths and classic-only VFX replay; current storage isolation and direct VFX routing remain checked.

## Deliberately retained dependencies

- Native weapons, Legendary abilities, DOT/status handlers, VFX, loot/stat formulas and their shared `setRuntime`/cooldown/heal/barrier helpers. Their historical names do not make them obsolete.
- Neutral `stats.counts`/`stats.bonus`/`stats.sets` shapes and some dormant set hooks remain coupled to shared combat/stat consumers. No gear sets are enabled. Removing these contracts would require a separate, broader combat/stat rewrite; none was attempted.
- Current save/profile fields and Rune validators, including already stored history/metadata. No save schema migration or destructive conversion.
- Online model/restore/security and prepared leaderboard primitives still used by current validation/tests. The old account UI is no longer bootstrapped or retained.
- Existing equipment icon fallbacks and shared styles where current consumers still depend on them; no blanket art deletion.

## Validation

- Current unit suite: 73/74 passed on the single full run; the sole failure was an obsolete classic-save guard assertion. Updated that contract and reran only that test: PASS. All 74 current cases validated.
- Chromium: full 15-Realm Expedition, Evasion and actual protected private hosting passed at 390 px and 1280 px, including Static/checkpoints, owned potions, six-slot bag, global rerolls and unique final Rune settlement.
- Asset/VFX smoke and generated stats consistency: PASS. The retired classic replay assertion was replaced with current direct weapon-VFX routing and rerun in isolation.
- No balance simulations or stress tests were run for this cleanup. No gameplay/balance, current save rules or intended UI changes.
