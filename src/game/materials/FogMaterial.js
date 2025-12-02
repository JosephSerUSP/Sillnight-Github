
/**
 * Modifies a material to support the Fog of War effect using a texture lookup.
 * @param {THREE.Material} material
 * @param {boolean} [displace=false] - Whether to apply vertical vertex displacement based on fog.
 */
export function modifyMaterialWithFog(material, displace = false) {
    // Ensure transparency is enabled for the fade effect
    material.transparent = true;

    material.onBeforeCompile = (shader) => {
        material.userData.shader = shader;

        // Uniforms
        shader.uniforms.uFogMap = { value: new THREE.Texture() }; // Placeholder
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
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            `
            // Calculate Local Position including Instancing
            vec4 localPosition = vec4( transformed, 1.0 );
            #ifdef USE_INSTANCING
                localPosition = instanceMatrix * localPosition;
            #endif

            // Calculate World Position
            vec4 worldPos = modelMatrix * localPosition;

            // Map World (X, Z) to Texture UV
            // Map (0,0) is Top-Left. Texture (0,0) is Bottom-Left.
            // X maps directly. Z needs inversion relative to map height.
            vFogUV = vec2(
                (worldPos.x + 0.5) / uMapSize.x,
                1.0 - (worldPos.z + 0.5) / uMapSize.y
            );

            ${displace ? `
            // Sample fog texture in vertex shader
            // Note: vFogUV is calculated per vertex here.
            // Texture filtering (Linear) should provide smooth transitions.
            float fogValVS = texture2D(uFogMap, vFogUV).r;

            // Random Vertex Warp - Per Tile Logic
            // Use rounded worldPos to get consistent tile coordinate for all vertices of the block
            // We use the center of the instance/block for noise consistency
            vec2 tilePos = floor(worldPos.xz + 0.5);
            float r = getFogNoise(tilePos);

            // Direction: +1 or -1.
            // step(0.5, r) is 0 or 1. Result is -1 or 1.
            float dir = step(0.5, r) * 2.0 - 1.0;

            // Apply displacement
            // If fogValVS is 1.0 (Visible), displacement is 0.
            // If fogValVS is 0.0 (Hidden), displacement is +/- 1.0.
            worldPos.y += dir * (1.0 - fogValVS);
            ` : ''}

            // Calculate ModelView Position for Projection
            vec4 mvPosition = viewMatrix * worldPos;
            gl_Position = projectionMatrix * mvPosition;
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

            // Sample the fog texture
            float fogVal = texture2D(uFogMap, vFogUV).r;

            // Apply fog to alpha
            gl_FragColor.a *= fogVal;

            // Discard fully invisible fragments to handle depth sorting better?
            // if (fogVal < 0.01) discard;
            `
        );
    };

    return material;
}
