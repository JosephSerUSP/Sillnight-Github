
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
                #if __VERSION__ >= 300
                    return textureLod(map, uv, 0.0).r;
                #elif defined(GL_EXT_shader_texture_lod)
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

            // Re-calculate World Position for Fog UVs (Logic Check)
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
            // Store offset data for project_vertex
            float fogValVS = getFogValVS(uFogMap, vFogUV);

            // Random Vertex Warp - Per Tile Logic
            vec2 tilePos = floor(fogWorldPos.xz + 0.5);
            float r = getFogNoise(tilePos);
            float dir = step(0.5, r) * 2.0 - 1.0;
            float fogOffset = dir * (1.0 - fogValVS);
            ` : ''}
            `
        );

        if (displace) {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `
                // Standard project_vertex logic first (calculate mvPosition)
                vec4 mvPosition = viewMatrix * modelMatrix * vec4( transformed, 1.0 );
                #ifdef USE_INSTANCING
                    mvPosition = viewMatrix * instanceMatrix * vec4( transformed, 1.0 );
                #endif

                // Apply View-Space Offset derived from World-Space Up (0, offset, 0)
                // This matches the "Older Approach" logic exactly:
                // mvPosition.xyz += (viewMatrix * vec4(0.0, offset, 0.0, 0.0)).xyz;

                mvPosition.xyz += (viewMatrix * vec4(0.0, fogOffset, 0.0, 0.0)).xyz;

                gl_Position = projectionMatrix * mvPosition;
                `
            );
        }

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
