extends Node3D
## Isolated visual experiment. F6 only; no gameplay or main scene changes.
const ROOT := "res://assets/arena_3d/"
const SPRITES := "res://assets/arena/"
var scenes: Dictionary = {}
var materials: Dictionary = {}
var missing: Array[String] = []
var fighters: Node3D
var shadow_texture: ImageTexture

func _ready() -> void:
	var world := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#202530")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#a5aec5")
	env.ambient_light_energy = 0.55
	env.fog_enabled = true
	env.fog_light_color = Color("#53596b")
	env.fog_density = 0.024
	world.environment = env
	add_child(world)
	var camera := Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 10.5
	camera.position = Vector3(0, 9.0, 21.0)
	add_child(camera)
	camera.look_at(Vector3(0, 1.2, -0.8))
	camera.current = true
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-44, -30, 0)
	key.light_color = Color("#c7d5f5")
	key.light_energy = 1.15
	key.shadow_enabled = true
	add_child(key)
	# Repeat the imported floor mesh, aligning its upper surface to Y=0.
	# Intentional small overlap avoids cracks between normalized tiles.
	for x in range(8):
		for z in range(6):
			_place("floor", Vector3((x - 3.5) * 2.50, 0, (z - 2.5) * 2.50), 0.20, 0, 2.52, 2.52, true)
	# Distant architecture; do not obstruct the combat lane.
	_place("facade", Vector3(-6.3, 0, -7.0), 4.2, 0.16, 5.2)
	_place("facade", Vector3(6.7, 0, -7.3), 4.5, -0.16, 5.4)
	_place("arch", Vector3(0, 0, -6.4), 4.7, 0, 3.9)
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
	_fighter("wanderer.webp", Vector3(-4.0, 0, 1.4), 2.6)
	_fighter("tank.png", Vector3(1.7, 0, -0.3), 2.6)
	_fighter("berserker.png", Vector3(4.3, 0, -0.5), 2.5)
	_fighter("caster.png", Vector3(2.6, 0, 2.5), 2.3)
	_fighter("vampire.png", Vector3(5.4, 0, 2.3), 2.3)
	if not missing.is_empty():
		push_warning("Arena 2.5D asset pack missing/incomplete: " + ", ".join(missing))
		var notice := Label.new()
		notice.text = "Missing model pack: extract arena_3d assets and reimport."
		var overlay := CanvasLayer.new()
		add_child(overlay)
		overlay.add_child(notice)
		notice.position = Vector2(18, 18)

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_SPACE:
		fighters.visible = not fighters.visible

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
	light.light_energy = 1.35
	light.omni_range = 4.5
	add_child(light)

func _make_shadow() -> ImageTexture:
	var image := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in range(64):
		for x in range(64):
			var r := Vector2((x - 31.5) / 31.5, (y - 31.5) / 31.5).length()
			image.set_pixel(x, y, Color(0.02, 0.02, 0.035, pow(maxf(0.0, 1.0 - r), 2.0) * 0.75))
	return ImageTexture.create_from_image(image)

func _fighter(filename: String, at: Vector3, height: float) -> void:
	var path := SPRITES + filename
	if not ResourceLoader.exists(path):
		missing.append(filename)
		return
	var tex := load(path) as Texture2D
	if tex == null:
		return
	var shadow := Sprite3D.new()
	shadow.texture = shadow_texture
	shadow.pixel_size = 1.8 / 64.0
	shadow.scale.y = 0.6
	shadow.rotation_degrees.x = -90.0
	shadow.position = at + Vector3(0, 0.025, 0)
	fighters.add_child(shadow)
	var sprite := Sprite3D.new()
	sprite.texture = tex
	sprite.pixel_size = height / float(tex.get_height())
	sprite.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	sprite.shaded = false
	sprite.position = at + Vector3(0, height * 0.5, 0)
	fighters.add_child(sprite)
