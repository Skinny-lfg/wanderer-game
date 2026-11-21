# Wanderer v0.13 — Stage 6.15: direct native Normal / Elite / Boss hierarchy audit

**Completed:** 2026-11-21  
**Starting canonical development checkpoint:** `audit/v013-stage6`, `2a1abfdfb87724392bb6e264e9978ebeb7d59273`  
**Scoped development PR:** https://github.com/Skinny-lfg/wanderer-game/pull/112  
**Native CI evidence:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44899211176  
**Native JSON + Markdown artifact:** `stage615-normal-elite-boss-384-matched-triples-1152-combats`  
**Real game source fingerprint:** `5b271f2e9bd8eeccd888db7426811db6794e4697cebfbf4a0331fcb8bffec921`

## Answer to the actual player concern

**YES — the Elite-to-Boss difficulty gap is large and widespread in a controlled same-player, same-native-gear, same-seed test.** With synthetic legal builds, each native matchup held the same TalentGraph points, weapon, armor, Off-Hand rolls, rare rarity, starting Realm, Risk 1 (Dangerous), E level, starting seed and focus targeting; only the enemy encounter class changed. Native opponents and their rosters necessarily differ by class. All 384 triples passed twelve strict player-fixture parity checks.

### Actual completed results

| Class | Actual wins | Sample | Conditional observed win percentage |
|---|---:|---:|---:|
| Normal room, native 3-mob group | **379** | 384 | **98.7%** |
| Native Elite | **346** | 384 | **90.1%** |
| Native Affinity Boss | **106** | 384 | **27.6%** |

**Elite minus Boss win difference: 62.5 percentage points**, with **240 matched cases** where the Elite was defeated and the same player then lost the Boss. **Zero** reverse cases where Boss was beaten but the same player lost the Elite. In 239/384, both Normal and Elite were beaten but Boss defeated that same player. This is direct controlled opponent-class evidence, not an unrelated mixture of builds or a Talent ablation.

## Per-Boss Affinity

Each row contains **64 actual matching triples**, 192 fights, spanning four synthetic E/point budgets, two legal source strategies and eight native seeded RNG starts per group.

| Native Realm / named Boss ID | Normal wins | Elite wins | Boss wins | Elite→Boss gap |
|---|---:|---:|---:|---:|
| Blood / `rift` | 63 /64 | 56 /64 | 13 /64 | **67.2 pp** |
| Decay / `carrion` | 63 /64 | 56 /64 | 11 /64 | **70.3 pp** |
| Vitality / `heartroot` | 63 /64 | 58 /64 | 28 /64 | **46.9 pp** |
| Aegis / `guardian` | 63 /64 | 55 /64 | 16 /64 | **60.9 pp** |
| Fury / `ember` | 63 /64 | 58 /64 | 24 /64 | **53.1 pp** |
| Magic / `stormglass` | 64 /64 | 63 /64 | 14 /64 | **76.6 pp** |

**Highest controlled gaps:** Magic, Decay and Blood. But note that Magic's very high gap is driven partly by exceptionally easy Elites (63/64), not simply the worst Boss win-rate; the absolute lowest Boss victories were in Decay (11/64).

## Per-level controlled budget (equal class comparison)

| Stage | Native legal points artificially available | Normal | Elite | Boss | Elite–Boss difference |
|---|---:|---:|---:|---:|---:|
| E5 | 12 | 91/96 | 63/96 | **0/96** | **65.6 pp** |
| E15 | 24 | 96/96 | 93/96 | **9/96** | **87.5 pp** |
| E35 | 36 | 96/96 | 94/96 | 40/96 | **56.3 pp** |
| E70 | 60 | 96/96 | 96/96 | 57/96 | **40.6 pp** |

The observed gap is **most severe relative to Elites at E15**, where advanced controlled characters beat virtually every Elite but almost no Boss. At E5, no tested build won any Boss. At E35 and E70, Bosses become more beatable, while Elites are almost universally defeated.

**Do not mistake controlled 12/24/36/60 Talent point allocations for actual naturally earned characters**; Stage 6.11 real E1 players reached at most eight earned Talent points in the separate campaign.

## Do enemy HP and attack explain the difference?

From the 384 exact same-player/native-seed class triples:

- Median ratio of initial native Boss versus Elite roster HP: **1.236×**.
- Median ratio of initial native Boss versus Elite roster attack: **1.465×**.
- Median actual player damage taken against Boss: **215.5**, versus Elite **141.5**.
- Normal rooms had a real Tank mob present in **199/384** generated three-mob groups; these are NOT isolated tank duels.
- Native Elites appeared with eight encountered `eliteType` labels (`ashen_executioner`, `berserker`, `briarspine_horror`, `caster`, `gravecaller`, `oathbound_exarch`, `tank`, `vampire`). Some labels are generic-role categories and should NOT be counted as eight dedicated unique Elite characters.
- The six real Boss identities were observed (one per Realm), not invented from a planning catalogue.

The win gap is substantially larger than the raw median HP or attack differences. **That is a reason to investigate abilities, summoning, shields, conditions and prepared/unprepared boss encounters — not mathematical proof that a particular ability is the cause.**

Native mechanism telemetry:

| Native Boss Realm | Actual Boss battles with summons | Observed summons total | Other key actual observed mechanics |
|---|---:|---:|---|
| Blood | 60/64 | 89 | 11 Frenzy triggers |
| Decay | 62/64 | 202 | 21 Boss pulse triggers |
| Vitality | 62/64 | 210 | Healing in 5 fights, 40 Boss pulse triggers |
| Aegis | 0/64 | 0 | Boss Wards in 32 fights, 43 Boss pulse triggers |
| Fury | 0/64 | 0 | 1 Boss pulse trigger; fast lethal fights common |
| Magic | 57/64 | 57 | 28 Arcane pulses, 14 Boss node destructions |

Across the study, **241/384 Boss encounters spawned additional enemies**. The native `enemyAbilityCasts` counter is not the same as Boss-specific pulse/summon/ward metrics (Boss native-specific mechanics have separate counters); do not mistake a zero generic caster count for no Boss abilities.

**Warning on combat duration:** Death can stop a very difficult Boss fight earlier than an easy Elite victory. Do NOT classify shorter Boss fights as easier.

## Essential methodological caveat: potential exaggerated Boss difficulty

This audit uses `S.encounter()` to stage all three real native encounters in an equivalent first-ring combat location. It **does not traverse the actual 15-Realm route**, collect natural loot, use potions or Boons, or earn optional Boss-preparation rewards. Therefore, this is **the difficulty of an unprepared controlled native Boss**. Actual final-Boss encounters with marked Elite preparation, Reliquary or other preparation may be easier. The direct Elite/Boss difference is real in this test fixture but must NOT be presented as the same percentage gap in naturally completed Expeditions.

The test uses **Dangerous risk** and **Rare gear** only, the native Focus targeting policy, and two real strategically constructed legal builds per Realm (one aligned and one cross-family). This is strong controlled class-level evidence, but not exhaustive across enemy Traits, all seven dedicated Elites, all six Boss variants/modifiers, every gear/weapon combination, Normal/Deadly risks, or all player strategies.

**No full-game balance changes or artificial combat multipliers were applied.** Recorded effects are native.

## Next decision before balancing numbers

**Do not immediately lower all Boss HP, increase all Elite damage, or apply one blanket modifier.**

Recommended narrow next research:

1. **Confirm Boss preparation gap** for the six Affinities: baseline unprepared versus correctly prepared native Boss in identical legal Talent/player/gear/seed contexts (check `bossPreparationEncounter` and original late-game rules). Measure how many lost fights could be turned into victories with natural preparation.
2. **Instrument individual Boss mechanics** with causal ablations only if the real Boss setup allows it: minion pressure, summons, Barrier/Wards, periodic damage, anti-caster/anti-DoT mechanics, and attack rates. Do not confuse the separate counters.
3. **Isolate Elite vs Tank/Normal group hierarchy** by observing genuine native Tank-heavy rosters, rather than assuming all Normal trios are equivalent.
4. Only then adjust each specific Boss/Elite's HP, attack, attack period and/or abilities, run multiple independent seeds, and verify no degradation of early E progression and later-game difficulty.

**Priority finding:** the Elite→Boss jump is genuinely very large in the controlled native sample, **especially E15**, while there is also a risk that E70 Elites are too easy relative to advanced builds. Investigate specific enemy mechanics and preparation first; no balance edits were made in Stage 6.15.

## Reproduction / CI

- `npm run test:v013:stage615` → **8/8** tests passed, including native actual matched triples and deliberate fixture corruption.
- `npm run test:v013:stage614:retest` **7/7**, `test:v013:stage614` **9/9**, `test:v013:stage613` **10/10**, `test:v013:stage612` **10/10**, `test:v013:stage611` **8/8**, `test:v013:stage610` **6/6** — all passed.
- `npm run audit:v013:stage615:pilot` → 96 actual matched triples / **288 native fights**, 96/96 controls validated.
- `npm run audit:v013:stage615:matrix` → **384 actual matched triples / 1,152 native fights**, 384/384 controls validated.
- Pilot is the **first two seeds of the eight-seed full study**, not additive independent evidence.
- Full raw detailed native fight data in CI artifact `stage615-normal-elite-boss-384-matched-triples-1152-combats`, including initial enemy roster stats, Boss/Elite ability metrics and battle outcomes.

No saves, AI/combat coefficient changes, player UI/art, Firebase, production `main` updates or deployments.

## Verified canonical integration checkpoint

- PR #112 was merged into the existing development branch `audit/v013-stage6`.
- The exact native-tested PR HEAD tree matches the merge commit tree: `9fb65d8e7487f17f53865d1c004ca776422a2de0`; all existing Stage 6.11–6.14 logic and art remain part of the merged tree.
- Merge SHA: `b28fade20a3b2d64c0fe56b52b5689ad99fefc37`.
- Test evidence: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44899211176 (Stage 6.15 8/8, Stage 6.14 9/9, Stage 6.14 retest 7/7, Stage 6.13 10/10, Stage 6.12 10/10, Stage 6.11 8/8 and Stage 6.10 6/6; 288-fight pilot and 1,152-fight native matrix).
- This AGENTS.md/report integration marker is **docs-only** and does not alter any tested native code, game balance, saves or production artifacts.
- Production `main` remained at `7cd2a91f03844fe6586f84f11fa45723dd9a6001` at verification.
