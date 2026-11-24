# Stage 6.47 — Grave Bloom: shared Magic + Decay action

## Scope and source

Stage 6.46 gameplay checkpoint: `f83412fd055b7b7d95617ae333e0fb9e9ef03ea5`.
Full corrected 6.46 validation [45353809961](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45353809961) completed successfully (10/10 jobs). This stage does not adjust enemies or the 6.46 mechanics.

## Problem

Grave Bloom currently has two independent implementations: the funded spell runtime (with the spell-echo counter) and the physical Arcane Infusion handler. Physical Infusion can spread Rot but does not produce its intended immediate area burst. The old runtime also selects recipients twice, so a capped Rot stack can make a burst select the wrong target.

## Candidate design

One prepared, legally acquired talent; one shared encounter-local counter, incremented only for actual funded weapon casts, elemental casts, or physical Arcane Infusion hits. A caster's funded attack plus Infusion counts once. No offhand, recursive, free or expired action can count.

Every third action: seed native Rot on the primary enemy if absent, use the strongest active Rot stack, and spread Rot to up to three other living active foes. Each recipient receives its own immediate burst, even if its Rot cap prevents another stack. No reserve or recursive targets. Against a lone enemy, only one Rot tick; no added area burst.

| Variant | Immediate damage per secondary | Copied Rot |
|---|---|---|
| Baseline | Old independent implementations | Old |
| Balanced | 45% Spell Power + 2 strongest Rot ticks | 75% |
| Strong | 80% Spell Power + 3 strongest Rot ticks | 85% |

Raw secondary burst cap: 22% normal / 7% elite / 3.5% boss maximum Health, before native secondary-hit modifiers. Rot stack caps remain native (3 with rot_focus, otherwise 6); spread expires after up to 3 remaining ticks. No new mana payment beyond the original action. Spell Echo retains its own counter.

## Reproducibility and validation

- [Contract CI 45356272607](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45356272607): success, six candidate contracts.
- [Corrected matched candidate run 45356315942](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45356315942): 2 profiles (earned Sword + Tome physical gear and Wand/Staff magical gear), 3 variants, 4 sizes (1/4/8/12), 100 matched combat seeds per size/variant. 2,400 planned fights, same gear/XP, legal respec, same roster and seeds. Baseline is unmodified 6.46 gameplay. Candidate transformations occur only in explicitly isolated CI checkouts; tests transform source in memory and never write files.
- Initial preflight failed on a stale telemetry anchor, corrected before combat. Do not claim any replay result from that run.
- Candidate laboratory only: no production gameplay modification, merge or deploy yet. Choose the coefficient set based on resolved matched data and then validate the integrated native code.


## Verified results — 2,400 native fights

[Run 45356315942](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45356315942) completed successfully, 14/14 jobs, zero timeouts. Same two legally respecced E10 actors per profile, matched combat seeds/gear/XP/roster; not 100 independently progressed characters. Wand + Tome and Staff have 25 points each; physical Sword + Tome actors have 37 and 24 points. Both profiles are Magic + Decay with legally prepared Grave Bloom, regardless of original snapshot profile name.

| Profile / variant | 1 | 4 | 8 | 12 |
|---|---:|---:|---:|---:|
| Wand/Staff baseline | 100% | 65% | 16% | 21% |
| Wand/Staff Balanced | 100% | 72% | 47% | 42% |
| Wand/Staff Strong | 100% | 72% | 50% | 43% |
| Sword + Tome baseline | 98% | 39% | 0% | 0% |
| Sword + Tome Balanced | 98% | 41% | 0% | 2% |
| Sword + Tome Strong | 98% | 43% | 1% | 3% |

In eight-enemy fights, Strong magical actors activated Grave Bloom 365 times, dealt 55,598 immediate secondary damage and copied Rot 972 times. Physical actors activated 255 times, dealt 28,706 immediate secondary damage and copied Rot 761 times. **Secondary DOT damage was recorded as zero in every variant**, despite the copy counters; the copy counters do not establish actual Rot tick damage. The native tickRot/context source has secondary attribution, but the cause of the observed zero is not yet established. Audit the live tick/settlement path and attribution with a focused reproducible native encounter before modifying coefficients. The small Strong vs Balanced win-rate differences do not justify selecting the larger coefficients yet. Investigate paid-action cadence, mana uptime, spell power, actual damage/survival and secondary Rot tick execution separately. No gameplay promotion, merge or deploy.
