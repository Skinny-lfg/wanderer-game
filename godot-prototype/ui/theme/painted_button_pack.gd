extends RefCounted
const Modular = preload("res://ui/theme/modular_frame.gd")
const CORNER = Vector2i(48, 16)
const SAMPLE = Vector2i(24, 8)
var modular_textures: Dictionary = {}
## G2.2A local artwork candidate. No game state or scene theme mutation.
const ART_DIR = "res://ui/assets/buttons/g22a"
const VARIANTS = ["primary", "secondary", "danger", "ghost"]
const STATES = ["normal", "hover", "pressed", "disabled"]
const SOURCE_SIZE = Vector2i(371, 76)
const LOGICAL_SIZE = Vector2i(264, 54)
var textures: Dictionary = {}
var problem: String = ""

func load_pack(directory: String = ART_DIR) -> bool:
	textures.clear()
	modular_textures.clear()
	problem = ""
	var pending: Dictionary = {}
	for variant in VARIANTS:
		for state in STATES:
			var name = variant + "_" + state
			var path = directory.path_join(name + ".png")
			if not FileAccess.file_exists(path):
				problem = "Missing " + name + ".png"
				return false
			var image = Image.new()
			if image.load(ProjectSettings.globalize_path(path)) != OK or image.get_size() != SOURCE_SIZE:
				problem = "Invalid texture: " + name
				return false
			image.convert(Image.FORMAT_RGBA8)
			# Retain full-resolution originals on disk; use a proportional logical texture
			# so the corner geometry is not squashed at the recommended button height.
			image.resize(LOGICAL_SIZE.x, LOGICAL_SIZE.y, Image.INTERPOLATE_LANCZOS)
			pending[name] = ImageTexture.create_from_image(image)
	for key in pending:
		var atlas = Modular.build(pending[key], CORNER, SAMPLE)
		if atlas == null:
			problem = "Invalid modular button: " + key
			modular_textures.clear()
			return false
		modular_textures[key] = atlas
	textures = pending
	return true

func is_ready() -> bool:
	return textures.size() == 16 and modular_textures.size() == 16

func style_for(variant: String, state: String, legacy: bool = false) -> StyleBoxTexture:
	if not legacy:
		return Modular.style(modular_textures[variant + "_" + state], CORNER, Vector4(39, 8, 39, 8))
	var box = StyleBoxTexture.new()
	box.texture = textures[variant + "_" + state]
	box.texture_margin_left = 42
	box.texture_margin_right = 42
	box.texture_margin_top = 11
	box.texture_margin_bottom = 11
	box.content_margin_left = 39
	box.content_margin_right = 39
	box.content_margin_top = 8
	box.content_margin_bottom = 8
	return box

func apply_to(button: Button, variant: String) -> bool:
	if not is_ready() or not VARIANTS.has(variant):
		return false
	for state in STATES:
		button.add_theme_stylebox_override(state, style_for(variant, state))
	button.add_theme_stylebox_override("hover_pressed", style_for(variant, "pressed"))
	# Preserve the old focus indicator until a painted focus texture is designed.
	var focus = StyleBoxFlat.new()
	focus.bg_color = Color(0, 0, 0, 0)
	focus.border_color = Color("#e8ce92")
	focus.set_border_width_all(1)
	focus.set_expand_margin_all(2)
	button.add_theme_stylebox_override("focus", focus)
	button.custom_minimum_size.y = 54
	button.add_theme_color_override("font_color", Color("#eadbc0"))
	button.add_theme_color_override("font_hover_color", Color("#fff1cd"))
	button.add_theme_color_override("font_pressed_color", Color("#eadbc0"))
	button.add_theme_color_override("font_disabled_color", Color("#77736c"))
	return true
