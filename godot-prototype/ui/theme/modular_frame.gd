extends RefCounted
## Build a compact nine-region atlas from legacy painted art. The four corners
## are copied verbatim; edge and center tiles are mirrored for repeat continuity.
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

static func build(source: Texture2D, corner: Vector2i, sample: Vector2i) -> Texture2D:
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
