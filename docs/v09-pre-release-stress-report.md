> Historical audit of the earlier local revision. Remote development subsequently added D200, runes and elites; missing-feature conclusions below do not describe current development. See v091-balance-report.md for the current balance audit.

# Wanderer v0.9 pre-release stress report

Date: 2026-10-15 (Europe/Lisbon). Branch: `development`. Starting revision: `5fd920f`. Fix/test revision: `3dd8a7b`.

**Recommendation: NO-GO for the requested full v0.9 public release.** The tested checkout is v0.9 Phase 1, not the later feature set in the requested checklist. The confirmed save/economy bugs below are fixed locally, but Firestore security tests remain blocked by an emulator download denial. No main changes, merge, push, game publication, Firebase deployment or real player save writes were performed.

## Tested scope and provenance

Native Git fetch confirmed remote `development` remains at `735830e`; this checkout includes the three local Phase 1 commits ending at `5fd920f`. No main commits were imported. No new gameplay systems were implemented during this task.

Browser tests use disposable Chromium contexts, isolated synthetic localStorage and the repository's mocked Firebase boundary. Security-rule tests target `demo-wanderer` only. No live Firebase credentials or live OAuth sessions were used.

## Results

| Command / suite | Result | Evidence / scope |
| --- | --- | --- |
| `npm ci` | Initial environment failure; frozen install passed with writable cache | `npm ci --cache /tmp/wanderer-npm-cache`; 744 packages installed, lockfile unchanged. Default home cache is not writable. |
| `npm test` | PASS | Four existing smoke suites, ten new save/gameplay stress cases, 27 Node tests. |
| `npm run test:browser` | PASS at 320/390/1440px | Account/profile creation, all five cosmetics, Guest/Google return, migration, automatic cloud sync and test rankings, offline retry, conflicts and feedback. |
| `npm run test:assets` | PASS | 1440/390px; equipment art, rarity independence, nine VFX paths, reduced motion. |
| `npm run test:recovery` | PASS | Expanded to 32 cases: Guest/Google × local/cloud/both/conflict × 320/390/768/1440px. |
| `npm run test:rules` | BLOCKED — zero rule tests executed | First failure was non-writable emulator/config cache; after supported path overrides, official Firestore emulator download returned HTTP 403 `Domain forbidden`. |
| `npm run test:pvp` | PASS | 320/390/1440px; profiles, equipment/stats/sets, nickname search, practice battle, no save or Gold changes. |
| `npm run test:affinity-browser` | PASS | 320/390/768/1440px; all nine affinities, 2→3→5 tier order, resources, stable dimensions, comparisons, speed buttons. |
| `npm run test:stress` | PASS | 12,000 seeded expeditions plus four-width gameplay/browser lifecycle tests described below. |

Node 24.19.0, Java 21 and `/usr/bin/chromium` were available. npm reports a transitive `superstatic` engine warning for Node 24 (declares 18/20/22); the executed suites passed. Prefer supported Node 22 when reproducing the Firebase CLI setup. No TLS, package integrity or emulator checksum verification was disabled.

## Confirmed bugs and fixes

| ID | Severity | Reproduction / impact | Fix and regression |
| --- | --- | --- | --- |
| SAVE-01 | P0 — data loss | Loading a save with D150 silently saved it back as D100. Malformed equipment or nonfinite item values could also be coerced/replaced during migration. JSON scalar payloads were treated as a fresh game. | Local preflight rejects unsupported progression, malformed records, nonfinite resources/stats and duplicate item identities before writing. Original bytes remain intact and saving is blocked with a recovery message. New stress cases include D150, invalid arrays, scalar/corrupt JSON, nonfinite currency/stats, malformed progress/offers/valuables and duplicate IDs. |
| SAVE-02 | P0 — data loss | A valid additional `preferences` field disappeared after load/save because migration rebuilt only a fixed list of fields. | Preserve additional top-level fields while explicitly migrating the existing supported fields. Regression checks preference preservation. This does not implement future gameplay fields. |
| SAVE-03 | P0 — replacement integrity | `WandererGame.switchSave` wrote an invalid payload over the destination before discovering it could not load. A recovery backup existed, but the active destination had already been replaced. | Validate replacement before any destination write. Regression verifies a valid account save is unchanged when an invalid replacement is rejected. |
| ECON-01 | P1 — infinite Fragments | Salvage the replacement Training Sword, reload an empty loadout, repeat. Twenty cycles generated 100 Fragments. | Newly generated starter/recovery swords retain their combat stats but have zero salvage value. Existing saved items are not rerolled or reset; an old unmarked starter may still yield its old one-time salvage value, but replacements cannot sustain the loop. |
| UI-01 | P2 — mobile overflow | Merchant equipped-item names such as “Runeforged Eclipse” overflowed narrow cards at 320px. | Allow the equipped-item comparison row to wrap. Seeded four-width browser checks verify no document overflow and usable purchase controls. |

Cloud-side application validation also rejects nonfinite item stats, duplicate identities and malformed nested save metadata before synchronization. **No Firestore rules changed.** These checks protect ordinary migration/recovery; they are not server-side anti-cheat.

The stricter duplicate-item validation exposed an existing test fixture that manually placed the same Heavy weapon in both Stash and Equipment. The fixture now equips through the real `equipItem` path rather than creating an impossible duplicated inventory. No assertion was removed.

## Gameplay stress evidence

- **5,000 seeded equipment changes/reloads:** Sword, Mace, Daggers, Bow, Staff, Wand, Two-Handed and all existing Off-Hand types; item IDs conserved exactly, no lost/duplicated items, no Off-Hand with a two-handed main weapon.
- **D1–D100 extraction loop:** rewards applied once even with repeated extraction attempts; progression capped at the implemented D100; manual farming stayed selected and did not skip levels.
- **200 death/reload cycles:** exactly two protected equipped items retained; unprotected equipment lost as intended; unextracted Gold/Fragments never banked.
- **300 locked/unlocked salvage cycles:** locked items retained, unlocked items paid once, repeated calls did not duplicate rewards.
- **12,000 production-engine expeditions:** 100 seeds × six builds × D1/10/20/30/40/50/60/70/80/100 × 1×/4×. Nine affinities rotated through seeds. 4,296 clears, no nonfinite HP/power/time, and identical outcome/HP/duration at both speeds. The engine harness replaces rendering/storage/reward callbacks, not combat calculations. Trials have a 300-second-per-encounter safety bound; this is regression stress, not a new balance adjustment or proof for all possible builds.
- **UI transactions at all four widths:** Forge consumes resources and creates one item with its detail modal; Merchant charges the advertised price and transfers one stock item; boss warning appears even with ordinary warnings disabled; three encounters at 4×, boss defeat, extraction and reopening preserve the banked rewards.
- **Existing regressions retained:** legacy Legendary first-hit behavior, set thresholds and proc limits, Guardian/Leech/Berserker bosses, inventory/rareness art, dungeon paging, warning/protection controls and automatic progression.

## Save integrity matrix

| Scenario | Coverage / outcome |
| --- | --- |
| Close during combat | Real page close/reopen in four-width stress suite; current expedition safely abandoned under existing policy, owned gear/resources preserved. |
| Reload during/after a dungeon | 32 Guest/Google recovery cases plus repeated save/load and extraction tests. |
| Close after extraction | Real page destruction/reopen; banked Gold, Fragments and inventory retained. |
| Return as Guest / Google | Mocked persisted identities and profiles; nickname reused rather than re-created. No live OAuth certification. |
| Switch/open two tabs | Real pages in one isolated browser context share localStorage. Stale write is blocked; latest stored bytes are unchanged. |
| Offline/online | Existing browser suite simulates Firebase unavailability and reconnect retry without discarding local progress. |
| Previous save migration | Existing legacy saves plus extension fields, old Legendary items, reserved Off-Hand relocation and protected IDs. |
| Local/cloud conflicts | Explicit choice retains both recovery copies. A reopen with local D100 progress and cloud D1 correctly asks for a choice rather than replacing local progress. |
| Corrupt/invalid save | Original raw bytes retained; no automatic reset. Invalid replacement is rejected before writing. |
| Storage quota failure | Synthetic failing localStorage write leaves stored save unchanged and blocks further saves. |

An unfinished expedition still loses its **unextracted** rewards on reload, as in the pre-existing recovery policy. This is distinct from banked progress or equipped-item loss. Backups are retained; this task did not add automatic repair of malformed or unsupported saves. Closing a page in Chromium is not a physical mobile OS termination, browser-data deletion or device storage-eviction test.

## Requested capabilities absent from this revision

These are release-scope mismatches, **not features added or silently substituted during testing**:

- **D101–D200:** gameplay, cloud validators, leaderboard milestones and rules currently cap at D100. D150 is tested as unsupported input and is now preserved instead of truncated.
- **Runes:** no rune reward/equip/persistence system or rune UI exists here; rune ordering cannot be certified.
- **Tank/Berserker/Vampire/Caster mob system:** current normal mobs use Bruiser/Skirmisher roles; bosses use Guardian/Leech/Berserker. These existing bosses were exercised. The requested four-archetype system is not present.
- **v0.9 active weapon skills and new Legendary powers:** only Phase 1 sets and the old generic Legendary strike exist. No later-phase abilities were added.

Treat these as **P1 release scope blockers** if all are required for the advertised release. They require the appropriate existing implementation/revision or a separately authorized development phase, not more assertions against this checkout.

## Known remaining issues and Firebase requirements

1. **P0 release gate — security verification incomplete:** the Firestore emulator artifact cannot be downloaded from `storage.googleapis.com` under current runtime network policy. This is a test blocker, not a demonstrated rules vulnerability. Rerun `FIREBASE_EMULATORS_PATH=/tmp/wanderer-emulators XDG_CONFIG_HOME=/tmp/wanderer-firebase-config npm run test:rules` after access is enabled. The command targets `demo-wanderer`, never the live project.
2. **P1 — competitive trust not implemented:** current rankings are client-reported test claims, and PvP is a simplified practice simulation with no Gold transfer. No server-validated competitive ranking guarantee is justified. A trusted backend is separate work; Firebase Cloud Functions would require Blaze. No billing or backend was activated.
3. **P1 — compatibility boundary:** unsupported D101+ or malformed/duplicated-item saves now stop safely rather than playing a silently modified save. Preserve original storage and use the compatible version or an explicitly reviewed repair. Do not clear browser data to bypass the warning.
4. **P2 — feedback version metadata:** the existing Firebase client and rules still use `appVersion: '0.8.1'` even though the page says v0.9 Phase 1. Changing the contract requires coordinated rule review; it was not changed or deployed here.
5. **P2 — device coverage:** mobile viewports were tested in Chromium, not physical iOS Safari. Live Google redirect/domain configuration, deployed rules and real network failure behavior remain unverified.

No new Firebase deployment is required specifically by these client bug fixes. Before any future release, compare the deployed rules to the reviewed repository version, run the blocked emulator suite, verify Google/Anonymous providers and authorized domains, and obtain explicit deployment authorization. Never open rules broadly to bypass a test.

## Reproduction and artifacts

Run the static server from the repository with `python3 -m http.server 8012 --bind 127.0.0.1`. Tests use isolated local browser contexts; `WANDERER_TEST_URL` can override the port. Use `npm test`, `npm run test:stress` and the suites listed above.

Screenshots were captured at `/tmp/wanderer-stress-{320,390,768,1440}-{equipment,forge,merchant,dungeons,tavern}.png`. The failing Merchant screenshot is `/tmp/wanderer-stress-overflow.png`. Local logs are `/tmp/wanderer-stress-*.log`; they are synthetic test artifacts, not production data.

Reusable `install_script` and `start_skill` instructions were saved in the environment configuration draft, including writable npm/Firebase cache paths and the demo-only emulator command. `storage.googleapis.com` was added to the draft's custom allowlist while preserving package-manager presets. The draft has **not** been activated: review/save and publish the **environment configuration**, distinct from publishing the game, to apply it. A saved draft does not establish emulator availability or reproducibility in a fresh task.

Release remains withheld pending the blocked security tests, scope reconciliation, and explicit user approval. No merge, push or publication is part of this report.
