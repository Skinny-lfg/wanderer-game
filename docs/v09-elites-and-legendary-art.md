# Wanderer v0.9 — Four Wave 4 elites and new Legendary icons

Every expedition rolls and retains a single elite archetype in its run state. After Wave 3, the upcoming Wave 4 panel reveals the archetype before the player chooses Extract or Continue. All dungeon tiers use Wave 4 as the miniboss; D10/D20/... retain their separate boss in Wave 5.

| Archetype | HP | ATK | DEF | Attack interval | Special mechanic |
|---|---:|---:|---:|---:|---|
| 🛡 Tank | 175% | 65% | 122% | 1.93 s | Sustained fight with increased health |
| ⚔ Berserker | 72% | 153% | 86% | 1.23 s | High pressure; +16% damage under half health |
| 🩸 Vampire | 110% | 102% | 100% | 1.56 s | Heals 38% of actual player HP damage, capped at 6% enemy max HP per attack, zero healing on Barrier absorption |
| 🔮 Caster | 91% | 93% | 90% | 1.64 s | Applies Weakened when it damages player HP: −20% direct damage for 3 combat seconds, 7 s application cooldown; visible above player portrait |

All buffs use combat time (consistent with existing 1×/2×/4× timers). Player hex resets per encounter. Run-level elite roll requires no save schema migration. D10 boss reward logic, loot tables and rune systems are unchanged.

**Legendary art:** Five original transparent 256×256 PNGs from Google Drive `Packs/Wanderer_Legendary_Icons` are stored in `assets/legendary`, mapped to existing unique names (Soul Reaver, Runeforged Eclipse, The Eternal Oath, Heart of Shadows, Starweaver Relic). Existing legendary items with these names use the correct icon; new non-weapon legendary drops keep normal armor/ring art. Other equipment art is unchanged.

New regression suite: `tests/elite-archetypes-art.cjs` in `npm test`.
