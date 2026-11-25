# Wanderer — Godot experiment

Isolated visual/remote-development sandbox, based on the consolidated browser checkpoint `258b2953ee7ef07a5e62862759be3a162b1e4a93` (Stage 6.24C). Not a migration, release or replacement of the current browser game. Later browser balance work is deliberately not ported.

## Run

Use Godot 4.4.1 Standard (pinned CI reference; newer Godot 4 versions are not yet validated). Import this directory's project.godot and press F6/F5 (F5 runs the main scene). F5 starts the Camp. Navigate using the bottom tabs or keys 1–5 at Camp; Escape returns to Camp or from the combat preview to the expedition preview. Click an enemy on the Combat screen to select it. The four static enemy images, dungeon backdrop and hero are existing assets copied by blob from the browser snapshot; their orientation and composition have not been visually approved. The hero is a placeholder, not new rear-view art.

CLI:
```sh
godot --headless --path godot-prototype --import
godot --headless --path godot-prototype --script res://tests/arena_smoke.gd
godot --headless --path godot-prototype --script res://tests/shell_smoke.gd
```

## Architecture and migration boundaries

- scenes/: presentation only, later arena, camp, inventory, talent tree.
- scripts/: prototype presentation/input; later separate domain logic from rendering.
- assets/: small curated copies of existing art. Do not copy the entire browser asset library yet.
- tests/: Godot runtime smoke tests; later deterministic fixtures.
- Future data/: versioned engine-neutral JSON catalogs with stable IDs, exported from the canonical browser sources.
- Future domain/: combat rules, equipment, talents, economy, expedition and persistence, independent of scenes.
- Browser sources remain authoritative until migration is separately approved: combat/, economy/, online/, assets/, scripts/, tests/. In particular, combat/v012-combat-core.js and combat/v012-combat-runtime.js are reference implementations, not scripts Godot can directly run.
- Do not maintain two live implementations while the browser combat is changing. Freeze a later approved browser commit before translating mechanics; compare deterministic input/output traces including RNG, tick order, targeting, damage, buffs and rewards. No balance adjustments in a migration.
- No Firebase or production changes. No merge to main or canonical browser/playtest branches.

## Milestones

G0: isolated arena foundation and remote smoke.
G1: game shell, five Camp tabs (Camp, Inventory, Talents, City Center, Shrine), contextual Expedition and Combat previews, secondary Codex and screenshot pipeline. Screens are presentation mockups; Combat retains G0 selection. Sample items, talent nodes and Codex are not authoritative gameplay. Desktop layout reference: 1280x720. No visual approval yet.
G2: reusable UI components and visual design system; validate scaling and layouts.
G3–G8: Camp, Inventory, Talents, Expedition, Combat, animation and transitions.
G9–G10: only after browser rules are frozen, port and compare mechanics.

Screenshot capture uses a graphical backend, not headless mode. CI uploads the eight PNGs as `godot-g1-screenshots`. To capture locally with the graphical Godot executable: `godot --path godot-prototype --script res://tests/capture_screens.gd`.

G1R: corrected navigation and recorded the proposed UI kit in `docs/ui-kit-plan.md`. No final art or reusable G2 component implementation is implied.

## G2.1 — Stylized Gothic UI workshop

Open `res://ui/showcase/ui_gallery.tscn` in the Godot editor and press F6. F5 still launches the original game shell. Six interactive categories: Foundations, Buttons, Panels, Navigation, Item Slots and Tooltips. Theme: `ui/theme/stylized_gothic_theme.tres`; original procedural SVG nine-slice textures; system-font fallback pending font selection. No other themes are implemented because Stylized Gothic was selected. No gameplay wiring or migration of existing screens yet. Other UI kit families remain on the G2 backlog. Desktop 1280×720 reference; visual approval and other resolution checks pending.

Gallery smoke: `godot --headless --path godot-prototype --script res://tests/gallery_smoke.gd`. Rendered PNGs are uploaded to CI artifact `godot-g21-gothic-gallery`.

## G2.2A — Painted buttons preview

The gallery now supports the local 16-PNG button art pack at `godot-prototype/ui/assets/buttons/g22a/` (repository-root relative). Extract the supplied installation ZIP into the repository root. Open the gallery with F6, choose Buttons and select G2.2A Painted PNG; click Reload artwork if necessary. The original G2.1 SVG option remains available. A missing/incomplete pack falls back to SVG and explicitly reports that it is missing. Source PNGs are 371×76, resized in memory to 264×54 for initial nine-slice settings. Actual art is not in this commit; CI uses synthetic PNG fixtures to validate wiring, not the appearance of the real assets. No game screen changes.

## G2.2B — Painted panels and frames

Extract `wanderer_g22b_gallery_assets.zip` into the repository root (folder structure included). Gallery F6 → Panels → G2.2B Painted PNG → Reload artwork. The 14 PNGs live at `godot-prototype/ui/assets/frames/g22b/`. Seven frame styles use initial nine-slice settings, banner and portrait retain aspect ratio, and crest overlays retain their independent size. Scroll for all examples. Original SVG comparison stays available. Art pack is supplied separately; CI synthetic fixtures validate integration until real PNGs are committed. No theme application to the game screens yet.

## G2.2C — Navigation art

Extract the supplied `wanderer_g22c_gallery_assets.zip` into the repository root. Gallery F6 → Navigation → G2.2C Painted PNG → Reload artwork. Eleven PNGs at `godot-prototype/ui/assets/navigation/g22c/`: five aligned tab backgrounds, five separate section icons and an ornament reused from G2.2B. Live five-tab exclusive selection, compact icon-only variant, sample talent-count badge, fixed state samples and SVG comparison. Nine-slice margins are initial candidates. The real game shell and other categories are unchanged. CI tests the loader with synthetic assets and validates actual files if installed. 

## G2.2D — Painted item slots

The ten approved PNGs are committed at `godot-prototype/ui/assets/inventory/g22d/`. Pull the branch, open the gallery (F6), choose Item Slots and G2.2D Painted PNG. The preview has six rarities, four interaction states, a 48-slot bag with 30 sample items and selectable 48/64/80 px sizes, and equipped samples. Original slots remain selectable. Only the gallery opts into the painted textures; gameplay remains unchanged.
