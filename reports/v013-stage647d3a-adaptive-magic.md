# Stage 6.47D.3A — Adaptive Magic paths (design only)

Local read-only HTML derivative of the validated 6.47D.3 prototype, following the user's two annotated Magic branches. No combat, live graph, save, allocation or deployment changes. HTML and four real Chromium screenshots delivered in chat.

## Geometry and progression
- Two mirrored internal paths: magic_side_0_1 -> adaptive A -> magic_side_0_2, and magic_side_1_1 -> adaptive B -> magic_side_1_2.
- Each path has two provisional attribute nodes, a gate, and an ability; its first node also explicitly requires element_choice. Later shared side nodes accept the corresponding selected-mode ability as an OR alternative; original routes remain available.
- Eight distinct ability IDs, two visible per selected mode. All four nodes per path are mode-specific; the inspector's requirement planner filters out other elements. Attunement toolbar and original popup are synchronized.
- The previous three Magic proposal chains (12 nodes) are replaced with eight chains (32 nodes): 435 total graph nodes, 393 visible per mode. The five normal Affinities' node definitions and positions are identical to the prior prototype.
- Both new talents cost 8 points from empty graph in each mode, as calculated by the actual requirement planner. Tier-2 shared side nodes retain 6-point planned routes.

| Mode | A | B |
|---|---|---|
| Arcane | Arcane Nova: paid Infusion splash, alternative to Grave Bloom on the same charge, no recursive procs | Mana Convergence: bounded low-Mana recovery with global cooldown, not per target |
| Frost | Frost Resonance: bounded pulse to other chilled active foes | Glacial Echo: single charge for control-oriented burst, no permanent boss slow |
| Fire | Controlled Burn: primary Burn concentration at the cost of secondary Burn potency | Cinder Focus: proposed single-target alternative, only one enemy and no reinforcements |
| Lightning | Static Focus: primary chain concentration at the cost of secondary damage | Storm Conductor: proposed bounded primary discharge alternative when one enemy and no reserves |

Fire/Lightning gain no new targets, chain jumps, marks, spread or detonations in the proposals. No final coefficients or effects implemented; evaluate single-target performance and tradeoffs before approval. In particular, the Storm Conductor and Cinder Focus single-target conversion budgets require concrete design because no secondary recipients exist in that state.

## Verified locally in Chromium
Four modes rendered at 1600x1000 with zero page errors; geometry checks per visible graph: zero proper segment intersections between nonincident edges, zero overlapping node circles, zero nonincident edges entering a node circle. Core lines were unchanged and excluded from the segment check. Verified mode visibility against mode-filtered graph, all dependencies exist in each mode, legal planned paths contain element_choice and selected-mode nodes only, side routes each have three alternatives, original Attunement popup switches mode and hides previous proposals, other Affinities unchanged. This is layout and requirement-planner verification, not actual allocation/refund or gameplay validation.

Prototype exists locally, not yet integrated or reproduced from a repository generator. No merge/deploy.
