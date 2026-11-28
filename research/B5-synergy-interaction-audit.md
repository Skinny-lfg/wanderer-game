# B5 — Synergy & Interaction Audit

## Frozen baseline and authorized candidate
B4.3: f598fdb8056be59291b23baa36728c8865addfdc; workflow 46131505154 passed. The user accepted the B4.3 balance candidates and the single Red Guillotine adjustment in this stage. Only Red Guillotine damage per active Bleed stack increases from 8% to 16% of the pre-critical base hit; cap remains 80%, cooldown 5s, physical main-hand crit requirement and non-consumption remain. Stable ID and mirrored runtime/catalog preserved. No other combat, item, armor, economy, enemy, or agent changes. The validation must verify the exact runtime diff.

## Hypotheses and scope
18 legal two-factor comparisons at E10, 30 points and fixed Rare equipment, no runes, native mechanics targeting. Four cells per configuration: low/low, high/low, low/high, high/high, with identical shared prerequisite paths and legal stat replacements of the omitted marginal points. The rank-1 reference is retained for prerequisites in fury-crit, barrier-guard and frost-freeze. Red Guillotine uses prepared/unprepared with the same purchased ability and Rupture, combined with Precision, and repeats all four cells in the old revision. Every cell verified for legal allocation and equal budget. These are choice interactions including the opportunity cost of stat alternatives, not pure mechanical ablations.

| Case | Factors | Kit | Hypothesis |
|---|---|---|---|
| blood-speed | Quick Hands R0/R3 × Deep Cuts R0/R3 | Daggers | Speed improves Bleed application throughput and Deep Cuts scales ticks |
| blood-crit | Precision R0/R3 × Sanguine Fury R0/R3 | Daggers | More critical hits amplify Bleed and direct critical procs |
| fury-crit | Precision R1/R3 × Brutal Critical R0/R3 | Two-Handed | Crit chance and bonus damage combine, including floor/ceiling effects |
| decay-speed | Quick Hands R0/R3 × Corruption Cycle | Daggers | More frequent bursts can create mana starvation |
| rot-sp | Arcane Focus R0/R3 × Virulent Rot R0/R3 | Wand/Tome | SP and Rot potency multiply |
| rot-mana | Mana Spring R0/R3 × Corruption Cycle | Staff | Regeneration sustains costly bursts |
| barrier-sp | Arcane Focus R0/R3 × Barrier Mastery R0/R3 | Wand/Orb | Shared SP scaling and layered mitigation |
| barrier-guard | Guarded Block R1/R3 × Barrier Mastery R0/R3 | Sword/Shield | Guard and Barrier interact rather than multiply unchecked |
| defense-healing | Iron Skin R0/R3 × Renewal R0/R3 | Mace/Shield | Reduced incoming damage extends healing value |
| healing-barrier | Renewal R0/R3 × Sanctuary | Mace/Shield | Effective healing converts to bounded Barrier, no infinite loop |
| fury-sustain | Precision R0/R3 × Fervent Life | Mace/Shield | Crit-driven healing may change sustain identity |
| cleave-spread | Cleave Mastery × Plague Spread | Two-Handed | AoE/on-kill propagation |
| carrion-spread | Plague Spread × Carrion Detonation | Two-Handed | Competing or complementary status spreading |
| lightning-chain | Overcharge R0/R3 × Forked Lightning | Staff | Chain damage, marks and prerequisite-independent choice behavior |
| fire-spread | Kindling R0/R3 × Fire Spread | Wand/Tome | Primary burn versus secondary spread |
| grave-sp | Arcane Focus R0/R2 × Grave Bloom (purchased and prepared) | Wand/Tome | SP scaling and funded infusion Rot spreading |
| frost-freeze | Deep Winter R1/R3 × Shatter | Wand/Tome | Control and damage from Freeze lifecycle |
| red-crit | Precision R0/R3 × Red Guillotine preparation | Daggers | Validate candidate at both crit levels and unchanged unprepared controls |

## Sampling and interpretation
50 fresh matched seeds per configuration/scenario; solo, 12-mob group, tank elite, rotating native boss. 3,600 matched blocks, 14,400 candidate fights plus 800 Red baseline fights = 15,200 scheduled main fights (smoke and deterministic regressions separate). All four cells match equipment and encounter hashes, fixed targeting, native source fingerprint, rank and talent budget. Raw rows preserve entry stats, wins, DPS, TTK, HP, damage taken, healing, Barrier entry/generated/absorbed/peak, mana paid/starved/unfunded, periodic/secondary damage, enemy attack frequency and native numeric telemetry. Compute additive interaction Y11-Y10-Y01+Y00 per matched trial for win percentage points, DPS, HP percentage, mana spent and absorption with approximate 95% paired intervals. Review individual scenarios and actual activations; missing metrics are not evidence of no activation. Interactions near win ceiling/floor may be masked or negative from saturation. No aggregate controlled target or inference of human behavior.

## Gates
Syntax, regression and smoke gates precede simulations. Reject mismatched seeds, illegal builds, drift, missing artifacts, or unresolved fights. Flag exploratory interactions with substantive effect (e.g. >=10pp win interaction or >=15% of reference DPS), especially with uncertainty excluding zero, but diagnose mechanics and cost before recommending tuning. Independent confirmation for meaningful outliers before numerical changes. Red unprepared controls should be identical across revisions; candidate should improve paid contribution without violating cap/cooldown and without excessive crit synergy. Check cumulative drift versus B4 and B4.3 only with comparable fixtures; B6/B7 still required for broader affinity budgets, all pairings and situational identity. Natural progression and browser parity remain subsequent gates. No merge/deploy. Revert this candidate commit if necessary; do not retune agents. Results pending.
