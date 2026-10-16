# Wanderer v0.9.3 — Legendary identity abilities (development only)

This is an experimental combat extension to the v0.9.3 Buildcraft update, brought forward from the v0.10 ideas so Legendary effects and reworked 2/3/5-piece tiers can be simulated together.

**Safety:** Development branch only. No merge to main, deployment, Firebase rules, player save access, probability-table edits or new identities. The existing 21 Legendary image/name/slot/subtype catalogue is unchanged.

## Catalogue and triggers

The following are deterministic combat abilities, **not additional affinity proc rolls**. Numbers are deliberately conservative starting points; the extensive combat simulation gate is pending.

| Existing Legendary | Slot/subtype | Fixed affinity on **new** drops | Signature | Effect and cooldown |
|---|---|---|---|---|
| Soul Reaver | Two-Handed | Dark | Soul Harvest | Hit foe <50% HP: heal 3% max HP. 10s |
| Runeforged Eclipse | Two-Handed | Crystal | Eclipse Breaker | Strip enemy Barrier equal to 35% ordinary hit. Requires Barrier. 12s |
| The Eternal Oath | Shield | Shield | Oathbound Riposte | Block: retaliate for 18% ordinary main hit. 10s |
| Heart of Shadows | Amulet | Dark | Umbral Refuge | Survive HP damage while at ≤50% HP: heal 4% max HP. 14s |
| Starweaver Relic | Wand | Storm | Starfall | Every third mana-funded cast: +20% ordinary-hit damage. 9s |
| Helm of the Dawnwarden | Helm | Shield | Dawnward | Survive HP hit with no Barrier: gain 5% max HP Barrier. 14s |
| Cuirass of the Last Sunrise | Armor | Regen | Last Sunrise | Survive HP hit ≥12% max HP: gain 6% max HP Barrier. 15s |
| Grasp of the Sunbound | Gloves | Fire | Searing Grip | Critical main hit vs Burning: +16% ordinary-hit damage. 8s |
| Sunstride Sabatons | Boots | Storm | Thunderstep | Every fourth main attack: +14% ordinary-hit damage. 8s |
| Pendant of the First Flame | Amulet | Fire | Kindled Heart | Main attack vs Burning: +16% damage and heal 1% max HP. 10s |
| Signet of the Dawnforged | Ring | Critical | Golden Focus | Critical main attack: gain 2.5% max HP Barrier. 10s |
| Aegis of the Dawnstar | Shield | Shield | Dawnstar Bulwark | Block while below 10% max HP Barrier: gain 7% max HP Barrier. 12s |
| Blade of the First Dawn | Sword | Critical | First Light | Main hit vs foe above 70% HP: +18% ordinary-hit damage. 10s |
| Hammer of the Sunforge | Mace | Sunder | Forgebreaker | Main hit vs reduced enemy Armor: +22% ordinary-hit damage. 10s |
| Sunpiercer Longbow | Bow | Nature | Wildroot Volley | Main hit vs foe below 50% HP: +18% damage and heal 1% max HP. 12s |
| Fang of the Sunbreaker | Daggers | Poison | Toxic Fang | Main hit vs 3+ Poison stacks: +22% damage. 8s |
| Scepter of the Emberstar | Staff | Fire | Emberstar Flare | Mana-funded cast vs Burning: +20% damage. 10s |
| Crescent of the Emberveil | Off-Hand Dagger | Bleed | Crimson Crescent | Main hit vs Bleeding: +14% damage. 7s |
| Orb of the Solar Heart | Orb | Tide | Solar Current | Main hit with active Barrier: +12% damage and gain 1.5% max HP Barrier. 8s |
| Tome of the Eternal Flame | Tome | Fire | Infernal Script | Main hit vs 3+ Burn stacks: +24% damage. 12s |
| Charm of the Dawnstar | Charm | Nature | Dawnstar Bloom | Main hit while below 75% HP: heal 2.5% max HP. 10s |

## Technical rules and compatibility

- Definitions and pure predicates: `combat/legendary.js`. Browser integration: `index.html`. Combat harness loads both modules.
- Only **new** Legendary rolls receive the identity's fixed `effect` (and matching `magic` on magical subtypes); roll rarity, slot/subtype odds, base attributes and Legendary distribution remain unchanged. An identity with a special allowed Legendary-only element does **not** widen ordinary gear's affinity pool.
- Existing save instances retain saved ID, stats, `effect`, `magic`, name, and power fields. A name/ID matching its legal slot/subtype can use the new signature without rewriting save data. Inspection explains an old saved affinity that differs from its identity's new fixed affinity.
- Invalid historic combinations (e.g. legacy name on an incompatible subtype) retain the old generic first-hit bonus; they never silently gain another identity's ability.
- A canonical named Legendary uses its unique signature **instead** of the generic +32% first hit per encounter. No recursive Legendary procs, no additional crit/affinity application roll, no extra main attack. Signature damage contributes to the ordinary hit. Max HP healing remains subject to Tank's healing-reduction debuff, Barrier to the existing 30% cap.
- Cooldowns are keyed by Legendary identity in `setCooldowns`, measured in combat seconds, and persist across encounters within an expedition. Duplicate copies of a single identity share that cooldown. Attack counters continue within the expedition (third cast/fourth attack). Two-Handed weapons reserve Off-Hand, and no Legendary Off-Hand signature fires while the slot is reserved.
- The interface displays ability names, exact activation conditions and cooldowns; logs show actual procs. Missing or malformed historical `legendaryId` requires a matching legal name and subtype before a signature is enabled.

## Validation / simulation gate

Added `tests/legendary-signatures.cjs` to `npm test`, checking catalogue coverage (21), duplicate names, legal drop identities, fixed new-drop affinity, cooldown behavior, Two-Handed blocking, and legacy mismatch safety. These tests are authored but their complete Node test suite and browser smoke need execution in the Codex environment before release.

A static evaluation of the module validated all 21 reachable signature predicates and exact correspondence with the current catalogue. The browser inline JavaScript was syntax-parsed after integration. These checks are **not** a substitute for full automated/unit/browser regression.

**Before main:** run `npm test` and mobile/desktop smoke. Simulate Raw Gear vs 5/5 vs 3/2 builds, with and without Legendary, at D20/D60/D120/D200. Stratify by weapon (including Two-Handed), matchup (Tank/Berserker/Vampire/Caster), favored affinity, and 1×/2×/4× playback. Compare win rate, remaining HP, damage per combat second, signature activation counts, tier 3/5 contribution, and dangerous outlier combos. Balance changes should be evidence-led rather than broad power buffs.
