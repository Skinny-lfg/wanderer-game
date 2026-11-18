# Wanderer v0.13 — Stage 9.2: Early difficulty vs permanent progression

## Decision

**Diagnosis only. Do not change HP, armor, damage, enemy AI, Boss abilities, player talents, loot odds, crafting, maps, UI or artwork.** This stage tests a player report: the first Expeditions feel brutal, while armor upgrades and permanent talents make rooms manageable later. That is plausible intended progression, not proof of a balance defect.

Stage 9.1's severe controlled Boss results are **not a representative campaign win rate**. Those fights used first-ring Boss injection, synthetic E15 talent points, fixed gear, no auto-potions and no prior room/boon preparation. Normal/Elite results used a different encounter mix. Stage 9.2 checks where the apparent power gain comes from before considering tuning.

## Controlled matrix (default 228 native scenarios)

| Cohort | E | Synthetic points | Generated gear rarity | Controlled Normal room | Natural Dungeon route | Controlled Boss |
|---|---:|---:|---|---|---|---|
| e1-start | 1 | 0 | Common | Yes | Yes | Yes |
| e5-zero | 5 | 0 | Common | Yes | Yes | Yes |
| e5-talents | 5 | 4 | Common | Yes | Yes | Yes |
| e5-geared | 5 | 4 | Uncommon | Yes | Yes | Yes |
| e15-zero | 15 | 0 | Common | Yes | Yes | Yes |
| e15-talents | 15 | 8 | Common | Yes | Yes | Yes |
| e15-geared | 15 | 8 | Rare | Yes | Yes | Yes |
| e15-high-talents | 15 | 24 | Rare | Yes | Yes | Yes |
| e35-low | 35 | 8 | Uncommon | Yes | Yes | No |
| e35-talents | 35 | 16 | Uncommon | Yes | Yes | No |
| e35-geared | 35 | 16 | Rare | Yes | Yes | No |

Default: 3 builds (Blood/Fury, Aegis/Vitality, Magic/Decay), 2 seeds, controlled first-ring group of 3, native shortest path on each Dungeon, and a narrow **Blood + Aegis, Normal-risk** Boss pilot. **Only two seeds per cell**; this is exploratory triage, not a quantitative balancing decision.

The permanent points at E5/E15/E35 are synthetic **counterfactuals**. Nothing in this report claims players naturally earn those exact budgets, rarities or upgrade timings. Real player loot and talent accumulation must later be measured independently.

## Correct comparisons

Seven declared A/B contrasts change **exactly one dimension at the same Expedition level**:

- E5: +4 points (same Common gear), then Common→Uncommon (same 4 points).
- E15: +8 points (same Common gear), then Common→Rare (same 8 points), then +16 more points (same Rare gear).
- E35: +8 points (same Uncommon gear), then Uncommon→Rare (same 16 points).

**Scenario lock:** Stage 9.2 re-seeds the native harness' separate route, draft, control and combat RNG streams immediately *after* equipment is rolled, so changing rarity alone cannot silently choose different enemies. This change is isolated to the simulator flag and does **not** change live game RNG, gameplay formulas or loot odds. A regression test verifies the exact native Dungeon route, Affinity, risk and Boss style across rarities.

The tool retains all raw attempts, but pairs **only** rows with equal native resolvedSeed, Affinity, risk, build, mode, room group size, target policy and (for natural Dungeons) equal native route. When gear changes affect RNG or generated map identity, that contrast has fewer matched pairs and may be **inconclusive**, rather than manufacturing an A/B win rate. Rows with errors/timeouts are *not* classified as deaths. Duplicate native seeds do not create independent observations.

Cross-E1/E5/E15/E35 summaries are **descriptive, not paired causal effects**, because enemy tiers and encounters also evolve.

## Measured outputs

By cohort/mode/build: independent results, wins/deaths, native errors/timeouts, duration, damage received, minimum/final HP, natural Dungeon rooms completed and whether the Boss was reached. Boss results are separated by Boss Affinity and risk. Warnings identify floor effects (0% wins), ceiling effects (100% wins), under-five samples, errors, timeouts and repeated native RNG seeds.

Paired contrasts report changes in win percentage, HP, damage taken, duration, rooms and Boss reach rate **only on valid pairs**. Zero matched pairs is **missing evidence**, not “no difference”.

Important limits: native automatic combat is not manual play; no automatic potion timing, no opportunistic gear swapping, no actual XP point allocation or upgrades during routes, and no full 15-Realm Expedition. First-ring Boss injection ignores the preparation and recovery the player would normally have.

## Commands

~~~sh
npm run test:v013:stage92
npm run test:v013:stage91
npm run test:v013:balance

# Default exploratory set, 228 native fights:
npm run diagnose:v013:stage92

# Smaller recheck with one build/seed:
npm run diagnose:v013:stage92 -- --builds=aegis-vitality --seeds=9101 --out=reports/v013-stage92-focus.json

# Alternative AI target policy:
npm run diagnose:v013:stage92 -- --target-policy=mechanics --out=reports/v013-stage92-mechanics.json
~~~

Allowed filters: --builds, --seeds, --boss-affinities, --boss-risks, --target-policy and --out. Max 260 runs per invocation. Native v0.13 combat is loaded using scripts/simulate-progression.cjs — **not the v0.12 legacy simulator**. The filename of the live test harness still includes v012 for compatibility.

Both JSON (full raw audit and metrics) and Markdown (readable summary) are uploaded as GitHub Actions artifacts, with no deploy or merge. Gameplay balance changes require separate authorization after this diagnosis.

## Next stage decision gate

1. Confirm the first E1/E5 bottleneck in **real player conditions**, including starting equipment and realistic account XP.
2. Observe whether additional armor and talents materially improve comparable native encounters, keeping unmatched scenarios explicit.
3. Compare auto-target policy focus vs mechanics on the **same validated native scenario**; evaluate consumable timing only after automatic potion usage is implemented explicitly.
4. Rerun only critical strata with at least 30 independent comparable native seeds and several manual browser playtests.
5. **Do not nerf Bosses solely from the Stage 9.1 raw Boss win rate.**
