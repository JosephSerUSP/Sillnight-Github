
// Custom shaders for screen transitions (Swirl, Cut-in, Wipe)
// These materials are intended for use on a full-screen quad (PlaneBufferGeometry).

export const TransitionMaterials = {
    /**
     * Swirl shader for Battle Start (FF style).
     * Distorts the texture radially based on distance from center.
     */
    Swirl: {
        uniforms: {
            tDiffuse: { value: null },
            uProgress: { value: 0.0 }, // 0.0 to 1.0
            uAspectRatio: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uProgress;
            uniform float uAspectRatio;
            varying vec2 vUv;

            void main() {
                // Center UVs
                vec2 uv = vUv - 0.5;

                // Correct for aspect ratio to make the swirl circular
                uv.x *= uAspectRatio;

                // Calculate distance and angle
                float len = length(uv);
                float angle = atan(uv.y, uv.x);

                // Swirl effect: Rotate more as we get closer to the center?
                // FF swirl usually rotates the whole screen.
                // Let's rotate based on distance * progress.
                float swirlAmt = uProgress * 20.0 * (1.0 - len);

                float s = sin(angle + swirlAmt);
                float c = cos(angle + swirlAmt);

                // Reconstruct UV
                vec2 newUv = vec2(c * len, s * len);

                // Undo aspect ratio
                newUv.x /= uAspectRatio;
                newUv += 0.5;

                vec4 color = texture2D(tDiffuse, newUv);

                // Fade to black
                float fade = smoothstep(0.5, 1.0, uProgress);
                gl_FragColor = mix(color, vec4(0.0, 0.0, 0.0, 1.0), uProgress);
            }
        `
    },

    /**
     * Horizontal Cut In shader for Battle Intro.
     * Starts black, opens up horizontally from the center.
     */
    CutIn: {
        uniforms: {
            uProgress: { value: 0.0 }, // 0.0 (Black) -> 1.0 (Fully Open)
            uColor: { value: new THREE.Color(0x000000) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uProgress;
            uniform vec3 uColor;
            varying vec2 vUv;

            void main() {
                float center = 0.5;
                float halfHeight = uProgress * 0.5; // Expand from 0 to 0.5

                // Distance from horizontal center line
                float dist = abs(vUv.y - center);

                // If within the "open" area, be transparent (show scene)
                // Otherwise show black overlay

                // Add a smooth edge
                float alpha = 1.0 - smoothstep(halfHeight - 0.05, halfHeight, dist);

                // If alpha is 0 (transparent), we want the scene.
                // If alpha is 1 (opaque), we want black.
                // Since this renders ON TOP, we set gl_FragColor to black with alpha.

                // Inverted logic: We want to draw BLACK where dist > halfHeight
                float overlayAlpha = smoothstep(halfHeight, halfHeight + 0.02, dist);

                gl_FragColor = vec4(uColor, overlayAlpha);
            }
        `
    },

    /**
     * Diagonal Distort Wipe for Map Transfer.
     * Uses noise/sine waves to distort the image while wiping.
     */
    DistortWipe: {
        uniforms: {
            tDiffuse: { value: null },
            uProgress: { value: 0.0 }, // 0.0 (Clear) -> 1.0 (Black)
            uDirection: { value: 1.0 }, // 1.0 (Out), -1.0 (In)
            uTime: { value: 0.0 },
            uAspectRatio: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uProgress;
            uniform float uTime;
            uniform float uDirection; // Not strictly used if logic is handled by uProgress
            varying vec2 vUv;

            // Simple pseudo-noise
            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {
                vec2 uv = vUv;

                // Diagonal gradient: x + y
                float diag = uv.x + uv.y; // Range 0.0 to 2.0

                // Calculate Wipe Edge
                // uProgress 0 -> 1.
                // We want the edge to move from -0.5 to 2.5 to cover everything
                float edge = uProgress * 3.0 - 0.5;

                // Distortion amount based on distance to edge
                float distToEdge = abs(diag - edge);
                float distort = smoothstep(0.5, 0.0, distToEdge) * 0.1; // Maximum distortion at edge

                // Apply sine wave distortion
                uv.x += sin(uv.y * 20.0 + uTime * 5.0) * distort;
                uv.y += cos(uv.x * 20.0 + uTime * 5.0) * distort;

                vec4 color = texture2D(tDiffuse, uv);

                // Masking/Fading
                // If uProgress goes 0->1 (Fade Out): Darken area where diag < edge?
                // Actually, let's say "Wipe Out" means black covers screen.
                // Let's implement a wipe that turns pixels black.

                // Smoothstep for the black overlay
                float darkness = smoothstep(edge - 0.2, edge + 0.2, diag);

                // If uDirection is Out (Normal), we want 0 -> 1 to become black.
                // If we want "Diagonal Swipe fades screen out":
                // Start: Full Image. End: Full Black.
                // Swipe moves from Top-Right? or Top-Left?
                // x+y is Bottom-Left (0) to Top-Right (2).
                // If edge increases, blackness (0->1) moves from BL to TR.

                // Let's assume uProgress defines the "Blackness" level.
                // We want to mix texture color with black.

                // Distortion color fetch (clamp to avoid wrapping artifacts?)
                // Actually, better to just discard or clamp.
                if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    color = vec4(0.0, 0.0, 0.0, 1.0);
                }

                // Final mix
                // We want to draw the distorted image, but masked by the wipe.
                // The wipe is "Black Overlay".

                // Invert darkness logic for "Wipe In" vs "Wipe Out"?
                // Let the Manager handle uProgress direction.
                // 0.0 = Image Visible. 1.0 = Image Black.

                // If uProgress = 0, edge = -0.5. diag (0..2) > edge. darkness = 1.0.
                // Wait. smoothstep(low, high, val). if val > high -> 1.
                // If diag > edge, darkness is 1.
                // We want Black when darkness is 1? Or 0?

                // Let's say we want to Wipe TO Black (0 -> 1).
                // The black wave comes from Top-Right (2.0) down to (0.0)? Or vice versa.
                // Let's move from Top-Left (0.0) to Bottom-Right (2.0).

                // edge moves -0.5 -> 2.5.
                // We want pixels < edge to be black.
                float blackAmt = 1.0 - smoothstep(edge - 0.2, edge + 0.2, diag);

                gl_FragColor = mix(color, vec4(0.0, 0.0, 0.0, 1.0), blackAmt);
            }
        `
    }
};
