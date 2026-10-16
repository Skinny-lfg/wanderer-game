# v0.9.2 Legendary catalogue — audit and implementation decision

**Status:** AUDITED / BLOCKED ON GENERATION DESIGN. No Legendary catalogue, name, drop probability, saved item, or artwork files have been changed by this audit. Branch: `development`.

## Current implementation

- Main implementation is in `index.html`: `SLOTS`, `TYPES`, `OFFHAND_TYPES`, `chooseSubtype()`, `makeItem()`, `itemImg()`, `migrateItem()`, `rarityRoll()` and `rarityOdds()`.
- Item **instance ID** (`id`), `name`, `rarity`, `slot`, `subtype`, attributes, `effect`, `magic` and `legendaryPower` are persisted in the save; there is **no stable catalogue-level `legendaryId`**. `itemImg()` currently derives an image from the saved item name, and falls back to subtype equipment art.
- `makeItem()` chooses a slot and subtype, then rolls rarity and stats. When Legendary, any **weapon** subtype receives one of five Legendary names at random, without checking its image/slot/subtype. Non-weapon Legendary receive `Legendary ` + their ordinary name, and no exclusive image.
- The five original names each have **20% of the weapon-Legendary naming pool**, independently of weapon subtype. The weapon category roll weight is **15/100**; weapon subtypes are uniformly chosen from seven values. This is not a global 20% Legendary chance.
- Non-weapon slot weight: helm 13, amulet 9, armor 13, gloves 13, offhand 13 (each of five subtypes), ring 11, boots 13. Each ring outcome is stored as ring1 or ring2.
- `rarityOdds()` currently uses Legendary 0.015 outside specific wave reward odds; individual wave Legendary chances are configured independently in `WAVE_TABLE`. Both must remain unchanged unless explicitly approved.
- `source==='forge'` has no Legendary roll. The Merchant downgrades rolled Legendary rarity to Epic; no ordinary Merchant Legendary sale exists.
- The current `migrateItem()` preserves existing names, IDs, attributes and effects, and infers missing generic item fields. Existing Legendary items may have incompatible name/subtype combinations. Save compatibility is therefore a hard requirement.

## Proposed canonical catalogue: 12 identities (not implemented)

| Stable catalogue ID | Display name | Valid slot | Valid subtype | File |
| --- | --- | --- | --- | --- |
| soul-reaver | Soul Reaver | weapon | Two-Handed | soul_reaver.png |
| runeforged-eclipse | Runeforged Eclipse | weapon | Two-Handed | runeforged_eclipse.png |
| the-eternal-oath | The Eternal Oath | offhand | Shield | the_eternal_oath.png |
| heart-of-shadows | Heart of Shadows | amulet | Amulet | heart_of_shadows.png |
| starweaver-relic | Starweaver Relic | weapon | Wand | starweaver_relic.png |
| helm-of-the-dawnwarden | Helm of the Dawnwarden | helm | Helm | helm_of_the_dawnwarden.png |
| cuirass-of-the-last-sunrise | Cuirass of the Last Sunrise | armor | Armor | cuirass_of_the_last_sunrise.png |
| grasp-of-the-sunbound | Grasp of the Sunbound | gloves | Gloves | grasp_of_the_sunbound.png |
| sunstride-sabatons | Sunstride Sabatons | boots | Boots | sunstride_sabatons.png |
| pendant-of-the-first-flame | Pendant of the First Flame | amulet | Amulet | pendant_of_the_first_flame.png |
| signet-of-the-dawnforged | Signet of the Dawnforged | ring1/ring2 | Ring | signet_of_the_dawnforged.png |
| aegis-of-the-dawnstar | Aegis of the Dawnstar | offhand | Shield | aegis_of_the_dawnstar.png |

The original five image identities have been checked visually; in particular **The Eternal Oath is a shield**, **Heart of Shadows an amulet**, and **Starweaver Relic a wand**. **Aegis of the Dawnstar is a Shield in Off-Hand, never chest armor.**

## Drive asset validation

Drive folder: https://drive.google.com/drive/folders/136mgASyC2sNDDW8u_jqpWi9rybSF6lL9

All seven requested new files exist under their exact requested filenames; each was read successfully and its PNG signature, IHDR dimensions **256×256**, and color type **6 (RGBA)** were verified. Files have not yet been copied into `assets/legendary` pending the design decision below.

## Blocking compatibility / probabilities issue

The requested set of twelve identities only supports two of the seven weapon subtypes (Two-Handed and Wand) and one of the five offhand subtypes (Shield), plus the armor/accessory slots.

There are **nine currently generated subtypes without a corresponding named Legendary exclusive image**:

- weapon: Sword, Mace, Bow, Daggers, Staff
- offhand: Off-Hand Dagger, Orb, Tome, Charm

Therefore it is impossible to satisfy **all** of these simultaneously with only the twelve artworks:

1. Every Legendary roll uses one of these twelve unique item identities and correctly matching artwork.
2. Existing item-slot/subtype frequency distributions remain unchanged.
3. The original five named Legendary have exactly the same individual roll chance they had before.
4. All old gear remains functional and keeps its original stats/effects.

In particular, some old names (e.g. Shield / Amulet visual identities) previously appeared **only on the weapon slot**, so moving those identities into compatible slots necessarily changes their distribution. Making only catalogue-covered subtypes eligible for new Legendary would alter the subtype mixture, hence loot/build balance, although global Legendary rarity odds and numerical stat formulas could remain untouched.

**Decision required before implementation:**

- **Option A — preserve loot/subtype probability rules:** Use the twelve fixed identities when slot/subtype matches. Allow other subtypes to remain Legendary with their existing subtype-specific equipment art (not a unique Legendary image). Their original five-name frequencies change to reflect compatible subtypes.
- **Option B — strict 12-item catalogue (best unique visual identity):** Preserve the global Legendary rarity odds and stat formulas but constrain new Legendary subtype/slot selections to the catalogue. The subtype distribution changes; a balance-design exception is required.
- **Option C — preserve subtype distribution and give EVERY Legendary exclusive art:** Provide/generate at least nine further Legendary art identities. Even with these images, individual original-five name frequencies still need a conscious design decision.

For legacy Legendary mismatches, suggested non-destructive compatibility: never overwrite an existing instance's `id`, `name`, `slot`, `subtype`, numerical stats, effects, or powers. Attach catalogue IDs only when a saved name+slot+subtype matches; unmatched historical items must remain usable and receive a subtype-compatible image. No inventory or progress reset.

## Separate, already implemented UI correction

The Tier Bonus progression renders its milestone list in fixed **2 → 3 → 5** order, including locked/greyed tiers, without touching set thresholds or combat bonuses.

## Release and test requirements

After design choice: install seven new PNG assets with `assets/legendary/` paths; introduce centralized static catalogue; make `itemImg()`, `makeItem()`, any new item/catalogue mapping use it; ensure old saves migrate non-destructively; test all slots, source categories, file bytes, generated name/type compatibility, saved-item persistence, rarity/slot/subtype statistical regressions, and desktop/mobile rendering. Keep changes on `development`; do not merge to `main`.
