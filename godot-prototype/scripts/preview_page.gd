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
var kit: RefCounted
var serif: Font
var inventory_slots: Array[Button] = []
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

func _header(kicker: String, title: String, subtitle: String) -> void:
	_text(kicker.to_upper(), Vector2(48, 28), Vector2(900, 20), 13, GOLD)
	_text(title, Vector2(45, 49), Vector2(1150, 59), 43, IVORY, true)
	_text(subtitle, Vector2(48, 110), Vector2(1150, 24), 16, MUTED)
	_line(Vector2(48, 146), Vector2(1232, 146), Color("63543d"))
	_text("G2.3A  /  UI PREVIEW", Vector2(1005, 30), Vector2(240, 20), 13, GOLD)

func _camp() -> void:
	_background(CAMP, 0.29)
	_rect(Vector2.ZERO, Vector2(580, 648), Color(0.04, 0.045, 0.06, 0.72))
	_header("Wanderer / Refuge", "The Camp", "A moment of rest between expeditions")
	kit.panel(self, Vector2(38, 168), Vector2(540, 214), "standard")
	_text("THE WANDERER", Vector2(58, 184), Vector2(500, 24), 15, GOLD)
	kit.hud(self, Vector2(52, 211), 350)
	kit.panel(self, Vector2(38, 396), Vector2(540, 128))
	_text("Prepare for the journey", Vector2(58, 410), Vector2(490, 34), 24, IVORY, true)
	_text("Visit the city, prepare equipment and bind runes.", Vector2(58, 455), Vector2(490, 24), 15, MUTED)
	_text("Choose your next realm when ready.", Vector2(58, 481), Vector2(490, 24), 15, MUTED)
	_art(HERO, Vector2(630, 158), Vector2(540, 465))
	_text("Visual preview • sample character values", Vector2(48, 610), Vector2(510, 22), 13, MUTED)

func _slot(pos: Vector2, size_px: float, item_index: int = -1, equipped: bool = false, rarity: int = 1) -> Button:
	var art: Texture2D = ITEMS[item_index] if item_index >= 0 else null
	var item_name: String = ITEM_NAMES[item_index] if item_index >= 0 else ""
	var category: String = ITEM_TYPES[item_index] if item_index >= 0 else ""
	return kit.slot(self, pos, size_px, art, rarity, equipped, item_name, category)

func _inventory() -> void:
	_background(CAMP, 0.85)
	_header("Wanderer / Loadout", "Equipment & Inventory", "Character equipment and satchel — illustrative items")
	kit.panel(self, Vector2(38, 160), Vector2(560, 466), "standard")
	kit.panel(self, Vector2(615, 160), Vector2(627, 466), "standard")
	_text("EQUIPPED", Vector2(60, 174), Vector2(510, 26), 17, GOLD, true, true)
	_art(HERO, Vector2(142, 206), Vector2(350, 399))
	for i in range(4):
		inventory_slots.append(_slot(Vector2(62, 214 + i * 96), 76, i, true, [1, 2, 1, 3][i]))
		inventory_slots.append(_slot(Vector2(505, 214 + i * 96), 76, i + 4, true, [2, 3, 4, 5][i]))
	_text("SATCHEL", Vector2(640, 174), Vector2(430, 32), 23, IVORY, true)
	_text("24 / 48", Vector2(1100, 180), Vector2(112, 25), 15, MUTED, false, true)
	for i in range(48):
		var col: int = i % 8
		var row: int = floori(float(i) / 8.0)
		var item_index: int = i % ITEMS.size() if i < 24 else -1
		var rarity: int = (i + floori(float(i) / 8.0)) % 6
		inventory_slots.append(_slot(Vector2(652 + col * 68, 216 + row * 64), 60, item_index, false, rarity))
	_text("Hover to inspect • click to highlight", Vector2(645, 602), Vector2(550, 20), 13, MUTED)

func _talents() -> void:
	_background(REALMS, 0.86)
	_header("Wanderer / Affinities", "The Talent Tree", "Radial composition study — not the current talent graph")
	kit.panel(self, Vector2(38, 158), Vector2(1204, 468))
	var center = Vector2(640, 392)
	_panel(center - Vector2(35, 35), Vector2(70, 70), Color("221e19"), GOLD)
	_text("W", center - Vector2(35, 25), Vector2(70, 50), 32, GOLD, true, true)
	for i in range(6):
		var angle = -PI / 2.0 + TAU * float(i) / 6.0
		var dir = Vector2(cos(angle) * 1.6, sin(angle))
		var tint = Color(AFFINITY_COLORS[i])
		var previous = center + dir * 35
		for j in range(3):
			var point = center + dir * (65 + j * 43)
			_line(previous, point, tint.darkened(0.30), 2)
			_panel(point - Vector2(14, 14), Vector2(28, 28), tint.darkened(0.72), tint)
			previous = point
		var endpoint = center + dir * 204
		_line(previous, endpoint, tint, 2)
		_text(AFFINITIES[i], endpoint - Vector2(75, 15), Vector2(150, 32), 20, tint, true, true)
	_text("Illustrative nodes only — no points can be spent", Vector2(48, 610), Vector2(1000, 24), 14, MUTED)

func _expedition() -> void:
	_background(REALMS, 0.38)
	_rect(Vector2(0, 0), Vector2(440, 648), Color(0.03, 0.035, 0.05, 0.88))
	_header("Wanderer / Beyond the veil", "Expedition", "The next journey starts here")
	kit.panel(self, Vector2(38, 160), Vector2(380, 436), "standard")
	_text("REALMS", Vector2(60, 178), Vector2(350, 28), 15, GOLD)
	for i in range(6):
		var y = 222 + i * 57
		_line(Vector2(52, y), Vector2(385, y), Color("504838"))
		_text(AFFINITIES[i], Vector2(55, y + 8), Vector2(325, 38), 25, Color(AFFINITY_COLORS[i]), true)
	_text("Into the unknown", Vector2(470, 490), Vector2(750, 58), 43, IVORY, true, true)
	_text("Realm selection  /  Contracts  /  Exploration", Vector2(470, 556), Vector2(750, 24), 16, GOLD, false, true)
	_text("Preview only — no expedition can begin", Vector2(50, 610), Vector2(400, 24), 13, MUTED)

func _codex() -> void:
	_background(REALMS, 0.91)
	_header("Wanderer / Archives", "The Codex", "A future archive of the world and its inhabitants")
	kit.panel(self, Vector2(38, 160), Vector2(320, 466), "standard")
	kit.panel(self, Vector2(790, 160), Vector2(450, 466))
	_text("BESTIARY", Vector2(52, 190), Vector2(270, 30), 16, GOLD)
	_text("Elites", Vector2(52, 228), Vector2(320, 44), 31, IVORY, true)
	_text("Bosses", Vector2(52, 279), Vector2(320, 44), 25, MUTED, true)
	_text("Creatures", Vector2(52, 325), Vector2(320, 44), 25, MUTED, true)
	_line(Vector2(370, 177), Vector2(370, 612), Color("554934"))
	_art(preload("res://assets/arena/tank.png"), Vector2(405, 175), Vector2(380, 440))
	_text("The Tank", Vector2(815, 215), Vector2(420, 60), 41, IVORY, true)
	_line(Vector2(817, 282), Vector2(1210, 282), Color("554934"))
	_text("ELITE / SAMPLE ENTRY", Vector2(817, 301), Vector2(400, 27), 15, GOLD)
	_text("Illustration and archive layout only.", Vector2(817, 349), Vector2(430, 28), 18, MUTED)
	_text("No discovery, stats or lore data yet.", Vector2(817, 383), Vector2(430, 28), 17, MUTED)

func _city() -> void:
	_background(CAMP, 0.78)
	_header("Wanderer / Settlement", "City Center", "Services — presentation study")
	var art = [
		preload("res://assets/shell/blacksmith.png"),
		preload("res://assets/shell/merchant.png"),
		preload("res://assets/shell/apothecary.png")
	]
	var titles = ["Blacksmith", "Merchant", "Apothecary"]
	var subtitles = ["Forge and craft", "Trade equipment", "Prepare remedies"]
	for i in range(3):
		var x = 48 + i * 400
		kit.panel(self, Vector2(x, 160), Vector2(384, 466), "standard")
		_art(art[i], Vector2(x + 20, 178), Vector2(344, 350))
		_line(Vector2(x, 538), Vector2(x + 384, 538), Color("7b6547"))
		_text(titles[i], Vector2(x, 548), Vector2(384, 42), 30, IVORY, true, true)
		_text(subtitles[i], Vector2(x, 594), Vector2(384, 25), 16, MUTED, false, true)

func _shrine() -> void:
	_background(REALMS, 0.80)
	_header("Wanderer / Runes", "The Shrine", "Permanent runes — illustrative layout, no effects")
	_art(preload("res://assets/shell/shrine.png"), Vector2(48, 160), Vector2(500, 465))
	kit.panel(self, Vector2(580, 160), Vector2(662, 466), "standard")
	_text("BOUND RUNES", Vector2(600, 183), Vector2(600, 36), 25, GOLD, true)
	for i in range(3):
		_slot(Vector2(604 + i * 126, 236), 104)
		_text("Slot " + str(i + 1), Vector2(604 + i * 126, 344), Vector2(104, 25), 15, MUTED, false, true)
	_line(Vector2(604, 391), Vector2(1220, 391), Color("65533e"))
	_text("Choose a rune from your bag", Vector2(604, 410), Vector2(600, 40), 27, IVORY, true)
	for i in range(6):
		_slot(Vector2(604 + i * 72, 466), 64)
	_text("Illustrative slots — final rune rules are not ported.", Vector2(604, 560), Vector2(600, 28), 15, MUTED)
