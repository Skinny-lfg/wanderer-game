extends Button
const Tokens = preload("res://ui/theme/tokens.gd")
@export var item_art: Texture2D
@export_range(0, 5) var rarity: int = 1
@export var quantity: int = 1
@export var equipped: bool = false
@export var locked: bool = false

func _ready() -> void:
	disabled = locked
	tooltip_text = "Locked slot" if locked else ("Empty slot" if item_art == null else Tokens.RARITY_NAMES[rarity] + " item")
	for state in ["normal", "hover", "pressed", "hover_pressed", "disabled", "focus"]:
		var style = StyleBoxEmpty.new()
		add_theme_stylebox_override(state, style)
	toggled.connect(func(_value): queue_redraw())
	mouse_entered.connect(queue_redraw)
	mouse_exited.connect(queue_redraw)
	focus_entered.connect(queue_redraw)
	focus_exited.connect(queue_redraw)

func _draw() -> void:
	var edge = Tokens.RARITY_COLORS[rarity] if item_art != null else Color("#53535b")
	if locked:
		edge = Color("#55545a")
	elif button_pressed or has_focus() or is_hovered():
		edge = edge.lightened(0.35)
	var w = size.x
	var h = size.y
	var corners = PackedVector2Array([Vector2(10, 1), Vector2(w - 10, 1), Vector2(w - 1, 10), Vector2(w - 1, h - 10), Vector2(w - 10, h - 1), Vector2(10, h - 1), Vector2(1, h - 10), Vector2(1, 10)])
	draw_colored_polygon(corners, Color("#1c1e27"))
	var outline = corners.duplicate()
	outline.append(corners[0])
	draw_polyline(outline, edge, 2.0, true)
	draw_line(Vector2(12, 5), Vector2(w - 12, 5), edge.darkened(0.25), 1.0, true)
	if item_art != null:
		var extent = item_art.get_size()
		var factor = minf((w - 18) / extent.x, (h - 18) / extent.y)
		extent *= factor
		draw_texture_rect(item_art, Rect2((size - extent) * 0.5, extent), false, Color(1, 1, 1, 0.35 if locked else 1.0))
	else:
		draw_line(size * 0.5 - Vector2(7, 0), size * 0.5 + Vector2(7, 0), edge, 1.0)
		draw_line(size * 0.5 - Vector2(0, 7), size * 0.5 + Vector2(0, 7), edge, 1.0)
	var font = get_theme_default_font()
	if quantity > 1 and item_art != null:
		draw_string(font, Vector2(7, h - 8), str(quantity), HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Tokens.IVORY)
	if equipped:
		draw_string(font, Vector2(w - 20, 21), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Tokens.GOLD)
	if locked:
		draw_string(font, Vector2(w * 0.5 - 23, h - 9), "LOCK", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, Tokens.MUTED)
