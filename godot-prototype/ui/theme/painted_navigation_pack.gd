extends RefCounted
const ART_DIR = "res://ui/assets/navigation/g22c"
const STATES = ["normal", "hover", "active", "pressed", "disabled"]
const IDS = ["camp", "inventory", "talents", "city", "shrine"]
const LABELS = ["Camp", "Inventory", "Talents", "City Center", "Shrine"]
var textures: Dictionary = {}
var problem: String = ""

func expected_sizes() -> Dictionary:
	var sizes: Dictionary = {"rail_ornament": Vector2i(327, 60)}
	for state in STATES:
		sizes["tab_" + state] = Vector2i(300, 76)
	for id in IDS:
		sizes["icon_" + id] = Vector2i(64, 64)
	return sizes

func load_pack(directory: String = ART_DIR) -> bool:
	textures.clear()
	problem = ""
	var pending: Dictionary = {}
	var sizes = expected_sizes()
	for name in sizes:
		var path = directory.path_join(name + ".png")
		if not FileAccess.file_exists(path):
			problem = "Missing " + name + ".png"
			return false
		var img = Image.new()
		if img.load(ProjectSettings.globalize_path(path)) != OK or img.get_size() != sizes[name]:
			problem = "Invalid navigation texture: " + name
			return false
		img.convert(Image.FORMAT_RGBA8)
		if name.begins_with("tab_"):
			img.resize(180, 46, Image.INTERPOLATE_LANCZOS)
		elif name.begins_with("icon_"):
			img.resize(30, 30, Image.INTERPOLATE_LANCZOS)
		pending[name] = ImageTexture.create_from_image(img)
	textures = pending
	return true

func is_ready() -> bool:
	return textures.size() == 11

func style_for(state: String) -> StyleBoxTexture:
	var box = StyleBoxTexture.new()
	box.texture = textures["tab_" + state]
	# Fixed aspect sample at 180x46. Margins protect edge shapes for small width changes.
	box.texture_margin_left = 25
	box.texture_margin_right = 25
	box.texture_margin_top = 8
	box.texture_margin_bottom = 8
	box.content_margin_left = 20
	box.content_margin_right = 20
	box.content_margin_top = 5
	box.content_margin_bottom = 5
	return box

func apply_to(button: Button, id: String, compact: bool = false) -> bool:
	if not is_ready() or not IDS.has(id):
		return false
	button.custom_minimum_size = Vector2(90 if compact else 180, 46)
	button.icon = textures["icon_" + id]
	button.text = "" if compact else LABELS[IDS.find(id)]
	button.tooltip_text = LABELS[IDS.find(id)]
	button.add_theme_constant_override("h_separation", 7)
	button.add_theme_color_override("font_color", Color("#e7dfce"))
	button.add_theme_color_override("font_pressed_color", Color("#f7dca3"))
	button.add_theme_color_override("font_hover_color", Color("#fff1ce"))
	button.add_theme_color_override("font_disabled_color", Color("#817e77"))
	for state in ["normal", "hover", "disabled"]:
		button.add_theme_stylebox_override(state, style_for(state))
	button.add_theme_stylebox_override("pressed", style_for("active"))
	button.add_theme_stylebox_override("hover_pressed", style_for("active"))
	var focus = StyleBoxFlat.new()
	focus.bg_color = Color(0, 0, 0, 0)
	focus.border_color = Color("#ebcc90")
	focus.set_border_width_all(1)
	button.add_theme_stylebox_override("focus", focus)
	button.button_down.connect(func():
		button.add_theme_stylebox_override("pressed", style_for("pressed"))
		button.add_theme_stylebox_override("hover_pressed", style_for("pressed"))
	)
	button.button_up.connect(func():
		button.add_theme_stylebox_override("pressed", style_for("active"))
		button.add_theme_stylebox_override("hover_pressed", style_for("active"))
	)
	return true
