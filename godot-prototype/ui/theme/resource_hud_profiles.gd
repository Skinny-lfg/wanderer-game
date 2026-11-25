extends RefCounted
## Gallery-only design profiles. Bundled fonts are OFL-licensed upstream files.
const FONTS = [
	preload("res://ui/assets/fonts/Cinzel.ttf"),
	preload("res://ui/assets/fonts/RobotoCondensed.ttf"),
	preload("res://ui/assets/fonts/Inter.ttf")
]
const KINDS = ["Health", "Mana", "Barrier", "EXP"]
const PROFILES = [
	{"name": "A — Classic RPG", "family": "Cinzel Semibold", "heights": [32, 24, 18, 10], "weight": 600, "alignment": HORIZONTAL_ALIGNMENT_CENTER, "scale": 0.68, "outline": 2},
	{"name": "B — Modern Gothic", "family": "Roboto Condensed Semibold", "heights": [34, 28, 16, 8], "weight": 600, "alignment": HORIZONTAL_ALIGNMENT_CENTER, "scale": 0.70, "outline": 3},
	{"name": "C — Minimal", "family": "Inter Medium", "heights": [26, 26, 26, 8], "weight": 500, "alignment": HORIZONTAL_ALIGNMENT_RIGHT, "scale": 0.66, "outline": 2},
	{"name": "Previous — G2.2F.2", "family": "Original theme font", "heights": [30, 26, 24, 16], "weight": 400, "alignment": HORIZONTAL_ALIGNMENT_CENTER, "scale": 0.53, "outline": 3}
]
const DEFAULT_INDEX = 1
var cached_fonts: Dictionary = {}

func font_for(index: int) -> Font:
	if index < 0 or index >= FONTS.size():
		return null
	if not cached_fonts.has(index):
		var font = FontVariation.new()
		font.base_font = FONTS[index]
		var tag = TextServerManager.get_primary_interface().name_to_tag("wght")
		font.variation_opentype = {tag: PROFILES[index]["weight"]}
		cached_fonts[index] = font
	return cached_fonts[index]
