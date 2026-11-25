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
	for id in shell.IDS:
		shell.buttons[id].pressed.emit()
		await process_frame
		if shell.active_page != id or shell.content.get_child_count() != 1 or not shell.navigation.visible:
			_fail("Screen transition failed: " + id)
			return
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
