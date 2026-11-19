# Wanderer v0.13 — Clean-sheet code and dependency audit

**Scope:** `audit/v013` only · 19 November 2026 · **No old-save compatibility requirement**.
**Status:** Broad static inventory plus targeted removals and native/browser verification.
**This is NOT a proof that no other dead paths remain.** Static references can
miss dynamic code, DOM event handlers, generated previews and import graphs.

## Audit scope and method

- Enumerated the branch's **3,531 tracked tree entries**, including assets and
  generated preview material. Reviewed **92 application files** across the
  current entry HTML, `combat/`, `online/` and `economy/`.
- Scanned **279 additional script/test files** and the separately generated
  `docs/` tree, which contains over 2,000 entries, mostly assets/screenshots.
- Indexed **48 game script tags**, old version/migration names, manual attributes,
  historical save fields, obsolete UI calls and top-level HTML functions.
- Inspected the live v15 graph/runtime, new-save validation and checkpoint
  recovery, generated Pages build, current treasure catalog, contract/crafting
  aliases, affected tests, and both root/docs code paths.
- Used conservative reachability: a missing direct script tag does **not**
  make an `.mjs` module dead (it can be imported), and a `v012` filename
  does **not** mean an old mechanic. Preserved active functionality.
- Evidence: GitHub Actions workflow
  `.github/workflows/v013-clean-sheet-audit.yml`, report artifacts
  `v013-clean-sheet-static-audit`; generator
  `scripts/v013-clean-sheet-audit.cjs`.

## Clean-sheet removal already implemented

| Confirmed obsolete item | Changed code | Why safe under clean sheet |
|---|---|---|
| Unreachable old Talent Tree editor, including manual attribute controls | `index.html`, `docs/index.html` | Actual rendering calls the v15 iframe, not the old editor |
| v15 manual Strength/Agility/Intellect/Endurance/Charisma allocation API | `combat/talent-graph-runtime.js`, mirrored `docs` | Not available in the current UI; native tree stat nodes remain |
| v9–v14 talent graph migration and four legacy graph instances | Same two v15 runtime files | Fresh accounts use v15; old saves explicitly out of scope |
| Manual saved-attribute boost used by derived stats | `combat/v012-gear-stats.js`, mirrored `docs` | New profiles gain attributes only from equipment and purchased v15 stat nodes |
| Retired two-free-starter-talent-points save override | `combat/talent-graph-runtime.js`, mirrored `docs` | New v15 profiles gain talent points only through XP; old `starterPoints:2` is rejected |
| Historical treasure-name alias table | `online/v012-treasures.js`, mirrored `docs` | New drops have stable `treasureType` IDs |
| Four unreferenced helpers in main `index.html` | `forgePreviewImage`, `heroImage`, `chanceText`, `forgeComparisonTrend` | Each had one static reference: its own declaration |
| Three unreferenced helpers in `docs/index.html` | `heroImage`, `chanceText`, `forgeComparisonTrend` | Same, but see the important Forge exception below |
| Incorrect manual-attribute metrics and obsolete migration assertions | Native simulator, build audit, tests, docs | No manual attribute allocation is playable |
| Default browser test chain targeting retired Talent Tree | `package.json` | Replaced old UI browser checks with a browser test of the real v15 iframe |

**Important exception:** `docs/index.html` still directly calls
`forgePreviewImage` in its older Forge UI, although the root `index.html`
does not. We deliberately did **not** delete that function from the docs
mirror: it would break the existing checked-in preview. Proper resolution is
regeneration from the canonical source, not a blind function deletion.

## Current dependencies that must remain (even without historical saves)

1. **`combat/automatic-talents.js`** is still needed by the active v15
   graph's construction: `combat/talent-graph-runtime.js` calls
   `G.createGraph(CATALOG, old.NODES)` and reads the source `ATTRIBUTES`.
   Its *old runtime methods* are technical debt, but removing this whole file
   would break the current graph. Split the node catalog into a v15-specific
   immutable catalog before retiring the old generator/runtime.
2. **`combat/talent-requirements.js`** is not loaded by the outer app's
   script tags, but is part of the embedded talent-rebuild preview and is
   read by `scripts/prepare-automatic-preview.mjs`. Not dead.
3. **`online/v012-save.js`** validates and persists the **current**
   expedition/account state, revision conflicts, transactions and checkpoint
   restoration. Removing compatibility with historical saves does *not*
   mean deleting current saves, persistence, cloud save or checkpoint safety.
4. **`online/v012-expedition-controller.js`**, `combat/v012-buildcraft.js`,
   equipment and combat runtimes still implement the current v0.13 game.
   Their filenames refer to code lineage, not runtime obsolescence.
5. The **`docs/` tree is a generated Pages artifact**. Production/preview
   paths must be rebuilt with `npm run build:pages`, not edited arbitrarily.

## Confirmed next candidates (not deleted automatically)

| Priority | Source | Finding | Required proof before removal |
|---|---|---|---|
| High | `combat/automatic-talents.js` | Old v8-style `create/valid/award/allocate/reset/path`, historical caps and manual attribute functions coexist with the catalog used by v15 | Extract live node catalog; compare all 343 IDs, prerequisite graph and gameplay outputs, then retest current game |
| High | `combat/talent-graph-next.js` | Options `legacyTopology`, `legacyBasic`, `legacyFocused`, `legacyV14` exist for building old trees, no longer selected by the v15 runtime | Compare current graph serialization and current-target tests before deleting branches |
| High | `economy/v013-crafting.js`, `online/v013-expedition-contracts.js` | `LEGACY_RECIPES` and explicit `legacy` plan support old recipe/contract variants | Verify new recipe discovery, current contract generation and reward validation first |
| Medium | `combat/v012-gear-stats.js`, `online/pvp-stats.mjs` | Read-only old Leather evasion, pre-hotfix Orb and old gear effects paths | Native freshly rolled item tests, combat/PvP parity, equality of new equipment formulas |
| Medium | `online/v012-expedition-controller.js` | Versioned checkpoint branches and pre-v2 route handling | Current deterministic map and checkpoint restore fixtures, including complex 15-Realm routes |
| Medium | `online/v012-save.js`, `online/model.mjs`, cloud services | Some `maxDungeon`, `chosen`, `onlineProgress` naming is historical, but actively used by current profile/PvP plumbing | Cross-service schema inventory; do not rename/drop without current account and leaderboard tests |
| Medium | `docs/` | **12 generated files differ** when rebuilding Pages from current source, including Forge UI, save runtime, gear stats and enemy abilities | Build on intended publish branch, review generated diff, commit output and recheck live preview |
| Low | `online/v012-uiux-tuning.css` and related stylesheets | Selectors for old talent graph parent DOM may be unused after iframe adoption | Real browser computed-style inspection across viewport widths |
| Low | `tests/v013-talent-tree-browser.cjs`, `tests/v013-clarity-browser.cjs` | Old Playwright scripts still target `.talentGraphViewport`, `.talentPreparation`, or direct manual attributes | Rewrite relevant modern assertions, or retire the files after current replacement test coverage |
| Low | Historical reports, screenshots, old workflows | Thousands of assets/docs and many historical Stage workflows are not necessarily runtime dependencies | Identify referenced artifacts and workflow side effects; archive individually |

A module can be indirectly imported or used by an iframe, CLI, cloud
component, existing preview build or CSS before it appears in the outer
`index.html`. These are **candidates**, not safe-delete instructions.

## Validations and outstanding limitations

- Initial scan before removals: **38/38** focused tests passed.
- After removing v9–v14 graph migration and obsolete UI helpers: **55/55**
  focused tests passed, then **58/58** in the expanded focused suite.
- A real Playwright Chromium smoke of the isolated generated preview
  successfully loaded the current **343-node v15** Talent Tree iframe,
  current `WandererTreeAPI`, and produced **zero page errors**, with no
  retired attribute panel or old graph editor.
- A separately executed **historical v0.12 treasure test file** has failures
  involving old-name save fixtures, an outdated crafting profile and
  guaranteed-drop assumptions. It is run as **non-gating diagnostics**, and
  the failures are not counted as successful current-game tests.
- The old v0.12 suite was already known to contain historical failures;
  a clean-sheet release gate must rely on current rules and native fixtures.
- A dry-run `npm run build:pages` generated **12 differing tracked docs files**.
  It did **not** deploy or commit those generated files. The checked-in docs
  copy therefore cannot be asserted to match source until rebuilt and reviewed.
- The old UI and migration removal was tested only on the isolated
  `audit/v013` branch. **No deployment, merge, gameplay coefficient
  change, guaranteed drop, player-data mutation or save migration** was done.

## Browser-test drift confirmed during the audit

The previous default `test:v013:browser` script was **not aligned with
the current UI**:

- `tests/v013-pages-browser.cjs` timed out waiting for
  `#v013OpenForge`, which is no longer present in root `index.html`.
- `tests/v013-cleanup-ui-browser.cjs` failed its obsolete
  `[data-phase3-expedition-level]` selector expectation.
- `tests/v013-talent-tree-browser.cjs` references the old parent
  `.talentGraphViewport` and old starter talent UI.
- `tests/v013-clarity-browser.cjs` expects the old
  `.talentPreparation` manual attribute panel.

These old browser files have **not** been made to pass or silently
counted as green. They remain as historical sources to migrate the useful
map/Forge assertions, while the default browser script now runs
`tests/v013-clean-sheet-browser.cjs` against the actual active v15
iframe. This narrower smoke is necessary but **not sufficient** browser
coverage for a release.

## Recommended next cleanup stages

- **C1 — Graph catalog extraction:** decouple v15 generation from the
  old `automatic-talents.js` runtime; remove obsolete graph options only
  after node IDs and derived combat effects match exactly.
- **C2 — Economy and save aliases:** remove `LEGACY_RECIPES`, old treasure
  and gear compatibility branches, plus pre-v2 checkpoint paths in small
  independently tested commits. Keep **current** recovery and anti-duplication.
- **C3 — UI and CSS:** migrate remaining obsolete root UI/CSS to active v15
  patterns, replace retired browser tests, then regenerate the `docs/`
  preview from canonical source and compare visually on desktop/mobile.
- **C4 — Release gate:** run current v0.13 native save, crafting, Talents,
  map, Boss/Elite, browser and simulator tests. Re-baseline after clean-sheet
  save format reset; then decide whether to merge or publish. Until then,
  `audit/v013` remains isolated.

**Definition of done for a complete clean sheet:** no old migrations on
the active path, no old-only callbacks in the current UI, no stale test
expectations masking current failures, a single authoritative generated
preview, and all current gameplay/regression checks passing. We are not
claiming that full definition is met yet.
