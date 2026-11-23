# Stage 6.37 — Minion-dependent normal groups and fixed E1 Elite bases

## Scope and invariant

**Purpose:** reduce unfair large normal-group danger without weakening any Minion, preserving the individual roles of Tank/Skirmisher/Caster. Correct all eight Elite *E1 bases*, not arbitrary Expedition multipliers. Still keep the Stage6.34 global E1–E200 reference and item tiers unchanged.

This is an **initial candidate**, not a verified 60–70% win-rate calibration yet. No merge or deployment.

## Single normal-group rule

Stage6.33 had removed ALL size-based stat multipliers. Stage6.37 introduces **one conditional, roster-based rule** after native Risk 0–2 pressure, before Traits/Conditions.

For a NORMAL encounter of **5+ total enemies**, count the number `m` of Minions in the **complete initial roster**, including Minions in reserve beyond the first four visible slots. Only principal, non-Minion actors (`tank`, `skirmisher`, `caster`) receive:

- `HP factor = max(0.38, 1 - 0.055*m)`
- `Attack factor = max(0.50, 1 - 0.045*m)`
- `Defense factor = max(0.65, 1 - 0.025*m)`

These factors are **per actor**, not a new global enemy reference and never recursive. `maxhp`, `hp`, `atk`, `def` and `baseDef` remain consistent. Attack interval, traits, special abilities, XP, rewards and Minion stats are unchanged.

| Number of Minions | Principal HP | Principal Attack | Principal Defense |
|---:|---:|---:|---:|
| 2 | 89% | 91% | 95% |
| 5 | 72.5% | 77.5% | 87.5% |
| 8 | 56% | 64% | 80% |
| 12 | 38%* | 50%* | 70% |
| 18 | 38%* | 50%* | 65%* |

`*` means the safety minimum has been reached.

**Never applied** to 1–4 enemy rooms, rooms without Minions, Minions themselves, Elites, Bosses, or special stat-only calibration fixtures. The relative relief is evaluated once for the initial room roster, not recalculated with deaths. Existing Risk, Traits and Vanguard mechanics remain intact.

## The eight named Elite E1 bases

These independent identity coefficients are used at **every Expedition** by the same `estimateEnemy(E)` reference, before the pre-existing Elite combat pressure. No overrides at E5, E20, E35, E70 or E200.

| Elite | E1 HP base before → now | Attack before → now | Defense before → now |
|---|---:|---:|---:|
| Gravebound Bulwark | 1.75 → 1.88 | 0.65 → 0.76 | 1.22 → 1.26 |
| Bloodscar Ravager | 0.72 → 0.80 | 1.20 → 1.30 | 0.86 → 0.88 |
| Sanguine Wraith | 1.01 → 1.12 | 0.98 → 1.10 | 1.00 → 1.03 |
| Voidborne Hexer | 0.91 → 1.02 | 0.93 → 1.03 | 0.90 → 0.92 |
| Gravecaller | 1.00 → 1.12 | 0.735 → 0.82 | 0.86 → 0.88 |
| Oathbound Exarch | 1.23 → 1.36 | 0.67 → 0.77 | 1.12 → 1.15 |
| Briarspine Horror | 1.20 → 1.33 | 0.84 → 0.95 | 1.00 → 1.03 |
| Ashen Executioner | 1.05 → 1.18 | 1.10 → 1.22 | 0.91 → 0.93 |

Individual timings and skills unchanged. The E1 objective is to lower the *overall* naturally observed Elite victory rate from Stage6.34's **76.9%** toward **60–70%**, without inventing a Boss/Elite-wide invisible multiplier. This cannot be confirmed before the native census.

## Validation

- `tests/v013-stage637-minion-principal-elite-bases.test.cjs`: no debuff for small/non-Minion rooms, caps, monotonic Minion count, all 4+ reserve Minions, Minion stats unchanged, test-only idempotency guard, actual native grouped actors at E1/E5/E70/E200; all eight named Elites at E1 and E20, and every Elite identity's coefficient fixed E1→E200.
- `tests/v013-stage637-natural-rates.test.cjs`: original 100×5 seeds/profile catalog, no forged account/level, aggregator refuses duplicate/missing/mixed-source records.
- New workflow does complete v0.13 regression and E1-born smoke. Full census (when triggered) runs **500** real E1-born accounts through E5, recording natural E1–E5 victory rate by actual Elite identity, Realm, normal 1/2–4/5+ and Boss.
- Old baseline Stage6.34 E1 normal solo 96.2%, normal 2–4 24.1%, normal 5+ 0%, Elite 76.9%, Boss 37.1%. E5 Elite 100% and Boss 97.9%. Those are **historical different-source cohort outcomes**, not matched paired tests.
- There are natural selection biases (the agent chooses optional Elite encounters, some builds never reach E5); do not call the target achieved unless data confirm.

### Next

Assess `stage637-minion-group-e1-elites-e5-native-100x5` final aggregate. If Elite E1 remains outside 60–70%, revise only the eight named E1 coefficients using new observed per-Elite E1 rates and retest. If 5+ still impossible despite relief, investigate the Minion attack counts/AI before more arbitrary scalar modifications. Boss balance remains separate.

No saved games compatibility layers were added; no old code preserved in parallel. No `merge` or `deploy`.
