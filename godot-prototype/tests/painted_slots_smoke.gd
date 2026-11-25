extends SceneTree
const Pack = preload("res://ui/theme/painted_slot_pack.gd")
func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var pack = Pack.new()
	if pack.load_pack("user://g22d-missing-pack") or pack.is_ready():
		_fail("Missing pack did not fall back")
		return
	if not pack.load_pack() or not pack.is_ready():
		_fail("Actual slot art failed: " + pack.problem)
		return
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.show_category("Item Slots")
	await process_frame
	if gallery.slot_status.text != "10 / 10 PNGs loaded" or gallery.bag_slots.size() != 48:
		_fail("Painted gallery missing")
		return
	var occupied = 0
	for node in gallery.bag_slots:
		if node.painted_textures.size() != 10:
			_fail("Missing painted texture assignment")
			return
		if node.item_art != null:
			occupied += 1
	if occupied != 30 or gallery.bag_slots[47].painted_key() != "slot_empty":
		_fail("Wrong sample inventory")
		return
	var first = gallery.bag_slots[0]
	if first.painted_key() != "rarity_grey" or first.painted_key(true) != "slot_hover":
		_fail("Rarity or hover state failed")
		return
	for sample in [[48.0, 0.82], [64.0, 0.77], [80.0, 0.73]]:
		if not is_equal_approx(first._painted_art_fit_ratio(sample[0]), sample[1]):
			_fail("Unexpected item art fit ratio")
			return
	first.equipped = true
	if not is_equal_approx(first._painted_art_fit_ratio(64.0), 0.79):
		_fail("Equipped fit bonus failed")
		return
	first.equipped = false
	first.button_pressed = true
	if not is_equal_approx(first._painted_art_fit_ratio(48.0), 0.83):
		_fail("Selected fit bonus failed")
		return
	if first.painted_key() != "slot_selected":
		_fail("Selection state failed")
		return
	var locked = gallery.body.get_child(3).get_child(4).get_child(0)
	if not locked.disabled or locked.painted_key() != "slot_locked":
		_fail("Locked state failed")
		return
	gallery.prefer_slots = false
	gallery.show_category("Item Slots")
	await process_frame
	if gallery.slot_status.text != "Original slots active" or not gallery.bag_slots[0].painted_textures.is_empty():
		_fail("Original fallback failed")
		return
	print("PASS: G2.2D ten actual textures, rarity states, 48-slot bag and original comparison")
	quit(0)
