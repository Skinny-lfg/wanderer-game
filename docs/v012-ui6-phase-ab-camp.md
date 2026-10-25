# Wanderer v0.12 — UI.6 Fases A+B: Camp CSS consolidation and compact equipment layout

Scope: `development` only. UI-only; no modifications to `main`, Firebase Hosting/Firestore rules, real player saves, inventory mechanics, item assets, potion logic or game balance.

## A — CSS cleanup

- Replaced the accumulated ~18.3 kB UI.5 Camp stylesheet with **one authoritative Camp-specific stylesheet**, with a single responsive spacing system. This avoids layering UI.5/5b fixes and repeated percentage offsets for each slot.
- Existing shared styles in `index.html`, `online/v012-phase1.css`, `online/ux39.css`, `online/v012-ui4*.css` remain intact because they also style Inventory, Between Realms and other views. The **last-loaded** `online/v012-ui5-camp.css` now owns all final Camp rules.
- Scope is rooted in `.phase3IntegratedPreview .phase3Camp` / `.phase3CampGrid` / `.phase3CampCharacter`; no blanket item UI rewrites.
- The desktop 3-column composition (stats and Your Journey at left, character center, Expedition right), and existing mobile order and sticky Expedition button, are retained. HP/Mana styling, secondary stats and actions are unchanged for Phase C/D.

## B — Gear / portrait / potions

- Replaced ten individually positioned percentage-based slots with CSS Grid: two outer columns and five explicit fixed-height rows. Center portrait stays absolute only as a noninteractive image overlay behind the slots.
- Left: Weapon, Off-Hand, Helm, Armor, Gloves. Right: Amulet, Belt, Ring I, Ring II, Boots.
- Desktop row height: **78px**, frame: **54px**, equipment art: **38px**; mobile row height: **74px**, frame: **50px**, equipment art: **33px**. Under 380px, the frame is 48px and slot column 60px. Five rows occupy 390px / 370px, with captions inside tracks.
- Character stage maximum width is 350px desktop / 300px mobile (286px on narrow phones), drawing columns together instead of stretching them to the whole available window.
- Real item artwork remains contained with its original proportions; tier badges and rarity images are not rewritten. Keep a label lane inside each slot row.
- Three existing potion controls remain immediately under the stage within the character window; their purchase/equip/remove/use handlers are untouched.
- Existing scene background/fade offsets are retained on stacked viewports.

## Validation performed

- Confirmed current `development` Camp HTML emits the shared `phase3PaperMarkup` and `phase6LoadoutMarkup`, with exactly ten equipment slots derived from `SLOTS`.
- Checked all ten slot types have exactly one explicit row and correct left/right column assignment in the replacement CSS.
- Static checks for valid CSS structure, fixed-row sizing, frame/image distinction, preserved sticky Expedition button, no gameplay scripts or player-save modifications.
- File footprint: earlier Camp stylesheet ~18,341 chars; consolidated stylesheet ~16,845 chars.
- **Browser snapshots and live device smoke tests are not claimed as passed.** Isolated real-page visual validation at 360, 390, 700, 1024, and 1440px is still needed; check frame/labels, two-handed Off-Hand, armor type captions, potions, no horizontal scroll and the character's feet. In the next stage, refine Health/Mana and stats only after geometry is accepted.

## Deferred

Phase C: HP/Mana, fine stat design, hide 0/0 Mana. Phase D: mobile sticky Start Expedition and navigation polish.
