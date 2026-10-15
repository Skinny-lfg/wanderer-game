# GDD addendum — v0.9 Phase 1 affinity tiers

Approved Phase 1 design, implemented on development. This addendum complements the existing GDD source; it does not replace the source document or claim to update Google Drive.

| Affinity | 2 pieces | 3 pieces | 5 pieces |
| --- | --- | --- | --- |
| Poison | +15% Poison damage. | Poison stacks reduce enemy direct damage by 1% each (max 6%); ends with the stacks. | Venom Burst: at 6 stacks, consume all stacks for 60% of remaining Poison damage, capped at one normal hit. 10s cooldown. |
| Bleed | +15% Bleed damage. | Main hits against Bleeding targets grant +5% speed for 3s, up to 3 stacks; one stack per second. | Blood Hunt: against a Bleeding enemy at or below 30% HP, the next main hit deals +40% of a normal hit. 12s cooldown. |
| Sunder | +2 Armor reduction per Sunder application; enemy Armor cannot fall below 25% of its original value. | Enemies at or below half their original Armor take +8% direct damage. | Armor Shatter: a main hit against a vulnerable enemy removes Barrier up to one normal hit and delays its attack by 0.5s (boss: 0.2s). 12s cooldown; shared 4s delay immunity. |
| Critical | +8 points to the Critical formula, before its speed adjustment; final chance remains capped at 65%. | Main-hit Criticals grant Focus, max 3; one charge per second. Focus expires after 6s without a gain. | Perfect Strike: consume 3 Focus for a guaranteed 1.75× critical main hit. 10s cooldown; this strike grants no Focus. |
| Shield | +3 Barrier generation; also grants 3 Barrier per main attack. Total Barrier is capped at 30% max HP. | A Block primes a counter for 4s: 25% of blocked damage, capped at 25% of a normal hit. Does not stack; 3s cooldown. | Last Bastion: after receiving an attack with at least 10% max HP in Barrier remaining, prime a counter for 4s. The next main hit spends half the remaining Barrier for damage, capped at 50% of a normal hit. 12s cooldown. |
| Regen | Recover 2 HP per second during combat. | 25% of overhealing becomes Barrier; max 1% max HP per second and 10% per encounter. Total Barrier remains capped at 30%. | Second Wind: survive one lethal hit at 1 HP and gain 8% max HP as Barrier. Once per expedition, not per encounter; no invulnerability. |
| Fire | +15% Burn damage. | A damaging Burn tick grants 1 Heat per second regardless of stacks, max 5. Heat expires after 5s without a damaging Burn tick. | Flashover: consume 5 Heat on the next main hit for +50% of a normal hit. 10s cooldown; the explosion cannot create Burn or Heat. |
| Frost | Slow increases the enemy attack interval by 25%; each application lasts 2.9s. | Chilled enemies deal 8% less direct damage. Combined set damage reduction is capped at 15%. | Deep Freeze: after 3s of continuous Chill, delay the next attack by 0.75s (boss: 0.25s). 12s cooldown; shared 4s delay immunity. |
| Dark | +15% life recovered by Drain. | Drain that restores HP grants a Soul Charge, max 3; one charge per second. Charges expire after 6s without a gain. | Soul Pact: with 3 charges and more than 40% HP, the next main hit spends 3% max HP to deal +40% of a normal hit. Recover 25% of its actual damage, capped at 4% max HP. 12s cooldown; cannot generate charges. |

## Shared rules

- Thresholds accumulate: five pieces keep the two- and three-piece effects. Extra pieces do not increase a tier's values. Existing per-item Critical contributions remain part of the original stat formula.
- A normal hit means the main weapon's ordinary physical or spell damage before Critical and the existing Legendary multiplier. Physical damage uses current enemy Defense; spells retain the existing magic formula.
- Signature/counter damage cannot crit, roll affinities, create additional attacks or generate Focus/Heat/Soul Charges. The triggering ordinary attack retains its usual single on-hit affinity roll. Soul Pact healing may use the bounded overheal-to-Barrier rule, but never generates Soul Charges.
- Direct-damage vulnerability is applied once. Enemy Barrier absorbs direct hits and additional damage; DOT retains its existing behavior. Combined Poison/Frost weakening is capped at 15%.
- Delay effects share four combat seconds of immunity after a successful delay. They delay the next basic attack rather than permanently disabling a boss.
- Temporary Focus, Heat, Souls, speed stacks, counters, continuous Chill tracking and overheal budgets reset between encounters. Cooldown remaining time and the once-per-expedition Second Wind flag persist. Existing HP, mana and Barrier carryover is preserved.
- Cooldowns and expiry use simulation time, which pauses between encounters and advances equally at 1×/2×/4×. Heat and overheal generation use combat-second buckets; Focus, Soul and Bleed gains use a minimum one-second interval.
- All signatures are automatic in Phase 1. No new active skill button is introduced.
- Definitions and mechanics live in combat/affinities.js. Review evidence and limitations: [Phase 1 report](../v09-phase1.md).
