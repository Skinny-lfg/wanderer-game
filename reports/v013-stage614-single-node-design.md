# Wanderer v0.13 — Stage 6.14: legal single-node/rank ablations with repeated native seeds

**Canonical base:** `audit/v013-stage6`, Stage 6.13 checkpoint `ba7576559ad212def44ba8f2ff5d48f795dfea5e`.

## Research goal

Stage 6.13 held initial gear, opponent and RNG fixed but contrasted **entire talent allocations**. Stage 6.14 isolates the **one native-legal terminal node/rank purchase**: remove exactly one node from a valid current v15 plan, require the remaining state to pass the *actual* `WandererAutomaticTalents.valid` and then require `allocate` to re-add that same node.

**Critical points distinction:** Both arms have the **same synthetic XP and available point budget**, but the baseline has **one genuinely unspent point** and the comparison arm legally purchases exactly one additional point. Equal *spent* points would require swapping a second node, which would violate one-node isolation. Neither arm is claimed to have earned this XP naturally.

Invalid removal (required prerequisite/gate, wrongly truncated rank, mode requirement, or prepared ability) is rejected, not bypassed. Prepared ability and elemental mode must remain exactly equal in both arms. Replayed setup must match native gear fingerprint, initial opponent roster, resolved seed, conditions, Boss modifiers, fixed target-click policy and full Buildcraft background.

## Real test design

- Extract native-valid hypothetical TalentGraph allocations from the existing 48 strategic/route archetypes at point budgets **12/24/36/60**.
- Identify independent *legal terminal purchases* and deduplicate repeated identical Talent snapshots. Include native rank upgrades when they are legal, not only new abilities.
- Choose **24 distinct targets** with a strict 12 first-purchase nodes / 12 genuine rank-upgrade split, varying original Affinities, skill types and E-level budgets. This corrects an exploratory first selection that was heavily biased toward rank upgrades (22/24); that initial outcome sample is not the accepted final report. Candidate count and actual selected coverage are obtained from the engine, not guessed.
- Replay each target with **six independently seeded scenarios**; inside each seed, **both arms** hold all non-Talent settings equal. Across seeds, native item rolls and opponent rosters can vary; do not incorrectly describe them as identical across the whole cohort.
- Pilot: six target cases × three seeds = **18 actual pairs / 36 native fights**. Final selected matrix: 24 targets × six seeds = **144 actual pairs / 288 native fights**, contingent on CI.
- Use native `S.encounter`, actual AI, stats and game item affix generator. Target selection is a fixed `focus` policy, unlike the Stage 6.13 adaptive strategy, to reduce player-agent policy changes when Talents differ.
- Per-target cohort records wins, losses and discordant seeded pairs; actual barrier, healing, DoT, Mana, time and remaining HP deltas. Duration medians only among pairs where both arms win.
- Records unique native source fingerprint, module version, exact before/after legal nodes, original profile, rolled-gear fingerprint and exact matched enemy roster, with source/config-locked atomic resume.

## Interpretation

The isolated effect is adding **one legal node/rank to a fixed prior allocation**, at the cost of one previously unused point, in a controlled test battle. It is **not** an equally-spent swap, an organically earned late-game build or the effect of removing an entire prerequisite branch. The comparison is conditional on the rest of the build, the enemy and equipment; several non-overlapping combinations and larger seed counts are needed for generalization.

No win difference at six seeds is **not** evidence that a skill is ineffective. A node may alter actual damage/Barrier/Mana/DoT or require contexts absent from the small cohort. Neither 24 targets nor all eligible ablations constitute exhaustive legal tree coverage.

Do not use these synthetic one-node results as proof of player reachability or a global Boss win-rate. Stage 6.11 remains the evidence for *earned* E1 progression.

## Execution

- `npm run test:v013:stage614`
- `npm run audit:v013:stage614:plan`
- `npm run audit:v013:stage614:pilot`
- `npm run audit:v013:stage614:matrix`

**Merge gate:** Stage 6.14 dedicated tests, Stage 6.10–6.13 regression suites, native pilot and final matrix must all pass without invented stats, mismatched setup, unapproved node/element change, timeout or missing actual results. No balance coefficients, game assets, production `main`, saves or Firebase modifications.
