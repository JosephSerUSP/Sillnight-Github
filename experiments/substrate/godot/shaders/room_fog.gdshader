shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_opaque;

uniform vec4 base_color : source_color = vec4(0.32, 0.16, 0.42, 1.0);
uniform vec4 fog_color : source_color = vec4(0.07, 0.025, 0.12, 1.0);
uniform float fog_start = 4.0;
uniform float fog_end = 18.0;
uniform float fog_floor = 0.0;
uniform float fog_height = 3.5;
uniform float displacement_strength = 0.08;
uniform float displacement_frequency = 1.2;

varying vec3 world_position;
varying float fog_visibility;

void vertex() {
	vec3 authored_vertex = VERTEX;
	float edge_mask = smoothstep(0.0, 1.0, UV.y);
	authored_vertex.y += sin(authored_vertex.x * displacement_frequency + TIME * 0.45)
		* displacement_strength * edge_mask;
	VERTEX = authored_vertex;

	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float camera_distance = distance(world_position, CAMERA_POSITION_WORLD);
	fog_visibility = 1.0 - smoothstep(fog_start, fog_end, camera_distance);
}

void fragment() {
	float height_visibility = smoothstep(fog_floor, fog_floor + fog_height, world_position.y);
	float visibility = clamp(min(fog_visibility, height_visibility + 0.18), 0.0, 1.0);
	ALBEDO = mix(fog_color.rgb, base_color.rgb, visibility);
	EMISSION = ALBEDO * 0.2;
	ROUGHNESS = 0.92;
}
