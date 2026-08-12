extends Control

class_name FixtureBattleUi

var battle: FixtureBattle
var stage_label: Label
var forecast_list: VBoxContainer
var front_row: HBoxContainer
var back_row: HBoxContainer
var semantic_label: Label
var inventory_label: Label

const TEXT_MAIN := Color("#f3e7cf")
const TEXT_MUTED := Color("#9b8ea9")
const TEXT_ACCENT := Color("#f6c85f")
const PANEL_DARK := Color(0.035, 0.025, 0.07, 0.94)

func _ready() -> void:
	_build_layout()

func set_battle(value: FixtureBattle) -> void:
	battle = value
	refresh_from_battle()

func _build_layout() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var theme := Theme.new()
	theme.default_font_size = 14
	theme.set_color("font_color", "Label", TEXT_MAIN)
	theme.set_color("font_color", "Button", TEXT_MAIN)
	theme.set_font_size("font_size", "Button", 13)
	theme.set_font_size("font_size", "Label", 13)
	self.theme = theme

	var dimmer := ColorRect.new()
	dimmer.color = Color(0.01, 0.005, 0.02, 0.16)
	dimmer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dimmer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(dimmer)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_bottom", 16)
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(margin)

	var root_box := VBoxContainer.new()
	root_box.add_theme_constant_override("separation", 10)
	margin.add_child(root_box)

	var header := HBoxContainer.new()
	header.custom_minimum_size.y = 34
	header.add_theme_constant_override("separation", 12)
	root_box.add_child(header)
	var title := Label.new()
	title.text = "SILLNIGHT / SUBSTRATE SPIKE"
	title.add_theme_color_override("font_color", TEXT_ACCENT)
	title.add_theme_font_size_override("font_size", 20)
	header.add_child(title)
	stage_label = Label.new()
	stage_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stage_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stage_label.add_theme_color_override("font_color", TEXT_MUTED)
	header.add_child(stage_label)

	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 10)
	root_box.add_child(body)

	var forecast_panel := _panel()
	forecast_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	forecast_panel.size_flags_stretch_ratio = 1.45
	body.add_child(forecast_panel)
	var forecast_margin := _inner_margin(forecast_panel)
	var forecast_box := VBoxContainer.new()
	forecast_box.add_theme_constant_override("separation", 5)
	forecast_margin.add_child(forecast_box)
	forecast_box.add_child(_section_title("LOCKED FORECAST / ACTION ORDER"))
	var forecast_hint := Label.new()
	forecast_hint.text = "Pure fixture data · targets are selected before resolution"
	forecast_hint.add_theme_color_override("font_color", TEXT_MUTED)
	forecast_hint.add_theme_font_size_override("font_size", 11)
	forecast_box.add_child(forecast_hint)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	forecast_box.add_child(scroll)
	forecast_list = VBoxContainer.new()
	forecast_list.add_theme_constant_override("separation", 4)
	scroll.add_child(forecast_list)

	var right_column := VBoxContainer.new()
	right_column.custom_minimum_size.x = 350
	right_column.add_theme_constant_override("separation", 10)
	body.add_child(right_column)

	var formation_panel := _panel()
	formation_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right_column.add_child(formation_panel)
	var formation_margin := _inner_margin(formation_panel)
	var formation_box := VBoxContainer.new()
	formation_box.add_theme_constant_override("separation", 5)
	formation_margin.add_child(formation_box)
	formation_box.add_child(_section_title("FORMATION / BEHAVIOR INPUT"))
	var front_label := Label.new()
	front_label.text = "FRONT"
	front_label.add_theme_color_override("font_color", TEXT_ACCENT)
	formation_box.add_child(front_label)
	front_row = HBoxContainer.new()
	front_row.add_theme_constant_override("separation", 4)
	formation_box.add_child(front_row)
	var back_label := Label.new()
	back_label.text = "BACK"
	back_label.add_theme_color_override("font_color", TEXT_ACCENT)
	formation_box.add_child(back_label)
	back_row = HBoxContainer.new()
	back_row.add_theme_constant_override("separation", 4)
	formation_box.add_child(back_row)

	var intervention_panel := _panel()
	right_column.add_child(intervention_panel)
	var intervention_margin := _inner_margin(intervention_panel)
	var intervention_box := VBoxContainer.new()
	intervention_box.add_theme_constant_override("separation", 5)
	intervention_margin.add_child(intervention_box)
	intervention_box.add_child(_section_title("SUMMONER INTERVENTIONS"))
	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 4)
	intervention_box.add_child(buttons)
	_add_stage_button(buttons, "INITIAL", "initial")
	_add_stage_button(buttons, "SWAP", "formation")
	_add_stage_button(buttons, "POTION", "summoner")
	_add_stage_button(buttons, "RESOLVE", "resolved")
	inventory_label = Label.new()
	inventory_label.add_theme_color_override("font_color", TEXT_MUTED)
	intervention_box.add_child(inventory_label)

	var semantic_panel := _panel()
	right_column.add_child(semantic_panel)
	var semantic_margin := _inner_margin(semantic_panel)
	semantic_label = Label.new()
	semantic_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	semantic_label.add_theme_color_override("font_color", TEXT_MUTED)
	semantic_margin.add_child(semantic_label)

func refresh_from_battle() -> void:
	if battle == null or forecast_list == null:
		return
	stage_label.text = "GODOT 4.7.1 · %s · 3D SCALE 0.50" % battle.stage.to_upper()
	_clear_children(forecast_list)
	for forecast_action in battle.display_forecast:
		forecast_list.add_child(_forecast_card(forecast_action))
	_refresh_formation()
	inventory_label.text = "Small Potion: %d" % int(battle.inventory.get("potionSmall", 0))
	if battle.stage == "resolved":
		semantic_label.text = "ROUND RESOLVED\n8 semantic events recorded.\n\nThe transcript and final state were produced before presentation timing; this panel only observes them."
	else:
		semantic_label.text = "DOMAIN / PRESENTATION BOUNDARY\nForecasts are calculated from the shared JSON fixture.\n\nFormation and potion actions mutate domain state, then the UI reads a fresh forecast."

func _refresh_formation() -> void:
	_clear_children(front_row)
	_clear_children(back_row)
	var rows: Dictionary = battle.party_rows()
	for actor in rows.get("front", []):
		front_row.add_child(_actor_chip(actor as Dictionary))
	for actor in rows.get("back", []):
		back_row.add_child(_actor_chip(actor as Dictionary))

func _forecast_card(forecast_action: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _panel_style(Color(0.07, 0.05, 0.12, 0.72), Color(0.19, 0.14, 0.27, 1)))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	panel.add_child(row)
	var order := Label.new()
	order.text = "%02d" % int(forecast_action.get("order", 0))
	order.custom_minimum_size.x = 25
	order.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	order.add_theme_color_override("font_color", TEXT_ACCENT)
	row.add_child(order)
	var actor := Label.new()
	actor.text = String(forecast_action.get("actor", "")).to_upper()
	actor.custom_minimum_size.x = 112
	actor.add_theme_color_override("font_color", TEXT_MAIN)
	row.add_child(actor)
	var action := Label.new()
	action.text = String(forecast_action.get("action", ""))
	action.custom_minimum_size.x = 92
	action.add_theme_color_override("font_color", Color("#d38cff"))
	row.add_child(action)
	var target := Label.new()
	var target_list: Array = forecast_action.get("targets", [])
	target.text = "→ %s" % ", ".join(target_list).to_upper()
	target.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	target.add_theme_color_override("font_color", Color("#8ed6d2"))
	row.add_child(target)
	var speed := Label.new()
	speed.text = "SPD %d" % int(forecast_action.get("action_speed", 0))
	speed.add_theme_color_override("font_color", TEXT_MUTED)
	row.add_child(speed)
	return panel

func _actor_chip(actor: Dictionary) -> Control:
	var panel := PanelContainer.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _panel_style(Color(0.06, 0.045, 0.11, 0.76), Color(0.16, 0.12, 0.24, 1)))
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 2)
	panel.add_child(box)
	var name_label := Label.new()
	name_label.text = String(actor.get("name", "")).to_upper()
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 11)
	box.add_child(name_label)
	var hp_label := Label.new()
	hp_label.text = "%d / %d" % [int(actor.get("hp", 0)), int(actor.get("max_hp", 0))]
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.add_theme_color_override("font_color", TEXT_MUTED)
	hp_label.add_theme_font_size_override("font_size", 11)
	box.add_child(hp_label)
	return panel

func _add_stage_button(parent: Container, text: String, next_stage: String) -> void:
	var button := Button.new()
	button.text = text
	button.focus_mode = Control.FOCUS_ALL
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.add_theme_font_size_override("font_size", 11)
	button.pressed.connect(func() -> void:
		if battle != null:
			battle.set_stage(next_stage)
			refresh_from_battle()
	)
	parent.add_child(button)

func _section_title(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_color_override("font_color", TEXT_ACCENT)
	label.add_theme_font_size_override("font_size", 13)
	return label

func _panel() -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _panel_style(Color(PANEL_DARK, 0.74), Color(0.22, 0.16, 0.3, 1)))
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return panel

func _inner_margin(panel: PanelContainer) -> MarginContainer:
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 10)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_right", 10)
	margin.add_theme_constant_override("margin_bottom", 8)
	panel.add_child(margin)
	return margin

func _panel_style(background: Color, border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(3)
	style.content_margin_left = 6
	style.content_margin_right = 6
	style.content_margin_top = 4
	style.content_margin_bottom = 4
	return style

func _clear_children(container: Node) -> void:
	for child in container.get_children():
		child.queue_free()
