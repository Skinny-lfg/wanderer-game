# Stage 6.47D.9A — Stat node scaling audit

Scope: diagnostic only. Live gameplay, talent graph values, gear, enemy scaling, save format, main and deployed Pages unchanged. Current baseline 8a5fa513048c7ccb0aa2e33d8dd62f14854c6171. Script scripts/v013-stage647d9a-stat-scaling.cjs and workflow .github/workflows/v013-stage647d9a-stat-scaling.yml.

## Exact graph census
419 total, 308 stat nodes. Counts and tiers:
| stat | nodes | tiers | flat sum (all nodes, NOT a legal build) |
|---|---:|---|---:|
| flatAttack |32|2/3/4|101|
| flatArmor |18|2/3/4|49|
| flatLife |36|5/8/12|294|
| flatAvoid |39|2/3/4|115|
| flatSpell |15|2/3/4|44|
| flatRegen |29|.20/.25/.30|—|
| flatMana |21|3/5/7|—|
| flatSpeed |13|.02/.03/.04 attacks/s|—|
| startBarrier |17|1/2/3|38|
Remaining: healthRegen 26, bleedBonus 19, rotBonus 9, rotDefense 5, sunderDamage 14, primary attribute 15.

## Current formulas and implications
Gear tier multipliers are 1, 1.15, 1.30, 1.45, 1.60 at E1/5/15/35/70; not identical to the provisional smooth exponential enemy reference. Gear acquisition, rarity, permanent post-cap attributes and rune allocation also affect stats. Current defense = round(1+0.8 END+equipment defense), then graph flats, then Iron Skin and other modifiers. Native incoming physical-defense formula before block/barrier/other effects: max(ceil(ATK*.24),round(ATK*(1-min(.75,DEF/(DEF+ATK*1.35))))). Not equivalent to flat damage reduction. Evasion uses physical-only rating/(rating+20*(2+.91*enemyReference)), capped at 30%; rating needed for cap E1 23.19, E10 42.94, E20 47.69, E50 61.59, E100 100.18, E200 306.96. These are formula outputs, not observed player ratings.

If every node received 2/3/4% of the same pre-graph stat, total *theoretical* percentage pools would be +101% attack, +49% defense, +106% maxHP, +44% spell. 1/1.5/2% halves those to +50.5/+24.5/+53/+22%. Not simultaneously owned or achievable; legal per-build budgets must be measured. HP and Defense also scale offensive effects (Vital Pulse, Living Force, Grasping Roots, Ward Echo, Stored Force), and attack/spell scale DoTs and mixed procs. Percentage stacks must be additive on a single pre-graph stat (attributes, equipment, runes already included), not sequential multiplicative stacking.

## Native audit protocol
No candidate alters combat or decisions. On first legitimate Camp entry, use exact existing gear/XP/owned nodes. Diagnostic-only VM instrumentation attaches a nonenumerable function to totalStats output; original numerical values unchanged. For each checkpoint, recompute baseline and require exact match with native stats, then project variants using existing graph bridge and buildcraft modifiers. Variants: current; all owned armor nodes become +5; replace flat attack/armor/HP/SP by 2/3/4%; retain flats plus 1/1.5/2%; retain flats plus 2/3/4%. These are static counterfactual projections, not matched native fight outcomes. E1 reference example (actual starter DEF=6, reference enemy ATK=11): mitigation-only hit 8, with +5 becomes 6, +5% remains 8; other effects excluded. At E10 one real Blood survivor had DEF=35, ATK=68, HP=132. +5 Defense alone is 14.29% of that Defense, not 14.29 percentage points of damage reduction.

## Executed validation
First workflow 45403446361 passed inventory/selftest but failed importing the enemy reference into diagnostic host; corrected (812b09bbaea148eea9794e155dbe978e80fe0ff0). Corrected six-profile run 45403644754 completed all seven jobs successfully: all six agents began at E1 (ATK18/DEF6/HP119); Blood reached E11, Aegis/Vitality E5, the other four E1. 136 attempts, no native timeouts. Only one E10 checkpoint; zero E20/50/100/200. Blood at E10 owned six attack nodes: pure percent -13.235% Attack, hybrid low +7.353%, hybrid full +13.235%, versus its actual Attack68. No earned armor-node owner at E10 in this cohort. Do not infer late-level stats or defense build balance from this sparse cohort. Expanded run 45404002324 passed all 13 jobs (12 profile jobs plus aggregate). One shared account seed 9861; 12 distinct profiles, 945 attempts, two censored timeouts. Reached E1/E2/E5/E10/E20/E50/E100/E200: 12/6/5/4/3/3/3/0. Cautious reached E186, Balanced E180 (timeout), Plate Warden E183 (timeout). No fabricated E200 stats. Cross-sectional median DEF at these levels: 6/15/40/58/70/97/149/null; HP 119/126.5/187/275.5/402/514/1087/null. These medians change cohort membership and are not same-character trajectories.

| E | DEF owners | +5 flat each | percent-only | hybrid low | hybrid full | HP owners | hybrid low HP | hybrid full HP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|2|2|+17.895%|-11.930%|0%|0%|3|+0.833%|+2.083%|
|5|3|+28.571%|-14.286%|+2.703%|+8.108%|3|+3.349%|+6.220%|
|10|2|+15.230%|-5.318%|+3.021%|+6.043%|2|+7.061%|+13.954%|
|20|2|+16.429%|-5.000%|+3.571%|+7.143%|2|+11.059%|+22.126%|
|50|2|+23.928%|-5.440%|+8.071%|+16.142%|2|+19.882%|+39.854%|
|100|2|+23.331%|-0.046%|+13.899%|+27.485%|2|+32.578%|+65.116%|
These are median changes in actual projected stats with identical owned nodes, not damage mitigation or win rates. E100 Attack owner (one): percent-only +3.409%, hybrid low +21.023%, full +41.477%. No observed selected Spell Power stat nodes in any checkpoint; SP projections censored. The results argue against indiscriminate additive hybrid HP, particularly after the cap. A smaller hybrid or flat minimum vs percent maximum is a candidate, not yet tested. E100 survivors biased toward defensive/pivoted builds. No native fights under candidate stat rules executed.
Historical Stage6.36 report (run 45189808714) had 9/24 natural E200 survivors, but it used an earlier gameplay revision and its item-removal study is not a present node-scaling experiment.

## Recommendation (candidate, not approved gameplay)
Keep existing flats as a floor; compare conservative additive hybrid and max(flat, percentage of pre-graph stat) for attack/defense/spell. Low additive hybrid (1/1.5/2%) is already a substantial buff for the E100 attack owner, so it is not a selected coefficient. HP requires especially conservative candidates (e.g. .5/.75/1% or flat-or-percent floor) due to double offensive/defensive scaling. The HP conservative candidate is a recommendation, not one of the executed projections. Compare fixed +5 Defense specifically to current tiered flat and hybrid; do not promote uniformly +5 without E1 mitigation check. Avoid blanket conversion of evasion, speed, Mana or regen. Evasion has its own level-relative formula; % of zero is zero, so retain flat floor. Speed flat per second is already weapon-speed-sensitive and capped 4.2; mana/regen have distinct action-economy scaling; retain for now. Starting Barrier is a separate candidate, consider a small addition based on the initial HP/SP-derived Aegis barrier rather than current accumulated Barrier, with explicit cap/budget; not yet calibrated. Existing primary attributes and DoT/status percent nodes unchanged.
Before adopting a candidate, update planner marginal-value logic (currently fixed coefficients for flat stats), compare matched native fights on several legally earned actors with identical gear/XP/point counts and separately labeled natural/assisted capture. Prioritize E10, check low level and later observed cohorts; no fabricated higher-level checkpoints. No new balance values selected or deployed.
