# Wanderer v0.12: current game map

The production entrypoint is `index.html`. It still contains substantial UI and
game glue; it loads the following runtime modules before booting the game.

- Expedition scheduling, offers and Realm order: `online/v012-expedition-controller.js`.
- Expedition transitions and rewards: `online/v012-expedition-runtime.js`.
- Encounter actions and state: `combat/v012-combat-runtime.js`, with shared rules
  in `combat/v012-combat-core.js`, `combat/v012-gear-stats.js`,
  `combat/v012-buildcraft.js`, `combat/v012-runes.js` and `combat/legendary.js`.
- Events: `online/v012-expedition-events.js`. Consumables and treasures:
  `online/v012-consumables.js` and `online/v012-treasures.js`.
- Equipment and loot: `economy/v012-equipment-runtime.js`,
  `economy/v012-loot-rules.js` and `economy/v0101.js`.
- Local validation and save transitions: `online/v012-save.js` and
  `online/v012-persistence-runtime.js`. Account and cloud coordination live in
  `online/v012-account.mjs`, `online/v012-cloud-save.mjs` and
  `online/firebase-client.mjs`.

The controller still accepts older state and names. These paths can be involved
in restoring saves; do not remove them solely because they say “classic”.
`online/pvp-stats.mjs` is also used by current regression tests and its generator,
even though the retired practice-duel module is not part of the current game.
