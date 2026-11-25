extends SceneTree
const Pack = preload("res://ui/theme/painted_frame_pack.gd")
const FIXTURES = "user://g22b-ci-fixtures"

func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var pack = Pack.new()
	if pack.load_pack("user://g22b-missing-pack") or pack.is_ready():
		_fail("Missing pack should fall back")
		return
	if DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(FIXTURES)) != OK:
		_fail("Cannot create fixtures")
		return
	for key in Pack.SIZES:
		var extent: Vector2i = Pack.SIZES[key]
		var image = Image.create(extent.x, extent.y, false, Image.FORMAT_RGBA8)
		image.fill(Color("#554433"))
		if image.save_png(ProjectSettings.globalize_path(FIXTURES.path_join(key + ".png"))) != OK:
			_fail("Cannot write synthetic fixture")
			return
	if not pack.load_pack(FIXTURES) or not pack.is_ready():
		_fail("Fixture loading failed")
		return
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.frame_pack = pack
	gallery.show_category("Panels")
	await process_frame
	if gallery.demo_panels.size() != 9 or gallery.frame_status.text != "14 / 14 PNGs loaded":
		_fail("Painted samples not activated")
		return
	for panel in gallery.demo_panels:
		var style = panel.get_theme_stylebox("panel")
		if not style is StyleBoxTexture or style.texture_margin_left <= 0:
			_fail("Nine-slice style missing")
			return
	if pack.style_for("portrait") != null:
		_fail("Portrait must not be stretched")
		return
	gallery.prefer_frames = false
	gallery.show_category("Panels")
	await process_frame
	if gallery.frame_status.text != "Original SVG active":
		_fail("SVG fallback failed")
		return
	if FileAccess.file_exists(Pack.ART_DIR.path_join("standard.png")):
		if not pack.load_pack():
			_fail("Real art pack invalid: " + pack.problem)
			return
		var tooltip_image: Image = pack.textures["tooltip"].get_image()
		if tooltip_image.get_size() != Pack.SIZES["tooltip"] + Vector2i(6, 6) or tooltip_image.get_used_rect().position.y < 3:
			_fail("Tooltip transparent guard missing")
			return
		print("REAL: 14 actual frame textures loaded")
	print("PASS: G2.2B frame loading, nine-slice samples, fixed-aspect art and SVG comparison")
	quit(0)
