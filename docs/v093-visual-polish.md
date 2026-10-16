# Wanderer v0.9.3 — Visual playtest polish

Development-only follow-up based on screenshots and player feedback. Never change `main`, Firebase rules, or real player saves.

- **Character names:** renamed cosmetic display labels (without changing IDs, artwork IDs, saves or gameplay): Warrior, Archer, Dark Warrior, Old Mage, Rogue.
- **Legacy changelog:** historical notes now live inside a collapsed **Older updates** disclosure, with recent v0.9.3 updates still visible.
- **Equipment:** existing character artwork is rendered with `object-fit:contain` and 42% opacity behind equipment slots rather than zoomed into a face. Note: existing Drive-sourced WebPs are upper-body portraits; genuinely full-length legs/boots require separate new full-body artwork, which was not present in the recently supplied files.
- **Mark All as Seen:** moved the existing button into the inventory panel header; no behavior or save change.
- **Set bonus guide:** immediately explains that five matching set points do not directly increase proc probability. Detailed chance and approximate Poison/Bleed/Burn damage formulas are collapsed until requested. Magic casts, fallback attacks, 1H/2H, off-hand and Critical are described separately.
- **Shop:** buying a Merchant item immediately refills only that stock position with a new normal merchant roll. No Legendary odds or pricing table changes.
- **Forge:** crafted-item comparison modal offers **Equip Now**, or a choice of ring slot; equipping a shield/off-hand with a two-handed weapon is disabled. Closing keeps the item in the Stash.
- **Inventory:** added **Recommended for current build** and **Power level** sorting choices in addition to existing order/sort controls. Recommendation is an *estimate*, penalizing swaps that remove an active tier; it is not simulated win-rate data.
- **Comparisons:** status explicitly warns when any 2/3/5-piece tier is lost. Gear Power remains shown as an *estimated* metric, and a swap that loses set bonuses cannot be presented as an unambiguous positive upgrade. No global balance coefficient was changed.
- **Combat debuffs:** Frost's slow is labelled **Frost · Chilled**, with remaining duration. The Tank Elite healing wound now has a visible timed status on the player. Existing Poison, Bleed, Burn, Sunder, enemy weakens and other statuses remain.
- **Tests:** `tests/v093-visual-polish.cjs` adds an automated static and deterministic runtime fixture reproducing the D5 Storm Tome vs D4 Common Shield comparison and verifying other new UI hooks.

Validation scope: script syntax and an isolated JavaScript runtime fixture have been checked before pushing. Full `npm test`, browser visual tests and live account integrations have **not** been run from the GitHub connector environment. The user is continuing local browser playtesting; no production deployment has occurred.
