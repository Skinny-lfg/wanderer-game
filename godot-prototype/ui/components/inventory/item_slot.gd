extends Button
const Tokens = preload("res://ui/theme/tokens.gd")
const PaintedSlots = preload("res://ui/theme/painted_slot_pack.gd")
# Opt-in for the gallery; other consumers keep the original visual treatment.
var painted_textures: Dictionary = {}
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
	if painted_textures.size() == 10:
		_draw_painted()
		return
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

func painted_key(hover: bool = false) -> String:
	if locked:
		return "slot_locked"
	if button_pressed or equipped:
		return "slot_selected"
	if hover:
		return "slot_hover"
	if item_art == null:
		return "slot_empty"
	return PaintedSlots.RARITIES[rarity]

func _painted_art_fit_ratio(side: float) -> float:
	# Keep the painted bevel visible even on dense 48px grids.
	# Selection and equipment change the frame, not the item silhouette.
	return 0.74 if side <= 66.0 else 0.73

func _draw_painted() -> void:
	var side = minf(size.x, size.y)
	if side <= 0:
		return
	var extent = Vector2(side, side)
	var origin = (size - extent) * 0.5
	var key = painted_key(is_hovered() or has_focus())
	draw_texture_rect(painted_textures[key], Rect2(origin, extent), false)
	if locked:
		return
	if item_art != null:
		var art_size = item_art.get_size()
		var fit_ratio = _painted_art_fit_ratio(side)
		var factor = minf(side * fit_ratio / art_size.x, side * fit_ratio / art_size.y)
		art_size *= factor
		draw_texture_rect(item_art, Rect2((size - art_size) * 0.5, art_size), false)
		# Preserve a rarity cue when a gold interaction state replaces the base.
		if key.begins_with("slot_"):
			draw_rect(Rect2(origin + Vector2(side * 0.37, side * 0.87), Vector2(side * 0.26, 2)), Tokens.RARITY_COLORS[rarity])
	var font = get_theme_default_font()
	if quantity > 1 and item_art != null:
		var count_text = str(quantity)
		var font_size = maxi(10, roundi(side * 0.18))
		var count_width = font.get_string_size(count_text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
		var pos = origin + Vector2(side * 0.84 - count_width, side * 0.85)
		draw_string_outline(font, pos, count_text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 3, Color("#111218"))
		draw_string(font, pos, count_text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Tokens.IVORY)
	if equipped:
		draw_string(font, origin + Vector2(side * 0.72, side * 0.24), "E", HORIZONTAL_ALIGNMENT_LEFT, -1, maxi(10, roundi(side * 0.17)), Tokens.GOLD)
