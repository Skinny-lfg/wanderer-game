# Group encounters and build specialisation

This development plan targets the isolated automatic-RPG preview. Finish and validate each stage before continuing. Keep combat automatic, retain the 15-Realm expedition, boss Rune, existing saves, and the Realm-entry checkpoint/rollback contract. Do not deploy to Firebase production.

1. **Encounter foundation (validated):** add a tested 1/2/4-enemy model, deterministic spawning, independent target state and a single encounter-completion boundary; retain legacy single-enemy behaviour and checkpoint recovery.
2. **Automatic combat and display (automated checks passed):** run all living enemies with separate clocks and effects, auto-select targets, render individual life/state, and ensure kills, boss, death and retries are correct. No manual combat actions.
3. **Route selection (validated):** put Solo, Duo and Pack on connected Realm nodes, show enemy count before entry, save it deterministically and restore old routes safely.
4. **Area and single-target combat (validated):** implement capped Two-Handed cleave and Lightning chains; distinguish primary attacks from secondary hits, stop recursion and pay Mana once per cast.
5. **Existing abilities and talent forks (automated checks passed):** give Bleed, Rot, elemental effects, survival and kill procs explicit per-target/per-action semantics; add meaningful area and single-target branches without invalidating purchased talents.
6. **Economy and balance (initial smoke comparison completed):** reward once per wave/encounter, avoid multiplying loot by mob count, and compare time, health, survival, XP and loot for 1/2/4 mobs at early and Endless tiers. Adjust only from measured results.
7. **End-to-end release (desktop/mobile smoke and automated suite completed):** test desktop/mobile interaction, synthetic 15-Realm runs, save migration, restart, boss Rune and repeat/reload protections. Publish the isolated GitHub Pages preview after checks pass.

All balance values are provisional. The design rationale and candidate starting values are in `automatic-rpg-group-combat-review.md`.

The first group implementation, area forks and isolated preview have automated coverage. See `group-combat-smoke-results.md` for the small sample and its limitations. Group difficulty and pacing remain provisional pending broader playtests.

Implemented branches include Sweeping Force, Storm Conductor, Focused Assault, Contagion, Wildfire, Winter Field, Piercing Arrow, Shielded Sweep and Concussive Swing. Secondary hits do not recursively trigger hit/cast effects. Existing purchased talents remain valid.

Loot is rolled once per completed wave; normal Duo and Pack encounters apply provisional 1.15 and 1.30 multipliers to Gold, Fragments, equipment drop probability and Realm XP. Boss/Elite rules remain solo. The current group display uses a separate enemy strip; broader UI and extended balance testing remain appropriate before treating this as final.
