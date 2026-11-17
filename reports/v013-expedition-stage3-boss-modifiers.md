# Wanderer v0.13 — Stage 3: Boss Modifiers

**Status:** completed on isolated Stage 3 branch and proposed as draft PR. **NOT merged or published.** Base: Stage 2 PR #43, followed by Stage 1 PR #42, Stage 0 PR #41 and simulator PR #40.

## Preserved gameplay

- Three existing boss archetypes: Abyssal Guardian (Guardian, native Barrier), Rift Harbinger (Leech, native life drain), Ember Sovereign (Berserker, native enrage).
- Three difficulties: Guarded / Dangerous / Brutal, with 1/2/3 boss properties and original 0/1/2 boss escorts.
- Original radial map topology, 18/20/22 rooms, 14/13/12 steps, Elite counts, encounter traits, gear, Talent Tree and reward economy.
- Existing Stage 0 Expedition Conditions are still only **planning metadata**, not gameplay effects.

## Implemented properties (Stage 0 names and numeric values)

| ID | Name | Native effect |
|---|---|---|
| `bone_ward` | Bone Ward | +15% boss max HP as initial Barrier; never generated for Guardian |
| `graven_hide` | Graven Hide | +12% boss Defense, including baseline defense for Sunder interactions |
| `sanguine_frenzy` | Sanguine Frenzy | Once below 50% boss HP, +12% Attack Speed; never generated for Ember Sovereign |
| `soul_drain` | Soul Drain | −15% healing received by the player **only during the boss encounter**; multiplies existing healing reduction |
| `profane_pulse` | Profane Pulse | Every 15 combat seconds, 4% player max HP damage, absorbed by Barrier before HP; can cause death, honoring current Last Bastion / Second Wind / Last Stand recovery logic |
| `gravebound_retinue` | Gravebound Retinue | +1 escort, capped at 3 escorts / 4 on-field enemies including the boss |

The existing Stage 0 planner prevents `Unbroken Ward + Bone Ward` and `Sanguine Rite + Sanguine Frenzy`. Runtime checks reject invalid or incompatible combinations; bosses and non-boss encounters do not receive each other's modifiers. Effects are applied once per boss spawn. `Profane Pulse` ceases after boss death.

## Information boundary / UI

- Before selecting a Realm Card, show **one known boss omen** (first deterministic modifier); remaining 1–2 properties on Dangerous/Brutal remain unknown.
- On the map and the boss room confirmation, show the known omen and count of unrevealed properties.
- During boss combat, all active property names are visible in the combat panel and logged at entry; Sanguine Frenzy/Profane Pulse trigger log messages are visible.
- No new buttons or extra travel steps.

## Native engine and deterministic simulator

- New pure adapter: `online/v013-boss-modifiers.js`, using Stage 0 catalogue and the existing combat engine.
- Integrated through `online/v012-expedition-runtime.js`, `combat/v012-combat-runtime.js` and `index.html`, with real active/reserve enemies, Barrier, incoming damage, healing and survival effects.
- The existing native simulation harness loads the same module. Combat rows now record `bossModifierIds`, `bossPulseTriggers` and `bossFrenzyTriggers`.
- New diagnostic mode:

```bash
npm run test:v013:bossmods
node scripts/simulate-progression.cjs --mode=bossmods --levels=1,5,15,35,70,100,250,1000 --seeds=9101,9102,9103 --out=reports/v013-bossmods-diagnostic.json
```

`--mode=bossmods` uses an artificial first-ring **Rift Harbinger** boss (not a naturally generated map room), testing baseline versus each modifier one at a time with identical seeds, builds and equipment. This is **controlled combat screening**, not the full multi-property natural boss or complete 15-Realm progression.

## Validation executed on matching Git blobs

- **64/64 focused automated tests** (Stages 0–3, native simulator) passed.
- **10,000 native Expedition seeds** checked all three cards, the correct 1/2/3 modifier counts, initial known property, valid style/condition compatibility.
- **672 matched-seed boss-combat diagnostic trials** (8 Expedition Levels × 4 builds × 3 seeds × 7 variants): 672 wins, 0 deaths, 0 errors, 0 timeouts. These are synthetic fixed-gear/24-point builds and **do not prove balance**. Particularly, short fights often end before Profane Pulse's 15s timer.
- Native integration tests cover actual enemy stats, initial Barrier, guard cap, 15% healing penalty, one-time Frenzy threshold, 15s Pulse with Barrier, lethal death transition, and rejection of duplicate built-in boss patterns.
- `npm run test:v013`: **48 legacy failing tests, identical by name to the Stage 2 baseline; 0 new failures**. This suite is not green. Focused tests passed.
- The nine changed runtime/test source files were read back from GitHub and matched by Git blob SHA with locally tested bytes. The GitHub branch does not represent code changes to the user's own computer.
- **No GitHub Actions CI pass and no desktop/mobile browser playtest** claimed; those remain release gates.

## Next stage (Stage 4)

Introduce marked Elite objective and Forgotten Reliquary as optional opportunities to remove a guard, weaken the boss or disable a property. These operations must be modelled in the *current* controller with unique one-time rewards, must alter the manifest's effective boss properties at combat entry, and must be visible before the final fight. The current six properties cannot yet be disabled by exploration; they can only be fought.

Do not merge to `main`, alter user saves, or publish GitHub Pages without separate review and approval.
