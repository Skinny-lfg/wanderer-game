# Canonical talent ID migration

One-shot clean-sheet migration. No save alias, balance edits or deployment.

| Previous ID | Canonical ID |
|---|---|
| blood_transfer | sanguine_echo |
| toxic_touch | corrupting_touch |
| blight | blightburst |
| relentless_assault | sundering_assault |
| arcane_echo | elemental_echo |
| crimson_rush | crimson_onslaught |
| fury_recovery | defiant_surge |
| storm_mastery | forked_lightning |
| spell_echo | resonant_sequence |
| crimson_feast | third_cut |

All 420 nodes match the baseline after normalizing only the approved identities.

Shared gear trait blood_transfer and shared trigger blood_transfer_burst deliberately retained. Enemy-domain identities are not renamed. Frozen historical reports retained.

## Changed source files

- combat/action-bar.js
- combat/talent-catalog.js
- combat/talent-graph-bridge.js
- combat/talent-graph-next.js
- combat/v012-buildcraft.js
- combat/v012-combat-runtime.js
- scripts/prepare-stage647d-layout.cjs
- scripts/simulate-progression.cjs
- scripts/v012-affinity-combat-sim.cjs
- scripts/v012-affinity-rank-analysis.cjs
- scripts/v012-complete-sim.cjs
- scripts/v012-economy-sim.cjs
- scripts/v012-endless-combat-sim.cjs
- scripts/v012-final-validation-sim.cjs
- scripts/v013-affinity-baseline.cjs
- scripts/v013-agent-strategy.cjs
- scripts/v013-anchor-decay-factorial.cjs
- scripts/v013-anchor-decay-integrated.cjs
- scripts/v013-anchor-independent-rot.cjs
- scripts/v013-anchor-overflow-budget.cjs
- scripts/v013-anchor-spread-research.cjs
- scripts/v013-build-planner.cjs
- scripts/v013-decay-natural-e10.cjs
- scripts/v013-e10-defensive-drain.cjs
- scripts/v013-global-e10.cjs
- scripts/v013-natural-progression.cjs
- scripts/v013-stage04-archetype-refinement.cjs
- scripts/v013-stage4-hybrid-review.cjs
- scripts/v013-stage63-native-magic-matrix.cjs
- scripts/v013-stage639-earned-aoe-comparison.cjs
- scripts/v013-stage642-e10-100seed.cjs
- scripts/v013-stage642-e10-dot-coverage.cjs
- scripts/v013-stage645-blood-decay-piercing.cjs
- scripts/v013-stage647-grave-bloom-lab.cjs
- scripts/v013-stage647b-infusion-rot-lab.cjs
- scripts/v013-stage647c-capture.cjs
- scripts/v013-stage647d9f-synergy.cjs
- scripts/v013-stage648c2-rot-diagnosis.cjs
- scripts/v013-stage648c2b-persistent-corruption.cjs
- scripts/v013-stage648c2c-offensive-scaling.cjs
- scripts/v013-stage648c2d-decay-rework.cjs
- scripts/v013-stage648c2e-rot-mana.cjs
- scripts/v013-stage648c2e1-mana-calibration.cjs
- scripts/v013-stage648c2e2-cycle-plagueheart.cjs
- scripts/v013-stage69-earned-paired.cjs
- tests/focused-mixed-browser.cjs
- tests/talent-graph-bridge.test.cjs
- tests/talent-graph-combat.test.cjs
- tests/talent-requirements.test.cjs
- tests/v012-affinity-decay.test.cjs
- tests/v012-affinity-phase-a.test.cjs
- tests/v012-affinity-phase-b.test.cjs
- tests/v012-affinity-phase-c.test.cjs
- tests/v012-buildcraft.test.cjs
- tests/v012-complete-combat.test.cjs
- tests/v013-anchor-rune-combat.test.cjs
- tests/v013-c1-catalog-equivalence.test.cjs
- tests/v013-decay-natural-agent.test.cjs
- tests/v013-specializations.test.cjs
- tests/v013-stage04-archetype-refinement.test.cjs
- tests/v013-stage4-hybrid-links.test.cjs
- tests/v013-stage63-magic-runtime.test.cjs
- tests/v013-stage641-build-readiness.test.cjs
- tests/v013-stage643-aoe-mechanics.test.cjs
- tests/v013-stage645-weapon-charge.test.cjs
- tests/v013-stage646-weapon-charge.test.cjs
- tests/v013-stage647-grave-bloom-lab.test.cjs
- tests/v013-stage647b-infusion-rot-lab.test.cjs
- tests/v013-stage647c-native-grave-bloom.test.cjs
- tests/v013-stage647d6-blood-fury.test.cjs
- tests/v013-stage647d8-decay.test.cjs
- tests/v013-stage647d9-magic.test.cjs
- tests/v013-stage648-decay-cleanup.test.cjs
- tests/v013-stage648c2-rot-diagnosis.test.cjs
- tests/v013-stage648c2b-persistent-corruption.test.cjs
- tests/v013-stage648c2d-decay-rework.test.cjs
- tests/v013-stage648c2e-rot-mana.test.cjs
- tests/v013-strategic-build-agents.test.cjs

## Renamed assets

- arcane_echo.png → elemental_echo.png (root and docs mirror)
- blight.png → blightburst.png (root and docs mirror)
- crimson_rush.webp → crimson_onslaught.webp (root and docs mirror)
- toxic_touch.png → corrupting_touch.png (root and docs mirror)
