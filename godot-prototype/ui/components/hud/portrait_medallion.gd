extends Control
const FRAME = preload("res://ui/assets/resources/g22f/portrait_frame.png")
const BADGE = preload("res://ui/assets/resources/g22f/level_badge.png")
var portrait: Texture2D
var level: int = 1

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(144, 164)
	resized.connect(queue_redraw)

func set_identity(image: Texture2D, new_level: int) -> void:
	portrait = image
	level = maxi(1, new_level)
	queue_redraw()

func _draw() -> void:
	var side = minf(size.x, size.y * 0.87)
	var origin = Vector2((size.x - side) * 0.5, 0)
	var center = origin + Vector2.ONE * side * 0.5
	var radius = side * 0.385
	draw_circle(center, radius, Color("#17191e"))
	if portrait != null:
		var points = PackedVector2Array()
		var uv = PackedVector2Array()
		var texture_extent = portrait.get_size()
		var crop = Vector2(minf(1.0, texture_extent.y / texture_extent.x), minf(1.0, texture_extent.x / texture_extent.y))
		for i in range(64):
			var angle = TAU * float(i) / 64.0
			var direction = Vector2(cos(angle), sin(angle))
			points.append(center + direction * radius)
			uv.append(Vector2(0.5, 0.5) + direction * crop * 0.5)
		draw_polygon(points, PackedColorArray([Color.WHITE]), uv, portrait)
	draw_texture_rect(FRAME, Rect2(origin, Vector2.ONE * side), false)
	var badge_side = side * 0.36
	var badge_center = center + Vector2(0, side * 0.45)
	draw_texture_rect(BADGE, Rect2(badge_center - Vector2.ONE * badge_side * 0.5, Vector2.ONE * badge_side), false)
	var font = get_theme_default_font()
	var font_size = maxi(12, roundi(badge_side * 0.35))
	var label = str(level)
	var text_size = font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
	var at = badge_center + Vector2(-text_size.x * 0.5, font.get_ascent(font_size) - font.get_height(font_size) * 0.5)
	draw_string_outline(font, at, label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, 3, Color("#151217"))
	draw_string(font, at, label, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Color("#f2e8d6"))
