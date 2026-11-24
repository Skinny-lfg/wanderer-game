extends Control
## Presentation-only navigation. No browser game state is loaded.
signal page_changed(page_id: String)

const IDS = ["camp", "inventory", "talents", "expedition", "combat", "codex"]
const TITLES = ["Camp", "Inventory", "Talents", "Expedition", "Combat", "Codex"]
const MARKS = ["I", "II", "III", "IV", "V", "VI"]
const SCENES = [
	preload("res://scenes/screens/camp.tscn"),
	preload("res://scenes/screens/inventory.tscn"),
	preload("res://scenes/screens/talents.tscn"),
	preload("res://scenes/screens/expedition.tscn"),
	preload("res://scenes/arena.tscn"),
	preload("res://scenes/screens/codex.tscn")
]
var active_page: String = ""
var current_screen: Node
var content: Control
var buttons: Dictionary = {}

func _ready() -> void:
	content = Control.new()
	content.name = "ScreenHost"
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(content)
	content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_build_navigation()
	show_page("camp")

func _style(bg: Color, edge: Color, bottom: int = 0) -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = edge
	style.border_width_bottom = bottom
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 7
	style.content_margin_bottom = 7
	return style

func _build_navigation() -> void:
	var bar = Panel.new()
	bar.name = "Navigation"
	add_child(bar)
	bar.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	bar.offset_top = -72
	bar.add_theme_stylebox_override("panel", _style(Color("101216"), Color("504631")))
	var edge = ColorRect.new()
	edge.color = Color("6c5739")
	edge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_child(edge)
	edge.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	edge.offset_bottom = 1
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 4)
	bar.add_child(row)
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	row.offset_left = 42
	row.offset_right = -42
	row.offset_top = 7
	row.offset_bottom = -7
	for i in range(IDS.size()):
		var button = Button.new()
		button.name = "Nav_" + str(IDS[i])
		button.text = str(MARKS[i]) + "   " + str(TITLES[i])
		button.tooltip_text = str(i + 1) + " — " + str(TITLES[i])
		button.toggle_mode = true
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.add_theme_font_size_override("font_size", 19)
		button.add_theme_color_override("font_color", Color("b3a89a"))
		button.add_theme_color_override("font_hover_color", Color("f3dfb0"))
		button.add_theme_color_override("font_pressed_color", Color("f3d399"))
		button.add_theme_stylebox_override("normal", _style(Color("15171a"), Color("15171a")))
		button.add_theme_stylebox_override("hover", _style(Color("29251f"), Color("98764a"), 1))
		button.add_theme_stylebox_override("pressed", _style(Color("282219"), Color("d8ad6b"), 3))
		button.add_theme_stylebox_override("hover_pressed", _style(Color("30291e"), Color("d8ad6b"), 3))
		var focus_style = StyleBoxFlat.new()
		focus_style.bg_color = Color(0, 0, 0, 0)
		focus_style.border_color = Color("9a7951")
		focus_style.set_border_width_all(1)
		button.add_theme_stylebox_override("focus", focus_style)
		button.pressed.connect(show_page.bind(str(IDS[i])))
		row.add_child(button)
		buttons[IDS[i]] = button

func show_page(page_id: String) -> bool:
	var index = IDS.find(page_id)
	if index == -1:
		return false
	if active_page != page_id:
		if is_instance_valid(current_screen):
			content.remove_child(current_screen)
			current_screen.queue_free()
		current_screen = SCENES[index].instantiate()
		content.add_child(current_screen)
		if current_screen is Control:
			current_screen.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		active_page = page_id
		page_changed.emit(page_id)
	for id in IDS:
		buttons[id].set_pressed_no_signal(id == active_page)
	return true

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode >= KEY_1 and event.keycode <= KEY_6:
			show_page(str(IDS[event.keycode - KEY_1]))
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_ESCAPE:
			show_page("camp")
			get_viewport().set_input_as_handled()
