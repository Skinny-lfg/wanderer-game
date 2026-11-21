# Wanderer v0.13 — Integration and preservation checkpoint (2026-11-21)

## Canonical line
* audit/v013-stage6 at Stage 6.9 is the canonical development destination; production main remains the isolated v0.12.
* PR #106 continues directly from the Stage 6.9 commit and retains all Stage 6.10 catalogue, coverage and native performance work.

## Preserved portraits and interface
* 28 approved character-equipment WebP images restored **byte-for-byte** from release/v013-portraits-pages-20261119. Both source and docs mirrors reference the exact original blobs; no images were regenerated.
* Equipment-driven art resolver copied without modifications to online/ and docs/online.
* Both HTML variants use the native equipped weapon/off-hand to choose the full-body portrait (Camp, inventory and combat). Original character selection UI is removed from the visible surface; no player save or reward migration.
* Preserved Stage 6 side lighting and saturated character CSS while adapting the earlier release's softer foot-contact shadow and 80% paper-doll scale. No wholesale overwrite of the later Stage 6 UI CSS.
* Native source and docs CSS remain synchronized; tests enforce byte-for-byte mirrored image and CSS parity.

## Git audit
* audit/v013 is ancestor of audit/v013-stage6; Stage 6.10 branch is its descendant.
* Numerous Stage 7, 8, 9 gameplay and original map branches were confirmed ancestors, not missing commits.
* Unmerged, diverged historical candidates include earlier portrait variants, old equipment fixes and experimental elite retuning. These remain preserved; do not automatically merge their entire branch into current game.
* Example exception: release/v013-portraits-pages-20261119 had 28 unique WebPs and the art module: selectively recovered here.

## Remaining checks / no-go conditions
* Do not assume git ancestry alone proves full functional parity; browser screenshots, native build tests and source/Pages asset loading are required before any release.
* Old equipment fixes and boss/elite diagnostic branches require targeted semantic comparison before closure.
* No force-push, branch deletion, overwrite of main, deploy, Firebase save changes, gameplay balance tuning or blanket PR closures.
* Close historic PRs only when their entire intent is demonstrably superseded and audit notes link the replacement SHA.
* Once PR #106 validations are reviewed, merge into audit/v013-stage6; use a single canonical integration line and stop proliferating long-lived stage branches.

Reference: https://github.com/Skinny-lfg/wanderer-game/pull/106

## Audit of the 31 open Pull Requests before consolidation

Compared each PR's HEAD to the Stage 6.10 branch using GitHub's ahead/behind history, not the PR title alone.

- **20 PR heads are ancestors** with 0 commits ahead of the integration line: #105, #104, #62, #61, #60, #55, #53, #52, #51, #50, #48, #47, #46, #45, #44, #43, #42, #41, #40, #39. Once #106 is integrated these can be closed as already incorporated, **without deleting their branches**.
- **8 diverged v0.13 PRs remain for selective semantic review**: #90 (visual integration), #81, #80, #79, #78, #77 (earlier diagnosis/progression hierarchy), #54 (older equipment alternative), #49 (alternate browser audit). They must not be mass-merged over later Stage 6 work or closed without assessing unique contributions.
- **1 non-v0.13 separate maintenance PR**: #34, based on development, not the Stage 6 integration line. Keep independent.
- **1 canonical integration PR**: #106.
- **1 long-running development-to-main PR**: #24; unrelated to v0.13 consolidation and not targeted.

Some older divergent branches have historical commits now functionally replaced by current code or by the 28 reintroduced WebP images. Git ancestry alone does not prove they are redundant.

## Regression evidence and fixes

- GitHub Actions Stage 6.10: native catalogue/pairwise test suite, 28 portraits and docs byte identity, current Talent v15 smoke, and bounded native E1 benchmark.
- Existing pre-consolidation integration suites had two red checks: Pages' expedition runtime differed from the newer source, and the Gear Power estimator cache tag in docs/index.html was stale. Both were repaired by syncing current source to docs and using the real current source SHA-256 prefix.
- A third check became red during the intentional removal of the manual hero picker; the C8 UI inventory test was updated to require equipment-driven portraits instead. This update does not suppress unrelated UI checks.
- Source gameplay modules are preserved. Pages runtime mirror uses the exact source blob SHA.
- Do not mark the entire v0.13 release ready solely from these scoped green tests. Confirm complete native gates, browser QA and compare against previous baseline before shipping.

## Rules going forward

1. The canonical integration target is audit/v013-stage6; Stage 6.10 is merged only after reviewed tests.
2. Stop creating separate long-lived Stage branches. Future work starts from the integrated HEAD; one active PR per independent change, merged or consciously deferred before the next stage.
3. Use source/Pages parity and native saved-state/loot/runtime tests on every change; never copy an older full HTML/runtime file over newer mechanics.
4. Never merge old PRs solely to tidy their state. Close verified ancestor PRs with an audit comment and retain branch and commit SHA.
5. No production deploy, no main rewrite, no deletions or force-push.
