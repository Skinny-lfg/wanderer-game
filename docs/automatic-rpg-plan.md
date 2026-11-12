# Automatic RPG development branch

This is a work in progress based on the complete v0.12 game. Do not deploy it
or connect it to production player data. Use isolated synthetic playtest saves.

## In place

- A route overview shows the actual 15-Realm schedule, completed Realms and
  current choices. This is a schedule, not yet a branching map.
- Completed combat, elite, boss and event Realms grant permanent talent XP.
  Points unlock nine stat talents at Camp. Progress is stored in the profile,
  with validation; unfinished encounters and deaths do not grant Realm XP.
- Existing combat, rewards, Realm passives, events and Endless scaling remain
  in place for compatibility while the replacement is being developed.

## Still required

1. Generate and persist a connected, branching map with distinct node types,
   meaningful routes, deterministic rewards and safe checkpoint recovery.
2. Replace per-Realm passive drafts with permanent talents, reusing the passive
   catalogue and art. Define affinity and event behavior before removing them.
3. Add simultaneous enemies and distinguish area from single-target builds in
   both combat simulation and UI. Rebalance enemy damage, loot and progression.
4. Provide an isolated English-language playtest with separate local saves and
   no connection to production accounts. Verify mobile and desktop browser
   journeys, reloads, full Bag, potion loadout, bosses and Rune settlement.

XP values and talent effects are initial development values, not final balance.
