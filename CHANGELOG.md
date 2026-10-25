## v0.10.0 — 2026-10-17

- Reworked Legendary equipment with unique event-driven abilities, fixed signature affinities for selected items, and the new Frost Staff Winterheart Spire.
- Expanded buildcraft: stronger Critical, Fire and Dark charge interactions; Shatter and Double Strike mechanics; refined set descriptions and equipment comparison.
- Rebalanced Sunder, Shield and Regen 2-piece bonuses to scale proportionally with initial enemy Armor or player maximum HP.
- Added three illustrated boss portraits, refreshed elite art and names, improved boss warnings, and clarified combat information including caster Mana.
- Refreshed website and Tavern backgrounds, character art and names, desktop equipment placement, mobile navigation and inventory interface.
- Improved gear management, dungeon choices, progression information and assorted quality-of-life fixes; existing player saves and Firebase collections remain unchanged.
- Regen tier description simplified without changing its 0.6% maximum-HP-per-second effect.
- Validated the latest development build with the automated regression suite; publication does not reset accounts, saves or leaderboard scores.

## v0.9.3 Legendary revision — development only

- Replaced simple Legendary signatures with event-driven build interactions; 19 unique signatures across 22 identities.
- Added Winterheart Spire, a Frost Staff using supplied transparent 256px artwork, without changing global rarity/subtype odds.
- Grasp, Scepter and Eternal Oath retain their identity/art as random-affinity traditional Legendary items; saved stats/affinities remain compatible.
- Added combat/save/UI/playback regressions and corrected Block damage scope. Large balance simulations remain pending; no release/deploy.

## v0.9.3 — Balance & Buildcraft (development)

- Critical 3, Fire 3 and Dark 3 now add modest main-hit damage from held charges; tier 5 signatures retain their mechanics and cooldowns.
- Regen 2 scales at 2 + 0.2% max HP per combat second, capped at 10 HP/s. Existing overheal, Barrier and Second Wind limits remain.
- Gear Power accounts for cumulative set tiers; inventory recommendations compare full loadouts. Off-Hand stays locked while Bow, Staff or Two-Handed is equipped.
- Dungeon rerolls cost 5 Fragments per ten-level bracket (D1–10: 5, D11–20: 10, …, D191–200: 100), independent of reroll count. Free offer rotation requires extracting after 2+ completed waves; death and interrupted runs preserve offers.
- Persistent NEW badges for acquired gear and runes, individual inspection and a shared Mark All as Seen control. Missing flags on old saves mean seen.
- Equipment and combat explain actual weapon proc rates and active set synergies. Proc rates are unchanged.
- Regression coverage includes browser interactions at desktop/mobile sizes. Extensive balance simulations are deferred.

# Changelog

## v0.9.2 — Combat Timer Hotfix (2026-10-16)

- **Fastest D200 measures combat time only.** The timer advances only while auto-combat processes a wave; 1×/2×/4× playback changes the time counted per combat tick accordingly. Waiting in Tavern, Forge, Merchant, equipment, choosing the next wave, or leaving the browser tab in the background adds no race time.
- **Old browser-time results retired:** new public D200 times are kept only in `testSeasons/v092-launch-1/combatSpeedruns/{uid}`. Former `speedruns` records are not counted and are denied access by updated rules; historical records are not physically erased.
- **Existing players keep all saved progress, equipment, Gold, Fragments, runes, nicknames and accounts.** Ongoing attempts started with the old timer are **not eligible** for a new combat-time D200 record. Use Account → Reset Progress · New Speedrun to start a fair eligible run; this intentionally resets the individual's progress but does not reset other players.
- **Crash/reload protection:** combat progress is checkpointed periodically during fights, so interrupted attempts retain most of their elapsed combat time. Dying counts fought combat time. Personal-best protection within the new timing metric remains.
- **Owner action required:** publish the updated `firestore.rules` in Firebase Console to enable `combatSpeedruns` writes. Changes to the GitHub main branch do not deploy Firestore Rules. Other game balancing and Firebase Authentication settings remain unchanged.
- Regression coverage: timing ticks at 1× and 4×, idle/background pause, legacy time ineligibility, new scoreboard and Firestore security rules.

## v0.9.2 — 2026-10-16 (mobile UI + D200 speedruns)

- **GLOBAL FRESH START:** all players begin at D1, with zero saved equipment, inventory, runes, Gold, Fragments, upgrades, dungeon progress and prior leaderboard records. Old progress is never migrated into v0.9.2 accounts. Authentication identities, nicknames and cosmetic character selections are preserved.
- **Season isolation:** live saves use `players/{uid}/saves/v092`; leaderboards use `testSeasons/v092-launch-1/{deepest|speedruns}/{uid}`; public equipment uses `publicLoadoutsV092/{uid}`. Old local browser saves, former cloud save `current`, prior leaderboard and previous public loadouts are inaccessible from the new client. Existing historical Firestore documents are **not physically deleted by a GitHub merge**.
- **Required manual Firebase step:** publish `firestore.rules` from this release in the Firebase Console before making the new build available. Do not delete Authentication accounts, nicknames or profiles. Live service/rules deployment is not done by GitHub.

- **Rune Recycling:** sell any unequipped owned rune for Fragments (7 at D10 up to 45 at D200); a confirm dialog protects against accidental sales. Bulk-recycle duplicates keeps the highest-tier rune of each family and always preserves equipped runes. Rewards that have not been claimed cannot be sold.
- **Legendary Hunt guide:** select a desired Legendary and compare conditional item-identity odds across the three available dungeon paths. This is targeting advice using existing favored-equipment rules; it deliberately does not change any drop roll.
- **Extraction clarity:** contextual HP/reward risk warning between waves and explicit instructions in dungeon entry/protection confirmation; clearing all waves remains required to unlock the next dungeon.
- **Crystal tooltips:** corrected to match the implemented third-main-attack counter and per-expedition 10-second Burst cooldown (no numerical changes).
- **Midgame weapon sustain:** Staff magical casts grant Arcane Guard (3.5% max HP Barrier, 6-second cooldown); Two-Handed strikes grant Heavy Guard (2.5%, 6-second cooldown). Paired D30/D40/D50/D60 PvE trial results and limitations are documented in `docs/design/v092-gameplay-improvements.md`. No other weapon damage or enemy scaling formula changed.
- **Death recovery:** if both equipment and Stash are empty, grant the existing Training Sword immediately after death, matching the former reload-time recovery rule.
- Added a dedicated regression for rune recycling, hunt probability, Crystal text, weapon guards and complete-gear-loss recovery. All changes remain on `development`, without touching player saves, Firebase or `main`.
- Introduce **21 fixed-identity Legendary** equipment definitions with subtype-matched names and exclusive PNG art (5 original + 16 new). Legacy items retain their IDs, stats, effects and original names; mismatched old identities fall back to subtype-specific art.
- **Obsidian Quarry → Crystal** (💎), with independent 2/3/5-piece set effects (resonance, charges, Crystal Burst) and Crystal proc damage. Iron Bastion remains Sunder.
- Preserve the global Legendary rarity roll and existing equipment slot/subtype roll; only names and images are selected from the matching catalogue pool.
- Display locked and unlocked Tier Bonus milestones in fixed **2 → 3 → 5** order rather than bringing inactive five-piece tiers to the top; no bonus values changed.
- Display all five main navigation tabs in a 3+2 grid on phones; larger tap targets remove the need to scroll sideways to Dungeons.
- Remove the equipped-gear strip from the Tavern homepage **on all screen sizes** (desktop and mobile). Equipment management remains in Equipment.
- Put a compact 3×3 equipped-item grid next to character statistics on mobile, bringing Inventory higher into view. Keep desktop's character illustration and layout.
- Render permanent rune choices as smaller three-column tiles; maintain all rune equip/unequip behavior.
- Show affinity sets in two columns, with progress steps and expandable full tier descriptions.
- Mark Merchant items as higher, lower or equal **Gear Power** versus current equipment, while keeping the detailed Compare flow for effects and affinity synergies.
- Replace the separate dungeon Previous / Next row with arrows aligned to the numbered dungeon selector, and move **Enter Dungeon** above secondary entry preferences.
- Preserve combat, item generation, saving, dungeon reroll rules and progression; add mobile UI regression assertions.
- Make **Fastest D200** (lowest eligible accumulated active play time from a fresh attempt through D200 clear) the default ranking, storing one personal best per account across resets.
- Keep **Current Progress** by account and restart its cleared dungeon depth at D0 on each new attempt. Remove **First to Clear** and intermediary milestone rankings; old milestone documents remain stored but are no longer published or readable.
- Add Account **Reset Progress · New Speedrun** with explicit RESET confirmation and cloud-first revision-protected save replacement. Reset dungeon progress, Gold, Fragments, runes, equipment, inventory and upgrades; preserve nickname, cosmetic character and D200 personal best.
- Each fresh attempt gets a new attempt ID; old saves remain compatible but untimed legacy runs cannot claim a historical D200 time.
- Community timings are **unverified client claims** until a trusted speedrun validation backend exists.
- **Release prerequisite:** deploy the updated Firestore rules before publishing this build; they authorize the new speedrun records and per-attempt depth resets.
- Status: **development only**; not merged into main.

## v0.9.1 — 2026-10-16

- **Three new dungeon affinities:** 🌿 **Nature** for Serpent Grove, ⚡ **Storm** for Stormglass Spire, and 🌊 **Tide** for Drowned Vault, each with its own cumulative **2/3/5-piece Tier Bonuses**.
- Extend eligible item affinity pools and descriptions without changing existing item IDs or saved gear.
- Preserve the same three dungeon choices and selected path when leaving before Wave 1; paid rerolls still cost Fragments.
- Refresh dungeon choices after at least one combat wave, retaining the previous farming behavior.
- Apply diminishing returns above 2.5 attacks/sec while preserving Critical scaling.
- Increase Two-Handed physical damage from 1.48 to 1.70 and Staff spell damage from 1.12 to 1.32.
- Preserve saved gear, progression, rune ownership, rewards and boss/elite constants.
- Add deterministic production-engine balance simulations and regression tests.
- Add a diminishing low-speed catch-up for Staff and Two-Handed, improving D10–D50 performance without changing simulated D200 wins.
- Validate legal mixed-rarity builds and compare 3+2 against five-piece affinity choices; retain existing set powers.
- See [balance report](docs/v091-balance-report.md) and [dungeon affinity update](docs/dungeon-affinity-update.md) for details.
