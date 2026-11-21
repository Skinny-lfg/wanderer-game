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
