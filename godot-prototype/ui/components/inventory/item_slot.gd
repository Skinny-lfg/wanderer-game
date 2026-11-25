extends Button
const Tokens = preload("res://ui/theme/tokens.gd")
const PaintedSlots = preload("res://ui/theme/painted_slot_pack.gd")
const Normalize = preload("res://ui/theme/asset_normalization.gd")
var _cached_art: Texture2D
var _cached_bounds: Rect2i
# Opt-in for the gallery; other consumers keep the original visual treatment.
var painted_textures: Dictionary = {}
# Opt-in: a quiet stash cell, with no repeated ornamental art.
var minimal_inventory: bool = false
# Optional custom tooltip factory, supplied only by the workshop preview.
var preview_tooltip_factory: Callable
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
	if minimal_inventory:
		_draw_minimal_inventory()
		return
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

func _draw_minimal_inventory() -> void:
	var side: float = minf(size.x, size.y)
	if side <= 2.0:
		return
	var origin: Vector2 = (size - Vector2.ONE * side) * 0.5
	var bounds: Rect2 = Rect2(origin + Vector2.ONE, Vector2.ONE * (side - 2.0))
	var accent: Color = Tokens.RARITY_COLORS[rarity] if item_art != null else Color("33353a")
	var edge: Color = accent.darkened(0.30) if item_art != null else Color("303136")
	var highlighted: bool = button_pressed or is_hovered() or has_focus()
	if locked:
		edge = Color("37383b")
	elif highlighted:
		edge = accent.lightened(0.25) if item_art != null else Tokens.GOLD
	var fill: Color = Color("17191d") if item_art != null else Color(0.07, 0.075, 0.085, 0.40)
	if highlighted:
		fill = fill.lerp(Color("393126"), 0.30)
	draw_rect(bounds, fill)
	draw_rect(bounds, edge, false, 1.5 if highlighted else 1.0)
	if item_art == null or locked:
		return
	var source: Rect2i = painted_art_bounds()
	if source.has_area():
		var safe = Rect2(origin + Vector2.ONE * (side * 0.09), Vector2.ONE * (side * 0.82))
		var destination: Rect2 = Normalize.fit_rect(Vector2(source.size), safe)
		draw_texture_rect_region(item_art, destination, Rect2(source))
	if quantity > 1:
		var font: Font = get_theme_default_font()
		var font_size: int = maxi(10, roundi(side * 0.21))
		var value: String = str(quantity)
		var width: float = font.get_string_size(value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x
		var at: Vector2 = origin + Vector2(side - width - 4.0, side - 5.0)
		draw_string_outline(font, at, value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 3, Color("101115"))
		draw_string(font, at, value, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Tokens.IVORY)

func painted_key(hover: bool = false) -> String:
	if locked:
		return "slot_locked"
	if button_pressed:
		return "slot_selected"
	if hover:
		return "slot_hover"
	if item_art == null:
		return "slot_empty"
	return PaintedSlots.RARITIES[rarity]

func painted_art_bounds() -> Rect2i:
	if item_art != _cached_art:
		_cached_art = item_art
		_cached_bounds = Rect2i()
		if item_art != null:
			var image = item_art.get_image()
			if image != null and not image.is_empty():
				_cached_bounds = image.get_used_rect()
	return _cached_bounds

func painted_art_rect(slot_extent: Vector2) -> Rect2:
	return Normalize.fit_rect(Vector2(painted_art_bounds().size), Normalize.slot_safe_rect(slot_extent))

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
		var bounds = painted_art_bounds()
		if bounds.has_area():
			draw_texture_rect_region(item_art, painted_art_rect(size), Rect2(bounds))
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

func _make_custom_tooltip(_for_text: String) -> Object:
	if preview_tooltip_factory.is_valid():
		return preview_tooltip_factory.call()
	return null
