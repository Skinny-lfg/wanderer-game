# Wanderer v0.9.3 — Balance & Buildcraft

Development-only implementation. No release, hosting deployment, Firebase rule changes, reset-version change or player data access is part of this update.

## Balance decisions

Bonuses remain cumulative at 2/3/5 pieces. Critical 3 adds 2% base main-hit damage per held Focus (6% maximum); Fire 3 adds 1.5% per held Heat (7.5% maximum); Dark 3 adds 2% per held Soul Charge (6% maximum). Damage is additive and rounded once, does not create an extra attack or application roll, and does not consume charges. Existing gain throttles, expiry and encounter resets remain. Focus gained by the current hit starts contributing on the next hit. Perfect Strike consumes Focus before the hit; Flashover and Soul Pact retain their existing consumption/cooldowns and receive the held-charge bonus on the consuming hit. Signatures do not generate charges themselves.

Regen's two-piece healing is `min(10, 2 + maxHP * 0.002)` per combat second, subject to the existing Tank healing wound. Overheal conversion remains 25%, capped at 1% max HP per second and 10% per encounter; total Barrier stays capped. Second Wind remains once per expedition.

Other affinity mechanics and proc rates are preserved, including the existing Crystal affinity. The browser game in index.html is authoritative; combat/affinities.js is a legacy standalone model, is not loaded by the browser, and was not used to claim production balance results.

These are conservative starting values for later simulations, not evidence of equal win rates. Both 5/5 signatures and 3/2 combinations now have meaningful benefits. Extensive simulations are intentionally deferred.

## Equipment and score

Gear Power now assigns cumulative synergy estimates of 12/30/54 points for tiers 2/3/5 instead of 12 per active affinity regardless of tier. Thus the set contribution of 5/5 is 54, versus 42 for 3/2. It remains a heuristic, not a combat-win predictor; the UI says so. Actual damage, health and defensive limits determine combat.

Inventory arrows use the same full-loadout Gear Power comparison as inspection and the merchant. Bow, Staff and Two-Handed lock Off-Hand: its equip button is disabled, the equip handler rejects it, and comparison cannot silently remove the main weapon. Unequip/swap to a one-handed weapon to use Off-Hand. Existing two-handed save migration and double affinity points are preserved. Generated practice-arena stats are rebuilt from browser formulas.

## Offers and persistence

Paid reroll price is `5 * (1 + floor((dungeonLevel - 1) / 10))`: 5 at D1–10, 10 at D11–20, through 100 at D191–200. Historical reroll counts do not affect it. Existing offers, preferred gear and selection survive saves/reloads; old offers without preferred gear are migrated once.

Free rotation happens only when extracting with at least two completed waves. The run's encounter counter increments at wave entry, and extraction is rejected while fighting, so it counts completed waves at that point. Leaving at zero or one wave, dying at any wave, and interrupted-run recovery cannot rotate offers. Rotation excludes the previous trio and played path. There is no pending rotation token to replay on reload.

NEW is a boolean `isNew` on owned gear/runes. Extraction, merchant purchase, forge acquisition and rune choice mark rewards new. Individual inventory/equipped-item consultation and rune selection clear it; Mark All as Seen clears stash, equipped gear and runes together. Old missing flags are seen, with no re-identification or stat migration. Rune sanitization preserves only boolean true. Ownership/save-slot boundaries continue using the existing save system.

## Proc information

Displayed and executed main-weapon rates share one helper: Daggers 52%, Two-Handed 26%, other physical/fallback attacks 32%; successful mana-funded Staff/Wand casts 90%. Off-Hand Dagger remains 34%, different-element magic Off-Hand on casts 25%, and magic Off-Hand on physical/fallback attacks 45%. Matching magic Off-Hand boosts matching spell damage 30%, with no extra cast proc. Applications require damage after Barrier; Critical uses the actual displayed Critical formula, not a separate application percentage. Sets and armor do not independently roll more weapon procs, and five pieces alone do not raise application rates.

## Validation

- Full package test suite: **PASS** on the final changes; unit/save/PvP tests, existing smoke regressions, bounded deterministic balance regressions and the new v093-buildcraft checks.
- New focused checks: tier 3 damage/expiry; retained tier 5 consumption; Regen scaling, cap, overheal and healing wound; both-hand counts; all three blocked Off-Hand weapon types; score tiers; old/new flag migrations and reload; zero/one/two-wave extraction, fighting, death and interrupted recovery; fixed prices across brackets/repeated rerolls.
- `test:v093:browser`: **PASS** before the final Critical-only explanatory text and forge-result seen-state adjustments. A repeat after those final adjustments was not authorized; final unit/regression coverage includes them. Actual clicks and reloads at 1280×900 and 390×844, with a fresh temporary browser context, isolated local fixtures and all non-local requests blocked. Covers NEW, rune consultation, Mark All as Seen, disabled Off-Hand, proc text, offer persistence and equipment width.
- No extensive simulation, real account sign-in, Firebase access or save modification.
