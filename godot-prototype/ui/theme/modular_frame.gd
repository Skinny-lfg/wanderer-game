extends RefCounted
## Build a compact nine-region atlas from legacy painted art. The four corners
## are copied verbatim by default; edge and center tiles are mirrored for repeat continuity.
## Panel surfaces may feather only the innermost corner/edge pixels into a quiet background.
## The sample coordinates are provisional art-direction choices, not an automatic
## ornament detector. Keep large unique ornaments as separate fixed-size sprites.

static func _copy(source: Image, atlas: Image, region: Rect2i, at: Vector2i) -> void:
	atlas.blit_rect(source, region, at)

static func _tile(source: Image, atlas: Image, region: Rect2i, at: Vector2i, repeat_x: bool, repeat_y: bool) -> void:
	var part = source.get_region(region)
	for y in range(2 if repeat_y else 1):
		for x in range(2 if repeat_x else 1):
			var piece = part.duplicate() as Image
			if x == 1:
				piece.flip_x()
			if y == 1:
				piece.flip_y()
			atlas.blit_rect(piece, Rect2i(Vector2i.ZERO, region.size), at + Vector2i(x * region.size.x, y * region.size.y))

static func build(source: Texture2D, corner: Vector2i, sample: Vector2i, quiet_surface: bool = false) -> Texture2D:
	var image = source.get_image()
	if image == null or image.is_empty():
		return null
	image.convert(Image.FORMAT_RGBA8)
	var w = image.get_width()
	var h = image.get_height()
	if corner.x <= 0 or corner.y <= 0 or sample.x <= 0 or sample.y <= 0 or w < corner.x * 2 + sample.x or h < corner.y * 2 + sample.y:
		return null
	# Select a quarter of the available span, away from common center crests.
	var sx = corner.x + (w - corner.x * 2 - sample.x) / 4
	var sy = corner.y + (h - corner.y * 2 - sample.y) / 4
	var tw = sample.x * 2
	var th = sample.y * 2
	var ax = corner.x + tw
	var ay = corner.y + th
	var atlas = Image.create(corner.x * 2 + tw, corner.y * 2 + th, false, Image.FORMAT_RGBA8)
	atlas.fill(Color(0, 0, 0, 0))
	_copy(image, atlas, Rect2i(0, 0, corner.x, corner.y), Vector2i.ZERO)
	_copy(image, atlas, Rect2i(w - corner.x, 0, corner.x, corner.y), Vector2i(ax, 0))
	_copy(image, atlas, Rect2i(0, h - corner.y, corner.x, corner.y), Vector2i(0, ay))
	_copy(image, atlas, Rect2i(w - corner.x, h - corner.y, corner.x, corner.y), Vector2i(ax, ay))
	_tile(image, atlas, Rect2i(sx, 0, sample.x, corner.y), Vector2i(corner.x, 0), true, false)
	_tile(image, atlas, Rect2i(sx, h - corner.y, sample.x, corner.y), Vector2i(corner.x, ay), true, false)
	_tile(image, atlas, Rect2i(0, sy, corner.x, sample.y), Vector2i(0, corner.y), false, true)
	_tile(image, atlas, Rect2i(w - corner.x, sy, corner.x, sample.y), Vector2i(ax, corner.y), false, true)
	_tile(image, atlas, Rect2i(sx, sy, sample.x, sample.y), corner, true, true)
	if quiet_surface:
		_quiet_surface(atlas, image, corner)
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
	box.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	return box

# A deliberately plain panel interior prevents the mirrored leather grain from
# reading as a checkerboard at large sizes. Feather only the interior-side
# pixels of each border/corner; preserve the external metal silhouette.
static func _quiet_surface(atlas: Image, source: Image, corner: Vector2i) -> void:
	var total = Color(0, 0, 0, 0)
	var count = 0
	var inner = Rect2i(corner, source.get_size() - corner * 2)
	for y in range(inner.position.y, inner.end.y):
		for x in range(inner.position.x, inner.end.x):
			var pixel = source.get_pixel(x, y)
			if pixel.a >= 0.95:
				total += pixel
				count += 1
	var background = Color("#201d1b")
	if count > 0:
		background = total / float(count)
		background.a = 1.0
	var feather = 10.0
	var w = atlas.get_width()
	var h = atlas.get_height()
	for y in range(h):
		var dy = mini(y, h - 1 - y)
		var fy = clampf((float(dy) - (corner.y - feather)) / (feather - 1.0), 0.0, 1.0)
		for x in range(w):
			var dx = mini(x, w - 1 - x)
			var fx = clampf((float(dx) - (corner.x - feather)) / (feather - 1.0), 0.0, 1.0)
			var weight = smoothstep(0.0, 1.0, minf(fx, fy))
			if weight > 0.0:
				atlas.set_pixel(x, y, atlas.get_pixel(x, y).lerp(background, weight))
