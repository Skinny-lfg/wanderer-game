extends Control
const Tokens = preload("res://ui/theme/tokens.gd")
const PaintedPack = preload("res://ui/theme/painted_button_pack.gd")
const FramePack = preload("res://ui/theme/painted_frame_pack.gd")
const NavigationPack = preload("res://ui/theme/painted_navigation_pack.gd")
const SlotPack = preload("res://ui/theme/painted_slot_pack.gd")
const ButtonScene = preload("res://ui/components/navigation/gothic_button.tscn")
const TabScene = preload("res://ui/components/navigation/gothic_tab.tscn")
const PanelScene = preload("res://ui/components/surfaces/gothic_panel.tscn")
const SlotScene = preload("res://ui/components/inventory/item_slot.tscn")
const TooltipScene = preload("res://ui/components/inventory/item_tooltip.tscn")
const ITEM = preload("res://assets/shell/dagger.png")
const BAG_ART = [ITEM, preload("res://assets/shell/helmet.png"), preload("res://assets/shell/chest.png"), preload("res://assets/shell/boots.png"), preload("res://assets/shell/gloves.png"), preload("res://assets/shell/ring.png"), preload("res://assets/shell/charm.png"), preload("res://assets/shell/shield.png")]
const CATEGORIES = ["Foundations", "Buttons", "Panels", "Navigation", "Item Slots", "Tooltips"]
var active_category: String = ""
var category_buttons: Dictionary = {}
var body: VBoxContainer
var title_label: Label
var scroll: ScrollContainer
var feedback: Label
var painted_pack = PaintedPack.new()
var frame_pack = FramePack.new()
var navigation_pack = NavigationPack.new()
var slot_pack = SlotPack.new()
var prefer_slots: bool = true
var slot_status: Label
var bag_slots: Array[Button] = []
var bag_size: int = 64
var gallery_zoom: OptionButton
const GALLERY_BASE_SIZE = Vector2i(1440, 900)
const GALLERY_MAX_WINDOW = Vector2i(2560, 1600)
const GALLERY_ZOOM = [0.85, 1.0, 1.15, 1.3, 1.5]
var prefer_navigation: bool = true
var navigation_status: Label
var demo_tabs: Array[Button] = []
var prefer_frames: bool = true
var frame_status: Label
var demo_panels: Array[PanelContainer] = []
var prefer_painted: bool = true
var active_pack_label: Label
var demo_buttons: Dictionary = {}
var prefer_tooltips: bool = true
var tooltip_status: Label
var demo_tooltips: Array[PanelContainer] = []
var demo_tooltip_slot: Button
var tooltip_comparison: HBoxContainer

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
	var header = _row(frame)
	var workshop_title = _heading("WANDERER  /  UI WORKSHOP")
	workshop_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(workshop_title)
	gallery_zoom = OptionButton.new()
	for factor in GALLERY_ZOOM:
		gallery_zoom.add_item("UI " + str(roundi(factor * 100.0)) + "%")
	gallery_zoom.select(1)
	gallery_zoom.item_selected.connect(_set_gallery_zoom)
	header.add_child(gallery_zoom)
	var fit = Button.new()
	fit.text = "Fit screen"
	fit.pressed.connect(_fit_gallery_window)
	header.add_child(fit)
	frame.add_child(_label("STYLIZED GOTHIC     •     G2.2E / TOOLTIP ART STUDY", 15, Tokens.GOLD))
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
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right.add_child(scroll)
	body = _vbox(scroll, 18)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	feedback = _label("Independent design gallery — no game state", 14, Tokens.MUTED)
	frame.add_child(feedback)
	painted_pack.load_pack()
	frame_pack.load_pack()
	navigation_pack.load_pack()
	slot_pack.load_pack()
	show_category("Foundations")
	call_deferred("_configure_gallery_window")

func _is_standalone_gallery() -> bool:
	return get_tree().current_scene == self and DisplayServer.get_name() != "headless"

func _configure_gallery_window() -> void:
	# Keep game shell and programmatic screenshot/smoke test window sizes unchanged.
	if not _is_standalone_gallery():
		return
	var window = get_window()
	window.content_scale_size = GALLERY_BASE_SIZE
	window.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	window.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_EXPAND
	window.content_scale_factor = 1.0
	_fit_gallery_window()

func _set_gallery_zoom(index: int) -> void:
	if _is_standalone_gallery() and index >= 0 and index < GALLERY_ZOOM.size():
		get_window().content_scale_factor = GALLERY_ZOOM[index]

func _fit_gallery_window() -> void:
	if not _is_standalone_gallery():
		return
	var window = get_window()
	var usable = DisplayServer.screen_get_usable_rect(window.current_screen)
	if not usable.has_area():
		return
	var target = Vector2i(Vector2(usable.size) * 0.90)
	target.x = mini(target.x, GALLERY_MAX_WINDOW.x)
	target.y = mini(target.y, GALLERY_MAX_WINDOW.y)
	window.size = target
	window.position = usable.position + Vector2i(Vector2(usable.size - target) * 0.5)

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
	demo_buttons.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2A Painted PNG")
	selector.add_item("G2.1 Original SVG")
	selector.select(0 if prefer_painted else 1)
	selector.item_selected.connect(_select_button_pack)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(_reload_painted)
	toolbar.add_child(reload)
	active_pack_label = _label("", 15, Tokens.GOLD)
	toolbar.add_child(active_pack_label)
	var use_painted = prefer_painted and painted_pack.is_ready()
	active_pack_label.text = "16 / 16 PNGs loaded" if use_painted else "Original SVG active"
	if prefer_painted and not use_painted:
		_note("Painted artwork not installed: " + painted_pack.problem + ". Extract the G2.2A ZIP into the repository root and click Reload artwork.")
	else:
		_note("Live buttons show hover, held press and focus. The other columns show fixed state samples.")
	var header = _row(body)
	for heading in ["Live / Normal", "Hover sample", "Pressed sample", "Disabled"]:
		var label = _label(heading, 14, Tokens.MUTED)
		label.custom_minimum_size.x = 208
		header.add_child(label)
	for entry in [["primary", "PrimaryButton", "Begin Expedition"], ["secondary", "Button", "Equip Item"], ["danger", "DangerButton", "Abandon"], ["ghost", "Button", "View Details"]]:
		var row = _row(body)
		var family: String = entry[0]
		var buttons: Array[Button] = []
		for state in ["normal", "hover", "pressed", "disabled"]:
			var node = _button(row, entry[2], entry[1], state == "disabled")
			node.custom_minimum_size = Vector2(208, 54)
			if use_painted:
				painted_pack.apply_to(node, family)
			elif family == "ghost":
				node.modulate = Color(0.72, 0.72, 0.72)
			if state == "hover" or state == "pressed":
				var sample_style = node.get_theme_stylebox(state)
				for override_state in ["normal", "hover", "pressed", "hover_pressed", "disabled"]:
					node.add_theme_stylebox_override(override_state, sample_style)
				node.mouse_filter = Control.MOUSE_FILTER_IGNORE
				node.focus_mode = Control.FOCUS_NONE
			buttons.append(node)
		demo_buttons[family] = buttons
	_note("Nine-slice starting margins: 59 / 16 px in source; 42 / 11 px at logical scale. Focus is provisional. Gameplay is not connected.")

func _select_button_pack(index: int) -> void:
	prefer_painted = index == 0
	# Defer because the emitting OptionButton is rebuilt by show_category.
	call_deferred("show_category", "Buttons")

func _reload_painted() -> void:
	painted_pack.load_pack()
	prefer_painted = true
	call_deferred("show_category", "Buttons")

func _panels() -> void:
	demo_panels.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2B Painted PNG")
	selector.add_item("G2.1 Original SVG")
	selector.select(0 if prefer_frames else 1)
	selector.item_selected.connect(_select_frame_pack)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(_reload_frames)
	toolbar.add_child(reload)
	var use_painted = prefer_frames and frame_pack.is_ready()
	frame_status = _label("14 / 14 PNGs loaded" if use_painted else "Original SVG active", 15, Tokens.GOLD)
	toolbar.add_child(frame_status)
	if not use_painted:
		if prefer_frames:
			_note("Frame pack not installed: " + frame_pack.problem + ". Extract G2.2B ZIP at repository root.")
		_panels_original()
		return
	_note("Painted frames / scroll to inspect all samples. Center ornaments stay at a fixed size.")
	var first = _row(body)
	_frame_sample(first, "standard", "Standard", Vector2(285, 140), "Everyday content")
	_frame_sample(first, "featured", "Featured", Vector2(285, 140), "Important rewards", "crest")
	_frame_sample(first, "modal", "Modal", Vector2(330, 140), "Confirm or cancel", "modal_crest")
	var second = _row(body)
	_frame_sample(second, "tooltip", "Tooltip", Vector2(300, 112), "Item information")
	_frame_sample(second, "compact", "Compact", Vector2(220, 96), "Counters")
	_frame_sample(second, "standard", "Wide standard", Vector2(380, 112), "Same texture, wider")
	var states = _row(body)
	_frame_sample(states, "standard", "Normal", Vector2(255, 100), "")
	_frame_sample(states, "focused", "Focused", Vector2(255, 100), "")
	_frame_sample(states, "disabled", "Disabled", Vector2(255, 100), "")
	var art = _row(body)
	_art_sample(art, "portrait", "Portrait / fixed aspect", Vector2(190, 220))
	_art_sample(art, "banner", "Banner / fixed aspect", Vector2(530, 110))
	var dividers = _row(body)
	_art_sample(dividers, "divider_horizontal", "Horizontal divider", Vector2(290, 44))
	_art_sample(dividers, "section_ornament", "Section ornament", Vector2(290, 55))
	_art_sample(dividers, "divider_vertical", "Vertical divider", Vector2(26, 175))
	_note("Initial nine-slice margins and extracted art are candidates, not final approval. No game screens changed.")

func _frame_sample(host: Node, key: String, caption_text: String, extent: Vector2, detail: String, ornament: String = "") -> void:
	var column = _vbox(host, 5)
	var holder = Control.new()
	holder.custom_minimum_size = extent + Vector2(0, 22)
	column.add_child(holder)
	var panel = PanelScene.instantiate()
	panel.position = Vector2(0, 22)
	panel.size = extent
	holder.add_child(panel)
	frame_pack.apply_to(panel, key)
	demo_panels.append(panel)
	var content = _vbox(panel, 4)
	var label = _label(caption_text, 19)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	content.add_child(label)
	if detail != "":
		var sub = _label(detail, 14, Tokens.MUTED)
		sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		content.add_child(sub)
	if ornament != "":
		var crest = TextureRect.new()
		crest.texture = frame_pack.textures[ornament]
		crest.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		crest.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		crest.mouse_filter = Control.MOUSE_FILTER_IGNORE
		crest.size = Vector2(120, 52)
		crest.position = Vector2((extent.x - 120) * 0.5, 0)
		holder.add_child(crest)

func _art_sample(host: Node, key: String, caption_text: String, extent: Vector2) -> void:
	var column = _vbox(host, 5)
	var picture = TextureRect.new()
	picture.texture = frame_pack.textures[key]
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.custom_minimum_size = extent
	column.add_child(picture)
	column.add_child(_label(caption_text, 14, Tokens.MUTED))

func _select_frame_pack(index: int) -> void:
	prefer_frames = index == 0
	call_deferred("show_category", "Panels")

func _reload_frames() -> void:
	frame_pack.load_pack()
	prefer_frames = true
	call_deferred("show_category", "Panels")

func _panels_original() -> void:
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
	demo_tabs.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2C Painted PNG")
	selector.add_item("G2.1 Original SVG")
	selector.select(0 if prefer_navigation else 1)
	selector.item_selected.connect(_select_navigation_pack)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(_reload_navigation)
	toolbar.add_child(reload)
	var use_painted = prefer_navigation and navigation_pack.is_ready()
	navigation_status = _label("11 / 11 PNGs loaded" if use_painted else "Original SVG active", 15, Tokens.GOLD)
	toolbar.add_child(navigation_status)
	if not use_painted:
		if prefer_navigation:
			_note("Navigation pack not installed: " + navigation_pack.problem + ". Extract G2.2C ZIP at repository root.")
		_navigation_original()
		return
	_note("Main navigation — click a tab to change selection. The five tabs form a shared rail.")
	_navigation_rail(body, false)
	_note("Compact icon-only alternative")
	_navigation_rail(body, true)
	_note("State samples — fixed visual states for comparison")
	var row = _row(body)
	row.add_theme_constant_override("separation", 5)
	for state in NavigationPack.STATES:
		var col = _vbox(row, 4)
		var node = TabScene.instantiate()
		navigation_pack.apply_to(node, "inventory")
		node.custom_minimum_size.x = 170
		node.disabled = state == "disabled"
		var style = navigation_pack.style_for(state)
		for key in ["normal", "hover", "pressed", "hover_pressed", "disabled"]:
			node.add_theme_stylebox_override(key, style)
		node.mouse_filter = Control.MOUSE_FILTER_IGNORE
		node.focus_mode = Control.FOCUS_NONE
		col.add_child(node)
		var caption = _label(state.capitalize(), 14, Tokens.MUTED)
		caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		col.add_child(caption)
	_note("Talent notification is a sample count, not actual available talent points. Expedition and Combat remain contextual.")
	_navigation_ornament()

func _navigation_ornament() -> void:
	var ornament = TextureRect.new()
	ornament.texture = navigation_pack.textures["rail_ornament"]
	ornament.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	ornament.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	ornament.custom_minimum_size = Vector2(250, 44)
	body.add_child(ornament)

func _navigation_rail(host: Node, compact: bool) -> void:
	var rail = PanelContainer.new()
	var surface = StyleBoxFlat.new()
	surface.bg_color = Color("#18191e")
	surface.border_color = Color("#756044")
	surface.border_width_top = 1
	surface.border_width_bottom = 1
	rail.add_theme_stylebox_override("panel", surface)
	host.add_child(rail)
	var row = _row(rail)
	row.add_theme_constant_override("separation", 0)
	var group = ButtonGroup.new()
	group.allow_unpress = false
	for id in NavigationPack.IDS:
		var tab = TabScene.instantiate()
		tab.button_group = group
		navigation_pack.apply_to(tab, id, compact)
		row.add_child(tab)
		tab.pressed.connect(func(): feedback.text = "Preview navigation: " + id)
		if id == "inventory":
			tab.button_pressed = true
		if not compact:
			demo_tabs.append(tab)
		if id == "talents":
			var badge = Label.new()
			badge.text = "3"
			badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			badge.add_theme_font_size_override("font_size", 13)
			badge.add_theme_color_override("font_color", Color("#fff0d4"))
			var style = StyleBoxFlat.new()
			style.bg_color = Color("#9e302b")
			style.border_color = Color("#df9963")
			style.set_border_width_all(1)
			style.set_corner_radius_all(9)
			badge.add_theme_stylebox_override("normal", style)
			badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
			tab.add_child(badge)
			badge.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
			badge.offset_left = -23
			badge.offset_right = -4
			badge.offset_top = 1
			badge.offset_bottom = 20

func _select_navigation_pack(index: int) -> void:
	prefer_navigation = index == 0
	call_deferred("show_category", "Navigation")

func _reload_navigation() -> void:
	navigation_pack.load_pack()
	prefer_navigation = true
	call_deferred("show_category", "Navigation")

func _navigation_original() -> void:
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
	if prefer_slots and slot_pack.is_ready():
		slot.painted_textures = slot_pack.textures
	column.add_child(slot)
	column.add_child(_label(label, 14, Tokens.MUTED))
	return slot

func _slots() -> void:
	bag_slots.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2D Painted PNG")
	selector.add_item("G2.1 Original slots")
	selector.select(0 if prefer_slots else 1)
	selector.item_selected.connect(func(index: int):
		prefer_slots = index == 0
		call_deferred("show_category", "Item Slots")
	)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(func():
		slot_pack.load_pack()
		prefer_slots = true
		call_deferred("show_category", "Item Slots")
	)
	toolbar.add_child(reload)
	var use_painted = prefer_slots and slot_pack.is_ready()
	slot_status = _label("10 / 10 PNGs loaded" if use_painted else "Original slots active", 15, Tokens.GOLD)
	toolbar.add_child(slot_status)
	_note("Normalized slot bodies and common safe area — hover or click to select. " + ("" if use_painted or not prefer_slots else slot_pack.problem))
	var row = _row(body)
	for i in range(6):
		_slot(row, i, ITEM, Tokens.RARITY_NAMES[i])
	var states = _row(body)
	_slot(states, 1, null, "Empty")
	_slot(states, 3, ITEM, "Selected", false, false, 1, true)
	_slot(states, 4, ITEM, "Equipped", true)
	_slot(states, 2, ITEM, "Stacked", false, false, 12)
	_slot(states, 1, ITEM, "Locked", false, true)
	_note("Dense bag preview — 30 sample items in 48 slots. Existing item art, not real inventory data.")
	var sizes = _row(body)
	sizes.add_child(_label("Slot size", 15))
	var choice = OptionButton.new()
	for px in [48, 64, 80]:
		choice.add_item(str(px) + " px", px)
	choice.select([48, 64, 80].find(bag_size))
	choice.item_selected.connect(func(index: int):
		bag_size = choice.get_item_id(index)
		for node in bag_slots:
			node.custom_minimum_size = Vector2(bag_size, bag_size)
			node.queue_redraw()
	)
	sizes.add_child(choice)
	var grid = GridContainer.new()
	grid.columns = 8
	grid.add_theme_constant_override("h_separation", 4)
	grid.add_theme_constant_override("v_separation", 4)
	grid.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	body.add_child(grid)
	var group = ButtonGroup.new()
	group.allow_unpress = true
	var rarities = [0, 1, 1, 2, 1, 3, 2, 4, 1, 0, 2, 1, 3, 2, 5, 1, 0, 2, 3, 1, 4, 2, 1, 0, 3, 2, 1, 5, 4, 2]
	for i in range(48):
		var node = SlotScene.instantiate()
		node.custom_minimum_size = Vector2(bag_size, bag_size)
		node.button_group = group
		if i < rarities.size():
			node.rarity = rarities[i]
			node.item_art = BAG_ART[i % BAG_ART.size()]
			node.quantity = 12 if i == 11 else 1
		if use_painted:
			node.painted_textures = slot_pack.textures
		grid.add_child(node)
		bag_slots.append(node)
	_note("Equipped preview — larger slots with selection emphasis; tooltip ornamentation belongs to G2.2E.")
	var gear = _row(body)
	for i in range(8):
		_slot(gear, 1 + i % 5, BAG_ART[i], ["Weapon", "Head", "Chest", "Feet", "Hands", "Ring", "Charm", "Shield"][i], true)
	_note("Independent gallery only. No inventory data, gameplay or game-screen theme changes.")

func _tooltip_card(kind: String, compare: bool = false) -> PanelContainer:
	var node = TooltipScene.instantiate()
	var rarity_index = 3
	var art: Texture2D = ITEM
	node.item_name = "Forgotten Blade"
	node.category = "Dagger"
	node.stat_lines = PackedStringArray(["24–32 Attack Damage", "+8 Agility", "+5 Critical Rating"])
	node.description = "Illustrative item — no gameplay data."
	if kind == "common":
		rarity_index = 1
		node.item_name = "Old Iron Blade"
		node.stat_lines = PackedStringArray(["18–24 Attack Damage"])
		node.description = ""
	elif kind == "legendary":
		rarity_index = 5
		node.item_name = "Oathbound Relic"
		node.category = "Amulet"
		art = BAG_ART[6]
		node.stat_lines = PackedStringArray(["+16 Maximum Health", "+4 Defense", "+6 Endurance"])
		node.unique_effect = "On block, gain a brief protective ward. Example text only."
		node.description = "A relic of a forgotten oath."
	elif kind == "equipped":
		rarity_index = 2
		node.item_name = "Iron Fang"
		node.stat_lines = PackedStringArray(["20–28 Attack Damage", "+5 Agility", "+7 Critical Rating"])
		node.description = "Currently equipped — example."
	elif compare:
		node.comparison_title = "CHANGE VS IRON FANG"
		node.comparison_lines = PackedStringArray(["+4 minimum / maximum damage", "+3 Agility", "-2 Critical Rating"])
	node.rarity = rarity_index
	if prefer_tooltips and frame_pack.is_ready() and slot_pack.is_ready():
		node.detailed = kind == "legendary"
		node.painted_style = frame_pack.style_for("featured" if node.detailed else "tooltip")
		node.portrait_art = art
		node.portrait_frame = slot_pack.textures[SlotPack.RARITIES[rarity_index]]
		if node.detailed:
			node.ornament = frame_pack.textures["crest"]
	return node

func _tooltips() -> void:
	demo_tooltips.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2E Painted UI")
	selector.add_item("G2.1 Original")
	selector.select(0 if prefer_tooltips else 1)
	selector.item_selected.connect(func(index: int):
		prefer_tooltips = index == 0
		call_deferred("show_category", "Tooltips")
	)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(func():
		frame_pack.load_pack()
		slot_pack.load_pack()
		prefer_tooltips = true
		call_deferred("show_category", "Tooltips")
	)
	toolbar.add_child(reload)
	var painted = prefer_tooltips and frame_pack.is_ready() and slot_pack.is_ready()
	tooltip_status = _label("Painted assets active" if painted else "Original active", 15, Tokens.GOLD)
	toolbar.add_child(tooltip_status)
	_note("Compact bag tooltip / detailed legendary inspection — example values, not live game stats.")
	var cards = _row(body)
	var basic = _tooltip_card("common")
	var rare = _tooltip_card("rare")
	var legendary = _tooltip_card("legendary")
	for card in [basic, rare, legendary]:
		card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		cards.add_child(card)
		demo_tooltips.append(card)
	var interactions = _row(body)
	var hover_column = _vbox(interactions, 4)
	demo_tooltip_slot = SlotScene.instantiate()
	demo_tooltip_slot.item_art = ITEM
	demo_tooltip_slot.rarity = 3
	if painted:
		demo_tooltip_slot.painted_textures = slot_pack.textures
		demo_tooltip_slot.preview_tooltip_factory = func(): return _tooltip_card("rare")
	hover_column.add_child(demo_tooltip_slot)
	hover_column.add_child(_label("Hover to inspect", 14, Tokens.MUTED))
	var compare_button = CheckButton.new()
	compare_button.text = "Compare equipped item"
	compare_button.button_pressed = true
	interactions.add_child(compare_button)
	tooltip_comparison = _row(body)
	var equipped = _tooltip_card("equipped")
	var candidate = _tooltip_card("rare", true)
	for card in [equipped, candidate]:
		card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		tooltip_comparison.add_child(card)
		demo_tooltips.append(card)
	compare_button.toggled.connect(func(enabled: bool): tooltip_comparison.visible = enabled)
	_note("Comparison values are demonstration data. Live inventory, positioning and combat mechanics are not connected.")
