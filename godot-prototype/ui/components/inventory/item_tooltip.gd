extends PanelContainer
const Tokens = preload("res://ui/theme/tokens.gd")
const Normalize = preload("res://ui/theme/asset_normalization.gd")
var painted_style: StyleBoxTexture
var portrait_frame: Texture2D
var portrait_art: Texture2D
var ornament: Texture2D
var detailed: bool = false
var organized: bool = false
var primary_value: String = ""
var primary_label: String = ""
var attributes: Array[Dictionary] = []
var changes: Array[Dictionary] = []
var unique_title: String = "Unique effect"
var equipped_caption: bool = false
var sections: Dictionary = {}
var comparison_title: String = ""
var comparison_lines: PackedStringArray = PackedStringArray()
var unique_effect: String = ""
var content_stack: VBoxContainer
var edge_ornament: Sprite2D
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
		if organized:
			_build_organized()
		else:
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

func _portrait(side: int, framed: bool = true) -> Control:
	var holder = Control.new()
	holder.custom_minimum_size = Vector2(side, side)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if framed and portrait_frame != null:
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
			var normalized = Normalize.fit_icon(image, Vector2i(128, 128), 84 if framed else 116)
			var art = TextureRect.new()
			art.name = "ItemArtwork"
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

func _section(host: Node, key: String, separation: int = 4) -> VBoxContainer:
	var group = VBoxContainer.new()
	group.add_theme_constant_override("separation", separation)
	host.add_child(group)
	sections[key] = group
	return group

func _aligned_stat(host: Node, label_text: String, value: String, value_color: Color) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	host.add_child(row)
	var name = _wrap_label(label_text, Tokens.IVORY, 15)
	row.add_child(name)
	var amount = _label(value, value_color, 15)
	amount.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(amount)

func _position_edge_ornament() -> void:
	if is_instance_valid(edge_ornament):
		edge_ornament.position = Vector2(size.x * 0.5, 10.0)

func _attach_edge_ornament() -> void:
	if rarity != 5 or ornament == null:
		return
	# A Sprite2D is not a Control, so PanelContainer does not allocate a row
	# for the crest. It follows the upper edge as the window changes size.
	edge_ornament = Sprite2D.new()
	edge_ornament.name = "TopEdgeOrnament"
	edge_ornament.texture = ornament
	var scale_factor = 58.0 / maxf(1.0, ornament.get_width())
	edge_ornament.scale = Vector2.ONE * scale_factor
	add_child(edge_ornament)
	resized.connect(_position_edge_ornament)
	_position_edge_ornament()

func _build_organized() -> void:
	var style = painted_style.duplicate() as StyleBoxTexture
	style.content_margin_left = 22
	style.content_margin_right = 22
	style.content_margin_top = 29 if rarity == 5 and ornament != null else 20
	style.content_margin_bottom = 20
	add_theme_stylebox_override("panel", style)
	custom_minimum_size.x = 310 if detailed else 280
	var accent: Color = Tokens.RARITY_COLORS[rarity]
	var stack = VBoxContainer.new()
	stack.add_theme_constant_override("separation", 8)
	add_child(stack)
	content_stack = stack
	var header = _section(stack, "header", 3)
	if equipped_caption:
		header.add_child(_label("CURRENTLY EQUIPPED", Tokens.MUTED, 11))
	var title_row = HBoxContainer.new()
	title_row.add_theme_constant_override("separation", 8)
	header.add_child(title_row)
	if portrait_art != null:
		var art = _portrait(64 if detailed else 54, false)
		art.name = "UnframedArtwork"
		art.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		title_row.add_child(art)
		sections["artwork"] = art
	var names = VBoxContainer.new()
	names.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	names.alignment = BoxContainer.ALIGNMENT_CENTER
	names.add_theme_constant_override("separation", 3)
	title_row.add_child(names)
	names.add_child(_wrap_label(item_name, accent, 21 if detailed else 19))
	names.add_child(_wrap_label(Tokens.RARITY_NAMES[rarity] + " / " + category, Tokens.MUTED, 13))
	_separator(stack)
	var has_primary = not primary_value.is_empty() and not primary_label.is_empty()
	if has_primary:
		var primary = _section(stack, "primary", 1)
		primary.add_child(_label(primary_value, Tokens.IVORY, 30))
		primary.add_child(_wrap_label(primary_label, Tokens.MUTED, 13))
	if not attributes.is_empty():
		if has_primary:
			_separator(stack)
		var modifiers = _section(stack, "attributes")
		modifiers.add_child(_label("ATTRIBUTES", Tokens.MUTED, 11))
		for entry in attributes:
			_aligned_stat(modifiers, str(entry.get("label", "")), str(entry.get("value", "")), Tokens.IVORY)
	elif not has_primary:
		var modifiers = _section(stack, "attributes")
		for entry in stat_lines:
			modifiers.add_child(_wrap_label(entry, Tokens.IVORY, 15))
	if not unique_effect.is_empty():
		var line = ColorRect.new()
		line.color = accent.darkened(0.45)
		line.custom_minimum_size.y = 1
		line.mouse_filter = Control.MOUSE_FILTER_IGNORE
		stack.add_child(line)
		var effect = _section(stack, "unique")
		effect.add_child(_wrap_label(unique_title, accent, 17))
		effect.add_child(_wrap_label(unique_effect, Tokens.IVORY, 14))
	if not changes.is_empty():
		_separator(stack)
		var comparison = _section(stack, "comparison")
		comparison.add_child(_wrap_label(comparison_title, Tokens.MUTED, 11))
		for entry in changes:
			var delta: float = float(entry.get("delta", 0.0))
			var color = Color("#8bc88b") if delta > 0 else (Color("#dc817b") if delta < 0 else Tokens.MUTED)
			_aligned_stat(comparison, str(entry.get("label", "")), str(entry.get("value", "")), color)
	if not description.is_empty():
		_separator(stack)
		var lore = _section(stack, "description")
		lore.add_child(_wrap_label(description, Tokens.MUTED, 13))
	_attach_edge_ornament()
