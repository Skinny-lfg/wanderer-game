extends RefCounted
const Normalize = preload("res://ui/theme/asset_normalization.gd")
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
	textures = pending
	return true

func is_ready() -> bool:
	return textures.size() == SIZES.size()

func style_for(name: String) -> StyleBoxTexture:
	if not is_ready() or not MARGINS.has(name):
		return null
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
