extends RefCounted
const ART_DIR = "res://ui/assets/inventory/g22d"
const RARITIES = ["rarity_grey", "rarity_common", "rarity_uncommon", "rarity_rare", "rarity_epic", "rarity_legendary"]
const STATES = ["slot_empty", "slot_hover", "slot_selected", "slot_locked"]
var textures: Dictionary = {}
var problem: String = ""

func load_pack(directory: String = ART_DIR) -> bool:
	textures.clear()
	problem = ""
	var pending: Dictionary = {}
	for key in RARITIES + STATES:
		var path = directory.path_join(key + ".png")
		if not FileAccess.file_exists(path):
			problem = "Missing " + key + ".png"
			return false
		var img = Image.new()
		if img.load(ProjectSettings.globalize_path(path)) != OK or img.get_size() != Vector2i(256, 256):
			problem = "Invalid slot texture: " + key
			return false
		img.convert(Image.FORMAT_RGBA8)
		pending[key] = ImageTexture.create_from_image(img)
	textures = pending
	return true

func is_ready() -> bool:
	return textures.size() == 10
