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
var prefer_simple_slots: bool = true
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
var organized_tooltips: bool = true
var simple_tooltips: bool = true
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
	frame.add_child(_label("STYLIZED GOTHIC     •     G2.2E.7 / SIMPLIFIED PNG ART", 15, Tokens.GOLD))
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
	_note_in(body, value)

func _note_in(host: Node, value: String) -> void:
	var label = _label(value, 15, Tokens.MUTED)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.add_child(label)

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
	_note("Modular strip: full-height end decorations, continuous background profile. Focus is provisional. Gameplay is not connected.")

	if use_painted:
		_note("Resize study — same modular primary button at three widths.")
		var widths = _row(body)
		for width in [160, 264, 420]:
			var button = _button(widths, str(width) + " px", "PrimaryButton")
			button.custom_minimum_size = Vector2(width, 54)
			painted_pack.apply_to(button, "primary")

func _select_button_pack(index: int) -> void:
	prefer_painted = index == 0
	# Defer because the emitting OptionButton is rebuilt by show_category.
	call_deferred("show_category", "Buttons")

func _reload_painted() -> void:
	painted_pack.load_pack()
	prefer_painted = true
	call_deferred("show_category", "Buttons")

const SimpleFrame = preload("res://ui/theme/simple_frame.gd")
var simple_frame_samples: Array[PanelContainer] = []

func _simple_frame_sample(host: Node, label_text: String, detail: String, extent: Vector2, style: StyleBoxTexture) -> void:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = extent
	panel.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	SimpleFrame.apply_to(panel, style)
	host.add_child(panel)
	simple_frame_samples.append(panel)
	var content = _vbox(panel, 3)
	content.add_child(_label(label_text, 18))
	if not detail.is_empty():
		content.add_child(_label(detail, 14, Tokens.MUTED))

func _simple_frame_study() -> void:
	_note("Simple Frame — real PNG nine-slice for everyday information. No shadow, fixed corners.")
	var neutral = SimpleFrame.png_style("neutral")
	var sizes = _row(body)
	_simple_frame_sample(sizes, "Materials", "Compact counter", Vector2(180, 70), neutral)
	_simple_frame_sample(sizes, "Contract details", "Wide information panel", Vector2(360, 100), neutral)
	_simple_frame_sample(sizes, "Equipment", "Tall information panel", Vector2(220, 190), neutral)
	var variants = _row(body)
	_simple_frame_sample(variants, "Neutral", "Default", Vector2(210, 85), neutral)
	_simple_frame_sample(variants, "Selected", "Subtle emphasis", Vector2(210, 85), SimpleFrame.png_style("selected"))
	_simple_frame_sample(variants, "Disabled", "Muted", Vector2(210, 85), SimpleFrame.png_style("disabled"))
	_note("Recommended: Simple for everyday details, Standard for major windows, Featured for important rewards. Other frames are optional.")

func _panels() -> void:
	demo_panels.clear()
	simple_frame_samples.clear()
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
	_simple_frame_study()
	_note("Painted frames / scroll to inspect all samples. Center ornaments stay at a fixed size.")
	var first = _row(body)
	_frame_sample(first, "standard", "Standard", Vector2(285, 140), "Everyday content")
	_frame_sample(first, "featured", "Featured", Vector2(285, 140), "Important rewards", "crest")
	_frame_sample(first, "modal", "Modal", Vector2(330, 140), "Confirm or cancel", "modal_crest")
	var variants_toggle = CheckButton.new()
	variants_toggle.text = "Show optional frames and resize studies"
	body.add_child(variants_toggle)
	var archive = _vbox(body)
	variants_toggle.toggled.connect(func(enabled: bool): archive.visible = enabled)
	archive.visible = false
	var second = _row(archive)
	_frame_sample(second, "tooltip", "Tooltip", Vector2(300, 112), "Item information")
	_frame_sample(second, "compact", "Compact", Vector2(220, 96), "Counters")
	_frame_sample(second, "standard", "Wide standard", Vector2(380, 112), "Same texture, wider")
	var states = _row(archive)
	_frame_sample(states, "standard", "Normal", Vector2(255, 100), "")
	_frame_sample(states, "focused", "Focused", Vector2(255, 100), "")
	_frame_sample(states, "disabled", "Disabled", Vector2(255, 100), "")
	var art = _row(archive)
	_art_sample(art, "portrait", "Portrait / fixed aspect", Vector2(190, 220))
	_art_sample(art, "banner", "Banner / fixed aspect", Vector2(530, 110))
	var dividers = _row(archive)
	_art_sample(dividers, "divider_horizontal", "Horizontal divider", Vector2(290, 44))
	_art_sample(dividers, "section_ornament", "Section ornament", Vector2(290, 55))
	_art_sample(dividers, "divider_vertical", "Vertical divider", Vector2(26, 175))
	_note_in(archive, "Modular panels with matching corner-to-edge profiles and quiet interiors. No game screens changed.")

	_note_in(archive, "Resize comparison — left: legacy stretched center/edges; right: modular frame with quiet interior.")
	for extent in [Vector2(300, 112), Vector2(420, 200), Vector2(300, 360)]:
		var comparison = _row(archive)
		for legacy in [true, false]:
			var panel = PanelContainer.new()
			panel.custom_minimum_size = extent
			panel.add_theme_stylebox_override("panel", frame_pack.style_for("tooltip", legacy))
			comparison.add_child(panel)
			var label = _label(("Legacy" if legacy else "Modular") + "  " + str(int(extent.x)) + " x " + str(int(extent.y)), 15)
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			panel.add_child(label)

	_note_in(archive, "All seven frame families — tall and wide stress samples.")
	for key in FramePack.CORNERS:
		var row = _row(archive)
		for extent in [Vector2(240, 150), Vector2(400, 100)]:
			var panel = PanelContainer.new()
			panel.custom_minimum_size = extent
			panel.add_theme_stylebox_override("panel", frame_pack.style_for(key))
			row.add_child(panel)
			var label = _label(key.capitalize(), 15)
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			panel.add_child(label)

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

	_note("Resize study — modular tab at compact, normal and wide widths.")
	var widths = _row(body)
	for width in [90, 180, 300]:
		var tab = TabScene.instantiate()
		navigation_pack.apply_to(tab, "inventory", width == 90)
		tab.custom_minimum_size.x = width
		widths.add_child(tab)

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
	selector.add_item("G2.2E.7 Simple PNG")
	selector.add_item("G2.2D Previous PNG")
	selector.add_item("G2.1 Original slots")
	selector.select((0 if prefer_simple_slots else 1) if prefer_slots else 2)
	selector.item_selected.connect(func(index: int):
		prefer_slots = index != 2
		prefer_simple_slots = index == 0
		if prefer_slots:
			slot_pack.load_pack(SlotPack.ART_DIR if prefer_simple_slots else SlotPack.LEGACY_DIR)
		call_deferred("show_category", "Item Slots")
	)
	toolbar.add_child(selector)
	var reload = Button.new()
	reload.text = "Reload artwork"
	reload.pressed.connect(func():
		slot_pack.load_pack(SlotPack.ART_DIR if prefer_simple_slots else SlotPack.LEGACY_DIR)
		prefer_slots = true
		call_deferred("show_category", "Item Slots")
	)
	toolbar.add_child(reload)
	var use_painted = prefer_slots and slot_pack.is_ready()
	slot_status = _label("10 / 10 PNGs loaded" if use_painted else "Original slots active", 15, Tokens.GOLD)
	toolbar.add_child(slot_status)
	_note("Uniform square silhouette, smaller gear art and internal rarity details — hover or click to select. " + ("" if use_painted or not prefer_slots else slot_pack.problem))
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
	_note("Equipped preview — normal rarity frames, no permanent selection glow.")
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
	node.description = ""
	node.primary_value = "24–32"
	node.primary_label = "Attack Damage"
	node.attributes.assign([{"label": "Agility", "value": "+8"}, {"label": "Critical Rating", "value": "+5"}])
	if kind == "common":
		rarity_index = 1
		node.item_name = "Old Iron Blade"
		node.stat_lines = PackedStringArray(["18–24 Attack Damage"])
		node.primary_value = "18–24"
		node.attributes.clear()
		node.description = ""
	elif kind == "grey":
		rarity_index = 0
		node.item_name = "Worn Dagger"
		node.primary_value = "8–12"
		node.stat_lines = PackedStringArray(["8–12 Attack Damage"])
		node.attributes.clear()
	elif kind == "epic":
		rarity_index = 4
		node.item_name = "Nightpiercer"
		node.primary_value = "32–40"
		node.stat_lines = PackedStringArray(["32–40 Attack Damage", "+12 Agility", "+8 Critical Rating"])
		node.attributes.assign([{"label": "Agility", "value": "+12"}, {"label": "Critical Rating", "value": "+8"}])
	elif kind == "legendary":
		rarity_index = 5
		node.item_name = "Oathbound Relic"
		node.category = "Amulet"
		art = BAG_ART[6]
		node.stat_lines = PackedStringArray(["+16 Maximum Health", "+4 Defense", "+6 Endurance"])
		node.primary_value = ""
		node.primary_label = ""
		node.attributes.assign([{"label": "Maximum Health", "value": "+16"}, {"label": "Defense", "value": "+4"}, {"label": "Endurance", "value": "+6"}])
		node.unique_title = "Oathkeeper"
		node.unique_effect = "On block, gain a brief protective ward."
		node.description = "A relic of a forgotten oath."
	elif kind == "equipped":
		rarity_index = 2
		node.item_name = "Iron Fang"
		node.stat_lines = PackedStringArray(["20–28 Attack Damage", "+5 Agility", "+7 Critical Rating"])
		node.primary_value = "20–28"
		node.attributes.assign([{"label": "Agility", "value": "+5"}, {"label": "Critical Rating", "value": "+7"}])
		node.equipped_caption = true
		node.description = ""
	elif compare:
		node.comparison_title = "CHANGE VS IRON FANG"
		node.comparison_lines = PackedStringArray(["+4 minimum / maximum damage", "+3 Agility", "-2 Critical Rating"])
		node.changes.assign([{"label": "Attack Damage", "value": "+4 / +4", "delta": 4}, {"label": "Agility", "value": "+3", "delta": 3}, {"label": "Critical Rating", "value": "−2", "delta": -2}])
	node.rarity = rarity_index
	if prefer_tooltips and frame_pack.is_ready() and slot_pack.is_ready():
		node.detailed = kind == "legendary"
		node.organized = organized_tooltips
		node.simple_surface = organized_tooltips and simple_tooltips
		node.painted_style = frame_pack.tooltip_style(rarity_index, simple_tooltips) if organized_tooltips else frame_pack.style_for("featured" if node.detailed else "tooltip")
		node.portrait_art = art
		node.portrait_frame = slot_pack.textures[SlotPack.RARITIES[rarity_index]]
		if node.detailed:
			node.ornament = frame_pack.textures["crest"]
	return node

func _tooltips() -> void:
	demo_tooltips.clear()
	var toolbar = _row(body)
	var selector = OptionButton.new()
	selector.add_item("G2.2E.5 Simple Frame")
	selector.add_item("G2.2E.4 Painted Frame")
	selector.add_item("G2.2E Previous")
	selector.add_item("G2.1 Original")
	selector.select(((0 if simple_tooltips else 1) if organized_tooltips else 2) if prefer_tooltips else 3)
	selector.item_selected.connect(func(index: int):
		prefer_tooltips = index != 3
		organized_tooltips = index < 2
		simple_tooltips = index == 0
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
	_note("Unframed header art / subtle rarity tint / simple shadow-free frame. All values and effects are illustrative.")
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
	_note("Additional rarity previews — Grey and Epic.")
	var extra = _row(body)
	for kind in ["grey", "epic"]:
		var card = _tooltip_card(kind)
		card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		extra.add_child(card)
	_note("Comparison values are demonstration data. Live inventory, positioning and combat mechanics are not connected.")
