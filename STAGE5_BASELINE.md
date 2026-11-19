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

## First executed pilot (GitHub Actions)

- Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44571197179
- Revision: `9843027d55d788f5959cd2b8a29d4db87b8719bc`; focused tests: **13/13 passed**.
- Four native E1 attempts, zero simulator errors: **2 extractions, 2 deaths,
  0 Boss encounters**. Four ordinary rooms were won, 110 native XP earned,
  zero equipment drops recorded. These are observations, not win-rate estimates.
- Seed 9101, both policies: one solo fight lasted 55.22 native seconds;
  player HP fell from 119 to 31, followed by extraction.
- Seed 9201: each policy won the first solo room but died against the
  following three-enemy encounter. Different policies took different damage.
- Two seeds are not sufficient to infer systematic E1 difficulty. The result
  justifies the bounded extension below; it does not justify tuning coefficients.

## Extended exploratory E1 survey

- Workflow: `.github/workflows/v013-stage5-natural-e1-survey.yml`
- Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44571595116
- Revision: `399548a66269db9ced15192393b60d9d7cdc192b`.
- 20 distinct seeds (9101–9120) × 3 decision policies (cautious, balanced,
  daring), one E1 attempt each. Analyze per-policy errors, deaths, extraction,
  Boss reach, first-fight HP loss, duration and actual drops. Controlled and
  natural encounters must never be mixed in one victory-rate estimate.
- Full JSON, readable account report and concise cross-policy summary are
  uploaded as an artifact. This workflow cannot deploy.

## Extended E1 survey — executed and validated

- GitHub Actions run **44571595116** succeeded, revision
  `399548a66269db9ced15192393b60d9d7cdc192b`.
- 20 distinct seeds × 3 fixed decision policies = **60 E1 attempts**, **0 native
  simulator errors**. These are 60 correlated policy trials, not 60 different
  map seeds and not 60 human players.
- Aggregate: **0 Boss victories, 41 deaths, 19 extractions**. Only 6 trials
  reached a Boss and all 6 lost; 7 Elite encounters and 0 Elite victories.
- First ordinary encounter always contained 1 enemy. **59/60** such opening
  fights were won, but average HP lost was approximately **62% of maximum HP**
  (cautious 61.93%, balanced 62.44%, daring 61.81%). First fights lasted on
  average 30.4/30.01/28.97 native seconds respectively.
- By profile (20 attempts each): cautious **7 deaths / 13 extractions**;
  balanced **15 / 5**; daring **19 / 1**. Each reached 2 Boss fights, winning 0.
- E1 aggregate: 66 ordinary rooms won, 17 ordinary gear drops (10 Common),
  15 gear upgrades, 2,039 earned XP, 61 boon selections and **0 potion uses**.
  No item drop was guaranteed. The zero-potion observation needs explanation
  from actual availability and legal-use policies before proposing changes.
- Full account and room evidence: workflow artifact
  `stage5-e1-natural-survey`, including JSON, Markdown, per-policy summary,
  runner hash and exact commit.

**Interpretation:** The E1 opening fights are survivable, but apparently
exhaust a large share of the starter's HP. This strongly warrants focused
investigation of first-room threat versus starting power, regeneration,
consumable availability, risk selection and routing. It does not distinguish
inherent overtuning from suboptimal scripted decisions, nor prove a human
victory rate. Do not change Boss/Elite coefficients or grant guaranteed loot
based only on this survey.

**Next diagnostic gate:** repeat a bounded set of fixed-seed **controlled**
encounters using truly native starter gear (not the full-slot Common harness
fixture). Record initial enemy composition, player stats, incoming-hit
frequency, healing/Barrier, damage per attack, time, and recovery resources.
Keep these controlled tests distinct from natural progression observations.
