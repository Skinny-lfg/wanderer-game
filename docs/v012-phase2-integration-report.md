# Wanderer v0.12 — Fase 2: Affinities e Buildcraft

Date: 2026-10-19
Branch: `development` (isolated opt-in `?expeditionPhase1=1`)
Scope: **Phase 2 only**. No main merge, Firebase deploy/rules, persistent-save import or cloud migration.

## Architecture

The classic `index.html` remains authoritative for `totalStats`, `weaponAttack`, `updateFight`, `applyAffinity`, `tickDots`, Legendary definitions/cooldowns, weapon animation/VFX, equip/Two-Handed rules and enemies. `combat/v012-buildcraft.js` is a pure nonpersistent overlay. Hooks run only on the isolated Expedition flag. `online/v012-engine.mjs` remains a separate prototype reference and does **not** replace the original combat engine.

## Implemented

- **Blood**: baseline Bleed application, capped DoT, Deep Cuts, Execute (health threshold/cooldown), sustain, crit haste.
- **Decay**: separate Poison and capped **Rot** (max 6, four ticks), burst, reduced enemy outgoing damage, and bounded enemy-healing reduction on healing enemies; not identified as Blood.
- **Vitality**: HP bonus, steady HP recovery, emergency survival, kill/end-of-Wave healing, Life Bloom.
- **Aegis**: Defense, damage reduction, Block without mandatory Shield, timed capped Barrier, separate Block/Barrier retaliations.
- **Fury**: attack speed, Crit chance, critical damage, non-recursive extra hits, temporary haste.
- **Magic**: **first acquisition requires Fire, Frost or Lightning selection**; choice is locked for one Expedition. Fire applies original Burn, Frost applies original Chill, Lightning applies at most four Shock charges to the current enemy and discharges into a bounded single-target burst. No chains requiring other enemies. Original Storm/Lightning visual effects are reused. All weapons may consume Mana for a scheduled elemental attack; the original funded Staff/Wand casts remain authoritative, and they amplify status output (Staff 1.25×, Wand 1.12×) without importing prototype attack code. Temporary Efficient Casting reduces funded cast cost. All-weapon Magic has a new dedicated Mana pool and regen.
- **Buildcraft**: 48 implemented temporary passive identities, including **15 hybrids**, with three offered choices before every combat Plane. Base passive ranks capped at two; conditional/hybrid passives at one. Max three distinct families; after two distinct acquisitions any eligible family may recur.
- **Survival and stack caps**: temporary ranks, HP, mana, Barrier, Block, Crit, attack speed, Rot and Shock bounded; cooldowns are combat-time based. Last Stand one use per Expedition. No extra-hit/status recursive re-entry.
- **Lifecycle**: temporary passives are never added to item/set stats or save payloads, and clear on defeat, Expedition completion and next Expedition start. Permanent item/Legendary systems remain unmodified in default mode.
- **UI**: dark-fantasy mobile/desktop temporary passive draft, three Magic choices, visible live Rot/Shock counters, affinity badges, and build summary. End-of-Plane rendering uses stable run metadata rather than reading a cleared controller selection.

## Changed files

- `combat/v012-buildcraft.js` — pure temporary-passive catalog/logic.
- `index.html` — isolated classic attack, defense, DoT, cast, enemy-healing and between-Plane hooks; draft UI and transition fix.
- `online/v012-phase1.css` — responsive draft/readout styles.
- `tests/v012-buildcraft.test.cjs` — 48-passive actionability, elements, combos, bounded status, independent counter and magic-amplification assertions.
- `tests/v012-classic-combat.cjs` — actual original combat for seven weapon subtypes × eight family/element cases (56 scenarios) and Legendary Sword.
- `tests/v012-expedition-browser.cjs` — browser passive/element selection and Plane transition regression.
- `package.json` — gate new tests in `npm test` and `test:v012:integration`.

## Validation and release gates

- **Main smoke regression:** passing at `e1b4d14d` (GitHub Actions run `39290274960`), including new passive tests, real classic combat matrix and legacy suite.
- **Full [audit] browser/stress suite:** triggered by this report commit; record the final result below after completion. Until then this implementation is a **development-only feature**, not a release candidate.
- **Not validated yet:** long-run 15-Plane real combat balance and 48-passive meta convergence under randomized player gear; live account persistence and recovery are out of scope and disabled.

## Known limitations / balancing follow-ups

- Temporary progression is RAM only, by deliberate safety design. Never carry legacy D1–D200 into Expedition numbers automatically.
- Current effect coefficients are provisional; PvE balance requires longer trials against rotating Elite/Boss roles and gear/Legendary loadouts. Particularly monitor compound sustain (Vitality+Aegis), high-speed Fury, and Bleed+Rot hybrids.
- Only three draft offers are shown each Plane. Hybrid visibility depends on owning both families and on RNG. Their descriptions correspond to implemented hooks.
- Poison/Rot DOT and Shock counters are per-enemy, so they do not spill into the next Wave. Passive choices/cooldowns last across the Expedition.
- Phase 3 is still required for between-Plane equipment swaps, consumables, event resolution and versioned persistence, with unchanged no-Camp/no-combat potion rules.
- The legacy attack engine retains its original equipment affinity effects; temporary passives are additive (separate source) and may need a later approved gear-set overlap balance pass.

## Safety and next gate

Do not modify `main`, deploy Firebase, change security rules, or write/migrate saves as part of Phase 2. Keep opt-in preview on `development`. Phase 3 must be gated on browser integration, save/conflict isolation and survival/playtesting checks.
