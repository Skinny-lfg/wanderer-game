# Wanderer — Combat polish and one-time save reset

Branch: `development`. Implemented following user feedback; no changes to `main`.

## Stable enemy debuff area
- The combat scene reserves identical fixed vertical space below both combatants; enemy debuffs are absolutely positioned within this reserved 72 px region instead of creating a new block beneath the creature when a status arrives.
- If many different effects are present the debuff region scrolls internally rather than resizing the combat scene; this protects desktop and mobile against layout jumps.
- The HUD now skips innerHTML writes when the debuff markup has not changed, avoiding unnecessary repeated DOM changes during combat.

## Desaturated combat background
- The combat scene's existing dark gradient overlay now additionally applies `backdrop-filter: saturate(.38) brightness(.92)` (and its `-webkit-` equivalent). Since it is on a pseudo-element **behind** the fighters, sprites and combat status remain full color.
- Dungeon selection thumbnails and other art remain unchanged.

## Enemy difficulty
- Non-boss enemy HP, ATK, and DEF are now **140% of their previous values (+40%)**, calculated after the earlier normal-enemy modifiers. This affects encounters 1, 2, and encounter 3 when its dungeon level is not a multiple of ten.
- Boss stats on D10, D20, etc. are untouched; their original estimate and multiplier remain.
- Examples: D10 normal baseline HP/ATK/DEF 234/43/8 now ~328/60/11; D10 boss base estimate remains 230/44/7 before existing boss ×2 multiplier.
- Recheck D1 onboarding difficulty and dungeon warnings in gameplay.

## One-time save reset
- Updated `SAVE_RESET_VERSION` to `2026-10-15-combat-balance-reset-2` while keeping the localStorage KEY.
- On the first page load / refresh *after the player loads this version*, a previous save fails the reset-version check, triggers a new starter save and displays the existing reset message. The app writes the new version on startup; later refreshes **do not reset again**.
- This **intentionally clears previous progress**, including dungeon level, stash, equipped items, Gold and Fragments, as requested. Scope is each browser's localStorage, not a centralized server-side wipe.

## Verification performed
- JS syntax passed.
- Deterministic runtime tests compared levels D1, D3, D9, D10, D20, D30, D50, D100 across encounters 1–3: normal enemies 140% of earlier values and boss identical.
- Simulated old save + first refresh + second refresh: one reset only, later progress preserved.
- DOM-mock confirmed unchanged debuffs are not re-rendered repeatedly and new debuffs trigger one content update.
- **Manual visual QA in actual desktop/mobile browser is still needed** for aesthetics, contrast and overflow behavior.
