# Online test phase — implementation log

Source of truth: supplied GDD, archived verbatim in `design/gdd-source-2026-10-15.txt`, sections 12.6–12.7 and the latest user instructions. This document is the implementation addendum; the Google Drive document has not been edited.

## Stage 1 — characters and save foundation
- Integrated the supplied five full-body images and five portraits without regenerating art; names/IDs follow the supplied manifest. All characters are cosmetic.
- Preserved Two-Handed, Off-Hand Dagger, Block, bosses, equipment and economy.
- Removed the automatic reset-on-version-mismatch behavior. Valid legacy saves migrate without resetting progress. Corrupt saves are retained rather than overwritten; the Account UI will offer raw export.
- Added separate guest/account slots, backups before switching/replacing, and stale-tab write protection. Legacy progress has no invented historical completion times.
- Tests: `node tests/phase2-smoke.cjs`, `node tests/online-save-compat.cjs`, `node --test tests/online-model.test.mjs`.
- Previous uncommitted UI work is preserved in Git stash `Preserve earlier local UI changes before online phase audit`, plus `/tmp/wanderer-pre-online-backup/`; latest remote development already supersedes this old base. No main changes.
