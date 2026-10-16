# Changelog

## Unreleased — development

- Give Serpent Grove **Nature**, Stormglass Spire **Storm**, and Drowned Vault **Tide**, with unique cumulative 2/3/5-point set bonuses.
- Extend eligible item affinity pools and descriptions without changing existing item IDs or saved gear.
- Preserve the same three dungeon choices and selected path when leaving before Wave 1; paid rerolls still cost Fragments.
- Preserve the existing behavior of refreshing choices after at least one combat wave, and do not alter `main`.

## v0.9.1 — development

- Apply diminishing returns above 2.5 attacks/sec while preserving Critical scaling.
- Increase Two-Handed physical damage from 1.48 to 1.70 and Staff spell damage from 1.12 to 1.32.
- Preserve saved gear, progression, rune ownership, rewards and boss/elite constants.
- Add deterministic production-engine balance simulations and regression tests.
- Add a diminishing low-speed catch-up for Staff and Two-Handed, improving D10–D50 performance without changing simulated D200 wins.
- Validate legal mixed-rarity builds and compare 3+2 against five-piece affinity choices; retain existing set powers.
- See [balance report](docs/v091-balance-report.md) for measurements and remaining weapon balance gaps.
