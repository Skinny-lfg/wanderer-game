# Wanderer v0.13 — Off-Hand identity, Stage 1

Scope: native mechanics only. No production merge or deployment.
Baseline: Stage 5 stat consistency `e5fbc7bb`.
Implementation: `df6b676b99d52c6d99cc4556c344f44543d3aae8`.
Mandatory test gate: `3612d4f4ad0030be20ec041eb8b3a89394e4499e`.

## Native behavior

- **Orb / Wand:** retains Orb Ward, 2.5% Max HP Barrier on a funded cast, once every 6 combat seconds.
- **Orb / one-handed Magic or Decay hybrid:** grants 1.5% Max HP Barrier on successful direct main-hand HP damage or funded magic/Mana-spending actions. One shared `wandOrbBarrier` cooldown prevents double procs. A purely physical build with neither Magic nor Decay has no Orb Ward.
- **Tome:** Arcane Recall restores up to 3 Mana after each three paid actions (funded Staff/Wand casts, native physical-weapon automatic Magic casts, and paid Buildcraft abilities such as Decay), with a 6-second cooldown. Restoration never exceeds max Mana, and actions with zero cost do not count through the Buildcraft spend hook. The counter resets every three actions; cooldown failure does not defer a proc.
- **Charm:** Charm Renewal restores 1.5% Max HP on a main-hand attack that actually removes enemy HP, with an 8-second cooldown. It is inactive at full HP, ignores secondary dagger strikes, and uses native healing modifiers, debuffs and HP cap.
- Two-handed weapons continue to exclude Off-Hand effects through `totalStats` projection.

## Telemetry

Combat metrics: `offhandOrbBarrier`, `offhandTomeMana`, `offhandCharmHealing`; proc counters `Off-Hand: Orb Ward`, `Off-Hand: Tome Recall`, `Off-Hand: Charm Renewal`. These are native simulation metrics, not independently estimated combat formulas.

## Changed files

- `combat/v012-combat-runtime.js`
- `docs/combat/v012-combat-runtime.js` (exact mirror)
- `docs/index.html` (SHA256 cache tag refreshed)
- `tests/v013-offhand-stage1.test.cjs` (six native integration/contract tests)
- `package.json` (tests included in mandatory v0.13 gate)

## Validation

Mandatory C7 [run 44739334185](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44739334185): **all 4 jobs succeeded** (current-native, browser-journey, security-account, natural-and-source-parity).

- 338/338 current gameplay tests (includes the six new Off-Hand tests).
- 7/7 simulation tests.
- 79/79 Talent Graph tests.
- 94/94 combat, Elite and Boss tests.
- 85/85 integration/economy tests.
- Frozen Stage 2/3 comparisons and Stage 4 hybrid review passed.
- Canonical source/docs parity passed after `npm run build:pages`.
- No merge to `main`, no deploy.

## Deliberately deferred

Stage 2: change Tome/Charm/Orb main stat profile and affix probabilities. Stage 3: add meaningful Epic Tome/Charm recipes. Stage 4: add item descriptions, tooltips, and comparative UI; audit obsolete magic-offhand paths. Stage 5: direct paired build/offhand balance comparisons, using the new native telemetry. This stage establishes gameplay identities, not final numeric balance.
