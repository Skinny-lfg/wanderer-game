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
	if gallery.active_category != "Foundations" or gallery.category_buttons.size() != 6:
		_fail("Gallery did not initialize")
		return
	for category in gallery.CATEGORIES:
		gallery.category_buttons[category].pressed.emit()
		await process_frame
		if gallery.active_category != category or gallery.body.get_child_count() < 2:
			_fail("Gallery category failed: " + category)
			return
		for key in gallery.CATEGORIES:
			if gallery.category_buttons[key].button_pressed != (key == category):
				_fail("Gallery selection state failed")
				return
	gallery.show_category("Item Slots")
	await process_frame
	var rarity_row = gallery.body.get_child(2)
	var state_row = gallery.body.get_child(3)
	if rarity_row.get_child_count() != 6 or state_row.get_child_count() != 5:
		_fail("Slot fixtures missing")
		return
	var locked = state_row.get_child(4).get_child(0)
	var selected = state_row.get_child(1).get_child(0)
	if not locked.disabled or not selected.button_pressed:
		_fail("Native slot states invalid")
		return
	if gallery.bag_slots.size() != 48:
		_fail("Dense inventory preview missing")
		return
	if gallery.show_category("invalid") or gallery.active_category != "Item Slots":
		_fail("Invalid category changed state")
		return
	print("PASS: gothic gallery six categories and component states")
	quit(0)
