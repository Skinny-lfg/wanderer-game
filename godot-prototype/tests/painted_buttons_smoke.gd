extends SceneTree
const Pack = preload("res://ui/theme/painted_button_pack.gd")
const FIXTURES = "user://g22a-ci-fixtures"

func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var pack = Pack.new()
	if pack.load_pack("user://g22a-missing-pack") or pack.is_ready():
		_fail("Missing pack should fall back")
		return
	if DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(FIXTURES)) != OK:
		_fail("Cannot create fixtures")
		return
	for variant in Pack.VARIANTS:
		for state in Pack.STATES:
			var image = Image.create(371, 76, false, Image.FORMAT_RGBA8)
			image.fill(Color("#553322"))
			if image.save_png(ProjectSettings.globalize_path(FIXTURES.path_join(variant + "_" + state + ".png"))) != OK:
				_fail("Cannot create synthetic fixture")
				return
	if not pack.load_pack(FIXTURES) or not pack.is_ready():
		_fail("Fixture pack should load: " + pack.problem)
		return
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	gallery.painted_pack = pack
	gallery.show_category("Buttons")
	await process_frame
	if gallery.demo_buttons.size() != 4 or gallery.active_pack_label.text != "16 / 16 PNGs loaded":
		_fail("Painted gallery did not activate")
		return
	for variant in Pack.VARIANTS:
		var samples = gallery.demo_buttons[variant]
		if samples.size() != 4 or not samples[3].disabled:
			_fail("Missing state samples: " + variant)
			return
		var live = samples[0]
		for state in Pack.STATES:
			var box = live.get_theme_stylebox(state)
			if not box is StyleBoxTexture or box.texture.get_size() != Vector2(Pack.CORNER * 2 + Pack.SAMPLE * 2):
				_fail("Painted style not connected: " + variant + "/" + state)
				return
			if box.texture_margin_left != Pack.CORNER.x or box.texture_margin_top != Pack.CORNER.y or box.axis_stretch_horizontal != StyleBoxTexture.AXIS_STRETCH_MODE_TILE or box.axis_stretch_vertical != StyleBoxTexture.AXIS_STRETCH_MODE_TILE:
				_fail("Unexpected margins")
				return
	gallery.prefer_painted = false
	gallery.show_category("Buttons")
	await process_frame
	if gallery.active_pack_label.text != "Original SVG active":
		_fail("Original SVG comparison failed")
		return
	print("PASS: G2.2A missing-pack fallback, synthetic sixteen-PNG load, native state wiring, SVG comparison")
	quit(0)
