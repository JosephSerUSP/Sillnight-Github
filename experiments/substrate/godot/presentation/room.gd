extends Node3D

## Presentation-only room dressing. It never stores battle truth.

const PARTY_POSITIONS: Array[Vector3] = [
	Vector3(-3.8, 0.75, 1.6), Vector3(-1.9, 0.75, 1.6), Vector3(0.0, 0.75, 1.6),
	Vector3(-3.8, 0.75, 3.5), Vector3(-1.9, 0.75, 3.5), Vector3(0.0, 0.75, 3.5)
]
const ENEMY_POSITIONS: Array[Vector3] = [Vector3(3.3, 0.75, -1.0), Vector3(5.2, 0.75, 0.9)]

func _ready() -> void:
	for index in PARTY_POSITIONS.size():
		_add_actor_marker("party_%d" % index, PARTY_POSITIONS[index], Color(0.25, 0.75, 0.95))
	for index in ENEMY_POSITIONS.size():
		_add_actor_marker("enemy_%d" % index, ENEMY_POSITIONS[index], Color(0.9, 0.28, 0.52))
	_add_light(Vector3(0, 3.2, 0), Color(0.25, 0.1, 0.65), 7.0)
	_add_light(Vector3(4.2, 2.5, -1.0), Color(0.9, 0.12, 0.3), 4.0)

func _add_actor_marker(actor_name: String, marker_position: Vector3, color: Color) -> void:
	var marker := MeshInstance3D.new()
	marker.name = actor_name
	var mesh := CapsuleMesh.new()
	mesh.height = 1.35
	mesh.radius = 0.38
	marker.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color * 0.45
	material.roughness = 0.8
	marker.material_override = material
	marker.position = marker_position
	add_child(marker)

	var base := MeshInstance3D.new()
	var base_mesh := CylinderMesh.new()
	base_mesh.top_radius = 0.58
	base_mesh.bottom_radius = 0.68
	base_mesh.height = 0.12
	base.mesh = base_mesh
	var base_material := StandardMaterial3D.new()
	base_material.albedo_color = color.darkened(0.45)
	base_material.emission_enabled = true
	base_material.emission = color.darkened(0.3)
	base.material_override = base_material
	base.position = marker_position + Vector3(0, -0.68, 0)
	add_child(base)

func _add_light(light_position: Vector3, color: Color, energy: float) -> void:
	var light := OmniLight3D.new()
	light.position = light_position
	light.light_color = color
	light.light_energy = energy
	light.omni_range = 8.0
	add_child(light)
