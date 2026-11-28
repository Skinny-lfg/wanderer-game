# B6 — Affinity Power Budget

## Scope and baseline

Frozen current gameplay: 7a6518e22120ba2aff61aac22f52e1d6000bdee4 (B5 replay, successful run 46138880818). Pre-B4.1 historical anchor: e2c10733794bad2bcadcc66ae6d01bd9cf68ce8c. No new gameplay, equipment, economy, enemy or agent changes. The accepted Red Guillotine candidate is already present in the frozen baseline.

## Population and sampling

Reuse the 42 established E10 build packages from v013-global-e10.cjs, including six dedicated mixed talent paths, and add the nine other legal two-affinity pairs. Total: 36 pure-affinity profiles and 15 hybrid profiles. Each uses 30 legally purchased talent points and native Rare gear in its specified kit. Pure Arcane includes arcane/fire/frost/lightning and three weapon variants per attunement; pure Decay includes Cycle/Plagueheart variants and six weapons. No runes, no contracts, no boons. Fixed mechanics targeting and existing optional observed solo-normal stalemate surrender policy; no agent retuning.

Eight scenarios: 1/4/12/22 normal mobs, Tank/Caster/Vampire elites, rotating native bosses across all six realms. 50 matched fresh seeds per profile/scenario. 20,400 current fights. An additional 4,800 fights compare 12 preselected profiles on the historical anchor with identical legal talent allocations, equipment and opponents. 25,200 total main fights. The anchor comparison is a fixed-subset cumulative measurement, not an estimate of all changes since the beginning of v0.13.

## Metrics and decision criteria

Report win rate with denominator and unresolved bounds, DPS and secondary/periodic damage, time to win/first kill, HP, damage taken, effective healing, Barrier entry/generated/absorbed/peak, mana spent/remaining/starvation, attack frequency/control, entry stats and observed native activation metrics. Separate solo, group sizes, elites and bosses. Compare pure-affinity profiles with equal weighting within each family, attunements separately, and hybrid packages with any available same-kit pure parents. Different kits confound the effect of affinity; no universal numeric power score, no assumption all builds must win equally, no natural-population inference from these controlled rates. Historical paired comparisons use exploratory approximate 95% intervals.

Priority questions: Grave Bloom power across matchups; Lightning chain access and rank ownership; Fire ST/AoE tradeoff; Arcane+Aegis damage versus mitigation; Renewal sustain; Fury critical opportunity cost; Blood/Decay offensive identity. Inspect actual activation and resource metrics before any nerf. Flag broadly dominant profiles that excel in damage, survival and resources across all contexts, and weak options without a meaningful niche. Keep healthy situational synergies. Propose targeted redistribution after reading the results, not automatic changes to coefficients or enemy difficulty.

The user-approved natural aggregate targets remain normal 85%, elite 70%, boss 50% (ideal +/-5 pp, acceptable +/-12.5 pp), not per-build controlled targets. Natural campaign verification and comprehensive matchup/elite/boss calibration remain distinct stages.

## Gate and rollback

Native regression, legal allocation and smoke checks precede the matrix. Verify native source module hashes and unchanged source, exactly matched opponent/gear hashes for historical pairs, encounter hashes across current profiles and gear within identical kits. Existing conservative surrender policy counts native defeat only for observed solo normal stalemates. Preserve unresolved traces and bounds; fail aggregate on unexplained timeouts rather than silently drop them. Retain raw per-profile artifacts, exact commit and summary. No merge or deploy. Revert the research/workflow-only commit if necessary. No new balance changes until evidence and user decision.
