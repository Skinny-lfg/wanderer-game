extends Node3D
## Isolated visual experiment. F6 only; no gameplay or main scene changes.
const ROOT := "res://assets/arena_3d/"
const SPRITES := "res://assets/arena/"
const UPDATED := "res://assets/arena_3d_v2_characters/"
var camera: Camera3D
var fighter_roots: Array[Node3D] = []
var fighter_sprites: Array[Sprite3D] = []
var fighter_heights: Array[float] = []
var fighter_ground_heights: Array[float] = []
var rear_wanderer: Texture2D
var side_wanderer: Texture2D
var mode_buttons: Array[Button] = []
var mode_hint: Label
var hud: CanvasLayer
var selected_view := 0
var using_fallback := false
var scenes: Dictionary = {}
var materials: Dictionary = {}
var missing: Array[String] = []
var fighters: Node3D
var shadow_texture: ImageTexture
var fire_lights: Array[OmniLight3D] = []
var fire_time := 0.0
var grave_idle_frames: Array[Texture2D] = []
var grave_attack_frames: Array[Texture2D] = []
var grave_anim_time := 0.0
var grave_playing_attack := false
const GRAVE_ANIM := UPDATED + "gravecaller_animation/"
const GRAVE_FRAME_TIME := 0.125

func _ready() -> void:
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#06070b")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#b7ad9e")
	env.ambient_light_energy = 0.07
	env.fog_enabled = true
	env.fog_light_color = Color("#08090e")
	env.fog_density = 0.043
	world.environment = env
	add_child(world)
	camera = Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 10.8
	camera.position = Vector3(0, 9.0, 21.0)
	add_child(camera)
	camera.look_at(Vector3(0, 1.2, -0.8))
	camera.current = true
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-48, -38, 0)
	key.light_color = Color("#f1dfca")
	key.light_energy = 0.28
	key.shadow_enabled = true
	add_child(key)
	var rim := DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-28, 145, 0)
	rim.light_color = Color("#98add6")
	rim.light_energy = 0.12
	add_child(rim)
	# Repeat the imported floor mesh, aligning its upper surface to Y=0.
	# Intentional small overlap avoids cracks between normalized tiles.
	for x in range(10):
		for z in range(8):
			_place("floor", Vector3((x - 4.5) * 2.50, 0, (z - 3.0) * 2.50), 0.20, 0, 2.52, 2.52, true)
	# Distant architecture; do not obstruct the combat lane.
	_place("facade", Vector3(-6.3, 0, -7.0), 4.2, 0.16, 5.2)
	_place("facade", Vector3(6.7, 0, -7.3), 4.5, -0.16, 5.4)
	_place("arch", Vector3(0, 0, -6.4), 4.7, 0, 3.9)
	# Distant silhouettes, beyond the lit ruins.
	_place("facade", Vector3(-5.0, -0.5, -12.0), 6.8, 0.1, 7.0)
	_place("facade", Vector3(6.0, -0.5, -13.5), 7.5, -0.1, 8.0)
	_place("platform", Vector3(0, 0, -4.7), 0.42, 0, 4.0, 3.0)
	_place("pillar", Vector3(-3.9, 0, -5.8), 3.7)
	_place("pillar", Vector3(4.0, 0, -5.9), 3.7)
	_place("statue", Vector3(-5.1, 0, -4.6), 2.7)
	_place("statue", Vector3(5.2, 0, -4.7), 2.7)
	_place("wall", Vector3(-7.0, 0, -3.2), 1.05, PI / 2.0, 3.2)
	_place("wall", Vector3(7.5, 0, -3.3), 1.05, PI / 2.0, 3.2)
	_place("tree", Vector3(-8.1, 0, -3.9), 4.2, 0.3)
	_place("broken_pillar", Vector3(8.0, 0, -1.0), 2.6, -0.4)
	_place("stairs", Vector3(-6.9, 0, -2.0), 0.8, 0.15)
	_place("stairs", Vector3(7.3, 0, -2.1), 0.8, -0.15)
	_place("brazier", Vector3(-4.1, 0, -3.7), 1.8)
	_place("brazier", Vector3(4.2, 0, -3.8), 1.8)
	_warm_light(Vector3(-4.1, 1.7, -3.7))
	_warm_light(Vector3(4.2, 1.7, -3.8))
	# Near-camera framing only at the edges; center stays open.
	_place("broken_pillar", Vector3(-8.9, 0, 4.8), 2.5, 0.6)
	_place("pillar", Vector3(9.2, 0, 5.3), 3.5, -0.3)
	_place("roots", Vector3(-7.6, 0, 5.7), 0.65, 0.4)
	_place("debris", Vector3(7.3, 0, 5.0), 0.45, -0.2)
	shadow_texture = _make_shadow()
	fighters = Node3D.new()
	fighters.name = "CombatSprites"
	add_child(fighters)
	_fighter("wanderer.webp", "wanderer.webp", 2.8)
	_fighter("gravebound_bulwark.png", "tank.png", 2.8)
	_fighter("oathbound_exarch.png", "berserker.png", 3.0)
	_fighter("gravecaller.png", "caster.png", 2.8)
	_fighter("ashen_executioner.png", "vampire.png", 2.9)
	side_wanderer = fighter_sprites[0].texture
	for candidate in [UPDATED + "wanderer_back.webp", UPDATED + "wanderer_back.png", SPRITES + "wanderer_back.webp", SPRITES + "wanderer_back.png"]:
		if ResourceLoader.exists(candidate):
			rear_wanderer = load(candidate) as Texture2D
			if rear_wanderer != null:
				break
	_load_grave_animation()
	_build_hud()
	_set_view(0)
	if not missing.is_empty():
		push_warning("Arena 2.5D asset pack missing/incomplete: " + ", ".join(missing))
		var notice := Label.new()
		notice.text = "Missing model pack: extract arena_3d assets and reimport."
		var overlay := CanvasLayer.new()
		add_child(overlay)
		overlay.add_child(notice)
		notice.position = Vector2(18, 18)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_1: _set_view(0)
			KEY_2: _set_view(1)
			KEY_SPACE: fighters.visible = not fighters.visible
			KEY_H: hud.visible = not hud.visible
			KEY_A: _trigger_grave_attack()

func _set_view(index: int) -> void:
	selected_view = index
	var positions: Array[Vector3] = []
	var aim := Vector3.ZERO
	match index:
		0:
			camera.projection = Camera3D.PROJECTION_ORTHOGONAL
			camera.size = 10.8
			camera.position = Vector3(0, 8.5, 23)
			aim = Vector3(0, 1.15, 0)
			positions = [Vector3(-5.0, 0, 1.4), Vector3(0.7, 0, -1.7), Vector3(5.4, 0, -1.7), Vector3(2.2, 0, 3.1), Vector3(6.5, 0, 3.1)]
		1:
			camera.projection = Camera3D.PROJECTION_PERSPECTIVE
			camera.fov = 43.0
			camera.position = Vector3(0, 2.9, 13.0)
			aim = Vector3(0, 2.2, -2.0)
			# Foreground hero and a single readable enemy line across the far lane.
			positions = [Vector3(-2.75, 0, 6.1), Vector3(-1.9, 0, -2.2), Vector3(1.1, 0, -2.5), Vector3(4.1, 0, -2.2), Vector3(7.1, 0, -2.5)]
	camera.look_at(aim)
	var hero := fighter_sprites[0]
	var hero_texture := rear_wanderer if index == 1 and rear_wanderer != null else side_wanderer
	if hero_texture != null:
		hero.texture = hero_texture
		fighter_ground_heights[0] = _ground_sprite(hero, fighter_heights[0])
	for i in range(fighter_roots.size()):
		if i >= positions.size():
			break
		fighter_roots[i].position = positions[i]
		var sprite := fighter_sprites[i]
		sprite.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
		var visual_scale := 1.12 if index == 1 and i == 0 else 1.0
		sprite.scale = Vector3.ONE * visual_scale
		sprite.position = Vector3(0, fighter_ground_heights[i] * visual_scale + 0.015, 0)
	for i in range(mode_buttons.size()):
		mode_buttons[i].set_pressed_no_signal(i == index)
	if mode_hint != null:
		mode_hint.text = ["Side view", "Cinematic duel"][index] + ("  |  LEGACY SPRITES: install V2 pack" if using_fallback else "")

func _panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.06, 0.07, 0.94)
	style.border_color = Color("#806e53")
	style.set_border_width_all(1)
	style.set_corner_radius_all(5)
	style.content_margin_left = 12.0
	style.content_margin_right = 12.0
	style.content_margin_top = 8.0
	style.content_margin_bottom = 8.0
	return style

func _make_label(value: String, font_size: int = 16, tint: Color = Color("#e6d6ba")) -> Label:
	var label := Label.new()
	label.text = value
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", tint)
	return label

func _stat_bar(value: float, tint: Color) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.max_value = 100
	bar.value = value
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(110, 8)
	var back := StyleBoxFlat.new()
	back.bg_color = Color("#30292b")
	back.set_corner_radius_all(2)
	var fill := StyleBoxFlat.new()
	fill.bg_color = tint
	fill.set_corner_radius_all(2)
	bar.add_theme_stylebox_override("background", back)
	bar.add_theme_stylebox_override("fill", fill)
	return bar

func _build_hud() -> void:
	hud = CanvasLayer.new()
	hud.layer = 5
	add_child(hud)
	var screen := Control.new()
	hud.add_child(screen)
	screen.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	screen.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var theme_path := "res://ui/theme/stylized_gothic_theme.tres"
	if ResourceLoader.exists(theme_path):
		screen.theme = load(theme_path) as Theme
	var top := PanelContainer.new()
	screen.add_child(top)
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 16
	top.offset_right = -16
	top.offset_top = 12
	top.offset_bottom = 70
	top.add_theme_stylebox_override("panel", _panel_style())
	var line := HBoxContainer.new()
	line.add_theme_constant_override("separation", 12)
	top.add_child(line)
	var heading := VBoxContainer.new()
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	line.add_child(heading)
	heading.add_child(_make_label("SEVENTH REACH  /  ARENA EXPERIMENT", 18))
	mode_hint = _make_label("", 12, Color("#b7aa99"))
	heading.add_child(mode_hint)
	var group := ButtonGroup.new()
	for i in range(2):
		var button := Button.new()
		button.text = ["1  Side", "2  Duel"][i]
		button.toggle_mode = true
		button.button_group = group
		button.custom_minimum_size = Vector2(105, 34)
		button.pressed.connect(_set_view.bind(i))
		line.add_child(button)
		mode_buttons.append(button)
	var bottom := PanelContainer.new()
	screen.add_child(bottom)
	bottom.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	bottom.offset_left = 16
	bottom.offset_right = -16
	bottom.offset_top = -110
	bottom.offset_bottom = -12
	bottom.add_theme_stylebox_override("panel", _panel_style())
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)
	bottom.add_child(row)
	var hero := VBoxContainer.new()
	hero.custom_minimum_size.x = 195
	row.add_child(hero)
	hero.add_child(_make_label("Wanderer", 19))
	hero.add_child(_make_label("HP  840 / 1000", 12))
	hero.add_child(_stat_bar(84, Color("#a83d42")))
	hero.add_child(_make_label("Mana  72 / 100", 12))
	hero.add_child(_stat_bar(72, Color("#547cbe")))
	var divider := VSeparator.new()
	row.add_child(divider)
	var foes := VBoxContainer.new()
	foes.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(foes)
	foes.add_child(_make_label("ELITE ENCOUNTER  ·  STATIC UI PREVIEW", 13, Color("#c1a476")))
	var roster := GridContainer.new()
	roster.columns = 4
	roster.add_theme_constant_override("h_separation", 10)
	foes.add_child(roster)
	var names := ["Gravebound Bulwark", "Oathbound Exarch", "Gravecaller", "Ashen Executioner"] if not using_fallback else ["Legacy Tank", "Legacy Berserker", "Legacy Caster", "Legacy Vampire"]
	for i in range(4):
		var enemy := VBoxContainer.new()
		enemy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		roster.add_child(enemy)
		enemy.add_child(_make_label(names[i], 13))
		enemy.add_child(_stat_bar([100.0, 76.0, 92.0, 64.0][i], Color("#973a42")))
	foes.add_child(_make_label("1–2  Camera   |   H  HUD   |   Space  Sprites   |   A  Gravecaller attack", 12, Color("#b7aa99")))

func _load_model(key: String) -> PackedScene:
	if scenes.has(key):
		return scenes[key] as PackedScene
	var folder := ROOT + key
	for filename in DirAccess.get_files_at(folder):
		if filename.get_extension().to_lower() == "fbx":
			var path := folder.path_join(filename)
			if ResourceLoader.exists(path):
				var resource := load(path) as PackedScene
				if resource != null:
					scenes[key] = resource
					return resource
	scenes[key] = null
	missing.append(key)
	return null

func _material(key: String) -> StandardMaterial3D:
	if materials.has(key):
		return materials[key] as StandardMaterial3D
	var folder := ROOT + key
	var mat := StandardMaterial3D.new()
	mat.roughness = 0.88
	var found := false
	for directory in DirAccess.get_directories_at(folder):
		var sub := folder.path_join(directory)
		for filename in DirAccess.get_files_at(sub):
			var path := sub.path_join(filename)
			if not ResourceLoader.exists(path):
				continue
			if filename.ends_with("_basecolor.jpg"):
				mat.albedo_texture = load(path) as Texture2D
				found = mat.albedo_texture != null
			elif filename.ends_with("_normal.jpg"):
				mat.normal_texture = load(path) as Texture2D
				mat.normal_enabled = mat.normal_texture != null
			elif filename.ends_with("_roughness.jpg"):
				mat.roughness_texture = load(path) as Texture2D
				mat.roughness = 1.0
			elif filename.ends_with("_metallic.jpg"):
				mat.metallic_texture = load(path) as Texture2D
				mat.metallic = 1.0
	if not found:
		missing.append(key + ":basecolor")
		materials[key] = null
		return null
	materials[key] = mat
	return mat

func _mesh_nodes(node: Node, result: Array[MeshInstance3D]) -> void:
	if node is MeshInstance3D and node.mesh != null:
		result.append(node as MeshInstance3D)
	for child in node.get_children():
		_mesh_nodes(child, result)

func _place(key: String, at: Vector3, height: float, yaw: float = 0.0, width: float = 0.0, depth: float = 0.0, top_align: bool = false) -> void:
	var model := _load_model(key)
	if model == null:
		return
	var root := Node3D.new()
	root.name = key
	add_child(root, true)
	var pivot := Node3D.new()
	root.add_child(pivot)
	pivot.add_child(model.instantiate())
	var meshes: Array[MeshInstance3D] = []
	_mesh_nodes(pivot, meshes)
	if meshes.is_empty():
		missing.append(key + ":mesh")
		root.queue_free()
		return
	var material := _material(key)
	var lo := Vector3(INF, INF, INF)
	var hi := Vector3(-INF, -INF, -INF)
	for mesh in meshes:
		if material != null:
			mesh.material_override = material
		var b := mesh.get_aabb()
		var transform_to_pivot := pivot.global_transform.affine_inverse() * mesh.global_transform
		for i in range(8):
			var p := transform_to_pivot * b.get_endpoint(i)
			lo = lo.min(p)
			hi = hi.max(p)
	var extent := hi - lo
	if extent.y < 0.0001 or extent.x < 0.0001 or extent.z < 0.0001:
		missing.append(key + ":bounds")
		root.queue_free()
		return
	var factor := height / extent.y
	# Normalize proportions from actual imported bounds. Explicit width/depth for tiles.
	var scale_vector := Vector3.ONE * factor
	if width > 0.0:
		scale_vector.x = width / extent.x
	if depth > 0.0:
		scale_vector.z = depth / extent.z
	pivot.position = -Vector3((lo.x + hi.x) * 0.5, hi.y if top_align else lo.y, (lo.z + hi.z) * 0.5)
	root.scale = scale_vector
	root.rotation.y = yaw
	root.position = at

func _warm_light(at: Vector3) -> void:
	var light := OmniLight3D.new()
	light.position = at
	light.light_color = Color("#ffb570")
	light.light_energy = 4.0
	light.omni_range = 5.2
	light.omni_attenuation = 1.5
	light.shadow_enabled = true
	light.light_size = 0.45
	add_child(light)
	fire_lights.append(light)
	_add_embers(at)
	_add_mist(at + Vector3(0, 0.3, 0))

func _process(delta: float) -> void:
	fire_time += delta
	for i in range(fire_lights.size()):
		fire_lights[i].light_energy = 4.0 + 0.22 * sin(fire_time * 7.0 + i * 2.0) + 0.12 * sin(fire_time * 13.0 + i)

	_update_grave_animation(delta)

func _load_grave_animation() -> void:
	for i in range(8):
		var idle_path := GRAVE_ANIM + ("idle_%02d.png" % i)
		var attack_path := GRAVE_ANIM + ("attack_%02d.png" % i)
		if not ResourceLoader.exists(idle_path) or not ResourceLoader.exists(attack_path):
			grave_idle_frames.clear()
			grave_attack_frames.clear()
			push_warning("Gravecaller animation frames missing; static sprite retained.")
			return
		var idle_tex := load(idle_path) as Texture2D
		var attack_tex := load(attack_path) as Texture2D
		if idle_tex == null or attack_tex == null:
			grave_idle_frames.clear()
			grave_attack_frames.clear()
			return
		grave_idle_frames.append(idle_tex)
		grave_attack_frames.append(attack_tex)
	if fighter_sprites.size() > 3:
		var grave := fighter_sprites[3]
		grave.texture = grave_idle_frames[0]
		grave.pixel_size = fighter_heights[3] / 640.0
		# Keep a common centered canvas and a fixed world-space ground height.
		fighter_ground_heights[3] = _ground_sprite(grave, fighter_heights[3])
		grave.scale = Vector3.ONE

func _trigger_grave_attack() -> void:
	if grave_idle_frames.size() != 8 or grave_attack_frames.size() != 8:
		return
	if grave_playing_attack:
		return
	grave_playing_attack = true
	grave_anim_time = 0.0
	if fighter_sprites.size() > 3:
		fighter_sprites[3].texture = grave_attack_frames[0]

func _update_grave_animation(delta: float) -> void:
	if fighter_sprites.size() <= 3 or grave_idle_frames.size() != 8 or grave_attack_frames.size() != 8:
		return
	grave_anim_time += delta
	if grave_playing_attack and grave_anim_time >= 8.0 * GRAVE_FRAME_TIME:
		grave_playing_attack = false
		grave_anim_time = 0.0
	var frame := int(grave_anim_time / GRAVE_FRAME_TIME) % 8
	var frames := grave_attack_frames if grave_playing_attack else grave_idle_frames
	fighter_sprites[3].texture = frames[frame]

func _add_mist(at: Vector3) -> void:
	var particles := CPUParticles3D.new()
	particles.position = at
	particles.amount = 12
	particles.lifetime = 4.5
	particles.direction = Vector3.UP
	particles.spread = 32.0
	particles.gravity = Vector3.ZERO
	particles.initial_velocity_min = 0.18
	particles.initial_velocity_max = 0.4
	particles.scale_amount_min = 0.6
	particles.scale_amount_max = 1.5
	var mesh := QuadMesh.new()
	mesh.size = Vector2(1.0, 1.0)
	var mat := StandardMaterial3D.new()
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.albedo_texture = shadow_texture if shadow_texture != null else _make_shadow()
	mat.albedo_color = Color(0.5, 0.48, 0.45, 0.16)
	mesh.material = mat
	particles.mesh = mesh
	add_child(particles)

func _add_embers(at: Vector3) -> void:
	var particles := CPUParticles3D.new()
	particles.position = at
	particles.amount = 18
	particles.lifetime = 2.0
	particles.direction = Vector3.UP
	particles.spread = 22.0
	particles.gravity = Vector3(0, 0.15, 0)
	particles.initial_velocity_min = 0.3
	particles.initial_velocity_max = 0.9
	particles.scale_amount_min = 0.4
	particles.scale_amount_max = 1.0
	var mesh := QuadMesh.new()
	mesh.size = Vector2(0.035, 0.035)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.albedo_color = Color("#f5a450")
	mesh.material = mat
	particles.mesh = mesh
	add_child(particles)

func _make_shadow() -> ImageTexture:
	var image := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in range(64):
		for x in range(64):
			var r := Vector2((x - 31.5) / 31.5, (y - 31.5) / 31.5).length()
			image.set_pixel(x, y, Color(0.02, 0.02, 0.035, pow(maxf(0.0, 1.0 - r), 0.85) * 0.95))
	return ImageTexture.create_from_image(image)

func _fighter(filename: String, fallback: String, height: float) -> void:
	var path := UPDATED + filename
	if not ResourceLoader.exists(path):
		path = SPRITES + fallback
		using_fallback = true
	var root := Node3D.new()
	fighters.add_child(root)
	var shadow := Sprite3D.new()
	shadow.texture = shadow_texture
	shadow.pixel_size = 2.1 / 64.0
	shadow.scale.y = 0.72
	shadow.rotation_degrees.x = -90.0
	shadow.position = Vector3(0, 0.025, 0)
	shadow.shaded = false
	root.add_child(shadow)
	var sprite := Sprite3D.new()
	if ResourceLoader.exists(path):
		var tex := load(path) as Texture2D
		if tex != null:
			sprite.texture = tex
			sprite.pixel_size = height / float(tex.get_height())

	else:
		missing.append(filename)
	sprite.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	sprite.shaded = false
	# Keep painted character colors readable independently of the dark environment.
	sprite.modulate = Color(1.0, 0.98, 0.95, 1.0)
	var ground_height := _ground_sprite(sprite, height)
	sprite.position = Vector3(0, ground_height + 0.015, 0)
	root.add_child(sprite)
	fighter_roots.append(root)
	fighter_sprites.append(sprite)
	fighter_heights.append(height)
	fighter_ground_heights.append(ground_height)

func _ground_sprite(sprite: Sprite3D, height: float) -> float:
	# Centered sprite geometry avoids signed offset conventions entirely.
	sprite.centered = true
	sprite.offset = Vector2.ZERO
	if sprite.texture == null:
		return height * 0.5
	var tex := sprite.texture
	var canvas_height := float(tex.get_height())
	sprite.pixel_size = height / maxf(canvas_height, 1.0)
	var bottom := canvas_height
	var image := tex.get_image()
	if image != null and not image.is_empty():
		if image.is_compressed():
			image.decompress()
		var bounds := image.get_used_rect()
		if bounds.has_area():
			bottom = float(bounds.end.y)
	return maxf(0.0, (bottom - canvas_height * 0.5) * sprite.pixel_size)

