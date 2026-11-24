extends Control
## G1 visual wireframes. Labels, slots, and paths are illustrative, not mechanics.
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
var serif: SystemFont

func _ready() -> void:
	serif = SystemFont.new()
	serif.font_names = PackedStringArray(["Georgia", "Liberation Serif", "DejaVu Serif"])
	match screen_id:
		"camp": _camp()
		"inventory": _inventory()
		"talents": _talents()
		"expedition": _expedition()
		"codex": _codex()

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
	_text("G1  /  VISUAL PROTOTYPE", Vector2(1005, 30), Vector2(240, 20), 13, GOLD)

func _camp() -> void:
	_background(CAMP, 0.35)
	_rect(Vector2(0, 0), Vector2(460, 648), Color(0.04, 0.045, 0.06, 0.78))
	_header("Wanderer / Refuge", "The Camp", "A moment of rest between expeditions")
	_text("SERVICES", Vector2(50, 184), Vector2(320, 25), 14, GOLD)
	for i in range(3):
		var y = 222 + i * 98
		_line(Vector2(52, y), Vector2(384, y), Color("574c3c"))
		_text(["Blacksmith", "Merchant", "Apothecary"][i], Vector2(55, y + 10), Vector2(350, 35), 30, IVORY, true)
		_text(["Forge and craft", "Trade supplies", "Prepare remedies"][i], Vector2(56, y + 48), Vector2(330, 22), 15, MUTED)
	_art(HERO, Vector2(545, 155), Vector2(450, 470))
	_text("THE WANDERER", Vector2(545, 604), Vector2(450, 24), 16, GOLD, false, true)
	_text("Services are visual placeholders", Vector2(50, 600), Vector2(420, 20), 13, MUTED)

func _slot(pos: Vector2, size_px: float, item_index: int = -1) -> void:
	var extent = Vector2(size_px, size_px)
	_panel(pos, extent, Color("1a1b20"), Color("544a3c"))
	if item_index >= 0:
		_art(ITEMS[item_index], pos + Vector2(5, 5), extent - Vector2(10, 10))

func _inventory() -> void:
	_background(CAMP, 0.83)
	_header("Wanderer / Loadout", "Equipment & Inventory", "A character-first layout; item icons are sample art")
	_art(HERO, Vector2(132, 158), Vector2(365, 466))
	for i in range(4):
		_slot(Vector2(55, 190 + i * 100), 76, i)
		_slot(Vector2(515, 190 + i * 100), 76, i + 4)
	_line(Vector2(635, 172), Vector2(635, 620), Color("64533d"))
	_text("SATCHEL", Vector2(680, 174), Vector2(500, 36), 27, IVORY, true)
	for i in range(40):
		var col: int = i % 8
		var row: int = floori(float(i) / 8.0)
		_slot(Vector2(680 + col * 66, 225 + row * 66), 60, i if i < ITEMS.size() else -1)
	_text("Sample layout  /  No item actions or stats", Vector2(680, 582), Vector2(550, 25), 15, MUTED)

func _talents() -> void:
	_background(REALMS, 0.86)
	_header("Wanderer / Affinities", "The Talent Tree", "Radial composition study — not the current talent graph")
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
	_text("REALMS", Vector2(52, 178), Vector2(350, 28), 15, GOLD)
	for i in range(6):
		var y = 222 + i * 57
		_line(Vector2(52, y), Vector2(385, y), Color("504838"))
		_text(AFFINITIES[i], Vector2(55, y + 8), Vector2(325, 38), 25, Color(AFFINITY_COLORS[i]), true)
	_text("Into the unknown", Vector2(470, 490), Vector2(750, 58), 43, IVORY, true, true)
	_text("Realm selection  /  Contracts  /  Exploration", Vector2(470, 556), Vector2(750, 24), 16, GOLD, false, true)
	_text("Visual study — no expedition can begin", Vector2(50, 610), Vector2(400, 24), 13, MUTED)

func _codex() -> void:
	_background(REALMS, 0.91)
	_header("Wanderer / Archives", "The Codex", "A future archive of the world and its inhabitants")
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
