# Wanderer v0.13 — Stage 01: E3 Talent Progress crash

**Status: FIXED and regression-validated on the isolated `audit/v013-stage6` branch.**
No merge, deploy, production change or balance adjustments.

## Historical failure

- Native account profile: Daring, seed 9701.
- Expedition E3, attempt 14.
- Last valid prior attempt: E3/13, XP 2941, 28 earned talent nodes, advanced ability `last_bastion` prepared.
- Historical symptom: `Invalid talent progress`. This originally stopped simulation and was **not** a legitimate player death.
- Independently reproduced on the exact seeded account before the correction in run [44775171042](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44775171042).
- Native account `automaticTalents` remained valid when the exception was caught (`talentValid: true`); the error stack was `WandererAutomaticTalents.bonuses` → `attributeBonuses` → `WandererV012GearStats.totalStats` → `breakdown` → `phase3PrimaryAttributesMarkup` → `renderStash`.

## Proven root cause

In `combat/v012-gear-stats.js`, `breakdown()` constructs a **temporary talent-free character** to separate Equipment, Runes, permanent talents and temporary bonuses in the UI. It cloned native talent progress with `nodes: []`, but retained `prepared: 'last_bastion'`.

A prepared advanced ability requires its corresponding learned node. Therefore `WandererAutomaticTalents.valid()` rejected the **temporary display copy**, despite the persisted player's talent progress being valid. The exception originated in Inventory/stat-source presentation, not talent acquisition/reset or combat.

## Correction

- `combat/v012-gear-stats.js`: the temporary no-talents display context now has **`nodes: [], prepared: null`**. This never changes the actual `state.automaticTalents`.
- `docs/combat/v012-gear-stats.js`: kept identical to the source copy.
- `docs/index.html`: script cache fingerprint updated from `7dedd5fd2e85` to `24189c59e1fb` to prevent the Pages mirror from loading an old stats module.
- `scripts/v013-natural-progression.cjs`: capture a bounded exception stack and the real native talent progress **only when an error occurs**. No retry, mutation, reset, XP adjustment or fake win.
- Tests added: `tests/v013-stage01-prepared-stat-breakdown.test.cjs`; specific native progression reproduction and cross-build native E1–E5 smoke scripts.
- The only gameplay module changed is the stat display source projection.

## Validation

[Final GitHub Actions run](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44776056934): **27/27 + 100/100 tests passed, 0 failures**. Tests cover the historical prepared advanced talent state, Inventory markup, character stat breakdown, talent graph, combat, equipment, Off-Hands, and the Pages cache/source mirror.

Exact native account reproduction with **unchanged seed and risk-aware policy**:
- E3 attempt 13: extracted; XP 2941, 28 talent nodes, Last Bastion prepared.
- E3 attempt 14: extracted normally; XP 3087, 29 talent nodes, Last Bastion prepared.
- E3 attempt 15: **native Boss victory**, XP 3241, 30 talent nodes, **E4 unlocked**.
- 37 total account attempts across E1–E3; **0 native runner errors**.

Additional eight native accounts (seeds 9701/9702 × Daring, Plate Warden, Magic Fire, Hexblade Hybrid) through E1–E5 where genuinely unlocked; at most 18 attempts per level and 80 total per account:

| E | Accounts reaching | Native attempts | Boss victories | Deaths | Errors |
|---:|---:|---:|---:|---:|---:|
| E1 | 8 | 92 | 6 | 26 | 0 |
| E2 | 6 | 68 | 5 | 33 | 0 |
| E3 | 5 | 48 | 5 | 24 | 0 |
| E4 | 5 | 15 | 5 | 7 | 0 |
| E5 | 5 | 52 | 4 | 31 | 0 |

**275 real attempts, 0 errors.** Four accounts defeated the E5 Boss and unlocked E6. This is a regression/integrity smoke, not a statistically valid balance conclusion. Most selected profiles were intentionally difficult and follow different paths.

## Scope and next stage

The original E3 exception is fixed and the no-talents temporary presentation is valid even when advanced skills are prepared. The natural-account runner can continue beyond E3 and has now reached E6 legally.

**Not claimed:** E20 balance, success rate of human players or full browser QA. The next independent task is the proposed Stage 02: 50 persistent native accounts from E1 towards E20, with bounded attempt budgets and per-E censoring, after deciding resources and cohort structure.

No merge, release or deployment was performed.
