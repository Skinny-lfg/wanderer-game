# G2.2E.1A — Frame surface refinement

User review on macOS: modular resizing is visible, but the repeating panel center and some transitions remain visually distracting. Equipped slots should use normal rarity appearance, not permanent gold selection aura.

- All seven modular panel families (including tooltips) use an opaque, quiet background sampled from the original interior average. A 10 px interior feather blends the inner edge/corner pixels; the outer metal corner pixels remain unchanged. This deliberately sacrifices original center grain to avoid a mirrored checkerboard. Edge tiles, source art, buttons/navigation and fixed-aspect assets are unchanged.
- Painted equipment slots now retain their rarity frame, with no permanent gold aura or E overlay. Normal hover and deliberate selection still work as before. Original comparison mode is unchanged.
- Added tall/wide samples for every frame family and tests for uniform interiors, preserved outer corners, tile joins and equipped rarity/hover invariance. Existing CI pass marker retained for compatibility.
- Original PNGs remain intact. Remaining edge-to-corner art seams and suitability of the flatter background need visual approval. No gameplay or main scene changes.
