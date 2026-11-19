# Wanderer v0.13 — Stage 9.7 native combat balance audit

## Why this exists

Stages 9.1–9.6 already include the real combat harness, Boss abilities, earned-account
runner, and E1 Tank-vs-Elite paired fixture. Stage 9.7 keeps those runners
and adds a **balance decision layer**. It does not retune enemies or invent combat.

## Three evidence layers (never pool their win percentages)

1. **Controlled native fights:** six Affinity Bosses with specified risks,
   normal groups 3/12/20 and real seeded Elite archetypes. Uses the native combat
   runtime in scripts/simulate-progression.cjs and explicit fixed seed, gear,
   talent budget and target policy. Boss/Elite first-ring insertion is a
   diagnostic fixture, **not** an ordinary Expedition or human win rate.
2. **Same-seed native E1 Tank vs Elite pairs:** calls the existing native
   scripts/v013-elite-tank-parity.cjs. Only real roster Tanks are accepted.
   Reports the seven Elite archetypes without equating 2 fights with a ranking.
3. **Optional natural accounts (--natural=true):** real E1–E8 runner with
   earned XP, loot, equipment, purchases, paths, Boss encounters and unlocks.
   Locked/unreached levels are censored, not zero-win samples.

## Quality and analysis safeguards

- SHA-256 native source fingerprint, parameters, expected cases and raw outcomes.
- Errors, timeouts and unresolved outcomes never silently count as deaths.
- Duplicate resolved native seeds counted once **per exact analysis cell**.
- Cells separated by E, build, Affinity, risk, group size, Elite archetype and
  target policy; small samples below 30 independent seeds explicitly flagged.
- Wilson 95% win intervals (native simulations only), P50/P90 duration,
  damage received relative to maximum player HP, minimum HP, Boss mechanic
  counters and native ability-cast rate.
- Genuine same-seed Tank/Elite outcomes report discordance and mean paired
  HP damage/time differences, with reproducible bootstrap intervals only at
  20+ valid pairs.
- Optional prior-version baseline with exact scenario identities and a SHA-256
  fingerprint of each *actually rolled equipped loadout*. Comparisons with
  different equipment or player HP/MP are excluded from summary deltas and
  explicitly counted. No assumed causal balance fix.
- Dedicated no-deploy GitHub Actions CI smoke.

## Commands (Node 22, repo root)

~~~sh
npm run test:v013:stage97

# Short pilot: no free E1 talent points; Common generated equipment
npm run diagnose:v013:stage97

# Deliberate cross-build Boss/Elite checks, larger paired cohorts
npm run diagnose:v013:stage97 -- --seeds=9101,9201,9304,9404 \
  --builds=blood-fury,aegis-vitality \
  --affinities=blood,decay,aegis,fury,magic,vitality \
  --risks=0,1,2 --group-sizes=3,12,20 \
  --policies=focus,mechanics --points=0 --rarity=Common \
  --scan=180 --pairs=30 --out=reports/stage97-targeted.json

# Repeat identical options on a later version and compare against prior JSON
npm run diagnose:v013:stage97 -- --baseline=reports/stage97-targeted.json \
  --out=reports/stage97-after.json

# Earned-account pilot (never pool with controlled win rates)
npm run diagnose:v013:stage97 -- --natural=true --seeds=9101,9201
~~~

Outputs are a JSON file and adjacent Markdown report under reports/.
The default cohort is deliberately small: a smoke, not balance approval.
An invocation caps controlled cases at 600; batch non-overlapping seed
ranges and preserve explicit configuration for future comparisons.

## Rules before changing balance

1. An error, timeout or unobserved Elite is missing evidence, not a player loss.
2. Benchmark each Elite vs native Tanks individually; avoid global changes to
   compensate for one weak subtype. Inspect time, HP damage and deaths jointly.
3. Evaluate Boss Affinities separately across risk, build and preparation.
4. Test larger cohorts (30+ truly distinct native seeds per exact cell), then
   earned-account progression and actual manual player feedback.
5. Wilson and bootstrap intervals communicate statistical uncertainty, not
   proof of human player success or specific causal abilities.
6. Direct per-ability damage attribution and human dodge/reaction timing are
   not available from the existing native instrumentation.

Preview parity: the audit verifies that 12 key external combat, talent, enemy and
economy modules match between the source runtime and GitHub Pages docs/
mirrors. A mismatch blocks a trustworthy report. The two index.html files
can intentionally differ because of artwork/UI: the report flags this fact;
external module parity alone does not prove identical inline HTML gameplay.

No gameplay values, loot rules, saves, assets or Firebase state are changed.
