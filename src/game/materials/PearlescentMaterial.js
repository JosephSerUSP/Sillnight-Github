/**
 * Modifies a material to have a pearlescent/iridescent effect using noise and fresnel.
 * @param {THREE.Material} material
 */
export function modifyMaterialPearlescent(material) {
    const baseKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';

    material.customProgramCacheKey = () => {
        return baseKey + '|pearlescent';
    };

    material.onBeforeCompile = (shader) => {
        // preserve existing hooks if any (like fog)
        const oldOnBeforeCompile = material.userData.onBeforeCompileOriginal;
        if(oldOnBeforeCompile) oldOnBeforeCompile(shader);

        material.userData.shader = shader; // Keep reference

        shader.uniforms.uTime = { value: 0 };
        // We might need to update uTime in loop if we want animation,
        // but user asked for "reacting to light", reflections.
        // Fresnel is view dependent, so it reacts to camera movement.

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vViewPosition;
            varying vec3 vNormalVar;
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vNormalVar = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
            vViewPosition = - mvPosition.xyz;
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vViewPosition;
            varying vec3 vNormalVar;

            // Simple pseudo-random noise
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // Value noise for smoother look
            float smoothNoise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>

            // Pearlescent Logic
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormalVar);

            // Fresnel effect
            float fresnel = dot(viewDir, normal);
            fresnel = clamp(1.0 - fresnel, 0.0, 1.0);

            // Iridescence color ramp
            // Shift hue based on fresnel and some noise
            float n = smoothNoise(gl_FragCoord.xy * 0.05); // Screen space noise or world space?
            // Using vFogUV would be better if available, but it's from FogMaterial.
            // Let's use simple coordinate based noise or just fresnel.

            // Spectral colors approximation
            vec3 c1 = vec3(1.0, 0.8, 0.8); // Pinkish
            vec3 c2 = vec3(0.8, 1.0, 0.9); // Mint
            vec3 c3 = vec3(0.8, 0.9, 1.0); // Blueish
            vec3 c4 = vec3(1.0, 1.0, 0.8); // Gold

            vec3 irid = mix(c1, c2, fresnel);
            irid = mix(irid, c3, sin(fresnel * 3.14 + n));
            irid = mix(irid, c4, cos(fresnel * 6.28));

            // Blend with base color (incoming gl_FragColor)
            // Soft Light blend or Screen
            gl_FragColor.rgb = mix(gl_FragColor.rgb, irid, 0.3 * fresnel + 0.1);

            // Add a specular-like shine based on noise
            float sparkle = smoothstep(0.7, 1.0, n) * fresnel;
            gl_FragColor.rgb += vec3(sparkle * 0.2);
            `
        );
    };
}
