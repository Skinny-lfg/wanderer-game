# Wanderer v0.13 — Stage 6.12 Controlled Build × Combat Matrix

**Canonical parent:** `audit/v013-stage6` (Stage 6.11 checkpoint `78c5798e84bb6d32ad675d2e38f6034508cc9407`).

## What changes

A simulation-only extension to the existing native combat harness enables exact, valid v15 TalentGraph snapshots and **actual native item rolls** for all armor pieces and Off-Hand combinations. The damage system, AI, abilities, rewards, drop tables, character saves, Firebase, production assets and gameplay code remain unchanged.

The matrix generator distinguishes:

1. **48 archetypes:** 21 existing strategic-agent profiles plus 27 current live TalentGraph endpoints (12 Basic, six current Focused, six Mixed, three elemental Magic routes).
2. **Four controlled budgets:** 12/24/36/60 points, mapped for scenario setup to E5/E15/E35/E70. Both Talent points and Expedition unlock are synthetic test-fixture values, never player achievements.
3. **Native rolled equipment:** seven weapon families, three armor classes (all five armor slots), five one-handed Off-Hand choices where physically possible, and a seeded rarity. Two-handed weapons have no Off-Hand.
4. **Real native enemies:** normal, Elite and six Boss Affinities. The exact encounter is staged in a test room; it is *not* an organically reached boss.
5. **Coverage-driven, bounded selection:** 1,728 designed archetype-budget-loadout candidates; choose a reproducible subset for real tests without pretending to test all possible combinations.

There are distinct planned and executed counts. The game-derived talent allocations are checked by the native TalentGraph `valid` and `allocate` APIs. Advanced abilities may be prepared if truly allocated in that controlled Talent snapshot. Duplicate node states are counted once for distinct-talent-state metrics even when multiple strategy labels exist.

## Actual native test plan

- 18 controlled fight smoke tests.
- 144 controlled fights across archetypes, equipment, talent budgets and normal/Elite/Boss roles.
- Ten *matched* Off-Hand comparisons, twenty additional combats: same talents, main weapon, native rolls in every non-Off-Hand slot, seed and real Realm; only Off-Hand item is different.
- Every result includes actual native combat outcome, seed, opponent roster and ability telemetry, battle duration, E-level/gear setup, item and talent metadata, and source fingerprints.
- Atomic JSON checkpoint for the planned matrix; `--resume=true` rejects source/config changes and duplicate recordings.

## Reproduce

From the repository root using Node 22:

- `npm run test:v013:stage612`
- `npm run audit:v013:stage612:pilot`
- `npm run audit:v013:stage612:matrix`
- `npm run audit:v013:stage612:pairs`
- `node scripts/v013-stage612-controlled-combat.cjs --mode=plan --limit=144 --out=reports/v013-stage612-plan.json`

## Interpretation and release bar

- A **structurally legal** allocation at 60 points is *not* proven attainable in the natural E1 campaign. E1–E5 player reachability remains Stage 6.11's separate evidence, where only eight earned points were observed.
- Controlled gear uses the real rolled affixes at the selected level but is not loot obtained by playing. High-end gear is never assumed to be naturally found or purchased.
- Boss/Elite tests use real actor ability definitions and native damage/stat calculations, but stage the selected enemy with the test harness rather than traversing the complete expedition.
- A subset of the 1,728 designed candidates does **not** equal 1,728 completed battles; outcomes must be taken only from successfully completed native result rows.
- Even 144 successes are insufficient to conclude global balance: there are many legal talents, gear rolls, Boons, potion choices, player decisions and difficulty levels left untested. Analyze stratified evidence and increase independent seeds before individual enemy balance changes.
- No manual multiplier buff/nerf, no production deployment, no branch deletion, no Firebase or save changes.

**Gate:** merge only if new Stage 6.12 and baseline Stage 6.10–6.11 tests pass, native controlled 18/144/matched pair workflows finish without timeouts/errors, and fingerprints and results are retained.

## Stratification correction (before merge)

The first executed 144-run matrix exposed a **design confound**: the scenario shortlist correlated Plate armor with Boss encounters. Raw Armor win rates from that initial matrix were therefore not fit for comparative balance analysis. The Stage 6.12 candidate generator was corrected to cross each gear variation independently with all three encounter classes (Normal, Elite, Boss), increasing the design pool from 576 to 1,728 proposed scenarios. The selector now explicitly balances the nine Armor × encounter strata and a dedicated regression test rejects missing/poorly represented strata. The corrected matrix is required to pass CI before merge. The earlier run is retained in GitHub Actions as a historical diagnostic, **not** a final balance result.
