extends Control
## Horizontal modular resource bar. Three full-height regions preserve the
## pointed caps at each chosen bar height. The fill is tiled and clipped.
const V2 = preload("res://ui/theme/ui_kit_v2.gd")
var use_v2: bool = false
const FRAME = preload("res://ui/assets/resources/g22f/resource_frame.png")
const FILLS = {
	"Health": preload("res://ui/assets/resources/g22f/fill_health.png"),
	"Mana": preload("res://ui/assets/resources/g22f/fill_mana.png"),
	"Barrier": preload("res://ui/assets/resources/g22f/fill_barrier.png"),
	"EXP": preload("res://ui/assets/resources/g22f/fill_exp.png")
}
var resource_kind: String = "Health"
var current: float = 100.0
var maximum: float = 100.0
var shown_ratio: float = 1.0
var trail_ratio: float = 1.0
const DAMAGE_HOLD = 0.16
const DAMAGE_DRAIN = 0.38
var show_value: bool = true
var value_font: Font
var value_alignment: int = HORIZONTAL_ALIGNMENT_CENTER
var value_scale: float = 0.53
var value_outline: int = 3
var group_values: bool = false
var hide_empty: bool = false
var motion: Tween

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size.x = maxf(custom_minimum_size.x, 48.0)
	resized.connect(queue_redraw)
	_sync_visibility()
	queue_redraw()

func fraction() -> float:
	return clampf(current / maximum, 0.0, 1.0) if maximum > 0.0 else 0.0

func set_amount(value: float, capacity: float, animate: bool = true) -> void:
	var previous = fraction()
	maximum = maxf(0.0, capacity)
	current = clampf(value, 0.0, maximum)
	if motion != null and motion.is_valid():
		motion.kill()
	var target = fraction()
	var damage = (resource_kind == "Health" or resource_kind == "Barrier") and target < previous
	if not animate or not is_inside_tree():
		_display_ratio(target)
		_display_trail(target)
		_sync_visibility()
		return
	if hide_empty and (target > 0.0 or (damage and previous > 0.0)):
		show()
	motion = create_tween()
	if damage:
		var old = maxf(previous, maxf(shown_ratio, trail_ratio))
		_display_ratio(target)
		_display_trail(old)
		motion.tween_interval(DAMAGE_HOLD)
		motion.tween_method(_display_trail, old, target, DAMAGE_DRAIN).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	else:
		_display_trail(target)
		motion.tween_method(_display_ratio, shown_ratio, target, 0.28).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	motion.tween_callback(_finish_animation)

func set_exp_wrap(value: float, capacity: float) -> void:
	if motion != null and motion.is_valid():
		motion.kill()
	maximum = maxf(0.0, capacity)
	current = clampf(value, 0.0, maximum)
	if not is_inside_tree():
		_display_ratio(fraction())
		_display_trail(fraction())
		return
	motion = create_tween()
	motion.tween_method(_display_ratio, shown_ratio, 1.0, 0.18)
	motion.tween_callback(_display_ratio.bind(0.0))
	motion.tween_method(_display_ratio, 0.0, fraction(), 0.28).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	motion.tween_callback(_finish_animation)

func _finish_animation() -> void:
	_display_ratio(fraction())
	_display_trail(fraction())
	_sync_visibility()

func _sync_visibility() -> void:
	if hide_empty:
		visible = current > 0.0 and maximum > 0.0

func _display_ratio(value: float) -> void:
	shown_ratio = clampf(value, 0.0, 1.0)
	queue_redraw()

func _display_trail(value: float) -> void:
	trail_ratio = clampf(value, 0.0, 1.0)
	queue_redraw()

func _clip_x(points: PackedVector2Array, boundary: float, keep_left: bool) -> PackedVector2Array:
	var result = PackedVector2Array()
	if points.is_empty():
		return result
	var prev = points[points.size() - 1]
	var prev_inside = prev.x <= boundary if keep_left else prev.x >= boundary
	for point in points:
		var inside = point.x <= boundary if keep_left else point.x >= boundary
		if inside != prev_inside:
			var amount = (boundary - prev.x) / (point.x - prev.x)
			result.append(prev.lerp(point, amount))
		if inside:
			result.append(point)
		prev = point
		prev_inside = inside
	return result

func fill_shape(extent: Vector2, ratio: float) -> PackedVector2Array:
	var h = extent.y
	var w = extent.x
	var cap = minf(h * 0.625, w * 0.25)
	var inset = h * 0.17
	var left = inset
	var right = w - inset
	var top = inset
	var bottom = h - inset
	if ratio <= 0.0 or right <= left or bottom <= top:
		return PackedVector2Array()
	var shoulder = minf(cap * 0.78, (right - left) * 0.25)
	var points = PackedVector2Array([Vector2(left, h * 0.5), Vector2(left + shoulder, top), Vector2(right - shoulder, top), Vector2(right, h * 0.5), Vector2(right - shoulder, bottom), Vector2(left + shoulder, bottom)])
	return _clip_x(points, lerpf(left, right, clampf(ratio, 0.0, 1.0)), true)

func set_value_style(font: Font, alignment: int, scale_factor: float, outline: int, grouped: bool = true) -> void:
	value_font = font
	value_alignment = alignment
	value_scale = scale_factor
	value_outline = outline
	group_values = grouped
	queue_redraw()

func _format_amount(amount: float) -> String:
	var digits = str(roundi(amount))
	if not group_values:
		return digits
	var result = ""
	for i in range(digits.length()):
		if i > 0 and (digits.length() - i) % 3 == 0:
			result += ","
		result += digits[i]
	return result

func value_text() -> String:
	return _format_amount(current) + " / " + _format_amount(maximum)

func value_font_size(font: Font, label: String, extent: Vector2) -> int:
	var pixels = clampi(roundi(extent.y * value_scale), 9, 24)
	var max_width = maxf(1.0, extent.x - extent.y * 1.25 - 8.0)
	while pixels > 9 and (font.get_height(pixels) > extent.y - 3.0 or font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, pixels).x > max_width):
		pixels -= 1
	return pixels

func _draw() -> void:
	var w = size.x
	var h = size.y
	if w < 2.0 or h < 2.0:
		return
	var cap = minf(h * 0.625, w * 0.25)
	if use_v2:
		_draw_v2_bar()
	else:
		draw_texture_rect_region(FRAME, Rect2(0, 0, cap, h), Rect2(0, 0, 40, 64))
		draw_texture_rect_region(FRAME, Rect2(cap, 0, w - cap * 2.0, h), Rect2(40, 0, 432, 64))
		draw_texture_rect_region(FRAME, Rect2(w - cap, 0, cap, h), Rect2(472, 0, 40, 64))
		# Only the lost segment is white, never the remaining colored health.
		if (resource_kind == "Health" or resource_kind == "Barrier") and trail_ratio > shown_ratio + 0.00001:
			var inset = h * 0.17
			var start_white = lerpf(inset, w - inset, shown_ratio)
			var white = _clip_x(fill_shape(size, trail_ratio), start_white, false)
			if white.size() >= 3:
				draw_colored_polygon(white, Color("#f3eee8"))
		var points = fill_shape(size, shown_ratio)
		var fill: Texture2D = FILLS.get(resource_kind, FILLS["Health"])
		if points.size() >= 3:
			var inset = h * 0.17
			var tile_width = maxf(8.0, (h - inset * 2.0) * fill.get_width() / float(fill.get_height()))
			var start = inset
			var end = lerpf(inset, w - inset, shown_ratio)
			while start < end:
				var finish = minf(start + tile_width, end)
				var clipped = _clip_x(_clip_x(points, start, false), finish, true)
				if clipped.size() >= 3 and finish - start > 0.001:
					var uv = PackedVector2Array()
					for point in clipped:
						uv.append(Vector2(clampf((point.x - start) / tile_width, 0.0, 1.0), clampf((point.y - inset) / (h - inset * 2.0), 0.0, 1.0)))
					draw_polygon(clipped, PackedColorArray([Color.WHITE]), uv, fill)
				start = finish
	if show_value and h >= 16.0:
		var font: Font = value_font if value_font != null else get_theme_default_font()
		var label = value_text()
		var font_size = value_font_size(font, label, size)
		var extent = font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
		var x = (w - extent.x) * 0.5
		if value_alignment == HORIZONTAL_ALIGNMENT_RIGHT:
			x = maxf(cap + 4.0, w - cap - 7.0 - extent.x)
		var at = Vector2(x, (h - font.get_height(font_size)) * 0.5 + font.get_ascent(font_size))
		draw_string_outline(font, at, label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, value_outline, Color("#151217"))
		draw_string(font, at, label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color("#fff3df"))

# Three full-height slices preserve the caps; draw only the visible interval
# of the full-size fill rather than stretching the fill as values change.
func _v2_x(source_x: float) -> float:
	var cap: float = minf(size.y * 0.5, size.x * 0.5)
	if source_x <= 16.0:
		return source_x / 16.0 * cap
	if source_x >= 304.0:
		return size.x - (320.0 - source_x) / 16.0 * cap
	return lerpf(cap, size.x - cap, (source_x - 16.0) / 288.0)

func _v2_strip(key: String, clip_right: float) -> void:
	var texture: Texture2D = V2.texture("resource_bars/" + key)
	var cuts = [0.0, 16.0, 304.0, 320.0]
	for i in range(3):
		var x: float = _v2_x(cuts[i])
		var right: float = _v2_x(cuts[i + 1])
		var end_x: float = minf(right, clip_right)
		if end_x <= x or right <= x:
			continue
		var src_width: float = (cuts[i + 1] - cuts[i]) * (end_x - x) / (right - x)
		draw_texture_rect_region(texture, Rect2(x, 0, end_x - x, size.y), Rect2(cuts[i], 0, src_width, 32))

func _draw_v2_bar() -> void:
	_v2_strip("bar_track", size.x)
	var fill_key: String = "fill_" + str({"Health":"health", "Mana":"mana", "Barrier":"barrier", "EXP":"experience"}.get(resource_kind, "health"))
	var used: Rect2i = V2.bounds("resource_bars/" + fill_key)
	var left: float = _v2_x(float(used.position.x))
	var right: float = _v2_x(float(used.end.x))
	if (resource_kind == "Health" or resource_kind == "Barrier") and trail_ratio > shown_ratio + 0.00001:
		var a: float = lerpf(left, right, shown_ratio)
		var b: float = lerpf(left, right, trail_ratio)
		draw_rect(Rect2(a, size.y * 0.20, b - a, size.y * 0.60), Color("f3eee8"))
	if shown_ratio > 0.0:
		_v2_strip(fill_key, size.x if shown_ratio >= 1.0 else lerpf(left, right, shown_ratio))
	_v2_strip("bar_frame", size.x)
