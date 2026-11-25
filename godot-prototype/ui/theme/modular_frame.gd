extends RefCounted
## Continuous-profile modular art. Panel corners blend into matching edge
## profiles and one quiet interior. Fixed-height controls use full-height
## end caps and a continuous horizontal profile, not split side ornaments.

static func _row_average(image: Image, y: int, left: int, right: int) -> Color:
	var total = Color(0, 0, 0, 0)
	for x in range(left, right):
		total += image.get_pixel(x, y)
	return total / float(maxi(1, right - left))

static func _column_average(image: Image, x: int, top: int, bottom: int) -> Color:
	var total = Color(0, 0, 0, 0)
	for y in range(top, bottom):
		total += image.get_pixel(x, y)
	return total / float(maxi(1, bottom - top))

static func _background(image: Image, corner: Vector2i) -> Color:
	var total = Color(0, 0, 0, 0)
	var count = 0
	for y in range(corner.y, image.get_height() - corner.y):
		for x in range(corner.x, image.get_width() - corner.x):
			var pixel = image.get_pixel(x, y)
			if pixel.a >= 0.95:
				total += pixel
				count += 1
	if count == 0:
		return Color("#201d1b")
	var color = total / float(count)
	color.a = 1.0
	return color

static func _join_weight(distance: int, span: int) -> float:
	# Spread the transition over the inner part of the fixed corner.
	# The last texel exactly equals its neighbouring profile.
	if distance >= span - 1:
		return 1.0
	var feather = maxi(3, roundi(span * 0.60))
	return smoothstep(0.0, 1.0, clampf(float(distance - (span - feather)) / float(feather - 1), 0.0, 1.0))

# Bypass floating-point lerp at endpoints so RGBA8 quantization cannot introduce
# a one-byte mismatch between logically identical adjacent atlas pixels.
static func _mix(a: Color, b: Color, weight: float) -> Color:
	if weight <= 0.0:
		return a
	if weight >= 1.0:
		return b
	return a.lerp(b, weight)

static func build_panel(source: Texture2D, corner: Vector2i, sample: Vector2i, surface: Color = Color(0, 0, 0, 0)) -> Texture2D:
	var image = source.get_image()
	if image == null or image.is_empty():
		return null
	image.convert(Image.FORMAT_RGBA8)
	var w = image.get_width()
	var h = image.get_height()
	if corner.x < 3 or corner.y < 3 or sample.x <= 0 or sample.y <= 0 or w <= corner.x * 2 or h <= corner.y * 2:
		return null
	var aw = (corner.x + sample.x) * 2
	var ah = (corner.y + sample.y) * 2
	var background = surface if surface.a >= 1.0 else _background(image, corner)
	var top: Array[Color] = []
	var bottom: Array[Color] = []
	var left: Array[Color] = []
	var right: Array[Color] = []
	for d in range(corner.y):
		top.append(_row_average(image, d, corner.x, w - corner.x))
		bottom.append(_row_average(image, h - 1 - d, corner.x, w - corner.x))
	for d in range(corner.x):
		left.append(_column_average(image, d, corner.y, h - corner.y))
		right.append(_column_average(image, w - 1 - d, corner.y, h - corner.y))
	var atlas = Image.create(aw, ah, false, Image.FORMAT_RGBA8)
	for y in range(ah):
		var top_half = y < ah / 2
		var dy = mini(y, ah - 1 - y)
		var inside_y = dy >= corner.y
		var fy = 1.0 if inside_y else _join_weight(dy, corner.y)
		for x in range(aw):
			var left_half = x < aw / 2
			var dx = mini(x, aw - 1 - x)
			var inside_x = dx >= corner.x
			var fx = 1.0 if inside_x else _join_weight(dx, corner.x)
			var color = background
			if not inside_x and not inside_y:
				var sx = dx if left_half else w - 1 - dx
				var sy = dy if top_half else h - 1 - dy
				var hp = top[dy] if top_half else bottom[dy]
				var vp = left[dx] if left_half else right[dx]
				var upper = _mix(image.get_pixel(sx, sy), hp, fx)
				var lower = _mix(vp, background, fx)
				color = _mix(upper, lower, fy)
			elif not inside_y:
				color = _mix(top[dy] if top_half else bottom[dy], background, fy)
			elif not inside_x:
				color = _mix(left[dx] if left_half else right[dx], background, fx)
			atlas.set_pixel(x, y, color)
	return ImageTexture.create_from_image(atlas)

static func build_strip(source: Texture2D, cap: int, tile_width: int) -> Texture2D:
	var image = source.get_image()
	if image == null or image.is_empty():
		return null
	image.convert(Image.FORMAT_RGBA8)
	var w = image.get_width()
	var h = image.get_height()
	if cap < 3 or tile_width <= 0 or w <= cap * 2:
		return null
	var aw = cap * 2 + tile_width
	var atlas = Image.create(aw, h, false, Image.FORMAT_RGBA8)
	for y in range(h):
		# One continuous vertical shading profile preserves hover/pressed colors
		# and highlights but removes the rectangular sampled background patches.
		var profile = _row_average(image, y, cap, w - cap)
		for x in range(aw):
			var d = mini(x, aw - 1 - x)
			var color = profile
			if d < cap:
				var sx = d if x < aw / 2 else w - 1 - d
				color = _mix(image.get_pixel(sx, y), profile, _join_weight(d, cap))
			atlas.set_pixel(x, y, color)
	return ImageTexture.create_from_image(atlas)

static func style(atlas: Texture2D, corner: Vector2i, padding: Vector4) -> StyleBoxTexture:
	var box = StyleBoxTexture.new()
	box.texture = atlas
	box.texture_margin_left = corner.x
	box.texture_margin_right = corner.x
	box.texture_margin_top = corner.y
	box.texture_margin_bottom = corner.y
	box.content_margin_left = padding.x
	box.content_margin_top = padding.y
	box.content_margin_right = padding.z
	box.content_margin_bottom = padding.w
	box.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	box.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_TILE if corner.y > 0 else StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
	return box
