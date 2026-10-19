# v0.12 integration audit and migration plan

Scope: `development` at `69d4ee3738bc0e82f8c14ccd27ce45af19640ea9`. Audit only; no gameplay, deployment, rules or player-data changes. **CONFIRMED** means inspected code or observed test output; **NEEDS VALIDATION** marks proposed behavior, balance or unresolved compatibility.

## 1. Architecture and foundation

**CONFIRMED:** Classic gameplay lives in the `index.html` closure: `totalStats` (2110), `weaponAttack` (3039), `updateFight` (3113), set/Legendary hooks and rendering. It already fights one enemy at a time. `combat/legendary.js:resolve` supplies identities; runtime behavior lives in the HTML. `combat/affinities.js` exposes a parallel implementation, but the page does not load it; importing it wholesale would duplicate/diverge from production behavior.

**CONFIRMED:** `online/v012-engine.mjs` is an isolated state machine plus simplified combat, gear and economy. `newProfile`/`stats` (65–95) use numeric item IDs, eight slots including one ring, name-based weapon detection and different stats. `tick` (364) omits mature weapon/Legendary systems. `online/v012-prototype.mjs:combat` (91) renders emoji portraits; its save is browser-wide, independent of accounts. Documentation explicitly calls numbers provisional and passives partially implemented.

**NEEDS VALIDATION — recommendation:** Keep classic combat, items, account services and presentation as the foundation. Adapt prototype `begin`, Plane offers, rewards and room transitions into an Expedition controller that invokes the classic combat runtime through a narrow adapter. Separate scheduling/results from `updateFight` only as necessary; retain one damage/status implementation and one active enemy. Do not replace the mature game with the prototype simulator.

## 2. KEEP / ADAPT / REPLACE / REMOVE

All source findings below are **CONFIRMED**; planned disposition is **NEEDS VALIDATION**.

| Action | Exact source seam | Reason / intended treatment |
|---|---|---|
| KEEP | `index.html:makeItem` (1844), `migrateItem` (1402), `itemImg` (1378), `totalStats` | Preserve IDs, nine slots/two rings, rarities, subtypes, attributes, art and upgrades. |
| KEEP | `combat/legendary.js:DEFINITIONS/resolve`; HTML `legendaryRuntime`, `legendaryAttackBonus`, `legendaryDefensiveEffects`, `legendaryKill` (2787–2843) | Preserve named abilities, cooldowns and legacy item identities. |
| ADAPT | HTML `setCounts/setBonuses` (2070/2082), `applyAffinity` (2963), `tickDots` (2757) | Retain permanent gear effects; add separately scoped Expedition passives and six-family eligibility. |
| ADAPT | Prototype `allowedPathFamilies/makePathOffers`, `choosePassive`, `choosePath` (173–260) | Keep three offers, initial guarantee, second-family repeat rule, three-family cap, rerolls and exhaustion fallback. Expand to six families. |
| REPLACE | HTML `startDungeon/nextEncounter` (2668/2675), `wavesForDungeon` (1612) | Controller owns 15 Planes; final Plane ends with boss; automatically advance sequential Waves. |
| REPLACE | HTML `winEncounter/die/extract` (3198/3231/3249) | Commit rewards permanently at award time; remove gear loss and extraction-dependent retention; boss completion alone unlocks next difficulty. |
| ADAPT | HTML `nav` (2146), equipment handlers; prototype `equip/usePotion/finishRecovery` (447/306/318) | Permit gear swaps and potions only at safe between-Plane stages; preserve HP/Mana until Expedition end. |
| KEEP/ADAPT | `economy/v0101.js`; HTML `renderForgeEconomyExtras`, `rollShop`, `refreshMerchantStock` | Preserve investment systems; retune tier/prices/reward sources. |
| KEEP/ADAPT | `online/app.mjs:sessionGuard`, `resumeAccount`, `reviewCloud`, `syncNow`; `online/model.mjs:validateSave/recoverInterruptedSave` | Preserve account isolation, revision conflicts, backups and interruption safety; introduce explicit version dispatch. |
| REMOVE after parity | Prototype `itemRoll/stats/tick`, emoji combat UI and shared-profile launcher as primary mode | Avoid duplicate combat/economy and accidental cross-account imports; retain prototype as reference until acceptance. |
| REMOVE from new loop | HTML `protectionMarkup`, protection/death warnings; obsolete extraction controls | Permanent gear cannot coexist with equipment-loss messaging or protection fees. Do not delete legacy recovery readers. |

## 3. Asset and UI reuse

**CONFIRMED:** HTML `THEMES/MOB_POOLS` (1290–1313) map all 13 backgrounds and themed enemies. `enemyFor` (2643), `ELITE_ARCHETYPES`, `BOSS_ARCHETYPES`, `eliteArt`, `heroFullImage` and `heroImage` already resolve character/enemy/Elite/boss art. Asset manifests exist in `assets/characters/`, `assets/equipment/` and `assets/dungeons/backgrounds/`.

**NEEDS VALIDATION:** Pass the selected Plane theme into those resolvers; retain Elite and boss archetypes, rather than prototype `enemyFor`'s generic guardians. Reuse `renderCombat`, `updateBars`, `enemyDebuffMarkup`, `playerStatusMarkup`, rarity frames, inventory comparisons and `online/style.css` account/mobile rules. Insert Plane cards/rewards into the established dark palette; scope `v012-prototype.css` components rather than replacing global layout. Test 320/390 px and desktop, scrolling, dialogs, touch targets and equipment access.

**CONFIRMED:** `COMBAT_VFX`, `combatVfxAsset`, `combatEffect`, `animateStrike`, `animateEnemyStrike` (2676–2747) cover weapon/projectile, Elite and boss effects. Existing Poison and Shock Staff/Wand PNGs are in `assets/combat-vfx/`; `affinityArt` (1288) maps Poison and Storm glyphs in `assets/affinities/icons-sprite.svg`. Temple cobra/spider and Stormglass knight/hawk art exist. Reuse Poison glyph/VFX for Decay and Storm glyph/Shock VFX for Lightning. **NEEDS VALIDATION:** give non-casters elemental overlays without replacing their physical strike animations. No audio implementation or audio files were identified in inspected mappings/searches; sound reuse remains unverified, not an approved removal.

## 4. Combat, six families and buildcraft

**CONFIRMED:** Classic `totalStats` gates Mana, regeneration and Spell Power on Staff/Wand; `weaponAttack` gates funded spells similarly. Prototype allows all-weapon Magic and amplifies Staff/Wand, but its 1.35/1.20 multipliers are provisional. Existing Shock is direct damage (`applyAffinity`), with hit-count Storm bonuses in `setOnAttack`; it is not yet the requested charge mechanic.

**NEEDS VALIDATION — proposed integration:** Keep weapon speed, physical coefficients, two-handed reservation, offhand matching, stat scaling and Legendary hooks. Add a distinct elemental-cast channel available after Magic selection to every weapon; establish its cadence independently of fast-weapon proc frequency. Staff/Wand amplify this channel; preserve their existing identities without charging twice or duplicating casts. Use shared damage/heal/Barrier/status helpers, source tags and non-recursive proc rules. Keep temporary family membership separate from legacy gear effect keys: owning Poison gear must not silently acquire Decay or exceed the three-family limit. Preserve gear set bonuses pending approved overlap tuning.

Magic's first acquisition must choose **Fire/Burn, Frost/Chill or Lightning/Shock** before Mana regeneration/Spell Power upgrades become eligible. Lightning proposal: capped charges on the current enemy from funded elemental hits, threshold consumption into one bounded burst, reduced boss control and no required chain targets. Decide charge expiry/carry explicitly; prevent extra-hit/echo self-trigger loops. Reuse Storm rhythm/Thunderclap hooks and visuals without applying both bursts for one source.

Decay proposal: independent magical Poison/rot DoT with capped stacks/duration; Potent Venom boosts DoT, Corrupting Touch applies bounded weakening, Withering Curse reduces enemy healing, Lingering Spores carries limited rot to the next Wave. Move prototype `poison_venom`, `poison_fangs`, `poison_spores` and Toxic processing out of Magic; replace Magic's Poison school with Lightning. Healing reduction needs enemies with meaningful healing to validate usefulness. Blood remains physical Bleed.

Proposed Decay hybrids: Blood—consume limited rot/Bleed for a capped rupture; Vitality—rot kills grant capped recovery; Aegis—rot ticks grant rate-limited Barrier; Fury—crit refreshes limited rot duration; Magic—funded elemental hits trigger a cooldown-limited rot pulse. No recursive healing/procs or unlimited boss stacking. Existing advertised but unimplemented passives (e.g. `hex_plague`, `riposte`, `life_conduit`, `spellblade`) require effect-by-effect acceptance before exposure.

Proposed theme mapping: **Blood:** forge; **Decay:** temple, void; **Vitality:** grove, shrine; **Aegis:** ward, drowned, quarry; **Fury:** crypt, bastion; **Magic:** ash, frost, storm. Preserve theme art/status identity separately from reward family. This revises prototype Temple→Blood and Void→Magic mappings.

## 5. Economy

**CONFIRMED:** Gold buys Merchant stock/Sigils; Fragments fund Forge, Legendary reinforcement and affinity transfer (`economy/v0101.js:upgradeLegendary/transfer/qualityOdds`). Runes provide permanent stat bonuses (`runeValue`, `totalStats`) and chapter-boss rewards; Sigils modify item affinities. Prototype has currencies but no equivalent sinks; its defeat text incorrectly says Sigils expire despite lacking the classic system.

**NEEDS VALIDATION:** Retain currencies, gear Sigils, Runes, materials and Forge/Merchant investment records. Explicitly distinguish permanent item Sigils from temporary Expedition passives. Re-map item-tier access independently of legacy `maxDungeon-1`; reprice income against up to 45 Waves, permanent drops and repeat farming. Keep Forge's no-Legendary rule, crafted salvage limits and independent shop refreshes. Move Rune awards to an approved Expedition milestone; never award chapter runes per incidental Elite. Keep permanent Runes outside the three temporary-family slots. Prototype Cloth/Leather/Plate bonuses (`stats`) require an explicit mapping to mature gear; do not infer material from names or overwrite legacy attributes.

## 6. Versioned save compatibility

**CONFIRMED:** Classic keys/schema use `v092`; `cloudRecord` emits envelope `schemaVersion:1`. `validateSave` rejects active runs and limits progress to 200. Rules allow only the existing save path/envelope (`firestore.rules:35–39`). HTML `load` closes interrupted runs and discards unextracted rewards; `SAVE_RESET_VERSION` is stamped, not a safe migration mechanism. Prototype has version 1 and weak structural checks; `migrateMagicProfile` only renames Arcane references.

**NEEDS VALIDATION — safe migration:** Implement pure, idempotent payload-version conversion on copies, before normalizing/loading. Archive original local/cloud payloads through existing backup flows; preserve UID, nickname, character, item IDs/stats/upgrades, currencies, stash, Sigils and Runes. Preserve old progress as `legacyProgress`; introduce separate Expedition unlocks and metric version. D200 does not prove any 15-Plane boss victory; no justified numeric difficulty conversion exists. Do not reset accounts or reuse old timed rankings.

Commit via existing expected-revision and session guards only after validation/backup succeeds. Interrupted new runs must retain already committed rewards, clear temporary effects, restore resources and never replay rewards; persist award IDs/checkpoints atomically. Test quota, crash and tab-conflict boundaries. New cloud paths/envelope versions would require separately reviewed rules changes; no rules deployment belongs to this audit.

For old local Magic+Poison prototypes: archive first; identify schema, passive IDs, Toxic fields and family count. Proposed conservative conversion ends the incompatible run, keeps prototype permanent inventory/currency in its isolated namespace, resets resources and offers a fresh six-family run. Do not auto-import shared prototype gear into authenticated accounts. Continuing such runs would require Magic→Decay/passive remapping, Magic element reselection and cap-safe compensation; seek approval rather than inventing a fourth family or silently dropping ranks. Corrupt/ambiguous data remains recoverable and blocked, never replaced with `newProfile`.

## 7. Ordered implementation roadmap

All phases are **NEEDS VALIDATION**, gated sequentially:

1. **Baseline/contracts:** `tests/combat-harness.cjs`, existing regression suites, design documentation. Resolve baseline failures; inventory every advertised passive versus runtime hook. Gate: deterministic fixtures preserving weapon/Legendary behavior.
2. **Save boundary:** `online/model.mjs`, `online/app.mjs`, HTML loader/storage helpers; migration fixtures. Gate: repeat conversion, corrupt saves, account switching, concurrent revisions, interrupted awards and quota recovery preserve originals. Dependency: approved progression/prototype policy.
3. **Controller:** adapt `v012-engine.mjs` scheduling into a dedicated controller plus HTML combat adapter. Gate: exactly 15 Planes, three truthful offers, three-family cap, repeat/reroll rules, sequential Waves, boss-only unlock, permanent rewards on defeat/reload and full end recovery. No dual simulator in integrated mode.
4. **Combat/families:** HTML stat/status/Legendary hooks, affinity metadata and prototype passive catalog. Gate: six-family eligibility; Fire/Frost/Lightning gating; Decay distinct from Bleed; all weapons, boss charges, cooldowns, proc recursion, gear overlap and HP-cap swap exploits tested.
5. **Presentation/economy:** HTML inventory/combat/Forge/Merchant, `online/style.css`, scoped Plane CSS, economy primitives. Gate: existing art/VFX paths, mobile layout, between-Plane gear/potions, no Camp/combat potion use, no stash overflow/reward loss, viable sinks.
6. **Compatibility sign-off:** save/auth/recovery, Legendary, affinity, mobile and VFX suites plus new integration fixtures. Small representative balance trials only after semantics stabilize; rollout/deployment requires a separate approved task.

## 8. Risks and validation evidence

**CONFIRMED:** Targeted read-only test run: **40 executed, 38 passed, 2 failed** across `v012-prototype.test.mjs`, `affinities.test.cjs`, `affinity-combat.test.cjs`. Prototype state-machine tests passed; existing combat speed determinism passed. Failures: legacy two-handed set-count assertion (`affinity-combat.test.cjs:10`, actual 2 versus expected 1) and outdated comparison-text assertion (:17). Reconcile intended behavior before treating these as migration gates. No broad suite, browser audit, live save access or expensive balance simulation was run.

**NEEDS VALIDATION:** Principal risks are permanent-loot inflation, HP/Mana gain from repeated equipment swaps, reward replay after crashes, stale cloud writers, gear-set/passive multiplication, and per-Wave resets incorrectly refreshing Expedition-wide survival/cooldowns. Prototype `useCampHealthPotion/useCampManaPotion` remain exported despite their removal from UI; enforce the prohibition in the integrated API. Terminal stats must ignore passives immediately, even before returning from the result screen. D200 assumptions also affect PvP, public loadouts and rankings. Preserve those systems behind compatible adapters until new progression semantics exist. Parallel affinity implementations and prototype/production tests are not interchangeable evidence.

## 9. Decisions requiring design approval

**NEEDS VALIDATION:** Approve legacy progression entitlement versus starting Expedition difficulty; handling of active Poison-Magic prototype runs; permanent gear-set interactions with temporary families; Decay hybrid effects/healing-reduction value; Lightning charge lifetime/burst tuning; Rune milestones and economy/drop rates. All other architectural work can follow the staged plan after report review.
