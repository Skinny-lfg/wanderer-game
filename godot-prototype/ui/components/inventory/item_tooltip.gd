extends PanelContainer
const Tokens = preload("res://ui/theme/tokens.gd")
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
