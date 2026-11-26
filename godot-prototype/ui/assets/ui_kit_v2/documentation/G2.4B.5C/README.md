# G2.4B.5C — Character Attributes

21 provisional owner-approved symbols from the last concept sheet. The four revised designs are Attack Speed (sword with curved motion trails), Mana Regen (drop and ripples), Spell Power (orb-tipped staff), and DoT Power (skull with violet flame). No baked-in frames or labels. Source raster crops were masked and resampled to 256 px RGBA; edges and glow may retain minor background traces. Shared optional frame: `icons/actions/frame_thin.png`. Prefer frameless icons alongside stat labels. Preserve aspect ratio.

Reference: `release/v013-consolidated` commit `3aa617c7854b295afc9fe1d8d51e79c089013b69`, `combat/v012-gear-stats.js` STAT_KEYS; `experiment/godot-foundation` inventory preview. Evasion rating and calculated evasion share the same icon. Gear Power corresponds to `power`; Guard to `blockChance`; DoT Power to `dotPower`. No mechanical changes.

PNG readback: 21/21 RGBA 256x256, nonempty alpha and transparent corners. Visual previews outside Godot at 88/80, 32 and 24 px. Godot integration and runtime testing pending; aesthetic approval provisional.
