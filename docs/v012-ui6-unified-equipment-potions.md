# Wanderer v0.12 — UI.6 Potion / Equipment Unification

Branch: `development`. Visual/UX update only; no Firebase deploy, Firestore rules, core combat balancing, account migration or real-save writes.

## User feedback

The mobile Camp and Inventory were not yet compact and potions had two separate presentations: an isolated Potion section inside Inventory and a potion row separate from the portrait's equipment slots.

## Implemented

- **Buy → Stash**: Uses the existing Apothecary purchase and `state.consumables` stock, stored by potion type in stacks of up to 99. Buying already used Stash capacity; no underlying save or quantity logic was rewritten.
- **Stash unification**: `phase6PotionStacksMarkup()` now renders `.invItem.potionStackTile` cards **inside the same `.equipmentInventory .stashGrid`** as ordinary equipment. Removed the separate `phase6PotionStashMarkup()` section from Inventory, and added a **Potions** entry to the existing slot filter. Quantity badges and rarity artwork use the same card treatment.
- **Equip → three slots**: Clicking an available potion stack calls the pre-existing `phase6SelectPotion` handler. Equipped potions occupy the same `.paper` as the ten item equipment slots, on one sixth row of the 3-column grid. The existing remove/consume buttons still use their original actions.
- **No double counting on screen**: Reserved potion doses are subtracted from the displayed Stash stack count while equipped, then return to Stash when removed. The underlying save-model inventory count is deliberately unchanged before Expedition start (existing core lifecycle semantics).
- **Compact composition**: Camp row height reduced to 75 px desktop / 72 px mobile; gear frame 52/48 px, equipment artwork 38/33 px unchanged. Inventory equipment paper now uses a compact 5+1-row grid instead of conflicting 500–560 px portrait/slot offsets. Potion artwork and frame use the same dimensions as item frame.
- **Labels**: Helm/Armor subtitles occupy a reserved text lane under their frame rather than overlapping. The portrait stays centered over the first five gear rows, leaving the potion row clear. All changes are scoped to Camp / Inventory, not Between Realms.
- Old tests that counted every Common rarity Stash card as ordinary equipment were updated to filter by `data-item`. Added focused markup/stock-count integration tests to `npm test`.

## Source files

- `index.html` — unified markup and Stash cards; retain legacy potion shop/save API.
- `online/v012-ui5-camp.css` — sixth row and tighter Camp.
- `online/v012-ui6-unified-inventory.css` — new scoped Inventory grid.
- `tests/v012-ui4e-browser.cjs` — updated expected selector and unified layout assertions.
- `tests/v012-unified-gear-potions.test.cjs` — new integration tests.
- `package.json` — includes focused tests in `npm test`.

## Verified locally in isolated JS evaluation

- Inline `index.html` JavaScript parses successfully.
- Rendered paper contains ten equipment controls and exactly three potion slots when enabled; default paper renders no potion row for other views.
- Stack output for synthetic stock Health=101, Mana=2, Might=1 with two Health and one Mana reserved renders 99 Health, 1 Mana and 1 Might available without changing saved stock values.
- CSS source checks: five rows + potion sixth row; smaller row dimensions; gear/potion frame parity.

## Pending validation

The full repository and installed Chromium/Safari browser engines are not available in the connector-only runtime. `npm test`, Playwright screenshots, purchases, save/reload, and full mobile Safari smoke checks are **not claimed as passed** until the CI and browser runs complete. Confirm 360 / 390 / 768 / 1024 / 1440 px, counts after duplicate potion selection, purchase when Stash is full, Expedition start/exit/death, and buttons beneath the iPhone safe area. CI is allowed to run on `development`; Firebase deploy must remain skipped.
