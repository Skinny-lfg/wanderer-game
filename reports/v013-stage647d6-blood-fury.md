# Stage 6.47D.6 — Blood and Fury integration

Gameplay commit: d45ee68153ae73efeae2789e869ad7fde6a9c72b. Current branch only; no merge/deploy. Canonical combat/buildcraft/graph/catalog sources and docs mirrors updated. Graph still has 419 nodes; 44 pending nodes remain (15 unfinished abilities and their stat gates). The two Blood extensions are now legally purchasable at 6 and 7 points.

## Changes
- Accelerated Bleeding: original, non-propagated Bleed stacks independently tick on a 0.75-second clock rather than the shared one-second clock; retain each stack's damage and integer remaining tick budget. Propagated/transferred/secondary-origin stacks, Burn and Rot retain native cadence. Same raw total for an uninterrupted original stack, not guaranteed identical effective damage after caps, rounding, death, transfer or consumption. Native tick discretization still applies. Red Guillotine's copied stack is tagged secondary-origin so it uses ordinary cadence.
- Sanguine Reserve: store 25% actual healing, cap at 5% player Max HP per encounter. At full reserve an eligible physical main attack against one living enemy with no reserve enemies and an original active Bleed releases the lesser of reserve, strongest original tick and enemy Max HP cap (2.5% ordinary / 1% elite / 0.5% boss); 4s cooldown, no consumption of Bleed, no extra target. Values are implementation defaults for calibration, not balance-approved.
- Sweeping Force: existing Two-Handed secondary factors [.6,.6] preserved.
- Fan of Blades: existing [.22,.22] retained for Daggers; compare one stronger secondary against current two-target pattern on genuinely earned Dual Daggers actors before altering.
- Piercing: existing one additional target at 100% weapon damage, native reduced secondary status chance/potency retained.
- Focused Assault: 15% direct physical weapon hit bonus only when one living enemy and no reserves. Removed from funded weapon casts and elemental spells; excludes main-hand caster fallback. No new AoE.
- Relentless: same-target counter already resets when target changes; preserved.
- Fixed stale regression test attempting to purchase pending attributes; updated old Stage 6.42 assertion expecting removed Grave Bloom cast resolver. Pending-lock test now checks 44 nodes.

## Verified
Run 45395186534: both jobs passed. Full npm test: 380 + 8 + 84 + 79 = 551 passing tests, zero failures. Targeted 27/27 passing (includes architecture, earned Blood path, real runtime clock fixture, reserve constraints, physical Focused multiplier, existing weapons and Grave Bloom). Stage 6.42 AoE safeguards run 45395113368 also passed. These are contract/regression tests, not a matched E10 balance experiment. Previous D.5 browser job 138446067990 succeeded; no fresh D.6 browser capture performed.
## Remaining
- Compare real earned Dual Daggers configurations and isolated/mixed Blood/Fury on matched E10 seeds with natural vs assisted populations separate. No win-rate claims or approved numerical balance from this stage.
- Next implementation Stage 6.47D.7 Vitality/Aegis. Existing approved architecture and combat source stay on current branch.
