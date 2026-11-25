extends SceneTree
const Modular = preload("res://ui/theme/modular_frame.gd")
const Buttons = preload("res://ui/theme/painted_button_pack.gd")
const Frames = preload("res://ui/theme/painted_frame_pack.gd")
const Navigation = preload("res://ui/theme/painted_navigation_pack.gd")

func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _check(source: Texture2D, box: StyleBoxTexture, corner: Vector2i, sample: Vector2i, quiet: bool = false) -> bool:
	if box == null or box.texture == null:
		return false
	if box.axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_TILE or box.axis_stretch_vertical != StyleBoxTexture.AXIS_STRETCH_MODE_TILE:
		return false
	if box.texture_margin_left != corner.x or box.texture_margin_right != corner.x or box.texture_margin_top != corner.y or box.texture_margin_bottom != corner.y:
		return false
	var original = source.get_image()
	var atlas = box.texture.get_image()
	original.convert(Image.FORMAT_RGBA8)
	atlas.convert(Image.FORMAT_RGBA8)
	if atlas.get_size() != (corner + sample) * 2:
		return false
	for y in range(2):
		for x in range(2):
			var start = Vector2i(0 if x == 0 else original.get_width() - corner.x, 0 if y == 0 else original.get_height() - corner.y)
			var end = Vector2i(0 if x == 0 else atlas.get_width() - corner.x, 0 if y == 0 else atlas.get_height() - corner.y)
			if not quiet:
				if original.get_region(Rect2i(start, corner)).get_data() != atlas.get_region(Rect2i(end, corner)).get_data():
					return false
			else:
				# Panel feathering must never modify the outer corner/silhouette.
				for py in range(corner.y):
					for px in range(corner.x):
						var dx = px if x == 0 else corner.x - 1 - px
						var dy = py if y == 0 else corner.y - 1 - py
						if dx <= corner.x - 10 or dy <= corner.y - 10:
							var offset = Vector2i(px, py)
							if original.get_pixelv(start + offset) != atlas.get_pixelv(end + offset):
								return false
	if quiet:
		var background = atlas.get_pixel(corner.x, corner.y)
		for py in range(corner.y - 1, atlas.get_height() - corner.y + 1):
			for px in range(corner.x - 1, atlas.get_width() - corner.x + 1):
				if atlas.get_pixel(px, py) != background:
					return false
	# Mirrored tile joins must match exactly, on both axes.
	for y in range(atlas.get_height()):
		if atlas.get_pixel(corner.x + sample.x - 1, y) != atlas.get_pixel(corner.x + sample.x, y):
			return false
	for x in range(atlas.get_width()):
		if atlas.get_pixel(x, corner.y + sample.y - 1) != atlas.get_pixel(x, corner.y + sample.y):
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
			if not _check(buttons.textures[family + "_" + state], buttons.style_for(family, state), Buttons.CORNER, Buttons.SAMPLE):
				_fail("Modular button failed: " + family + "/" + state)
				return
	for key in Frames.CORNERS:
		if not _check(frames.textures[key], frames.style_for(key), Frames.CORNERS[key], Frames.SAMPLE, true):
			_fail("Modular frame failed: " + key)
			return
		if frames.style_for(key, true).axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH:
			_fail("Legacy frame comparison missing")
			return
	for state in Navigation.STATES:
		if not _check(navigation.textures["tab_" + state], navigation.style_for(state), Navigation.CORNER, Navigation.SAMPLE):
			_fail("Modular navigation failed: " + state)
			return
	if frames.style_for("portrait") != null or frames.style_for("banner") != null:
		_fail("Fixed-aspect art must not use modular frames")
		return
	print("PASS: G2.2E.1 28 modular atlases, fixed corner pixels, mirrored tile joins and legacy comparison")
	quit(0)
