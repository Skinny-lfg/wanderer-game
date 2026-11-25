extends Control
## G2.3A integrated art preview. All labels, items and stats are illustrative.
@export var screen_id: String = "camp"

const GOLD = Color("d0ad72")
const IVORY = Color("e7dfce")
const MUTED = Color("a69f94")
const DARK = Color("101217")
const CAMP = preload("res://assets/shell/camp.webp")
const REALMS = preload("res://assets/shell/realms.webp")
const HERO = preload("res://assets/arena/wanderer.webp")
const ITEMS = [
	preload("res://assets/shell/helmet.png"),
	preload("res://assets/shell/chest.png"),
	preload("res://assets/shell/gloves.png"),
	preload("res://assets/shell/boots.png"),
	preload("res://assets/shell/shield.png"),
	preload("res://assets/shell/dagger.png"),
	preload("res://assets/shell/ring.png"),
	preload("res://assets/shell/charm.png")
]
const AFFINITIES = ["Blood", "Decay", "Vitality", "Aegis", "Fury", "Magic"]
const AFFINITY_COLORS = ["ae5158", "929455", "70ad7a", "8aa9c5", "d39154", "9b81c3"]
const GameKit = preload("res://ui/theme/game_ui_kit.gd")
const SimpleFrame = preload("res://ui/theme/simple_frame.gd")
var kit: RefCounted
var serif: Font
var inventory_slots: Array[Button] = []
var equipped_slots: Array[Button] = []
var potion_slots: Array[Button] = []
var stash_slots: Array[Button] = []
var stash_items: Array[Dictionary] = []
var stash_grid: Control
var collection_host: Control
var collection_surface: Panel
var stats_toggle: Button
var inventory_tabs: Array[Button] = []
var stash_filter: OptionButton
var stash_filter_toggle: Button
var stash_filter_panel: Control
var stash_sort: OptionButton
var stash_order: OptionButton
var stash_controls: Array[Control] = []
var stash_count: Label
var stash_multi: Button
var selection_caption: Label
var salvage_button: Button
var collection_index: int = 0
var selected_preview: Dictionary = {}
var advanced_group: Control
var basic_group: Control
const EQUIPMENT_LABELS = ["Helm", "Armor", "Gloves", "Belt", "Boots", "Amulet", "Weapon", "Off-Hand", "Ring I", "Ring II"]
const EQUIPMENT_ART = [0, 1, 2, 8, 3, 7, 5, 4, 6, 6]
const INVENTORY_BELT = preload("res://assets/shell/inventory/belt.webp")
const POTION_ART = [preload("res://assets/shell/inventory/potion_health.webp"), preload("res://assets/shell/inventory/potion_mana.webp"), preload("res://assets/shell/inventory/potion_barrier.webp")]
const POTION_NAMES = ["Health Potion", "Mana Potion", "Barrier Potion"]
const TREASURE_ART = [preload("res://assets/shell/inventory/treasure_chalice.webp"), preload("res://assets/shell/inventory/treasure_pouch.webp")]
const RUNE_ART = [preload("res://assets/shell/inventory/rune_might.png"), preload("res://assets/shell/inventory/rune_warding.png"), preload("res://assets/shell/inventory/rune_wisdom.png")]
const ITEM_NAMES = ["Iron Helm", "Iron Chestplate", "Leather Gloves", "Travel Boots", "Iron Shield", "Forgotten Blade", "Iron Ring", "Oathbound Relic"]
const ITEM_TYPES = ["Head", "Chest", "Hands", "Feet", "Shield", "Dagger", "Ring", "Amulet"]

func _ready() -> void:
	if kit == null:
		kit = GameKit.new()
	theme = kit.theme
	serif = kit.heading_font
	match screen_id:
		"camp": _camp()
		"inventory": _inventory()
		"talents": _talents()
		"expedition": _expedition()
		"codex": _codex()
		"city": _city()
		"shrine": _shrine()

func _rect(pos: Vector2, extent: Vector2, color: Color) -> ColorRect:
	var node = ColorRect.new()
	node.position = pos
	node.size = extent
	node.color = color
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node)
	return node

func _text(value: String, pos: Vector2, extent: Vector2, font_size: int, color: Color = IVORY, heading: bool = false, centered: bool = false) -> Label:
	var node = Label.new()
	node.text = value
	node.position = pos
	node.size = extent
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	node.add_theme_color_override("font_color", color)
	node.add_theme_font_size_override("font_size", font_size)
	if heading:
		node.add_theme_font_override("font", serif)
	if centered:
		node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(node)
	return node

func _art(texture: Texture2D, pos: Vector2, extent: Vector2, cover: bool = false) -> TextureRect:
	var node = TextureRect.new()
	node.texture = texture
	node.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	node.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED if cover else TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	node.position = pos
	node.size = extent
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node)
	return node

func _line(a: Vector2, b: Vector2, color: Color, width: float = 1.0) -> void:
	var node = Line2D.new()
	node.points = PackedVector2Array([a, b])
	node.width = width
	node.default_color = color
	node.antialiased = true
	add_child(node)

func _panel(pos: Vector2, extent: Vector2, color: Color = Color("17191e"), edge: Color = Color("4a4033")) -> Panel:
	var node = Panel.new()
	var style = StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = edge
	style.set_border_width_all(1)
	node.add_theme_stylebox_override("panel", style)
	node.position = pos
	node.size = extent
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node)
	return node

func _background(texture: Texture2D, shade: float) -> void:
	_rect(Vector2.ZERO, Vector2(1280, 720), DARK)
	_art(texture, Vector2.ZERO, Vector2(1280, 648), true)
	_rect(Vector2.ZERO, Vector2(1280, 648), Color(0.025, 0.03, 0.045, shade))

# Shared quiet composition for the remaining prototype screens.
# Inventory keeps its approved independent layout.
func _scene_fade(at: Vector2, extent: Vector2, from: Vector2, to: Vector2, start: Color, finish: Color) -> void:
	var gradient = Gradient.new()
	gradient.colors = PackedColorArray([start, finish])
	var texture = GradientTexture2D.new()
	texture.gradient = gradient
	texture.fill = GradientTexture2D.FILL_LINEAR
	texture.fill_from = from
	texture.fill_to = to
	texture.width = maxi(1, roundi(extent.x))
	texture.height = maxi(1, roundi(extent.y))
	_art(texture, at, extent, true)

func _cinematic_scene(texture: Texture2D, shade: float, dark_left: bool = false) -> void:
	_background(texture, shade)
	var clear = Color(0.025, 0.028, 0.035, 0.0)
	var dark = Color(0.025, 0.028, 0.035, 0.94)
	_scene_fade(Vector2.ZERO, Vector2(1280, 648), Vector2(0.5, 0.08), Vector2(0.5, 0.68), dark, clear)
	_scene_fade(Vector2.ZERO, Vector2(1280, 648), Vector2(0.5, 0.64), Vector2(0.5, 1.0), clear, dark)
	if dark_left:
		_scene_fade(Vector2.ZERO, Vector2(1280, 648), Vector2(0.08, 0.5), Vector2(0.60, 0.5), dark, clear)

func _scene_heading(title: String, subtitle: String = "") -> void:
	_text(title, Vector2(70, 22), Vector2(1140, 48), 34, IVORY, true)
	if not subtitle.is_empty():
		_text(subtitle, Vector2(72, 66), Vector2(1138, 19), 12, MUTED)
	_line(Vector2(70, 94), Vector2(1210, 94), Color(0.57, 0.48, 0.34, 0.30))

func _scene_footer(value: String) -> void:
	_text(value, Vector2(70, 616), Vector2(1140, 20), 12, MUTED)

func _camp() -> void:
	_cinematic_scene(CAMP, 0.32, true)
	_scene_heading("The Camp", "Wanderer · Level 24")
	# A single character, not a portrait repeated beside the illustration.
	_art(HERO, Vector2(690, 112), Vector2(435, 498))
	_text("The Wanderer", Vector2(86, 175), Vector2(460, 45), 29, IVORY, true)
	var hud = Control.new()
	hud.name = "ResourceHUD"
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hud)
	hud.position = Vector2(88, 240)
	hud.size = Vector2(420, 145)
	for i in range(3):
		var kind: String = ["Health", "Mana", "Barrier"][i]
		_inventory_label(hud, kind, Vector2(0, i * 36), Vector2(78, 23), 13, MUTED)
		var bar = kit.resource(hud, kind, Vector2(82, i * 36), Vector2(320, 22), [2400, 520, 180][i], [2840, 600, 300][i])
		if kind == "Barrier":
			bar.hide_empty = true
	_inventory_label(hud, "Experience", Vector2(0, 110), Vector2(78, 20), 12, MUTED)
	kit.resource(hud, "EXP", Vector2(84, 115), Vector2(314, 8), 420, 1000, false)
	_line(Vector2(88, 411), Vector2(490, 411), Color(0.57, 0.48, 0.34, 0.27))
	_text("Prepare for the next expedition", Vector2(88, 431), Vector2(480, 37), 24, IVORY, true)
	_text("Visit the city, prepare equipment and bind runes.", Vector2(90, 478), Vector2(490, 24), 14, MUTED)
	_scene_footer("Visual preview · sample character values")

func _slot(pos: Vector2, size_px: float, item_index: int = -1, equipped: bool = false, rarity: int = 1) -> Button:
	var art: Texture2D = ITEMS[item_index] if item_index >= 0 else null
	var item_name: String = ITEM_NAMES[item_index] if item_index >= 0 else ""
	var category: String = ITEM_TYPES[item_index] if item_index >= 0 else ""
	return kit.slot(self, pos, size_px, art, rarity, equipped, item_name, category)

# G2.3B.3: inventory composition; independent visual fixture, not gameplay.
# Quiet controls: no repeated bevels, no heavy button frame.
func _quiet_control_style(active: bool = false, disabled: bool = false) -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.075, 0.085, 0.6 if active else 0.22)
	style.border_color = Color("9d8054") if active else Color(0.40, 0.39, 0.36, 0.25 if disabled else 0.55)
	style.set_border_width_all(1)
	style.set_corner_radius_all(2)
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 3
	style.content_margin_bottom = 3
	return style

func _inventory_button(host: Node, value: String, at: Vector2, extent: Vector2, selected: bool = false) -> Button:
	var button = Button.new()
	button.text = value
	button.add_theme_font_size_override("font_size", 13)
	for state in ["normal", "hover", "pressed", "hover_pressed", "disabled"]:
		button.add_theme_stylebox_override(state, _quiet_control_style(state in ["hover", "pressed", "hover_pressed"] or (state == "normal" and selected), state == "disabled"))
	host.add_child(button)
	button.position = at
	button.size = extent
	return button

func _inventory_option(host: Node, values: Array, at: Vector2, extent: Vector2) -> OptionButton:
	var option = OptionButton.new()
	option.add_theme_font_size_override("font_size", 13)
	option.fit_to_longest_item = false
	option.clip_text = true
	for state in ["normal", "hover", "pressed", "disabled"]:
		option.add_theme_stylebox_override(state, _quiet_control_style(state in ["hover", "pressed"], state == "disabled"))
	for value in values:
		option.add_item(str(value))
	host.add_child(option)
	option.position = at
	option.size = extent
	return option

func _inventory_label(host: Node, value: String, at: Vector2, extent: Vector2, pixels: int = 13, tint: Color = IVORY) -> Label:
	var label = Label.new()
	label.text = value
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_size_override("font_size", pixels)
	label.add_theme_color_override("font_color", tint)
	host.add_child(label)
	label.position = at
	label.size = extent
	return label

func _inventory_stat(host: Node, label: String, amount: String, y: float, tint: Color = IVORY) -> void:
	_inventory_label(host, label, Vector2(0, y), Vector2(155, 20), 13, MUTED)
	var number = _inventory_label(host, amount, Vector2(147, y), Vector2(72, 20), 14, tint)
	number.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

func _inventory_art(index: int) -> Texture2D:
	return INVENTORY_BELT if index == 8 else ITEMS[index]

func _inventory_item_name(index: int) -> String:
	return "Ironbound Belt" if index == 8 else str(ITEM_NAMES[index])

func _inventory_tab(host: Node, value: String, at: Vector2, extent: Vector2) -> Button:
	var button = Button.new()
	button.text = value
	button.toggle_mode = true
	button.add_theme_font_size_override("font_size", 18)
	button.add_theme_font_override("font", serif)
	for state in ["normal", "hover", "pressed", "hover_pressed", "focus"]:
		var style = StyleBoxFlat.new()
		style.bg_color = Color(0.06, 0.06, 0.075, 0.0)
		if state != "normal":
			style.border_width_bottom = 2
			style.border_color = GOLD if state in ["pressed", "hover_pressed"] else MUTED
			style.bg_color = Color(0.06, 0.06, 0.075, 0.0)
		button.add_theme_stylebox_override(state, style)
	button.add_theme_color_override("font_color", MUTED)
	button.add_theme_color_override("font_pressed_color", GOLD)
	host.add_child(button)
	button.position = at
	button.size = extent
	return button

func _inventory_tooltip(art: Texture2D, rarity: int, equipped: bool, item_name: String, category: String) -> Control:
	var tooltip = kit.make_tooltip(art, rarity, equipped, item_name, category)
	tooltip.compact_preview = true
	return tooltip

func _inventory_slot(host: Node, at: Vector2, side: float, art: Texture2D = null, rarity: int = 1, equipped: bool = false, item_name: String = "", category: String = "") -> Button:
	var slot = kit.slot(host, at, side, art, rarity, equipped, item_name, category)
	if equipped and art != null:
		slot.tooltip_text = category + " · " + item_name
	if art != null:
		slot.preview_tooltip_factory = _inventory_tooltip.bind(art, rarity, equipped, item_name, category)
	return slot

# Existing camp texture, softened in memory. No new artwork or shader dependency.
func _inventory_background() -> void:
	_rect(Vector2.ZERO, Vector2(1280, 720), Color("0b0d10"))
	var image: Image = CAMP.get_image()
	if image != null and not image.is_empty():
		if image.is_compressed():
			image.decompress()
		if not image.is_compressed():
			var aspect: float = float(image.get_height()) / float(image.get_width())
			image.resize(160, maxi(1, roundi(160.0 * aspect)), Image.INTERPOLATE_LANCZOS)
			image.adjust_bcs(1.0, 1.0, 0.48)
			image.resize(1280, maxi(1, roundi(1280.0 * aspect)), Image.INTERPOLATE_CUBIC)
			var background = _art(ImageTexture.create_from_image(image), Vector2.ZERO, Vector2(1280, 648), true)
			background.modulate = Color(0.46, 0.46, 0.46)
	_rect(Vector2.ZERO, Vector2(1280, 648), Color(0.025, 0.028, 0.035, 0.54))
	var vignette = GradientTexture2D.new()
	var fade = Gradient.new()
	fade.colors = PackedColorArray([Color(0.025, 0.028, 0.035, 0.0), Color(0.025, 0.028, 0.035, 0.94)])
	vignette.gradient = fade
	vignette.fill = GradientTexture2D.FILL_LINEAR
	vignette.fill_from = Vector2(0.26, 0.5)
	vignette.fill_to = Vector2(0.88, 0.5)
	vignette.width = 1280
	vignette.height = 648
	_art(vignette, Vector2.ZERO, Vector2(1280, 648), true)
	var bottom = GradientTexture2D.new()
	var bottom_fade = Gradient.new()
	bottom_fade.colors = PackedColorArray([Color(0.025, 0.028, 0.035, 0.0), Color(0.025, 0.028, 0.035, 0.94)])
	bottom.gradient = bottom_fade
	bottom.fill_from = Vector2(0.5, 0.57)
	bottom.fill_to = Vector2(0.5, 1.0)
	bottom.width = 1280
	bottom.height = 648
	_art(bottom, Vector2.ZERO, Vector2(1280, 648), true)

func _inventory_resource(value: String, name_text: String, at: Vector2, tint: Color) -> void:
	# Small geometric markers, not new artwork; all four resource labels remain.
	var marker = ColorRect.new()
	marker.color = tint
	marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	marker.position = at + Vector2(3, 9)
	marker.size = Vector2(8, 8)
	marker.pivot_offset = Vector2(4, 4)
	marker.rotation_degrees = 45
	add_child(marker)
	_text(value, at + Vector2(17, 0), Vector2(110, 26), 16, IVORY, true)
	_text(name_text, at + Vector2(17, 25), Vector2(110, 17), 10, MUTED)

func _inventory() -> void:
	_inventory_background()
	_text("I N V E N T O R Y", Vector2(70, 19), Vector2(485, 42), 31, IVORY, true)
	_text("W A N D E R E R   ·   LEVEL 24", Vector2(72, 61), Vector2(430, 20), 12, MUTED)
	_inventory_resource("12,480", "Gold", Vector2(760, 24), GOLD)
	_inventory_resource("620", "Fragments", Vector2(875, 24), Color("8aafcd"))
	_inventory_resource("34", "Essence", Vector2(990, 24), Color("a58ac0"))
	_inventory_resource("18", "Reagents", Vector2(1105, 24), Color("8eaa81"))
	_line(Vector2(70, 88), Vector2(1210, 88), Color(0.57, 0.48, 0.34, 0.30))
	# Character remains the focus, with no labels competing below occupied slots.
	var shadow = GradientTexture2D.new()
	var gradient = Gradient.new()
	gradient.colors = PackedColorArray([Color(0, 0, 0, 0.72), Color(0, 0, 0, 0)])
	shadow.gradient = gradient
	shadow.fill = GradientTexture2D.FILL_RADIAL
	shadow.fill_from = Vector2(0.5, 0.5)
	shadow.fill_to = Vector2(1, 0.5)
	shadow.width = 256
	shadow.height = 64
	_art(shadow, Vector2(183, 465), Vector2(260, 42), true)
	_art(HERO, Vector2(104, 90), Vector2(420, 410))
	for i in range(10):
		var x: float = 115.0 if i < 5 else 460.0
		var y: float = 125.0 + float(i % 5) * 72.0
		var art_index: int = EQUIPMENT_ART[i]
		var rarity: int = [1, 3, 2, 1, 3, 4, 3, 2, 3, 2][i]
		var equipment_slot = _inventory_slot(self, Vector2(x, y), 61, _inventory_art(art_index), rarity, true, _inventory_item_name(art_index), EQUIPMENT_LABELS[i])
		equipment_slot.name = "Equipment_" + str(i)
		equipped_slots.append(equipment_slot)
	var power_row = HBoxContainer.new()
	power_row.name = "GearPowerGroup"
	power_row.alignment = BoxContainer.ALIGNMENT_CENTER
	power_row.add_theme_constant_override("separation", 14)
	power_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(power_row)
	power_row.position = Vector2(115, 497)
	power_row.size = Vector2(406, 32)
	var power_title = Label.new()
	power_title.text = "G E A R   P O W E R"
	power_title.add_theme_font_override("font", serif)
	power_title.add_theme_font_size_override("font_size", 12)
	power_title.add_theme_color_override("font_color", MUTED)
	power_row.add_child(power_title)
	var power_value = Label.new()
	power_value.text = "3,860"
	power_value.add_theme_font_override("font", serif)
	power_value.add_theme_font_size_override("font_size", 26)
	power_value.add_theme_color_override("font_color", GOLD)
	power_row.add_child(power_value)
	_line(Vector2(115, 533), Vector2(521, 533), Color(0.57, 0.48, 0.34, 0.35))
	basic_group = Control.new()
	basic_group.name = "CoreStats"
	add_child(basic_group)
	basic_group.position = Vector2(91, 539)
	basic_group.size = Vector2(456, 57)
	basic_group.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var basic = [["Attack", "420"], ["Defense", "376"], ["Health", "2,840"], ["Hits / sec", "1.42"], ["Critical chance", "18.5%"], ["Guard", "24%"]]
	# Three aligned groups: primary value above, secondary stat below.
	for i in range(3):
		var x: float = float(i) * 152.0
		var title = _inventory_label(basic_group, basic[i][0], Vector2(x, 0), Vector2(152, 15), 11, MUTED)
		title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		var amount = _inventory_label(basic_group, basic[i][1], Vector2(x, 16), Vector2(152, 24), 19, IVORY)
		amount.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		var secondary = _inventory_label(basic_group, str(basic[i + 3][0]) + "  " + str(basic[i + 3][1]), Vector2(x, 42), Vector2(152, 16), 11, MUTED)
		secondary.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_text("Potions", Vector2(115, 611), Vector2(67, 23), 12, MUTED)
	for i in range(3):
		var art: Texture2D = POTION_ART[i] if i < 2 else null
		var potion_slot = _inventory_slot(self, Vector2(183 + i * 40, 602), 35, art, 1, i < 2, POTION_NAMES[i], "Potion")
		potion_slot.minimal_inventory = true
		potion_slots.append(potion_slot)
		potion_slot.name = "Potion_" + str(i)
	# Attributes and advanced stats are a temporary overlay, never a third column.
	advanced_group = Control.new()
	advanced_group.name = "DetailsOverlay"
	add_child(advanced_group)
	advanced_group.position = Vector2(52, 111)
	advanced_group.size = Vector2(555, 427)
	advanced_group.mouse_filter = Control.MOUSE_FILTER_STOP
	kit.panel(advanced_group, Vector2.ZERO, advanced_group.size)
	_inventory_label(advanced_group, "Character details", Vector2(22, 14), Vector2(480, 28), 21, GOLD)
	var attributes = [["Strength", "148"], ["Agility", "96"], ["Intellect", "72"], ["Endurance", "134"], ["Charisma", "56"]]
	var attribute_column = Control.new()
	advanced_group.add_child(attribute_column)
	attribute_column.position = Vector2(22, 60)
	attribute_column.size = Vector2(219, 320)
	_inventory_label(attribute_column, "PRIMARY ATTRIBUTES", Vector2.ZERO, Vector2(219, 20), 12, GOLD)
	for i in range(attributes.size()):
		_inventory_stat(attribute_column, attributes[i][0], attributes[i][1], 28 + i * 26)
	_inventory_label(attribute_column, "BONUS SOURCES", Vector2(0, 180), Vector2(219, 20), 12, GOLD)
	_inventory_label(attribute_column, "Base · Equipment · Runes", Vector2(0, 207), Vector2(219, 20), 12, MUTED)
	_inventory_label(attribute_column, "Talents · Temporary effects", Vector2(0, 232), Vector2(219, 20), 12, MUTED)
	_inventory_label(attribute_column, "Gear Power is a stat estimate.", Vector2(0, 290), Vector2(219, 20), 11, MUTED)
	var detail_column = Control.new()
	advanced_group.add_child(detail_column)
	detail_column.position = Vector2(292, 60)
	detail_column.size = Vector2(238, 320)
	_inventory_label(detail_column, "ADVANCED STATS", Vector2.ZERO, Vector2(219, 20), 12, GOLD)
	var advanced = [["Evasion rating", "32"], ["Evasion vs E10", "8.4%"], ["Mana", "600"], ["Mana Regen", "4.2/s"], ["Spell Power", "84"], ["Barrier Power", "+12%"], ["Healing Power", "+5%"], ["Mana Cost Reduction", "8%"], ["Bonus Crit Damage", "+7%"], ["DoT Damage Bonus", "+6%"]]
	for i in range(advanced.size()):
		_inventory_stat(detail_column, advanced[i][0], advanced[i][1], 28 + i * 26)
	advanced_group.hide()
	stats_toggle = _inventory_button(self, "Character details", Vector2(373, 605), Vector2(148, 29))
	stats_toggle.toggle_mode = true
	stats_toggle.toggled.connect(func(on: bool):
		basic_group.visible = not on
		advanced_group.visible = on
		stats_toggle.text = "Close details" if on else "Character details"
	)
	# Stash, valuables and Anchor Runes are separate collections.
	collection_surface = _panel(Vector2(685, 156), Vector2(525, 477), Color(0.035, 0.038, 0.045, 0.36), Color(0.40, 0.36, 0.29, 0.13))
	collection_surface.name = "CollectionSurface"
	for i in range(3):
		var tab = _inventory_tab(self, ["Stash", "Valuables", "Anchor Runes"][i], Vector2(691 + i * 172, 109), Vector2(164, 34))
		tab.toggle_mode = true
		tab.pressed.connect(_inventory_collection.bind(i))
		inventory_tabs.append(tab)
	_line(Vector2(691, 147), Vector2(1207, 147), Color(0.57, 0.48, 0.34, 0.26))
	stash_count = _text("24 / 40 slots", Vector2(702, 166), Vector2(262, 28), 15, IVORY)
	var expand = _inventory_button(self, "Expand +10 · 60 Gold", Vector2(1009, 601), Vector2(181, 28))
	expand.disabled = true
	expand.tooltip_text = "Preview only — no Gold is spent."
	stash_controls.append(expand)
	# Filtering is contextual, so the inventory has no competing dropdown row.
	stash_filter_toggle = _inventory_button(self, "Filter & sort", Vector2(1034, 165), Vector2(156, 30))
	stash_filter_toggle.toggle_mode = true
	stash_filter_toggle.toggled.connect(_set_stash_filters_open)
	stash_controls.append(stash_filter_toggle)
	stash_grid = Control.new()
	stash_grid.name = "StashGrid"
	add_child(stash_grid)
	stash_grid.position = Vector2(702, 213)
	stash_grid.size = Vector2(497, 311)
	for i in range(21):
		var idx: int = i % 9
		stash_items.append({"art": _inventory_art(idx), "name": _inventory_item_name(idx), "slot": ["Helm", "Armor", "Gloves", "Boots", "Off-Hand", "Weapon", "Rings", "Amulet", "Belt"][idx], "rarity": (i * 3 + floori(float(i) / 8.0)) % 6, "quantity": 1, "tier": 1 + i % 5, "date": i, "fragments": 4 + i * 2, "power": 12 + i * 3})
	for i in range(3):
		stash_items.append({"art": POTION_ART[i], "name": POTION_NAMES[i], "slot": "Potions", "rarity": 1, "quantity": [12, 7, 3][i], "tier": 1, "date": 21 + i, "fragments": 0, "power": 0})
	for i in range(40):
		var slot = kit.slot(stash_grid, Vector2((i % 8) * 63, floori(float(i) / 8.0) * 64), 55)
		slot.minimal_inventory = true
		slot.name = "Stash_" + str(i)
		slot.toggle_mode = true
		slot.pressed.connect(_inventory_slot_clicked.bind(i))
		stash_slots.append(slot)
	stash_multi = _inventory_button(self, "Select multiple", Vector2(702, 548), Vector2(137, 30))
	stash_multi.toggle_mode = true
	stash_multi.toggled.connect(func(_on: bool): _clear_preview_selection())
	salvage_button = _inventory_button(self, "Salvage selected", Vector2(1031, 548), Vector2(159, 30))
	salvage_button.disabled = true
	salvage_button.tooltip_text = "Presentation only — no items are destroyed."
	selection_caption = _text("Preview · sample items", Vector2(702, 603), Vector2(302, 22), 12, MUTED)
	stash_controls.append_array([stash_multi, salvage_button, selection_caption])
	collection_host = Control.new()
	add_child(collection_host)
	collection_host.position = Vector2(702, 207)
	collection_host.size = Vector2(497, 400)
	_build_stash_filter_panel()
	inventory_slots.append_array(equipped_slots)
	inventory_slots.append_array(potion_slots)
	inventory_slots.append_array(stash_slots)
	_inventory_collection(0)

func _build_stash_filter_panel() -> void:
	# Add after the grid so the overlay receives input above it.
	stash_filter_panel = Panel.new()
	stash_filter_panel.name = "StashFilterPanel"
	var style = StyleBoxFlat.new()
	style.bg_color = Color("15171b")
	style.border_color = Color("756249")
	style.set_border_width_all(1)
	style.set_corner_radius_all(3)
	stash_filter_panel.add_theme_stylebox_override("panel", style)
	stash_filter_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(stash_filter_panel)
	stash_filter_panel.position = Vector2(903, 203)
	stash_filter_panel.size = Vector2(287, 244)
	_inventory_label(stash_filter_panel, "Item category", Vector2(16, 10), Vector2(250, 19), 12, MUTED)
	stash_filter = _inventory_option(stash_filter_panel, ["All slots", "Potions", "Rings", "Helm", "Amulet", "Armor", "Gloves", "Weapon", "Off-Hand", "Boots", "Belt"], Vector2(16, 31), Vector2(255, 29))
	_inventory_label(stash_filter_panel, "Sort by", Vector2(16, 69), Vector2(250, 19), 12, MUTED)
	stash_sort = _inventory_option(stash_filter_panel, ["Expedition tier", "Date looted", "Fragment value", "Item power", "Estimated stat gain"], Vector2(16, 90), Vector2(255, 29))
	_inventory_label(stash_filter_panel, "Order", Vector2(16, 128), Vector2(250, 19), 12, MUTED)
	stash_order = _inventory_option(stash_filter_panel, ["High / newest", "Low / oldest"], Vector2(16, 149), Vector2(255, 29))
	for option in [stash_filter, stash_sort, stash_order]:
		option.item_selected.connect(_inventory_filter_changed)
	var clear = _inventory_button(stash_filter_panel, "Clear filters", Vector2(16, 196), Vector2(122, 30))
	clear.pressed.connect(func():
		stash_filter.select(0)
		stash_sort.select(0)
		stash_order.select(0)
		_inventory_filter_changed(0)
	)
	var close = _inventory_button(stash_filter_panel, "Done", Vector2(153, 196), Vector2(118, 30))
	close.pressed.connect(_set_stash_filters_open.bind(false))
	stash_filter_panel.hide()

func _set_stash_filters_open(on: bool) -> void:
	stash_filter_toggle.set_pressed_no_signal(on)
	stash_filter_panel.visible = on and collection_index == 0

func _clear_preview_selection() -> void:
	selected_preview.clear()
	for slot in stash_slots:
		slot.set_pressed_no_signal(false)
		slot.queue_redraw()
	selection_caption.text = "Preview · sample items"

func _inventory_filter_changed(_index: int) -> void:
	_clear_preview_selection()
	var filter: String = stash_filter.get_item_text(stash_filter.selected)
	var visible_items: Array[Dictionary] = []
	for item in stash_items:
		if filter == "All slots" or item["slot"] == filter:
			visible_items.append(item)
	var key: String = ["tier", "date", "fragments", "power", "power"][stash_sort.selected]
	var ascending: bool = stash_order.selected == 1
	visible_items.sort_custom(func(a: Dictionary, b: Dictionary): return a[key] < b[key] if ascending else a[key] > b[key])
	for i in range(stash_slots.size()):
		var slot = stash_slots[i]
		slot.set_meta("preview_item", {})
		slot.item_art = null
		slot.quantity = 1
		slot.preview_tooltip_factory = Callable()
		slot.tooltip_text = "Empty slot"
		if i < visible_items.size():
			var item: Dictionary = visible_items[i]
			slot.set_meta("preview_item", item)
			slot.item_art = item["art"]
			slot.rarity = item["rarity"]
			slot.quantity = item["quantity"]
			slot.tooltip_text = item["name"]
			slot.preview_tooltip_factory = _inventory_tooltip.bind(item["art"], item["rarity"], false, item["name"], item["slot"])
		slot.queue_redraw()
	stash_count.text = "24 / 40 slots" if filter == "All slots" else "%d matching · 24 / 40" % visible_items.size()
	stash_filter_toggle.text = "Filter & sort" if filter == "All slots" and stash_sort.selected == 0 and stash_order.selected == 0 else "Filter & sort  •"
	stash_count.tooltip_text = "24 / 40 slots occupied"

func _inventory_slot_clicked(index: int) -> void:
	var slot = stash_slots[index]
	var item: Dictionary = slot.get_meta("preview_item", {})
	if item.is_empty():
		slot.set_pressed_no_signal(false)
		return
	if not stash_multi.button_pressed:
		_clear_preview_selection()
		slot.set_pressed_no_signal(true)
		selected_preview[index] = true
		selection_caption.text = str(item["name"]) + " · hover to inspect"
	else:
		if slot.button_pressed:
			selected_preview[index] = true
		else:
			selected_preview.erase(index)
		selection_caption.text = "%d selected · preview only" % selected_preview.size()
	slot.queue_redraw()

func _inventory_collection(index: int) -> void:
	collection_index = index
	stash_count.size.x = 262 if index == 0 else 460
	collection_surface.size = [Vector2(525, 477), Vector2(455, 265), Vector2(525, 325)][index]
	collection_host.size = collection_surface.size - Vector2(34, 51)
	_set_stash_filters_open(false)
	for i in range(inventory_tabs.size()):
		inventory_tabs[i].set_pressed_no_signal(i == index)
	for control in stash_controls:
		control.visible = index == 0
	stash_grid.visible = index == 0
	for child in collection_host.get_children():
		collection_host.remove_child(child)
		child.queue_free()
	collection_host.visible = index != 0
	if index == 0:
		_inventory_filter_changed(0)
		return
	if index == 1:
		stash_count.text = "2 valuables · 140 Gold total"
		for i in range(2):
			_inventory_slot(collection_host, Vector2(0, i * 72), 57, TREASURE_ART[i], 1, false, ["Jeweled Chalice", "Gem Pouch"][i], "Valuable")
			_inventory_label(collection_host, ["Jeweled Chalice", "Gem Pouch"][i], Vector2(72, i * 72 + 5), Vector2(220, 24), 15)
			var price = _inventory_label(collection_host, ["100 Gold", "40 Gold"][i], Vector2(292, i * 72 + 5), Vector2(110, 24), 14, GOLD)
			price.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		var sell = _inventory_button(collection_host, "Sell all valuables", Vector2(0, 151), Vector2(190, 32))
		sell.disabled = true
		sell.tooltip_text = "Preview only — no items are sold."
	else:
		stash_count.text = "3 / 300 Anchor Runes"
		for i in range(3):
			_inventory_slot(collection_host, Vector2(0, i * 66), 55, RUNE_ART[i], 2 + i % 2, false, ["Rune of Might", "Rune of Warding", "Rune of Wisdom"][i], "Anchor Rune")
			_inventory_label(collection_host, ["Rune of Might", "Rune of Warding", "Rune of Wisdom"][i], Vector2(70, i * 66 + 4), Vector2(390, 23), 15)
			_inventory_label(collection_host, ["+3 Strength", "+6.75 Defense", "+3 Intellect"][i], Vector2(70, i * 66 + 29), Vector2(390, 20), 13, GOLD)
		_inventory_label(collection_host, "Equip or recycle at the Shrine · 3 bound slots", Vector2(0, 207), Vector2(478, 24), 13, MUTED)

func _talent_marker(at: Vector2, diameter: float, tint: Color, central: bool = false) -> Panel:
	var node = Panel.new()
	var style = StyleBoxFlat.new()
	style.bg_color = tint.darkened(0.83)
	style.border_color = tint if central else tint.darkened(0.12)
	style.set_border_width_all(2 if central else 1)
	style.set_corner_radius_all(roundi(diameter * 0.5))
	node.add_theme_stylebox_override("panel", style)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node)
	node.position = at - Vector2.ONE * diameter * 0.5
	node.size = Vector2.ONE * diameter
	return node

func _talents() -> void:
	_cinematic_scene(REALMS, 0.84)
	_scene_heading("The Talent Tree", "Six Affinities")
	# Same six branches and three illustrative nodes per branch; no real tree port.
	var center = Vector2(640, 358)
	var points: Array[Vector2] = []
	var colors: Array[Color] = []
	for i in range(6):
		var angle: float = -PI / 2.0 + TAU * float(i) / 6.0
		var direction = Vector2(cos(angle) * 1.45, sin(angle))
		var tint = Color(AFFINITY_COLORS[i])
		var previous = center + direction * 24.0
		for j in range(3):
			var point = center + direction * (60.0 + j * 43.0)
			_line(previous, point, Color(tint.r, tint.g, tint.b, 0.54), 1.5)
			points.append(point)
			colors.append(tint)
			previous = point
		var endpoint = center + direction * 205.0
		_line(previous, center + direction * 173.0, Color(tint.r, tint.g, tint.b, 0.55), 1.5)
		_text(AFFINITIES[i], endpoint - Vector2(85, 15), Vector2(170, 30), 23, tint, true, true)
	# Nodes are rendered after every connection.
	for i in range(points.size()):
		var marker = _talent_marker(points[i], 23.0 if i % 3 != 2 else 32.0, colors[i])
		marker.name = "PreviewTalent_" + str(i)
	var core = _talent_marker(center, 63.0, GOLD, true)
	core.name = "TalentCore"
	_text("W", center - Vector2(32, 23), Vector2(64, 46), 30, GOLD, true, true)
	_scene_footer("Illustrative nodes only — no points can be spent")

func _expedition() -> void:
	_cinematic_scene(REALMS, 0.31, true)
	_scene_heading("Expedition", "Beyond the veil")
	_text("Realms", Vector2(92, 133), Vector2(340, 34), 24, IVORY, true)
	for i in range(6):
		var y: float = 183.0 + i * 58.0
		var tint = Color(AFFINITY_COLORS[i])
		_rect(Vector2(92, y + 13), Vector2(3, 17), tint)
		_text(AFFINITIES[i], Vector2(113, y), Vector2(310, 41), 25, tint, true)
		if i < 5:
			_line(Vector2(92, y + 48), Vector2(392, y + 48), Color(0.57, 0.48, 0.34, 0.15))
	_text("Into the unknown", Vector2(510, 488), Vector2(680, 58), 39, IVORY, true, true)
	_text("Realm selection · Contracts · Exploration", Vector2(510, 551), Vector2(680, 26), 14, MUTED, false, true)
	_scene_footer("Preview only — no expedition can begin")

func _codex() -> void:
	_cinematic_scene(REALMS, 0.87)
	_scene_heading("The Codex", "Archives · Bestiary")
	_text("Bestiary", Vector2(85, 158), Vector2(230, 38), 23, GOLD, true)
	_text("Elites", Vector2(86, 216), Vector2(230, 39), 27, IVORY, true)
	_line(Vector2(86, 258), Vector2(243, 258), Color(0.57, 0.48, 0.34, 0.45))
	_text("Bosses", Vector2(86, 279), Vector2(230, 38), 23, MUTED, true)
	_text("Creatures", Vector2(86, 335), Vector2(230, 38), 23, MUTED, true)
	_art(preload("res://assets/arena/tank.png"), Vector2(315, 127), Vector2(425, 461))
	_text("The Tank", Vector2(790, 221), Vector2(410, 58), 40, IVORY, true)
	_text("ELITE · SAMPLE ENTRY", Vector2(792, 283), Vector2(400, 23), 13, GOLD)
	_line(Vector2(792, 323), Vector2(1190, 323), Color(0.57, 0.48, 0.34, 0.32))
	_text("Illustration and archive layout only.", Vector2(792, 347), Vector2(410, 30), 16, MUTED)
	_text("No discovery, stats or lore data yet.", Vector2(792, 380), Vector2(410, 30), 15, MUTED)
	_scene_footer("Bestiary preview")

func _city() -> void:
	_cinematic_scene(CAMP, 0.76)
	_scene_heading("City Center", "The settlement")
	var art = [
		preload("res://assets/shell/blacksmith.png"),
		preload("res://assets/shell/merchant.png"),
		preload("res://assets/shell/apothecary.png")
	]
	var titles = ["Blacksmith", "Merchant", "Apothecary"]
	var subtitles = ["Forge and craft", "Trade equipment", "Prepare remedies"]
	# Existing individual illustrations, no fake continuous street or new art.
	for i in range(3):
		var x: float = 70.0 + i * 390.0
		_art(art[i], Vector2(x, 139), Vector2(360, 370))
		_text(titles[i], Vector2(x, 525), Vector2(360, 44), 30, IVORY, true, true)
		_text(subtitles[i], Vector2(x, 574), Vector2(360, 25), 14, MUTED, false, true)
	_scene_footer("Services · presentation preview")

func _shrine() -> void:
	_cinematic_scene(REALMS, 0.80)
	_scene_heading("The Shrine", "Anchor Runes")
	# The altar is the main focus; bound slots sit at the base of the illustration.
	_art(preload("res://assets/shell/shrine.png"), Vector2(120, 111), Vector2(580, 401))
	_text("Bound Runes", Vector2(144, 490), Vector2(540, 34), 23, GOLD, true, true)
	for i in range(3):
		var x: float = 281.0 + i * 95.0
		var bound = _slot(Vector2(x, 531), 72)
		bound.name = "BoundRune_" + str(i)
		bound.tooltip_text = "Bound rune slot " + str(i + 1) + " · preview"
	_text("Available runes", Vector2(780, 180), Vector2(410, 38), 28, IVORY, true)
	_text("Choose a rune from your bag", Vector2(782, 228), Vector2(420, 27), 14, MUTED)
	_line(Vector2(782, 274), Vector2(1192, 274), Color(0.57, 0.48, 0.34, 0.30))
	for i in range(6):
		var x: float = 782.0 + float(i % 3) * 85.0
		var y: float = 299.0 + floori(float(i) / 3.0) * 85.0
		var rune = _slot(Vector2(x, y), 68)
		rune.name = "AvailableRune_" + str(i)
		rune.minimal_inventory = true
	_text("Illustrative slots — no rune effects yet.", Vector2(782, 487), Vector2(420, 24), 13, MUTED)
	_scene_footer("Permanent runes · presentation preview")
