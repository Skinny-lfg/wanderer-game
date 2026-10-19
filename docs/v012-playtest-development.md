# Wanderer v0.12 — first playable development prototype

**Status:** experimental playtest on development; old game stays available.
**Safety:** intentionally uses \`wanderer_v012_prototype_local_v1\`, not the existing browser/account keys. No production/cloud/Firebase save schema is migrated or overwritten. Main branch remains unchanged.

## Access
Open development's index.html through an HTTP server (do not open as file:// because ES modules need HTTP). A **⚗ v0.12 Playtest** button appears below the classic game content; alternatively append ?playtest=v012 to the local URL. Use the button to enter a self-contained 15-room experimental adventure. Closing it returns to the classic Wanderer. The playtest state resumes if reopened, while permanent prototype gear is retained after victory/defeat.

## Implemented
- Fifteen rooms: **seven normal, two elite, two chest, two events, one altar, one boss**. The first room is always normal combat and the fifteenth is always a boss. Nonfinal positions are seeded and randomized.
- One active enemy at a time. **Planes** advertise 1–3 Waves and whether the final wave contains an Elite before the player chooses. Each completed Wave awards currency and independently rolls for permanent equipment (normal wave 7%, Elite wave 28% in the experimental prototype). More Waves bring more chances and more danger. Chests, random events and altars now follow the selected Plane's waves; the boss Plane uses three waves. No manual targeting.
- Five new temporary affinity families: Blood, Vitality, Aegis, Fury, Arcane. Thirteen old dungeon themes retained as *plans*, each mapped to one of the five reward families.
- Start by selecting any one affinity and choosing one of three starting passives. The initial affinity is guaranteed among the first room's three plans. After completing a room choose one of three passives linked to the chosen plan. Ten hybrid passives require the relevant affinity pair.
- A family's plan is locked **only for the next room after selection**. Three free (zero Gold) rerolls per run, changing an offered plan to another permitted path; the guaranteed starting-affinity slot is pinned on room one. **At most three active affinity families** may be acquired per expedition. Later path offers stay within the unlocked families; when only two families can be offered, distinct dungeon paths fill the three choices. Passives have a maximum of two ranks in this playtest.
- **Health and Mana potions can only be used at camp or during noncombat preparation between Planes** (including after clearing a Plane); neither can be used during Waves. The camp displays HP/Mana bars and stocks. Pick up to three total potion slots for a run (0–3 Mana, remaining Health, both limited by stock). HP/Mana and gear persist between Planes and the next attempt; minimum 40% HP/30% Mana after a failed run. Each stock refills one potion per completed expedition, up to three. Events and altars offer additional recovery.
- Permanent gear is stored immediately when received, even during failed expeditions. The player can open **Inventory & Equipment** and equip or swap gear between Planes, never during Waves; equipping updates health and Mana caps. Active passive names, descriptions, affinity and ranks appear in the side panel. The next difficulty unlocks only after the final boss wins.
- Blood spread effect *Contagion* carries Bleed stacks from a killed enemy to the next **wave**, instead of targeting multiple simultaneous enemies.
- Later rooms have a steeper enemy-power curve. Bleed stacks are capped at six, repeatable passive ranks at two, Second Wind at once per full expedition, and combat lifegain at a small capped amount. Chests and risk events no longer accidentally award a second gear drop after their guaranteed one.
- Existing v0.12 local test runs with four or five affinities are retired when reopened, while keeping experimental permanent gear and currencies. This does not touch actual Wanderer accounts or saves.
- Completely separate gear/economy/combat rules from the old mode, for controlled experimental playtest only.

## Intentional limitations before replacing classic gameplay
- This is a deliberately **separate combat engine with provisional numbers**, not a migration of the classic D1–D200 engine. Win rates, drops, passives and income are not approved as balance values.
- Classic Merchant, Forge, PvP, Firebase/cloud login, leaderboard, runes and class-specific animations have **not** been converted. Their existing behavior is unchanged in classic mode.
- This prototype currently uses one shared local prototype profile per browser, independent of Google login, to avoid cross-account/save conflicts.
- Some passive descriptions are design candidates; the code implements selected representative interactions, **not every full passive effect**. The gear's Epic/Legendary affinity fields are currently illustrative and require actual combat integration.
- Private playtest deployment is separate from production at https://wanderer-private-v012-production.up.railway.app/ behind a server-side login. Its source is deliberately pinned to a tested development commit. No deploy to production Wanderer/main has been performed.
- The initial development implementation uses a simplified separate simulator for combat, not the classic production battle mechanics. Its results should not be used for final tuning.

## Quality checks
- \`npm run test:v012\`: deterministic state-machine tests (affinities/paths, one-step lock, gear survival, waves, potions, final-boss unlock).
- \`npm run test:v012:browser\`: Playwright desktop 1280 px and mobile 390 px checks (launcher, path rerolls, single active enemy, isolation from real localStorage keys).
- Existing \`npm test\` includes \`test:v012\`, \`test:preview\`, and \`test:v012:balance\`. The balance script executes 1,920 fixed-seed expeditions on the isolated engine, with deliberately simplified level-1 test gear; do not treat its win rates as production game estimates. Opt-in pre-release \`test:assets\` includes browser playtest smoke.
- Validate overall development Actions status at https://github.com/Skinny-lfg/wanderer-game/actions

## Next steps
1. Interactive playtest in a development/local build: does the combat + reward loop feel rewarding?
2. Tune rate of permanent gear accumulation and measure no-gear/low-gear progression across D1→D2.
3. Integrate all 30 base passive effects and 10 hybrid interactions with production combat semantics; run elite/boss simulations.
4. Replace the prototype UI and isolated save only after passing compatibility/back-up checks and explicit approval for migration.
