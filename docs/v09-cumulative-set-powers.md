# Wanderer v0.9 — Cumulative Affinity Set Powers (development)

Two/three/five-piece thresholds are cumulative. Four pieces behave like three. Five pieces retain tier two and three powers and enable an automatic tier five effect.

| Effect | 2 pieces | 3 pieces | 5 pieces |
|---|---|---|---|
| Poison | DoT +15% | 1% less direct enemy damage per stack, maximum 6% | Venom Burst consumes 6 stacks, 60% remaining DoT up to one base hit B, cooldown 10s |
| Bleed | DoT +15% | +5% attack speed/charge on main hit vs bleeding, three 3s stacks, once/s | Blood Hunt +40% B under enemy 30% HP, cooldown 12s |
| Sunder | +2 Armor reduction/proc | +8% direct damage if target ≤50% original Armor | Armor Shatter removes Barrier up to B and delays next attack 0.5s (boss 0.2s), cooldown 12s |
| Critical | +8 raw critical points (speed penalty and 65% cap apply) | Main critical grants Focus up to 3, one/s, expires 6s | 3 Focus spent for ×1.75 crit, 10s cooldown |
| Shield | +3 Barrier per attack, capped at 30% max HP | After Block counter +25% blocked damage capped 25% B, 3s cooldown | Last Bastion converts half remaining Barrier into damage, capped 50% B, cooldown 12s |
| Regen | +2 HP/s | 25% overheal converts into Barrier, cap 1% max HP/s and 10% per encounter | Second Wind avoids one lethal blow, leaves 1 HP and +8% HP Barrier, **once per expedition** |
| Fire | Burn DoT +15% | One Heat per second ticking Burn, max 5, 5s expiry | Flashover spends five Heat for 50% B on next hit, cooldown 10s |
| Frost | Slow increases enemy attack interval 25% | While Chilled, enemy direct damage −8% | After 3 seconds uninterrupted Chill, 0.75s attack delay (boss 0.25s), cooldown 12s |
| Dark | Drain healing +15% | On successful healing, gain up to three Soul Charges, one/s, expire 6s | Soul Pact at >40% HP spends three Charges and 3% HP for +40% B, heals 25% actual bonus damage up to 4% max HP, cooldown 12s |

**Combat invariants:** Critical capped at 65%; Barrier at 30% max HP; enemy Armor never below 25% original; Poison/Frost combined ≤15% enemy damage reduction; stagger immunity four combat seconds and no chained delays; DoTs 3s, max 12 stacks; temporary stacks reset between waves but cooldowns persist through a full expedition; Second Wind never refreshes until a new expedition. Proc damage does not generate new procs, crit, elemental stacks, or Focus. The attack timer increments by 0.11 combat seconds per update independently of the 1×/2×/4× display speed. No save-reset change.

`npm test` includes `tests/cumulative-set-combat.cjs` for key limits and tier progression. Browser combat playtests remain necessary.
