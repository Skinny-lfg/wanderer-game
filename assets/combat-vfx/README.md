# Wanderer combat VFX — 18 October 2026

29 transparent 512×512 RGBA PNG assets from the Wanderer art pack on Google Drive. Single-frame effects animated with CSS, not sprite sheets.

- 6 physical/defensive effects: Sword, Mace, Daggers, Two-Handed, Bow and Block.
- 7 Staff projectiles and 7 Wand projectiles, selected by the **weapon's saved affinity** (`burn`, `slow`, `poison`, `drain`, `nature`, `shock`, `tide`). The existing generic Staff/Wand PNGs remain as compatibility fallbacks.
- 2 normal-enemy effects, 4 Elite effects and 3 Boss effects. Abyssal blue Barrier plays when restored; Rift red life-drain on successful healing; Ember amber Enrage on first activation. Tank/Berserker hits have distinct VFX; Caster/Vampire abilities use their VFX only when activated.
- In `index.html`, `combatVfxAsset` and `combatEffect` select the art. Enemy projectiles travel right-to-left; reduced-motion CSS and effect cap preserved.

No gameplay, balance, save schema, Firebase configuration or hosting changes. `pack-manifest.json` is the historical 2026-10-15 source manifest, **not** this pack's inventory.

Run `node tests/vfx-affinity-enemy-smoke.cjs` to validate all 29 images and visual routing, and `npm test` for the complete suite.
