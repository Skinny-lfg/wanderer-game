extends SceneTree
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
	if comparison.comparison_lines.size() != 3 or not comparison.comparison_lines[2].begins_with("-"):
		_fail("Comparison sample missing")
		return
	var hover = gallery.demo_tooltip_slot._make_custom_tooltip("sample")
	if not hover is PanelContainer or hover.rarity != 3 or hover.painted_style == null:
		_fail("Custom hover tooltip failed")
		return
	hover.free()
	gallery.prefer_tooltips = false
	gallery.show_category("Tooltips")
	await process_frame
	if gallery.tooltip_status.text != "Original active" or gallery.demo_tooltips[0].painted_style != null:
		_fail("Original tooltip fallback failed")
		return
	print("PASS: G2.2E painted compact, legendary, comparison and hover tooltip")
	quit(0)
