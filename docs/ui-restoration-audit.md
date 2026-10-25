# UI Restoration & Code Architecture Audit

Branch: `development`
Baseline: `53f5a22`

## Findings before implementation

1. The UI.9 assets are gone, but the visual layer still depends on the older decorative pack in `online/v012-ui4.css`: nine-slice panel corners, rarity and tooltip frames, comparison badges, title dividers, and the Expedition end caps/center tile. This makes the visual system inconsistent with the recent move toward HTML/CSS controls and leaves removed design dependencies in shared styles.
2. Visual rules are spread across `style.css`, `v012-phase1.css`, `ux39.css`, `v012-core.css`, `v012-ui4.css`, `v012-ui4c.css`, `v012-ui4e.css`, `v012-ui4f.css`, `v012-ui5-camp.css`, and `v012-ui6-unified-inventory.css`. The same buttons, cards, frames, resource bars, and Camp layout receive later overrides; several use `!important` to win precedence.
3. The Gothic CSS controls exist but have limited state coverage and inherit older blue-gray foundations. Selected, disabled, focus, and nested action buttons are not consistently expressed through shared tokens.
4. The Health/Mana bars have CSS fills linked to `--resource-pct`; the decorative frame layer is still coupled to UI.4 overrides, while the base combat bars use a separate older style path. Both paths need one CSS treatment without changing runtime values.
5. Rarity frames and item badges are styled in more than one layer. The existing square item frame wrapper is reusable; keep it and replace only its artwork dependency with rarity-colored CSS borders/glows. Preserve item images and metadata.
6. Camp, City Center, Shrine, Between Realms, Combat, Extraction, Inventory, and account/leaderboard use distinct structures already. No new UI framework or gameplay component is needed; consolidate shared tokens and styles while keeping their current markup and behavior.
7. An initial isolated Chromium attempt was blocked by sandbox `EPERM`; rerunning with loopback permission made real browser validation available.

## Corrections planned

- Consolidate Gothic palette, typography, spacing, surfaces, controls, focus/disabled/selected states, resource bars, and rarity frames in the current shared UI stylesheet.
- Remove old decorative UI image references from runtime CSS. Retain only the existing Start Expedition artwork previously approved; convert its center to a bounded CSS fill so it cannot repeat outside its end caps.
- Remove redundant UI.4 ornament blocks and conflicting component-specific overrides only after checking their selectors and consumers.
- Preserve game art, equipment/potion/rune interactions, gameplay state, saves, and page markup semantics.
- Validate automated tests and isolated browser views at 375, 430, 768, 1440, and 1920px; capture representative screens before/after when the browser is available.

## Audit outcome

Implemented and validated in `docs/ui-restoration-report.md`. Runtime edits stay in the shared UI styles and HTML font loading; the existing game art and Expedition button end caps remain intact. All requested Chromium viewport checks and the unit/browser regression suites passed. Safari was unavailable and remains pending. No gameplay, balance, economy, save format, Firebase, or deployment changes were made.
