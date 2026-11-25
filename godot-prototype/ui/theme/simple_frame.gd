extends RefCounted
## Reusable lightweight nine-slice frame, independent of any painted asset pack.
## 40x40 atlas: 16px fixed corners, 8px repeatable edges and center.
## Use for compact information, list entries, counters and other quiet surfaces.
const Modular = preload("res://ui/theme/modular_frame.gd")
const CORNER = Vector2i(16, 16)
const ATLAS_SIZE = Vector2i(40, 40)
const MIN_FRAME_SIZE = Vector2(32, 32)
const NEUTRAL_SURFACE = Color("#17181c")
const NEUTRAL_BORDER = Color("#786751")
const NEUTRAL_INNER_LINE = Color("#3c342b")
const DEFAULT_PADDING = Vector4(15, 15, 15, 15)

# top_inset=10 reserves transparent space for a separately attached crest.
# Keep it within the corner tile so the center and edges remain repeatable.
static func build_atlas(surface: Color = NEUTRAL_SURFACE, border: Color = NEUTRAL_BORDER, inner_line: Color = NEUTRAL_INNER_LINE, top_inset: int = 2) -> Texture2D:
	var image = Image.create(ATLAS_SIZE.x, ATLAS_SIZE.y, false, Image.FORMAT_RGBA8)
	image.fill(Color(0, 0, 0, 0))
	var top = clampi(top_inset, 2, 10)
	for y in range(ATLAS_SIZE.y):
		for x in range(ATLAS_SIZE.x):
			var left = x - 2
			var right = 37 - x
			var upper = y - top
			var lower = 37 - y
			var d = float(mini(mini(left, right), mini(upper, lower)))
			d = minf(d, float(mini(mini(left + upper, right + upper), mini(left + lower, right + lower)) - 4) / sqrt(2.0))
			if d < 0.0:
				continue
			var color = surface
			if d < 1.0:
				color = border
			elif d < 2.0:
				color = inner_line
			image.set_pixel(x, y, color)
	return ImageTexture.create_from_image(image)

static func style_from_atlas(atlas: Texture2D, padding: Vector4 = DEFAULT_PADDING) -> StyleBoxTexture:
	return Modular.style(atlas, CORNER, padding)

static func make_style(surface: Color = NEUTRAL_SURFACE, border: Color = NEUTRAL_BORDER, inner_line: Color = NEUTRAL_INNER_LINE, padding: Vector4 = DEFAULT_PADDING, top_inset: int = 2) -> StyleBoxTexture:
	return style_from_atlas(build_atlas(surface, border, inner_line, top_inset), padding)

static func apply_to(panel: PanelContainer, style: StyleBoxTexture) -> void:
	panel.custom_minimum_size = panel.custom_minimum_size.max(MIN_FRAME_SIZE)
	panel.add_theme_stylebox_override("panel", style)
