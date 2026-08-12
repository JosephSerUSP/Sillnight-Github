extends Node3D

const FIXTURE_PATH := "res://../shared/battle_fixture.json"
const DEFAULT_STAGE := "initial"

@onready var battle_ui: Control = $BattleUiLayer/MainUi

var battle: FixtureBattle
var snapshot_stage := ""

func _ready() -> void:
	get_viewport().scaling_3d_scale = 0.5
	$Camera3D.look_at(Vector3(0, 0.8, 0))
	battle = FixtureBattle.from_file(ProjectSettings.globalize_path(FIXTURE_PATH))
	if battle.fixture.is_empty():
		push_error("Godot spike could not load the shared fixture.")
		return
	var requested_stage := _user_argument("stage")
	if requested_stage.is_empty():
		requested_stage = DEFAULT_STAGE
	battle.set_stage(requested_stage)
	battle_ui.set("battle", battle)
	if battle_ui.has_method("refresh_from_battle"):
		battle_ui.call("refresh_from_battle")
	snapshot_stage = _user_argument("snapshot")
	if _user_argument("hide_ui") == "true":
		battle_ui.visible = false
	if not snapshot_stage.is_empty():
		await _capture_snapshot()

func _capture_snapshot() -> void:
	for _frame in 4:
		await get_tree().process_frame
	var evidence_path := ProjectSettings.globalize_path("res://evidence/%s.png" % snapshot_stage)
	var image := get_viewport().get_texture().get_image()
	if image != null:
		var error := image.save_png(evidence_path)
		print("Wrote snapshot: %s (%s)" % [evidence_path, error])
	else:
		push_error("Viewport image was unavailable for snapshot: %s" % snapshot_stage)
	snapshot_stage = ""
	get_tree().quit()

func _user_argument(key: String) -> String:
	for argument in OS.get_cmdline_user_args():
		var text := String(argument)
		var prefix := "--%s=" % key
		if text.begins_with(prefix):
			return text.trim_prefix(prefix)
	return ""
