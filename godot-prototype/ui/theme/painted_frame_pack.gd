extends RefCounted
const Normalize = preload("res://ui/theme/asset_normalization.gd")
const Modular = preload("res://ui/theme/modular_frame.gd")
const CORNERS = {
	"standard": Vector2i(36, 32), "featured": Vector2i(45, 42),
	"modal": Vector2i(46, 36), "tooltip": Vector2i(30, 27),
	"compact": Vector2i(30, 27), "focused": Vector2i(32, 28), "disabled": Vector2i(32, 28)
}
const SAMPLE = Vector2i(20, 12)
var modular_textures: Dictionary = {}
var rarity_tooltip_textures: Dictionary = {}
var simple_tooltip_textures: Dictionary = {}
const SimpleFrame = preload("res://ui/theme/simple_frame.gd")
const Tokens = preload("res://ui/theme/tokens.gd")
## G2.2B art candidate: resizable frame bodies and separately anchored ornaments.
const ART_DIR = "res://ui/assets/frames/g22b"
const SIZES = {
	"standard": Vector2i(354, 183), "featured": Vector2i(363, 180),
	"modal": Vector2i(395, 181), "tooltip": Vector2i(274, 84),
	"compact": Vector2i(228, 94), "focused": Vector2i(265, 101),
	"disabled": Vector2i(264, 99), "banner": Vector2i(584, 115),
	"portrait": Vector2i(228, 263), "crest": Vector2i(97, 54),
	"modal_crest": Vector2i(141, 62), "divider_horizontal": Vector2i(366, 45),
	"divider_vertical": Vector2i(45, 366), "section_ornament": Vector2i(327, 60)
}
const MARGINS = {
	"standard": Vector4(24, 24, 24, 24), "featured": Vector4(25, 22, 25, 22),
	"modal": Vector4(35, 24, 35, 24), "tooltip": Vector4(22, 19, 22, 19),
	"compact": Vector4(22, 20, 22, 20), "focused": Vector4(23, 20, 23, 20),
	"disabled": Vector4(23, 20, 23, 20)
}
var textures: Dictionary = {}
var problem: String = ""

func load_pack(directory: String = ART_DIR) -> bool:
	textures.clear()
	modular_textures.clear()
	rarity_tooltip_textures.clear()
	simple_tooltip_textures.clear()
	problem = ""
	var pending: Dictionary = {}
	for name in SIZES:
		var path = directory.path_join(name + ".png")
		if not FileAccess.file_exists(path):
			problem = "Missing " + name + ".png"
			return false
		var image = Image.new()
		if image.load(ProjectSettings.globalize_path(path)) != OK or image.get_size() != SIZES[name]:
			problem = "Invalid frame texture: " + name
			return false
		image.convert(Image.FORMAT_RGBA8)
		if name == "tooltip":
			image = Normalize.padded(image, 3)
		pending[name] = ImageTexture.create_from_image(image)
	for key in CORNERS:
		var atlas = Modular.build_panel(pending[key], CORNERS[key], SAMPLE)
		if atlas == null:
			problem = "Invalid modular frame: " + key
			modular_textures.clear()
			return false
		modular_textures[key] = atlas
	textures = pending
	return true

func is_ready() -> bool:
	return textures.size() == SIZES.size() and modular_textures.size() == CORNERS.size()

func style_for(name: String, legacy: bool = false) -> StyleBoxTexture:
	if not is_ready() or not MARGINS.has(name):
		return null
	if not legacy:
		var corner: Vector2i = CORNERS[name]
		# Content must stay inside the fixed corner region, including long tooltips.
		return Modular.style(modular_textures[name], corner, Vector4(corner.x, corner.y, corner.x, corner.y))
	var margin: Vector4 = MARGINS[name]
	if name == "tooltip":
		margin += Vector4(3, 3, 3, 3)
	var style = StyleBoxTexture.new()
	style.texture = textures[name]
	style.texture_margin_left = margin.x
	style.texture_margin_top = margin.y
	style.texture_margin_right = margin.z
	style.texture_margin_bottom = margin.w
	style.content_margin_left = margin.x
	style.content_margin_right = margin.z
	style.content_margin_top = margin.y
	style.content_margin_bottom = margin.w
	return style

func apply_to(panel: PanelContainer, name: String) -> bool:
	var style = style_for(name)
	if style == null:
		return false
	panel.add_theme_stylebox_override("panel", style)
	return true

# The rarity tint is applied only to the central surface and its existing
# continuous inner blends, not by modulating the metal frame or text.
static func rarity_surface(rarity: int) -> Color:
	return Color("#151619").lerp(Tokens.RARITY_COLORS[clampi(rarity, 0, 5)], 0.17 if rarity < 2 else 0.20)

func tooltip_style(rarity: int, simple: bool = true) -> StyleBoxTexture:
	if not is_ready():
		return null
	var index = clampi(rarity, 0, 5)
	if simple:
		if not simple_tooltip_textures.has(index):
			simple_tooltip_textures[index] = _simple_tooltip_atlas(index)
		return SimpleFrame.style_from_atlas(simple_tooltip_textures[index])
	if not rarity_tooltip_textures.has(index):
		rarity_tooltip_textures[index] = Modular.build_panel(textures["tooltip"], CORNERS["tooltip"], SAMPLE, rarity_surface(index))
	return Modular.style(rarity_tooltip_textures[index], CORNERS["tooltip"], Vector4(22, 20, 22, 20))

# A clean, purpose-built nine-slice: thin chamfered bronze outline, uniform
# interior, no bevel shading or shadow. The Legendary top has room for its crest.
static func simple_rarity_surface(rarity: int) -> Color:
	var index = clampi(rarity, 0, 5)
	return Color("#111217").lerp(Tokens.RARITY_COLORS[index], 0.045 if index < 2 else 0.08)

static func _simple_tooltip_atlas(rarity: int) -> Texture2D:
	var atlas = SimpleFrame.png_atlas("rarity_" + str(rarity))
	if atlas != null:
		return atlas
	var border = Color("#786751") if rarity != 5 else Color("#b08a50")
	var inner_line = Color("#3c342b") if rarity != 5 else Color("#594529")
	return SimpleFrame.build_atlas(simple_rarity_surface(rarity), border, inner_line, 10 if rarity == 5 else 2)
