# Wanderer — Art Style Guide
## Stylized Gothic Painterly — v1.0 (G2.4A.2)
Date: 2026-11-26. Status: proposed production standard; elite artwork approved by owner; experimental asset board (G2.4A.3) still pending. Revise this document when the owner approves changes; do not silently turn proposals into final assets.

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
| Vitality | #24433B | #468E74 | #9AD6AB |
| Aegis | #584324 | #B88B46 | #F1D38A |
| Fury | #53281D | #BD592D | #F89A48 |
| Magic | #31254E | #7961B3 | #B7A0EF |
These are proposals, not replacements for existing functional game colors. Keep Affinity and rarity signals distinct. Preserve existing rarity color mapping unless explicitly approved; tooltip frames must match item rarity. Illustrative rarity colors from the concept: Grey #77777A, Common #BCBCB7, Uncommon #65A56C, Rare #518FCA, Epic #A477CE, Legendary #D7A74E.

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

## Validation and next stages
G2.4A.1 elite analysis complete; G2.4A.2 guide defined, pending visual validation. G2.4A.3 experimental board: sword, shield, helmet, Anchor Rune, bag slot, equipment slot, tooltip frame, button, health bar, mana bar, gold icon, essence icon. G2.4A.4 owner approval; G2.4B UI Kit 2.0 production only after approval.
For each new asset: compare to approved elite references; verify materials, silhouette, lighting, detail hierarchy and readability at intended size; validate transparency and edges where relevant; check existing UI composition at 1280×720 and 1920×1080 when integrating. Report any limitations; never describe untested assets as validated. Update guide with approved decisions and version history.

## Version history
- v1.0 — G2.4A.2: initial guide, based on three approved elite images; palette and production rules provisional until experimental board validation.
