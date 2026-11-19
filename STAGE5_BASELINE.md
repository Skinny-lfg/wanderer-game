# Stage 5 — E1 natural-progression baseline (audit/v013)

## Purpose

Measure **current** v0.13 E1 behavior before any numerical balance change. This is a
diagnostic pilot, **not** a balance verdict. The source for all changes and
measurements is the isolated `audit/v013` branch.

## Verified setup / execution

- Workflow: `.github/workflows/v013-stage5-natural-e1-baseline.yml`
- Trigger: workflow-file push on `audit/v013` (and declared manual dispatch).
- Fixed pilot: 2 native seeds (9101, 9201) × 2 deterministic decision
  policies (cautious, balanced) = 4 accounts, E1, max 1 attempt each.
- Full command:
  `npm run simulate:v013:natural-e1-e8 -- --seeds=9101,9201 --profiles=cautious,balanced --max-level=1 --max-attempts=1 --out=reports/stage5-e1-baseline.json`
- Tests: `node --test tests/v013-stage5-natural-baseline.test.cjs tests/v013-natural-progression.test.cjs`.
- Evidence: workflow artifact `stage5-e1-natural-baseline`, containing
  `stage5-e1-baseline.json`, `stage5-e1-baseline.md`, and provenance
  (exact commit, Node version and SHA-256 hashes).
- **No deploy, player-save access, numerical combat changes, guaranteed drops
  or fabricated XP/gear.** The runner uses native starting gear, earned XP,
  generated map, native loot and legal camp actions.

## Measurement corrections made before baseline

- Natural-runner target switches now call the shared `selectCombatTarget`
  action. Choice policy remains a deterministic player-decision heuristic,
  never automatic browser targeting.
- Encounter duration and elite-minion focus duration now derive from the
  native `run.combatSeconds` clock, not assumed seconds per update.
  `updateCalls` is an independent metric.
- Report records the natural runner's SHA-256 in addition to its existing
  native engine fingerprint; workflow stores exact committed provenance.

## What to read first

Read the four account entries and E1 aggregate together, not the aggregate
alone. Check errors separately from deaths, then extraction versus actual
Boss victories, rooms fought, per-fight received damage, HP minimum, group
size, ability casts, potions, earned items, grey drops, XP and gear changes.
Note cases where policies avoid Elites/Bosses rather than losing to them.
A zero Boss-win count for four attempts must not be presented as a statistically
established Boss difficulty.

## Limits and decision gate

Two distinct seeds are inadequate for rates, difficulty hierarchy or broad
affinity comparisons. Each deterministic policy can change route, purchases,
target switches and withdrawal. E1 only does not test later expedition scaling.
No claim of human-player representativeness or confidence intervals is justified.

**Gate for Stage 5 expansion:** confirm the workflow passed, inspect the JSON
for simulator errors/timeouts and impossible resource/equipment changes, and
identify whether extraction/death/route decisions censor Boss/Elite exposure.
Only then enlarge the native E1 cohort. Keep controlled Boss/Elite-vs-Tank tests
distinct from real progression; do not change multipliers in this baseline stage.
