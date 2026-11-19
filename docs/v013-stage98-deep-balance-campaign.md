# Wanderer v0.13 — Stage 9.8 deep balance research

## Purpose and scope

Run the substantial evidence campaign requested after Stage 9.7. All observations
come from the **actual native game combat/harness and earned-account runner**.
No gameplay stat, enemy AI, loot odds, save, asset or production deployment is
changed in Stage 9.8.

The automated pull-request workflow has **13 substantive jobs**, plus the unit
test and final consolidation jobs. Each run uploads the full raw JSON and a
human-readable Markdown report. A failed or missing job is flagged; the final
consolidation will not claim the entire campaign succeeded without all jobs.

## Experiments

**Seven Elite archetypes:** for each of Starter and controlled Common gear,
find 30 different E1 seeds for each of the seven native Elite types.
Only use seeds where the native single-enemy first room genuinely generates
a Tank. For each selected seed, execute the real Tank and random native Elite
combat. The inspected pre-combat roster is only used to avoid spending ticks
on rejected seeds; **it never forces the archetype**. Total target: 420 fully
executed paired comparisons (2 gear contexts x 7 types x 30 native pairs).
Damage and win deltas refer to the same initial player HP, gear and native
Realm Card, not the same enemy stats or identical post-start random draws.

**Six Affinity Bosses:** E1, zero synthetic Talent Tree points, generated Common
gear, three different weapon/build profiles, and all three risk levels
(Normal, Dangerous and Deadly). For each exact Boss/Build/Risk cell, generate
30 independent inputs spaced by 100 seeds to avoid the native Boss Affinity
seed-search overlap (48 attempts). Total target: 1,620 actual controlled native
Boss fights (6 x 3 x 3 x 30). This is **first-ring Boss injection**, not the
natural Boss route; preparation and prior-room attrition are absent.

**Build coverage:** seven existing weapon/build presets, two actual native
ordinary group sizes (3 and 12 enemies), 30 distinct seeds per Build/Size
combination, generated Common gear and zero unearned points. Total target:
420 ordinary native battles. Map Affinity varies among generated cards and
build preference; results by Build/Size are an observational comparison, not
a perfectly matched causal weapons experiment. Review the recorded mix.

**Natural E1–E8:** four independent shards, each with two non-overlapping
seed values and cautious/balanced profiles, giving 16 genuine persistent
accounts, each allowed up to 6 native attempts per accessible E. No free
items, talent points, Boss teleporting, forced unlocks or guaranteed drops.
Accounts stop where native boss victory cannot unlock the next E. Any E with
zero eligible accounts is **not reached / censored**, not a zero-percent
success rate. These agents approximate some bounded decisions; they are not
human player data.

## Running it

Node 22, at the repo root:

~~~sh
npm run test:v013:stage98

npm run diagnose:v013:stage98 -- --mode=elites --gear=starter \
  --target=30 --scan=3600 --seed-start=16001 \
  --out=reports/stage98-elites-starter.json

npm run diagnose:v013:stage98 -- --mode=bosses --affinity=blood \
  --seeds=30 --seed-start=20001 --risks=0,1,2 \
  --builds=blood-fury,aegis-vitality,magic-decay \
  --out=reports/stage98-bosses-blood.json

npm run diagnose:v013:stage98 -- --mode=builds \
  --seeds=30 --seed-start=30001 --group-sizes=3,12 \
  --builds=blood-fury,aegis-vitality,magic-decay,blood-decay,aegis-sword,fury-bow,magic-storm \
  --out=reports/stage98-builds.json

npm run diagnose:v013:stage98 -- --mode=natural \
  --seed-start=40001 --profiles=cautious,balanced --max-attempts=6 \
  --out=reports/stage98-natural-40001.json

# Combine downloaded GitHub Actions job artifacts:
npm run diagnose:v013:stage98 -- --mode=summarize \
  --inputs=balance-artifacts --out=reports/stage98-consolidated.json
~~~

The pull request automatically executes all cohorts through
.github/workflows/v013-stage98-deep-balance.yml. Inspect its downloadable
artifacts named stage98-* and consolidated final report. Runs use explicit
bounded seeds; input caps and evidence-quality failures never mutate gameplay.

## Reporting and limitations

Only compare per-archetype Elite threat to real Tanks. For Bosses, distinguish
Affinity, risk and build. Include HP loss, duration, ability casts, natural
route attrition, and how often a Boss can actually be reached. Small or missing
samples are not evidence of a strong/weak enemy.

This report cannot establish human reaction timing, precise individual-ability
damage attribution or actual E2–E8 win rates when natural accounts do not reach
those levels. Use results to prioritize hypotheses, then test proposed
balance changes in separate before/after cohorts and manual play.
