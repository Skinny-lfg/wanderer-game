# UI.4f — Seamless minimal frames and Camp alignment

Scope: visual-only update to Wanderer v0.12 on `development`. No save, combat, loot, Firebase, branch main or deployment modifications.

## Assets

Original nine-slice pieces from Drive folder `Wanderer_UI_Kit_9Slice_Seamless_Minimal` are stored under `assets/ui-kit/seamless-minimal/`. The provided `00_full_frame_reference.png` is a transparent-centre 768×576 atlas with 96×96 corner slices. The eight independent originals are retained alongside it.

## Integration

- New `online/v012-ui4f.css` loads after UI.4e.
- Actual CSS `border-image` replaces the old CSS border, including on large windows, panels, gear slots and compact cards. No extra pseudo-element frame on top. Edges use `repeat` and corner dimensions scale equally; the atlas is never stretched to the dimensions of each window.
- UI.4b's old `::before` frame is suppressed on major panels.
- UI.4e square rarity-image frames retain their original width and height; item artwork and other icons use `contain` and are not warped.
- Expedition CTA's centre image repeats rather than stretches; its left/right ends keep their proportions.
- Camp character paper's border and fill are removed. The full-body art scales by 1.26 from its bottom baseline, leaving its feet in place.
- The Camp scene is anchored at a constant intrinsic aspect ratio with a bottom gradient. For stacked/tablet/mobile layouts, the same scene anchors to the character paper to keep the ground aligned when the full Camp panel grows.

## Validation

Static integration verified: the new stylesheet is linked *after* UI.4e, all nine assets are in the same commit, CSS targets current v0.12 class names, and no game state or save logic was modified.

Runtime/browser screenshots and automated UI tests were not executed from this connector-only environment. Recommended smoke checks: desktop 1440px / 1100px, tablet 820px, mobile 390px / 360px; inspect Camp foot-to-floor alignment, long Camp scrolling gradient, all panel/frame corners and keyboard focus, merchant categories, Forge, Shrine, rarity squares, Expedition/Between Realms/combat, and save/reload.
