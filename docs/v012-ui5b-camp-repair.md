# UI.5b — Camp layout correction

Target: development only. No changes to player save format, gameplay, Firebase deployment or main.

## Layout

- Desktop: CSS grid places character attributes and combat stats in the left column, then Your Journey below. Character gear/vitals/potions stay center, Expedition right.
- Tablet: stats and Journey stay in the left column, and Expedition moves below.
- Mobile: introduction, character gear/vitals/potions, stats, Expedition, Journey. The existing bottom fixed Start Expedition button and original Expedition button are preserved.
- Gear slots: artwork stays the same; compact 405px desktop and 385px mobile portrait stages with closer paired columns, five rows, and independent space for labels.
- Restored scenery behind the portrait on responsive stacked viewports, fixing the transparent/background reset introduced by UI.5.

## Health / Mana

- Removes border image around the combined resource panel, plus the stretched decorative HUD overlay.
- Compact 18px high progress tracks use clipped red HP and blue Mana fills; percentage width and numeric labels still come from existing game state.

## Validation

- Inline JavaScript syntax and isolated Camp HTML generation checked.
- CSS selectors, view order, two Start Expedition action bindings, and unchanged potion/gear renderers checked statically.
- Live browser screenshots, touch interaction and native iOS Safari tests remain pending.
