extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _fail(message: String) -> void:
	push_error(message)
	quit(1)

func _run() -> void:
	var shell = load("res://scenes/main.tscn").instantiate()
	root.add_child(shell)
	await process_frame
	if shell.active_page != "camp" or shell.buttons.size() != 5 or shell.IDS != ["camp", "inventory", "talents", "city", "shrine"]:
		_fail("Initial navigation invalid")
		return
	if not shell.kit.ready_for_preview() or shell.current_screen.get_node_or_null("ResourceHUD") == null:
		_fail("Approved UI kit or Camp HUD missing")
		return
	for id in shell.IDS:
		shell.buttons[id].pressed.emit()
		await process_frame
		if shell.active_page != id or shell.content.get_child_count() != 1 or not shell.navigation.visible:
			_fail("Screen transition failed: " + id)
			return
		if not shell.buttons[id].get_theme_stylebox("normal") is StyleBoxTexture or shell.buttons[id].icon == null:
			_fail("V2 navigation must retain icons and painted styles")
			return
		if id == "talents":
			if shell.current_screen.get_node_or_null("TalentCore") == null:
				_fail("Talent composition core missing")
				return
			for i in range(18):
				if shell.current_screen.get_node_or_null("PreviewTalent_" + str(i)) == null:
					_fail("Talent preview node missing")
					return
		if id == "shrine":
			for i in range(3):
				if shell.current_screen.get_node_or_null("BoundRune_" + str(i)) == null:
					_fail("Shrine bound slot missing")
					return
			for i in range(6):
				if shell.current_screen.get_node_or_null("AvailableRune_" + str(i)) == null:
					_fail("Shrine available rune slot missing")
					return
		if id == "inventory":
			var slots: Array = shell.current_screen.inventory_slots
			if slots.size() != 53 or slots[0].painted_textures.size() != 10 or not slots[0].equipped or slots[0].painted_key() != "rarity_common":
				_fail("Integrated equipment and bag slots missing")
				return
			var tooltip: Control = slots[0]._make_custom_tooltip("preview")
			if tooltip == null or not tooltip.organized or not tooltip.simple_surface or tooltip.painted_style == null:
				_fail("Integrated tooltip missing")
				return
			if not tooltip.compact_preview:
				tooltip.free()
				_fail("Inventory tooltip should use compact fixture layout")
				return
			root.add_child(tooltip)
			await process_frame
			await process_frame
			if tooltip.get_combined_minimum_size().y > 265 or tooltip.get_combined_minimum_size().x > 480:
				tooltip.free()
				_fail("Common inventory tooltip exceeds compact bounds")
				return
			tooltip.free()
			var inventory = shell.current_screen
			var stash_surface_size: Vector2 = inventory.collection_surface.size
			if inventory.advanced_group.visible or not inventory.basic_group.visible:
				_fail("Character details must start closed")
				return
			inventory.stats_toggle.button_pressed = true
			if not inventory.advanced_group.visible or inventory.basic_group.visible:
				_fail("Character details overlay failed to open")
				return
			inventory.stats_toggle.button_pressed = false
			if inventory.advanced_group.visible or not inventory.basic_group.visible:
				_fail("Character details overlay failed to close")
				return
			if inventory.equipped_slots.size() != 10 or inventory.potion_slots.size() != 3 or inventory.stash_slots.size() != 40 or inventory.stash_items.size() != 30:
				_fail("Inventory fixture does not match v0.13 capacities")
				return
			for cell in inventory.stash_slots:
				if not cell.minimal_inventory:
					_fail("Stash cells must use quiet inventory presentation")
					return
			if inventory.equipped_slots[0].minimal_inventory or inventory.get_node_or_null("HealthBar") != null or inventory.get_node_or_null("ManaBar") != null or inventory.get_node_or_null("EXPBar") != null:
				_fail("Equipment treatment or inventory-only HUD reduction failed")
				return
			if inventory.stash_filter_panel.visible or inventory.stash_filter_toggle.button_pressed:
				_fail("Filter menu must start closed")
				return
			inventory.stash_filter_toggle.button_pressed = true
			await process_frame
			if not inventory.stash_filter_panel.visible:
				_fail("Filter menu failed to open")
				return
			var filter_rect: Rect2 = inventory.stash_filter.get_rect()
			var sort_rect: Rect2 = inventory.stash_sort.get_rect()
			var order_rect: Rect2 = inventory.stash_order.get_rect()
			if filter_rect.intersects(sort_rect) or sort_rect.intersects(order_rect) or order_rect.end.x > inventory.stash_filter_panel.size.x:
				_fail("Filter options overlap or overflow")
				return
			var last_cell: Rect2 = inventory.stash_slots[39].get_global_rect()
			var grid_rect: Rect2 = inventory.stash_grid.get_global_rect()
			if not grid_rect.encloses(last_cell):
				_fail("Stash grid exceeds intended bounds")
				return
			inventory.stash_filter.select(1)
			inventory._inventory_filter_changed(1)
			if inventory.stash_slots[0].item_art == null or inventory.stash_slots[3].item_art != null:
				_fail("Potion filter preview failed")
				return
			if not inventory.stash_slots[0].v2_preview or not inventory.equipped_slots[0].v2_preview:
				_fail("V2 slot adapter inactive")
				return
			inventory.stash_filter.select(inventory.stash_filter.item_count - 1)
			inventory._inventory_filter_changed(0)
			if inventory.stash_filter.get_item_text(inventory.stash_filter.selected) != "Reagents" or inventory.stash_slots[5].item_art == null or inventory.stash_slots[6].item_art != null:
				_fail("Six reagent fixtures or filter missing")
				return
			inventory._inventory_collection(1)
			if inventory.stash_filter_panel.visible or inventory.stash_filter_toggle.button_pressed or inventory.stash_grid.visible or not inventory.collection_host.visible or not inventory.stash_count.text.begins_with("2 valuables") or inventory.collection_surface.size.y >= stash_surface_size.y:
				_fail("Valuables collection preview failed")
				return
			inventory._inventory_collection(2)
			if not inventory.stash_count.text.begins_with("3 / 300") or inventory.collection_surface.size.y >= stash_surface_size.y:
				_fail("Anchor Rune collection preview failed")
				return
			inventory._inventory_collection(0)
			if inventory.collection_surface.size != stash_surface_size:
				_fail("Stash surface did not restore")
				return
			inventory.stash_filter.select(0)
			inventory._inventory_filter_changed(0)
		for other in shell.IDS:
			if shell.buttons[other].button_pressed != (other == id):
				_fail("Active navigation state invalid")
				return
	shell.buttons["camp"].pressed.emit()
	shell.camp_actions.get_child(0).pressed.emit()
	if shell.active_page != "expedition" or shell.navigation.visible:
		_fail("Expedition must be a contextual screen")
		return
	shell.actions.get_child(1).pressed.emit()
	if shell.active_page != "combat" or shell.navigation.visible or not shell.current_screen.select_target(3):
		_fail("Combat must be contextual and preserve targeting")
		return
	if shell.current_screen.enemy_bars.size() != 4 or shell.current_screen.resource_hud == null:
		_fail("Combat HUD integration missing")
		return
	var xp: Control = shell.current_screen.resource_hud.get_node("EXPBar")
	var hp: Control = shell.current_screen.resource_hud.get_node("HealthBar")
	if not hp.use_v2 or not xp.use_v2 or absf(xp.size.x - hp.size.x * 0.98) > 1.0:
		_fail("Combat EXP ratio")
		return
	shell.actions.get_child(0).pressed.emit()
	shell.actions.get_child(0).pressed.emit()
	if shell.active_page != "camp" or not shell.navigation.visible:
		_fail("Return to camp failed")
		return
	shell.camp_actions.get_child(1).pressed.emit()
	if shell.active_page != "codex" or shell.navigation.visible:
		_fail("Codex must be secondary")
		return
	if shell.show_page("unknown") or shell.active_page != "codex":
		_fail("Invalid page changed state")
		return
	shell.actions.get_child(0).pressed.emit()
	if shell.active_page != "camp":
		_fail("Codex return failed")
		return
	print("PASS: five camp tabs; contextual expedition and combat; secondary codex")
	quit(0)
