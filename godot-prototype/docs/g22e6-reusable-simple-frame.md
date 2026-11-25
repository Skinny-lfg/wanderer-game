# G2.2E.6 — Reusable simple frame

The approved G2.2E.5 simple tooltip geometry is extracted into `ui/theme/simple_frame.gd`. It is a dedicated procedural 40×40 RGBA atlas, not a newly painted PNG. Four 16×16 fixed corner tiles, four 8×16 or 16×8 repeating edge tiles, and one 8×8 repeating center. Thin chamfered border, uniform interior, no shadow. Color, padding and optional top crest clearance are independent of the painted pack. Minimum supported frame extent is 32×32 logical pixels (content can require more).

Use `SimpleFrame.make_style(surface, border, inner_line, padding, top_inset)` and `SimpleFrame.apply_to(panel, style)`. A style can be reused across panels; use `style_from_atlas` to vary padding while reusing a texture. The tooltip pack caches rarity-specific atlases using the same generator, preserving its approved pixel geometry and colors. The crest remains a separate sprite.

F6 → Panels: six new samples at the top (compact, wide, tall, neutral, selected, disabled). Existing painted panel samples and tooltip comparisons remain. No changes to gameplay or production screens. Smoke test checks tile mode, all joins, palette and padding customization, and gallery samples.
