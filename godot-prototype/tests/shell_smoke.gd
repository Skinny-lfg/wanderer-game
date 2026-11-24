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
	if shell.active_page != "camp" or shell.buttons.size() != 6:
		_fail("Initial navigation invalid")
		return
	for id in shell.IDS:
		shell.buttons[id].pressed.emit()
		await process_frame
		if shell.active_page != id or shell.content.get_child_count() != 1:
			_fail("Screen transition failed: " + id)
			return
		var expected = "res://scenes/arena.tscn" if id == "combat" else "res://scenes/screens/" + id + ".tscn"
		if shell.current_screen.scene_file_path != expected:
			_fail("Wrong screen scene: " + id)
			return
		for other in shell.IDS:
			if shell.buttons[other].button_pressed != (other == id):
				_fail("Active navigation state invalid")
				return
		if id == "combat" and not shell.current_screen.select_target(3):
			_fail("Existing arena target selection failed")
			return
	if shell.show_page("unknown") or shell.active_page != "codex":
		_fail("Invalid page changed state")
		return
	shell.show_page("camp")
	if shell.active_page != "camp":
		_fail("Return to camp failed")
		return
	print("PASS: six navigation scenes; active tab state; arena preserved")
	quit(0)
