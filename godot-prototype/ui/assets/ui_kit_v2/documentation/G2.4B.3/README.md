# G2.4B.3 — Buttons & Navigation v2

Approved visual direction: thinner Primary frame, small central sculpted bronze crests. Reconstructed from the earlier textured state surfaces; no text baked in. 18 original component paths retained, with four Primary state bases replaced; 14 other PNGs byte-identical. Eight additional RGBA crest overlays (32×12) for top/bottom across four states. 26 PNGs total.

## Godot
Use existing StyleBoxTexture margins in manifest (24 horizontal, 12 vertical for buttons); same navigation, secondary, danger and focus assets. Place two fixed-size TextureRects over each Primary (center top/bottom, mouse_filter IGNORE), using the appropriate state, not stretched. Hide ornaments for widths below 200 px (proposed threshold). Keep text/padding dynamic. Do not change layouts/mechanics.

## Validation
26/26 decoded with expected size, RGBA and alpha range. 108 PIL 9-slice corner preservation tests (18 × 6 sizes); overlays excluded because they are fixed-size. 14 untouched PNGs verified byte-for-byte. Preview uses actual exported assets. No Godot run, repository upload or visual runtime validation performed.
