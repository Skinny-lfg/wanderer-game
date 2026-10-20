# Wanderer v0.12 — complete integration report

Date: 2026-10-20. Branch: `development`. **Release recommendation: NOT READY.** The requested functional integration is implemented locally; balance, inherited regression failures and production persistence remain release gates. No deployment, Firebase changes or real-player migration was performed.

## Scope and implementation

The native `index.html` combat/economy remains the foundation. Remote development through `544ae86` was merged, preserving its 63 passives, existing assets, CSP fixes and older event/checkpoint implementations. The repository backlog/handoff and AGENTS guidance were consulted; the directly authorized batch supersedes provisional backlog notes. The Google document export was unavailable; its repository mirror supplied the detailed reference.

- **Combat/buildcraft:** family possession alone no longer enables player Bleed, Poison/Rot, regeneration or elemental effects. Learned initial passives still work; native enemy/weapon effects remain independent. All 33 normal and 30 hybrid entries retained. Hybrid pair uniqueness, three-hybrid cap and Realm 6/8/10 availability enforced for new builds. Deep Winter, Withering Hex, Adrenaline/Sanguine Fury/Reaper’s Cadence, Crimson Pact, DOT conversions, Fervent Life, Life Conduit and Hex Bolt were adapted without reviving v0.12 gear sets. Consumed DOT conversions pay their remaining damage. Spellblade, Arcane Echo and Spell Surge interactions retained.
- **Lightning:** funded casts generate player Static; four charges discharge at `32% × Spell Power × Overcharge scaling`, subject to the existing enemy-health cap. Charges persist across Waves/Realms/events/checkpoints and clear at Expedition end. Free echoes do not generate charges. UI shows player charges. Telemetry records funded casts, actual HP damage and successful passive activations; statistical passives report exposure rather than fabricated procs.
- **Events:** new version-2 calendars have 15 Realms, three or four noncombat events, unique categories/IDs, guaranteed Elites and an untouched final boss. All sixteen named events have resource/item/passive/vital/buff transactions, displayed costs and saved choices. Declining gives no automatic combat-equivalent resources. Oracle changes an eligible future offer; Bounty affects the next Elite; Collector/Artificer act on real bag items. Missing prerequisites have explicit fallback choices. Soul Mirror replaces a noninitial passive with a saved eligible alternative; it does not remove the initial passive.
- **Shops/potions:** Blacksmith retains native equipment/Gold rerolls; Forge stays separate. Apothecary has four independent offers/rerolls, including Health and Mana. Eight owned, stacked consumables use a separate validated model. Load up to three bottles; no free two-plus-two supplies. Fortune is consumed at entry, is nonstacking, and multiplies probabilistic equipment drops by 1.25 only. Three-combat buffs count completed combat Realms, not events/Waves. Unused bottles return once on victory/extraction; death forfeits them. Prices remain provisional.
- **Flow:** initial affinity/Magic Back cancels preparation without spending bottles or recording defeat. Realm completion opens a mandatory passive popup, then restores the completed combat/log/rewards view; explicit Exit goes Between Realms. No new passive after Realm 15. Three shared rerolls persist through the whole Expedition; boss offers cannot reroll. Equipment changes are restricted to preparation, with six-item loot bag/manual overflow handling and native slot/two-hand comparisons. NEW clearing affects flags only.
- **Realms/rewards:** exactly twelve new-run thematic Realms, two per family. Classic Frostbound Catacombs/Obsidian Quarry retained. Boss variant is selected and saved at generation; the single final card leads to the corresponding native boss mechanics. Every new E1–E200 victory offers three existing-type Runes, choose one permanently; no death/extraction Rune. Actual Expedition Rune tiers validate; old unmarked decade-tier Runes and classic values remain supported. A full 300-Rune inventory blocks claim without losing the pending offer.
- **UI:** scoped Character/Between Realms five-left/five-right equipment layout; approved homepage layout retained. Affinity headings/difficulty labels, comparisons and read-only combat bag reuse current components/art. Player/enemy statuses remain separated. No new images, full redesign or dependencies.

## Compatibility and safeguards

`online/v012-save.js` preserves version-12 profiles with optional validated integration metadata. Profiles without potion/Belt fields remain accepted. Consumable ownership, settlement, reroll budgets and pending Rune choices validate. Native classic set/weapon behavior is feature-gated separately from v0.12. Old calendars resume through `online/v012-legacy-controller.js`; they are not silently rewritten to the new event/reward schedule. New Expeditions use calendar version 2.

Refresh coverage includes Static, passive review, saved event roll, fixed boss, Rune claim and unused-bottle settlement. Two simultaneous browser tabs sharing an isolated validation slot cannot both obtain its write lease. These are client integrity protections, **not server-authoritative anti-cheat**. Synthetic preview slots never access production/classic save keys; a sentinel classic key remained unchanged. Cloud-account migration and server validation were not exercised against real accounts. No irreversible migration was applied.

## Verification

- **PASS: 81 targeted tests**, zero failures: complete combat/schedule/events/potions/flow/Runes/compatibility, buildcraft, legacy controller/events, lifecycle/economy, save/model and private-preview checks.
- **PASS: Chromium 390×900 and 1280×900**, complete 15-Realm UI cycle: purchases/loadout, affinity/Magic Back, Static/checkpoint, event refresh, popup/review/Exit, shared rerolls, overflow, saved single boss, E1 Rune selection, reload without duplicate Rune/Gold/bottles, five/five slot coordinates, second-tab exclusion and no uncaught JS errors. This functional fixture forces Wave completion; it is not a win-rate simulation.
- **PASS: Evasion browser regressions**, both widths: native DODGE/log, no on-hit effects, item/stat display, isolated saves.
- **FAIL: `npm test`**, stopping at `tests/gear-balance-smoke.cjs`, assertion “weights sum to 100”. Current inherited equipment weights include Belt and sum to 113; the sampler normalizes relative weights. No unrelated drop formula was changed to satisfy the old assertion. Subsequent commands in that chained suite therefore did not run. Older v0120 tests also retain superseded nine-item/free-potion/per-card-reroll expectations and are not a green release signal. Do not equate focused passes with a passing full suite.

Reproduce focused tests:

```sh
node --test tests/v012-complete-*.test.cjs tests/v012-buildcraft.test.cjs tests/v012-expedition-controller.test.cjs tests/v012-events.test.cjs tests/private-preview.test.mjs tests/v012-save.test.mjs tests/online-model.test.mjs tests/v012-lifecycle.test.cjs tests/v012-economy.test.cjs
node tests/v012-complete-browser.cjs
node tests/v0120-evasion-browser.cjs
node scripts/v012-complete-sim.cjs /tmp/v012-results.json
```

## Integrated simulations

174 bounded synthetic RAM runs used native `updateFight`, weapons, enemies, rewards, events and potion transactions; **zero timeouts, 59 victories**. Raw data: [v012-complete-sim-results.json](v012-complete-sim-results.json), including source SHA256, seeds, weapon/armor/rarity, outcomes, late Waves, DPS, resources, picks and per-passive activation/exposure. Each enemy has a 5,000-tick safety bound. No production storage/network is involved.

The primary matrix is 108 runs: E1/2/10/50/100/200 × three gear tiers × six affinity strategies, rotating seven weapons/three armor types, Rare/Epic and some Legendary weapons; higher tiers include previously earned-tier Runes. Other groups must not be pooled into gear comparisons.

| Gear tier / Expedition tier | Wins / 36 | Mean combat seconds | Mean net Gold | Mean Fragments | Mean gear found |
|---|---:|---:|---:|---:|---:|
| 0.75 | 12 | 41.2 | 55.6 | 134.8 | 5.3 |
| 1.00 | 19 | 52.1 | 414.1 | 268.5 | 8.5 |
| 1.25 | 26 | 55.3 | 484.5 | 328.9 | 9.1 |

Primary wins by difficulty: E1 **18/18**, E2 **17/18**, E10 **7/18**, E50 **4/18**, E100 **5/18**, E200 **6/18**. Times exclude human decisions; losses shorten runs. Gold includes native rewards less purchased bottles; profiles were prefunded, so these are **not longitudinal affordability results**. Found gear includes subsequently discarded/lost items, not six retained items.

Twenty-four matched Lightning comparisons (E50/E200 × Staff/Wand/Sword × current/25%/40%/legacy65% burst) produced 19 Static discharges per new variant versus nine legacy bursts. Mean DPS was 729.9/729.9/730.0 versus 724.1. All these particular builds lost; caps, short fights and weapon/armor choices limit conclusions. Keep 32% provisional, not certified balanced.

Six paired Fortune runs found identical gear counts with/without Fortune: 13 at E1, two at E50, four at E200. Extra potion costs were 48/294/1050 Gold. This small sample cannot measure a probabilistic 25% relative improvement; guaranteed drops correctly remain unchanged. A further 36 matched affinity/weapon cases and per-passive telemetry are included in the artifact. Coverage is not exhaustive across every passive/Legendary combination, all event options or independent random seeds.

## Remaining release gates / incomplete validation

1. Repair obsolete full-suite contracts and run the remaining suite; inherited failures are disclosed, not waived.
2. Calibrate late-Expedition survival, weak/strong affinity matchups, potion affordability, crafting/resource sinks and guaranteed Rune accumulation across sequential campaigns. No blanket affinity buff was inferred from confounded pooled results. Crafting/reroll cost sweeps and full long-term economy simulations remain incomplete.
3. Extend browser coverage to death/extraction bottle settlement, every event alternative, adversarial double clicks and cross-tab takeover/recovery. Current E1 full-cycle browser proof plus unit E1–E200 Rune tests does not prove every high-tier UI path.
4. Audit all 63 passive interactions using broader native-engine seeds and Epic/Legendary combinations. Catalogue retention and individual fixes are not a claim that every passive is balanced.
5. Production cloud migration, authoritative shared leaderboard and release configuration need a separate approved staging/release pass. No Firebase rule change is proposed/applied in this batch. Existing anti-restore protections remain; do not switch production persistence solely on these preview tests.

## Files and commits

Implementation: `index.html`; `combat/v012-buildcraft.js`; `online/v012-expedition-controller.js`, `online/v012-legacy-controller.js`, `online/v012-expedition-events.js`, `online/v012-consumables.js`, `online/v012-save.js`, `online/v012-phase1.css`; generated `online/pvp-stats.mjs` and its dependency extractor `scripts/build-pvp-stats.cjs`. Validation: `tests/v012-complete-*`, targeted buildcraft/economy/controller/lifecycle fixtures and `scripts/v012-complete-sim.cjs`. Existing `online/v012-events.js` remains for legacy runs. Exact file history is available through the commits below.

- `cd0a56b`: passive gates and Static.
- `f8ac342`: sixteen events and global rerolls.
- `08f7c46`: owned potions/independent Apothecary.
- `ba4bc2f`: passive popup/checkpoint flow.
- `b4f6172`: real-tier Runes, bosses and classic isolation.
- `fa1e6cb`: merge existing remote development work, preserving 63 passives and legacy checkpoints.
- `0cf7da7`: integrated combat/save regressions, telemetry, responsive equipment and compatibility fixes.
- The following documentation/simulation commit contains this report, runner and raw results; its hash is returned in the delivery message.

## Manual preview

On development, run `python3 -m http.server 8080 --bind 127.0.0.1`, open `http://127.0.0.1:8080/?expeditionPhase1=1&expeditionSave=1&validationSlot=manual-complete` in an isolated browser profile. Use browser device emulation at 390 px and desktop at 1280 px. Buy/load bottles in Camp, verify Back, enter Magic/Lightning, complete a Realm, pick a passive, review logs then Exit. Confirm bag/gear/potions and shared rerolls Between Realms, event decisions after refresh, boss variant stability and single Rune settlement. Use a new validationSlot for independent synthetic sessions; do not import real saves. Nothing was deployed or published to main.
