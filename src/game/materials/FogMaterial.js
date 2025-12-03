
/**
 * Modifies a material to support the Fog of War effect using a texture lookup.
 * @param {THREE.Material} material
 * @param {boolean} [displace=false] - Whether to apply vertical vertex displacement based on fog.
 */
export function modifyMaterialWithFog(material, displace = false) {
    // Ensure transparency is enabled for the fade effect
    material.transparent = true;

    // Enable texture LOD extension for Vertex Shader texture reading (if needed)
    if (displace) {
        material.extensions = material.extensions || {};
        material.extensions.shaderTextureLOD = true;
    }

    material.onBeforeCompile = (shader) => {
        material.userData.shader = shader;

        // Uniforms
        shader.uniforms.uFogMap = { value: new THREE.Texture() };
        shader.uniforms.uMapSize = { value: new THREE.Vector2(1, 1) };

        // --- Vertex Shader Modification ---

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec2 vFogUV;
            uniform vec2 uMapSize;
            ${displace ? 'uniform sampler2D uFogMap;' : ''}

            float getFogNoise(vec2 co){
                return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
            }

            float getFogValVS(sampler2D map, vec2 uv) {
                #ifdef GL_EXT_shader_texture_lod
                    return texture2DLodEXT(map, uv, 0.0).r;
                #else
                    // Fallback for environments where texture2D in VS is supported implicitly (e.g. WebGL 2 or some WebGL 1 implementations)
                    return texture2D(map, uv).r;
                #endif
            }
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>

            // Re-calculate World Position for Fog UVs
            vec4 fogWorldPos = modelMatrix * vec4(transformed, 1.0);
            #ifdef USE_INSTANCING
                fogWorldPos = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            #endif

            // Calculate UV
            vFogUV = vec2(
                (fogWorldPos.x + 0.5) / uMapSize.x,
                1.0 - (fogWorldPos.z + 0.5) / uMapSize.y
            );

            ${displace ? `
            // Apply Displacement
            float fogValVS = getFogValVS(uFogMap, vFogUV);

            // Random Vertex Warp - Per Tile Logic
            vec2 tilePos = floor(fogWorldPos.xz + 0.5);
            float r = getFogNoise(tilePos);
            float dir = step(0.5, r) * 2.0 - 1.0;

            // Apply displacement to local 'transformed'
            // 1.0 (Visible) -> 0 displacement
            // 0.0 (Hidden) -> Full displacement
            transformed.y += dir * (1.0 - fogValVS);
            ` : ''}
            `
        );

        // --- Fragment Shader Modification ---
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec2 vFogUV;
            uniform sampler2D uFogMap;
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>

            float fogVal = texture2D(uFogMap, vFogUV).r;
            gl_FragColor.a *= fogVal;
            `
        );
    };

    return material;
}
