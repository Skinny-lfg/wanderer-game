# Wanderer v0.13 — Balance Simulator v2

**Scope:** native deterministic combat/Expedition harness in `scripts/simulate-progression.cjs`. This replaces the former **Rift-only Boss comparison** and groups the current six Affinity Bosses, modern minion/escort abilities, Elite special abilities, permanent Talent Tree v15, Stage 7 resources and real Dungeon Conditions.

**No gameplay formula is reimplemented.** The script invokes `tests/v012-economy-harness.cjs`, which loads the actual HTML combat, enemy roster, Stage 8.0–8.4 modules, Boss preparation, Conditions and Stage 7 economy inside a synthetic session with a deterministic RNG. Stage 8.5 animations are deliberately excluded from simulation: their visual effects do not deal damage.

## Run small, targeted checks

Run these from the repository root with Node.js 22:

```sh
# Fast correctness tests; do not start a large balance sweep.
npm run test:v013:balance

# Six real Boss identities — one randomly generated, compatible Dangerous Realm per affinity.
npm run simulate:v013:bosses -- --levels=15 --seeds=9101,9102 --builds=blood-fury --risks=1 --out=reports/boss-baseline.json

# Compare active target switching and its effect on Blood Thralls, Storm Nodes and Brood.
npm run simulate:v013:bosses -- --levels=15 --seeds=9101,9102 --builds=blood-fury --risks=1 --target-policy=mechanics --out=reports/boss-counterplay.json

# Normal groups of 3, 12 and 20 mobs (real Stage 8.0/8.1 roster and skills).
npm run simulate:v013:enemies -- --levels=15 --seeds=9101,9102 --builds=aegis-vitality --out=reports/enemy-groups.json

# Elite encounters with the current set of elite archetypes (seed dependent).
npm run simulate:v013:elites -- --levels=15 --seeds=9101,9102 --builds=fury-bow --out=reports/elites.json

# Explore one actual three-card Dungeon per seed; take first discovered Boon and first offered Contract.
npm run simulate:v013 -- --mode=conditions --levels=15 --seeds=9101,9102 --builds=magic-decay --boons=first --contracts=first --out=reports/dungeon-choices.json

# A genuine E1-style account without fabricated permanent Talent points:
npm run simulate:v013:bosses -- --levels=1 --seeds=9101 --builds=blood-fury --points=0 --out=reports/e1-zero-talents.json
```

Do **not** use `scripts/v012-*-sim.cjs` for v0.13 balancing. They remain in the repository only for historical regression and v0.12 support. Old scenario-specific scripts should not be deleted if production/v0.12 CI depends on them.

## Modern scenario modes

| Mode | What is actually tested | Important caveat |
| --- | --- | --- |
| `bosses` | All six Bosses — Aegis, Blood, Fury, Decay, Vitality, Magic — using current boss casts, summons, caps, death healing, defensive states, status and native modifiers | Deliberately moves a native Boss encounter to a first-ring test room; not full route difficulty |
| `enemies` | Native normal enemy composition/skills at `--group-sizes=3,12,20` | Controlled group size, not the naturally rolled room distribution |
| `elites` | Real Elite and escorts, their active abilities and summons | Elite archetype sampled by seed; verify exposure before estimating per-archetype balance |
| `bossmods` | Baseline plus each **compatible** modifier per selected Affinity Boss | Contradictory exclusions are not tested; old `g.bossId='rift'` injection is removed |
| `bossprep` | Baseline, Marked Elite, Reliquary cost and both | Preparation state and Boss placement are controlled, not earned during path exploration |
| `traits` | Native normal enemies with real encounter trait logic | Traits are injected for matched diagnostic comparisons |
| `dungeon` | One naturally generated Realm, shortest accessible route, continuous HP/MP, current rewards | This is not a complete 15-Realm/account-level campaign |
| `conditions` | All three real risk-tier cards for each seed, native Conditions and route costs | Observational outcomes; Condition, Boss Affinity and risk correlate |
| `encounter` / `both` | Compatibility modes for the existing regression suite | A focused comparison, not a complete balance survey |

### Scenario controls

- `--affinities=blood,decay,vitality,aegis,fury,magic` and `--risks=0,1,2` filter Boss scenarios.
- `--target-policy=focus|mechanics|adds` uses the live arena's equivalent target-change input. **Mechanics** prioritizes a Blood Thrall, Storm Node or the Carrion brood shield, but intentionally avoids feeding the Vitality Boss by killing Bloomlings.
- `--points=0..100` explicitly selects the fixed *synthetic* talent-point budget. **E1 starts with zero points.** The default 24-point debug build is not a natural E1 account. A legal partial build is constructed through the real `T.allocate()`; no made-up talents are granted.
- `--gear=current|previous`, `--rarity=Common|Uncommon|Rare|Epic`, and `--runes=true|false` change the native equipment configuration. Item and Rune generation still uses the real engine.
- `--boons=none|first` selects the first discovered Boon when a Shrine is reached, or skips it. `--contracts=none|first` optionally accepts the first native Contract and uses actual completion/reward settlement.
- `--group-sizes=3,12,20` is used with `enemies` mode. `--levels`, `--seeds`, and `--builds` control the matrix; a hard 3,000-case limit blocks accidental large runs. `--tick-limit` bounds individual encounters.

For Boss Affinity matching, the simulator searches up to 48 deterministic nearby seeds for an **actual generated Realm card** with the requested Affinity and risk. It never rewrites the card's family. Reports include both `seed` and `resolvedSeed` plus `seedShift`. **These shifted seeds are not paired A/B experiments.** Compare strategies with matching resolved seeds within a fixed Affinity, risk and build.

## Report v3 — fields to compare

Reports include:
- `sourceSha256` and `sourceModules`: SHA-256 of the HTML and native JS modules actually present in the repository, plus the simulator implementation.
- `assumptions`: point budget, gear quality, Boon/Contract choices, targeting policy and explicit simulation limitations.
- `bossAffinity`, `bossStyle`, `bossName`, `eliteType`, `risk`, `initialRoles`, `initialEnemies`, `peakVisibleEnemies`, `enemies`, `reinforcementsSpawned`.
- `bossSummons`, `bossHealing`, `bossWards`, `bossCastInterruptions`, `bossNodeDestroyed`, `bossArcanePulses`, `enemyAbilityCasts`, `eliteSummons`.
- Combat duration, timeouts, survival, damage dealt/taken, Barrier absorbed and Mana consumed.
- Natural Dungeon `goldNet`, `fragmentsNet`, `essenceNet`, `coresNet`, `talentXpNet`, `boonsTaken`, `contractId`, `contractReward`, route coverage and steps left.

Group statistics are separated by level, build, risk, Affinity and scenario rather than pooling the six Bosses. A scenario with an error or timeout is always reported explicitly — never counted as a clean defeat.

## Safe execution order

1. **Correctness checkpoint:** `npm run test:v013:balance`, the Stage 8.0–8.5 tests, native integration and browser regression. No massive stress on every PR.
2. **Small exploration:** 2–5 seeds, one level/build, a subset of Bosses and one targeting policy. Verify coverage, win/loss versus timeout and source fingerprint.
3. **Targeted balance cohorts:** expand to 30–100+ seeds per comparable `level × build × risk × boss × target-policy`; inspect life lost, fight duration, add survival and resource costs.
4. **Deep conditions stress:** run `node scripts/v013-stage5-stress.cjs --seed-count=24 --levels=1,15,50,200 --builds=all --out=reports/conditions-stress.json` **only when requested**, or manually dispatch the Stage 5 Conditions workflow.
5. **Human playtest:** check readable telegraphs, target-switch ergonomics, potion usage and enjoyment; simulator win rates alone are insufficient.

### Still outside automated balance claims

The current model intentionally **does not** optimize manual potion consumption, between-room equipping/crafting, merchant visits, nuanced target priorities or a full account campaign across 15 Realms and subsequent Expeditions. These are **not** asserted as tested. Potions, quests, gear and item drops still run in the underlying engine when relevant; the simulator simply does not automatically decide every player action. We can add those behavior policies in a later controlled checkpoint once the baseline passes.
