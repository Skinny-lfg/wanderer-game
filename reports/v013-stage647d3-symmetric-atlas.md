# Stage 6.47D.3 — Symmetric atlas design checkpoint

This is a **read-only local HTML prototype**, built from the previous verified 6.47D.2B.2 interactive HTML and actual graph. The prototype HTML is delivered in the conversation; this checkpoint records the design, not an integrated game-source change. No combat changes, merge or deploy.

## Layout and provisional talent assignments

Five normal affinities share the exact same bilateral fan coordinates, rotated by 60-degree increments. Basic detour nodes now sit at local (+/-340,1450), between their earlier prerequisites and later destination, eliminating the backward route. Each inner fork starts from the affinity; side forks start from equivalent first basic stat nodes. Each fork retains four edges including the gate. Six alternate OR connections per normal affinity: inner -> either tier-1 Focused side; left/right -> respective tier-2 Basic path and Focused side. Both Focused side prerequisites remain mandatory; previous routes remain available.

| Family | Inner (6) | Left (7) | Right (7) |
|---|---|---|---|
| Blood | Accelerated Bleeding | Cleave Mastery | Blood Reservoir (reserved redesign) |
| Fury | Fan of Blades | Piercing | Focused |
| Vitality | Vital Pulse | Living Force | Grasping Roots |
| Aegis | Ward Echo | Sword Sweep | Mace Shockwave |
| Decay | Contagious Touch | Corruption Nova | Soul Drain |

Magic retains Attunement, mode-specific central elemental talents and shared side paths. Arcane Nova (7) appears only in Arcane; Frost Resonance (7, formerly proposed Elemental Resonance) occupies the same geometric slot only in Frost; proposed Mana Convergence (8) is Arcane-only, pending resource telemetry. Fire/Lightning do not gain these proposed skills. Explicit Attunement requirements remain in the inspector; redundant direct lines from Attunement to the elemental gates and Mana Convergence are not drawn, avoiding visual intersections. No effects are implemented.

## Actual local Chromium verification

415 graph nodes, 600 drawn edges including six core links. Geometry audit for each of Arcane, Fire, Frost, Lightning (only nodes and edges visible in that mode): zero node-circle overlaps, zero proper intersections between nonincident segments, zero nonincident edges crossing the interior of a node. The actual requirement planner returned 6/7/7 for all fifteen normal-affinity slots and 8/12/18 for each existing Focused trio. Browser rendered full and individual affinity views with zero page errors; switching to Frost showed Frost Resonance and hid Arcane Nova. Note: local browser was supplied HTML via Playwright set_content because file navigation was blocked by administrator; not a deployed game.

## Remaining decisions

All new paths and requirements are prototypes. Proposed existing talent relocations (Second Breath/Vital Strike, Retaliation vs Fortified, Blight vs Virulent Rot), Focused's cheaper access and Blood Reservoir replacement remain pending design/balance review. The cost reductions of native weapon talents are potentially material and not yet approved as final gameplay. New ability stats are not defined or tested. Before integration, create reproducible source generator, audit actual talent allocator, mode switching/refunds, planner and simulator, evaluate matched control builds, then integrate in stages. Do not treat absence of geometric crossings as a gameplay validation.
