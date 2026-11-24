extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	var arena = load("res://scenes/arena.tscn").instantiate()
	root.add_child(arena)
	await process_frame
	if arena.ENEMIES.size() != 4 or arena.selected != -1:
		push_error("Expected four enemies and no initial target")
		quit(1)
		return
	for index in range(4):
		if not arena.select_target(index) or arena.selected != index:
			push_error("Target selection failed")
			quit(1)
			return
	if arena.select_target(-1) or arena.select_target(4) or arena.selected != 3:
		push_error("Invalid target changed selection")
		quit(1)
		return
	print("PASS: arena loaded; four enemies; valid and invalid target selection")
	quit(0)
