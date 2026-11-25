extends PanelContainer
const Tokens = preload("res://ui/theme/tokens.gd")
const Normalize = preload("res://ui/theme/asset_normalization.gd")
var painted_style: StyleBoxTexture
var portrait_frame: Texture2D
var portrait_art: Texture2D
var ornament: Texture2D
var detailed: bool = false
var comparison_title: String = ""
var comparison_lines: PackedStringArray = PackedStringArray()
var unique_effect: String = ""
var content_stack: VBoxContainer
@export var item_name: String = "Forgotten Blade"
@export_range(0, 5) var rarity: int = 3
@export var category: String = "One-handed sword"
@export var description: String = "Illustrative item — no gameplay data."
@export var stat_lines: PackedStringArray = PackedStringArray(["24–32 Damage", "+8 Strength", "+5 Critical Rating"])

func _label(value: String, color: Color, font_size: int) -> Label:
	var label = Label.new()
	label.text = value
	label.add_theme_color_override("font_color", color)
	label.add_theme_font_size_override("font_size", font_size)
	return label

func _ready() -> void:
	if painted_style != null:
		_build_painted()
		return
	var stack = VBoxContainer.new()
	stack.add_theme_constant_override("separation", 7)
	add_child(stack)
	stack.add_child(_label(item_name, Tokens.RARITY_COLORS[rarity], 24))
	stack.add_child(_label(Tokens.RARITY_NAMES[rarity] + " / " + category, Tokens.MUTED, 15))
	stack.add_child(HSeparator.new())
	for value in stat_lines:
		stack.add_child(_label(value, Tokens.IVORY, 17))
	stack.add_child(HSeparator.new())
	var desc = _label(description, Tokens.MUTED, 14)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	stack.add_child(desc)

func _wrap_label(value: String, color: Color, font_size: int) -> Label:
	var label = _label(value, color, font_size)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return label

func _separator(host: Node) -> void:
	var line = ColorRect.new()
	line.color = Color("#6a5944")
	line.custom_minimum_size.y = 1
	line.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(line)

func _portrait(side: int) -> Control:
	var holder = Control.new()
	holder.custom_minimum_size = Vector2(side, side)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if portrait_frame != null:
		var frame = TextureRect.new()
		frame.texture = portrait_frame
		frame.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		frame.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		frame.size = Vector2(side, side)
		frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
		holder.add_child(frame)
	if portrait_art != null:
		var image = portrait_art.get_image()
		if image != null and not image.is_empty():
			image.convert(Image.FORMAT_RGBA8)
			var normalized = Normalize.fit_icon(image, Vector2i(128, 128), 84)
			var art = TextureRect.new()
			art.texture = ImageTexture.create_from_image(normalized)
			art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			art.size = Vector2(side, side)
			art.mouse_filter = Control.MOUSE_FILTER_IGNORE
			holder.add_child(art)
	return holder

func _build_painted() -> void:
	add_theme_stylebox_override("panel", painted_style)
	custom_minimum_size.x = 335 if detailed else 300
	var accent: Color = Tokens.RARITY_COLORS[rarity]
	var stack = VBoxContainer.new()
	stack.add_theme_constant_override("separation", 8)
	add_child(stack)
	content_stack = stack
	if detailed and ornament != null:
		var crest = TextureRect.new()
		crest.texture = ornament
		crest.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		crest.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		crest.custom_minimum_size = Vector2(0, 32)
		crest.mouse_filter = Control.MOUSE_FILTER_IGNORE
		stack.add_child(crest)
	var header = HBoxContainer.new()
	header.add_theme_constant_override("separation", 9)
	stack.add_child(header)
	header.add_child(_portrait(88 if detailed else 56))
	var names = VBoxContainer.new()
	names.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	names.alignment = BoxContainer.ALIGNMENT_CENTER
	names.add_theme_constant_override("separation", 3)
	header.add_child(names)
	names.add_child(_wrap_label(item_name, accent, 22 if detailed else 19))
	names.add_child(_wrap_label(Tokens.RARITY_NAMES[rarity] + " / " + category, Tokens.MUTED, 13))
	_separator(stack)
	for i in range(stat_lines.size()):
		stack.add_child(_wrap_label(stat_lines[i], Tokens.IVORY, 19 if i == 0 and detailed else 16))
	if not unique_effect.is_empty():
		_separator(stack)
		stack.add_child(_label("UNIQUE EFFECT", accent, 12))
		stack.add_child(_wrap_label(unique_effect, Tokens.IVORY, 15))
	if not comparison_lines.is_empty():
		_separator(stack)
		stack.add_child(_wrap_label(comparison_title, Tokens.MUTED, 13))
		for entry in comparison_lines:
			var color = Color("#8bc88b") if entry.begins_with("+") else (Color("#dc817b") if entry.begins_with("-") else Tokens.MUTED)
			stack.add_child(_wrap_label(entry, color, 15))
	if not description.is_empty():
		_separator(stack)
		stack.add_child(_wrap_label(description, Tokens.MUTED, 13))
