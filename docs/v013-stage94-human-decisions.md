# Wanderer v0.13 — Stage 9.4: human-like Expedition decisions (simulation only)

## Why

Stage 9.3 already uses real E1 starter gear, persists a single account, earns XP through genuine completed rooms, and cannot skip native Boss unlocks. But its policy was still too naive: it ran out of HP and map steps, occasionally picked a Boon just because its name matched an Affinity, and could fail to spend an available healing dose at the right time. It also rarely attempted genuine Boss preparation.

Stage 9.4 changes **only simulator decision heuristics**. It does not modify live combat, loot, economy, Boss balancing, graphics, save formats or maps. It builds on the unmerged Stage 9.3 PR #79 and stays in a separate branch.

## New decision policy

1. **Map routing:** The bot scores only rooms exposed by the native map UI (a legal current travel path or a previously scouted room). It respects true travel cost, remaining steps, visible enemy count, current HP and approximate Boss distance. It prefers safely accessible solo fights and free Boon Shrines early, but avoids unnecessary detours that make the Boss unreachable.
2. **Boss preparation:** The optional marked Elite can reduce Guarded Boss attack by 10% or remove an escort at higher risk. The Forgotten Reliquary can disable one actual Boss modifier by sacrificing 15% maximum HP. They are attempted when visible, reachable within the step budget and the current HP justifies their risk; no boss modifier is removed through a simulator shortcut. Actual preparation at Boss entry is separately reported.
3. **Boon selection:** Scores actual Boon trade-offs: Bastion Oath's damage reduction, Predator's Focus single-target boost, Blood Tribute / Rotbound Echo only for relevant builds, Aetherbound Pact only with Mana, and Wayfarer's Bargain only when an extra step offsets its 10% max-HP cost. If the offered choices are poor and a genuine Fate dose is equipped, the bot may use the native Shrine reroll.
4. **Potions:** Camp purchases use native random stock, genuine Gold, prices, and three-slot loadout rules. Health is prioritized over marginal merchant upgrades, but no potion is injected. Between rooms, Health is saved for real threats, Barrier/Ironhide for Elites/Bosses, Scout for discovery, Trail when movement is constrained, Mana for low-resource casters, and Purifying for relevant combat Conditions. The bot cannot drink in combat or use a dose twice.
5. **Extraction:** After considering visible safe Springs/Shrines and legal native healing, a low-HP bot can genuinely extract to keep secured rewards and XP. This does not unlock E+1.

## Testing and validation

Run the following from a checkout of this branch:

```bash
npm run test:v013:human-decisions
npm run test:v013:natural
npm run test:v013:balance
npm run test:v013:stage91
npm run test:v013:stage92
npm run simulate:v013:human-e1-e8 -- --seeds=9101,9201 --profiles=cautious,balanced --out=reports/v013-stage94-natural-e1-e8.json
npm run simulate:v013:human-e1-e8 -- --seeds=9304 --profiles=cautious,balanced --max-attempts=12 --out=reports/v013-stage94-targeted-e1-e8.json
```

The workflow runs a default and targeted bounded pilot, uploads raw JSON + Markdown, and **does not deploy the website**.

## Meaning of the statistics

- Report only *actually reached* Expeditions. When an account never defeats E1, E2–E8 remain **not reached**, not zero win rate.
- Victories require the native Boss to die; forced fight setup, invented drops and arbitrary talent points remain prohibited.
- Deaths, extractions, Boon choices, bought/consumed potion types, preparatory events and Boss preparation are separate.
- A heuristic controller is not equivalent to a human player, and repeated attempts by the same character are correlated. Use these results to locate bottlenecks, not to calculate population success probabilities.
- If preparation remains rare, inspect room routing, HP costs and native map constraints before tuning the boss.

**Publish/merge:** GitHub Actions tests branch content directly. There is no need to deploy or publish Wanderer to run these simulations. Merge the PR when reviewed; deploy only when changes to the public game actually need to be released.
