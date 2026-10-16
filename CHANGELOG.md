# Changelog

## v0.9.2 — 2026-10-16 (mobile UI)

- Display all five main navigation tabs in a 3+2 grid on phones; larger tap targets remove the need to scroll sideways to Dungeons.
- Hide the redundant equipped-gear strip on the mobile Tavern homepage.
- Put a compact 3×3 equipped-item grid next to character statistics on mobile, bringing Inventory higher into view. Keep desktop's character illustration and layout.
- Render permanent rune choices as smaller three-column tiles; maintain all rune equip/unequip behavior.
- Show affinity sets in two columns, with progress steps and expandable full tier descriptions.
- Mark Merchant items as higher, lower or equal **Gear Power** versus current equipment, while keeping the detailed Compare flow for effects and affinity synergies.
- Replace the separate dungeon Previous / Next row with arrows aligned to the numbered dungeon selector, and move **Enter Dungeon** above secondary entry preferences.
- Preserve combat, item generation, saving, dungeon reroll rules and progression; add mobile UI regression assertions.
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
