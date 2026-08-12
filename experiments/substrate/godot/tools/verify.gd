extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var fixture_path := ProjectSettings.globalize_path("res://../shared/battle_fixture.json")
	if not FileAccess.file_exists(fixture_path):
		failures.append("shared fixture missing: %s" % fixture_path)
	else:
		var battle := FixtureBattle.from_file(fixture_path)
		var result := battle.verify_contract()
		if not bool(result.get("ok", false)):
			for failure in result.get("failures", []):
				failures.append(String(failure))

	var scene := load("res://scenes/main.tscn") as PackedScene
	if scene == null:
		failures.append("main scene failed to load")
	else:
		var instance := scene.instantiate()
		root.add_child(instance)
		await process_frame
		if not instance.has_node("Room"):
			failures.append("main scene has no Room node")
		if not instance.has_node("BattleUiLayer/MainUi"):
			failures.append("main scene has no BattleUiLayer/MainUi node")
		instance.queue_free()

	if failures.is_empty():
		print("GODOT_SPIKE_VERIFY_OK")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		print("GODOT_SPIKE_VERIFY_FAILED (%d failures)" % failures.size())
		quit(1)
