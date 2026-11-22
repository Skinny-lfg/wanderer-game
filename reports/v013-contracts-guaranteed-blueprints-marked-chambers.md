# Wanderer v0.13 — Contract reward redesign and marked chambers

## Product decision

**One Contract = one fixed prize, earned only on safe extraction or final Boss victory.** The former `blueprint_chance` with a basic fallback has been removed entirely. There is no extra post-completion roll. An offered **Blueprint is a guaranteed prize** once the selected Contract is completed and the player exits safely.

There are still **two optional Contract choices** per Expedition and only one can be accepted. A player dying after completing a Contract receives **no Contract reward**.

### Prize distribution

Five resource/consumable categories stay available: Gold, Essence, Fragments, matching Affinity Reagent and a Potion. A sixth prize type is a **rare standalone guaranteed Blueprint**.

- Blueprint offer rate per available Contract slot: **Guarded 5%, Dangerous 7%, Brutal 10%** (conditional on an unlearned Rare/Epic Blueprint from the current Realm existing).
- The two-slot offer can contain at most one Blueprint. No duplicate recipes, no "otherwise", no fallback currency and no supplemental reward.
- The full recipe name and rarity are visible *when the guaranteed Blueprint is offered*.
- Non-Blueprint rewards retain the existing risk-scaled numbers: Gold 28/45/70; Essence 4/7/11; Fragments 8/14/23; Affinity Reagents 1/1/2; one Ironhide/Purifying/Fate Potion.
- The deterministic plan is checked on save restoration and the paid receipt may not be altered to a larger amount or another reward.

### Six active Contracts

| Contract | Native requirement |
|---|---|
| Bounty Writ | Defeat marked Elite |
| Purification | Use Reliquary to disable a Boss property |
| Oath of Defiance | Beat final Boss without disabled seal |
| Monster Hunt | Defeat 6/8/10 genuine ordinary mobs according to risk |
| Skirmish Orders | Complete three distinct normal combat rooms |
| **Marked Chambers** | **Clear two specific combat rooms, visibly highlighted with 🎯 on the Realm map** |

**Removed:** Pathfinder (its "two sectors" condition was confusing) and Shrine Oath (too trivial).

### Why Marked Chambers changes the route

- The Contract preselects **two actual combat chambers in different branches**, prioritizing rooms beyond the entrance ring and varying group type/difficulty where possible.
- The marked nodes are **highlighted on the map immediately after choosing the Contract, including when they are not yet reachable**. The markup uses `data-contract-target`, 🎯 in the name, an explicit badge, and a visible highlighted outline. The map topology, travel costs and player combat are unchanged; the player must navigate normally.
- Target selection checks genuine non-secret path reachability and imposes a **conservative combined travel step bound** (entrance→first target, return along cleared rooms, then entrance→second target) below the original step budget, leaving one spare step. Impossible pairs are not eligible.
- Only the recorded native controller **completed combat history** and matching cleared-room flags count; scouting, room visits, an Elite, a Shrine or a defeat in an unfinished battle cannot satisfy the Contract.
- The target pair is seeded from the immutable Dungeon manifest and is included in the saved, validated Contract plan. A fabricated pair should be rejected by restore.

### Scope and integration safety

The change modifies only optional Contract catalog/reward planning/progress, map UI highlighting and the corresponding regression tests. It does **not** change actual map generation, random combat/loot, Boss mechanics, combat stat balance, Affinity abilities, talent points, potion stock or regular rewards. The v0.13 state is clean-sheet; **in-progress old Contract offers generated with the previous algorithm may not restore**, so begin a new playtest Expedition.

Source files and corresponding `docs/` preview files are byte-matched. Test CI should cover six Contracts, unique rare guaranteed Blueprint offer, same-prize ledger after safe exit, no payout on death, map pair reachability, blueprint owner/rarity, forged plan rejection, combat and native progression regressions.

Branch: `feature/v013-contract-marked-rooms-guaranteed-blueprints-20261122`, planned integration into canonical `audit/v013-stage6`, then fast-forward `playtest/v013-complete`. No deployment to `main` or Firebase.
