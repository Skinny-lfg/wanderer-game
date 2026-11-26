extends RefCounted
## G2.4B.7A: opt-in presentation adapter. Originals and G2.2 gallery remain unchanged.
const ROOT = "res://ui/assets/ui_kit_v2/"
const RARITIES = ["grey", "common", "uncommon", "rare", "epic", "legendary"]
const NAV = {"camp":"camp", "inventory":"inventory", "talents":"talents", "city":"city_center", "shrine":"shrine", "expedition":"expedition", "codex":"codex"}
const STATS = {"Attack":"attack", "Defense":"defense", "Health":"health", "Hits / sec":"attack_speed", "Critical chance":"critical_chance", "Guard":"guard", "Strength":"strength", "Agility":"agility", "Intellect":"intellect", "Endurance":"endurance", "Charisma":"charisma", "Evasion rating":"evasion", "Evasion vs E10":"evasion", "Mana":"mana", "Mana Regen":"mana_regen", "Spell Power":"spell_power", "Barrier Power":"barrier_power", "Healing Power":"healing_power", "Mana Cost Reduction":"mana_cost_reduction", "Bonus Crit Damage":"critical_damage", "DoT Damage Bonus":"dot_power"}
const REAGENTS = ["bloodstone", "blight_husk", "dawnshard", "abyssal_pearl", "ironheart", "aether_crystal"]
const REAGENT_NAMES = ["Bloodstone", "Blight Husk", "Dawnshard", "Abyssal Pearl", "Ironheart", "Aether Crystal"]
static var textures: Dictionary = {}
static var small_textures: Dictionary = {}
static var tooltip_styles: Dictionary = {}
static var alpha_bounds: Dictionary = {}

static func texture(key: String) -> Texture2D:
	if not textures.has(key):
		textures[key] = load(ROOT + key + ".png") as Texture2D
	return textures[key]

static func icon(key: String, side: int = 24) -> Texture2D:
	var cache_key: String = key + ":" + str(side)
	if not small_textures.has(cache_key):
		var source: Image = texture(key).get_image()
		if source.is_compressed():
			source.decompress()
		source.resize(side, side, Image.INTERPOLATE_LANCZOS)
		small_textures[cache_key] = ImageTexture.create_from_image(source)
	return small_textures[cache_key]

static func place_icon(host: Node, key: String, at: Vector2, side: int) -> TextureRect:
	var node = TextureRect.new()
	node.name = "V2Icon_" + key.get_file()
	node.texture = icon(key, side)
	node.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	node.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(node)
	node.position = at
	node.size = Vector2.ONE * side
	return node

static func bounds(key: String) -> Rect2i:
	if not alpha_bounds.has(key):
		alpha_bounds[key] = texture(key).get_image().get_used_rect()
	return alpha_bounds[key]

static func patch(tex: Texture2D, horizontal: int, vertical: int, pad_x: int, pad_y: int) -> StyleBoxTexture:
	var box = StyleBoxTexture.new()
	box.texture = tex
	for side in [SIDE_LEFT, SIDE_RIGHT]:
		box.set_texture_margin(side, horizontal)
		box.set_content_margin(side, pad_x)
	for side in [SIDE_TOP, SIDE_BOTTOM]:
		box.set_texture_margin(side, vertical)
		box.set_content_margin(side, pad_y)
	return box

static func button_style(key: String, pad_x: int = 8, pad_y: int = 3) -> StyleBoxTexture:
	return patch(texture(key), 24, 12, pad_x, pad_y)

static func apply_button(button: Button, family: String, navigation: bool = false) -> void:
	var prefix: String = "navigation/nav_" if navigation else "buttons/" + family + "_"
	for state in ["normal", "hover", "pressed", "disabled"]:
		var art_state: String = "selected" if navigation and state == "pressed" else state
		button.add_theme_stylebox_override(state, button_style(prefix + art_state))
	button.add_theme_stylebox_override("hover_pressed", button_style(prefix + ("pressed" if navigation else "pressed")))
	button.add_theme_stylebox_override("focus", button_style("buttons/focus_overlay", 0, 0))
	button.add_theme_color_override("font_disabled_color", Color("817c75"))
	if family == "primary" and not navigation:
		# Draw fixed-size crest overlays without changing native hit boxes or layout.
		button.draw.connect(func():
			if button.size.x < 200.0:
				return
			var state: String = "normal"
			match button.get_draw_mode():
				BaseButton.DRAW_HOVER: state = "hover"
				BaseButton.DRAW_PRESSED, BaseButton.DRAW_HOVER_PRESSED: state = "pressed"
				BaseButton.DRAW_DISABLED: state = "disabled"
			var x: float = (button.size.x - 32.0) * 0.5
			button.draw_texture_rect(texture("buttons/primary_crest_top_" + state), Rect2(x, 0, 32, 12), false)
			button.draw_texture_rect(texture("buttons/primary_crest_bottom_" + state), Rect2(x, button.size.y - 12, 32, 12), false)
		)

static func panel_style() -> StyleBoxTexture:
	var box = patch(texture("materials/surface_charcoal"), 0, 0, 8, 8)
	box.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	box.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	box.modulate_color = Color(0.65, 0.65, 0.65, 0.88)
	return box

static func tooltip_style(rarity: int) -> StyleBoxTexture:
	var index: int = clampi(rarity, 0, 5)
	if not tooltip_styles.has(index):
		# Compose the separate surface inside each frame, retaining transparent chamfer corners.
		var frame: Image = texture("frames/tooltip/tooltip_frame_" + RARITIES[index]).get_image()
		var surface: Image = texture("materials/surface_charcoal").get_image()
		if frame.is_compressed():
			frame.decompress()
		if surface.is_compressed():
			surface.decompress()
		frame.convert(Image.FORMAT_RGBA8)
		surface.convert(Image.FORMAT_RGBA8)
		surface.resize(256, 256, Image.INTERPOLATE_LANCZOS)
		var merged: Image = Image.create(256, 256, false, Image.FORMAT_RGBA8)
		merged.fill(Color.TRANSPARENT)
		for y in range(256):
			var left: int = 256
			var right: int = -1
			for x in range(256):
				if frame.get_pixel(x, y).a >= 0.5:
					left = mini(left, x)
					right = maxi(right, x)
			for x in range(left, right + 1):
				var color: Color = surface.get_pixel(x, y).darkened(0.35)
				color.a = 1.0
				merged.set_pixel(x, y, color)
		merged.blend_rect(frame, Rect2i(0, 0, 256, 256), Vector2i.ZERO)
		merged.resize(64, 64, Image.INTERPOLATE_LANCZOS)
		tooltip_styles[index] = patch(ImageTexture.create_from_image(merged), 12, 12, 16, 15)
	return tooltip_styles[index]
