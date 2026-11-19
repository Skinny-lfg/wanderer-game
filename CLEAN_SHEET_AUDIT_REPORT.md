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

**Resolved in C3:** `docs/index.html` and the dependent Pages files were regenerated
from the current source; the old Forge UI exception is no longer applicable.
The checked-in generated preview is now reproducible from the same builder.

## Current dependencies that must remain (even without historical saves)

1. **`combat/talent-catalog.js`** now provides the active v15 node definitions
   and `ATTRIBUTES` to `combat/talent-graph-runtime.js`. Stage C1 removed
   the root game and Talent Tree iframe's dependency on
   `combat/automatic-talents.js`. The historical runtime remains in the
   repository solely for the legacy fixture and equivalence tests; it is not
   loaded by the active UI. Delete it only after those historical tests are
   retired or migrated.
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
5. The **`docs/` tree is a generated Pages artifact**. C3 synchronized the mirror
   using `npm run build:pages` (22 paths updated), committed it to `audit/v013`
   and verified a second build produced no changes. Source remains authoritative.

## Confirmed next candidates (not deleted automatically)

| Priority | Source | Finding | Required proof before removal |
|---|---|---|---|
| Medium | `combat/automatic-talents.js` | Historical v8-style runtime is no longer loaded by active v15; retained as golden-master fixture | Retire or migrate historical tests that still use it, then delete the obsolete runtime (do not regress current v15 graph) |
| High | `combat/talent-graph-next.js` | Options `legacyTopology`, `legacyBasic`, `legacyFocused`, `legacyV14` exist for building old trees, no longer selected by the v15 runtime | Compare current graph serialization and current-target tests before deleting branches |
| Completed C2 | `economy/v013-crafting.js`, `online/v013-expedition-contracts.js` | Hidden Off-Hand Dagger recipe IDs and old contract plan acceptance removed | Validated current Recipe/Contract paths and forged-plan rejection in CI |
| Completed C2 (legacy stat shims) | `combat/v012-gear-stats.js`, `online/pvp-stats.mjs` | Removed historical Leather missing-rating fallback and pre-hotfix Orb multiplier | Current gear budget and direct stored stats preserved; further full combat/PvP reconciliation remains a release check |
| Completed C2 (restore branch) | `online/v012-expedition-controller.js` | Only current deterministic Dungeon state can be restored; old 15-Realm checkpoints rejected | Current Dungeon checkpoint integrity tests passed; historical generation code may still need separate runtime pruning |
| Medium | `online/v012-save.js`, `online/model.mjs`, cloud services | Some `maxDungeon`, `chosen`, `onlineProgress` naming is historical, but actively used by current profile/PvP plumbing | Cross-service schema inventory; do not rename/drop without current account and leaderboard tests |
| Completed C3 | `docs/` | 22 generated paths updated from the canonical isolated preview | Commit `a923e69`; repeated build yielded no changes, without deploying |
| Completed C3 (parent CSS) | `online/v012-uiux-tuning.css` | 74 obsolete inline Talent Tree selector lines removed (approximately 14 KB) | Preserved active XP, stat-color, route/Forge, and iframe-parent CSS; two browser viewport suites passed |
| Completed C3 (retired browser files) | Four obsolete `tests/v013-*browser.cjs` files | Old parent talent, Forge and map selectors no longer match the current app | Deleted in `42ec916`; replaced by `tests/v013-c3-ui-browser.cjs` and the current v15 smoke |
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

Those four obsolete browser files were **not** counted as passing tests. C3
removed them after adding modern assertions for the actual v15 Talent Tree,
Forge, Inventory and deterministic Dungeon map, with desktop/mobile Chromium.
The original 2026-11-19 observations are kept above as audit provenance.

## Final verification checkpoint

**Passed workflow:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44593156960
(checked commit `4f03539992ee600a1ed16fa8d157f12fb07f4b0b`).
Both workflow jobs completed **successfully**, with:

- **58/58** targeted clean-sheet, fresh-account, native save/contract,
  treasure and v15 build-audit tests passed.
- **76/76** current talent graph tests passed.
- Real Chrome/Playwright preview opened the v15 iframe and confirmed
  **343 nodes**, **zero JavaScript errors**, and no manual attribute
  controls or obsolete parent canvas.
- `npm run build:pages` completed in an ephemeral runner, showing
  **12 differing generated docs files**. This check did not commit or
  publish those differences.
- The old `tests/v012-phase-c3-treasures.test.cjs` diagnostic remained
  **2/5 passing, 3/5 failing** because of old treasure/save fixtures
  and changed drop behavior. It is explicitly outside the clean-sheet
  release gate; it has not been represented as passing.

The present default `npm run test:v013:browser` runs both the fresh v15 smoke
and the C3 current UI regression in Chromium at 1280px and 390px. It verifies
Forge crafting, Inventory popup, three Dungeon Card choices, two Contracts,
visible fog-of-war nodes, zoom, room inspection and zero JavaScript errors.
Long-form combat/boss/extraction and full breadth remain C4 release-gate work.

## Recommended next cleanup stages

- **C1 — Graph catalog extraction (completed):** v15 now reads
  `combat/talent-catalog.js` directly and no longer loads the historical
  automatic runtime. Full-node parity and representative combat output
  comparisons passed. Pruning old-only graph options and deleting the
  retained historical test fixture remain separate gated cleanup work.
- **C2 — Economy and save aliases (completed):** remove hidden obsolete
  recipes and contract fallbacks; eliminate pre-hotfix Leather/Orb derived-stat
  shims and retired recipe IDs; reject non-Dungeon controller checkpoints.
  Require a fresh `c2-clean-sheet` save generation, preserve owner-bound revisions
  and modern restore/anti-duplication. No deployment or live data mutation.
- **C3 — UI, CSS, browser and generated Pages (completed):** remove obsolete
  inline-tree CSS and old browser scripts, replace with current desktop/mobile
  tests, regenerate the isolated Pages mirror and prove a deterministic build.
- **C4 — Release gate:** run current v0.13 native save, crafting, Talents,
  map, Boss/Elite, browser and simulator tests. Re-baseline after clean-sheet
  save format reset; then decide whether to merge or publish. Until then,
  `audit/v013` remains isolated.

**Definition of done for a complete clean sheet:** no old migrations on
the active path, no old-only callbacks in the current UI, no stale test
expectations masking current failures, a single authoritative generated
preview, and all current gameplay/regression checks passing. We are not
claiming that full definition is met yet.

## Stage C1 verification — 19 November 2026

- **Implementation:** commits `b4fb0d8`, `30a4ddf`, `f71c9f2` on `audit/v013`.
- **Active graph source:** `combat/talent-catalog.js` builds the same legacy-source node list, then `combat/talent-graph-runtime.js` constructs the current v15 tree exclusively from it. Active root and iframe no longer include `automatic-talents.js`.
- **Parity test:** `tests/v013-c1-catalog-equivalence.test.cjs` confirms source node equality, all **343** ordered v15 node definitions (including prerequisites and gameplay values), representative native combat stats and projections, and live script wiring.
- **GitHub Actions verification:** [run 44595522594](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44595522594) — successful on commit `f71c9f2191ea8b9e819bab2b67eb262d4e7c2490`. **62/62** native tests, **80/80** Talent Graph tests, and the real Chromium v15 browser smoke passed.
- Historical v0.12 treasure tests remain **2/5 passing, 3/5 failing** and are explicitly diagnostic rather than release gating.
- Ephemeral Pages regeneration reported **16 differing tracked `docs/` paths**, compared with 12 at the prior checkpoint. **Nothing in `docs/` was committed or deployed.** The checked-in preview still needs review and regeneration before release.
- **No balancing, published-version, save-data, merge or deploy changes.** Full clean-sheet completion remains pending C2–C4 and obsolete test cleanup.


## Stage C2 verification — 19 November 2026

- **Implementation branch:** `audit/v013`. Main changes are in commits `95d2ba7`, `5392124`, `d47f9a4`, `66da9d5`, `18b0821` and `afaec29`.
- **Current blueprints:** `LEGACY_RECIPES`, hidden `green_offdagger`/`blue_offdagger` recipes and old Contract plan validation are removed. Current Blueprint discovery and reward provenance are still checked.
- **Current equipment:** no pre-hotfix Leather missing-stat scaling, no old Orb +12% projection and no newly generated `orbSpellB4` flags. Modern Leather can legitimately have zero Evasion if the current gear budget does not roll it; no gear coefficients were deliberately changed.
- **Current checkpoints:** `online/v012-expedition-controller.js` now accepts restore of version-2 current Dungeon checkpoints only. Retired old local potion-dose conversion and treasure normalization on resume have been removed; current session persistence and anti-duplication remain.
- **Full clean-sheet reset:** `online/v012-save.js` now requires `saveGeneration: 'c2-clean-sheet'` in addition to schema version 13. A new local namespace isolates old browser saves, and the cloud coordinator has a **one-time generation reset for every project/account on next login once deployed**, using optimistic owner-bound revision checks and the Firestore-compatible v13 envelope. The old cloud record is replaced, not deleted in advance. **No server data were changed in this audit branch.** Inactive cloud accounts will not reset until they log in after deployment.
- **Validation:** [GitHub Actions run 44598412476](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44598412476), successfully verified at commit `afaec2989108efb86c1b186d6acc0c0eddb40438`. **68/68** current native save/regression tests, **80/80** Talent Graph tests, **69/69** C2 current Forge/Contract/Gear/Dungeon/Cloud tests and the Chromium browser smoke passed.
- **Historical tests:** the retired v0.12 treasure suite remains **2/5 passing, 3/5 failing**, intentionally non-gating. Legacy test assumptions are not carried forward as gameplay requirements.
- **Generated docs:** ephemeral `npm run build:pages` found **21 changed `docs/` paths** against the checked-in preview. Generated files were **not committed or published**; resolve in Stage C3.
- **Next:** Stage C3 for remaining old-only UI/JS/CSS, generated preview sync and modern browser coverage. Stage C4 for the complete current release gate. The old 15-Realm generator and historical talent test fixture need separate reachability-based deletion; C2 removed obsolete restore paths, not every old source declaration.

## Stage C3 verification — 19 November 2026

- **CSS:** commit `f26c8af` removed 74 historical CSS lines (around 14 KB) from `online/v012-uiux-tuning.css`. The current v15 Talent Tree renders in `preview/talent-rebuild/index.html`, not the retired parent `.talentGraphCanvas`. Preserved the current iframe container, XP, character stats, Forge, combat and route selectors; `tests/v013-c3-ui-static.test.cjs` enforces that separation.
- **Real UI:** `tests/v013-c3-ui-browser.cjs` now runs alongside the clean-sheet browser smoke through `npm run test:v013:browser`. The test operates on a throwaway isolated preview without login/Firebase, across **1280×800** and **390×844**, and checks 343 v15 nodes, real `green_sword` forging, Inventory item dialog bounds, 3 risk cards, 2 optional Contracts, a current 18+ node Dungeon topology with 5 initially visible fog-of-war nodes, map zoom (100% → 120%), room inspection and **zero browser JavaScript errors**. Screenshots from both viewports are retained by CI as `v013-c3-responsive-browser`.
- **Obsolete browser tests:** commit `42ec916` removed `tests/v013-talent-tree-browser.cjs`, `tests/v013-clarity-browser.cjs`, `tests/v013-pages-browser.cjs` and `tests/v013-cleanup-ui-browser.cjs`. These targeted retired selectors and were not run by the current npm test commands. Current behavioral coverage supersedes their UI-specific assumptions; deeper combat/extraction remain a separate C4 target.
- **Generated Pages:** GitHub Actions [run 44604317041](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44604317041) successfully ran current native and desktop/mobile browser gates, generated the canonical isolated mirror, and wrote the **22 changed `docs/` paths** as commit `a923e691f0eb3203754758d62e93fc32d6ee8ede` on `audit/v013`. A second generation produced `C3_DOCS_SOURCE_PARITY=true`, with no residual tracked/untracked docs changes. This was a branch-only Git commit, **not a Pages deploy**.
- **Workflow safety:** the sync job runs only for `audit/v013`, only after both native and browser jobs pass, and has a narrowly scoped GitHub write permission. It never merges or publishes. Current production, saved user data and balance rules were not changed in C3.
- **Remaining C4 gates:** run broader current 0.13 combat, Elite/Boss, economy and native/cloud regressions, long-form browser progression and simulations. Historical `combat/automatic-talents.js` fixtures, old graph generation options and potential additional unreachable code should be separately verified before removal. C3 does not claim that all old code has been eliminated.

## Stage C4 verification — 19 November 2026

- **Implementation:** `.github/workflows/v013-c4-release-gate.yml` on `audit/v013` checks gameplay/native simulation, Firebase security/account data, real browser deep-gameplay scenarios and natural-account progression/source–docs parity. Mandatory browser long-form scenarios were promoted from diagnostic after passing.
- **Final CI:** [run 44606688365](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44606688365), successful at `daaba84ea4ca156de6ca5f2df11eca6f9757b5c2`, with **4/4 jobs passing**.
- **Native and security:** **327/327** current v0.13 gameplay, **7/7** simulator, **89/89** Boss/Elite/agent, **85/85** economy/encounter integration tests; **51/51** save/cloud/security fixtures and **11/11** Firestore + Auth emulator rules. Broken old tests were corrected to reject clean-sheet-incompatible checkpoints and missing manual attributes; a Stage 8.2 test now checks the shared charged-strike cap.
- **Browser:** current v15, Forge, Inventory, Dungeon on 1280px and 390px, plus long-form native Chromium checks of talent purchase/reload, Oracle, Marked Elite, Boss and extraction/reload, all passed. `docs/` regeneration is deterministic and unchanged.
- **Natural pilot:** Cautious/Balanced **0 E1 wins in 32 attempts** (24 extracts, 8 deaths, 3 reaches to Boss). Daring **1 E1 win in 9 attempts**; then **0 E2 wins in 12 attempts**. These are real native-agent outcomes, *not* a representative human win rate. E5, E10 and E20 have **no observed attempts** and are not quantified.
- **Decision:** Technical C4 gate **PASS**; release-quality recommendation **NO-GO pending analysis of the agent/progression bottleneck and final reachability review of old-only talent/route source**. No game balancing, production account mutation, merge or deployment in C4.
- **Full standalone details:** [`reports/v013-c4-release-gate.md`](reports/v013-c4-release-gate.md).
