# Wanderer v0.13 — Off-Hand Stage 4: UI, tooltips, comparisons and dead-code cleanup

**Branch:** `audit/v013`. **Implementation:** [`78bca0f1e252c2fad077547fb111d238ed42d294`](https://github.com/Skinny-lfg/wanderer-game/commit/78bca0f1e252c2fad077547fb111d238ed42d294).
**Production:** no merge or deploy.
**Mandatory C7:** [run 44751876346](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44751876346) — **4/4 success**.
**Also passed:** v0.13 dependency security, random-Forge Chromium UI, and C9 dependency/dead-code scan on the same implementation commit.

## Presentation of native Off-Hand mechanics

- `combat/v012-gear-stats.js` exports a read-only `offhandEffect(item,stats)` projection. It does not modify stats or the combat runtime.
- **Orb:** displays `2% Max HP + 5% Spell Power` per damaging hit/eligible funded Magic attack, with Ward Strength once, cooldown 6s. It explicitly notes that Orb/Aegis Barrier stacks with no global cap and disappears after each encounter. An Epic Aether Orb also displays its separate Arcane Ward trait: `2% Max HP` on funded casts, own 6s cooldown.
- **Tome:** displays 3 Mana after 3 Mana-paid actions (5 with Epic Echoing Recall), cooldown 6s. A physical loadout without Mana is flagged as inactive; preview does not promise free Mana from the Tome itself.
- **Charm:** displays `1.5% Max HP` healing on a damaging main-hand hit (2% with Epic Heartbloom Renewal), cooldown 8s, with wounds/healing reductions and full-Health/blocked-hit caveats.
- Projected numbers are per eligible proc, **not guaranteed fight results, uptime, or a simulator forecast**. The actual triggers and cooldowns still belong to the native combat runtime; no coefficients or loot odds changed.

## Inventory / Bag / Merchant / Forge

- `index.html`: native item inspection now includes the base Off-Hand passive in item descriptions and an effect panel with projected values.
- Quick Compare shows **equipped versus selected** Off-Hand procs and Epic traits together, with a neutral advisory when their identities differ. It continues to display the numeric Gear Power delta solely as an attribute estimator.
- The comparison table now includes Crit, Block, Mana Regen, and Ward Strength secondary bonuses with correct percentage or per-second labels, even if not part of original `FIELDS`.
- Stash tile arrows become a neutral `◇` when a different Off-Hand subtype/trait would be swapped. Merchant descriptions likewise direct players to compare passives rather than falsely rank unlike effects. The "recommended" sort is explicitly described as `Estimated stat gain (passives excluded)`.
- Forge preview includes the new effect panel without granting items or guaranteeing a numeric affix roll.
- The obsolete Wand text "Pair with an Orb for Ward" was corrected: Orb works with other one-handed weapons. Spell Power help text now acknowledges Orb and Aegis defensive use without unlocking Mana.
- `online/v013-gear-qol.css` adds restrained and mobile-responsive native compare styling.

## Deliberate Gear Power boundary

The diagnostic `power(s)` formula is **unchanged**: it scores Attack, Defense, HP, speed, Crit, Block and active Spell Power. A guessed universal conversion of healing/Mana/Barrier proc throughput into Power would produce misleading "best item" claims across incompatible Affinities. The UI now exposes those missing effects in a separate accurate per-proc comparison. Stage 5 will quantify relative combat/progression value with controlled simulations and can then justify a better policy for item recommendations. **Do not claim Gear Power is equivalent to DPS or survival.**

## Confirmed retired code

Deleted from active `index.html` and generated `docs/index.html`, including consumers:

- `affinityBadge`: always returned an empty string.
- `barrierSource`: returned at most one of multiple legitimate Barrier sources and incorrectly gated Orb by Wand.
- `lostSetTiers`: no-op always returning `[]`, leading to impossible warning branches.

Corresponding harness exports, empty warnings, inert sort penalties and misleading UI branches were updated instead of left as hidden compatibility code. C9 scan passed. This is a **targeted Stage 4 cleanup**, not a claim to have exhaustively proven every unrelated repository function unused.

## File and test changes

- `combat/v012-gear-stats.js` plus byte-identical `docs/combat/v012-gear-stats.js`
- `index.html`, generated `docs/index.html`, hashed script/style references
- `online/v013-gear-qol.css` plus byte-identical `docs/online/v013-gear-qol.css`
- `tests/v012-economy-harness.cjs` drops dead `affinityBadge` export and exposes active comparison helpers
- `tests/v013-offhand-stage4-ui.test.cjs` added to the mandatory `npm run test:v013` script in `package.json`

Six new tests cover native formulas and Epic upgrades without altering Power; current/selected passive and secondary stat markup; Epic comparison; no-Mana warning; unused-helper removal and misleading-tooltip regression; source/docs parity.

## Verification evidence

GitHub Actions C7 run **44751876346**, all four jobs green:
- **362/362** current gameplay and UI tests, zero failures.
- **7/7** simulator.
- **79/79** Talent Graph.
- **94/94** combat, Elite and Boss suites.
- **85/85** integration/economy.
- Stage 4 normal scenarios: **48/48 valid wins**, 0 errors/timeouts.
- Stage 4 Elite/Boss stress: **96**, 77 wins, 19 deaths, 0 errors/timeouts; not a Stage 5 paired Off-Hand balance verdict.
- Security/account, deep Chromium journey, natural progression pilot, exact source/Pages parity: all passed.
- The same commit also passed the independent obsolete-code scan and Forge UI workflow.

## Next

**Stage 5 (mandatory):** update subtype-aware simulator gear selection and run paired natural-account and combat outcomes across Sword/Mace/Daggers/Wand, with Orb/Tome/Charm (plus Shield where equip-legal), physical/Magic/Decay/Aegis/Vitality hybrids, multiple Expeditions and rarity tiers; report survival, time-to-clear, Mana and Barrier generated/absorbed, healing, Elite/Boss outcomes, stat vs effect contribution, and actual player choices. Rebalance only after the data.

No merges, no production changes, no global balance tuning in Stage 4.
