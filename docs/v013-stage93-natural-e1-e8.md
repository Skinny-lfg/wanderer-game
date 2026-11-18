# Wanderer v0.13 — Stage 9.3: Native human-like E1–E8 progression

## Purpose

Replace Stage 9.1/9.2's first-ring Boss injections, fixed full gear and synthetic talent budgets **for natural E1–E8 tests**. Preserve the older controlled diagnostic modes separately: they remain valuable for reproducible skill and Boss experiments, but they are not a replacement for campaign/account progression.

The new command runs a **real fresh native account** and follows it until E8 or until it cannot beat a particular Expedition after a bounded number of real retries. No fabricated character power or encounter arrangement:

- Native fixed weak starter items (Worn Tunic etc.) from the live game. No setup, free Rare armor, or scripted drops.
- Persistent same-account inventory, equipment, Gold, fragments, crafting resources and native XP over the entire run. Actual XP comes from native room/event rewards; talents are purchased only with earned points via current v15 graph and native allocation.
- Native three-card Realm choice, selected risk, optional Contract, real map steps and discovered rooms, actual Boon Shrine offers, events and optional Boss preparation. Boss spawns naturally on the map, not in the first room.
- Inspect genuinely earned Bag loot between encounters and equip only when its practical stat score surpasses equipped gear. Camp shopping and Apothecary purchases use native prices and Gold; native inventory limits apply.
- Human-like **bounded deterministic heuristics**, not perfect play: cautious/balanced/daring profiles differ in risks, health thresholds, family priorities and targeting. Target changes occur at most every 8 native combat ticks, without injecting damage or changing enemy AI. Native potion rules allow healing only between rooms, not while in combat.
- Low HP or exhausted path can cause native extraction to bank secured progress. This does not count as a Boss win or unlock another E. Native deaths likewise do not unlock another E.
- Every level E1–E8 is represented in the final table, but an E that was *not actually unlocked* is marked not_reached, never falsely simulated with free level unlocks. A pilot may legitimately stop at E1.

## CLI and pilot

~~~bash
npm run test:v013:natural
npm run test:v013:balance
npm run simulate:v013:natural-e1-e8

# Smallest replay
npm run simulate:v013:natural-e1-e8 -- --seeds=9304 --profiles=cautious --max-level=8 --max-attempts=3

# Broader bounded run, once pilot works
npm run simulate:v013:natural-e1-e8 -- --seeds=9101,9201,9301 --profiles=cautious,balanced,daring --max-level=8 --max-attempts=4
~~~

Defaults: 2 seeds (9101, 9201) × 2 behavior policies × up to 6 attempts per actually reached E. Max E8; max 192 potential account-level attempts. Cautious profiles prefer map-visible solo rooms and extract at low HP to preserve XP/loot. The same native character continues across retries and successful Expeditions, including real retained XP and secured resources. No legacy v0.12 synthetic battle simulator is invoked; an old test harness filename is reused only because it loads the live v0.13 HTML runtime.

JSON: reports/v013-stage93-natural-e1-e8.json. Markdown: adjacent .md. Both include raw account histories and per-E rollups; CI uploads both as artifacts, with no deployment.

## Interpretation and safeguards

The report distinguishes **victory**, **defeat**, **extraction** and **runner error**. A mismatch in runtime APIs is a simulator error, never counted as a player death. Native full-map Expeditions can be much harder than isolated rooms; this difference should not be "corrected" through arbitrary HP or damage changes until we understand the actual source.

These heuristics are a more realistic model of a *possible* player than fixed gear and 24 unearned talent points, **but not a calibrated model of human performance**. They cannot model dexterity, superior tactical plans, individual shopping optimizations or real player learning. Map topology is known, but *hidden room contents* are not read to prioritize rooms. Cast and movement logic is still native automatic combat.

Do not claim that all E1–E8 were played by the same account if it never got past E1. A zero-attempt E has no win rate. For strong balance conclusions collect more independent accounts and actual manual playtests, including carefully observed initial difficulty, when players buy gear, when they spend XP and how they route toward Boss preparation.

**No gameplay data, save rules, economy values, animations, imagery, UI or Boss mechanics are changed in Stage 9.3.**

## Acceptance

1. Existing v0.13 simulator and Stage 9.1/9.2 tests still pass.
2. Native starter gear and zero XP are verified at the start of every simulated account.
3. No hard-coded stat rolls, artificial XP, instant Boss fights, unlocked E bypass or enemy HP edits.
4. Every sim run emits deterministic, inspectable E1–E8 outcomes with explicit not_reached censoring.
5. The report separates observed player-policy effects from actual game balance and openly flags remaining limitations.
