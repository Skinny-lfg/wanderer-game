# Changelog

## v0.9.2 — 2026-10-16 (mobile UI + D200 speedruns)

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
