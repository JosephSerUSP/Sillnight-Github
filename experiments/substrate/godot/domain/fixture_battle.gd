class_name FixtureBattle
extends RefCounted

## Presentation-independent implementation of the immutable #311 fixture.
## The Godot scene tree never owns this state; it only observes snapshots.

var fixture: Dictionary = {}
var party: Dictionary = {}
var enemies: Dictionary = {}
var inventory: Dictionary = {}
var display_forecast: Array[Dictionary] = []
var transcript: Array[Dictionary] = []
var stage: String = "initial"

static func from_file(path: String) -> FixtureBattle:
	var battle := FixtureBattle.new()
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("Unable to open shared fixture: %s" % path)
		return battle
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		push_error("Shared fixture is not a JSON object: %s" % path)
		return battle
	battle.fixture = (parsed as Dictionary).duplicate(true)
	battle._reset_state()
	return battle

static func from_document(document: Dictionary) -> FixtureBattle:
	var battle := FixtureBattle.new()
	battle.fixture = document.duplicate(true)
	battle._reset_state()
	return battle

func _reset_state() -> void:
	party.clear()
	enemies.clear()
	transcript.clear()
	var raw_party: Array = fixture.get("party", [])
	for raw_actor in raw_party:
		var actor := (raw_actor as Dictionary).duplicate(true)
		actor["states"] = []
		party[String(actor.get("id", ""))] = actor
	var raw_enemies: Array = fixture.get("enemies", [])
	for raw_enemy in raw_enemies:
		var enemy := (raw_enemy as Dictionary).duplicate(true)
		enemy["states"] = []
		enemies[String(enemy.get("id", ""))] = enemy
	var raw_summoner: Dictionary = fixture.get("summoner", {})
	inventory = (raw_summoner.get("inventory", {}) as Dictionary).duplicate(true)
	display_forecast = []
	stage = "initial"

func set_stage(next_stage: String) -> void:
	_reset_state()
	stage = next_stage
	if next_stage == "formation" or next_stage == "summoner" or next_stage == "resolved":
		apply_formation_swap()
	if next_stage == "summoner" or next_stage == "resolved":
		use_small_potion()
	display_forecast = forecast()
	if next_stage == "resolved":
		resolve_locked_round(display_forecast)

func forecast() -> Array[Dictionary]:
	var actions: Array[Dictionary] = []
	for actor in party.values():
		actions.append(_forecast_actor(actor as Dictionary, true))
	for enemy in enemies.values():
		actions.append(_forecast_actor(enemy as Dictionary, false))
	actions.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return int(a["action_speed"]) > int(b["action_speed"])
	)
	var ordered: Array[Dictionary] = []
	var order := 1
	for action in actions:
		var public_action: Dictionary = {
			"order": order,
			"actor": action["actor"],
			"action": action["action"],
			"targets": action["targets"],
			"action_speed": action["action_speed"]
		}
		ordered.append(public_action)
		order += 1
	return ordered

func apply_formation_swap() -> void:
	var nurse: Dictionary = party.get("nurse", {})
	var pixie: Dictionary = party.get("pixie", {})
	var nurse_slot: String = String(nurse.get("slot", ""))
	nurse["slot"] = String(pixie.get("slot", ""))
	pixie["slot"] = nurse_slot

func use_small_potion() -> Dictionary:
	var nurse: Dictionary = party.get("nurse", {})
	var hp_before := int(nurse.get("hp", 0))
	var max_hp := int(nurse.get("max_hp", 0))
	var item: Dictionary = ((fixture.get("summoner", {}) as Dictionary).get("fixture_item_semantics", {}) as Dictionary).get("potionSmall", {})
	var effect: Dictionary = item.get("effect", {})
	var heal := floori(float(max_hp) * float(effect.get("ratio", 0.0)))
	var hp_after := mini(max_hp, hp_before + heal)
	if int(inventory.get("potionSmall", 0)) > 0:
		nurse["hp"] = hp_after
		inventory["potionSmall"] = int(inventory.get("potionSmall", 0)) - 1
	return {
		"hp_before": hp_before,
		"heal": heal,
		"hp_after": hp_after,
		"inventory_after": int(inventory.get("potionSmall", 0))
	}

func resolve_locked_round(locked_forecast: Array[Dictionary]) -> Array[Dictionary]:
	transcript.clear()
	for forecast_action in locked_forecast:
		var actor_id := String(forecast_action.get("actor", ""))
		var actor: Dictionary = _actor_by_id(actor_id)
		var action_data := _action_for_actor(actor, String(forecast_action.get("action", "")))
		var effect: Dictionary = action_data.get("effect", {})
		var targets: Array = forecast_action.get("targets", [])
		for target_id in targets:
			var event := _apply_effect(actor_id, String(forecast_action.get("action", "")), String(target_id), effect)
			if not event.is_empty():
				transcript.append(event)
	return transcript.duplicate(true)

func state_snapshot() -> Dictionary:
	var party_snapshot: Dictionary = {}
	for actor_id in party:
		var actor: Dictionary = party[actor_id]
		party_snapshot[actor_id] = {
			"hp": int(actor.get("hp", 0)),
			"states": (actor.get("states", []) as Array).duplicate()
		}
	var enemy_snapshot: Dictionary = {}
	for enemy_id in enemies:
		var enemy: Dictionary = enemies[enemy_id]
		enemy_snapshot[enemy_id] = {
			"hp": int(enemy.get("hp", 0)),
			"states": (enemy.get("states", []) as Array).duplicate()
		}
	return {"party": party_snapshot, "enemies": enemy_snapshot}

func party_rows() -> Dictionary:
	var rows := {"front": [], "back": []}
	for actor in party.values():
		var actor_dict: Dictionary = actor
		var row := _row_for_slot(String(actor_dict.get("slot", "")))
		rows[row].append({
			"id": String(actor_dict.get("id", "")),
			"name": String(actor_dict.get("name", "")),
			"slot": String(actor_dict.get("slot", "")),
			"hp": int(actor_dict.get("hp", 0)),
			"max_hp": int(actor_dict.get("max_hp", 0))
		})
	for row in rows:
		(rows[row] as Array).sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
			return String(a["slot"]) < String(b["slot"])
		)
	return rows

func verify_contract() -> Dictionary:
	var failures: Array[String] = []
	var initial := forecast()
	_assert_step_forecast("initial_forecast", initial, failures)
	apply_formation_swap()
	var post_formation := forecast()
	_assert_step_forecast("post_formation_forecast", post_formation, failures)
	var potion_result := use_small_potion()
	_assert_step_value("summoner_intervention", potion_result, failures)
	var post_summoner := forecast()
	_assert_step_forecast("post_summoner_forecast", post_summoner, failures)
	var actual_transcript := resolve_locked_round(post_summoner)
	var resolution_step := _step_by_id("resolve_locked_forecast")
	_assert_value("resolve_locked_forecast.expected_transcript", resolution_step.get("expected_transcript", []), actual_transcript, failures)
	_assert_value("resolve_locked_forecast.expected_end_state", resolution_step.get("expected_end_state", {}), state_snapshot(), failures)
	return {
		"ok": failures.is_empty(),
		"failures": failures,
		"initial_forecast": initial,
		"post_formation_forecast": post_formation,
		"post_summoner_forecast": post_summoner,
		"transcript": actual_transcript,
		"final_state": state_snapshot()
	}

func _forecast_actor(actor: Dictionary, is_party: bool) -> Dictionary:
	var action_data: Dictionary
	if is_party:
		var row := _row_for_slot(String(actor.get("slot", "")))
		var behaviors: Dictionary = actor.get("behavior_by_row", {})
		action_data = (behaviors.get(row, {}) as Dictionary).duplicate(true)
	else:
		action_data = (actor.get("action", {}) as Dictionary).duplicate(true)
	var selector := String(action_data.get("target", "self"))
	return {
		"actor": String(actor.get("id", "")),
		"action": String(action_data.get("action", action_data.get("id", ""))),
		"action_speed": int(action_data.get("action_speed", 0)),
		"targets": _select_targets(selector, actor, is_party)
	}

func _select_targets(selector: String, actor: Dictionary, is_party: bool) -> Array[String]:
	if selector == "self":
		return [String(actor.get("id", ""))]
	if selector == "enemy_lowest_hp":
		return [_lowest_hp(enemies)]
	if selector == "enemy_highest_threat":
		return [_highest_threat(enemies)]
	if selector == "enemy_front_all":
		return _ids_in_row(enemies, "front")
	if selector == "ally_lowest_hp_ratio":
		return [_lowest_ratio(party)]
	if selector == "ally_front_lowest_hp_ratio":
		return [_lowest_ratio_in_row(party, "front")]
	if selector == "ally_back_lowest_hp_ratio":
		return [_lowest_ratio_in_row(party, "back")]
	return []

func _lowest_hp(units: Dictionary) -> String:
	var selected_id := ""
	var selected_hp := INF
	for unit_id in units:
		var unit: Dictionary = units[unit_id]
		if int(unit.get("hp", 0)) > 0 and int(unit.get("hp", 0)) < selected_hp:
			selected_id = String(unit_id)
			selected_hp = int(unit.get("hp", 0))
	return selected_id

func _highest_threat(units: Dictionary) -> String:
	var selected_id := ""
	var selected_threat := -INF
	for unit_id in units:
		var unit: Dictionary = units[unit_id]
		if int(unit.get("hp", 0)) > 0 and int(unit.get("threat", 0)) > selected_threat:
			selected_id = String(unit_id)
			selected_threat = int(unit.get("threat", 0))
	return selected_id

func _lowest_ratio(units: Dictionary) -> String:
	var selected_id := ""
	var selected_ratio := INF
	for unit_id in units:
		var unit: Dictionary = units[unit_id]
		var max_hp := maxf(1.0, float(unit.get("max_hp", 1)))
		var ratio := float(unit.get("hp", 0)) / max_hp
		if int(unit.get("hp", 0)) > 0 and ratio < selected_ratio:
			selected_id = String(unit_id)
			selected_ratio = ratio
	return selected_id

func _lowest_ratio_in_row(units: Dictionary, row: String) -> String:
	var selected_id := ""
	var selected_ratio := INF
	for unit_id in units:
		var unit: Dictionary = units[unit_id]
		if _row_for_slot(String(unit.get("slot", ""))) != row:
			continue
		var max_hp := maxf(1.0, float(unit.get("max_hp", 1)))
		var ratio := float(unit.get("hp", 0)) / max_hp
		if int(unit.get("hp", 0)) > 0 and ratio < selected_ratio:
			selected_id = String(unit_id)
			selected_ratio = ratio
	return selected_id

func _ids_in_row(units: Dictionary, row: String) -> Array[String]:
	var result: Array[String] = []
	for unit_id in units:
		var unit: Dictionary = units[unit_id]
		if int(unit.get("hp", 0)) > 0 and _row_for_slot(String(unit.get("slot", ""))) == row:
			result.append(String(unit_id))
	return result

func _row_for_slot(slot: String) -> String:
	return "front" if slot.begins_with("front") else "back"

func _actor_by_id(actor_id: String) -> Dictionary:
	if party.has(actor_id):
		return party[actor_id]
	return enemies.get(actor_id, {})

func _action_for_actor(actor: Dictionary, action_id: String) -> Dictionary:
	if actor.is_empty():
		return {}
	if actor.has("behavior_by_row"):
		var behaviors: Dictionary = actor.get("behavior_by_row", {})
		var row := _row_for_slot(String(actor.get("slot", "")))
		return behaviors.get(row, {})
	return actor.get("action", {})

func _apply_effect(actor_id: String, action_id: String, target_id: String, effect: Dictionary) -> Dictionary:
	var target := _actor_by_id(target_id)
	if target.is_empty():
		return {}
	var effect_type := String(effect.get("type", "none"))
	if effect_type == "damage" or effect_type == "heal":
		var before := int(target.get("hp", 0))
		var amount := int(effect.get("amount", 0))
		var after := before + amount if effect_type == "heal" else maxi(0, before - amount)
		if effect_type == "heal":
			after = mini(int(target.get("max_hp", after)), after)
		target["hp"] = after
		return {
			"type": effect_type,
			"actor": actor_id,
			"action": action_id,
			"target": target_id,
			"amount": amount,
			"hp_before": before,
			"hp_after": after
		}
	if effect_type == "add_state":
		var state := String(effect.get("state", ""))
		var states: Array = target.get("states", [])
		if not states.has(state):
			states.append(state)
		target["states"] = states
		return {
			"type": "add_state",
			"actor": actor_id,
			"action": action_id,
			"target": target_id,
			"state": state
		}
	return {}

func _step_by_id(step_id: String) -> Dictionary:
	for raw_step in fixture.get("steps", []):
		var step: Dictionary = raw_step
		if String(step.get("id", "")) == step_id:
			return step
	return {}

func _assert_step_forecast(step_id: String, actual: Array[Dictionary], failures: Array[String]) -> void:
	var step := _step_by_id(step_id)
	_assert_value("%s.expected" % step_id, step.get("expected", []), actual, failures)

func _assert_step_value(step_id: String, actual: Dictionary, failures: Array[String]) -> void:
	var step := _step_by_id(step_id)
	_assert_value("%s.expected" % step_id, step.get("expected", {}), actual, failures)

func _assert_value(label: String, expected: Variant, actual: Variant, failures: Array[String]) -> void:
	if not _values_equivalent(expected, actual):
		failures.append("%s mismatch\nexpected: %s\nactual: %s" % [label, JSON.stringify(expected), JSON.stringify(actual)])

func _values_equivalent(expected: Variant, actual: Variant) -> bool:
	if (expected is int or expected is float) and (actual is int or actual is float):
		return is_equal_approx(float(expected), float(actual))
	if expected is Array and actual is Array:
		var expected_array: Array = expected
		var actual_array: Array = actual
		if expected_array.size() != actual_array.size():
			return false
		for index in expected_array.size():
			if not _values_equivalent(expected_array[index], actual_array[index]):
				return false
		return true
	if expected is Dictionary and actual is Dictionary:
		var expected_dictionary: Dictionary = expected
		var actual_dictionary: Dictionary = actual
		if expected_dictionary.size() != actual_dictionary.size():
			return false
		for key in expected_dictionary:
			if not actual_dictionary.has(key) or not _values_equivalent(expected_dictionary[key], actual_dictionary[key]):
				return false
		return true
	return expected == actual
