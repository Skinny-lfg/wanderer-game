# G2.4B.5E — Final Iconography Validation

Audited snapshot: aa2a66316fc42d4740e7018280554f22f01dc324 (experiment/godot-foundation).
Scope: asset validation outside Godot; no changes to approved art, UI composition, or gameplay.

## Inventory and integrity
- 64 PNGs: 14 isolated actions, 14 precomposed framed actions, one reusable frame, 10 navigation/city, 21 attributes, four resources. 49 distinct symbols. Full UI kit: 132 PNGs.
- Decoded all 64 originals from the transfer packets; all PNGs readable, 256×256 RGBA, alpha spans 0–255, all corners and all outer edge pixels transparent. All byte counts and SHA-256 values match their respective manifests. Computed Git blob SHA-1 matches packet SHA for every file. Compared sorted path=blob-SHA lists for 72 entries (64 PNG + eight docs) with published tree using two independent 32-bit fingerprints; both match (af180db1, 33d76363). No duplicate blob hashes among the 72 files.
- Visual inspection at 96, 32, 24 px on dark/light backgrounds. Raster extraction can retain minor edge color, and details simplify at small sizes. Attributes retain provisional owner approval.

## Layout contract
Use isolated symbols as canonical; use icons/actions/frame_thin.png only when needed, with a separate background surface. Existing *_framed PNGs are preserved as reference/optional precomposed variants, not to be layered with another frame. No nine-slice on symbols. Keep aspect ratio.
- Longest visible dimension (alpha >=128), actions 147–185 px, navigation 207–212 px, attributes 204–206 px, resources 218 px. Adjust presentation by family rather than resampling the approved originals.
- Center alpha of shared frame is zero. At native 256 px canvas, 14 of 49 symbols overlap frame pixels at alpha >=128 (3281 pixels across icons). At 240 px centered symbol canvas: nine overlaps; 230 px: six; 218 px: zero; 205/192 px: zero. For shared frame, use centered symbol canvas <=85% of frame width/height (218/256 approximately 85.2%), subject to in-engine checks at target sizes. Existing actions already fit at full canvas. Prefer frameless navigation, attributes and counters where appropriate.
- Visual ambiguity: Intellect and Codex both open books, distinguished mainly by context. No need to redraw now; revisit if in-engine readability suffers. The four revised attribute designs are provisional.

## Semantic audit
21 attribute icons cover STAT_KEYS in combat/v012-gear-stats.js of release/v013-consolidated; Evasion rating and calculated Evasion share one icon. Gear Power maps to power; Guard maps to blockChance; Attack Speed maps to attacksPerSec; DoT Power maps to dotPower. Four resource labels match preview_page.gd (Gold, Fragments, Essence, Reagents; generic reagent.png). Individual family reagents, Runestone Shards, Anchor Runes, skills, status effects, and Affinities are out of scope.
Actions are owner-approved general-purpose controls, not evidence of implemented mechanics. Existing prototype has filter/sort, select multiple, salvage, clear filters and sell controls; dedicated icons for ascending/descending order, multi-select and salvage are not present. Keep text/native controls where necessary; do not imply discard equals salvage, swap equals reset or upgrade implies an implemented gear upgrade. No new gameplay.

## Verdict
Asset-level audit passes with integration notes; no blocking PNG defects found. Production may proceed to G2.4B.6 Equipment Art. G2.4B.7 must verify actual Godot rendering, legibility, frame composition, resource and attribute mappings, and 1280×720 / 1920×1080 layouts. No Godot runtime tests executed in this audit.
