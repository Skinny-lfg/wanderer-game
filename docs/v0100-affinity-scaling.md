# Wanderer v0.10.0 — Affinity scaling audit

Changes applied on **development only**, not main. No Firebase rules, player saves, or deployment touched.

| Set (2 pieces) | Old | New |
|---|---|---|
| Sunder | −3 DEF per proc | −20% of **initial enemy DEF** per proc, with 25% original DEF floor |
| Shield | +3 Barrier per main attack | +1% **player Max HP** as Barrier per main hit; global 30% Max HP Barrier cap retained |
| Regen | 2+min(8, 0.2% Max HP) HP/s (maximum 10) | 0.75% **player Max HP** healed per combat second, no flat 10 HP/s cap |

Sunder 3-piece Expose (+8% direct damage below 50% initial enemy DEF) is reachable in **three successful proc applications**, regardless of enemy level (subject to rounding). The Expose bonus applies on subsequent hits. Sunder procs still use their original chance; the percentage is **not** a 20% proc chance.

Shield affinity's extra Barrier is now based on attack damage and the 1% Max HP set rate; the non-scaling +2 baseline has been removed. Minor Regen affinity heals have a 1 HP rounding floor rather than an unnecessary 2 HP floor.

**Kept intentionally unchanged:** Critical's +8 *chance points* (not a fixed damage bonus), damage/DoT multipliers for Poison, Bleed, Fire, Dark, Frost, Nature, Storm, Tide and Crystal, proportional healing/damage effects, boss and player Barrier caps, overheal conversion (25% with 1% Max HP/s and 10% Max HP/encounter), 2/3/5 thresholds, 25–90% application chances, cooldowns, stack limits, and minimum 1-point rounding to prevent zero effects.

**Testing:** `tests/v0100-affinity-scaling.cjs` runs Sunder and Shield direct production tests plus a paired A/B combat comparison with 10 seeds each for the three sets at D10/D40/D100/D200, with legitimate equipment affinity pools. Ten seeds is **directional**, not proof of long-term build balance. A persistent D1–D200 progression simulation should precede a public release. Regen's uncapped high-level percentage healing may need adjustment after the comparison.
