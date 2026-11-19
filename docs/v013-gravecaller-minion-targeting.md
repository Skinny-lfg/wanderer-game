# Wanderer v0.13 — Gravecaller: Minions-first auto-targeting

## Decision

Stage 9.11 controlled combat compared player target policies against the
current Gravecaller Deathbound Ritual for the same 30 native seeds in both
Starter and Common equipment:

| Native outcome | Focus Gravecaller | Focus summoned Minions |
|---|---:|---:|
| Starter player victories | 0/30 | 0/30 |
| Starter average Deathbound damage | 31.67 | 6.10 |
| Common player victories | 30/30 | 30/30 |
| Common average received damage | 96.77 | 66.27 |
| Common average Deathbound damage | 45.73 | 6.23 |

These are controlled E1 fights, not a claim about earned E1–E8 progression.
The user requested to **implement the Minions-priority behavior** after testing
its defensive value. Nothing in the Gravecaller's HP, damage, summons,
Deathbound stacks/duration or loot chances has been changed here.

## Native in-game behavior

- When Gravecaller is the living Elite leader, the automatic combat target
  first becomes the earliest living **on-field** undead summoned by that
  Gravecaller. Reserve enemies cannot be targeted.
- Once no such Minions remain, target returns to the living Gravecaller.
  No other Elite, Boss or ordinary mob target selection is modified.
- Re-evaluation occurs at **most once every 0.88 combat seconds**, using the
  game's own elapsed combat time (the same reaction interval used by the
  Stage 9.11 player-policy simulation); speed controls do not fake decisions.
- **Player control always wins**: clicking/tapping a live enemy locks it as
  the manual focus, including the Gravecaller himself. Clicking the already
  selected manual target a second time resumes automatic Minions-first
  selection. If a manual target dies or leaves the field, automatic
  selection resumes safely.
- The combat status line advertises whether the encounter is using
  automatic Minion priority or a player's manual target.
- The existing retargeting UI updates selected portrait, HP/DEF IDs,
  keyboard/ARIA status, and target arrow after automatic switches.

## Simulation integrity

The existing Stage 9.7–9.11 fixtures intentionally choose target policies.
They explicitly mark their encounter as \`simulationTargetPolicy=true\`
so the new in-game assistance cannot silently override \`mechanics\`,
\`focus\` or \`adds\`. No target behavior, stats, or RNG is altered for
those controlled before/after simulations.

Native end-to-end tests start a real seeded Gravecaller encounter, tick
the actual game combat, observe a real summoned undead becoming the
player target, and verify that a manual Gravecaller focus is not overridden.
Additional tests cover no other Elite targeting, dead manual targets and
mirrored source/Pages modules.

**Release scope:** Preview only. No Firebase, account saves, gear tiers,
global enemy tuning or other Elite/Boss abilities changed.
