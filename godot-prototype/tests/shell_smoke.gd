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
		if not shell.buttons[id].get_theme_stylebox("normal") is StyleBoxTexture:
			_fail("Navigation must use painted art")
			return
		if id == "inventory":
			var slots: Array = shell.current_screen.inventory_slots
			if slots.size() != 56 or slots[0].painted_textures.size() != 10 or not slots[0].equipped or slots[0].painted_key() != "rarity_common":
				_fail("Integrated equipment and bag slots missing")
				return
			var tooltip: Control = slots[0]._make_custom_tooltip("preview")
			if tooltip == null or not tooltip.organized or not tooltip.simple_surface or tooltip.painted_style == null:
				_fail("Integrated tooltip missing")
				return
			tooltip.free()
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
	if absf(xp.size.x - hp.size.x * 0.98) > 1.0:
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
