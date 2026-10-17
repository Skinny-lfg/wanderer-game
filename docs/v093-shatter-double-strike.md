# Wanderer v0.9.3 — Shatter and Double Strike gameplay integration

**Scope:** `development` only. Two skill integrations, combat tooltip text, and isolated regression/A/B tests. No additional features or balance changes, no `main` release, Firebase rule changes, cloud writes, or save reset.

## Production behavior

- **Frost / Shatter:** On a damaging mana-funded Frost cast against a living already-Chilled enemy, increment a per-wave hit counter. Every third qualified cast, if the expedition-wide 6 combat-second cooldown is ready, deliver one direct hit equal to 30% Spell Power. Damage goes through enemy Barrier and the existing direct-damage/log pipeline. This does not reapply Chill, extend delay, apply affinities or trigger Legendary abilities. The counter resets each new enemy/wave; cooldowns persist across the expedition. Existing Deep Freeze/Winterheart remain unchanged.
- **Main-hand Daggers / Double Strike:** After the existing main hit and normal Off-Hand resolution, one independent 25% chance of another direct hit, only if the enemy survives and the main hit dealt damage. The strike has 55% of the pre-critical base hit (rounded), passes through Barrier, and has no critical roll, affinity application, Off-Hand strike, Legendary trigger, or recursion. The ordinary automatic Off-Hand Dagger is preserved.
- The two skill descriptions appear in the existing expandable application-chance guidance and combat log on trigger. No UI or save schema migration.

## Tests

`node tests/v093-shatter-double-strike.cjs` runs real browser combat functions inside the isolated VM, separately toggles only the new skills off for paired A/B checks, tests D40 and D100 equipped samples, triggers/caps, one unrelated Two-Handed control, and deterministic 1×/4× outcomes. It is added to `npm test`. This is a focused mechanical integration check, not a human-player or full D1–D200 progression study.

The historic `v010-new-abilities-*.json` are pre-implementation research, **not** post-implementation validation. The old experimental `v010-abilities-sim.cjs` shatter/double string transforms must not be applied again to the updated production source: doing so would double-count the mechanics. Future full progression comparisons should toggle production implementation off in the VM, rather than inject prototype abilities over live code.

## Release gate

Run full `npm test`, targeted browser/mobile gameplay, Legendary Winterheart/Fang/Crescent interactions, high-APS Dagger cases, and broad D1–D200 stateful progression before any main publication. If other balance adjustments become desirable, review proposals with the user instead of silently implementing them.
