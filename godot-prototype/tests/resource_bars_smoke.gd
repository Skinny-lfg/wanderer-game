extends SceneTree
const Bar = preload("res://ui/components/hud/resource_bar.gd")
const Portrait = preload("res://ui/components/hud/portrait_medallion.gd")
const Profiles = preload("res://ui/theme/resource_hud_profiles.gd")
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
		if texture.get_size() != Vector2(768, 64):
			_fail("Fill dimensions")
			return
		var img: Image = texture.get_image()
		for y in range(img.get_height()):
			if img.get_pixel(0, y) != img.get_pixel(img.get_width() - 1, y):
				_fail("Fill texture is not seamless")
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
	if gallery.resource_profile_index != Profiles.DEFAULT_INDEX or gallery.resource_profile_selector.item_count != 4:
		_fail("HUD profile selector missing")
		return
	var initial_health: float = health.current
	var initial_ratio: float = health.shown_ratio
	for index in range(4):
		gallery._set_resource_profile(index)
		await process_frame
		await process_frame
		var xp_bar: Control = gallery.resource_samples["EXP"]
		var hp_bar: Control = health
		if not is_equal_approx(xp_bar.size.x, 446.5) or not is_equal_approx(hp_bar.size.x, 470.0):
			_fail("EXP must be shorter than the main resource bars")
			return
		if absf((xp_bar.position.x + xp_bar.size.x * 0.5) - (hp_bar.position.x + hp_bar.size.x * 0.5)) > 1.0:
			_fail("EXP must be horizontally centered")
			return
		var profile: Dictionary = Profiles.PROFILES[index]
		for i in range(Profiles.KINDS.size()):
			var sample = gallery.resource_samples[Profiles.KINDS[i]]
			if sample.custom_minimum_size.y != float(profile["heights"][i]) or sample.value_alignment != int(profile["alignment"]):
				_fail("HUD profile dimensions or alignment")
				return
			if index < 3:
				if not sample.value_font is FontVariation or sample.value_font.base_font != Profiles.FONTS[index]:
					_fail("Bundled HUD font missing")
					return
				var weight_tag = TextServerManager.get_primary_interface().name_to_tag("wght")
				if sample.value_font.variation_opentype.get(weight_tag) != profile["weight"]:
					_fail("HUD font weight mismatch")
					return
			elif sample.value_font != null:
				_fail("Previous typography missing")
				return
		if health.current != initial_health or health.shown_ratio != initial_ratio or gallery.resource_portrait.level != 24:
			_fail("HUD switch changed resource state")
			return
		if index < 3 and health.value_text() != "2,400 / 2,840":
			_fail("Grouped resource values missing")
			return
	gallery._set_resource_profile(Profiles.DEFAULT_INDEX)
	await process_frame
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
	health.set_amount(100, 100, false)
	health.set_amount(65, 100, true)
	if not is_equal_approx(health.shown_ratio, 0.65) or not is_equal_approx(health.trail_ratio, 1.0):
		_fail("Damage trail initial state")
		return
	await create_timer(0.65).timeout
	if not is_equal_approx(health.trail_ratio, 0.65):
		_fail("Damage trail did not drain")
		return
	if gallery.resource_portrait.portrait_region.size.x >= 0.5:
		_fail("Face crop missing")
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
