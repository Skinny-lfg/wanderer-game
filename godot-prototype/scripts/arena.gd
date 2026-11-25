extends Node2D
## Visual sandbox only. No gameplay stats, damage or balance rules.

const BACKGROUND = preload("res://assets/arena/background.webp")
const HERO = preload("res://assets/arena/wanderer.webp")
const ENEMIES = [
	preload("res://assets/arena/berserker.png"),
	preload("res://assets/arena/caster.png"),
	preload("res://assets/arena/tank.png"),
	preload("res://assets/arena/vampire.png")
]
const ENEMY_NAMES = ["Berserker", "Caster", "Tank", "Vampire"]
const ENEMY_FEET = [Vector2(300, 420), Vector2(515, 365), Vector2(765, 365), Vector2(980, 420)]
const HERO_FEET = Vector2(640, 635)
var selected: int = -1
var kit: RefCounted
var resource_hud: Control
var enemy_bars: Array[Control] = []
var target_label: Label

func _ready() -> void:
	if kit != null:
		_build_preview_hud()
	queue_redraw()

func _build_preview_hud() -> void:
	var overlay = Control.new()
	overlay.name = "CombatUI"
	overlay.theme = kit.theme
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(overlay)
	resource_hud = kit.hud(overlay, Vector2(20, 478), 315)
	target_label = Label.new()
	target_label.text = "Select an enemy"
	target_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	target_label.position = Vector2(30, 24)
	target_label.add_theme_font_size_override("font_size", 18)
	overlay.add_child(target_label)
	for i in range(ENEMIES.size()):
		var rect = _sprite_rect(ENEMIES[i], ENEMY_FEET[i], Vector2(210, 250))
		var at = Vector2(ENEMY_FEET[i].x - 75, rect.position.y - 36)
		var name = Label.new()
		name.text = ENEMY_NAMES[i]
		name.mouse_filter = Control.MOUSE_FILTER_IGNORE
		name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name.add_theme_font_size_override("font_size", 14)
		name.add_theme_constant_override("outline_size", 4)
		name.add_theme_color_override("font_outline_color", Color("#111217"))
		overlay.add_child(name)
		name.position = at
		name.size = Vector2(150, 20)
		var bar = kit.resource(overlay, "Health", at + Vector2(0, 21), Vector2(150, 12), [72, 100, 85, 60][i], 100, false)
		enemy_bars.append(bar)


func select_target(index: int) -> bool:
	if index < 0 or index >= ENEMIES.size():
		return false
	selected = index
	if is_instance_valid(target_label):
		target_label.text = "Target: " + str(ENEMY_NAMES[selected]) + "  •  Preview"
	queue_redraw()
	return true

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		for i in range(ENEMIES.size() - 1, -1, -1):
			if _sprite_rect(ENEMIES[i], ENEMY_FEET[i], Vector2(210, 250)).has_point(get_local_mouse_position()):
				select_target(i)
				break

func _sprite_rect(texture: Texture2D, feet: Vector2, limit: Vector2) -> Rect2:
	var original := texture.get_size()
	var scale_factor := minf(limit.x / original.x, limit.y / original.y)
	var extent := original * scale_factor
	return Rect2(feet - Vector2(extent.x * 0.5, extent.y), extent)

func _draw_shadow(feet: Vector2, radius: float) -> void:
	for i in range(10, 0, -1):
		var points := PackedVector2Array()
		for j in range(40):
			var angle := TAU * float(j) / 40.0
			var t := float(i) / 10.0
			points.append(feet + Vector2(cos(angle) * radius * t, sin(angle) * radius * 0.24 * t))
		draw_colored_polygon(points, Color(0.0, 0.0, 0.0, 0.045))

func _draw() -> void:
	draw_texture_rect(BACKGROUND, Rect2(0, 0, 1280, 720), false)
	draw_rect(Rect2(0, 0, 1280, 720), Color(0.02, 0.025, 0.04, 0.32))
	# Far enemies first, then nearer enemies and player.
	for i in [1, 2, 0, 3]:
		var feet: Vector2 = ENEMY_FEET[i]
		_draw_shadow(feet, 75.0)
		if selected == i:
			draw_arc(feet, 53.0, 0.0, TAU, 64, Color(0.95, 0.72, 0.25), 3.0, true)
		draw_texture_rect(ENEMIES[i], _sprite_rect(ENEMIES[i], feet, Vector2(210, 250)), false)
	_draw_shadow(HERO_FEET, 82.0)
	draw_texture_rect(HERO, _sprite_rect(HERO, HERO_FEET, Vector2(250, 300)), false)
	if kit != null:
		return
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(30, 42), "WANDERER / ARENA PROTOTYPE", HORIZONTAL_ALIGNMENT_LEFT, -1, 25, Color(0.91, 0.80, 0.58))
	var status := "Select an enemy" if selected == -1 else "Target: " + str(ENEMY_NAMES[selected])
	draw_string(font, Vector2(30, 73), status, HORIZONTAL_ALIGNMENT_LEFT, -1, 19, Color.WHITE)
	draw_string(font, Vector2(30, 690), "Visual sandbox - existing hero art is a placeholder", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.WHITE)
