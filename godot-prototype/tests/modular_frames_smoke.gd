extends SceneTree
const Buttons = preload("res://ui/theme/painted_button_pack.gd")
const Frames = preload("res://ui/theme/painted_frame_pack.gd")
const Navigation = preload("res://ui/theme/painted_navigation_pack.gd")

func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _check_strip(source: Texture2D, box: StyleBoxTexture, cap: int, tile_width: int) -> bool:
	if box == null or box.texture == null:
		return false
	if box.axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_TILE or box.axis_stretch_vertical != StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH:
		return false
	if box.texture_margin_left != cap or box.texture_margin_right != cap or box.texture_margin_top != 0 or box.texture_margin_bottom != 0:
		return false
	var original = source.get_image()
	var atlas = box.texture.get_image()
	var w = atlas.get_width()
	var h = atlas.get_height()
	if w != cap * 2 + tile_width or h != original.get_height():
		return false
	for y in range(h):
		var profile = atlas.get_pixel(cap, y)
		# All pixels across the tile and both boundary columns are identical.
		for x in range(cap - 1, w - cap + 1):
			if atlas.get_pixel(x, y) != profile:
				return false
		# Outermost portion of the full-height end decorations is unchanged.
		for d in range(cap - maxi(3, roundi(cap * 0.60)) + 1):
			if atlas.get_pixel(d, y) != original.get_pixel(d, y) or atlas.get_pixel(w - 1 - d, y) != original.get_pixel(original.get_width() - 1 - d, y):
				return false
	return true

func _check_panel(source: Texture2D, box: StyleBoxTexture, corner: Vector2i, sample: Vector2i) -> bool:
	if box == null or box.texture == null:
		return false
	if box.axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_TILE or box.axis_stretch_vertical != StyleBoxTexture.AXIS_STRETCH_MODE_TILE:
		return false
	if box.texture_margin_left != corner.x or box.texture_margin_right != corner.x or box.texture_margin_top != corner.y or box.texture_margin_bottom != corner.y:
		return false
	var atlas = box.texture.get_image()
	var original = source.get_image()
	var w = atlas.get_width()
	var h = atlas.get_height()
	if atlas.get_size() != (corner + sample) * 2:
		return false
	# Every joint between a corner, edge or center must match exactly.
	for y in range(h):
		if atlas.get_pixel(corner.x - 1, y) != atlas.get_pixel(corner.x, y) or atlas.get_pixel(w - corner.x - 1, y) != atlas.get_pixel(w - corner.x, y):
			return false
	for x in range(w):
		if atlas.get_pixel(x, corner.y - 1) != atlas.get_pixel(x, corner.y) or atlas.get_pixel(x, h - corner.y - 1) != atlas.get_pixel(x, h - corner.y):
			return false
	var background = atlas.get_pixel(corner.x, corner.y)
	for y in range(corner.y, h - corner.y):
		for x in range(corner.x, w - corner.x):
			if atlas.get_pixel(x, y) != background:
				return false
	# Unblended exterior corner areas remain exact source pixels.
	var fixed_x = corner.x - maxi(3, roundi(corner.x * 0.60))
	var fixed_y = corner.y - maxi(3, roundi(corner.y * 0.60))
	for side_y in range(2):
		for side_x in range(2):
			for dy in range(fixed_y + 1):
				for dx in range(fixed_x + 1):
					var ax = dx if side_x == 0 else w - 1 - dx
					var ay = dy if side_y == 0 else h - 1 - dy
					var sx = dx if side_x == 0 else original.get_width() - 1 - dx
					var sy = dy if side_y == 0 else original.get_height() - 1 - dy
					if atlas.get_pixel(ax, ay) != original.get_pixel(sx, sy):
						return false
	return true

func _run() -> void:
	var buttons = Buttons.new()
	var frames = Frames.new()
	var navigation = Navigation.new()
	if not buttons.load_pack() or not frames.load_pack() or not navigation.load_pack():
		_fail("Actual artwork pack did not load")
		return
	for family in Buttons.VARIANTS:
		for state in Buttons.STATES:
			if not _check_strip(buttons.textures[family + "_" + state], buttons.style_for(family, state), Buttons.CORNER.x, Buttons.TILE_WIDTH):
				_fail("Continuous button failed: " + family + "/" + state)
				return
	for key in Frames.CORNERS:
		if not _check_panel(frames.textures[key], frames.style_for(key), Frames.CORNERS[key], Frames.SAMPLE):
			_fail("Continuous panel failed: " + key)
			return
		if frames.style_for(key, true).axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH:
			_fail("Legacy frame comparison missing")
			return
	for state in Navigation.STATES:
		if not _check_strip(navigation.textures["tab_" + state], navigation.style_for(state), Navigation.CORNER.x, Navigation.TILE_WIDTH):
			_fail("Continuous navigation failed: " + state)
			return
	if frames.style_for("portrait") != null or frames.style_for("banner") != null:
		_fail("Fixed-aspect art must not use modular frames")
		return
	print("PASS: G2.2E.1B 28 continuous atlases, matched seams and protected outer art")
	quit(0)
