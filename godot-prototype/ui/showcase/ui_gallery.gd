extends Control
const Tokens = preload("res://ui/theme/tokens.gd")
const ButtonScene = preload("res://ui/components/navigation/gothic_button.tscn")
const TabScene = preload("res://ui/components/navigation/gothic_tab.tscn")
const PanelScene = preload("res://ui/components/surfaces/gothic_panel.tscn")
const SlotScene = preload("res://ui/components/inventory/item_slot.tscn")
const TooltipScene = preload("res://ui/components/inventory/item_tooltip.tscn")
const ITEM = preload("res://assets/shell/dagger.png")
const CATEGORIES = ["Foundations", "Buttons", "Panels", "Navigation", "Item Slots", "Tooltips"]
var active_category: String = ""
var category_buttons: Dictionary = {}
var body: VBoxContainer
var title_label: Label
var scroll: ScrollContainer
var feedback: Label

func _label(value: String, font_size: int = 17, color: Color = Tokens.IVORY) -> Label:
	var label = Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label

func _heading(value: String) -> Label:
	var label = _label(value, 32)
	label.theme_type_variation = &"Heading"
	return label

func _vbox(host: Node, separation: int = 12) -> VBoxContainer:
	var stack = VBoxContainer.new()
	stack.add_theme_constant_override("separation", separation)
	host.add_child(stack)
	return stack

func _row(host: Node) -> HBoxContainer:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	host.add_child(row)
	return row

func _ready() -> void:
	var backdrop = ColorRect.new()
	backdrop.color = Tokens.BACKGROUND
	backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(backdrop)
	backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var outer = MarginContainer.new()
	add_child(outer)
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		outer.add_theme_constant_override("margin_" + side, 24)
	var frame = _vbox(outer, 14)
	frame.add_child(_heading("WANDERER  /  UI WORKSHOP"))
	frame.add_child(_label("STYLIZED GOTHIC     •     G2.1 / COMPONENT STUDY", 15, Tokens.GOLD))
	frame.add_child(HSeparator.new())
	var layout = _row(frame)
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var sidebar = _vbox(layout, 8)
	sidebar.custom_minimum_size.x = 210
	for category in CATEGORIES:
		var button = TabScene.instantiate()
		button.text = category
		button.pressed.connect(show_category.bind(category))
		sidebar.add_child(button)
		category_buttons[category] = button
	sidebar.add_child(_label("NEXT IN THE KIT", 13, Tokens.GOLD))
	var next = _label("Resource bars / talents\nRunes / map / combat HUD\nFeedback / settings", 14, Tokens.MUTED)
	sidebar.add_child(next)
	var right = _vbox(layout, 10)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_label = _heading("")
	right.add_child(title_label)
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right.add_child(scroll)
	body = _vbox(scroll, 18)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	feedback = _label("Independent design gallery — no game state", 14, Tokens.MUTED)
	frame.add_child(feedback)
	show_category("Foundations")

func show_category(category: String) -> bool:
	if not CATEGORIES.has(category):
		return false
	for child in body.get_children():
		body.remove_child(child)
		child.queue_free()
	active_category = category
	title_label.text = category
	scroll.scroll_vertical = 0
	for name in CATEGORIES:
		category_buttons[name].set_pressed_no_signal(name == category)
	match category:
		"Foundations": _foundations()
		"Buttons": _buttons()
		"Panels": _panels()
		"Navigation": _navigation()
		"Item Slots": _slots()
		"Tooltips": _tooltips()
	feedback.text = "Independent design gallery — no game state"
	return true

func _note(value: String) -> void:
	var label = _label(value, 15, Tokens.MUTED)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(label)

func _foundations() -> void:
	_note("Angular ironwork, painted bevels, aged gold and readable ivory. First visual candidate.")
	var row = _row(body)
	for entry in [["Charcoal", Tokens.BACKGROUND], ["Iron", Tokens.SURFACE], ["Frame", Tokens.FRAME], ["Gold", Tokens.GOLD], ["Ivory", Tokens.IVORY], ["Muted", Tokens.MUTED]]:
		var column = _vbox(row, 6)
		var swatch = ColorRect.new()
		swatch.color = entry[1]
		swatch.custom_minimum_size = Vector2(106, 68)
		column.add_child(swatch)
		column.add_child(_label(entry[0], 15))
		column.add_child(_label("#" + entry[1].to_html(false), 13, Tokens.MUTED))
	body.add_child(_heading("Beyond the veil"))
	body.add_child(_label("Prepare your equipment. Venture into the unknown.", 19))
	body.add_child(_label("UI text / 17 px • supporting text / 14 px", 14, Tokens.MUTED))
	_note("System font fallback for now. Licensed embedded typefaces are a later design decision.")

func _button(host: Node, value: String, variant: String, disabled: bool = false) -> Button:
	var node = ButtonScene.instantiate()
	node.text = value
	node.theme_type_variation = StringName(variant)
	node.disabled = disabled
	node.pressed.connect(func(): feedback.text = "Preview action: " + value)
	host.add_child(node)
	return node

func _buttons() -> void:
	_note("Interact to inspect hover, pressed and keyboard focus. Disabled is a real native state.")
	for entry in [["PrimaryButton", "Begin Expedition"], ["Button", "Equip Item"], ["DangerButton", "Abandon"]]:
		var row = _row(body)
		var live = _button(row, entry[1], entry[0])
		live.custom_minimum_size.x = 235
		_button(row, "Disabled", entry[0], true)
		var toggle = _button(row, "Selected", entry[0])
		toggle.toggle_mode = true
		toggle.button_pressed = true
	_note("Three action hierarchies use a shared button scene and theme variations.")

func _panels() -> void:
	_note("The same nine-slice frame stretches without deforming its bevels or angular corners.")
	var row = _row(body)
	for width in [230, 460]:
		var panel = PanelScene.instantiate()
		panel.custom_minimum_size = Vector2(width, 160)
		row.add_child(panel)
		var column = _vbox(panel)
		column.add_child(_heading("Iron frame"))
		column.add_child(_label("Resizable surface", 16, Tokens.MUTED))
	var modal = PanelScene.instantiate()
	body.add_child(modal)
	var content = _vbox(modal)
	content.add_child(_heading("Confirmation sample"))
	content.add_child(_label("No gameplay action will be taken."))
	var actions = _row(content)
	_button(actions, "Confirm", "PrimaryButton")
	_button(actions, "Cancel", "Button")

func _navigation() -> void:
	_note("Five permanent Camp tabs. Expedition and Combat are contextual screens, not tabs.")
	var row = _row(body)
	var group = ButtonGroup.new()
	group.allow_unpress = false
	for name in ["Camp", "Inventory", "Talents", "City Center", "Shrine"]:
		var button = TabScene.instantiate()
		button.text = name
		button.custom_minimum_size.x = 142
		button.button_group = group
		row.add_child(button)
		if name == "Camp":
			button.button_pressed = true
	var contextual = _row(body)
	_button(contextual, "Return to Camp", "Button")
	_button(contextual, "Begin Expedition", "PrimaryButton")
	_note("Interactive tab selection is a preview only; it does not change game scenes.")

func _slot(host: Node, rarity: int, art: Texture2D, label: String, equipped: bool = false, locked: bool = false, quantity: int = 1, selected: bool = false) -> Button:
	var column = _vbox(host, 6)
	var slot = SlotScene.instantiate()
	slot.item_art = art
	slot.rarity = rarity
	slot.equipped = equipped
	slot.locked = locked
	slot.quantity = quantity
	slot.button_pressed = selected
	column.add_child(slot)
	column.add_child(_label(label, 14, Tokens.MUTED))
	return slot

func _slots() -> void:
	_note("One item-slot scene; six rarity treatments and real selectable states.")
	var row = _row(body)
	for i in range(6):
		_slot(row, i, ITEM, Tokens.RARITY_NAMES[i])
	var states = _row(body)
	_slot(states, 1, null, "Empty")
	_slot(states, 3, ITEM, "Selected", false, false, 1, true)
	_slot(states, 4, ITEM, "Equipped", true)
	_slot(states, 2, ITEM, "Stacked", false, false, 12)
	_slot(states, 1, ITEM, "Locked", false, true)
	_note("E = equipped; LOCK = unavailable. Rarity is not communicated by color alone in this gallery.")

func _tooltips() -> void:
	_note("Sample content rendered by a reusable tooltip scene. These numbers are not Wanderer stats.")
	var row = _row(body)
	var first = TooltipScene.instantiate()
	row.add_child(first)
	var second = TooltipScene.instantiate()
	second.item_name = "Oathbound Relic"
	second.rarity = 5
	second.category = "Amulet"
	second.stat_lines = PackedStringArray(["+16 Maximum Health", "+4 Defense", "Sample unique effect"])
	row.add_child(second)
	_note("Comparison, positioning and live item data will be implemented in a later UI-kit stage.")
