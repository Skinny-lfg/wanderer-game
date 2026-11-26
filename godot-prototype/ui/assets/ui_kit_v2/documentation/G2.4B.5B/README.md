# G2.4B.5B — Navigation & City Services

Ten owner-approved symbols extracted from the matching original concept sheet at 1774 × 887, using foreground masks and resampled onto 256 × 256 RGBA transparent canvases. No baked-in frames, labels or backgrounds. Talent icon is the closed book from the owner-approved sheet. All designs are preserved from the approved sheet rather than redrawn.

Reuse `icons/actions/frame_thin.png` as the shared frame and a separate existing surface where desired. Navigation tabs can use the isolated icons without a frame. Keep aspect ratio; do not nine-slice symbols. Use the same frame for all ten. No new frame is added.

Navigation: camp, inventory, talents, city_center, shrine, expedition, codex. City services: blacksmith, merchant, apothecary. These correspond to the Godot prototype's existing destinations/services; city services are presentation-only. No new gameplay or scene changes.

Validated PNG dimensions, RGBA alpha, transparent corners, nonempty foreground, and visually inspected previews at 96, 48, 32 and 24 px on dark/light backgrounds outside Godot. Raster extraction can retain minor edge color from the painted background; source art is not native 256 px. Runtime validation and integration remain pending.
