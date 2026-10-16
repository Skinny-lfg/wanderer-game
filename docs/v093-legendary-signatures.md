# v0.9.3 — Final Legendary revision (development only)

Supersedes the first simple-signature implementation. The existing v0.9.3 buildcraft changes remain in place. There are 22 identities: 19 creative signatures and 3 traditional Legendary items.

## Confirmed generic choices

The user confirmed that “2 de jogo” meant two Fire items. **Grasp of the Sunbound**, **Scepter of the Emberstar**, and **The Eternal Oath** become traditional Legendary items. Sunbound/Emberstar are less literally tied to Fire than First Flame/Eternal Flame; Eternal Oath is less explicitly tied to Shield than Dawnwarden/Aegis. All three keep their IDs, names, slots, subtypes, rarity and artwork. New drops use their normal random affinity pools. Existing saved affinities/stats are preserved. Their old special abilities are removed, including from the displayed descriptions of saved items.

Traditional items grant the pre-existing +32% first-main-attack damage bonus once per encounter, shared across equipped traditional items. This also lets generic gloves/shields deliver the requested traditional damage benefit; it never stacks three times. An off-hand reserved by a two-handed weapon cannot grant this bonus or any signature.

## Final catalog

Internal affinity keys: drain = Dark, shock = Storm, slow = Frost, burn = Fire, crit = Critical.

| Item | Slot / subtype | New affinity | Ability | Effect |
|---|---|---|---|---|
| Soul Reaver | weapon / Two-Handed | drain | Soul Harvest | Applying Drain primes the next main attack to ignore 20% Armor. 10s cooldown. |
| Runeforged Eclipse | weapon / Two-Handed | crystal | Eclipse Breaker | Strip Barrier equal to 35% of a normal hit; gain 30% of Barrier removed. 12s cooldown. |
| The Eternal Oath | offhand / Shield | Random on new drops | Traditional | +32% first main attack per encounter; shared, does not stack with other generic Legendary items. |
| Heart of Shadows | amulet / Amulet | drain | Umbral Refuge | Survive an attack below 35% HP: prime the next main attack to heal 3% max HP. 14s cooldown. |
| Starweaver Relic | weapon / Wand | shock | Spell Echo | Every third funded spell refunds 40% of mana cost and echoes 20% normal damage. 10s cooldown; no extra procs. |
| Helm of the Dawnwarden | helm / Helm | shield | Dawnward | Barrier breaking primes 12% mitigation for the next enemy attack. 14s cooldown. |
| Cuirass of the Last Sunrise | armor / Armor | regen | Last Sunrise | Survive a hit exceeding 12% max HP: recover 30% of HP damage over 3s. 15s cooldown. |
| Grasp of the Sunbound | gloves / Gloves | Random on new drops | Traditional | +32% first main attack per encounter; shared, does not stack with other generic Legendary items. |
| Sunstride Sabatons | boots / Boots | shock | Thunderstep | Every fourth main attack grants 12% attack speed for 3s. 10s cooldown; does not stack. |
| Pendant of the First Flame | amulet / Amulet | burn | Kindled Heart | Kill an enemy with active Burn to heal 3% max HP. Once per encounter. |
| Signet of the Dawnforged | ring / Ring | crit | Golden Focus | Critical hit primes +15 percentage points of weapon affinity proc chance for the next main attack, capped at 100%. 12s cooldown. |
| Aegis of the Dawnstar | offhand / Shield | shield | Dawnstar Bulwark | When incoming damage breaks Barrier, restore 7% max HP Barrier. 12s cooldown. |
| Blade of the First Dawn | weapon / Sword | crit | Dawn Mark | First attack marks for 6s. First critical consumes the mark for +25% normal damage. 12s cooldown. |
| Hammer of the Sunforge | weapon / Mace | sunder | Armor Crusher | Applying Sunder weakens the next enemy attack by 15%. 10s cooldown. |
| Sunpiercer Longbow | weapon / Bow | nature | Wildroot Volley | Effective Nature healing grants 10% attack speed for 3s. 10s cooldown; does not stack. |
| Fang of the Sunbreaker | weapon / Daggers | poison | Toxic Fang | Main attack against 3+ Poison stacks adds one Poison stack. Respects stack cap and Venom Burst. 12s cooldown. |
| Scepter of the Emberstar | weapon / Staff | Random on new drops | Traditional | +32% first main attack per encounter; shared, does not stack with other generic Legendary items. |
| Crescent of the Emberveil | offhand / Off-Hand Dagger | bleed | Crimson Crescent | Damaging off-hand strike extends one Bleed stack by one tick, max 6 remaining ticks. 9s cooldown. |
| Orb of the Solar Heart | offhand / Orb | tide | Solar Current | Barrier absorbing damage heals 1.5% max HP. 12s cooldown. |
| Tome of the Eternal Flame | offhand / Tome | burn | Ashen Seal | At 3+ Burn stacks, consume one to weaken the next enemy attack by 15%. 12s cooldown. |
| Charm of the Dawnstar | offhand / Charm | nature | Dawnstar Bloom | Store up to 4% max HP from a heal (including overheal); release after the next surviving HP hit. 12s cooldown; cannot refill itself. |
| Winterheart Spire | weapon / Staff | slow | Winterheart | Funded spell against a Chilled enemy extends Chill by 1s (max 4s) and delays its attack by 0.5s (boss 0.2s). Shares delay immunity. 12s cooldown. |

## Boundaries and integration

- All cooldowns use combat seconds and persist across waves in one expedition. Attack/cast counters are expedition-local. Enemy marks, weaken and once-per-kill bookkeeping reset on enemy change. Prepared player buffs/reserves may carry between waves; none survive a new expedition.
- Dawn Mark starts on the first attack, can be consumed by that attack if critical, expires after 6s and is not repeatedly reapplied within one encounter.
- Drain primes Soul Harvest after affinity application; the following physical main attack ignores 20% current Armor. Golden Focus is snapshotted before the hit, so a critical cannot improve its own affinity roll. It adds 15 percentage points to the next main-weapon roll, capped at 100%; off-hand chances are unchanged.
- Eclipse converts only Barrier actually stripped. All generated Barrier respects the existing 30% max-HP cap.
- Toxic Fang uses the normal Poison stack cap (12) and existing Venom Burst consumption/cooldown; it does not call the Legendary attack handler recursively. Crimson Crescent only runs on damaging off-hand dagger strikes and extends one existing Bleed stack, capped at 6 remaining ticks.
- Barrier break is measured from positive Barrier before incoming absorption to zero after absorption. Ordinary Block and starting with zero Barrier are not break events. Dawnward protects the following attack. Solar Current requires actual Barrier absorption. The existing Block variable scope bug was repaired.
- Armor Crusher/Ashen Seal share a non-stacking 15% next-attack weaken. Dawnward and weaken use the strongest charge (not their sum), alongside existing capped tier mitigation. Charges are consumed by one enemy attack even if fully blocked/absorbed.
- Last Sunrise returns 30% of HP damage over 3 combat seconds after a surviving hit exceeding 12% max HP. Healing respects Tank's healing wound. Umbral Refuge requires a surviving hit below 35% HP. Bloom copies the healing amount (including overheal), capped at 4% max HP, into a reserve; it releases only after a surviving HP hit, cannot refill itself, and cannot revive. Healing reduction applies when storing and when releasing the reserve.
- Haste does not stack with itself. Wildroot and Thunderstep can coexist as +22% speed; Bleed's existing haste remains separate. No extra attack loops are created.
- No save migration rerolls existing affinities/stats or removes items. Signature descriptions resolve from current definitions rather than stale saved legendaryPower strings. New items with signatures use fixed affinities; generic items use normal affinity generation.

## Winterheart Spire asset and loot

The supplied image(8).png was recovered from the referenced conversation attachment. It is already a transparent 1254×1254 RGBA image. The artwork was inspected, resized proportionally to 248×248 and centered on a transparent 256×256 RGBA canvas, without generative alteration. Final asset: assets/legendary/winterheart_spire.png.

Winterheart Spire is a weapon/Staff and remains two-handed. It uses slow (Frost) for effect and magic on new drops. Winterheart extends existing Chill by 1s, capped at 4s, and requests a 0.5s attack delay (0.2s for bosses), respecting the existing shared 4s delay immunity. It does not increase global Legendary odds or Staff subtype odds. The existing Staff identity selection now chooses between Scepter and Winterheart; each receives half of the unchanged Staff conditional probability. Legendary Hunt calculates this sibling split from the catalog automatically.

## Validation and limits

- Full package test command passed, including all online model/save checks, v0.9.3 buildcraft and Legendary regressions.
- Added production-combat tests for all 22 obtainable identities, fixed/random new affinities, saved affinity/stat preservation, stale text replacement, signature cooldowns, marks, haste, stack addition/extension/consumption, real Barrier breaks, next-hit mitigation, reserve healing, no revive, asset dimensions/alpha, and UI status text.
- Deterministic playback smoke compares 1× and 4× for each of 13 affinity builds and all 22 Legendary identities. These are small regression fixtures, not balance simulations.
- Updated older test harnesses to select the inline game script rather than the first external script tag introduced by the previous Legendary implementation.
- An additional Chromium UI run was attempted but could not proceed: localhost server permission was declined. No browser visual-pass claim is made. The PNG was visually inspected directly.
- Large balance simulations remain pending. No main changes, deployment, rules changes or real player-data access.
