# Wanderer v0.12 — Item detail popups (Camp and Inventory)

**Scope:** UI/UX change on `development` only. No game balance, Firebase, production saves or deployment changes.

## Behavior

- **Stash gear:** clicking a normal item opens a native themed `<dialog>` with the existing `previewItem` description, stats, rarity, effect, build comparison and context-specific Equip options (standard, Ring I/II, Dagger Main/Off-Hand). Lock and Salvage actions remain available. Bulk selection is unaffected and does **not** open a popup.
- **Equipped gear:** clicking an occupied equipment slot in Camp or Inventory opens the same details popup with an Unequip action. Empty slots instead navigate/filter the Inventory where legal.
- **Live Expedition:** existing equipped-gear / Expedition Bag modal and safety checks remain unchanged.
- **Potions:** clicking a potion stack in the normal Stash opens a detail popup and then Equip Potion. Clicking a loaded potion in the three-slot equipment row opens details with Remove. The existing direct Remove button and in-Expedition Use action remain unchanged. Three-slot and available-stock rules still live in the original game code.
- **Interaction:** native dialog is dismissible with Close or Escape, restores keyboard focus, scrolls internally on mobile and uses its own backdrop. Visuals follow the existing dark-fantasy theme, without introducing an additional stylesheet or separate item inspector panel.

## Files

- `index.html` — common popup controllers; reuse of `previewItem` and game action handlers; equipped/stash/potion click routing.
- `online/v012-core.css` — scoped popup and potion-trigger styling added next to the existing dialog rules.
- `tests/v0120-equipment-browser.cjs` and `tests/v012-ui4e-browser.cjs` — adapted to modal workflow.
- `tests/v012-item-popup.test.cjs` — new focused markup / event wiring guards added to `npm test`.
- `package.json` — test script only.

## Validation

- All inline app scripts parse as JavaScript.
- Static assertions confirm bulk-selection behavior, Camp empty-slot navigation, unchanged Expedition Bag modal, same Equip/Unequip/Lock/Salvage functions, and potion-selection stock guard.
- **Pending:** full `npm test` and live browser (mobile touch, ESC, actions, all viewport sizes, save/reload) should be checked in GitHub CI; not claimed to have been run in the connector-only workspace.

## Regression notes

Ensure all item actions close the modal before invoking game logic, so rerenders cannot trap a stale popup. Verify the existing ring/dual dagger/two-handed restrictions and the three-potion limit through the actual game handlers.
