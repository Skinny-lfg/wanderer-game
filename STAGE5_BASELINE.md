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

## Stage 5 — controlled starter-only A/B, real E1 progression (12 seeds × 2 profiles)

- GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44573790864
- Tested workflow revision `0afe88aa6b15ee95c2aad3c76d48bcd78124694a`.
  **17/17 targeted tests passed**, no native simulator errors, no deployment.
- Test-only variation: in the VM-loaded `economy/v013-gear-rolls.js`,
  Old Sword ATK **3→4**, Worn Tunic DEF **1→2**, Worn Hood HP **4→8**.
  The repository's normal gameplay item source was **not edited**. Native
  seeded loot output was checked identical across arms.
- Starting native hero totals: control **119 HP / 18 attack / 6 defense**;
  experimental **123 HP / 19 attack / 7 defense**. Attack rate remains **0.625/s**.
- Replayed the same 12 map seeds (9101–9112) across cautious and balanced
  deterministic policies, **24 matched account pairs**, up to **6 real E1
  attempts** per arm with persistent earned items, XP and talent allocations.
  This yielded 144 control attempts and 143 adjusted attempts (one adjusted
  account won on attempt 5 and stopped).
- E1 victories within six attempts: **0/24 control**, **2/24 adjusted**
  (adjusted wins on attempt 5 and attempt 6; 2 improved-only pairs,
  0 control-only wins). No serious claim about human-player win rate.
- Mean first-encounter HP lost: **57.02% → 50.42%** across repeated
  attempts, paired average change **−6.62 percentage points**. This
  describes observed first-fight attrition, not a promise of later scaling.
- Boss encounters across attempts **21 → 30**, total earned equipment
  drops **73 → 107**, mean earned XP per account **226.96 → 287.13**,
  and mean talents owned **1.46 → 1.79**. These are downstream
  consequences of changed survival and choices; drop probabilities,
  talent math and general balance code were never changed.
- Critically, after six E1 attempts (or on earlier victory), each account
  still had on average **2.75 of 3 original starter items** in control and
  **2.54 of 3** in the experimental arm. The deterministic decision
  agent **did not reproduce** the user's experience of replacing multiple
  starter items and progressing strongly after four or five expeditions.

**Design conclusion:** The modest starter adjustment measurably reduces
opening attrition, and its effect is isolated to starter item definitions,
but it is **not yet authorized to become gameplay**. The experimental
items can remain equipped longer than expected. Calibrate the simulator's
equipment/merchant/crafting/route decisions against observed human progression
before evaluating whether the slight early buff becomes too strong by attempt
4–5. Avoid changing enemy, loot, talent, health-regeneration or persistent
hero coefficients on these results alone.

Full report: artifact `stage5-starter-gear-comparison` in the workflow run;
contains complete account histories, concise paired summary, exact source
hashes, and evidence of unchanged native loot.

