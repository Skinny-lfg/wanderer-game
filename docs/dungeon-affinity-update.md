# Dungeon affinity update — development only

## Scope

The game still has **13 environment themes** and **D1–D200**. The previous pool had 9 unique affinities and four repeated assignments. Exactly **three** duplicate assignments are replaced, so the new pool has **12 unique affinities**; Obsidian Quarry deliberately remains Sunder (as does Iron Bastion). The visuals, monsters and favored-equipment categories of these locations do not change.

| Dungeon | Former affinity | New affinity | Identity |
| --- | --- | --- | --- |
| Serpent Grove | Poison | 🌿 Nature (`nature`) | Sustained healing |
| Stormglass Spire | Critical | ⚡ Storm (`shock`) | Periodic burst damage |
| Drowned Vault | Dark | 🌊 Tide (`tide`) | Barrier and mitigation |

All 12 affinities have cumulative **2, 3 and 5 point** bonuses:

| New set | 2 points | 3 points | 5 points |
| --- | --- | --- | --- |
| Nature | Nature proc healing +25% (base proc heals 8% of triggering hit) | Nature healing +50% below 50% HP | Verdant Renewal: once per encounter, after surviving a hit at ≤35% HP, heal 8% max HP |
| Storm | Storm proc damage +25% (base proc deals 8% of triggering hit) | Every third main-hand attack gains +15% base damage | Thunderclap: every sixth main-hand attack gains an additional +35% base damage, 10s cooldown |
| Tide | Tide proc Barrier +25% (base proc generates 7% of triggering hit) | While Barrier remains, enemy direct damage −5%, subject to existing combined 15% reduction cap | High Tide: once per encounter after surviving a hit with Barrier below 5% max HP, restore 8% max HP Barrier |

A 2-handed main weapon still counts as 2 set points. Proc frequency uses the existing item-effect and equipment rules; no new buttons or mandatory counter-equipment. All new item effects are obtainable from legal subtype pools, including compatible magic items. Existing gear effects and old saves are not rewritten; no loot rarity probabilities or drop tables are modified.

## Dungeon selection and Fragments

- **Enter → Leave Dungeon before Wave 1:** the same three offer IDs and currently selected dungeon are preserved, reroll count unchanged, **0 Fragments spent**.
- **Pay Reroll:** button still charges its indicated Fragment cost, replaces all three offer IDs and increments the per-level cost progression.
- **Fight at least one wave → Extract / Clear:** the played level gets a fresh set of offers, preserving the existing farming behavior. Dungeons on other levels remain unchanged.
- **Death during combat:** the existing rotation and death-loss behavior remain unchanged.

## Verification

- The production browser-script assertions for cumulative bonuses and the dungeon UI pass in a JavaScript VM-equivalent harness, including leaving without combat and returning to the same choices.
- A targeted browser-script check also passed: paid reroll charges exactly the shown cost; extracting after combat rotates offers; pre-wave return preserves selected path and resources.
- PvP stat module regenerated using the repository's existing build algorithm to match index.html.
- No production deployment or merge into `main`.

**Further validation recommended before release:** full GitHub Actions test matrix, save restore with the three new magical affinities, and live playtesting of the new set strengths. The earlier v0.9.1 balance simulations do not quantify these new effects; re-run them before releasing.
