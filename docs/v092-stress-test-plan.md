# v0.9.2 stress test — Phase 1 of 4

## Baseline and scope

Audited **development `e399f7e`**, fast-forwarded from `db5ecb3` before inspection. It includes the latest early-speed catch-up, 13 affinities and 21 Legendary identities; the older v0.9.1 reports are not current balance measurements. No changes authored to `index.html`, gameplay, Firebase, dependencies or main. This is an audit and bounded harness validation, not a release recommendation.

## Formula map (production code in index.html)

| System | Functions/data to reuse | Current behavior |
|---|---|---|
| Equipment | `makeItem`, `elementPool`, `chooseSubtype`, `RARITY` | Power = round((2 + tier × .91) × rarity multiplier); Common/Uncommon/Rare/Epic/Legendary = 1/1.25/1.57/2.1/2.6. Subtype-specific stats and affinity attribute increments are generated together. Do not overwrite generated affinities afterward. |
| Handedness/sets | `isTwoHanded`, `setCounts`, `setBonuses` | Bow/Staff/Two-Handed reserve Off-Hand and count two affinity points. Cumulative 2/3/5 thresholds across 13 affinities. Rune families are unique and do not count toward sets. |
| Base stats | `totalStats` | HP = round(55 + END×12 + item HP); Attack = round(4 + STR×1.8 + AGI×.4 + item Attack); Defense = round(1 + END×.8 + STR×.3 + item Defense). Rune stats participate. |
| Speed/critical | `totalStats` | Base speed = (.78 + AGI×.032 + item speed×.046) × weapon multiplier. Staff catch-up max(0,.56−.25×base); Two-Handed max(0,.43−.25×base). Above 2.5 APS: 2.5 + excess/(1+.2×excess). Critical capped at 65%, with CHA, affinity points and bonuses divided by sqrt(max(1,raw speed/1.3)). |
| Main attacks | `weaponAttack` | Physical hit = max(1,round(Attack×factor)−enemy Defense). Factors: Sword 1, Mace 1.4, Bow 1.08, Daggers .72, Two-Handed 1.70. Staff/Wand paid casts use Spell Power×1.32/.77; matching magical Off-Hand ×1.30. Mana cost 13/9, physical caster fallback .55. Critical ×1.5, Perfect Strike ×1.75. Off-Hand Dagger has its own secondary hit and proc. |
| Mana | `totalStats`, `updateFight` | Mana = round(20 + INT×7 + item Mana); regen = round-to-one-decimal(1.5 + INT×.23); Spell Power = round(3 + INT×1.9 + item Spell). Regen runs each .11-second simulation tick. |
| Mitigation | `updateFight`, `setEnemyWeaken`, `setBarrier`, `setHeal` | Enemy hit before effects = max(ceil(enemy Attack×.24),round(enemy Attack×(1−min(.75,Defense/(Defense+enemy Attack×1.35))))). Shield block chance capped at 48%; reduction .58, or .67 with Mace. Barrier absorbs afterward; player Barrier capped at 30% max HP. Healing cannot exceed max HP; permitted overflow is separately capped. |
| Affinities | `applyAffinity`, `tickDots`, `setOnAttack`, `setCombatExpire` | Poison/Bleed/Burn potency derives from triggering hit; ratios .15/.18/.17, three ticks, at most 12 stacks. Additional proc mechanics, cooldowns and encounter/expedition limits execute in these same functions. Nature/Storm/Tide/Crystal are now present. Crystal is currently allowed on generic armor/accessory pools, not weapon/Off-Hand pools. |
| Enemies | `estimateEnemy`, `enemyFor`, `ELITE_ARCHETYPES` | Base HP/Attack/Defense = 27+14D / 4+3D / 1+.62D, with existing rounded wave and role multipliers. Wave 4: Tank/Berserker/Vampire/Caster. Boss styles rotate Guardian/Leech/Berserker. Enemy intervals are fixed per role; no Gear Power scaling. |
| Loot probability | `WAVE_TABLE`, `waveLootOdds` | Base gear-drop chance by wave: 18/28/42/80/100%. Conditional Legendary share: .1/.5/1/3/4%. CHA adds up to 6 percentage points to drop and redistributes up to 4 points of rarity probability. Boss extra gear roll: 35%. Conditional rarity is not unconditional drop probability. |
| Item category | `dungeonEquipmentOdds`, `dungeonEquipmentPick`, `rollEquipmentSlot` | Dungeon's favored categories receive 25/20/15%, others share 40%. Generic weighted slots are a separate path; two ring slots share one category weight. |
| Forge/Merchant/salvage | `rarityOdds`, `craftCost`, `merchantCost`, `saleFragments` | Generic base rarity odds 49/30/15/4.5/1.5%. Forge shifts odds with tier gap, has no normal Legendary roll; cost 10+10×tier. Merchant downgrades Legendary to Epic. Crafted salvage capped at 25% craft price; recovery starter yields zero. |
| Legendary | `LEGENDARY_CATALOG`, `legendaryFor`, `legendaryMatches`, `migrateItem`, `weaponAttack` | 21 subtype-compatible identities with stable `legendaryId`; selection occurs after rarity/slot/subtype. These are not 21 distinct combat powers. A Legendary main weapon has ×1.32 first-hit damage once per encounter; generated Legendary Sword also adds tier+4 Attack. Legacy gear remains usable; names/art are not authority for subtype or a unique proc. |
| Rewards/progression | `winEncounter`, `extract`, `die` | Four waves normally, fifth boss at multiples of ten. Base per-wave Gold roll(3,6)+floor(D×.5), Fragments roll(1,3)+floor(D×.24), with elite/boss bonuses. Extraction secures run rewards; winning at the highest unlocked tier increments progress by one, capped at 200. Early extraction does not unlock. Death retains only two selected protected equipped IDs; Stash, town currency and runes persist. Boss rune choice is a separate permanent reward. |

Exact rounded operations and limits must be called from production functions, not copied from this summary into a second engine.

## Reusable foundation and boundaries

**Use `scripts/simulate-v091.cjs::harness()` plus `scripts/validate-v091-builds.cjs::plan()`.** Despite their filenames, they load the current inline game script. The legal plan selects real generator results, including affinity-dependent stats. Combat RNG is separated from gear generation. Imports do not run the CLI matrices.

Only necessary additions in this phase:

- Expose existing loot, enemy-estimation, set, Legendary and salvage functions through the harness's existing `inspect` object. No duplicated formulas or new simulation engine.
- Fail before execution if the inline script/bootstrap cannot be uniquely identified. A changed production layout must not silently launch an unintended simulation.
- Add `test:stress:phase1`, an explicitly bounded smoke command.

| Capability | Fidelity / limitation |
|---|---|
| Per-expedition automatic combat, legal gear, enemy rolls, affinity cooldowns, first-strike Legendary | Production functions run in a Node VM with .11-second steps. Faithful to existing timer quantization, not a continuous-time DPS approximation. |
| Loot generation and run reward calculation | Actual `winEncounter` executes. Probability helpers permit analytical checks without large random samples. Forced rarity in a fixture cannot estimate rarity prevalence. |
| Build outcomes | Win, HP, duration, damage, rewards, casts/fallbacks and encounter stats are available. Damage includes overkill; successful rewards assume final extraction and omit selling valuables. |
| Speed modes | Same simulation step at different timer scheduling. Node can verify logical equality; browser throttling, tab visibility and real wall-clock reaction windows require Playwright. |
| Runes / themes | Production functions support them; current trial API starts with no runes and the first theme. Add only a small explicit fixture option later if needed. Do not claim exhaustive rune/theme coverage now. |
| Persistence, extraction policy, death losses, economy across runs | Trial stubs save/render and replaces death with a terminal status; it never calls extraction. It cannot validate actual item loss, unlock persistence, duplicate extraction or long-run farming by itself. Reuse dedicated gameplay/save tests instead. |
| UI, OAuth/cloud conflicts, competitive leaderboard | Not faithfully represented by this VM. Use disposable browser contexts and mocked Firebase/emulator suites later; never real saves. |
| Reproducibility | Seed, source revision, level, gear plan and elite must be recorded. Generated IDs/timestamps use wall time; normalize those only when comparing item snapshots. Shared RNG means outcome-dependent extra rolls can diverge between builds even with identical starting seeds. |

## Existing tests to reuse later (not all run in Phase 1)

- `tests/cumulative-set-combat.cjs`, `phase2-smoke.cjs`, `merchant-combat-balance.cjs`: effects, combat and gear mechanics.
- `tests/elite-archetypes-art.cjs`, `expedition-ui-smoke.cjs`, `v081-smoke.cjs`: enemies, catalog/assets, rune and expedition/progression flows.
- `tests/gear-balance-smoke.cjs`: loot/gear checks; includes 30,000 rolls, so excluded from this phase.
- `tests/online-save-compat.cjs`, `online-model.test.mjs`, `stress-save-gameplay.cjs`: save guards, economy and persistence; review loop counts before running stress scripts.
- `test:browser`, `test:recovery`, `test:assets`, `test:pvp`, `test:rules`: isolated browser/account/recovery/emulator boundaries for later phases.
- `tests/v091-balance.cjs`, `v091-legal-builds.cjs` and CLI `simulate:balance`, `validate:balance`, `compare:balance` include D200 and/or large matrices. **Do not run them or aggregate `npm test` in Phase 1.**
- Older `tests/combat-harness.cjs`, `scripts/simulate-affinities.cjs` and their dependent stress code use a synthetic three-encounter/reward-stub model and a separate affinity engine. They are not the authoritative full-expedition v0.9.2 simulator. `v091-final-eval.cjs` also compares altered in-memory formulas; it is not a current-game baseline audit.

## Findings requiring later checks, not fixes now

- `docs/v092-legendary-catalog-audit.md` retains historical statements about absent IDs/five random weapon names; its implementation notes and current source supersede them.
- Crystal tooltip wording and execution differ: tooltip describes every third *charged strike*, while `setOnAttack` checks every third main attack with a 10-second Burst cooldown. Record as a test target, not a balance conclusion or a fix in Phase 1.
- The smoke initially rejected an illegal Crystal weapon fixture. It was corrected to three compatible armor/accessory items; production affinity rules were preserved.
- Catalog membership checks do not demonstrate every Legendary identity's random frequency. Generic non-weapon Legendary names do not imply an implemented first-strike power on armor.

## Phase 1 validation completed

`npm run test:stress:phase1` — **PASS**:

- Eight expedition executions: four fixtures, each repeated with the same seed; D1 Sword and D10 Staff/Two-Handed/Wand. No D200 or Monte Carlo matrix.
- Deterministic normalized equipment/outcomes; valid affinities, finite metrics, no timeouts; Crystal 3-point fixture.
- Fifteen analytical wave/CHA probability checks, generic/Forge distributions, dungeon category normalization, four/five-wave rule and enemy wave scaling.
- 21 generated Legendary items checked against compatible catalog identities (not guaranteed coverage of every individual identity), cumulative Crystal flags, Forge salvage cap and a negative bootstrap-guard check.

`node scripts/build-pvp-stats.cjs --check` — **PASS**, no regeneration or edits.
No new dependencies, network game services, browser tests, Firebase operations or production writes were needed.

## Proposed phases 2–4 — not started

2. Bounded combat/loot study: legal mixed builds, partial sets, elites, each affinity and catalog distribution. Set sample budgets first; retain seeds/revision and compact aggregates. Investigate the Crystal wording discrepancy against actual triggers.
3. Progression/economy/save integrity: repeated extraction/death, protected gear, Forge/Merchant loops, rune persistence, legacy saves and cloud conflicts using existing isolated tests; report unsupported scenarios instead of expanding the VM into a browser replacement.
4. Browser/responsive regression and release report: mobile/desktop, tab/offline behavior, effects, recovery and emulator rules where available. Classify findings and request separate release authorization.

**Stop here.** This commit establishes Phase 1 only; it makes no statement about balance quality or production release readiness.
