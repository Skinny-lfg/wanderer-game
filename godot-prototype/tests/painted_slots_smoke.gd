extends SceneTree
const Pack = preload("res://ui/theme/painted_slot_pack.gd")
const Normalize = preload("res://ui/theme/asset_normalization.gd")
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
	var silhouette: Rect2i = pack.textures["rarity_common"].get_image().get_used_rect()
	for texture in pack.textures.values():
		var used: Rect2i = texture.get_image().get_used_rect()
		if used != silhouette:
			_fail("Simple slot silhouettes differ")
			return
		if used.position.x < 4 or used.position.y < 4 or used.end.x > 252 or used.end.y > 252:
			_fail("Normalized slot lacks transparent guard")
			return
	for node in gallery.bag_slots:
		if node.item_art == null:
			continue
		var source: Rect2i = node.painted_art_bounds()
		if not source.has_area():
			_fail("Missing alpha bounds")
			return
		for side in [48.0, 64.0, 80.0]:
			var extent = Vector2(side, side)
			var safe = Normalize.slot_safe_rect(extent)
			var dest: Rect2 = node.painted_art_rect(extent)
			if not safe.grow(0.01).encloses(dest) or not is_equal_approx(dest.size.aspect(), Vector2(source.size).aspect()):
				_fail("Item exceeded safe area or changed aspect")
				return
	var reference: Rect2 = first.painted_art_rect(Vector2(64, 64))
	if maxf(reference.size.x, reference.size.y) > 64.0 * 0.58 + 0.01:
		_fail("Gear exceeds reduced art area")
		return
	var original_rarity: int = first.rarity
	for rarity_index in range(6):
		first.rarity = rarity_index
		first.equipped = false
		var normal_key: String = first.painted_key()
		var hover_key: String = first.painted_key(true)
		first.equipped = true
		if first.painted_key() != Pack.RARITIES[rarity_index] or first.painted_key() != normal_key or first.painted_key(true) != hover_key:
			_fail("Equipped slot must use the same rarity and hover frame as a normal slot")
			return
	first.rarity = original_rarity
	first.equipped = true
	if first.painted_art_rect(Vector2(64, 64)) != reference:
		_fail("Equipped state changed item geometry")
		return
	first.equipped = false
	first.button_pressed = true
	if first.painted_art_rect(Vector2(64, 64)) != reference:
		_fail("Selected state changed item geometry")
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
