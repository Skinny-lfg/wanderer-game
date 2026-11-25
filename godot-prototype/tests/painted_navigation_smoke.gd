extends SceneTree
const Pack = preload("res://ui/theme/painted_navigation_pack.gd")
const FIXTURES = "user://g22c-ci-fixtures"
func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var pack = Pack.new()
	if pack.load_pack("user://g22c-missing-pack") or pack.is_ready():
		_fail("Missing pack should fall back")
		return
	if DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(FIXTURES)) != OK:
		_fail("Cannot create fixtures")
		return
	var sizes = pack.expected_sizes()
	for key in sizes:
		var extent: Vector2i = sizes[key]
		var img = Image.create(extent.x, extent.y, false, Image.FORMAT_RGBA8)
		img.fill(Color("#554433"))
		if img.save_png(ProjectSettings.globalize_path(FIXTURES.path_join(key + ".png"))) != OK:
			_fail("Cannot save fixture")
			return
	if not pack.load_pack(FIXTURES) or not pack.is_ready():
		_fail("Fixture loading failed")
		return
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.navigation_pack = pack
	gallery.show_category("Navigation")
	await process_frame
	if gallery.demo_tabs.size() != 5 or gallery.navigation_status.text != "11 / 11 PNGs loaded":
		_fail("Painted tabs missing")
		return
	for i in range(5):
		var tab = gallery.demo_tabs[i]
		if tab.icon == null or tab.text != Pack.LABELS[i] or not tab.get_theme_stylebox("normal") is StyleBoxTexture:
			_fail("Tab icon or style missing")
			return
		tab.set_pressed(true)
		for j in range(5):
			if gallery.demo_tabs[j].button_pressed != (i == j):
				_fail("Exclusive selection failed")
				return
	var compact = Button.new()
	if not pack.apply_to(compact, "camp", true) or compact.icon_alignment != HORIZONTAL_ALIGNMENT_CENTER or compact.vertical_icon_alignment != VERTICAL_ALIGNMENT_CENTER or not compact.text.is_empty():
		compact.free()
		_fail("Compact navigation icon not centered")
		return
	compact.free()
	gallery.prefer_navigation = false
	gallery.show_category("Navigation")
	if gallery.navigation_status.text != "Original SVG active":
		_fail("SVG fallback failed")
		return
	if FileAccess.file_exists(Pack.ART_DIR.path_join("tab_normal.png")):
		if not pack.load_pack():
			_fail("Actual navigation art failed: " + pack.problem)
			return
		for id in Pack.IDS:
			var icon_image: Image = pack.textures["icon_" + id].get_image()
			var bounds: Rect2i = icon_image.get_used_rect()
			if not bounds.has_area() or maxi(bounds.size.x, bounds.size.y) != 26:
				_fail("Navigation icon normalization failed")
				return
		print("REAL: 11 navigation textures loaded")
	print("PASS: G2.2C five tabs, icons, exclusive selection and SVG fallback")
	quit(0)
