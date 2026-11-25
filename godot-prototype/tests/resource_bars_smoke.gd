extends SceneTree
const Bar = preload("res://ui/components/hud/resource_bar.gd")
const Portrait = preload("res://ui/components/hud/portrait_medallion.gd")
func _initialize() -> void:
	call_deferred("_run")
func _fail(message: String) -> void:
	push_error(message)
	quit(1)
func _run() -> void:
	if Bar.FRAME.get_size() != Vector2(512, 64) or Portrait.FRAME.get_size() != Vector2(256, 256) or Portrait.BADGE.get_size() != Vector2(128, 128):
		_fail("Resource asset dimensions")
		return
	if Portrait.FRAME.get_image().get_pixel(128, 128).a != 0.0:
		_fail("Portrait aperture must be transparent")
		return
	for texture in Bar.FILLS.values():
		if texture.get_size() != Vector2(256, 64):
			_fail("Fill dimensions")
			return
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.show_category("Resource Bars")
	await process_frame
	if gallery.resource_samples.size() != 4 or gallery.resource_portrait.level != 24:
		_fail("Resource gallery missing")
		return
	var health = gallery.resource_samples["Health"]
	var barrier = gallery.resource_samples["Barrier"]
	health.set_amount(100, 0, false)
	if health.fraction() != 0.0 or health.shown_ratio != 0.0 or not health.fill_shape(Vector2(300, 24), 0).is_empty():
		_fail("Empty/zero maximum handling")
		return
	health.set_amount(120, 100, false)
	if health.current != 100 or health.shown_ratio != 1.0:
		_fail("Clamp")
		return
	for ratio in [0.08, 0.25, 0.67, 1.0]:
		var shape: PackedVector2Array = health.fill_shape(Vector2(300, 24), ratio)
		if shape.size() < 3:
			_fail("Fill polygon")
			return
		for point in shape:
			if point.x < 0.0 or point.x > 300.0 or point.y < 0.0 or point.y > 24.0:
				_fail("Fill outside track")
				return
	barrier.set_amount(0, 300, false)
	if barrier.visible:
		_fail("Barrier zero must hide")
		return
	barrier.set_amount(90, 300, false)
	if not barrier.visible:
		_fail("Barrier gain must show")
		return
	gallery._resource_action("Reset")
	gallery.resource_samples["EXP"].set_amount(950, 1000, false)
	gallery._resource_action("Gain EXP")
	if gallery.resource_portrait.level != 25 or gallery.resource_samples["EXP"].current != 130:
		_fail("XP preview level update")
		return
	print("PASS: G2.2F seven PNGs, resource values, fill bounds, barrier visibility and level preview")
	quit(0)
