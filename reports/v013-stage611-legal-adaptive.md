# Wanderer v0.13 — Stage 6.11: Legal Talent Builds & Adaptive Native Accounts

**Canonical base:** audit/v013-stage6 at 5d7d3ea5b49fb4623b82b1c02085b93bd3e92cf4  
**Scope:** read-only simulation tooling. No damage/HP/AI, item drops, gameplay saves, economy, UI, Firebase or production modifications.

## 1. Legal graph instead of imaginary classes

The new Stage 6.11 script audits 27 live graph route endpoints (12 Basic, 6 current Focused, 6 Mixed and 3 Magic elemental), additional real strategic-agent skill milestones and every present Stage 6.8 smart profile at multiple point budgets.

It uses the game's own TalentGraph v15 purchase, mode-selection, prerequisites and legality validation. Outputs distinguish native-legal, point-budget-insufficient and unresolved-route. The old Magic focused nodes have been replaced in the live game; arcane_mastery is used for the real Arcane route.

**Structural point budgets are synthetic and cannot be confused with actually earned account experience.** These are selected route, skill-rank and strategy snapshots, NOT exhaustive possible allocations and NOT evidence of combat or gear availability.

## 2. Adaptively sample real E1 accounts

The native account campaign uses the existing simulationAccount runner, beginning at E1 with genuine weak starting gear and zero earned talents. It never injects XP, inventory, Boss access or Expedition unlocks. Its scheduler prioritizes as-yet-untried profiles and gaps in actual weapon-family observations, but weapon preferences do not create weapon drops.

Every attempt is checked for native earned points, graph validity, actual equipping, legitimate prior Boss unlock and runtime errors. Output includes real weapons/armor, reached rooms, actual Boss/Elite exposure, potions, Boons, resets, source SHA-256 and a stable per-account checkpoint. Reuse of a checkpoint is refused if settings or simulator files changed.

Adaptive selection introduces sampling bias; do not interpret cohort win rates as unbiased statistics. Unreached E levels or Boss encounters remain explicitly unobserved.

## 3. Commands

- npm run test:v013:stage611 — unit tests
- npm run audit:v013:stage611:legal — legal graph / profile snapshots
- npm run audit:v013:stage611:pilot — bounded four-account E1–E2 native pilot
- For an optional medium run after the pilot: node scripts/v013-stage611-legal-adaptive.cjs --mode=campaign --sample-budget=12 --max-level=3 --max-attempts=3 --max-total-attempts=6 --seeds=9701,9702,9703 --out=reports/v013-stage611-medium.json
- The identical arguments plus --resume=true resume from an existing identical-settings on-disk JSON checkpoint.

The CI workflow executes only the pilot and legality tests. Its four-account default is not a broad campaign; expand only when timing and native validity are established.

## Acceptance criteria

- Exact native TalentGraph and T.allocate/T.valid feasibility.
- No invented gear, seed, level, XP, real encounter or potion consumption.
- Clearly separate plan, native viable profile, and observed actual account.
- Repeatable seeds and source fingerprints; atomically stored progress with version-checked resume.
- Errors block the campaign. Reached E levels are never assumed.
- No automatic balance tuning, deployment, force push, deleting old branches, or overwriting production.

**Remaining for later:** full Elite spawn roster inventory, legal item/offhand combinations, observed Boss/Elite pairing coverage, larger independent cohorts and adversarial triple-wise checks. Do not claim an exhaustive E20 balance campaign.
