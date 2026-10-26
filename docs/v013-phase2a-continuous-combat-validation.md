# Wanderer v0.13 Phase 2A — Continuous Combat & Gauntlet Prototype

**Status: NOT READY for wider use.** The prototype is technically isolated and its reward checkpoint tests pass, but the paired simulation shows a substantial survival loss above E1. Keep it available only in the local private preview while encounter pacing and risk are reviewed. No human fun test has been performed.

## Workspace safety and baseline

- Branch: `development`.
- Starting HEAD: `b3fda244efe11e89f8bdcac8819a7ae0aa5c2efe` (`b3fda24`).
- At start the working tree was clean; the local branch had 27 commits ahead of `origin/development` (`8fa391c68058bea81df4c7bdb0711d1c07800dd7`). No merge, reset, rebase, push or remote write was performed.
- A persistent Git bundle was created and verified before engine edits: `/workspace/.wanderer-backups/wanderer-development-phase2a-b3fda24.bundle`. It contains the original development HEAD and remote history; SHA-256: `466ba87a39975b84a30fa7ad2435677c0573ec5e9b80499b0511b824a26dfcaf`.
- No main branch, Firebase Rules, deployment, production account, or real save was changed or accessed.
- Baseline test artifacts are retained in `/workspace/.wanderer-backups/phase2a-baseline/`.

### Existing combat baseline

Before implementation, a fixed synthetic E1 three-Wave encounter was timed in a real browser at all three speeds. The enemy and game clock were identical at every speed; the wall time changes with playback speed.

| Speed | Game combat time | Wall time incl. two 650 ms Wave gaps | Kills | Damage dealt / received |
|---|---:|---:|---:|---:|
| 1× | 7.04 s | 8.388 s | 3 | 289 / 9 |
| 2× | 7.04 s | 4.853 s | 3 | 289 / 9 |
| 4× | 7.04 s | 3.061 s | 3 | 289 / 9 |

Per-Wave game time was 1.76 s, 2.64 s and 2.64 s; the two transition callbacks each added 650 ms. This fixture recorded 8 player attacks, 1 block, and no passive or Legendary procs, healing, or Barrier.

The pre-change repository baselines also passed: 384 unit tests, 4 preview tests, the browser suite, the assets check, 174 v0.12 simulations with no timeouts, 10,000 map simulations, and 10/10 Firestore/Auth Emulator tests. The final regression results appear below.

## Architecture implemented

- Added `combat/v013-gauntlet.js`, a versioned, deterministic checkpoint model with stable mob IDs, per-mob kill IDs, a Realm checkpoint ID, and idempotent reward-award IDs.
- The feature gate accepts only `?gauntlet=8`, `10`, or `12` when `PHASE1_PREVIEW` is enabled and the hostname is localhost/loopback. Ordinary local play, remote hosts, and production remain on the original Wave combat path. Elites, Bosses and Events do not enter Gauntlet.
- Existing enemy generation is reused. Each micro-enemy samples one of the Realm's original normal Wave stat rows cyclically (`1…Waves`, then repeat). No mob HP or attack multiplier was added. The measured sample used 74–7,421 HP and 13–1,458 attack across tiers and sampled enemy roles; each individual stat row remains an existing `enemyFor` result.
- The player attack clock, cooldowns, HP, Mana, buffs, player debuffs, and encounter-level DoT clock carry across kills. Enemy-targeted DoTs and target-bound Legendary marks are scoped to the old enemy and are cleared/reset by the existing enemy reset path. Incoming attacks and VFX continue through the existing engine.
- Each mob checkpoint persists the current RNG position and item-ID counter along with the live enemy/run state, preventing refresh from replaying future seeded outcomes or IDs.
- `mobKill` invokes per-kill passive effects with a stable kill key. `Second Breath` remains a once-per-encounter checkpoint effect. `Last Stand` remains once per Expedition. The current Legendary `legendaryKill` hook is empty; other Legendary effects continue through their existing attack, hit, healing, and defense hooks. The existing v0.12 Legendary suite covers all 12 current IDs and passed; this A/B loadout matrix observed procs from seven IDs, not all twelve.
- A completed Gauntlet emits exactly the original selected Realm's Wave reward budget. Gold, Fragments and loot are rolled once for each original reward slot, independent of whether the player killed 8, 10 or 12 enemies. Incomplete/dead checkpoints do not issue the final Realm budget. Deterministic award keys prevent replay, and the per-mob active run is persisted before combat advances to the next enemy.
- Save schema version remains unchanged; the active Gauntlet data is an optional version-1 local experimental substate. Validation bounds the count, index, kill IDs, reward IDs, enemy identity, resources, and serialized size.
- The existing arena shows `Realm X · Enemies n/N`; a compact `Continuous combat · one enemy at a time` status replaces a redundant enemy counter. No second combat panel or inter-kill popup was introduced.

## Paired A/B simulation

Command: `npm run simulate:v013-gauntlet -- test-results/v013-phase2a/simulation.json`.

The integrated native runtime was ticked at 110 ms game-time increments. There were 70 paired seeds per tier and affinity, six tiers (`E1`, `E10`, `E20`, `E50`, `E100`, `E200`), six affinity starter builds, and four arms (baseline, 8, 10 and 12). This produced **10,080 normal-Realm encounters**, 2,520 per arm, with matching tier, affinity, seed, equipment roll and starter passive across arms. An offer seed was selected only when the first encounter was a normal Combat node, since Gauntlet intentionally excludes Elites/Events/Bosses. Synthetic profiles only; no account or save storage.

| Arm | Completed / 2,520 | Avg. kills | Avg. combat time | Avg. old transition time | Avg. DPS | Avg. received damage | Survival rate | Gold / Fragments per completed Realm* |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline Waves | 2,494 | 1.97 | 5.76 s | 0.64 s | 742.8 | 435.5 | 99.0% | 70.8 / 33.3 |
| 8 micro-enemies | 1,608 | 6.99 | 19.91 s | 0 s | 746.0 | 1,268.8 | 63.8% | 68.6 / 32.2 |
| 10 micro-enemies | 1,201 | 8.01 | 22.65 s | 0 s | 745.6 | 1,377.2 | 47.7% | 66.5 / 31.3 |
| 12 micro-enemies | 928 | 8.79 | 24.66 s | 0 s | 745.2 | 1,436.8 | 36.8% | 64.0 / 30.1 |

\*Reward averages are conditional on successful Realm completion. They are not multiplied by the micro-enemy count; small differences come from paired combat runs consuming RNG differently and from the subset of completed runs. At E1, all arms completed all 420 samples; Gold per completed Realm was 8.8 baseline, 8.9 at 8, 8.9 at 10 and 9.0 at 12; Fragments were 3.9, 4.0, 4.0 and 4.1. Each completed Realm used the original selected Wave count for reward slots. No duplicated item IDs or checkpoint timeouts were observed.

Survival by tier is the main blocker:

| Tier | Baseline | 8 enemies | 12 enemies |
|---|---:|---:|---:|
| E1 | 100% | 100% | 100% |
| E10 | 100% | 77% | 38% |
| E20 | 100% | 55% | 15% |
| E50 | 98% | 43% | 15% |
| E100 | 98% | 48% | 21% |
| E200 | 98% | 60% | 32% |

DPS stayed close to baseline, which confirms that the longer encounter came from more existing enemy targets rather than higher damage output or inflated per-mob HP. Total damage received rose about 2.9–3.3× in the Gauntlet arms. Mean healing per case rose from 0.3 baseline to 1.6/2.0/2.2; Barrier generated rose from 24.6 to 55.7/60.3/63.5. These defensive mechanics did not offset accumulated incoming damage at higher tiers.

### Affinity/passive and Legendary telemetry

Observed passive activations across all samples (the simulator chooses one affinity starter passive per matched build):

| Arm | Bleeding Edge | Toxic Touch | Deep Winter | Overcharge | Kindling |
|---|---:|---:|---:|---:|---:|
| Baseline | 808 | 664 | 541 | 590 | 493 |
| 8 | 1,495 | 1,155 | 1,761 | 699 | 1,603 |
| 10 | 1,333 | 1,001 | 1,795 | 524 | 1,534 |
| 12 | 1,138 | 910 | 1,854 | 462 | 1,290 |

Telemetry recorded procs from Tempest Talon, Voidglass, Crimson Fang, Verdant Oath, Gravewake, Kingsbreaker and Astrafall. Their counts increased with attack volume, but the matrix equipped Legendary weapons only in a subset of seeds and is not an exhaustive validation of every Legendary with every build. Existing v0.12 Legendary effect tests, passive tests, DoT tests and the new Second Breath checkpoint regression passed.

## Browser, save and visual validation

- The full `npm run test:browser` suite passed, including the Gauntlet browser test at 390 px and 1280 px, 1× and 4×. The focused final run measured the first micro-kill at 3.65–3.85 s at 1× and 0.59–0.83 s at 4× across those viewport pairs. A prior baseline first kill took 1.773 s at 1× and 0.440 s at 4× in its fixed fixture; fixtures differ, so this is a pacing warning, not a strict paired timing result.
- The browser test reloads after the first micro-kill and checks the same mob ID/index and unchanged checkpoint rewards, then opens a second isolated synthetic tab and checks it cannot inherit or alter the active run. No Firebase SDK or remote Firebase request is made.
- Background behavior was tested by setting the test page visibility state to `hidden` and back to `visible`: combat ticks pause while hidden and resume after visibility returns. Chromium did not report a visibility change merely from focusing a second headless page, so this validates the runtime visibility guard rather than OS-level tab scheduling.
- The runtime unit test round-trips a synthetic mid-Gauntlet save, checks the same mob and HP resume, and finishes without duplicate reward keys. The browser verifies reload during combat. Death between micro-enemies, background-tab reload, and simultaneous edits from two real browser windows remain not tested.
- Event non-combat flow, required reward drafts, full-Bag extraction, map interaction, mobile/desktop combat layout, and existing VFX/effect routing all passed their browser/regression suites. No popup appears between micro-kills.
- Human fun testing and physical-device testing are **NOT TESTED**. The prototype currently starts with E1 and normal Combat-only route samples in its dedicated browser test.

Screenshots from the local synthetic preview:

| View | 1× | 4× |
|---|---|---|
| Mobile 390 px | [mobile-390-1x.png](v013-phase2a/screenshots/mobile-390-1x.png) | [mobile-390-4x.png](v013-phase2a/screenshots/mobile-390-4x.png) |
| Desktop 1280 px | [desktop-1280-1x.png](v013-phase2a/screenshots/desktop-1280-1x.png) | [desktop-1280-4x.png](v013-phase2a/screenshots/desktop-1280-4x.png) |

## Final checks

| Check | Result |
|---|---|
| `npm test` | **PASS** — 391/391 |
| `npm run test:preview` | **PASS** — 4/4 |
| `npm run test:browser` | **PASS** — complete existing suite plus Gauntlet browser matrix |
| Focused Gauntlet browser | **PASS** — mobile/desktop × 1×/4×; reload, isolated tab, no Firebase, no popup |
| `npm run test:assets` | **PASS** — 29 VFX PNGs and mappings |
| `npm run simulate:v012` | **PASS** — 174 cases, 0 timeouts, 61 wins |
| `npm run simulate:v013-map` | **PASS** — 10,000 maps, 343,506 paths, 9 topologies |
| `npm run test:rules` | **PASS** — 10/10 local Auth/Firestore Emulator checks; no Rules changes/deploy |
| Gauntlet paired simulation | **PASS** — 10,080 cases, 0 harness timeouts; high-tier survival gate does not pass for rollout |
| `git diff --check` | **PASS** |

The first full unit run exposed a baseline regression: the extracted reward helper rechecked an idempotency token already validated by the normal Wave caller, rejecting ordinary Wave rewards. The helper now trusts that caller's completed check only in the baseline path; the Gauntlet path still validates its per-checkpoint reward IDs. A separate baseline guard test and the final 391-test run pass. The first parity run also caught a Gauntlet kill key leaking into normal-mode passive telemetry; normal combat now leaves that optional key unset, and the deterministic v0.12 runtime digest suite passes.

## Files changed

- `combat/v013-gauntlet.js` — local experiment gate, stable mob/checkpoint IDs and idempotency model.
- `combat/v012-combat-runtime.js` — Gauntlet kill/checkpoint context; baseline kill-key behavior preserved.
- `combat/v012-buildcraft.js` — per-mob kill dedupe and checkpoint-only Second Breath.
- `online/v012-expedition-runtime.js` — local-only start, continuous sequential targets, one original reward budget, save-before-next-mob, Realm completion reuse.
- `online/v012-persistence-runtime.js`, `online/v012-save.js` — optional bounded synthetic active-run persistence and resume.
- `index.html` — module wiring and compact progress indicator.
- `tests/v012-economy-harness.cjs`, `tests/v013-gauntlet-model.test.cjs`, `tests/v013-gauntlet-runtime.test.cjs`, `tests/v013-gauntlet-browser.cjs` — synthetic model, reward/idempotency, reload, isolation, UI and visibility coverage.
- `scripts/v013-gauntlet-sim.cjs`, `package.json` — paired integrated-engine simulation command.
- `docs/v013-phase2a/screenshots/*.png` — four representative local preview captures.

## Remaining blockers and recommendation

The prototype demonstrates more enemy kills and longer uninterrupted combat without increasing individual mob stats or multiplying the reward budget. However, the observed survival rate falls to 15–60% in many E10–E200 Gauntlet samples, compared with 98–100% in the baseline. It also has not had human playtesting, and the first-kill browser time at 1× was slower than the separate baseline fixture. Do not treat longer duration as proof of fun or balance.

**Recommendation: NOT READY for release, wider preview, or use on the production branch.** The local-only 8/10/12 experiment can remain for controlled human testing; any broader next step should first review lower-risk stat distributions and confirm that encounter rewards, recovery, and survival remain acceptable. No simultaneous-enemy feature is implemented.

Local commits:

- `461d9b0` — `feat: add local sequential gauntlet combat prototype`
- `c160fb9` — `test: validate gauntlet checkpoints and paired combat`
- A documentation/screenshots commit is recorded with this report.

The branch still includes its original 27 unpushed commits plus these local Phase 2A commits. No push was made.
