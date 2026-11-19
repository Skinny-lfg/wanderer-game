# Local cleanup changelog

## Stage 1
- index.html uses the catalog rarity in potion inspection, reports the current displayed version to feedback and renders reward art independently of current ownership.
- online/v012-expedition-runtime.js records subtype, armor type and legendary identity with reward snapshots. online/v013-boss-abilities.js describes existing Guardian and Convergence behavior.
- Targeted test: node --test tests/v012-unified-gear-potions.test.cjs (6 passed). No combat coefficients changed.
