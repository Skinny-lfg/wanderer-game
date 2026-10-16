# Changelog

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
