# Wanderer v0.12 — first playable development prototype

**Status:** experimental playtest on development; old game stays available.
**Safety:** intentionally uses \`wanderer_v012_prototype_local_v1\`, not the existing browser/account keys. No production/cloud/Firebase save schema is migrated or overwritten. Main branch remains unchanged.

## Access
Open development's index.html through an HTTP server (do not open as file:// because ES modules need HTTP). A **⚗ v0.12 Playtest** floating button appears in the lower-right corner. Use the button to enter a self-contained 15-room experimental adventure. Closing it returns to the classic Wanderer. The playtest state resumes if reopened, while permanent prototype gear is retained after victory/defeat.

## Implemented
- Fifteen rooms: **seven normal, two elite, two chest, two events, one altar, one boss**. The first room is always normal combat and the fifteenth is always a boss. Nonfinal positions are seeded and randomized.
- One active enemy at a time. Normal encounters have one or two consecutive waves, elites have two, and the boss has two phases. No target selection. Attack and enemy timers are independent.
- Five new temporary affinity families: Blood, Vitality, Aegis, Fury, Arcane. Thirteen old dungeon themes retained as *plans*, each mapped to one of the five reward families.
- Start by selecting any one affinity and choosing one of three starting passives. The initial affinity is guaranteed among the first room's three plans. After completing a room choose one of three passives linked to the chosen plan. Ten hybrid passives require the relevant affinity pair.
- A family's plan is locked **only for the next room after selection**. Three free (zero Gold) rerolls per run, changing an offered plan to the remaining allowed family; the guaranteed starting-affinity slot is pinned on room one. No cap on the number of affinity families or passives acquired.
- Three potion slots shared by Health and Mana. HP and Mana persist between waves and rooms. Healing opportunities through altars and events.
- Permanent gear is stored immediately when received, even during failed expeditions; the experimental inventory offers simple equip/auto-equip controls. The next difficulty unlocks only after the final boss wins.
- Blood spread effect *Contagion* carries Bleed stacks from a killed enemy to the next **wave**, instead of targeting multiple simultaneous enemies.
- Completely separate gear/economy/combat rules from the old mode, for controlled experimental playtest only.

## Intentional limitations before replacing classic gameplay
- This is a deliberately **separate combat engine with provisional numbers**, not a migration of the classic D1–D200 engine. Win rates, drops, passives and income are not approved as balance values.
- Classic Merchant, Forge, PvP, Firebase/cloud login, leaderboard, runes and class-specific animations have **not** been converted. Their existing behavior is unchanged in classic mode.
- This prototype currently uses one shared local prototype profile per browser, independent of Google login, to avoid cross-account/save conflicts.
- Some passive descriptions are design candidates; the code implements selected representative interactions, **not every full passive effect**. The gear's Epic/Legendary affinity fields are currently illustrative and require actual combat integration.
- No production release or dev hosting deploy was performed; testing can be done via local HTTP checkout of development.
- The initial development implementation uses a simplified separate simulator for combat, not the classic production battle mechanics. Its results should not be used for final tuning.

## Quality checks
- \`npm run test:v012\`: deterministic state-machine tests (affinities/paths, one-step lock, gear survival, waves, potions, final-boss unlock).
- \`npm run test:v012:browser\`: Playwright desktop 1280 px and mobile 390 px checks (launcher, path rerolls, single active enemy, isolation from real localStorage keys).
- Existing \`npm test\` includes \`test:v012\`. Opt-in pre-release \`test:assets\` includes browser playtest smoke.
- Validate overall development Actions status at https://github.com/Skinny-lfg/wanderer-game/actions

## Next steps
1. Interactive playtest in a development/local build: does the combat + reward loop feel rewarding?
2. Tune rate of permanent gear accumulation and measure no-gear/low-gear progression across D1→D2.
3. Integrate all 30 base passive effects and 10 hybrid interactions with production combat semantics; run elite/boss simulations.
4. Replace the prototype UI and isolated save only after passing compatibility/back-up checks and explicit approval for migration.
