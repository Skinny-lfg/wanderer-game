# Wanderer v0.9 — Phase 1 review

Implemented on `development`, based on `735830e`. No main merge, deployment, Firebase rule changes or live save migrations. Only Phase 1 is implemented. The approved numeric design is recorded in [the design addendum](design/v09-phase1-affinities.md).

## Changes and affected files

- `combat/affinities.js`: shared, deterministic tier definitions and runtime effects, independent of DOM and RNG. All nine affinities retain their 2-piece benefit at 3 and 5 pieces. Effects have bounded resources, cooldowns and expiry; damage procs do not create another hit or roll another affinity.
- `index.html`: production combat integration, explicit gained/lost thresholds in equipment comparisons, cumulative descriptions and affinity tooltips. Combat displays resources, durations, readiness, weakening and vulnerability in a reserved scrollable area. Existing automatic attacks and speed controls remain.
- `online/pvp-stats.mjs`, `scripts/build-pvp-stats.cjs`: public profile stats use the same set definitions. The generated module imports the engine rather than duplicating its definitions.
- `online/pvp.mjs`, `online/app.mjs`: practice uses the new 2-piece damage multipliers and explicitly states that its existing simplified simulator does not model dungeon mechanics/signatures. No currency transfers or competitive validation were added.
- `tests/affinities.test.cjs`, `tests/affinity-combat.test.cjs`, `tests/affinity-browser.cjs`: new mechanism, production-combat and browser regressions. `tests/combat-harness.cjs` runs the actual production combat with seeded RNG and replaces rendering, persistence and reward callbacks only.
- `scripts/simulate-affinities.cjs`: reproducible before/after comparison. Full results: [v09-phase1-simulation.json](v09-phase1-simulation.json).

No saved item attributes, IDs, rarity, Legendary powers or inventory schema are rewritten. Runtime state belongs to the current expedition. Existing interrupted-expedition recovery, account isolation and conflict handling remain unchanged. Bow, Staff and Two-Handed still reserve Off-Hand, and the reserved slot cannot contribute another affinity count. Death still loses unprotected equipped items; the two protected items remain protected.

## Validation

- `npm test`: four existing smoke suites plus 26 Node tests passed. These cover every affinity threshold and signature, cooldown/resource limits, no recursive charge generation, boss delay immunity, encounter resets, once-per-expedition Second Wind, legacy Legendary first-hit damage, two-handed restrictions, comparisons, protected equipment, extraction/progression and save compatibility.
- Deterministic production combat: nine affinities × six weapon builds × 1×/2×/4× produced identical combat outcomes and logs for the same seed. Wall-clock speed changes do not change simulated cooldowns.
- `npm run test:affinity-browser`: 1440px desktop and 390px mobile; nine cumulative sets, indicators, stable scene/status dimensions, comparisons, speed controls and no JavaScript errors.
- `npm run test:recovery`: 16 Guest/Google × local/cloud/both/conflict × desktop/mobile recovery cases passed, preserving owned equipment, resources, progression and original recovery copies.
- `npm run test:assets`: desktop/mobile images, rarity independence, nine animation paths, reduced motion and stable layout passed.
- `npm run test:pvp`: profiles, equipment/stats/sets, player search, practice battles and unchanged saves passed at 1440px, 390px and 320px.
- `npm run test:browser`: account creation, cosmetics, local-to-account migration, automatic synchronization/rankings, conflicts, retry and returning accounts passed at 1440px, 390px and 320px.

Firebase browser tests use the existing mock boundary. They are not live OAuth, Firestore security-rule or production connectivity tests. No live account data was accessed or modified. Chromium mobile viewports are not a physical iOS Safari test.

An old browser test expected duplicate authentication callbacks to reload an already restored account, contradicting the existing recovery fix. It now uses an actual page reload to exercise failed profile reads and newer cloud-save recovery. Duplicate-event suppression remains covered by the recovery suite. The default browser test port was also aligned with the other suites (8012).

## Before/after balance sample

Command: `npm run simulate:affinities`. Baseline: `735830e`. Each version runs 5,400 three-encounter expeditions: D10/20/30/40/50 × Sword+Shield, Mace+Shield, Two-Handed, Daggers+Off-Hand Dagger, Staff, Wand+Orb × nine affinities × two layouts × ten seeds. Staff cannot equip an Off-Hand under the existing restriction.

Rare gear is generated at 80% of dungeon tier. The same seed produces the same item stats for each layout. Only five equipped items receive affinities; other equipped pieces have none. The hybrid is 3 primary + 2 Critical; Critical primary uses 2 Regen. The route is the existing Poison biome. All three encounters must be won; HP, Barrier and mana carry forward. This is a controlled comparison, not an optimized-build or all-biome balance certification.

| Version | Layout | Full clears / 2700 | Mean total combat seconds, including failed attempts |
| --- | --- | ---: | ---: |
| Before | 5 pieces | 983 (36.4%) | 13.32 |
| Before | 3+2 | 968 (35.9%) | 12.95 |
| Phase 1 | 5 pieces | 874 (32.4%) | 13.22 |
| Phase 1 | 3+2 | 937 (34.7%) | 12.86 |

The hybrid remains competitive in this sample. Replacing escalating flat bonuses with conservative mechanics reduces aggregate clear rates, especially for some five-piece builds. No enemy statistics, boss formulas or gear generation were changed to offset that difference.

| Primary affinity | Five-piece clears / 300 | Hybrid clears / 300 | Five-piece signature events |
| --- | ---: | ---: | ---: |
| Poison | 81 | 95 | 45 |
| Bleed | 88 | 95 | 141 |
| Sunder | 48 | 59 | 110 |
| Critical | 58 | 62 | 71 |
| Shield | 120 | 137 | 3 |
| Regen | 155 | 115 | 198 |
| Fire | 77 | 89 | 11 |
| Frost | 138 | 149 | 248 |
| Dark | 109 | 136 | 47 |

During simulation, Heat's rate limit initially skipped some DOT ticks because a nominal one-second interval alternates between 0.99s and 1.10s with the existing 110ms combat step. Heat now grants at most once per combat-second bucket. A regression covers this quantization; Focus, Souls and Bleed speed retain their explicit minimum one-second interval.

## Outstanding limits and review points

- Fire and Shield signatures are rare with this sample's short encounters and under-tier gear. Sunder/Critical clear rates also merit playtesting. Approved numbers were retained; no claim of final balance across all possible builds.
- The practice PvP simulator remains simplified and does not execute 3/5-piece dungeon powers. Its result screen now states that limitation. Public profiles do show the actual dungeon set descriptions.
- Deep Freeze and Armor Shatter delay the existing basic attack timer. Enemy special windups/counters are Phase 4 work, not present here.
- Gear Power remains the existing coarse stat estimate, not a simulation of signature value.
- New active weapon controls, new Legendary/armor identities, enemy phases and the broader combat UI redesign remain outside Phase 1.
