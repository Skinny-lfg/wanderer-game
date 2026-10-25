# Wanderer v0.12 — Visual QA feedback (25 Oct 2026)

**Changes on development UI only**

1. Halved the black inset of item icons (12% to 6%); replaced the dark inner backing with a consistent dark-grey surface for items and potions. All image art remains `object-fit:contain` and square slot frames remain 1:1.
2. Expedition panel illustration is displayed intact with `object-fit:contain` and without the clipping gradient. Modular button has a bounded width; its left/right approved Drive pieces retain their intrinsic aspect ratios and the seamless centre tile extends underneath.
3. City Center illustrations keep intrinsic aspect ratio and captions no longer overlap the image.
4. Camp and Between Realms potions retain 1:1 ratio and the grey icon treatment.
5. Realm-passive popup width capped at 1040px desktop, mobile still scrollable and usable.
6. Arena renders the same C3 Realm art under a translucent dark gradient. Removed competing black backgrounds.
7. Between Realms header made compact on desktop. Equipment tab reorganised as character/equipment left and a right rail with five vertical stats above the Expedition Bag. Mobile stacks cleanly.
8. Grave Lantern display size reduced; no edits to GIFs or combat hitboxes.
9. Expedition Lost result uses Realm artwork as panel background rather than a dark pseudo-element; Gothic corner overlay stays absolutely positioned, and the Return to Camp action remains near the title.

No balancing, currencies, item rolls, account saves, Firestore rules or production/main branch updates.

**Known unrelated baseline:** development suite had 290/311 passed and 21 pre-existing runtime-parity mismatches on the last published development commit. Evaluate whether this update introduces new failures separately; do not rewrite expected parity hashes to hide them.

**Validation:** New static checks in `tests/v012-visual-feedback-oct25.test.cjs`. Browser/mobile screenshots still require live visual verification.
