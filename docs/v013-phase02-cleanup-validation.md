# Wanderer v0.13 — Phase 0.2 Engine Cleanup Validation

Date: 2026-10-26  
Branch: `development`  
Starting HEAD: `cb8de2710325be77b78294afc911e8ea6c870166`  
Remote `origin/development` at start: `8fa391c68058bea81df4c7bdb0711d1c07800dd7` (GitHub compare showed no diff between that remote SHA and local `development`).  
Guest: out of scope; no Guest-related changes were made.

## Summary

Removed unreachable classic gear-set and item-affinity combat paths from the active expedition runtime, along with their now-unused runtime ports and UI status display. Legacy item metadata, gear-stat compatibility fields, save migration/validation, and checkpoint shapes remain intact. Combat formulas and deterministic outcomes remained unchanged across the complete simulation matrix.

## Code removed

In `combat/v012-combat-runtime.js`:

- Removed legacy gear bonus handlers for Focus, Heat, Soul Pact, Blood Hunt, Armor Shatter, Shield Riposte, Last Bastion, Crystal/ Shock charge, and related cooldown/proc paths.
- Removed the old item-affinity application path for Bleed, Burn, Slow, Sunder, Drain, Shield, Regen, Nature, Crystal, Shock, and Tide. Active equipment projections already null legacy item `effect`/`magic`; current native combat and Legendary/Phase systems remain the sources of effects.
- Removed old gear-driven healing overflow Barrier, enemy attack delay/weaken, Deep Freeze, Shatter, extra affinity procs, Perfect Strike, set shield Barrier, and gear-derived Slow modifier reads.
- Removed old runtime context ports and the obsolete affinity chance helper/constants used only by those paths.
- Removed the old `secondWind` gear proc. The current persisted `secondWindUsed` compatibility/display state remains untouched.

In `index.html`:

- Removed dead `isMagicOffhand` and unused legacy combat helper references.
- Removed obsolete Focus/Heat/Soul/Haste/Counter status UI associated with removed set procs.
- Removed zero-valued `stats.counts.crit` and `stats.bonus.critBonus` terms from the raw critical display formula. The remaining formula is algebraically identical because the active gear-stat projection returns zero for these old fields.

## Audited references and retained code

| Area | Finding | Decision |
|---|---|---|
| `setCounts` / `setBonuses` | Gear projection returns empty/zero set values, but the projection is still consumed by the isolated PvP stat model and public stat shape. | Retained; not dead by reference audit. |
| `stats.counts` / `stats.bonus` | Active expedition combat had reads only in removed classic proc paths and the zero-valued crit display term. Gear stats/PvP modules retain compatibility projections. | Removed runtime reads; retained projection/schema. |
| `item.effect` / `item.magic` | Save validator/migration, legacy item records, public equipment validation, and isolated `online/pvp.mjs` still read or preserve fields. Current equipment combat projection nulls them. | Persisted fields and non-expedition consumers retained for compatibility. No save format changes. |
| `setCooldowns` | Still carries active weapon and Legendary cooldowns such as Arcane Guard, Wand/Orb Barrier, Heavy Guard, and Dagger Evasion Barrier. | Retained. |
| `setTemp` / `setRuntime` | The object shape participates in existing checkpoint/golden snapshots; active runtime calls initialize it. Some old fields are now inert. | Retained as checkpoint compatibility shell; old proc writers removed. `soulPactBonus` remains zeroed to preserve the transient shape. |
| `setCombatExpire` | Now only expires compatibility time fields; the old Deep Freeze delay proc was removed. | Retained to preserve timing cleanup behavior and checkpoint semantics. |
| `enemy.effect`, DoTs | Enemy identity/effect, burn/bleed stacks, synchronization, and current DoT processing remain active. | Retained. |
| Barrier and Block | Current defensive and Legendary/weapon mechanics remain active; old set-based Barrier handlers removed. | Retained and covered by regression tests. |
| Runes and gear | Save fields, Runes, equipment, Legendary identity/rank, native equipment traits remain. | Retained. |

The 12 current Legendary identities and abilities and the 63 advertised passives were not edited. Regression tests continue to verify all 12 identities/effects and that every advertised passive affects an executed combat outcome.

## Multi-enemy dependencies identified (not implemented)

- The active runtime stores a single `r.enemy`; combat update, damage, DoTs, windups, VFX, target HP UI, and encounter win checks are coupled to that object.
- `setDirectEnemyDamage`, Legendary on-hit hooks, enemy attack cadence, and `winEncounter` all assume one target. Multi-enemy support will need explicit target selection/iteration and a defined rule for encounter completion.
- DoT synchronization and boss/elite animation/VFX currently bind to the current enemy instance. Future work needs per-enemy clocks/statuses and target-scoped VFX without changing present single-enemy timing.
- Deterministic random consumption and checkpoint serialization must be defined for enemy collections before introducing parallel targets. No enemy arrays, hordes, map, or balance changes were added in this phase.

## Deterministic comparison

Compared the pre-cleanup simulation snapshot `/tmp/wanderer-phase02-baseline.json` with `/tmp/wanderer-phase02-after.json` and the final rerun `/tmp/wanderer-phase02-final-sim.json`:

- 174 scenarios; rows identical before/after (174/174).
- Zero timeouts in each run; 61 wins.
- Identical results digest: `25f21f939eb78622946e0e3d20d5e0591c35d4ab0776d9f8b5fae9b4c5d06a82`.
- Runtime golden parity: all existing expected hashes passed after preserving Realm-entry `setTemp` initialization and its transient compatibility field. No golden fixtures were changed.

## Validation results

| Command | Result |
|---|---|
| `npm test` | PASS, 375/375 tests. Includes runtime/golden parity, Legendary identities, passive outcomes, save migration, equipment, economy, and isolated cloud-save coverage. |
| `npm run test:preview` | PASS, 4/4. First sandbox attempt could not bind loopback; rerun with local loopback permission passed. |
| `npm run test:browser` | PASS. Playwright desktop/mobile suites passed for login gate, Forge, combat/statuses, boss/mob/elite animations, Expeditions, evasion, equipment, private preview, treasure, full-Bag extraction, UI, and passive selection. |
| `npm run test:rules` | PASS, 10/10 Emulator tests (Firestore Rules and Auth). Emulator only; no real Firebase project or data used. |
| `npm run test:assets` | PASS, VFX affinity/enemy smoke. |
| `npm run simulate:v012` | PASS, 174 scenarios, zero timeouts, 61 wins; same results digest as baseline. |
| `node scripts/build-pvp-stats.cjs --check` | PASS. |
| `git diff --check` | PASS. |

No game balance values, save schemas, real accounts/saves, Firebase Rules, production services, or `main` were changed. Browser-generated tracked screenshots were restored; they are not part of the patch.

## Files changed

- `combat/v012-combat-runtime.js` — retired active-runtime classic gear/set proc paths and unused ports; retained compatibility state and current combat systems.
- `index.html` — removed obsolete UI display and references; preserved equivalent critical formula.
- `docs/v013-phase02-cleanup-validation.md` — this audit and validation report.

## Local commits

- `8386cef9130bc3b5d58f5496832a7ec0f88adde5` — `refactor: remove retired gear procs from combat runtime`
- This report is committed separately after finalization. No push is authorized or performed.

## Recommendation

**READY** to begin the new progression/map phase. The active runtime cleanup is behavior-preserving by deterministic simulation and regression evidence. Multi-enemy combat remains a future architectural task described above; this phase did not implement it.
