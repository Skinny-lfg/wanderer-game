# Automatic RPG development branch

This is a work in progress based on the complete v0.12 game. Do not deploy it
or connect it to production player data. Use isolated synthetic playtest saves.

## In place

- New Expeditions have a saved, connected three-lane map of 15 Realms.
  Players can move to an adjacent lane or stay in their lane, choosing between
  normal and optional elite encounters; the last Realm is the shared boss.
  Event rows remain mandatory. Existing in-progress checkpoints retain their
  original schedule. Future Realm affinities and rewards are generated as the
  player advances, not fixed or shown on the map.
- Completed combat, elite, boss and event Realms grant permanent talent XP.
  The separate Talents page contains the existing ability catalogue and ranks,
  plus nine foundation nodes. Progress is stored in the profile, with
  validation; unfinished encounters and deaths do not grant Realm XP.
- Per-Realm passive drafts have been retired. Affinity starter abilities,
  rewards, events and Endless scaling remain in place. Old checkpoints waiting
  on a draft are advanced without assigning an additional ability.

## Still required

1. Expand map variety, add distinct optional event routes and preview meaningful
   rewards; validate encounter and reward balance through real playtesting.
2. Test the new permanent-talent pacing and rebalance across builds, especially
   magic, hybrids and Endless. Expand tree connections based on player feedback.
3. Add simultaneous enemies and distinguish area from single-target builds in
   both combat simulation and UI. Rebalance enemy damage, loot and progression.
4. Provide an isolated English-language playtest with separate local saves and
   no connection to production accounts. Verify mobile and desktop browser
   journeys, reloads, full Bag, potion loadout, bosses and Rune settlement.

XP values and talent effects are initial development values, not final balance.
