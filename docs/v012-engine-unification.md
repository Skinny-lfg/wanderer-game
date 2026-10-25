# v0.12 engine unification

Reference: `0c8d2ae`. Behavior-preserving extraction on `development`.

- `combat/v012-combat-runtime.js`: native attack/tick loop, DOTs, Legendary abilities, proc timing, metrics and logs.
- `online/v012-expedition-runtime.js`: Realm entry/completion, events, passives, initial choices, Between Realms and result transitions.
- `economy/v012-equipment-runtime.js`: item generation, equipment/bag/Stash, shops, crafting/reinforcement transactions, potions and Rune rewards.
- `online/v012-persistence-runtime.js`: seeded RNG, checkpoint capture/restore/resume, reward ledger, extraction and save recovery.
- Existing combat-core, gear-stats, runes, loot-rules, buildcraft, controller, events, consumables and save modules remain canonical. Leather stat compatibility now also lives in gear-stats; generated PvP stats use it.

147 runtime functions have one implementation outside `index.html`; source-contract tests follow the loaded modules. Factories receive live session bindings and UI effects, so restore cannot leave stale state references. No save schema, formula, RNG order or UI changes are intended.

## Validation

- `npm test`: 100 passed, zero failures.
- 21 bounded deterministic native-engine traces match `0c8d2ae`: E1/E50/E200, seven weapon/family combinations, funded Magic, ticks, rewards, inventory and checkpoint resume. Golden digests include full state; these are equivalence fixtures, not balance simulations. Wave completion is forced, so they do not establish win rates or balance.
- `npm run test:browser`: complete Expedition, Evasion and private-hosting fixtures passed at 390px and 1280px, including refresh, Static, event recovery, potion loadout, shared rerolls, boss Rune and duplicate-tab locking.
- `npm run test:assets` and `node scripts/build-pvp-stats.cjs --check`: passed.
- `index.html`: 544,436 → 471,703 bytes; 3,089 → 2,255 lines.

## Dependencies deliberately retained

`index.html` owns the bootstrap's live session variables, shared catalog/configuration constants, module adapters and DOM rendering/animation callbacks. Runtime factories use injected accessors for these bindings and retain calls to UI effects at their original points. Moving all state into a new store or replacing callbacks with an event bus would require a wider architecture change; neither is needed to eliminate duplicate mechanics, and neither was attempted. Rendering still requests lazy shop initialization through the canonical shop helpers; character selection remains an account/UI handler. The generated PvP bundle is a build artifact, not a separately maintained formula implementation.

Commits: `fd2026c` combat; `475d277` Expedition; `58eb389` equipment/economy; `8c15416` persistence; `f921e2f` remaining shared rules and uniqueness checks.
