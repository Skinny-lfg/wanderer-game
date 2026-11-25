extends SceneTree
const Tokens = preload("res://ui/theme/tokens.gd")
func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.show_category("Tooltips")
	await process_frame
	if gallery.tooltip_status.text != "Painted assets active" or gallery.demo_tooltips.size() != 5:
		_fail("Painted tooltip samples missing")
		return
	var common = gallery.demo_tooltips[0]
	var rare = gallery.demo_tooltips[1]
	var legendary = gallery.demo_tooltips[2]
	var comparison = gallery.demo_tooltips[4]
	for card in gallery.demo_tooltips:
		if not card.get_theme_stylebox("panel") is StyleBoxTexture or card.portrait_art == null or card.content_stack == null:
			_fail("Painted card missing art or content")
			return
	if common.detailed or rare.detailed or not legendary.detailed or legendary.ornament == null or legendary.unique_effect.is_empty():
		_fail("Compact versus legendary treatment failed")
		return
	for card in gallery.demo_tooltips:
		if not card.sections.has("artwork"):
			_fail("Unframed artwork missing")
			return
		var art: Control = card.sections["artwork"]
		if not card.sections["header"].is_ancestor_of(art) or art.get_child_count() != 1 or not art.get_child(0) is TextureRect or art.get_child(0).name != "ItemArtwork":
			_fail("Item artwork must be visible without a slot frame")
			return
	if legendary.edge_ornament == null or rare.edge_ornament != null or common.edge_ornament != null:
		_fail("Legendary-only edge ornament missing")
		return
	if not is_equal_approx(legendary.edge_ornament.position.x, legendary.size.x * 0.5) or not is_equal_approx(legendary.edge_ornament.position.y, 12.0):
		_fail("Legendary ornament not attached to upper edge")
		return
	var seen: Array[Color] = []
	for index in range(6):
		var style: StyleBoxTexture = gallery.frame_pack.tooltip_style(index)
		var surface = style.texture.get_image()
		var color = surface.get_pixel(surface.get_width() / 2, surface.get_height() / 2)
		if seen.has(color):
			_fail("Rarity surfaces should be distinct")
			return
		seen.append(color)
		# Straight left border uses the exact rarity token (RGBA8 tolerance).
		var edge = surface.get_pixel(2, 20)
		var expected: Color = Tokens.RARITY_COLORS[index]
		if absf(edge.r - expected.r) > 0.005 or absf(edge.g - expected.g) > 0.005 or absf(edge.b - expected.b) > 0.005 or edge.a < 0.99:
			_fail("Tooltip frame does not match rarity: " + str(index))
			return
		if style.texture_margin_left != 16 or style.texture_margin_top != 16:
			_fail("Simple frame has incorrect slice geometry")
			return
		if maxf(color.r, maxf(color.g, color.b)) > 0.16:
			_fail("Tooltip background is too bright")
			return
		# Away from the thin border, there must be no interior shadow or bevel.
		for y in range(13, 35):
			for x in range(9, 31):
				if surface.get_pixel(x, y) != color:
					_fail("Simple tooltip interior must be uniform")
					return
		if style.axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_TILE:
			_fail("Simple frame must remain modular")
			return
		if gallery.frame_pack.tooltip_style(index, false).texture_margin_left != 30:
			_fail("Rarity tint changed frame geometry")
			return
	if legendary.get_theme_stylebox("panel").texture == rare.get_theme_stylebox("panel").texture:
		_fail("Different rarities should have distinct backgrounds")
		return
	if comparison.comparison_lines.size() != 3 or not comparison.comparison_lines[2].begins_with("-"):
		_fail("Comparison sample missing")
		return
	if not common.organized or common.sections.has("attributes") or not common.sections.has("primary"):
		_fail("Common card should only show primary damage")
		return
	if not rare.sections.has("primary") or not rare.sections.has("attributes") or rare.primary_value != "24–32":
		_fail("Rare card hierarchy missing")
		return
	if not legendary.sections.has("unique") or legendary.sections.has("primary") or legendary.unique_title != "Oathkeeper":
		_fail("Legendary card hierarchy missing")
		return
	if not comparison.sections.has("comparison") or comparison.changes.size() != 3 or float(comparison.changes[2]["delta"]) >= 0.0:
		_fail("Structured comparison missing")
		return
	var hover = gallery.demo_tooltip_slot._make_custom_tooltip("sample")
	if not hover is PanelContainer or hover.rarity != 3 or hover.painted_style == null:
		_fail("Custom hover tooltip failed")
		return
	hover.free()
	gallery.simple_tooltips = false
	gallery.show_category("Tooltips")
	await process_frame
	if not gallery.demo_tooltips[0].organized or gallery.demo_tooltips[0].simple_surface or gallery.demo_tooltips[0].get_theme_stylebox("panel").texture_margin_left != 30:
		_fail("Painted rarity frame comparison missing")
		return
	gallery.organized_tooltips = false
	gallery.show_category("Tooltips")
	await process_frame
	if gallery.demo_tooltips[0].organized or gallery.demo_tooltips[0].painted_style == null or gallery.demo_tooltips[2].ornament == null:
		_fail("Previous painted comparison missing")
		return
	gallery.prefer_tooltips = false
	gallery.show_category("Tooltips")
	await process_frame
	if gallery.tooltip_status.text != "Original active" or gallery.demo_tooltips[0].painted_style != null:
		_fail("Original tooltip fallback failed")
		return
	print("PASS: G2.2E painted compact, legendary, comparison and hover tooltip")
	quit(0)
