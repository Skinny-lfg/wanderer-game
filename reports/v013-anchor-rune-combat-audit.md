# Anchor Runes: combat-consumer audit
Static review of production files and matched native combat fixtures in tests/v013-anchor-rune-combat.test.cjs. This report describes wiring, not balance or an already-passing test run.

| Family | Stat | Production consumer |
|---|---|---|
| Might | STR | gear stats: 1.8 STR contribution to Attack; weaponAttack physical damage |
| Swiftness | AGI | Attack contribution; attackSpeed; native attack clock |
| Wisdom | INT | Mana, Mana Regen, Spell Power, caster attack speed; funded casts |
| Fortitude | END | Max HP, Defense, shield Guard |
| Fortune | CHA | crit rating; dungeon wave loot quality |
| Force | flat Attack | physical weaponAttack |
| Warding | flat Defense | incoming armor mitigation |
| Vitality | flat HP | expedition entry Max HP |
| Execution | Critical Chance | weaponAttack and spellCriticalDamage rolls |
| Devastation | Critical Damage | critical physical and spell damage multipliers |
| Haste | Attack Speed | advancePlayerAttackClock |
| Assault | Attack Power | physical weaponAttack, Attack-scaled talents |
| Archmage | Spell Power | funded weapon casts, SP-scaled talents and Barrier |
| Abyss | Max Mana | expedition entry mana pool |
| Clarity | Mana Regen | combat tick mana restoration |
| Efficiency | Mana Cost Reduction | v013FundedCost / talentManaCost, phase2Context.spendMana |
| Corruption | DoT Damage | ordinary and accelerated Bleed, Burn, Rot damage callback |
| Bastion | Barrier Power | setBarrier shared pool including Orb and Rotguard |
| Renewal | Healing Power | setHeal and overheal conversion; excludes reserve release |
| Phantom | Evasion Rating | tryDodge physical attack roll |
| Bulwark | Defense % | incoming armor mitigation |
| Heart | Max HP % | entry HP and HP-scaled effects |
| Guard | Guard Chance | native incoming block roll, requires shield or enabled Guard |

Sources: combat/v012-gear-stats.js, combat/v012-combat-runtime.js, combat/v012-buildcraft.js, online/v012-expedition-runtime.js. Existing global caps retained: crit 100%, guard 65%, attack speed 4.2/s, mana cost reduction 25%. The paired fixtures check consumers, not just Camp stat displays; HP/Mana capacity is checked at native combat entry. No balance changes.
