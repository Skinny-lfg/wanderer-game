# Wanderer v0.12 — Oct 25 follow-up repairs

Only the development branch and development Hosting are in scope.

## User-reported issues and resolutions
- Expedition Camp artwork fills the entire card as an absolute, cover-fitted image. A translucent bottom-heavy gradient makes the text readable. The 3-part illustrated Start Expedition button repeats the centre strip under both end illustrations, with compact and responsive proportions.
- Gear and potion icon fills tint subtly based on rarity. Actual potion rarity metadata is used for loaded/prepared potion frames rather than forcing all of them to Common. No PNG is stretched.
- Passive selection text is larger. Its effect labels have neutral ink, with only numeric upward effect previews highlighted in green.
- Between Realms attributes use compact 3-column chips (two rows), not five tall horizontal strips. Both gear and Bag cells are square; Inventory Stash gear/potion cells are also 1:1.
- The arena now looks up background art via the active run's persisted `path` after the controller clears its `selected` Realm on completion. CSS disables the previous heavy vignette/backdrop filter and preserves a subdued Realm picture.
- Canopy Stalker portrait moves down slightly through CSS, with no animation or combat geometry change.
- Active Buffs appear in the top Between Realms status strip when active.
- Apothecary unavailable-state no longer renders the Camp inside the City Center when a purchase is blocked. It shows a vendor-specific message, preserves the City DOM and keeps economy restrictions intact.
- The City Center Merchant has a visible Sell All Valuables section, using the same existing confirmation, idempotent economy method and permission check as Inventory. After sale it redraws the current view rather than forcing Inventory.

## Safety
Do not merge main or change Firebase rules, production Hosting, save format, equipment effects or any combat/loot balance. Reuse the existing `sellValuables()` for one-time credit. New tests are imported into the standard UI suite.

## Validation
Static source checks are provided at `tests/v012-hotfix-oct25.test.cjs`. Browser visual proof in Safari is still necessary. The existing full CI baseline already has 21 long-standing runtime-parity failures; report new failures separately, and do not change expected parity hashes.
