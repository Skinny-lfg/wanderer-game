extends SceneTree
func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	root.size = Vector2i(1280, 720)
	var gallery = load("res://ui/showcase/ui_gallery.tscn").instantiate()
	root.add_child(gallery)
	await process_frame
	var output = ProjectSettings.globalize_path("res://captures/gallery")
	if DirAccess.make_dir_recursive_absolute(output) != OK:
		push_error("Cannot create gallery capture directory")
		quit(1)
		return
	for category in gallery.CATEGORIES:
		gallery.show_category(category)
		await process_frame
		await process_frame
		await RenderingServer.frame_post_draw
		var img = root.get_texture().get_image()
		if img == null or img.is_empty() or img.get_size() != Vector2i(1280, 720):
			push_error("Invalid gallery screenshot: " + category)
			quit(1)
			return
		if img.save_png(output.path_join(category.to_lower().replace(" ", "_") + ".png")) != OK:
			push_error("Cannot save gallery screenshot")
			quit(1)
			return
	print("PASS: captured six gothic gallery categories")
	quit(0)
