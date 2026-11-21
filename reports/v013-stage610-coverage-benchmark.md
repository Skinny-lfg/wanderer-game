# Wanderer v0.13 — Stage 6.10: Coverage & Native Performance Benchmark

**Branch:** audit/v013-stage610-coverage-benchmark-20261121  
**Base:** audit/v013-stage6, Stage 6.9 commit c8952192290cc413ddcec776b97100c9a5767ce3  
**Status:** tooling and tests; not a balance adjustment, not a mass simulation.

## What Stage 6.10 implements

1. Inspect the **live** TalentGraph v15 nodes and generate 12 basic lanes, 6 focused routes and 6 mixed routes, validated against node IDs. These are **24 route templates**, **not** every legal allocation at every point budget.
2. Inventory the weapon families represented in the current native combat simulator, armor families used by real strategic agents, 6 affinity realms, 4 mob roles, 6 Boss profiles, difficulty IDs and available Boon IDs.
3. Explicitly mark the Elite list **incomplete**: the four dedicated Stage 8.2 Elite ability definitions are not the complete randomly generated Elite roster. Never use four or the formerly assumed seven as an exhaustive Elite count without inspecting the native spawn catalog.
4. Generate a deterministic pairwise **scenario proposal**. Every pair of *dimension labels* is represented, with provenance clearly saying **not executed**. Not all tuples are attainable with the same earned character, talent budget or enemy seed.
5. Import actual Stage 6.9 JSON shards and verify shared native history, input and gear fingerprint, matching first encounters and unique (Expedition, seed, variant) keys. Only real matched observations count toward Weapon × Affinity coverage. Unknown armor, Boons, Boss, Elite and full-path labels remain **unknown**, not invented.
6. Provide a **native E1 performance pilot**: real initial account, real Camp, native reward loop, decisions, fights and inventory, without synthetic equipment or XP. Measure end-to-end runtime and number of actual combat rooms. Save an atomic JSON checkpoint after each seed, with safe same-source resume.

## Commands

Run from the repository root with Node 22 and installed dependencies:

- Validate: npm run test:v013:stage610
- Inventory: npm run audit:v013:stage610:inventory
- Pairwise candidate coverage: npm run audit:v013:stage610:plan
- Opt-in native E1 benchmark: npm run audit:v013:stage610:benchmark
- Resume exactly the same benchmark cohort: node scripts/v013-stage610-coverage-benchmark.cjs --mode=benchmark --runs=2 --seed-start=9901 --resume=true --out=reports/v013-stage610-e1-benchmark.json
- Import Stage 6.9 exact native shards: node scripts/v013-stage610-coverage-benchmark.cjs --mode=coverage --inputs=reports/stage69-e5-9701.json,reports/stage69-e5-9702.json --out=reports/v013-stage610-observed.json

The Stage 6.9 JSON files must first be obtained from the existing successful GitHub Actions artifacts. This stage does not claim they are present in every checkout.

The CI workflow tests inventory + pairwise logic and **does not run a heavy benchmark on push**. An explicit manual workflow dispatch can run the bounded benchmark.

## Acceptance criteria

- All catalogue references correspond to existing live TalentGraph nodes.
- Structural paths = 24; 12 basic / 6 focused / 6 mixed.
- Coverage of **designed pairwise labels** = 100%, with candidate rows explicitly *unexecuted*.
- No Stage 6.9 observation becomes a full-build, real-Boss or Boon coverage claim unless the native shard actually contains matching evidence.
- No source revisions may be silently mixed when importing shards or resuming benchmark checkpoints.
- Pilot records seed, native runtime, attempts, combat room counts, source hash, memory consumption and checkpoint.
- No changes to combat, enemy stats, talents, rewards, gear, player saves, Firebase, main, production, merges or deploys.

## Remaining work — Stage 6.11 prerequisites

- Inventory the **full Elite spawn roster** and legal off-hand and weapon pairings from the native game catalog.
- Enumerate native TalentGraph **legal allocations per earned point budget**, element/prepared choices and reachable prerequisites; record why impossible candidates are rejected.
- Add earned-origin sources for Wand, Staff, Bow, Daggers, Two-Handed, Mace/Shield and other gear, without forcing items to drop.
- Emit richer native encounter snapshots with actual armor items, rarity, Boons, potion stock/use, enemy IDs, conditions and room access.
- Validate scenario feasibility before running designed pairwise rows, then perform matched adversarial Battle/Boss/Elite trials with exact seeds.
- Measure at E5, E8, E10 and on machine hardware before choosing the budget for 150k+ combats. An E1 pilot is **not** an extrapolation for higher levels.

**Bottom line:** 100% pairwise *plan* is not 100% native tested coverage. Stage 6.10 makes this distinction machine-readable before expensive tests are scheduled.
