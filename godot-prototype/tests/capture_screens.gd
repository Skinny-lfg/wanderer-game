extends SceneTree
## Run with a real graphical backend (Xvfb is sufficient), not --headless.
func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	root.size = Vector2i(1280, 720)
	var shell = load("res://scenes/main.tscn").instantiate()
	root.add_child(shell)
	await process_frame
	var output = ProjectSettings.globalize_path("res://captures")
	if DirAccess.make_dir_recursive_absolute(output) != OK:
		push_error("Cannot create capture directory")
		quit(1)
		return
	for id in shell.IDS:
		shell.show_page(id)
		await process_frame
		await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_texture().get_image()
		if img == null or img.is_empty() or img.get_size() != Vector2i(1280, 720):
			push_error("Invalid screenshot: " + id)
			quit(1)
			return
		if img.save_png(output.path_join(id + ".png")) != OK:
			push_error("Cannot save screenshot: " + id)
			quit(1)
			return
		print("CAPTURE: " + id)
	print("PASS: captured six screens")
	quit(0)
