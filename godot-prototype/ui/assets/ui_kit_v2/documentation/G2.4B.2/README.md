# Wanderer — G2.4B.2 Slots & Frames

Production candidates, composed programmatically from the actual validated G2.4B.1 textures, with engraved bevel geometry and anti-aliased transparent masks. Not extracted from mockups. No baked text. No changes to game code or existing assets.

## Layout
- `assets/slots/`: 7 bag frames + 7 equipment frames (neutral and six rarities), two separate slot fills, two interaction overlays. Composite in order: fill, icon, rarity frame, state overlay. Bag frame is deliberately thin; equipped frames carry corner facets.
- `assets/tooltip/`: 7 transparent 256×256 frames. Separate background tiles in `assets/surfaces/`. Optional crest is independent in `assets/ornaments/`, never required.
- `manifest.json`: dimensions, sha256, role, colors, recommended usage, nine-slice margins.
- `validation/preview.png`: actual generated PNG compositing at intended sizes. Screenshot crops are only used to illustrate scale, not distributed as production item icons.
- `validation/checks.csv`: offline checks.

## Godot integration (pending)
For bag/equipment: use TextureRect or layered Controls, aspect-preserving scaling, keep icon within the frame, mouse_filter IGNORE for decorative overlays. Select frame from existing item rarity. The colors in this pack are candidates from guide v1.2; match the actual runtime palette before integration (do not change game rarity rules).
For tooltip: use NinePatchRect with source texture patch_margin_left/top/right/bottom = 48, draw_center = false. At 1:1 scale this is a 48px margin; to obtain ~12px display margin, use a 0.25 scale on the NinePatchRect and size the logical rect 4x the target dimensions, or use equivalent 64px pre-scaled variants in the integration pipeline. Actual logical margins depend on Godot project stretch settings. Keep the background in a separate tiled TextureRect or a style surface, inset ~4 px (adjust after testing); avoid transparent corners showing unwanted fill. Keep tooltip content padding independent. Optional crest is a separate overlay, never part of stretch zones.

Offline validation checks PNGs, alpha, edge invariance and simulated nine-slice corner preservation at 96×96, 220×140, 350×150, 460×320 and 560×480. This is not a Godot runtime test; verify at 1280×720 and 1920×1080 before adoption. No new game mechanics, no GitHub push.
