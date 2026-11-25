# G2.2D.4 — Asset normalization and safe areas

Non-destructive load-time processing of the existing approved PNGs. No source art is overwritten; the browser game, gameplay and production screens are unchanged.

- Buttons: leave existing alignment intact.
- Panels: add 3 px transparent guard around tooltip; shift nine-slice/content margins accordingly.
- Navigation: add consistent 3 px source guard to all five tab states before logical resize; fit visible icon alpha bounds into a centered 26 px area on 30 px canvas.
- Slots: estimate body extent from median alpha cross-sections away from central ornament axes; fit uniformly toward a 224 px body on 256 px canvas, constrained by the whole visible silhouette with at least 4 px guard. Ornament proportions preserved. The body target is not an assertion of identical shape.
- Equipment: use original alpha bounds, preserve aspect ratio, center visible art inside an authored common 66% safe square (approx. 32/42/53 px at 48/64/80 px). Same geometry on selected/equipped states. The opaque interior cannot be automatically distinguished from the border using alpha alone; final safe area requires visual review.
- Original edge-touching art (including gloves, tooltip and tabs) cannot be reconstructed by padding. This change does not claim to restore missing detail. Recut from source or regenerate if visual inspection confirms actual clipping.
- Smoke tests check loaded slot guards, item containment/aspect, state stability, tooltip guard and icon size. Visual approval remains required.
