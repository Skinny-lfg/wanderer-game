## Checkpoint canónico da v0.13 — 22 de novembro de 2026 (revisão dos 7 Contracts)

- A versão de desenvolvimento consolidada é `audit/v013-stage6`, espelhada integralmente em `playtest/v013-complete`. A referência anterior está no commit `f4fe3d83d5a647be1b33dc154953bdf813c28a17`; qualquer nova revisão deve avançar **ambos** após CI verde, sem tocar em `main`, GitHub Pages de produção ou Firebase.
- **Catálogo atual: 7 Contracts.** Bounty Writ, Purification, Oath of Defiance, Monster Hunt (6/8/10 mobs), Skirmish Orders (3 salas), Marked Chambers (2 salas marcadas) e **Boon Collector (escolher 2 Boons diferentes nos 2 Shrines de uma só Expedition)**. `pathfinder` e `shrine_oath` foram retirados.
- A seleção continua a oferecer exatamente **2 Contracts**, dos quais se pode aceitar 1. Cada opção mostra uma recompensa fixa e única: Gold, Essence, Fragments, Reagent, Potion ou **Blueprint Rare/Epic garantida** quando essa for a recompensa sorteada (5/7/10% por opção conforme o risco, no máximo 1 Blueprint entre as 2 opções). Não existe rolagem de Blueprint extra nem fallback.
- Uma recompensa de Contract só é liquidada após concluir o objetivo **e extrair com vida ou vencer o Boss final**. Morrer/abandonar perde o prémio; os recibos não se podem duplicar.
- **Boon Collector** conta só decisões nativas `choose_boon` ligadas às duas salas Shrine realmente visitadas/limpas. Um Shrine descoberto, saltado ou sem seleção não conta; a oferta verifica se a deslocação por ambos é possível dentro do limite de passos.
- A PR [#121](https://github.com/Skinny-lfg/wanderer-game/pull/121) foi integrada e validada em [CI 45042117841](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45042117841). Alterações posteriores têm de repetir as baterias completas. A v0.13 é **clean sheet**: não reintroduzir migrações para saves/drafts históricos, mas manter persistência e checkpoints correntes.
- O texto abaixo documenta checkpoints **históricos** de novembro. Quando divergir deste cabeçalho, prevalece o catálogo e a implementação atuais.

---

## Current canonical v0.13 checkpoint — guaranteed Blueprint Contract prizes and marked chambers (2026-11-22)

- **PR #120 merged** into canonical development branch `audit/v013-stage6`, merge SHA `78341c3094db21c21d83310fa95f7009a5fe1b74`, **NO deploy to `main`, production or Firebase**. All approved previous v0.13 gameplay and Stage 6.18–6.21 combat tuning are retained.
- **Contract rewards are ONE displayed, guaranteed prize**, not a base reward plus an extra Blueprint chance. Basic prize options unchanged (Gold, Essence, Fragments, Affinity Reagent, a real potion). A standalone guaranteed unlearned Rare/Epic **Blueprint prize appears rarely, 5%/7%/10% per Contract option at Guarded/Dangerous/Brutal**, at most one Blueprint offer across the two optional Contract choices. If the player fulfills that objective **and safely extracts or wins the final Boss**, the displayed Blueprint itself is earned: **no completion-time RNG, fallback or bonus currency**. Blueprint family/difficulty restrictions and no-duplicate receipt checks retained.
- **Contract catalog now has SIX objectives**: `bounty_writ`, `purification`, `oath_of_defiance`, `monster_hunt`, `skirmish_clear`, `marked_chambers`. Removed confusing `pathfinder` (two sectors) and too-easy `shrine_oath` (select a Boon). Still **exactly TWO offers and at most ONE selected Contract per Expedition**.
- **Marked Chambers** chooses two specific ordinary combat rooms on **different map passages**, preferentially past the entrance ring, with a conservative shortest non-secret-path budget bound accounting for return travel. Targets visibly show **🎯** in `index.html` / `docs/index.html`, including when not immediately accessible. Map topology and travel rules unchanged. Only native cleared rooms with matching controller combat-history records advance 0/2→1/2→2/2. Neither scouting, entering without winning nor clearing unrelated rooms counts. The exact seeded pair is in the verified contract offer/selection ledger; save alterations are rejected.
- **Mandatory alive-extraction rule remains:** no Contract receipt just for finishing an objective. If the player dies or abandons before extracting, zero Contract reward. If the player extracts alive or wins the final Boss, the precommitted prize is paid once. Existing marked-Elite ordinary combat/economy rewards remain separate and unchanged.
- **Native regression CI SUCCESS:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/45023646576; actual source/isolated Pages previews match byte-for-byte for catalog, Contract logic and map-target CSS. Tests include six quest kinds, genuine guaranteed Blueprint payout and no duplicate, low Blueprint offer frequency, pair route feasibility across Realms and risks, UI markers, death forfeiture, native map, Boss preparation, potions, account progression and v0.13 integration.
- Full documentation: `reports/v013-contracts-guaranteed-blueprints-marked-chambers.md`. v0.13 **in-progress old Contract offers/checkpoints may not restore** because the deterministic plan/catalog changed; begin a new Expedition on the user's playtest branch. Do not attempt preservation migrations for clean-sheet v0.13.
- **Unified user playtest branch:** fast-forward `playtest/v013-complete` to this canonical branch SHA after the checkpoint. Never cherry-pick old feature branches into the playtest or publish `main` without explicit approval.

---

## Current canonical v0.13 checkpoint — seven extraction-secured Contracts (2026-11-22)

- **PR #119 merged** into `audit/v013-stage6` (SHA `161d6e3759f42b05a105108af11b03a1cf0777b1`). This change is gameplay **development only**, with **NO deploy to `main`/production/Firebase**. The approved Stages 6.18–6.21 normal mobs, Elites and Bosses are retained.
- Contract selection remains **one of two optional, feasible objectives per Expedition**. Total **seven** canonical IDs in `combat/v013-expedition-foundation.js`: original `bounty_writ`, `pathfinder`, `purification`, `oath_of_defiance` plus `monster_hunt` (6/8/10 actual defeated normal mobs by Risk), `skirmish_clear` (3 cleared ordinary combat rooms) and `shrine_oath` (choose Boon from an actually discovered Shrine). Normal kills only count after complete native victories using `history[].monstersDefeated` from `online/v012-expedition-runtime.js`; mere scouting, planned count, Elites and Bosses never count.
- Rewards are **one mutually exclusive, seed-deterministic, Risk-scaled** Gold (28/45/70), Essence (4/7/11), Fragments (8/14/23), one/two Affinity Reagents or one real Ironhide/Purifying/Fate potion. The two displayed Contracts use different basic prize kinds. **Either option** can show a different, not-yet-known Rare/Epic crafting Blueprint chance **20%/30%/40%** by Risk; on miss player gets exactly the originally shown fallback basic prize, not an extra Essence payout. Recipe can never duplicate across the two offers.
- **Critical survival rule:** objectives become **ready** during the expedition but yield **no Contract prize until extracting alive or completing the final Boss**. `online/v012-persistence-runtime.js` and `online/v012-expedition-runtime.js` pass explicit successful outcomes to `online/v013-expedition-contracts.js` settlement; a death/abandon/incomplete objective pays zero, and the receipt ledger prevents a second payout. Match the real game stage before payment. Independent marked-Elite innate loot/economy is unchanged, not an extra Contract payout.
- Offer/claim display in both `index.html` and isolated `docs/index.html` explains survival-only payment and Blueprint fallback; canonical `online/` and `combat/` modules were synced byte-for-byte to `docs/`, with cache-busted changed files.
- **Tests SUCCESS:** GitHub Actions https://github.com/Skinny-lfg/wanderer-game/actions/runs/44976248859, including seven-Contract rewards, replay/tamper prevention, simulated kill progress, death/no-early-claim, all payout kinds, original Boss preparation and potions, Dungeon checkpoint integrity, native Expedition integration, natural account and map tests and static Pages/runtime mirror parity. Design/result report: `reports/v013-contracts-reward-expansion.md`.
- The v0.13 Contract offer seed/plan algorithm is newly versioned, so **existing in-progress v0.13 Contract checkpoints may not restore** without a new playtest game; no v0.12 production player saves are modified. No migration is claimed, consistent with clean-sheet v0.13.
- User's unified playtest branch `playtest/v013-complete` should be fast-forwarded to this verified development checkpoint. Future edits should continue from canonical `audit/v013-stage6`, then fast-forward the unified playtest branch. Do not cherry-pick stale feature branches or accidentally deploy `main`.

---

## Current canonical v0.13 checkpoint — Stage 6.21 E1–E15 earned Boss progression (2026-11-21)

- **PR #118 merged into canonical `audit/v013-stage6` development branch** (merge SHA `a0fca2ee001fb3f77ab019499af6cb80ae3c1425`). **NO production deploy** or `main` changes. The approved Stages 6.18 normal mobs, 6.19 individual Elites and 6.20 native preparation rules remain unchanged.
- **Actual game change**: six individually calibrated low-Expedition **Boss HP/Attack** curves in `online/v013-boss-abilities.js`, invoked only when spawning a native Boss in `combat/v012-combat-runtime.js`. Maximum E1 HP/Attack reductions: Carrion Matriarch **39%/23%**, Rift Harbinger **37%/22%**, Abyssal Guardian **29%/18%**, Stormglass Conductor **28%/18%**, Ember Sovereign **18%/11%**, Heartroot Devourer **16%/10%**. Reductions decrease linearly and are **exactly zero from E30 onwards**; E35/E70 balance unchanged. No changes to Boss signature skills, mobs, Elites, loot/gear, Talents, XP, potions, saves, Firebase or visuals.
- **Matched true fresh-account evidence** (CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951071013, SUCCESS): six native starter accounts, seeds 9701/9702 × cautious/balanced/magic-fire, zero XP/points at creation, max 8 attempts/E and 16 total, four arms with **identical fixed seeds and real game actions**. Original runtime reconstructed **byte-exact Git blob `6cf97b10add8610589e225bddbf6b7cc1ad10389` only inside test VM**. Account outcomes: original **2/6 unlock E2, 1/6 E3**; chosen **Boss-only correction 4/6 E2, 3/6 E3**. Boss deaths 9→5. Experimentally reducing E1–E2 normal mob attack separately lowered first-fight HP loss 52.1%→37% but **did not improve E2 unlock (still 2/6)** and raised Elite deaths 8→11. Combined normal + Boss variant gave **4/6 E2 but only 2/6 E3, 14 Elite deaths**. **Rejected normal mob attack nerf**; only Boss variant promoted to actual game.
- **Genuine earned E1→E15 campaign** (CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951104663, SUCCESS): 4 new persistent native accounts, seeds 9701/9702 × cautious/balanced, 18 attempts per E and 100 total, **131 total attempts, zero errors**. All **4/4 unlocked E2**, **3/4 unlocked E4**, **1/4 reached E5 and defeated E15**, unlocking E16. No forced rewards/gear/XP/level unlocks; full native decisions, loot, equipped earned gear, potions/Boons and legal map traversal. **E5 Boss victory included marked Elite prep**; **E15 Boss victory included both marked Elite and Reliquary preparation, a real Boon and a legally used potion**. E5/E15 are only **1 survivor account**, not representative Boss odds. Accounts not reaching higher levels are **censored**, not assumed defeated there.
- **E4 remains severe:** 3 accounts entered, 50 native attempts, 13 Boss encounters (5 with earned preparation), **1 Boss win**, 31 extractions, 18 deaths. Two accounts stopped at E4 and one at E3. E1 normal first-fight attrition is **still 52.1%** in selected Boss-only correction; the natural Magic Fire profile in matched pilot remained blocked in E1 within 8 attempts. Do NOT claim complete E1/E4/global Boss balance or late-game easy/hard odds; E7–E15 exposure was only a single survivor.
- **Preview parity**: `docs/combat/v012-combat-runtime.js` and `docs/online/v013-boss-abilities.js` were updated to exactly match actual game files; `index.html` and `docs/index.html` contain matching cache-busting versions. No deploy. Normal mob and Elite approved preview copies from Stage 6.20 are preserved.
- Full report: `reports/v013-stage621-results.md`. Native matched 4-arm CI artifact `stage621-baseline-native-earned-e1-e3`; actual earned E1–E15 source JSON in `stage621-real-native-earned-e1-to-e15-accounts`. Relevant tests `tests/v013-stage621-natural-recovery.test.cjs`; no obsolete live combat engine retained, only a byte-exact baseline reconstructable inside test runner.
- **Next focused work:** investigate actual E3–E5 natural Boss identity/escort/path/HP pressure, especially the E4 bottleneck, while preserving the player hierarchy Boss > Elite > Tank > normal. Improve initial-room survivability only with matched evidence: rejected normal attack experiment did not resolve E2 and made Elite exposure more lethal. No blanket HP/ATK multipliers and no production deploy without further validation.

---

## Current canonical v0.13 checkpoint — Stage 6.20 six prepared Bosses (2026-11-21)

- **Stage 6.20 PR #117 merged** into canonical development branch `audit/v013-stage6`, merge SHA `58cf44285963be6b625b986e91094ff3d6f84824`. **NO DEPLOY, production `main` unchanged.** Stage 6.18 and 6.19 approved combat balances preserved.
- Native CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44925912083 **SUCCESS**: **192 matched hero states × four preparation modes = 768 genuine native six-Boss fights**, 192/192 strict player gear, Talents, Realm, seed, level, native Boss ID, Risk, actual escort, modifier and Reliquary 15%-maxHP cost checks PASSED. Pilot 384 subset of full, not extra. Six Affinities × synthetic legal E5/E15/E35/E70 Rare gear × two strategic builds × focus/mechanics target policy.
- **Equal Boss rates (wins for player):** neither **37/192 (19.3%)**; marked Elite **46/192 (24.0%)**; Reliquary **34/192 (17.7%)**; both **31/192 (16.1%)**. E5 **0/48** wins in *each* mode; E15 marked **5/48**, E35 marked **19/48 (39.6%)**, E70 marked **22/48 (45.8%)**. Carrion Matriarch and Rift Harbinger remain most punishing; Heartroot Devourer easiest.
- **Interpretation caveat**: Boss deliberately staged in first-ring controlled encounter with native *legal preparation ledger effects*. Does **NOT** model naturally clearing 15 rooms, earning gear, Boons, player item use or Reliquary cost paid earlier and healed afterwards. Measured 15% max HP sacrifice immediately before Boss *biases against Reliquary* versus natural routes; DO NOT nerf/delete Reliquary based solely on these fixtures.
- **No gameplay Boss HP/ATK/skills changed**: at E35/E70 marked-prepared Bosses are already roughly at 40–46% player wins (user's provisional 35–50% goal), so blanket Boss nerfs would undermine Boss > Elite hierarchy. E5/E15 synthetic Bosses remain near unwinnable (and early player progression remains blocked), requiring naturally earned Expedition/HP/potion evidence and targeted low-level stat/ability review **before** changing Bosses individually. Do not claim Stage 6.20 solved final Boss balance or that actual 15-room completion was simulated.
- Implementation: backward-compatible optional forced canonical Realm for `bossPreparationEncounter` in `scripts/simulate-progression.cjs`; new strict simulator `scripts/v013-stage620-boss-preparation.cjs`, tests, CI, `reports/v013-stage620-results.md` and design report.
- **Important prior regression fixed:** `docs/combat/v012-combat-runtime.js`, `docs/online/v013-elite-abilities.js` and `docs/online/v013-enemy-roster.js` were stale after approved Stages 6.18/6.19. Now verified byte-identical to canonical gameplay sources and `docs/index.html` has matching refreshed cache version hashes. These changes are development branch only and do not deploy the Pages site.
- Next: address **natural earned E1→E2 progression** (Stage 6.18 smoke 0/4 reached E2), then test actual walked-to-Boss E5/E15 with earned gear/potions/Boons/optional Reliquary recovery. Only then calibrate each Boss low-E individually. Keep eight-Elite Stage 6.19 scaling and Stage 6.18 mob corrections intact.

---

## Current canonical v0.13 checkpoint — Stage 6.19 eight named Elites (2026-11-21)

- **PR #116 merged** into canonical `audit/v013-stage6` development branch; merge SHA `470764be47657f369b3a49fd67fce18f842f546f`. **NO PRODUCTION DEPLOY**. All existing v0.13 approved UI/art, Stage 6.18 mob corrections, TalentGraph, gear, loot, Boss mechanics and save reset preserved.
- **Actual gameplay**: `online/v013-elite-abilities.js` defines eight separately tuned additive stage growth curves for Elite HP/ATK/DEF: E6–E35 first ramp, E36–E70 second ramp, E70+ capped, no effect at E1–E5; applied only to the native spawning Elite by `combat/v012-combat-runtime.js`. Existing Elite unique abilities are unchanged. No generic HP/ATK buff and no other enemy types affected.
- Successful native GitHub Actions run https://github.com/Skinny-lfg/wanderer-game/actions/runs/44915195931 tested final gameplay/test code SHA `3a54ef1de1efc23f3e9344c5d91f973ec3435ae5`. Later PR commits touched only Markdown docs; full native evidence **96 matched valid synthetic hero builds × eight forced real Elite identities × original/new = 1,536 real fights**, 96/96 strict gear, TalentGraph, seed, Realm, Risk, Condition and actual native identity checks PASSED. Pilot 768 subset of full, not additional sample.
- **Equal-weight player win rates** (768 fights per version across all eight): **682/768 (88.8%) original → 534/768 (69.5%) corrected**. By synthetic legal E tier: E5 **124/192 (64.6%)→identical 124/192**; E15 **176/192 (91.7%)→152/192 (79.2%)**; E35 **190/192 (99.0%)→131/192 (68.2%)**; E70 **192/192 (100%)→127/192 (66.1%)**. Every E5 per-type battle outcome and initial Elite stats exactly unchanged. Eight new per-type player wins out of 96: Gravebound Bulwark **58**, Bloodscar Ravager **63**, Sanguine Wraith **58**, Voidborne Hexer **73**, Gravecaller **66**, Oathbound Exarch **73**, Briarspine Horror **75**, Ashen Executioner **68**.
- **Critical unresolved E5 subtype imbalance:** forcing each original Elite reveals player wins Sanguine Wraith **7/24**, Gravebound Bulwark **10/24**, Gravecaller **10/24**, Oathbound Exarch **22/24**, Briarspine Horror **23/24** (all E5 unchanged intentionally). Do NOT claim complete individual balance or adapt real E1–E2 accounts from synthetic Rare/E5 fixtures. Next focused individual ability + low-E calibration should compare natural setups; Stage 6.20 legally prepared final Boss calibration stays separate.
- **Permanent result** `reports/v013-stage619-results.md`; preregistration `reports/v013-stage619-design.md`. Raw 1,536 native fights in Actions artifact `stage619-full-1536-native-eight-elite-fights`. The pre-change combat runtime is reconstructed byte-exact only in the isolated diagnostic runner; no obsolete live gameplay modules or duplicate combat engine were introduced. No merge/deploy to `main`.

---

## Current canonical v0.13 checkpoint — Stage 6.18 LIVE normal-mob rebalance (2026-11-21)

- **Stage 6.18 PR #115 merged** into the one canonical `audit/v013-stage6` development branch at merge SHA `81b23402d19968a8fa33722cc986264907d43397`. Successfully checked that the merged `online/v013-enemy-roster.js` contains the actual final role-composition and weighted-role scaling correction; preserved previously approved visuals and other features.
- Successful final native CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44912112430 (pilot, full, earned-account smoke). **96 matched legal hero settings × five sizes (4/6/8/12/20) × original vs live = 960 real fights**, all **96/96 strict player, gear, Talents, seed, Condition checks PASSED**. Earlier pilot 480 fights subset of full. Regression suites for Stage 8.0 mob roster, Stage 8.1 mobs, Stage 8.2 Elites, Stage 8.4 Bosses, Stage 6.17 historical baseline and native integration passed.
- Final real NORMAL player wins out of 96/size: 4 mobs unchanged **95/96**, 6 **95/96**, 8 **96/96**, 12 **95/96**, 20 **96/96**. Final medians of player damage old→new: 4 **99→99**, 6 **22→78**, 8 **25.5→83**, 12 **34→79.5**, 20 **44→69.5**. All five predeclared E5/six-to-four/valid-stats acceptance gates passed. E5 6 mobs **23/24 wins**, 12 **23/24**, four **23/24**. Larger swarms are still somewhat easier than four in absolute damage; do not claim a perfectly monotonic difficulty curve or perfect final balance.
- **Actual gameplay change:** `online/v013-enemy-roster.js` for count >=5 only, more principal normal Tank/Skirmisher/Caster roles, first two differentiated and later selected with Affinity-native role weighting; groups remain mostly Minions. For principals 6→12: HP `.53→.40`, ATK `.45→.34`, DEF `.70→.64`; for 12→20+ HP `.40→.29`, ATK `.34→.25`, DEF `.64→.60`. Original Minions and all 1–4 mob native behavior unchanged; no generic HP/ATK buff. No changes to Elites/Bosses, Talents, loot, UI/art, saves or Firebase.
- Real naturally earned E1 smoke on final source: **4 native adaptive accounts, 11 combat rooms, zero Boss fights; 0/4 reached E2** within two attempts/account. **E1 natural progression remains unresolved**, not shown to improve/regress by this large-mob-only fix. Do not mix earned-account results with legal synthetic point-budget fixtures. Treat this as a separate high-priority early-progression blocker.
- Permanent report: `reports/v013-stage618-mob-results.md`; design: `reports/v013-stage618-mob-design.md`. Raw native full matrix and earned E1/E2 evidence in Actions artifact `stage618-full-960-native-mobs-and-earned-e1-e2` (id 14710177431). Stage 6.17 baseline reconstructed byte-identically inside test-only runner; do not delete previously approved live code or keep obsolete code in game modules.
- **Next:** Stage 6.19 = calibrate all **eight named Elites individually and per E tier**, preserving E5 survival; Stage 6.20 = legally prepared Boss calibration. E1 natural account progression requires dedicated work before a release gate. All changes on canonical development branch only, **NO PRODUCTION DEPLOY**.

---

## Current canonical v0.13 checkpoint — Stage 6.17 native mob roster ablation (2026-11-21)

- **Stage 6.17 PR #114 merged** into the single canonical `audit/v013-stage6` development branch, merge SHA `1e575800ee416bf5825eac1c5f50f600158437db`. Real native test workflow https://github.com/Skinny-lfg/wanderer-game/actions/runs/44908515780 **SUCCESS** (pilot and full).
- **192 strictly matched native hero states × five arms = 960 genuine fights**, 192/192 gear/Talents/seed/Realm/risk/Condition checks passed; 480 pilot subset, not additional samples.
- Four native mobs: **188/192 (97.9%)** player wins, damage median **98**; six native mobs: **192/192 (100%)** wins, damage **24**. Composition-only six with 3 principal roles: **192/192**, damage **44.5**; small-group scaling-only six: **192/192**, damage **48**; both rules: **176/192 (91.7%)**, damage **119.5**.
- **Crucial E5 warning:** combined six-mob fix causes **15/48 defeats (68.8% player wins)** vs **4/48 defeats (91.7% wins)** against four unchanged mobs; Magic combined overall only **78.1%** wins. Do **not** copy full combined formula directly to gameplay without calibration, and do not blanket-buff all mobs.
- **Stage 6.18 must be implementation-oriented**, not more unbounded auditing: tune an intermediate principal role / Minion composition and smooth threshold scaling, guard E1/E2 earned-account survivability, E5/Magic, and regression sizes 1/2/3/4/6/8/12/20 before committing any live `online/v013-enemy-roster.js` change. Elites provisional ~60–70% benchmark does NOT apply to normal mobs.
- All Stage 6.17 variants are isolated **diagnostic VM-only module replacements**; the actual roster/ability/game files, HP/ATK, player talents, art, saves, Firebase and production `main` were unchanged. Permanent `reports/v013-stage617-roster-results.md` and `reports/v013-stage617-roster-design.md`; full CI artifact `stage617-full-960-native-4to6-ablation-fights`.
- **Eight real named Elites** (correct former internal labels): Gravebound Bulwark (`tank`), Bloodscar Ravager (`berserker`), Sanguine Wraith (`vampire`), Voidborne Hexer (`caster`), Gravecaller, Oathbound Exarch, Briarspine Horror, Ashen Executioner. Do not misreport `tank`/`caster` as non-Elite generic mobs in Stage 6.16 results.

---

## Current canonical v0.13 checkpoint — Stage 6.16 granular mobs/Elites/Bosses (2026-11-21)

- **PR #113 merged** into the one canonical `audit/v013-stage6` development line; merge commit `a56e2a6976e5076953bc03bfcef278ad3c978cbc`. The reviewed feature/merge tree SHA matched exactly `cfacb94f862c1f13e2b54cdc276a296065091aa2`, preserving all previous stages and approved art. Fetch current branch SHA before continuing.
- Completed **384 strict matched TEN-WAY real native player scenarios = 3,840 actual combat fights**; each exact same legal Talent/point allocation/rolled gear/starting HP/MP/Realm/Risk/Condition/seed, varied **1,2,3,4,6,8,12,20 real native normal mob counts and 1 Elite/1 Boss**. **384/384** strict matched checks passed. Pilot 960 combats subset, NOT independent extra data.
- Latest normal group win rates: 1 **381/384**, 2 **382/384**, 3 **381/384**, 4 **375/384**, 6/8/12/20 **384/384 each**. Median damage taken group **4=98**, group **6=22**, group **20=38**. A severe native Stage8 roster composition discontinuity: mean real Minions 4-mob **1.52**, 6-mob **4.76**, 20-mob **17.68**. Large group-size labels are NOT equal numbers of full-power Tanks.
- User's **provisional target Elites ~60–70% player victories**, but apply only to carefully selected per-E tier fights. Latest Elite subtype rates: Oathbound Exarch **52/53**, Briarspine Horror **57/60**, Ashen Executioner **35/38**, Berserker **48/53**, Tank generic **35/40**, Caster generic **42/49**, Gravecaller **34/43**, Vampire **35/48**. Distinguish named dedicated Elite Stage8.2 types from generic `tank`/`caster`. **E5 Elites 61/96 (~63.5%) already in target, E15 89/96, E35 93/96, E70 95/96**. **NO blanket Elite buff** without per-level controls.
- Six unprepared native Bosses (each n=64): Carrion/Decay **11**, Rift/Blood **12**, Abyssal Guardian/Aegis **15**, Stormglass/Magic **18**, Ember/Fury **21**, Heartroot/Vitality **27** wins. **Bosses staged first-ring without natural preparation or full 15-Realm route**; not natural victory rates and no Boss nerf justified yet.
- Solo normal mobs: Tank **90/93**, Caster **147/147**, Skirmisher **144/144** wins. **43 native named solo mobs** observed but most have small n; solo Minions do not naturally spawn in native Stage8 roster. Individual named-mob rankings require larger controlled samples.
- Validation: Stage 6.16 **7/7** native matcher tests; Stage 6.15 8/8, Stage 6.14 retest 7/7, Stage 6.14 9/9, Stage 6.13 10/10, Stage 6.12 10/10, Stage 6.11 8/8, Stage 6.10 6/6; pilot 960 and complete 3,840 combats PASSED. Native CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44901448572, full 47.3MB raw JSON + per-name Markdown archived as `stage616-full-3840-native-group-elite-boss-fights`.
- Permanent explanation: `reports/v013-stage616-encounter-results.md`; predesign: `reports/v013-stage616-encounter-design.md`. Same **native game source fingerprint as Stage 6.15**; diagnostics only; no buffs, nerfs, gameplay enemy data/roster, Talent coefficients, saves, UI/art, Firebase or production changes.
- **Next priority:** isolate native group composition change 4→6, then measured per-Elite E-tier-specific adjustments and prepared-vs-unprepared real Boss combat tests; keep natural earned E1 progression separate. Avoid universal enemy HP/ATK multipliers.
- Verified production `main` still `7cd2a91f03844fe6586f84f11fa45723dd9a6001`; no deploy.

---

## Current canonical v0.13 checkpoint — Stage 6.15 native enemy hierarchy (2026-11-21)

- **Canonical development HEAD** is `audit/v013-stage6`; Stage 6.15 merged via PR #112 at `b28fade20a3b2d64c0fe56b52b5689ad99fefc37`. Original PR tree SHA and merge tree SHA were checked identical: `9fb65d8e7487f17f53865d1c004ca776422a2de0`, preserving all earlier v0.13 artwork, talents and Stage 6.11–6.14 implementations.
- Most important evidence: **384 genuine matched native NORMAL 3-mob / ELITE / BOSS triples = 1,152 actual fights**. Each triple used exactly the **same native v15-legal TalentGraph, points, rolled equipment, Realm/Risk, starting seed/resolved seed, Condition and targeting policy**. All **384/384** strict player-fixture checks passed. Enemies intentionally differ by role; NEVER claim same enemy roster.
- In this controlled Dangerous Risk/Rare synthetic-gear fixture: **Normal won 379/384 (98.7%)**, **Elite 346/384 (90.1%)**, **Boss 106/384 (27.6%)**. The matched Elite–Boss gap is **62.5 percentage points**; **240** Elite-win/Boss-loss cases, zero reverse.
- Six native Boss families covered. Elite–Boss gap by Realm: Blood 67.2pp, Decay 70.3pp, Vitality 46.9pp, Aegis 60.9pp, Fury 53.1pp, Magic 76.6pp. E-tier controlled results: E5=Elite 63/96 vs Boss **0/96**, E15=93/96 vs **9/96**, E35=94/96 vs **40/96**, E70=96/96 vs **57/96**.
- Observed Boss/Elite initial median HP ratio **1.236×**, attack ratio **1.465×**; Bosses spawned extra enemies in **241/384** fights. Do not infer exact causal contribution from these correlations. Eight native Elite type labels were observed, including generic `tank` and `caster` labels; **not** proof that all dedicated Elites were individually audited. Normal 3-mob rooms included at least one native Tank in 199/384 generated groups (not Tank-only duels).
- **Most important caveat:** Stage 6.15 stages each Boss in a **first-ring combat fixture WITHOUT 15-Realm traversal or optional Boss preparation**; it likely overstates the difficulty of naturally prepared final Boss fights. Native XP and equipment access are synthetic. These percentages are NOT earned-account or full Expedition win probabilities.
- Strong next test: matched **Boss unprepared vs legally prepared** (marked Elite/reliquary) per Realm, then isolate each specific Boss's minions, damage tempo and other mechanics before any per-Boss adjustments. Stage 6.11 natural E1 bottleneck remains separate and unresolved.
- Validation: Stage 6.15 8/8 tests; Stage 6.14 follow-up 7/7, Stage 6.14 9/9, Stage 6.13 10/10, Stage 6.12 10/10, Stage 6.11 8/8, Stage 6.10 6/6; pilot 288 real fights and full 1,152 real fights passed. GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44899211176.
- Full report `reports/v013-stage615-hierarchy-results.md`, source-of-truth raw native JSON GitHub Actions artifact `stage615-normal-elite-boss-384-matched-triples-1152-combats`. Stage 6.15 had **NO** buffs/nerfs, gameplay coefficients, enemy definitions, UI/art, saves, Firebase or deploy changes.
- Production `main` verified remains `7cd2a91f03844fe6586f84f11fa45723dd9a6001`. Continue preserving one canonical development line and no force-push.

---

## Current canonical v0.13 checkpoint — Three-case Stage 6.14 confirmation (2026-11-21)

- PR #111 **merged** into the single canonical development branch `audit/v013-stage6` with merge commit `400b7dff5916e55778d5bb812264c3e581264f36`. Fetch current canonical HEAD before starting anything new. The reviewed and merged tree SHA is exactly `e87004f2b955ddf45b53ec4b1c70f68aa13ad6f9`.
- Retested **exact** original Stage 6.14 legal states `unbreakable` (rank 1, ablation-016), `arcane_focus` (rank 1, ablation-012) and `brace_rank2` (ablation-011). All recovered by immutable TalentGraph state hashes, real v15 `allocate` and valid point budgets. Only one node/rank changes within each replay; baseline leaves one of the same synthetic available points unused.
- **9 preregistered native enemy strata × 32 new distinct seeds**, **288 genuine matched pairs / 576 real native fights**, **288/288 gear, opponent, seed, native Conditions and Buildcraft matching checks passed**. The 36-pair pilot is a subset, NOT additional independent evidence.
- Native result categories: 145 both-win, 112 both-lose, **31 node-only-win**, 0 baseline-only-win. These gains split across **Unbreakable +18** in three enemy strata, **Arcane Focus +13** in three strata; **Brace rank 2 changed no victories** across 96 new pairs but changed some Barrier and remaining HP measures. Strictly context-specific; not global talent strength rankings.
- **Selection bias:** these 3 skills were originally chosen because their 6-seed initial results had positive flips. The new cohort seeds were declared in advance and independent but cannot fully eliminate discovery bias.
- All synthetic Talent XP, item rolls, chosen E progression and opponents remain *controlled diagnostic fixtures*, NOT natural earned account progression. The baseline and treated arms spend DIFFERENT points by exactly one, intentionally. Do not describe this as a same-spent-points comparison.
- Retest 7/7 unit tests and Stage 6.14 9/9, Stage 6.13 10/10, Stage 6.12 10/10, Stage 6.11 8/8, Stage 6.10 6/6 tests passed. Final full-native CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44897838733. Latest checked Stage 4.5.5/4.5.6, integration, browser, Stage 5, Stage 9.7 and Gravecaller workflows passed. Optional older Stage 9.8 high-volume audit was still in progress at check.
- The production `main` stays at `7cd2a91f03844fe6586f84f11fa45723dd9a6001` (v0.12). No balancing constants, player saves, browser UI/art, Firebase or deployments were changed. Do not force-push or move this work to main.
- Full per-opponent results: `reports/v013-stage614-three-case-retest-results.md`, design and native artifact stored in the PR #111 GitHub Actions run.
- Further work should investigate **mechanic activation and opportunity cost against an alternative legally allocated point**, ideally with earned E1 progression separately; no immediate buffs/nerfs from these outcomes.

---

## Current canonical v0.13 checkpoint — Stage 6.14 (2026-11-21)

- Latest merged Stage: **6.14** through PR #110 into `audit/v013-stage6`, merge commit `0745d43493723d608f104aa5baa82a5c51eb0e87`. Always fetch current `audit/v013-stage6` HEAD before starting another stage.
- Stage 6.14 isolates **one real v15-legal Talent node/rank purchase** per native controlled matchup: the baseline has **one unspent point** and the comparison has that one extra point actually invested. Both have the same *synthetic available XP*; do NOT claim equal spent points or naturally earned XP.
- **24 distinct single-node targets (12 first purchases, 12 rank upgrades)**, **six distinct seeds each**, **144 correctly matched pairs / 288 native fights**. A pool of 4,715 legal candidate designs was **not** all executed.
- Pair validation: complete native item roll fingerprint, starting enemy roster, Realm/Risk/Conditions/Boss modifiers, seed, entire other Talent tree, prepared ability, elemental mode, Buildcraft background and fixed focus targeting are equal. Invalid prerequisites/rank chains are not bypassed.
- Corrected final outcomes: 83 pairs both won, 57 pairs both lost, **four gained wins** from adding a node, zero baseline-only wins; gained cases: Unbreakable initial purchase (2), Arcane Focus initial purchase (1), Brace rank 2 (1). Small six-seed cohorts are diagnostic, NOT global ability rankings.
- The initial 22-rank/2-new-node experiment was superseded by 12/12 stratification; do not mix results or count the 18-pair pilot as independent extra fights.
- Final Stage 6.14 dedicated 9-test suite, Stage 6.13 10, Stage 6.12 10, Stage 6.11 8, Stage 6.10 6, full native matrix and key browser/integration/regression workflows passed. Optional older Stage 9.8 high-volume job was still running at gate; do not claim success without checking.
- The production `main` remains **v0.12**, unchanged; no balance coefficients, native game code, art, saves, Firebase or deployments touched.
- Next: repeat suspicious **exact node + enemy** matchups with many more independent seeds and compare mechanic activation, or address the separate native E1 progression bottleneck before late-game balance decisions.

---

## Current canonical v0.13 checkpoint — Stage 6.13 (2026-11-21)

- **Stage 6.13 merged into `audit/v013-stage6` via PR #109**, commit `53fcecffaac3d944f1efb4e3461b60e9abf8e7f1`. Fetch the latest canonical branch head before another Stage.
- Stage 6.13 evidence: **72 identical non-Talent fixture pairs / 144 actual native fights**, comparing 48 current archetypes and 95 distinct v15-valid Talent allocations. A design pool of 3,637 eligible pair options was **not** fully executed.
- Every pair held **exactly the same available and actually spent Talent points**, native gear fingerprint, level, weapon/armor/offhand, Buildcraft background, resolved seed and initial enemy roster. Only native-legal Talent nodes, elemental selection and/or prepared ability changed.
- Results: 39 both won, 28 both lost, 4 only the first won, 1 only the second won; 24 paired Boss matchups, 24 Elite and 24 Normal. All nine Armor × enemy classes had exactly 8 pairs.
- These are **controlled fixtures**; Talent XP, gear acquisition and opponent accessibility are NOT naturally earned E1 progress. The game AI and damage engine are native. Do not conflate with Stage 6.11 earned account history.
- These contrasts isolate **complete node allocation**, not the effect of *one node*. Stage 6.14, if requested, should target legal single-node or single-rank ablations with larger seed cohorts and a fixed, valid budget.
- The Stage 6.13 10-test suite, prior Stage 6.10–6.12 suites and the corrected 72-pair simulation CI passed. Core integration, browser and regression suites passed; the optional older Stage 9.8 deep campaign was still in progress when the merge was checked.
- No gameplay balance changes, production deployment, saves or Firebase operations took place. Keep all previous approved art and Stage 6.11/6.12 evidence; no force-push or multi-branch cherry-pick.

---

## Current canonical v0.13 — Stage 6.12 merged (2026-11-21)

- Work from latest `audit/v013-stage6` HEAD, not an old `audit/v013-stage612-*` snapshot. Stage 6.12 was merged in PR #108 at commit `b51975d2eac48247cccb41501b0dc18cd755de2b`.
- Keep both kinds of simulation **strictly distinct**: Stage 6.11 E1 earned accounts vs Stage 6.12 synthetic-Talent-budget **controlled native combat**.
- Stage 6.12 verified 48 strategic/route archetypes, 121 distinct v15-valid Talent allocations, 142 distinct Talent+native-rolled-gear loadouts, 144 controlled battles (48 each Normal/Elite/Boss), ten matched Off-Hand swaps (20 further native combat executions).
- **Never claim 1,728 planned matrix candidates were executed**. Only 144 sampled scenarios ran. High-tier builds were simulated with *artificial test budgets* rather than naturally earned XP and loot.
- An initial matrix accidentally coupled Plate armor with Boss opponents; it is superseded. Always use the corrected nine Armor × Encounter strata (15–17 observations each) from `reports/v013-stage612-controlled-results.md`. Assert this balance in future sampling code.
- Zero gameplay balance coefficients, production assets, saves or Firebase data were changed in Stage 6.12. Do not infer that 6/48 controlled Boss wins is a population win probability.
- For the next stage, run matched-seed **talent path** comparisons with the same enemy, rolls, equipment and budget. Keep the E1 progression/attainability bottleneck as a separate issue.
- Stage 6.12 core CI and v0.13 release/role/browser/integration tests passed. Optional historical high-volume Stage 9.8 and role large-sample workflows were still queued when the merge was verified; do not claim their results.
- Retain previously approved portraits and all Stage 6.11 data. Keep one canonical line and avoid branch proliferation.

---

## Current v0.13 checkpoint — Stage 6.11 merged (2026-11-21)

- Canonical development branch: audit/v013-stage6; fetch its **current HEAD** before any further work.
- **Stage 6.11 merged via PR #107 at 536603fe180cd77b7ee3def9d51caaf362ba947d.**
- Retain both Stage 6.10 and Stage 6.11 tooling: legal native v15 TalentGraph target snapshots, 21 agent strategy profiles, adaptive genuine E1 accounts, source fingerprints and independent evidence reports.
- Evidence: 488 structural candidates (280 legal, 208 insufficient points, 0 unresolved); 24 genuinely earned account runs, 164 attempts, 297 combat rooms, 27 Boss fights, 73 Elite fights, 5 Boss victories. Structural budgets are **not** earned builds.
- Historical evidence barrier: only four shared unique seeds in the 24-account campaign, maximum **8** actually earned talent points; no multi-Affinity progression, ability resets or E4–E5 encounters were genuinely observed.
- Do not call high-budget synthetic legal paths realistic player progression. No balance changes were made in Stage 6.11.
- Stage 6.11 test & CI results and exact cohort SHA are documented in reports/v013-stage611-native-results.md.
- Keep one canonical development line and one scoped PR at a time; merge and verify SHA before starting another stage. No production deployment without approval.


---

# Wanderer v0.13 branch governance — 2026-11-21

**Canonical v0.13 integration branch: `audit/v013-stage6`.**
The reviewed consolidation is PR #106, merged at `05aa9237c808f2a3fb7fddcf37b71613986a23f0`.
`main` remains the isolated v0.12 production line. Do not merge v0.13 into `main` or deploy without explicit approval.

## Development rules (v0.13)

- **Never start a new numbered Stage from an old feature/visual/diagnostic branch.** Fetch and verify the HEAD of `audit/v013-stage6` first.
- Avoid accumulating long-lived Stage branches. Prefer one scoped, short-lived PR at a time, merge into the canonical branch after the applicable quality gates, and record its SHA before proceeding to the next Stage.
- Preserve *all* approved v0.13 work already integrated: Stage 6.9's legitimately earned account comparison; Stage 6.10 coverage/benchmarks; the 28 restored original equipment portraits; native hero equipment rendering; current saturated/side-lit character UI and soft contact shadows; Pages mirroring.
- Do **not** blindly cherry-pick or merge divergent historical branches. See `reports/v013-consolidation-preservation-checkpoint.md` for the 31-PR audit and branches still awaiting semantic review.
- For visual changes, keep `online/` and `docs/online/` and `index.html`/`docs/index.html` in intentional parity. Use existing assets; do not regenerate art or discard user-approved revisions without approval.
- For simulator/agent changes, use the live TalentGraph v15 and real rewards/XP/items for earned-account claims. A pairwise design matrix does not count as executed tests. Check source fingerprints, seed replayability, and observed vs synthetic evidence.
- Run focused checks for each change; at consolidation checkpoints, run `npm run test:v013:gate`, `npm run test:v013:stage610`, `node --test tests/v013-character-portraits.test.cjs tests/v013-c8-ui-wiring.test.cjs`, and relevant native/browser workflows. Never call pending/failed tests “passed.”
- No force pushes, deleting historical branches, overwriting player saves, Firebase deploy, or production merge without explicit user instruction. Preserve checkpoint SHAs and write factual validation results.

---

# Wanderer v0.12 release guidance

## Product
Wanderer v0.12 Expedition is the production release. `development` is the integration branch; `main` is the reviewed release branch.

## Rules
- Promote `development` to `main` through a reviewed release pull request. Do not force-push either branch.
- Do not deploy Firebase, change Firestore Rules, read/write real saves, or migrate production accounts unless the owner explicitly authorizes the release operation.
- Keep only current v0.12 behavior in the release. Historical material stays in Git history and the owner's backup.
- Preserve the 15-Realm Expedition, 3–4 events, three shared rerolls, boss and guaranteed 1-of-3 Rune on each victory; Static, passives, equipment and potions; and protected isolated saves.
- Retain tests for current gameplay, authentication/security and save isolation. Use synthetic saves only.

## Quality gates
Run `npm test`, browser tests, Auth/Firestore Rules Emulator tests, Save/Reload, E1 boss Rune, bag capacity, potion loadout and confirm Classic never bootstraps on the v0.12 entrypoint.
