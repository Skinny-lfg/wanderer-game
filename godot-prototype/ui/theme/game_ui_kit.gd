extends RefCounted
## Shared presentation assets for the experimental shell. No domain state.
const V2 = preload("res://ui/theme/ui_kit_v2.gd")
# One presentation switch for the game shell; gallery retains G2.2.
const USE_V2 = true
var use_v2: bool = USE_V2
const Buttons = preload("res://ui/theme/painted_button_pack.gd")
const Navigation = preload("res://ui/theme/painted_navigation_pack.gd")
const Frames = preload("res://ui/theme/painted_frame_pack.gd")
const Slots = preload("res://ui/theme/painted_slot_pack.gd")
const Simple = preload("res://ui/theme/simple_frame.gd")
const Profiles = preload("res://ui/theme/resource_hud_profiles.gd")
const SlotScene = preload("res://ui/components/inventory/item_slot.tscn")
const TooltipScene = preload("res://ui/components/inventory/item_tooltip.tscn")
const Bar = preload("res://ui/components/hud/resource_bar.gd")
const Portrait = preload("res://ui/components/hud/portrait_medallion.gd")
const HERO = preload("res://assets/arena/wanderer.webp")
const BASE_THEME = preload("res://ui/theme/stylized_gothic_theme.tres")
var buttons = Buttons.new()
var navigation = Navigation.new()
var frames = Frames.new()
var slots = Slots.new()
var profiles = Profiles.new()
var ui_font: Font
var heading_font: Font
var theme: Theme
var simple_style: StyleBoxTexture

func _init() -> void:
	buttons.load_pack()
	navigation.load_pack()
	frames.load_pack()
	slots.load_pack()
	ui_font = profiles.font_for(2)
	heading_font = profiles.font_for(0)
	theme = BASE_THEME.duplicate() as Theme
	theme.default_font = ui_font
	theme.set_font("font", "Heading", heading_font)
	simple_style = V2.panel_style() if use_v2 else Simple.png_style("neutral")

func ready_for_preview() -> bool:
	return buttons.is_ready() and navigation.is_ready() and frames.is_ready() and slots.is_ready()

func panel(host: Node, at: Vector2, extent: Vector2, family: String = "simple") -> Panel:
	var node = Panel.new()
	node.name = "KitPanel_" + family
	var style = frames.style_for(family) if family != "simple" else simple_style
	if style == null:
		style = simple_style
	node.add_theme_stylebox_override("panel", style)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(node)
	node.position = at
	node.size = extent
	return node

func slot(host: Node, at: Vector2, side: float, art: Texture2D = null, rarity: int = 1, equipped: bool = false, item_name: String = "", category: String = "") -> Button:
	var node = SlotScene.instantiate()
	node.theme = theme
	node.custom_minimum_size = Vector2.ONE * side
	node.item_art = art
	node.rarity = rarity
	node.equipped = equipped
	node.painted_textures = slots.textures
	node.v2_preview = use_v2
	if art != null:
		node.preview_tooltip_factory = make_tooltip.bind(art, rarity, equipped, item_name, category)
	host.add_child(node)
	node.position = at
	node.size = Vector2.ONE * side
	return node

func make_tooltip(art: Texture2D, rarity: int, equipped: bool, item_name: String, category: String) -> Control:
	var node = TooltipScene.instantiate()
	node.theme = theme
	node.item_name = item_name
	node.category = category
	node.rarity = rarity
	node.equipped_caption = equipped
	node.portrait_art = art
	node.organized = true
	node.simple_surface = true
	node.detailed = rarity == 5
	node.painted_style = V2.tooltip_style(rarity) if use_v2 else frames.tooltip_style(rarity)
	node.description = "Preview equipment — illustrative data."
	node.stat_lines = PackedStringArray(["Example equipment attribute"])
	if category == "Reagents":
		node.description = "Realm crafting material · visual preview."
		node.stat_lines = PackedStringArray()
	elif category == "Dagger":
		node.primary_value = "24–32"
		node.primary_label = "Attack Damage"
	else:
		node.attributes.assign([{"label": "Example attribute", "value": "+8"}])
	if rarity == 5 and frames.is_ready():
		node.ornament = V2.texture("ornaments/crest_optional") if use_v2 else frames.textures["crest"]
		node.unique_title = "Unique effect"
		node.unique_effect = "Illustrative effect — not connected to gameplay."
	return node

func resource(host: Node, kind: String, at: Vector2, extent: Vector2, current: float, maximum: float, values: bool = true) -> Control:
	var bar = Bar.new()
	bar.name = kind + "Bar"
	bar.resource_kind = kind
	bar.use_v2 = use_v2
	bar.show_value = values
	bar.set_value_style(ui_font, HORIZONTAL_ALIGNMENT_RIGHT, 0.66, 2, true)
	bar.custom_minimum_size = extent
	host.add_child(bar)
	bar.position = at
	bar.size = extent
	bar.set_amount(current, maximum, false)
	return bar

func hud(host: Node, at: Vector2, width: float = 350.0) -> Control:
	var holder = Control.new()
	holder.name = "ResourceHUD"
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	host.add_child(holder)
	holder.position = at
	holder.size = Vector2(width + 156, 164)
	var portrait = Portrait.new()
	portrait.name = "Portrait"
	portrait.value_font = ui_font
	portrait.portrait_region = Rect2(0.365, 0.0, 0.27, 0.27)
	holder.add_child(portrait)
	portrait.size = Vector2(144, 164)
	portrait.set_identity(HERO, 24)
	var x = 156.0
	var y = 33.0
	resource(holder, "Health", Vector2(x, y), Vector2(width, 26), 2400, 2840)
	resource(holder, "Mana", Vector2(x, y + 31), Vector2(width, 26), 520, 600)
	var barrier = resource(holder, "Barrier", Vector2(x, y + 62), Vector2(width, 26), 180, 300)
	barrier.hide_empty = true
	resource(holder, "EXP", Vector2(x + width * 0.01, y + 93), Vector2(width * 0.98, 8), 420, 1000, false)
	return holder
