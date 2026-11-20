# Wanderer v0.13 — Hexblade physical/magic equipment expansion

**Scope:** simulation-agent equipment decisions only on `audit/v013-stage6`. No balance change, no game combat code change, no production merge or deploy.

## Valid actual equipment combinations

- Sword + off-hand Daggers: native equipment allows this. Offensive item stats from the dagger contribute at **50%**. **A Sword main-hand does not activate a secondary dagger strike**; that extra attack is currently implemented only for a Daggers main-hand paired with an off-hand dagger. Do not count phantom dual damage.
- Sword + Orb: native Orb Ward generates Barrier from max HP and Spell Power after a damaging main-hand hit, with its own cooldown; stacks with Aegis Barrier, resets between combats.
- Sword + Tome: native Tome Recall can return Mana after Mana-paid actions. Decay and Magic affinities provide Mana for physical weapons.
- Daggers + off-hand Daggers and Wand + Orb/Tome remain legal when earned.

## Agent change

Hexblade `PROFILES['hexblade-hybrid']` now prefers **Sword/Daggers/Wand** in main-hand, and **Daggers/Orb/Tome** in off-hand, with normal loot availability. The native `equipItem` call actually equips items; the agent's scoring has been fixed so it respects the half offensive contribution of off-hand daggers. Other gameplay coefficients were not changed.

The Hexblade talent plan remains Decay + Magic (Arcane mode), with minor Aegis investment; this is an objective, not free talent points. Natural runs must earn every point, purchase every talent and obtain every item through the native runtime.

## Validation

- [Native loadout compatibility, agent choice and natural E1 smoke](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44796973695): **25 tests passed, no failures**; the seeded native E1 run had 2 accounts, 63 attempts, zero errors.
- [Full 12-seed native recheck](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44797151557): 12/12 shards passed, **24 accounts, 621 natural attempts, zero errors**.

| Profile | E1 won | E5 won | E20 won | Highest E entered |
|---|---:|---:|---:|---:|
| Hexblade with new equipment options | **7/12** | 0/12 | 0/12 | E3 |
| Leather Duelist, unchanged profile | **5/12** | 0/12 | 0/12 | E3 |

The Hexblade's E1 tally matches the previous Arcane/Aegis version (**7/12**), but individual seeds changed their trajectories, so the combinations must not be claimed to have improved overall progression. In the new sample, **6/12** accounts eventually purchased Aegis affinity and **2/12** Guarded Block; none bought Arcane Resonance, Surge, Mastery or Barrier Pulse before stopping.

## XP and mature-build limitations

The native early-game cohorts stop before most of the multi-affinity talent paths are affordable. Giving them additional points at E1 would invalidate natural E1 progression testing, though a **separate, explicitly labeled mature-build controlled combat study** could compare legal point allocations and gear with identical encounter setups. The best next test is to identify legitimately earned high-XP snapshots, reset with the same native accumulated XP, and separately report controlled versus natural progression results.

**No artificial starting stats, XP, equipment, loot, enemy parameters, level unlocks or Boss victories.**
