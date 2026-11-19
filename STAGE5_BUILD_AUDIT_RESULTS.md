# Stage 5 — Baseline build composition and respec audit (v15)

**Status:** Executed 19 November 2026. Scope: `audit/v013` only.
**Workflow:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44584312279
**Workflow revision:** `82e59cb31b0b085de8f4208abdba875d4a7ced59`
**Results:** 23 targeted tests passed, zero failed. 12 native scripted accounts,
669 total natural E1–E20 attempts, **0 simulator errors**. Nine accounts
entered E20. No numerical balance or published-game change.

## Measurement caveat: v15, not the old v8 talent tree

The integrated game currently runs `combat/talent-graph-runtime.js` version
**15**, with **343 actual talent nodes**. Its public API offers `NODES`,
`allocate`, `reset`, and `graphProgress`, but no
`T.path` function. Do not use the older `combat/automatic-talents.js` API
in isolation as the source of current node IDs or routes.

The active IDs **are** `strong_heart`, `deep_cuts`, `quick_hands` (no
`passive_` prefix). The original assumption that these short IDs were
invalid was incorrect. The real invalid fallback targets are:

| Existing policy | Valid talent goals | Unresolved old goals |
|---|---|---|
| Cautious | strong_heart, guarded_block, renewal | guard, vitality, might |
| Balanced | bleeding_edge, deep_cuts, strong_heart | might, vitality |
| Daring | quick_hands, double_strike, bleeding_edge | might, haste |

The unresolved goals trigger a generic fallback in the natural agent,
not the originally intended consistent deep-build strategy.

## Observed behavior in the baseline agents

- **Native talent resets: 0** in all 669 attempts. This is a policy gap,
  not evidence that human players never reset.
- **Manual primary-attribute points are not a playable v15 mechanic.**
  The earlier zero-allocation statistic was an invalid audit metric and is removed.
- **251 actual equip decisions**. Of the observed cross-attempt transitions,
  10 changed dominant weapon subtype and 17 changed dominant armor type.
  Equipment substitution does occur, but no strategic class-change policy
  exists.
- At E5, 10 of 12 accounts were observed. E10: 10/12; E20: 9/12.
  Other accounts are censored; no assumptions about their later builds.

| Snapshot | Accounts | Weapon subtypes | Dominant armour | Mean allocated talent nodes | Avg maximum prerequisite closure |
|---|---:|---|---|---:|---:|
| E1 | 12 | Sword 12 | Cloth 12 | 0 | 0 |
| E5 | 10 | Sword 7, Mace 2, Daggers 1 | Plate 9, Leather 1 | 19.3 | 8.9 |
| E10 | 10 | Sword 6, Daggers 3, Mace 1 | Plate 9, Leather 1 | 35.5 | 13.1 |
| E20 | 9 | Daggers 6, Sword 3 | Plate 6, Leather 2, Cloth 1 | 49 | 17.78 |

These are **observed loadouts**, not equalized forced builds. The generic
gear scorer favors broad affix values; caster combinations did not emerge in
this cohort. That is a limitation of the agent's choices, not proof that
Cloth/Magic is nonviable in-game.

Average talent families represented in the 10 E5 entrants: **2.4**. All
E5+ snapshots here include multi-affinity talent investment. It is not a
comparison against truly single-affinity specialists.

## Reset constraints in the real game

The v15 native `T.reset` removes purchased **talent nodes**, preserves
accumulated XP and refunds them for reallocation. It does not expose separate manual primary-attribute spending. Historical
saved `attributes` fields may be preserved for compatibility, but do not
constitute selectable primary-stat points in the current interface.

A reset should be counted separately from weapon switches and armor swaps.
Profile flexibility must be tested as a strategic hypothesis, not treated
as an inherently negative or positive event.

## What is implemented and what is not

**Implemented and tested:** additive item-stat snapshot, real node IDs
from v15, approximate prerequisite-closure depth, equipped weapon/armor
change counts, and explicit reset event placeholders.
The previous decision policies and all gameplay rules remain unchanged.

**Not yet implemented:** a full build planner that pursues Magic/Cloth,
Strength/Plate, Agility/Leather, real mixed-tree hybrids, high-tier skill
rush vs breadth-first, or gear-triggered respec. As a result, **there are
not yet comparative win rates for these strategies**.

Next methodology: `STAGE5_BUILD_STRATEGY_PLAN.md`. Implement and validate
native v15 prerequisite traversal and gear-aware scoring on 4 matched seeds,
then expand to 12–20 seeds and longitudinal E1–E20 only after tests pass.
Always use real drops, Camp transactions, legal talent allocations, native
resets and separate risk exposure by Guarded/Dangerous/Brutal.

No merge, deployment or gameplay power adjustment was performed.
