# Wanderer — Art Style Guide
## Stylized Gothic Painterly — v1.3 (B3)
Date: 2026-11-26. Status: core artistic direction approved by owner after G2.4A.3; individual production assets and experimental Vitality palette still require validation. Mockup screen layouts are not approved. Seventh Reach brand direction approved; B2 core assets validated with reservations, integration pending. Revise this document when the owner approves changes; do not silently turn proposals into final assets.

## Mandatory workflow
Before creating, editing, commissioning or integrating any Wanderer art (images, concept art, UI, icons, items, characters, sprites, NPCs, enemies, environments or VFX), read this guide and inspect the original approved reference images when accessible. Treat those images as the primary style reference, not generic dark fantasy examples. If they cannot be opened, say so; do not claim visual verification. Apply this guide to the asset's function and real in-game scale. Preserve previously approved assets and G2.3B composition unless the owner explicitly requests redesign. No unapproved production changes.

## Primary visual references
Original PNGs, Google Drive > Wanderer - Game Development > 02 - Assets > Elites > In-Game PNG:
- [Gravecaller — Elite — Approved](https://drive.google.com/open?id=1okqtHNmDeugBz9GKGPfdZu01bVR09-J9): aged bronze, layered torn crimson and charcoal fabric, curved pointed cage, recognizable silhouette, localized green spectral energy.
- [Oathbound Exarch — Elite — Mirrored](https://drive.google.com/open?id=1ankOys0R5H2Jvb3zlUeBZsDpdMm1iFlg): main UI reference; sculpted gothic arches, aged gold, ivory, muted blue cloth, directional warm highlights, meaningful ornament.
- [Gravebound Bulwark — Elite — Facing Left](https://drive.google.com/open?id=1rnUBlrHd1lNJzgbwRFTsnTzRwzGKRGpH): heavy armor, thick chipped metal/stone, moss, tattered violet cloth, monumental mass.
These files were visually inspected in G2.4A.1. Their final named PNGs were found in Drive, not by those names in the inspected Godot and Playtest branches. Do not confuse Gravecaller summon sprites with the elite portrait.

## Artistic pillars
- Sophisticated hand-painted digital rendering; semi-realistic volumetric forms, neither photorealistic nor cartoon.
- Monumental gothic architecture: arches, pointed silhouettes, curved plates, robust angular edges, purposeful sculptural ornament. Objects should look forged, carved or assembled, not like flat rectangles with decoration pasted on.
- Stylized, exaggerated but convincing proportions; strong silhouettes and readable large forms.
- Weathered medieval craftsmanship: hammered aged bronze, dark forged iron, chipped stone, worn leather, layered fabrics, bone/ivory.
- Directional lighting, selective edge highlights, subtle ambient shadows, controlled painted texture and localized supernatural energy.
- Dark fantasy is NOT uniformly dark/desaturated. Maintain readability and contrast; use controlled accent colors.
- Avoid glossy plastic, anime, photorealism, cartoon proportions, excessive filigree, generic ornaments, excessive bloom, noisy textures and overdesigned silhouettes. Do not copy Exarch's religious symbol onto unrelated objects.

## Proposed palette (visual design values, not sampled measurements)
Base: Obsidian #201D22; Forged Iron #38353B; Weathered Steel #59504B; Aged Bronze #76604B; Antique Gold #B48D5D; Ancient Ivory #D3C1A7; Worn Leather #534036; Ash Cloth #34333E.
Affinity accents (shadow / mid / highlight):
| Affinity | Shadow | Mid | Highlight |
|---|---|---|---|
| Blood | #501923 | #A73340 | #E65460 |
| Decay | #263C26 | #59854C | #A4DA83 |
| Vitality | #594526 | #C6A04C | #F5E3A2 |
| Aegis | #203349 | #477FAC | #A3D7F4 |
| Fury | #53281D | #BD592D | #F89A48 |
| Magic | #31254E | #7961B3 | #B7A0EF |
Affinity direction update: Aegis uses blue tones for protection and barriers. Vitality uses Golden Life (warm gold / amber / pale golden light) as an explicitly experimental choice, not final approval; explore restorative holy light, warm ivory and halos rather than nature or plant motifs. Decay retains green; avoid green Vitality effects in this trial. Distinguish Vitality's restorative golden light from Fury's aggressive orange-red and from material gold and item rarity indicators. Aegis armor may retain aged gold/bronze materials; magical affinity colors need not match armor materials. Continue to validate these colors together during production before changing any functional game colors. These are proposals, not replacements for existing functional game colors. Keep Affinity and rarity signals distinct. Preserve existing rarity color mapping unless explicitly approved; tooltip frames must match item rarity. Illustrative rarity colors from the concept: Grey #77777A, Common #BCBCB7, Uncommon #65A56C, Rare #518FCA, Epic #A477CE, Legendary #D7A74E.

## Material library
Bronze: warm, weathered, hammered. Iron: dark, heavy, forged. Stone: ancient, chipped, carved. Leather: matte, worn, seams. Cloth: heavy, layered, frayed. Bone/ivory: organic, ritualistic. Put wear on exposed edges, contact areas and raised features, not uniform dirt/noise. Reserve bright highlights for meaningful shape and focus.

## Equipment and items
Quality of illustration remains high at every rarity; complexity and uniqueness increase with rarity.
- Grey: improvised, damaged, rudimentary. Common: simple and functional. Uncommon: better craftsmanship/materials. Rare: specialized with small ornaments. Epic: distinct silhouette and supernatural details. Legendary: individually recognizable shape and identity.
- Cloth: layered fabrics, embroidery, ritual accessories. Leather: stitching, straps, small plates. Plate: thick large plates, convincing weight.
- For bag items, prioritize icon readability at small scale; equipped objects and tooltip presentation may carry more detail.

## UI Kit 2.0
Preserve approved G2.3B composition; avoid dashboard/web appearance, redundant borders, cards, and forced symmetry. Maintain continuous backgrounds and intentional negative space.
Detail hierarchy: frequent components must be simple; special elements can be ornate.
| Component | Detail |
|---|---|
| Bag slots, filters, sort, secondary controls | 1 — simple, unobtrusive |
| Equipped slots, primary buttons, selected states | 2 — moderate thickness, material and lighting |
| Item tooltips, Legendary presentations, Anchor Runes | 3 — selective ornament |
| Boss reward/special presentation | 4 — exceptional detail |
A 40-item bag must not show 40 highly ornate frames. Use bronze/iron selectively, neutral inner surfaces, and rarity-colored tooltip frames. Tooltips fit content, preserve comparisons and remain legible. Primary actions may be physically sculpted; secondary controls remain discreet. Red danger states should be clear and functional. Do not change approved UI layout or mechanics in a purely artistic task.

## Characters and combat
Wanderer: experienced traveler, not immaculate hero. NPCs: functional attire and clear identity. Mobs: simple distinct silhouettes. Elites: signature silhouette and accessories tied to abilities. Bosses: monumental scale and unique identity. Separate presentation illustrations from in-combat sprites; combat sprites need full bodies when appropriate, coherent perspective and illumination, ground contact/shadows, consistent scale and preparation for animation. Preserve existing arena constraints.

## Environments
Use the same painterly rendering as characters: recognizable stylized medieval/gothic architecture, layered depth, local atmospheric light, controlled texture and reduced visual noise where UI information sits. Do not use photographic backgrounds or overwhelm interaction areas.

## Master art prompt
Stylized gothic dark fantasy game art, sophisticated hand-painted digital rendering, semi-realistic volumetric forms, monumental gothic architecture, strong recognizable silhouettes, sculpted proportions, weathered medieval craftsmanship, hammered aged bronze, dark forged iron, chipped stone, worn leather and layered fabric.

Controlled painterly textures, selective edge wear, directional lighting, subtle ambient shadows, readable large shapes, carefully placed highlights, restrained ornamentation and purposeful supernatural accents.

Visual identity based on the approved Wanderer Gravecaller and Oathbound Exarch elite artwork.

Maintain visual consistency across characters, equipment, environments and interface assets. Prioritize readability at actual in-game scale. Detail density must match the asset's function and visual importance.

Avoid photorealism, cartoon proportions, anime aesthetics, glossy plastic materials, excessive filigree, generic fantasy ornamentation, excessive bloom, noisy textures and overdesigned silhouettes.

For isolated game assets, use clean silhouettes, consistent lighting, appropriate framing and transparent backgrounds where required.

## Seventh Reach — brand identity (B3)
**Status:** owner-approved creative name and visual direction, 2026-11-26. Seventh Reach is the public-facing creative identity; Wanderer remains the historical and technical project identifier until a controlled rebranding stage. Trademark availability is not confirmed. This section does not authorize changes to gameplay, save formats, internal identifiers, repository names or existing UI layouts.

### Approved composition
- Stylized Gothic Painterly, based on the owner-selected painted ivory-and-antique-gold logo and brand board. Preserve the actual approved master, not a fresh approximation; the B2 pack contains the master used for production.
- Widely spaced uppercase serif SEVENTH above dominant, sculpted REACH; warm ivory faces, gold/bronze bevels, visible brushwork, painted directional shadows and restrained highlights. No photorealistic metallic sheen or excessive bloom.
- Two subordinate concentric rings; six neutral faceted exterior fragments (one at top, one at bottom, four diagonals), representing the six Realms and Affinities. The seventh fragment in the A of REACH represents The Origin and the convergence of power. The isolated emblem has exactly six exterior fragments and one central fragment, with no text.
- Preserve the typography-first hierarchy and symmetric, discreet inward lines. No additional lower flare, portal above the title, invented elemental glyphs, heavy stone plaque, giant crest or extra lateral fragments. Neutral across Affinities. The main brand is not a fire or Radiance emblem.
- Brand materials follow the existing base palette: Obsidian, Worn Leather, Aged Bronze, Antique Gold and Ancient Ivory. Existing palette values are design references, not sampled logo colors; no specific commercial font is approved by this update.

### Variant roles and current asset status
| Asset | Intended use | B2 status |
|---|---|---|
| 01_full_logo.png | Main menu, title presentation | Master preserved; ready as visual base |
| 02_logo_transparent.png | Dark UI, scenery, promotional overlays | RGBA verified; fully opaque RGB pixels match master; avoid light backgrounds |
| 03_wordmark_transparent.png | Headers and compact UI | Stacked text without rings; 36 px transparent margin on every side, 1309 × 423 px |
| 04_symbol_dark.png / 04_symbol_transparent.png | Loading, game icon | Six exterior nodes and one central node |
| 05_ancient_ruins.png | Thematic presentation | Provisional; more natural weathering and moss required |
| 06_forge.png | Thematic presentation | Provisional color/atmosphere treatment; acceptable base |
| 07_arcane.png | Thematic presentation | Provisional color/atmosphere treatment; acceptable base |
| 08_classic_painted.png | Lore, parchment, light backgrounds | Provisional; improve SEVENTH contrast before use |
The four thematic treatments are derivatives of the main master, not separately painted final illustrations, and must preserve its geometry and letterforms. They do not define new Affinities or replace the main logo.

### Production specification and validation
B1/B2 local delivery: `Seventh_Reach_B2_Validated_Pack.zip` (27 files; PNG, ICO, README and two inspection images). ZIP integrity rechecked in B3. Main logo and transparent master are 1448 × 1086 px, not native 4K. Symbol masters are 1086 × 1086 px. Do not claim native 4K or final production quality by upscaling. Pack is not yet uploaded to GitHub or Drive.
- Icons: simplified technical derivative for 16, 32 and 48 px; original painterly treatment at 64, 128, 256 and 512 px. Both dark-background icon and transparent symbol PNGs. Favicon ICO has distinct PNG frames at 16/32/48/64/128/256 px.
- Validate alpha, clean edges, absence of baked checkerboards, legibility, safe margins, six-plus-one node count and typography consistency. Use the actual asset at intended display size. Transparent logo is primarily for dark backgrounds; use a suitable contrast treatment on bright scenes, not an unapproved recolor.
- B2 provides a usable core brand base with reservations: thematic refinements, higher native resolution and in-game visual testing are pending. The selected style board is a reference, not a substitute for individual assets.
- B4 integration remains separate: import approved core assets, replace only public-facing branding (main menu, title, loading, favicon and relevant metadata), preserve existing internal IDs and saves, test actual desktop and mobile layouts, and avoid touching gameplay. No integration performed in B3.

### Canonical naming note
The Lore Bible now uses Radiance (formerly Vitality) and Arcane (formerly Magic). The palette table above remains a record of the existing artistic color proposals; these naming changes do not approve new functional colors or change the prior experimental Golden Life palette status.

## Validation and next stages
G2.4A.1 elite analysis, G2.4A.2 style guide, G2.4A.3 experimental boards and G2.4A.4 core artistic direction validation complete. Owner liked the second experimental asset board and individual elements, but noted that mockup layouts were too boxy. Preserve G2.3B composition; reduce ornamentation, especially repetitive bag slots, bars and secondary buttons. Production proceeds by component family, with individual visual approval before integration. G2.4B.1 Materials & Surfaces: test dark neutral interior surfaces, forged iron, aged bronze, leather, stone and fabric; no ornament, frames or text in usable textures. Keep surface texture subtle behind text and icons; prefer reusable seamless textures, validate tiling before calling them production-ready. Subsequent stages: slots/frames, buttons/navigation, resource bars, iconography, equipment art, Godot integration and visual audit.
For each new asset: compare to approved elite references; verify materials, silhouette, lighting, detail hierarchy and readability at intended size; validate transparency and edges where relevant; check existing UI composition at 1280×720 and 1920×1080 when integrating. Report any limitations; never describe untested assets as validated. Update guide with approved decisions and version history.

## Version history
- v1.0 — G2.4A.2: initial guide, based on three approved elite images; palette and production rules provisional until experimental board validation.

- v1.1 — Aegis blue direction requested by owner; Golden Life Vitality authorized for experimentation only. No game or asset color changes.

- v1.2 — Core painterly asset style approved for progressive production; mockup compositions rejected as too boxy. Materials & Surfaces begins; no game or asset changes.

- v1.3 — B3: Seventh Reach brand identity and B2 asset specifications documented; existing artistic pillars, UI composition, gameplay and functional colors unchanged. Brand integration and remaining asset refinements pending.
