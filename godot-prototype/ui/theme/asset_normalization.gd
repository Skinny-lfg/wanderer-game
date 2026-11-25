extends RefCounted
## Non-destructive normalization; original artwork remains unchanged on disk.
const SLOT_CANVAS = Vector2i(256, 256)
const SLOT_BODY = 224.0
const SLOT_GUARD = 4.0
const SLOT_SAFE_FRACTION = 0.66

static func padded(source: Image, guard: int) -> Image:
	var out = Image.create(source.get_width() + guard * 2, source.get_height() + guard * 2, false, Image.FORMAT_RGBA8)
	out.fill(Color(0, 0, 0, 0))
	out.blit_rect(source, Rect2i(Vector2i.ZERO, source.get_size()), Vector2i(guard, guard))
	return out

static func fit_icon(source: Image, canvas: Vector2i, usable: int) -> Image:
	var out = Image.create(canvas.x, canvas.y, false, Image.FORMAT_RGBA8)
	out.fill(Color(0, 0, 0, 0))
	var bounds = source.get_used_rect()
	if not bounds.has_area():
		return out
	var art = source.get_region(bounds)
	var scale = float(usable) / float(maxi(bounds.size.x, bounds.size.y))
	var target = Vector2i(maxi(1, roundi(bounds.size.x * scale)), maxi(1, roundi(bounds.size.y * scale)))
	art.resize(target.x, target.y, Image.INTERPOLATE_LANCZOS)
	out.blit_rect(art, Rect2i(Vector2i.ZERO, target), (canvas - target) / 2)
	return out

# Median side extents outside the central ornament axes. Ignore faint alpha fringes.
static func slot_body_bounds(source: Image) -> Rect2i:
	var left: Array[int] = []
	var right: Array[int] = []
	var top: Array[int] = []
	var bottom: Array[int] = []
	var w = source.get_width()
	var h = source.get_height()
	for fraction in [0.30, 0.35, 0.40, 0.60, 0.65, 0.70]:
		var y = roundi(h * fraction)
		var x = roundi(w * fraction)
		var lo = w
		var hi = -1
		for xx in range(w):
			if source.get_pixel(xx, y).a >= 0.5:
				lo = mini(lo, xx)
				hi = maxi(hi, xx)
		if hi >= lo:
			left.append(lo)
			right.append(hi + 1)
		lo = h
		hi = -1
		for yy in range(h):
			if source.get_pixel(x, yy).a >= 0.5:
				lo = mini(lo, yy)
				hi = maxi(hi, yy)
		if hi >= lo:
			top.append(lo)
			bottom.append(hi + 1)
	if left.is_empty() or top.is_empty():
		return source.get_used_rect()
	left.sort()
	right.sort()
	top.sort()
	bottom.sort()
	var l = left[left.size() / 2]
	var r = right[right.size() / 2]
	var t = top[top.size() / 2]
	var b = bottom[bottom.size() / 2]
	return Rect2i(l, t, r - l, b - t)

static func normalize_slot(source: Image) -> Image:
	var used = source.get_used_rect()
	var body = slot_body_bounds(source)
	if not used.has_area() or not body.has_area():
		return source
	var center = Vector2(body.position) + Vector2(body.size) * 0.5
	var farthest = maxf(maxf(center.x - used.position.x, used.end.x - center.x), maxf(center.y - used.position.y, used.end.y - center.y))
	var scale = minf(SLOT_BODY / float(maxi(body.size.x, body.size.y)), (128.0 - SLOT_GUARD - 1.0) / maxf(farthest, 1.0))
	var art = source.get_region(used)
	var target = Vector2i(maxi(1, roundi(used.size.x * scale)), maxi(1, roundi(used.size.y * scale)))
	art.resize(target.x, target.y, Image.INTERPOLATE_LANCZOS)
	var offset = Vector2i((Vector2(128, 128) - (center - Vector2(used.position)) * scale).round())
	offset.x = clampi(offset.x, 4, 252 - target.x)
	offset.y = clampi(offset.y, 4, 252 - target.y)
	var out = Image.create(256, 256, false, Image.FORMAT_RGBA8)
	out.fill(Color(0, 0, 0, 0))
	out.blit_rect(art, Rect2i(Vector2i.ZERO, target), offset)
	return out

# A conservative, authored common safe square, independent of frame state.
# Alpha cannot distinguish the opaque inner background from the metal bevel.
static func slot_safe_rect(slot_extent: Vector2) -> Rect2:
	var side = minf(slot_extent.x, slot_extent.y)
	var usable = Vector2.ONE * side * SLOT_SAFE_FRACTION
	return Rect2((slot_extent - usable) * 0.5, usable)

static func fit_rect(source_extent: Vector2, safe: Rect2) -> Rect2:
	if source_extent.x <= 0.0 or source_extent.y <= 0.0:
		return Rect2()
	var factor = minf(safe.size.x / source_extent.x, safe.size.y / source_extent.y)
	var fitted = source_extent * factor
	return Rect2(safe.position + (safe.size - fitted) * 0.5, fitted)
